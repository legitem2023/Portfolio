// components/PreciseImageColorSeparator.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import NextImage from 'next/image';

interface ColorLayer {
  color: string;
  rgb: { r: number; g: number; b: number };
  imageData: ImageData | null;
  percentage: number;
  pixelCount: number;
  isDominant: boolean;
  index: number;
}

interface ColorCluster {
  r: number;
  g: number;
  b: number;
  count: number;
  hex: string;
  percentage: number;
}

export default function PreciseImageColorSeparator() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [dominantLayers, setDominantLayers] = useState<ColorLayer[]>([]);
  const [allColorLayers, setAllColorLayers] = useState<ColorLayer[]>([]);
  const [allColors, setAllColors] = useState<ColorCluster[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoColorCount, setAutoColorCount] = useState<number>(0);
  const [manualColorCount, setManualColorCount] = useState<number>(8);
  const [similarityThreshold, setSimilarityThreshold] = useState(30);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [useAutoDetect, setUseAutoDetect] = useState(true);
  const [showAllColors, setShowAllColors] = useState(false);
  const [minPercentage, setMinPercentage] = useState(0.1);
  const [selectedColorForLayer, setSelectedColorForLayer] = useState<ColorCluster | null>(null);
  const [compositeImage, setCompositeImage] = useState<string | null>(null);
  
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
      
      const img = new window.Image();
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

    canvas.width = img.width;
    canvas.height = img.height;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, img.width, img.height);
    
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const pixels = imageData.data;
    
    // Collect all colors with minimal quantization
    const colorMap = new Map<string, { count: number; r: number; g: number; b: number }>();
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      
      if (a < 10) continue;
      
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

    const colorsArray = Array.from(colorMap.entries())
      .map(([key, value]) => ({
        key,
        ...value,
        hex: rgbToHex(value.r, value.g, value.b)
      }))
      .sort((a, b) => b.count - a.count);

    const totalPixels = colorsArray.reduce((sum, c) => sum + c.count, 0);
    
    // Calculate percentages for all colors
    const colorsWithPercentage = colorsArray.map(color => ({
      ...color,
      percentage: (color.count / totalPixels) * 100
    }));

    // Merge similar colors
    const mergedColors = mergeSimilarColors(colorsWithPercentage, similarityThreshold);
    
    // Store all colors for display
    setAllColors(mergedColors);
    
    // Create layers for ALL colors
    const allLayers: ColorLayer[] = mergedColors.map((color, index) => {
      const layerImageData = createColorLayer(imageData, color.r, color.g, color.b, similarityThreshold);
      
      return {
        color: color.hex,
        rgb: { r: color.r, g: color.g, b: color.b },
        imageData: layerImageData,
        percentage: color.percentage,
        pixelCount: color.count,
        isDominant: false, // Will be updated after dominant calculation
        index: index
      };
    });

    // AUTO-DETECT optimal number of colors for dominant
    let optimalColorCount: number;
    
    if (useAutoDetect) {
      optimalColorCount = detectOptimalColorCount(mergedColors);
      setAutoColorCount(optimalColorCount);
    } else {
      optimalColorCount = manualColorCount;
    }
    
    // Mark dominant colors
    const updatedAllLayers = allLayers.map((layer, idx) => ({
      ...layer,
      isDominant: idx < optimalColorCount
    }));
    
    // Set dominant layers separately
    const dominant = updatedAllLayers.slice(0, optimalColorCount);
    
    setAllColorLayers(updatedAllLayers);
    setDominantLayers(dominant);
    setIsProcessing(false);
  };

  const detectOptimalColorCount = (colors: ColorCluster[]): number => {
    if (colors.length <= 3) return colors.length;
    
    // Calculate color significance and find natural breaks
    const totalPixels = colors.reduce((sum, c) => sum + c.count, 0);
    const significanceThreshold = 0.01; // 1% minimum significance
    
    // Method 1: Include all colors that represent at least 1% of the image
    const significantColors = colors.filter(c => (c.count / totalPixels) >= significanceThreshold);
    
    if (significantColors.length >= 2 && significantColors.length <= 12) {
      return significantColors.length;
    }
    
    // Method 2: If too many/few significant colors, use elbow method
    const percentages = colors.map(c => c.count / totalPixels);
    let optimalK = 8; // default
    
    // Find elbow point in cumulative percentage
    let cumulativePercentage = 0;
    for (let i = 0; i < colors.length; i++) {
      cumulativePercentage += percentages[i];
      if (cumulativePercentage >= 0.85) { // 85% coverage
        optimalK = Math.max(5, i + 1);
        break;
      }
    }
    
    return Math.min(optimalK, 16); // Cap at 16 colors max
  };

  const mergeSimilarColors = (colors: any[], threshold: number): ColorCluster[] => {
    const merged: ColorCluster[] = [];
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
        percentage: (totalCount / colors.reduce((sum, c) => sum + c.count, 0)) * 100
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
    
    const layerData = new ImageData(width, height);
    const layerPixels = layerData.data;
    
    for (let i = 0; i < sourcePixels.length; i += 4) {
      const r = sourcePixels[i];
      const g = sourcePixels[i + 1];
      const b = sourcePixels[i + 2];
      const a = sourcePixels[i + 3];
      
      const colorDist = Math.sqrt(
        Math.pow(r - targetR, 2) +
        Math.pow(g - targetG, 2) +
        Math.pow(b - targetB, 2)
      );
      
      if (colorDist <= threshold) {
        layerPixels[i] = r;
        layerPixels[i + 1] = g;
        layerPixels[i + 2] = b;
        layerPixels[i + 3] = a;
      } else {
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

  const renderLayerToCanvas = (layer: ColorLayer): string | null => {
    if (!layerCanvasRef.current || !layer.imageData) return null;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = layer.imageData.width;
    tempCanvas.height = layer.imageData.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return null;
    
    tempCtx.putImageData(layer.imageData, 0, 0);
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

  const generateLayerForColor = (color: ColorCluster) => {
    if (!originalImage) return;
    
    setIsProcessing(true);
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = originalImage;
    
    img.onload = () => {
      const canvas = originalCanvasRef.current;
      if (!canvas) return;
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      
      ctx.drawImage(img, 0, 0, img.width, img.height);
      
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      
      const layerImageData = createColorLayer(
        imageData, 
        color.r, 
        color.g, 
        color.b, 
        similarityThreshold
      );
      
      const newLayer: ColorLayer = {
        color: color.hex,
        rgb: { r: color.r, g: color.g, b: color.b },
        imageData: layerImageData,
        percentage: color.percentage,
        pixelCount: color.count,
        isDominant: false,
        index: allColorLayers.length
      };
      
      setAllColorLayers(prev => [...prev, newLayer]);
      setSelectedColorForLayer(null);
      setIsProcessing(false);
    };
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const reprocessImage = () => {
    if (originalImage) {
      setIsProcessing(true);
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = originalImage;
      img.onload = () => extractPreciseColors(img);
    }
  };

  useEffect(() => {
    if (originalImage && !isProcessing) {
      reprocessImage();
    }
  }, [useAutoDetect, manualColorCount, similarityThreshold]);

  // Filter colors based on minimum percentage
  const filteredAllColors = allColors.filter(color => color.percentage >= minPercentage);
  
  // Get layers to display based on toggle
  const layersToDisplay = showAllColors ? allColorLayers : dominantLayers;

  // Generate composite image from all displayed layers (with proper alpha blending)
  const generateComposite = useCallback((layers: ColorLayer[]) => {
    if (!layers.length || !layers[0].imageData) {
      setCompositeImage(null);
      return;
    }

    const { width, height } = layers[0].imageData;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas to transparent
    ctx.clearRect(0, 0, width, height);

    // Draw each layer using drawImage (respects alpha channel)
    layers.forEach(layer => {
      if (layer.imageData) {
        // Create a temporary canvas for this layer
        const layerCanvas = document.createElement('canvas');
        layerCanvas.width = width;
        layerCanvas.height = height;
        const layerCtx = layerCanvas.getContext('2d');
        if (layerCtx) {
          layerCtx.putImageData(layer.imageData, 0, 0);
          // Draw onto composite canvas with default source-over blending
          ctx.drawImage(layerCanvas, 0, 0);
        }
      }
    });

    setCompositeImage(canvas.toDataURL());
  }, []);

  useEffect(() => {
    generateComposite(layersToDisplay);
  }, [layersToDisplay, generateComposite]);

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
            onClick={triggerFileInput}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Upload Image'}
          </button>
          
          <div className="flex flex-wrap gap-6 items-center">
            {/* Auto-detect toggle */}
            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useAutoDetect}
                  onChange={(e) => setUseAutoDetect(e.target.checked)}
                  className="sr-only peer"
                  disabled={isProcessing}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">Auto-detect colors</span>
              </label>
            </div>

            {!useAutoDetect && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manual Color Count: {manualColorCount}
                </label>
                <input
                  type="range"
                  min="2"
                  max="24"
                  value={manualColorCount}
                  onChange={(e) => setManualColorCount(parseInt(e.target.value))}
                  className="w-32"
                  disabled={isProcessing}
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Similarity: {similarityThreshold}
              </label>
              <input
                type="range"
                min="5"
                max="100"
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(parseInt(e.target.value))}
                className="w-32"
                disabled={isProcessing}
              />
            </div>
          </div>
        </div>

        {isProcessing && (
          <div className="mt-4 text-center text-gray-600">
            Processing image... This may take a moment for high-resolution images.
          </div>
        )}

        {autoColorCount > 0 && useAutoDetect && !isProcessing && (
          <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-2 rounded">
            Auto-detected {autoColorCount} dominant colors based on image content
          </div>
        )}
      </div>

      {/* Display area */}
      {originalImage && allColorLayers.length > 0 && (
        <div className="space-y-8">
          {/* Original image with dimensions */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">
              Original Image ({originalDimensions.width} x {originalDimensions.height})
            </h3>
            <div className="relative w-full" style={{ maxHeight: '400px' }}>
              <NextImage
                src={originalImage}
                alt="Original uploaded image"
                width={originalDimensions.width}
                height={originalDimensions.height}
                className="object-contain max-h-[400px] w-auto mx-auto"
                unoptimized={true}
              />
            </div>
          </div>

          {/* View Toggle */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {showAllColors ? 'All Color Layers' : 'Dominant Color Layers'} 
                ({layersToDisplay.length} colors)
              </h3>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAllColors(false)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    !showAllColors 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Dominant Colors
                </button>
                <button
                  onClick={() => setShowAllColors(true)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    showAllColors 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All Colors
                </button>
              </div>
            </div>
          </div>

          {/* Color Layers Grid */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {layersToDisplay.map((layer, index) => {
                const layerPreview = renderLayerToCanvas(layer);
                
                return (
                  <div key={layer.index} className={`border rounded-lg overflow-hidden ${
                    layer.isDominant ? 'ring-2 ring-blue-500' : 'opacity-90'
                  }`}>
                    {/* Color header */}
                    <div 
                      className="p-3 text-white font-medium"
                      style={{ backgroundColor: layer.color }}
                    >
                      <div className="flex justify-between items-center">
                        <span>{layer.color}</span>
                        <span className="text-sm bg-black bg-opacity-30 px-2 py-1 rounded">
                          {layer.percentage.toFixed(2)}%
                        </span>
                      </div>
                      <div className="text-xs mt-1 opacity-90">
                        RGB: {layer.rgb.r}, {layer.rgb.g}, {layer.rgb.b}
                      </div>
                      {layer.isDominant && (
                        <div className="text-xs mt-1 bg-blue-600 inline-block px-2 py-0.5 rounded">
                          Dominant
                        </div>
                      )}
                    </div>
                    
                    {/* Layer preview */}
                    <div className="bg-gray-100 p-2">
                      {layerPreview && (
                        <div className="relative" style={{ 
                          aspectRatio: `${layer.imageData?.width} / ${layer.imageData?.height}`,
                          maxHeight: '200px'
                        }}>
                          <NextImage
                            src={layerPreview}
                            alt={`Color layer ${index + 1} - ${layer.color}`}
                            fill
                            className="object-contain border"
                            unoptimized={true}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Layer stats */}
                    <div className="p-3 bg-gray-50">
                      <p className="text-sm text-gray-600 mb-2">
                        Pixels: {layer.pixelCount.toLocaleString()}
                      </p>
                      
                      <button
                        onClick={() => downloadLayer(layer, index)}
                        className="w-full px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                      >
                        Download Layer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All Colors Palette (for reference) */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">
              Complete Color Palette ({filteredAllColors.length} colors)
            </h3>
            
            {/* Color palette with all colors */}
            <div className="mb-4">
              <div className="h-12 flex rounded-lg overflow-hidden">
                {filteredAllColors.map((color, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: color.hex,
                      width: `${color.percentage}%`
                    }}
                    className="h-full transition-all hover:brightness-110 cursor-pointer"
                    title={`${color.hex} - ${color.percentage.toFixed(2)}%`}
                  />
                ))}
              </div>
            </div>

            {/* Color swatches grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 mb-4">
              {filteredAllColors.map((color, index) => {
                const isDominant = index < dominantLayers.length;
                
                return (
                  <div
                    key={index}
                    className={`cursor-pointer transition-all ${
                      isDominant ? 'ring-2 ring-blue-500' : 'opacity-80'
                    }`}
                    onClick={() => setSelectedColorForLayer(color)}
                    title={`${color.hex} - ${color.percentage.toFixed(2)}%${isDominant ? ' (Dominant)' : ' (Click to generate layer)'}`}
                  >
                    <div 
                      className="w-full aspect-square rounded shadow-md"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="mt-1 text-xs text-center font-mono truncate">
                      {color.hex}
                    </div>
                    <div className="text-xs text-center text-gray-600">
                      {color.percentage.toFixed(2)}%
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Color list table */}
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Color</th>
                    <th className="p-2 text-left">Hex</th>
                    <th className="p-2 text-left">RGB</th>
                    <th className="p-2 text-left">Percentage</th>
                    <th className="p-2 text-left">Pixels</th>
                    <th className="p-2 text-left">Type</th>
                    <th className="p-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAllColors.map((color, index) => {
                    const isDominant = index < dominantLayers.length;
                    const hasLayer = allColorLayers.some(l => 
                      l.rgb.r === color.r && 
                      l.rgb.g === color.g && 
                      l.rgb.b === color.b
                    );
                    
                    return (
                      <tr key={index} className={isDominant ? 'bg-blue-50' : ''}>
                        <td className="p-2">{index + 1}</td>
                        <td className="p-2">
                          <div 
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: color.hex }}
                          />
                        </td>
                        <td className="p-2 font-mono">{color.hex}</td>
                        <td className="p-2 font-mono">
                          {color.r}, {color.g}, {color.b}
                        </td>
                        <td className="p-2">{color.percentage.toFixed(2)}%</td>
                        <td className="p-2">{color.count.toLocaleString()}</td>
                        <td className="p-2">
                          {isDominant ? (
                            <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded">
                              Dominant
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded">
                              Non-dominant
                            </span>
                          )}
                        </td>
                        <td className="p-2">
                          {!hasLayer && !isDominant && (
                            <button
                              onClick={() => generateLayerForColor(color)}
                              className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                              disabled={isProcessing}
                            >
                              Generate Layer
                            </button>
                          )}
                          {hasLayer && (
                            <span className="text-xs text-green-600">Layer exists</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary statistics */}
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <h4 className="font-medium mb-2">Color Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Total unique colors:</span>
                  <span className="ml-2 font-medium">{allColors.length}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Colors shown:</span>
                  <span className="ml-2 font-medium">{filteredAllColors.length}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Dominant colors:</span>
                  <span className="ml-2 font-medium">{dominantLayers.length}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Layers generated:</span>
                  <span className="ml-2 font-medium">{allColorLayers.length}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Coverage:</span>
                  <span className="ml-2 font-medium">
                    {filteredAllColors.reduce((sum, c) => sum + c.percentage, 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Composite Image Section - at the bottom */}
          {compositeImage && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4">
                Composite of {showAllColors ? 'All' : 'Dominant'} Layers
              </h3>
              <div className="relative w-full" style={{ maxHeight: '400px' }}>
                <NextImage
                  src={compositeImage}
                  alt="Composite of all color layers"
                  width={originalDimensions.width}
                  height={originalDimensions.height}
                  className="object-contain max-h-[400px] w-auto mx-auto border border-gray-300"
                  unoptimized={true}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2 text-center">
                Layers are overlaid using alpha blending. Order: most dominant first (may affect overlapping areas).
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
      }
