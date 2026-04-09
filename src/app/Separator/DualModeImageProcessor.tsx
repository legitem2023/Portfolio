'use client';

import { useState, useRef } from 'react';

type ProcessingMode = 'reduce-colors' | 'clean-edges-only';

export default class ColorProcessor {
  private ctx: CanvasRenderingContext2D | null = null;
  private pixels: Uint8ClampedArray | null = null;
  private width: number = 0;
  private height: number = 0;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    const imageData = ctx.getImageData(0, 0, width, height);
    this.pixels = imageData.data;
  }

  // Helper to get pixel color
  getPixelColor(x: number, y: number): { r: number; g: number; b: number; a: number } | null {
    if (!this.pixels || x < 0 || y < 0 || x >= this.width || y >= this.height) return null;
    const idx = (y * this.width + x) * 4;
    return {
      r: this.pixels[idx],
      g: this.pixels[idx + 1],
      b: this.pixels[idx + 2],
      a: this.pixels[idx + 3]
    };
  }

  // Set pixel color
  setPixelColor(x: number, y: number, r: number, g: number, b: number, a: number = 255) {
    if (!this.pixels || x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const idx = (y * this.width + x) * 4;
    this.pixels[idx] = r;
    this.pixels[idx + 1] = g;
    this.pixels[idx + 2] = b;
    this.pixels[idx + 3] = a;
  }

  // Apply changes back to canvas
  apply() {
    if (!this.ctx || !this.pixels) return;
    const imageData = new ImageData(this.pixels, this.width, this.height);
    this.ctx.putImageData(imageData, 0, 0);
  }

  // MODE 1: Reduce colors using Median Cut algorithm
  reduceColors(targetColors: number, dithering: boolean = false) {
    if (!this.pixels) return;

    // Collect all unique colors
    const colorMap = new Map<string, number>();
    for (let i = 0; i < this.pixels.length; i += 4) {
      const r = this.pixels[i];
      const g = this.pixels[i + 1];
      const b = this.pixels[i + 2];
      const a = this.pixels[i + 3];
      if (a < 10) continue;
      
      const key = `${r},${g},${b}`;
      colorMap.set(key, (colorMap.get(key) || 0) + 1);
    }

    // Median Cut to find palette
    const colorArray: number[][] = [];
    for (const [color, count] of colorMap.entries()) {
      const [r, g, b] = color.split(',').map(Number);
      const weight = Math.min(Math.floor(count / 100), 100);
      for (let i = 0; i < weight; i++) {
        colorArray.push([r, g, b]);
      }
    }

    const palette = this.medianCut(colorArray, 0, Math.ceil(Math.log2(targetColors)));
    console.log(`Reduced ${colorMap.size} colors to ${palette.length} colors`);

    // Apply palette to all pixels
    for (let i = 0; i < this.pixels.length; i += 4) {
      const r = this.pixels[i];
      const g = this.pixels[i + 1];
      const b = this.pixels[i + 2];
      const a = this.pixels[i + 3];
      if (a < 10) continue;

      const closest = this.findClosestColor([r, g, b], palette);
      this.pixels[i] = closest[0];
      this.pixels[i + 1] = closest[1];
      this.pixels[i + 2] = closest[2];
    }

    // Optional dithering
    if (dithering) {
      this.applyFloydSteinberg(palette);
    }
  }

  // MODE 2: Clean only anti-aliased edges (preserve all original colors)
  cleanEdgesOnly(tolerance: number = 30) {
    if (!this.pixels) return;

    // First, detect all original colors
    const originalColors = new Map<string, number>();
    for (let i = 0; i < this.pixels.length; i += 4) {
      const r = this.pixels[i];
      const g = this.pixels[i + 1];
      const b = this.pixels[i + 2];
      const a = this.pixels[i + 3];
      if (a < 10) continue;
      
      const key = `${r},${g},${b}`;
      originalColors.set(key, (originalColors.get(key) || 0) + 1);
    }

    // Filter to get main colors (appear in at least 0.5% of pixels)
    const totalPixels = this.pixels.length / 4;
    const minPixelCount = totalPixels * 0.005;
    const mainColors = Array.from(originalColors.entries())
      .filter(([, count]) => count > minPixelCount)
      .map(([color]) => color.split(',').map(Number));

    console.log(`Found ${mainColors.length} main colors out of ${originalColors.size} total`);

    // Create a working copy for neighbor analysis
    const originalPixels = new Uint8ClampedArray(this.pixels);

    // Scan each pixel and clean transitions
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = (y * this.width + x) * 4;
        const r = originalPixels[idx];
        const g = originalPixels[idx + 1];
        const b = originalPixels[idx + 2];
        const a = originalPixels[idx + 3];
        
        if (a < 10) continue;

        // Check if this pixel is a transition pixel
        const neighbors = this.getNeighborColors(x, y, originalPixels);
        if (neighbors.length === 0) continue;

        // Find the most common color among neighbors
        const neighborColorCounts = new Map<string, number>();
        neighbors.forEach(neighbor => {
          const key = `${neighbor.r},${neighbor.g},${neighbor.b}`;
          neighborColorCounts.set(key, (neighborColorCounts.get(key) || 0) + 1);
        });

        const mostCommonNeighbor = Array.from(neighborColorCounts.entries())
          .sort((a, b) => b[1] - a[1])[0];
        
        if (!mostCommonNeighbor) continue;
        
        const [mostCommonR, mostCommonG, mostCommonB] = mostCommonNeighbor[0].split(',').map(Number);
        
        // Calculate distance to most common neighbor
        const distance = Math.sqrt(
          Math.pow(r - mostCommonR, 2) +
          Math.pow(g - mostCommonG, 2) +
          Math.pow(b - mostCommonB, 2)
        );
        
        // If pixel is significantly different from its neighbors, it's a transition pixel
        if (distance > tolerance) {
          // Find which main color this transition pixel belongs to
          const closestMainColor = this.findClosestColor([r, g, b], mainColors);
          
          // Only replace if the closest main color matches the most common neighbor
          // This prevents changing actual detail, only transitions
          const neighborDistance = Math.sqrt(
            Math.pow(mostCommonR - closestMainColor[0], 2) +
            Math.pow(mostCommonG - closestMainColor[1], 2) +
            Math.pow(mostCommonB - closestMainColor[2], 2)
          );
          
          if (neighborDistance < tolerance) {
            this.pixels[idx] = closestMainColor[0];
            this.pixels[idx + 1] = closestMainColor[1];
            this.pixels[idx + 2] = closestMainColor[2];
          }
        }
      }
    }
  }

  // Median Cut implementation
  private medianCut(colors: number[][], depth: number, targetDepth: number): number[][] {
    if (depth === targetDepth || colors.length === 0) {
      if (colors.length === 0) return [[0, 0, 0]];
      const avg = colors.reduce((acc, color) => {
        acc[0] += color[0];
        acc[1] += color[1];
        acc[2] += color[2];
        return acc;
      }, [0, 0, 0]);
      return [[
        Math.round(avg[0] / colors.length),
        Math.round(avg[1] / colors.length),
        Math.round(avg[2] / colors.length)
      ]];
    }
    
    let maxRange = -1;
    let channel = 0;
    
    for (let c = 0; c < 3; c++) {
      const min = Math.min(...colors.map(color => color[c]));
      const max = Math.max(...colors.map(color => color[c]));
      const range = max - min;
      if (range > maxRange) {
        maxRange = range;
        channel = c;
      }
    }
    
    colors.sort((a, b) => a[channel] - b[channel]);
    const medianIndex = Math.floor(colors.length / 2);
    
    return [
      ...this.medianCut(colors.slice(0, medianIndex), depth + 1, targetDepth),
      ...this.medianCut(colors.slice(medianIndex), depth + 1, targetDepth)
    ];
  }

  // Floyd-Steinberg dithering
  private applyFloydSteinberg(palette: number[][]) {
    if (!this.pixels) return;
    
    const width = this.width;
    const height = this.height;
    const pixels = this.pixels;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const oldR = pixels[idx];
        const oldG = pixels[idx + 1];
        const oldB = pixels[idx + 2];
        
        const newColor = this.findClosestColor([oldR, oldG, oldB], palette);
        pixels[idx] = newColor[0];
        pixels[idx + 1] = newColor[1];
        pixels[idx + 2] = newColor[2];
        
        const errorR = oldR - newColor[0];
        const errorG = oldG - newColor[1];
        const errorB = oldB - newColor[2];
        
        // Distribute error to neighbors
        if (x + 1 < width) {
          const rightIdx = idx + 4;
          pixels[rightIdx] = Math.min(255, Math.max(0, pixels[rightIdx] + errorR * 7 / 16));
          pixels[rightIdx + 1] = Math.min(255, Math.max(0, pixels[rightIdx + 1] + errorG * 7 / 16));
          pixels[rightIdx + 2] = Math.min(255, Math.max(0, pixels[rightIdx + 2] + errorB * 7 / 16));
        }
        
        if (y + 1 < height) {
          if (x > 0) {
            const bottomLeftIdx = ((y + 1) * width + (x - 1)) * 4;
            pixels[bottomLeftIdx] = Math.min(255, Math.max(0, pixels[bottomLeftIdx] + errorR * 3 / 16));
            pixels[bottomLeftIdx + 1] = Math.min(255, Math.max(0, pixels[bottomLeftIdx + 1] + errorG * 3 / 16));
            pixels[bottomLeftIdx + 2] = Math.min(255, Math.max(0, pixels[bottomLeftIdx + 2] + errorB * 3 / 16));
          }
          
          const bottomIdx = ((y + 1) * width + x) * 4;
          pixels[bottomIdx] = Math.min(255, Math.max(0, pixels[bottomIdx] + errorR * 5 / 16));
          pixels[bottomIdx + 1] = Math.min(255, Math.max(0, pixels[bottomIdx + 1] + errorG * 5 / 16));
          pixels[bottomIdx + 2] = Math.min(255, Math.max(0, pixels[bottomIdx + 2] + errorB * 5 / 16));
          
          if (x + 1 < width) {
            const bottomRightIdx = ((y + 1) * width + (x + 1)) * 4;
            pixels[bottomRightIdx] = Math.min(255, Math.max(0, pixels[bottomRightIdx] + errorR * 1 / 16));
            pixels[bottomRightIdx + 1] = Math.min(255, Math.max(0, pixels[bottomRightIdx + 1] + errorG * 1 / 16));
            pixels[bottomRightIdx + 2] = Math.min(255, Math.max(0, pixels[bottomRightIdx + 2] + errorB * 1 / 16));
          }
        }
      }
    }
  }

  private getNeighborColors(x: number, y: number, pixels: Uint8ClampedArray) {
    const neighbors = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
          const idx = (ny * this.width + nx) * 4;
          if (pixels[idx + 3] > 10) {
            neighbors.push({
              r: pixels[idx],
              g: pixels[idx + 1],
              b: pixels[idx + 2]
            });
          }
        }
      }
    }
    return neighbors;
  }

  private findClosestColor(color: number[], palette: number[][]): number[] {
    let closest = palette[0];
    let minDistance = Infinity;
    
    for (const paletteColor of palette) {
      const dr = color[0] - paletteColor[0];
      const dg = color[1] - paletteColor[1];
      const db = color[2] - paletteColor[2];
      const distance = dr * dr + dg * dg + db * db;
      
      if (distance < minDistance) {
        minDistance = distance;
        closest = paletteColor;
      }
    }
    
    return closest;
  }
}

