// components/SilkScreenColorSeparator.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import NextImage from 'next/image';

interface ColorLayer {
  color: string;
  rgb: { r: number; g: number; b: number };
  imageData: ImageData | null;
  percentage: number;
  pixelCount: number;
  position: { x: number; y: number } | null; // For color location preview
}

interface UniqueColor {
  rgb: { r: number; g: number; b: number };
  hex: string;
  count: number;
  percentage: number;
  positions?: { x: number; y: number }[]; // Sample positions
}

export default function SilkScreenColorSeparator() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [colorLayers, setColorLayers] = useState<ColorLayer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [similarityThreshold, setSimilarityThreshold] = useState(5); // Very low threshold to preserve all colors
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [totalUniqueColors, setTotalUniqueColors] = useState(0);
  const [showSimilarColors, setShowSimilarColors] = useState(false);
  const [colorPrecision, setColorPrecision] = useState(1); // 1 = exact colors, higher = merge similar
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const layerCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

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
        extractAllColors(img);
      };
    };
    
    reader.readAsDataURL(file);
  };

  const extractAllColors = (img: HTMLImageElement) => {
    const canvas = originalCanvasRef.current;
    if (!canvas) return;

    canvas.width = img.width;
    canvas.height = img.height;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, img.width, img.height);
    
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const pixels = imageData.data;
    
    // Map to store EXACT colors (no quantization)
    const exactColorMap = new Map<string, { 
      count: number; 
      r: number; 
      g: number; 
      b: number;
      positions: { x: number; y: number }[] // Store sample positions
    }>();
    
    // Sample positions for each color (store up to 5 positions for preview)
    const maxPositionsPerColor = 5;
    
    // First pass: collect ALL unique colors exactly as they appear
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        const i = (y * img.width + x) * 4;
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        
        // Skip fully transparent pixels
        if (a === 0) continue;
        
        // Use exact RGB values as key (no rounding)
        const key = `${r},${g},${b}`;
        
        if (exactColorMap.has(key)) {
          const existing = exactColorMap.get(key)!;
          existing.count++;
          
          // Store a few sample positions for preview
          if (existing.positions.length < maxPositionsPerColor) {
            existing.positions.push({ x, y });
          }
        } else {
          exactColorMap.set(key, { 
            count: 1, 
            r, 
            g, 
            b,
            positions: [{ x, y }]
          });
        }
      }
    }

    // Convert to array and sort by frequency
    const exactColorsArray = Array.from(exactColorMap.entries())
      .map(([key, value]) => ({
        key,
        ...value,
        hex: rgbToHex(value.r, value.g, value.b)
      }))
      .sort((a, b) => b.count - a.count);

    setTotalUniqueColors(exactColorsArray.length);

    // Determine which colors to use based on similarity threshold
    let colorsToUse: typeof exactColorsArray;
    
    if (showSimilarColors && similarityThreshold > 0) {
      // Merge similar colors based on threshold
      colorsToUse = mergeSimilarColorsForSilkScreen(exactColorsArray, similarityThreshold);
    } else {
      // Use ALL exact colors
      colorsToUse = exactColorsArray;
    }

    const totalPixels = exactColorsArray.reduce((sum, c) => sum + c.count, 0);
    
    // Create layers for each color
    const layers: ColorLayer[] = colorsToUse.map(color => {
      const percentage = (color.count / totalPixels) * 100;
      
      // Create mask for this color
      const layerImageData = createPreciseColorLayer(
        imageData, 
        color.r, 
        color.g, 
        color.b, 
        showSimilarColors ? similarityThreshold : 0 // 0 threshold = exact match only
      );
      
      return {
        color: color.hex,
        rgb: { r: color.r, g: color.g, b: color.b },
        imageData: layerImageData,
        percentage,
        pixelCount: color.count,
        position: color.positions && color.positions.length > 0 ? color.positions[0] : null
      };
    });

    setColorLayers(layers);
    setIsProcessing(false);
  };

  const mergeSimilarColorsForSilkScreen = (colors: any[], threshold: number) => {
    // For silk screen, we want to be careful about merging
    // Only merge very similar colors that would be indistinguishable in print
    const merged: any[] = [];
    const used = new Set();

    for (let i = 0; i < colors.length; i++) {
      if (used.has(i)) continue;
      
      let totalCount = colors[i].count;
      let totalR = colors[i].r * colors[i].count;
      let totalG = colors[i].g * colors[i].count;
      let totalB = colors[i].b * colors[i].count;
      const similarIndices = [i];
      const allPositions = [...(colors[i].positions || [])];

      for (let j = i + 1; j < colors.length; j++) {
        if (used.has(j)) continue;
        
        // Calculate color distance in RGB space
        const colorDist = Math.sqrt(
          Math.pow(colors[i].r - colors[j].r, 2) +
          Math.pow(colors[i].g - colors[j].g, 2) +
          Math.pow(colors[i].b - colors[j].b, 2)
        );

        // Only merge if colors are very similar (threshold determines how strict)
        if (colorDist < threshold) {
          totalCount += colors[j].count;
          totalR += colors[j].r * colors[j].count;
          totalG += colors[j].g * colors[j].count;
          totalB += colors[j].b * colors[j].count;
          similarIndices.push(j);
          
          // Collect positions from merged colors
          if (colors[j].positions) {
            allPositions.push(...colors[j].positions);
          }
          
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
        hex: rgbToHex(avgR, avgG, avgB),
        positions: allPositions.slice(0, 5) // Keep some sample positions
      });

      similarIndices.forEach(idx => used.add(idx));
    }

    return merged.sort((a, b) => b.count - a.count);
  };

  const createPreciseColorLayer = (
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
      
      if (threshold === 0) {
        // Exact match only
        if (r === targetR && g === targetG && b === targetB) {
          layerPixels[i] = r;
          layerPixels[i + 1] = g;
          layerPixels[i + 2] = b;
          layerPixels[i + 3] = a;
        } else {
          layerPixels[i + 3] = 0;
        }
      } else {
        // Match within threshold
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
    }
    
    return layerData;
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const renderLayerToCanvas = (layer: ColorLayer, index: number): string | null => {
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
    link.download = `silk-screen-layer-${index + 1}-${layer.color}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const downloadAllLayersAsZip = async () => {
    // This would require JSZip library, but for now we'll download individually
    alert('For multiple layers, download each separately. Consider using JSZip for batch download.');
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getColorPreviewStyle = (layer: ColorLayer) => {
    if (!layer.position) return {};
    return {
      position: 'absolute' as const,
      left: `${(layer.position.x / originalDimensions.width) * 100}%`,
      top: `${(layer.position.y / originalDimensions.height) * 100}%`,
      width: '4px',
      height: '4px',
      backgroundColor: layer.color,
      border: '1px solid white',
      borderRadius: '50%',
      zIndex: 10,
      pointerEvents: 'none' as const
    };
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Hidden canvases */}
      <canvas ref={originalCanvasRef} className="hidden" />
      <canvas ref={layerCanvasRef} className="hidden" />
      <canvas ref={previewCanvasRef} className="hidden" />
      
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
        <p className="text-gray-600">Extract EVERY color for screen printing preparation</p>
      </div>

      {/* Controls */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <button
            onClick={triggerFileInput}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Upload Image for Screen Printing'}
          </button>
          
          <div className="flex flex-wrap gap-6 items-center">
            {/* Similar colors toggle */}
            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSimilarColors}
                  onChange={(e) => setShowSimilarColors(e.target.checked)}
                  className="sr-only peer"
                  disabled={isProcessing}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">Merge similar colors</span>
              </label>
            </div>

            {showSimilarColors && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Similarity Threshold: {similarityThreshold}
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={similarityThreshold}
                  onChange={(e) => setSimilarityThreshold(parseInt(e.target.value))}
                  className="w-32"
                  disabled={isProcessing}
                />
                <p className="text-xs text-gray-500 mt-1">Lower = more precise</p>
              </div>
            )}
          </div>
        </div>

        {isProcessing && (
          <div className="mt-4 text-center text-gray-600">
            Analyzing every pixel for unique colors... This may take a moment for high-resolution images.
          </div>
        )}

        {totalUniqueColors > 0 && !isProcessing && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="text-sm bg-blue-50 p-2 rounded">
              📊 Total unique colors in image: <span className="font-bold">{totalUniqueColors}</span>
            </div>
            <div className="text-sm bg-green-50 p-2 rounded">
              🎨 Separated into <span className="font-bold">{colorLayers.length}</span> color layers for screen printing
            </div>
          </div>
        )}
      </div>

      {/* Display area */}
      {originalImage && colorLayers.length > 0 && (
        <div className="space-y-8">
          {/* Original image with color position markers */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">
              Original Image with Color Sample Points
            </h3>
            <div className="relative w-full" style={{ maxHeight: '400px' }}>
              <NextImage
                src={originalImage}
                alt="Original for screen printing"
                width={originalDimensions.width}
                height={originalDimensions.height}
                className="object-contain max-h-[400px] w-auto mx-auto"
                unoptimized={true}
              />
              {/* Color position markers */}
              {colorLayers.map((layer, index) => (
                <div
                  key={index}
                  style={getColorPreviewStyle(layer)}
                  title={`${layer.color} at position`}
                />
              ))}
            </div>
          </div>

          {/* Color layers - ALL colors */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Screen Printing Color Layers ({colorLayers.length} layers)
              </h3>
              <button
                onClick={downloadAllLayersAsZip}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                Download All Layers
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {colorLayers.map((layer, index) => {
                const layerPreview = renderLayerToCanvas(layer, index);
                
                return (
                  <div key={index} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Color header with visual indicator */}
                    <div className="flex items-center p-2" style={{ backgroundColor: layer.color }}>
                      <div className="flex-1">
                        <span className="text-xs font-mono text-white bg-black bg-opacity-30 px-2 py-1 rounded">
                          {layer.color}
                        </span>
                      </div>
                      <span className="text-xs text-white bg-black bg-opacity-30 px-2 py-1 rounded">
                        {layer.percentage.toFixed(2)}%
                      </span>
                    </div>
                    
                    {/* Layer preview */}
                    <div className="bg-gray-100 p-2">
                      {layerPreview && (
                        <div className="relative" style={{ 
                          aspectRatio: `${layer.imageData?.width} / ${layer.imageData?.height}`,
                          maxHeight: '150px'
                        }}>
                          <NextImage
                            src={layerPreview}
                            alt={`Screen printing layer ${index + 1}`}
                            fill
                            className="object-contain"
                            unoptimized={true}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Color details */}
                    <div className="p-3 bg-gray-50">
                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        <div>
                          <span className="text-gray-500">RGB:</span>
                          <span className="ml-1 font-mono">
                            {layer.rgb.r}, {layer.rgb.g}, {layer.rgb.b}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Pixels:</span>
                          <span className="ml-1">{layer.pixelCount.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadLayer(layer, index)}
                          className="flex-1 px-2 py-1.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                        >
                          Download Layer
                        </button>
                        <button
                          onClick={() => setSelectedLayer(index === selectedLayer ? null : index)}
                          className={`px-2 py-1.5 text-xs rounded transition-colors ${
                            selectedLayer === index 
                              ? 'bg-gray-600 text-white' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {selectedLayer === index ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Color distribution for screen printing */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Color Distribution for Ink Mixing</h3>
            
            {/* Color bars with exact percentages */}
            <div className="mb-6">
              <div className="h-8 flex rounded-lg overflow-hidden">
                {colorLayers.map((layer, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: layer.color,
                      width: `${layer.percentage}%`,
                      minWidth: '2px' // Ensure tiny percentages are still visible
                    }}
                    className="h-full transition-all hover:brightness-110"
                    title={`${layer.color} - ${layer.percentage.toFixed(3)}%`}
                  />
                ))}
              </div>
            </div>

            {/* Color table for ink mixing */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Layer</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">RGB</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hex</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pixels</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {colorLayers.map((layer, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">Layer {index + 1}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded border" style={{ backgroundColor: layer.color }} />
                          <span className="text-sm">{layer.color}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm font-mono">{layer.rgb.r}, {layer.rgb.g}, {layer.rgb.b}</td>
                      <td className="px-4 py-2 text-sm font-mono">{layer.color}</td>
                      <td className="px-4 py-2 text-sm">{layer.pixelCount.toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm font-medium">{layer.percentage.toFixed(3)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ink mixing guide */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Screen Printing Preparation Guide</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">📋 Layer Information</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Total color layers: <span className="font-bold">{colorLayers.length}</span></li>
                  <li>• Image dimensions: {originalDimensions.width} x {originalDimensions.height}px</li>
                  <li>• Total pixels: {(originalDimensions.width * originalDimensions.height).toLocaleString()}</li>
                  <li>• Unique colors detected: {totalUniqueColors}</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">🎨 Ink Mixing Tips</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Each layer represents one screen</li>
                  <li>• Percentages show ink coverage</li>
                  <li>• Download PNGs for film positives</li>
                  <li>• Check registration marks if needed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state with silk screen printing info */}
      {!originalImage && !isProcessing && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-gray-400 mb-4">
            <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Upload Image for Screen Printing</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-4">
            Extract EVERY color from your image for silk screen preparation. Perfect for:
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-600">
            <span className="px-3 py-1 bg-gray-100 rounded-full">Spot color separation</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Multi-layer printing</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Ink mixing guides</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Film positive creation</span>
          </div>
        </div>
      )}
    </div>
  );
        }
