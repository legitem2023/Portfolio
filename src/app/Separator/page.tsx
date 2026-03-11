// components/PreciseImageColorSeparator.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface ColorLayer {
  color: string;
  rgb: { r: number; g: number; b: number };
  imageData: ImageData | null;
  percentage: number;
  pixelCount: number;
}

export default function PreciseImageColorSeparator() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [colorLayers, setColorLayers] = useState<ColorLayer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [colorCount, setColorCount] = useState(8);
  const [similarityThreshold, setSimilarityThreshold] = useState(30);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const layerCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setOriginalImage(imageUrl);
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
      
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
        extractPreciseColors(img);
      };
    };
    
    reader.readAsDataURL(file);
  };

  const extractPreciseColors = (img: HTMLImageElement) => {
    const canvas = originalCanvasRef.current;
    if (!canvas) return;

    // Set canvas to original image size to preserve details
    canvas.width = img.width;
    canvas.height = img.height;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Draw image at full resolution
    ctx.drawImage(img, 0, 0, img.width, img.height);
    
    // Get full resolution pixel data
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const pixels = imageData.data;
    
    // Perform color analysis with higher precision
    const colorMap = new Map<string, { count: number; r: number; g: number; b: number }>();
    
    // First pass: collect all colors with minimal quantization
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      
      // Skip transparent pixels
      if (a < 10) continue;
      
      // Use smaller quantization for better detail preservation
      const quantized = {
        r: Math.round(r / 5) * 5,
        g: Math.round(g / 5) * 5,
        b: Math.round(b / 5) * 5
      };
      
      const key = `${quantized.r},${quantized.g},${quantized.b}`;
      
      if (colorMap.has(key)) {
        const existing = colorMap.get(key)!;
        existing.count++;
      } else {
        colorMap.set(key, { count: 1, r: quantized.r, g: quantized.g, b: quantized.b });
      }
    }

    // Convert to array and sort by frequency
    const colorsArray = Array.from(colorMap.entries())
      .map(([key, value]) => ({
        key,
        ...value,
        hex: rgbToHex(value.r, value.g, value.b)
      }))
      .sort((a, b) => b.count - a.count);

    // Merge similar colors to reduce noise while preserving distinct colors
    const mergedColors = mergeSimilarColors(colorsArray, similarityThreshold);
    
    // Take top N colors
    const topColors = mergedColors.slice(0, colorCount);
    
    // Calculate total pixels (excluding transparent)
    const totalPixels = colorsArray.reduce((sum, c) => sum + c.count, 0);
    
    // Create layers for each color
    const layers: ColorLayer[] = topColors.map(color => {
      const percentage = (color.count / totalPixels) * 100;
      
      // Create mask for this color
      const layerImageData = createColorLayer(imageData, color.r, color.g, color.b, similarityThreshold);
      
      return {
        color: color.hex,
        rgb: { r: color.r, g: color.g, b: color.b },
        imageData: layerImageData,
        percentage,
        pixelCount: color.count
      };
    });

    setColorLayers(layers);
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

      // Calculate weighted average color
      const avgR = Math.round(totalR / totalCount);
      const avgG = Math.round(totalG / totalCount);
      const avgB = Math.round(totalB / totalCount);

      merged.push({
        r: avgR,
        g: avgG,
        b: avgB,
        count: totalCount,
        hex: rgbToHex(avgR, avgG, avgB)
      });

      similarIndices.forEach(idx => used.add(idx));
    }

    return merged.sort((a, b) => b.count - a.count);
  };

  const createColorLayer = (
    sourceData: ImageData, 
    targetR: number, 
    targetG: number, 
    targetB: number,
    threshold: number
  ): ImageData => {
    const width = sourceData.width;
    const height = sourceData.height;
    const sourcePixels = sourceData.data;
    
    // Create new ImageData for this layer
    const layerData = new ImageData(width, height);
    const layerPixels = layerData.data;
    
    // For each pixel, if it matches the target color (within threshold), keep it, otherwise make it transparent
    for (let i = 0; i < sourcePixels.length; i += 4) {
      const r = sourcePixels[i];
      const g = sourcePixels[i + 1];
      const b = sourcePixels[i + 2];
      const a = sourcePixels[i + 3];
      
      // Calculate color distance
      const colorDist = Math.sqrt(
        Math.pow(r - targetR, 2) +
        Math.pow(g - targetG, 2) +
        Math.pow(b - targetB, 2)
      );
      
      // If color is within threshold, keep original pixel
      if (colorDist <= threshold) {
        layerPixels[i] = r;
        layerPixels[i + 1] = g;
        layerPixels[i + 2] = b;
        layerPixels[i + 3] = a;
      } else {
        // Make transparent
        layerPixels[i + 3] = 0;
      }
    }
    
    return layerData;
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const renderLayerToCanvas = (layer: ColorLayer, index: number) => {
    if (!layerCanvasRef.current || !layer.imageData) return;
    
    const ctx = layerCanvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Create a temporary canvas for this layer
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = layer.imageData.width;
    tempCanvas.height = layer.imageData.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    tempCtx.putImageData(layer.imageData, 0, 0);
    
    // Convert to data URL for display
    return tempCanvas.toDataURL();
  };

  const downloadLayer = (layer: ColorLayer, index: number) => {
    if (!layer.imageData) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = layer.imageData.width;
    canvas.height = layer.imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.putImageData(layer.imageData, 0, 0);
    
    const link = document.createElement('a');
    link.download = `color-layer-${index + 1}-${layer.color}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Hidden canvases */}
      <canvas ref={originalCanvasRef} className="hidden" />
      <canvas ref={layerCanvasRef} className="hidden" />
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Controls */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Upload Image'}
          </button>
          
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color Count: {colorCount}
              </label>
              <input
                type="range"
                min="2"
                max="16"
                value={colorCount}
                onChange={(e) => setColorCount(parseInt(e.target.value))}
                className="w-32"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Similarity Threshold: {similarityThreshold}
              </label>
              <input
                type="range"
                min="5"
                max="100"
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(parseInt(e.target.value))}
                className="w-32"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Display area */}
      {originalImage && colorLayers.length > 0 && (
        <div className="space-y-8">
          {/* Original image with dimensions */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">
              Original Image ({originalDimensions.width} x {originalDimensions.height})
            </h3>
            <div className="relative w-full" style={{ maxHeight: '400px' }}>
              <Image
                src={originalImage}
                alt="Original"
                width={originalDimensions.width}
                height={originalDimensions.height}
                className="object-contain max-h-[400px] w-auto mx-auto"
              />
            </div>
          </div>

          {/* Color layers with full detail */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Separated Color Layers</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {colorLayers.map((layer, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  {/* Color header */}
                  <div 
                    className="p-3 text-white font-medium"
                    style={{ backgroundColor: layer.color }}
                  >
                    <div className="flex justify-between items-center">
                      <span>{layer.color}</span>
                      <span className="text-sm bg-black bg-opacity-30 px-2 py-1 rounded">
                        {layer.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs mt-1 opacity-90">
                      RGB: {layer.rgb.r}, {layer.rgb.g}, {layer.rgb.b}
                    </div>
                  </div>
                  
                  {/* Layer preview */}
                  <div className="bg-gray-100 p-2">
                    {layer.imageData && (
                      <div className="relative" style={{ 
                        aspectRatio: `${layer.imageData.width} / ${layer.imageData.height}`,
                        maxHeight: '200px'
                      }}>
                        <Image
                          src={renderLayerToCanvas(layer, index) || ''}
                          alt={`Color layer ${index + 1}`}
                          fill
                          className="object-contain"
                          unoptimized // Required for canvas data URLs
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Layer stats */}
                  <div className="p-3 bg-gray-50">
                    <p className="text-sm text-gray-600 mb-2">
                      Pixels: {layer.pixelCount.toLocaleString()}
                    </p>
                    
                    {/* Download button */}
                    <button
                      onClick={() => downloadLayer(layer, index)}
                      className="w-full px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                    >
                      Download Layer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Combined view with all layers */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Layer Comparison</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {colorLayers.map((layer, index) => (
                <div
                  key={index}
                  className="aspect-square cursor-pointer border-2 transition-all"
                  style={{ 
                    backgroundColor: layer.color,
                    transform: selectedLayer === index ? 'scale(1.1)' : 'scale(1)',
                    borderColor: selectedLayer === index ? '#000' : 'transparent',
                    boxShadow: selectedLayer === index ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
                  }}
                  onClick={() => setSelectedLayer(index)}
                  title={`${layer.color} - ${layer.percentage.toFixed(1)}%`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