// React Component
export function DualModeImageProcessor() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<ProcessingMode>('reduce-colors');
  const [targetColors, setTargetColors] = useState(5);
  const [dithering, setDithering] = useState(false);
  const [tolerance, setTolerance] = useState(30);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setOriginalImage(event.target?.result as string);
        setProcessedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = () => {
    if (!originalImage || !canvasRef.current) return;
    
    setIsProcessing(true);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const processor = new (window as any).ColorProcessor(ctx, img.width, img.height);
      
      if (mode === 'reduce-colors') {
        processor.reduceColors(targetColors, dithering);
      } else {
        processor.cleanEdgesOnly(tolerance);
      }
      
      processor.apply();
      setProcessedImage(canvas.toDataURL('image/png'));
      setIsProcessing(false);
    };
    
    img.src = originalImage;
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Dual-Mode Image Processor</h1>
      
      <div className="mb-6">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          ref={fileInputRef}
          className="mb-4"
        />
      </div>

      {originalImage && (
        <>
          {/* Mode Selection */}
          <div className="mb-6 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-3">Select Processing Mode:</h3>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="reduce-colors"
                  checked={mode === 'reduce-colors'}
                  onChange={(e) => setMode(e.target.value as ProcessingMode)}
                />
                <span>
                  <strong>Reduce Colors</strong>
                  <p className="text-xs text-gray-600">Quantize to solid color blocks (removes anti-aliasing)</p>
                </span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="clean-edges-only"
                  checked={mode === 'clean-edges-only'}
                  onChange={(e) => setMode(e.target.value as ProcessingMode)}
                />
                <span>
                  <strong>Clean Edges Only</strong>
                  <p className="text-xs text-gray-600">Preserve all colors, only remove transition pixels</p>
                </span>
              </label>
            </div>
          </div>

          {/* Mode-specific controls */}
          {mode === 'reduce-colors' && (
            <div className="mb-4 p-4 bg-blue-50 rounded">
              <label className="block text-sm font-medium mb-2">
                Target Colors: {targetColors}
              </label>
              <input
                type="range"
                min="2"
                max="32"
                value={targetColors}
                onChange={(e) => setTargetColors(parseInt(e.target.value))}
                className="w-full"
              />
              
              <label className="flex items-center gap-2 mt-3">
                <input
                  type="checkbox"
                  checked={dithering}
                  onChange={(e) => setDithering(e.target.checked)}
                />
                <span className="text-sm">Enable Dithering (better quality, slower)</span>
              </label>
            </div>
          )}

          {mode === 'clean-edges-only' && (
            <div className="mb-4 p-4 bg-green-50 rounded">
              <label className="block text-sm font-medium mb-2">
                Edge Detection Tolerance: {tolerance}
                <p className="text-xs text-gray-500 mt-1">
                  Lower = only clean very obvious transitions | Higher = more aggressive edge cleaning
                </p>
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={tolerance}
                onChange={(e) => setTolerance(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          <button
            onClick={processImage}
            disabled={isProcessing}
            className="bg-blue-500 text-white px-6 py-2 rounded mb-6 hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isProcessing ? 'Processing...' : 'Process Image'}
          </button>
        </>
      )}

      {/* Image Comparison */}
      <div className="grid grid-cols-2 gap-4">
        {originalImage && (
          <div>
            <h3 className="font-semibold mb-2">Original Image</h3>
            <img src={originalImage} alt="Original" className="border rounded max-w-full" />
            <p className="text-xs text-gray-500 mt-1">
              {mode === 'reduce-colors' ? 'Contains anti-aliased edges' : 'Contains many colors with transitions'}
            </p>
          </div>
        )}
        
        {processedImage && (
          <div>
            <h3 className="font-semibold mb-2">Processed Result</h3>
            <img src={processedImage} alt="Processed" className="border rounded max-w-full" />
            <p className="text-xs text-gray-500 mt-1">
              {mode === 'reduce-colors' 
                ? `Reduced to ${targetColors} solid colors with clean edges` 
                : 'Original colors preserved, transition pixels cleaned'}
            </p>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {processedImage && (
        <div className="mt-6">
          <button
            onClick={() => {
              const link = document.createElement('a');
              link.download = mode === 'reduce-colors' 
                ? `reduced-${targetColors}colors.png` 
                : 'edges-cleaned.png';
              link.href = processedImage;
              link.click();
            }}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Download Result
          </button>
        </div>
      )}

      {/* Explanation */}
      <div className="mt-8 p-4 bg-yellow-50 rounded text-sm">
        <h3 className="font-semibold mb-2">📖 When to use each mode:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Reduce Colors:</strong> When you have a photo or complex image and want to convert it to pixel-art style with solid color blocks</li>
          <li><strong>Clean Edges Only:</strong> When you already have distinct color blocks but the edges between them have anti-aliasing/fading that you want to remove while keeping all original colors</li>
        </ul>
      </div>
    </div>
  );
}

// Make ColorProcessor available globally for the component
if (typeof window !== 'undefined') {
  (window as any).ColorProcessor = ColorProcessor;
}

export default DualModeImageProcessor;
