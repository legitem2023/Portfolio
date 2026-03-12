// components/SilkScreenColorSeparator.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import NextImage from 'next/image';

interface ColorInfo {
  color: string;
  rgb: { r: number; g: number; b: number };
  percentage: number;
  pixelCount: number;
  samplePositions: { x: number; y: number }[];
}

export default function SilkScreenColorSeparator() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [colors, setColors] = useState<ColorInfo[]>([]);
  const [selectedColor, setSelectedColor] = useState<ColorInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [similarityThreshold, setSimilarityThreshold] = useState(0);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [totalUniqueColors, setTotalUniqueColors] = useState(0);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setColors([]);
    setSelectedColor(null);
    setProcessedImageUrl(null);

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setOriginalImage(imageUrl);
      
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
      
      img.onload = () => {
        // Limit max dimensions for processing to avoid memory issues
        const maxDimension = 800; // Process at 800px max for memory efficiency
        let width = img.width;
        let height = img.height;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        
        setOriginalDimensions({ width: img.width, height: img.height });
        analyzeColors(img, width, height);
      };
    };
    
    reader.readAsDataURL(file);
  };

  const analyzeColors = (img: HTMLImageElement, processWidth: number, processHeight: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = processWidth;
    canvas.height = processHeight;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Draw resized image for analysis
    ctx.drawImage(img, 0, 0, processWidth, processHeight);
    
    const imageData = ctx.getImageData(0, 0, processWidth, processHeight);
    const pixels = imageData.data;
    
    // Use a more memory-efficient approach: process in chunks
    const colorMap = new Map<string, { 
      count: number; 
      r: number; 
      g: number; 
      b: number;
      firstX: number;
      firstY: number;
    }>();
    
    // Sample positions for preview (store only first occurrence)
    const samplePositions = new Map<string, { x: number; y: number }>();
    
    // Process pixels
    for (let y = 0; y < processHeight; y++) {
      for (let x = 0; x < processWidth; x++) {
        const i = (y * processWidth + x) * 4;
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        
        if (a < 10) continue; // Skip near-transparent
        
        // Use exact RGB as key
        const key = `${r},${g},${b}`;
        
        if (colorMap.has(key)) {
          const existing = colorMap.get(key)!;
          existing.count++;
        } else {
          colorMap.set(key, { 
            count: 1, 
            r, 
            g, 
            b,
            firstX: x,
            firstY: y
          });
          
          // Store sample position for this color
          samplePositions.set(key, { x, y });
        }
      }
    }

    // Convert to array and sort
    const colorsArray = Array.from(colorMap.entries())
      .map(([key, value]) => ({
        key,
        ...value,
        hex: rgbToHex(value.r, value.g, value.b),
        samplePosition: samplePositions.get(key) || { x: 0, y: 0 }
      }))
      .sort((a, b) => b.count - a.count);

    setTotalUniqueColors(colorsArray.length);

    // Apply similarity threshold if needed
    let finalColors = colorsArray;
    if (similarityThreshold > 0) {
      finalColors = mergeSimilarColors(colorsArray, similarityThreshold);
    }

    const totalPixels = colorsArray.reduce((sum, c) => sum + c.count, 0);
    
    // Create color info without storing full ImageData
    const colorInfo: ColorInfo[] = finalColors.map(color => ({
      color: color.hex,
      rgb: { r: color.r, g: color.g, b: color.b },
      percentage: (color.count / totalPixels) * 100,
      pixelCount: color.count,
      samplePositions: [color.samplePosition]
    }));

    setColors(colorInfo);
    setIsProcessing(false);
  };

  const mergeSimilarColors = (colors: any[], threshold: number) => {
    const merged: any[] = [];
    const used = new Set();

    for (let i = 0; i < colors.length; i++) {
      if (used.has(i)) continue;
      
      let totalCount = colors[i].count;
      let totalR = colors[i].r * colors[i].count;
      let totalG = colors[i].g * colors[i].count;
      let totalB = colors[i].b * colors[i].count;
      const similarIndices = [i];

      for (let j = i + 1; j < colors.length; j++) {
        if (used.has(j)) continue;
        
        const colorDist = Math.sqrt(
          Math.pow(colors[i].r - colors[j].r, 2) +
          Math.pow(colors[i].g - colors[j].g, 2) +
          Math.pow(colors[i].b - colors[j].b, 2)
        );

        if (colorDist < threshold) {
          totalCount += colors[j].count;
          totalR += colors[j].r * colors[j].count;
          totalG += colors[j].g * colors[j].count;
          totalB += colors[j].b * colors[j].count;
          similarIndices.push(j);
          used.add(j);
        }
      }

      const avgR = Math.round(totalR / totalCount);
      const avgG = Math.round(totalG / totalCount);
      const avgB = Math.round(totalB / totalCount);

      merged.push({
        r: avgR,
        g: avgG,
        b: avgB,
        count: totalCount,
        hex: rgbToHex(avgR, avgG, avgB),
        samplePosition: colors[i].samplePosition
      });
    }

    return merged.sort((a, b) => b.count - a.count);
  };

  const generateColorPreview = useCallback((color: ColorInfo) => {
    const canvas = processedCanvasRef.current;
    if (!canvas || !originalImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the original image
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = originalImage;
    
    img.onload = () => {
      // Set canvas to original dimensions
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image
      ctx.drawImage(img, 0, 0, img.width, img.height);
      
      // Get pixel data
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const pixels = imageData.data;
      
      // Create mask - keep only selected color
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        // Check if pixel matches selected color (within threshold)
        const colorDist = Math.sqrt(
          Math.pow(r - color.rgb.r, 2) +
          Math.pow(g - color.rgb.g, 2) +
          Math.pow(b - color.rgb.b, 2)
        );
        
        if (colorDist > (similarityThreshold || 0)) {
          // Make non-matching pixels transparent
          pixels[i + 3] = 0;
        }
      }
      
      // Put modified image data back
      ctx.putImageData(imageData, 0, 0);
      
      // Convert to data URL
      const previewUrl = canvas.toDataURL('image/png');
      setProcessedImageUrl(previewUrl);
    };
  }, [originalImage, similarityThreshold]);

  const downloadColorLayer = (color: ColorInfo) => {
    if (!originalImage) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = originalImage;
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0, img.width, img.height);
      
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const pixels = imageData.data;
      
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        const colorDist = Math.sqrt(
          Math.pow(r - color.rgb.r, 2) +
          Math.pow(g - color.rgb.g, 2) +
          Math.pow(b - color.rgb.b, 2)
        );
        
        if (colorDist > (similarityThreshold || 0)) {
          pixels[i + 3] = 0;
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      const link = document.createElement('a');
      link.download = `silk-screen-${color.color}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleColorSelect = (color: ColorInfo) => {
    setSelectedColor(color);
    generateColorPreview(color);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      {/* Hidden canvases */}
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={processedCanvasRef} className="hidden" />
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Silk Screen Color Separator</h1>
        <p className="text-gray-600">Memory-optimized for high-resolution images</p>
      </div>

      {/* Controls */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <button
            onClick={triggerFileInput}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Upload Image'}
          </button>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Similarity Threshold:</span>
              <input
                type="range"
                min="0"
                max="50"
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(parseInt(e.target.value))}
                className="w-32"
                disabled={isProcessing}
              />
              <span className="text-sm text-gray-600 w-8">{similarityThreshold}</span>
            </label>
          </div>
        </div>

        {isProcessing && (
          <div className="mt-4 text-center text-gray-600">
            Analyzing image (optimized for memory)... Please wait.
          </div>
        )}

        {totalUniqueColors > 0 && !isProcessing && (
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <p className="text-sm">
              <span className="font-bold">{totalUniqueColors}</span> unique colors detected
              {similarityThreshold > 0 && ` → merged to ${colors.length} layers`}
            </p>
          </div>
        )}
      </div>

      {/* Main content */}
      {originalImage && colors.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Color list */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Color Layers ({colors.length})</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {colors.map((color, index) => (
                <button
                  key={index}
                  onClick={() => handleColorSelect(color)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedColor?.color === color.color
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded shadow"
                      style={{ backgroundColor: color.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm">{color.color}</div>
                      <div className="text-xs text-gray-500">
                        RGB: {color.rgb.r}, {color.rgb.g}, {color.rgb.b}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{color.percentage.toFixed(2)}%</div>
                      <div className="text-xs text-gray-500">{color.pixelCount.toLocaleString()} px</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Selected color preview */}
            {selectedColor && processedImageUrl && (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Layer Preview: {selectedColor.color}</h3>
                  <button
                    onClick={() => downloadColorLayer(selectedColor)}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                  >
                    Download Layer
                  </button>
                </div>
                <div className="relative w-full" style={{ maxHeight: '400px' }}>
                  <NextImage
                    src={processedImageUrl}
                    alt={`Color layer ${selectedColor.color}`}
                    width={originalDimensions.width}
                    height={originalDimensions.height}
                    className="object-contain max-h-[400px] w-auto mx-auto"
                    unoptimized={true}
                  />
                </div>
              </div>
            )}

            {/* Color distribution table */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4">Ink Mixing Guide</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Color</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">RGB</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Coverage</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Pixels</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {colors.map((color, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: color.color }} />
                            <span className="font-mono text-sm">{color.color}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm">{color.rgb.r}, {color.rgb.g}, {color.rgb.b}</td>
                        <td className="px-4 py-2 text-sm font-medium">{color.percentage.toFixed(2)}%</td>
                        <td className="px-4 py-2 text-sm">{color.pixelCount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!originalImage && !isProcessing && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-gray-400 mb-4">
            <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Upload Image for Screen Printing</h2>
          <p className="text-gray-500 mb-4">Memory-optimized for large images</p>
          <button
            onClick={triggerFileInput}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Select Image
          </button>
        </div>
      )}
    </div>
  );
    }
