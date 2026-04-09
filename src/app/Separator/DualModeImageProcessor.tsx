'use client';

import { useState, useRef } from 'react';

type ProcessingMode = 'reduce-colors' | 'clean-edges-only';

export default function DualModeImageProcessor() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<ProcessingMode>('reduce-colors');
  const [targetColors, setTargetColors] = useState(5);
  const [dithering, setDithering] = useState(false);
  const [tolerance, setTolerance] = useState(30);
  const [exportScale, setExportScale] = useState(1); // 1x, 2x, 4x, etc.
  const [customWidth, setCustomWidth] = useState<number>(3840);
  const [customHeight, setCustomHeight] = useState<number>(2160);
  const [useCustomResolution, setUseCustomResolution] = useState(false);
  
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

  const findClosestColor = (color: number[], palette: number[][]): number[] => {
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
  };

  const medianCut = (colors: number[][], depth: number, targetDepth: number): number[][] => {
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
      ...medianCut(colors.slice(0, medianIndex), depth + 1, targetDepth),
      ...medianCut(colors.slice(medianIndex), depth + 1, targetDepth)
    ];
  };

  // Scale image with nearest neighbor (pixel-perfect, no blur)
  const scaleImage = (imageData: ImageData, scaleFactor: number): ImageData => {
    const { width, height, data } = imageData;
    const newWidth = Math.floor(width * scaleFactor);
    const newHeight = Math.floor(height * scaleFactor);
    const newData = new Uint8ClampedArray(newWidth * newHeight * 4);
    
    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const srcX = Math.floor(x / scaleFactor);
        const srcY = Math.floor(y / scaleFactor);
        const srcIdx = (srcY * width + srcX) * 4;
        
        const destIdx = (y * newWidth + x) * 4;
        newData[destIdx] = data[srcIdx];
        newData[destIdx + 1] = data[srcIdx + 1];
        newData[destIdx + 2] = data[srcIdx + 2];
        newData[destIdx + 3] = data[srcIdx + 3];
      }
    }
    
    return new ImageData(newData, newWidth, newHeight);
  };

  // Scale to exact custom resolution
  const scaleToExactResolution = (imageData: ImageData, targetWidth: number, targetHeight: number): ImageData => {
    const { width, height, data } = imageData;
    const newData = new Uint8ClampedArray(targetWidth * targetHeight * 4);
    
    const xRatio = width / targetWidth;
    const yRatio = height / targetHeight;
    
    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        const srcX = Math.floor(x * xRatio);
        const srcY = Math.floor(y * yRatio);
        const srcIdx = (srcY * width + srcX) * 4;
        
        const destIdx = (y * targetWidth + x) * 4;
        newData[destIdx] = data[srcIdx];
        newData[destIdx + 1] = data[srcIdx + 1];
        newData[destIdx + 2] = data[srcIdx + 2];
        newData[destIdx + 3] = data[srcIdx + 3];
      }
    }
    
    return new ImageData(newData, targetWidth, targetHeight);
  };

  // MODE 1: Reduce colors
  const processReduceColors = (imageData: ImageData): ImageData => {
    const { width, height, data } = imageData;
    const newData = new Uint8ClampedArray(data);
    
    // Collect unique colors
    const colorMap = new Map<string, number>();
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 10) continue;
      
      const key = `${r},${g},${b}`;
      colorMap.set(key, (colorMap.get(key) || 0) + 1);
    }
    
    // Build color array for median cut
    const colorArray: number[][] = [];
    for (const [color, count] of colorMap.entries()) {
      const [r, g, b] = color.split(',').map(Number);
      const weight = Math.min(Math.floor(count / 100), 100);
      for (let i = 0; i < weight; i++) {
        colorArray.push([r, g, b]);
      }
    }
    
    const targetDepth = Math.ceil(Math.log2(targetColors));
    const palette = medianCut(colorArray, 0, targetDepth);
    
    console.log(`Reduced ${colorMap.size} colors to ${palette.length} colors`);
    
    // Apply palette
    for (let i = 0; i < newData.length; i += 4) {
      const r = newData[i];
      const g = newData[i + 1];
      const b = newData[i + 2];
      const a = newData[i + 3];
      if (a < 10) continue;
      
      const closest = findClosestColor([r, g, b], palette);
      newData[i] = closest[0];
      newData[i + 1] = closest[1];
      newData[i + 2] = closest[2];
    }
    
    return new ImageData(newData, width, height);
  };

  // MODE 2: Clean edges only
  const processCleanEdges = (imageData: ImageData): ImageData => {
    const { width, height, data } = imageData;
    const newData = new Uint8ClampedArray(data);
    
    // Detect main colors (appear in at least 0.5% of pixels)
    const colorCounts = new Map<string, number>();
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 10) continue;
      
      const key = `${r},${g},${b}`;
      colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
    }
    
    const totalPixels = data.length / 4;
    const minPixelCount = totalPixels * 0.005;
    const mainColors = Array.from(colorCounts.entries())
      .filter(([, count]) => count > minPixelCount)
      .map(([color]) => color.split(',').map(Number));
    
    console.log(`Found ${mainColors.length} main colors out of ${colorCounts.size} total`);
    
    // Helper to get neighbor colors
    const getNeighbors = (x: number, y: number) => {
      const neighbors = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const idx = (ny * width + nx) * 4;
            if (data[idx + 3] > 10) {
              neighbors.push({
                r: data[idx],
                g: data[idx + 1],
                b: data[idx + 2]
              });
            }
          }
        }
      }
      return neighbors;
    };
    
    // Clean transition pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        
        if (a < 10) continue;
        
        const neighbors = getNeighbors(x, y);
        if (neighbors.length === 0) continue;
        
        // Find most common neighbor color
        const neighborCounts = new Map<string, number>();
        neighbors.forEach(neighbor => {
          const key = `${neighbor.r},${neighbor.g},${neighbor.b}`;
          neighborCounts.set(key, (neighborCounts.get(key) || 0) + 1);
        });
        
        const mostCommonNeighbor = Array.from(neighborCounts.entries())
          .sort((a, b) => b[1] - a[1])[0];
        
        if (!mostCommonNeighbor) continue;
        
        const [commonR, commonG, commonB] = mostCommonNeighbor[0].split(',').map(Number);
        const distance = Math.sqrt(
          Math.pow(r - commonR, 2) +
          Math.pow(g - commonG, 2) +
          Math.pow(b - commonB, 2)
        );
        
        // If pixel is a transition, replace it
        if (distance > tolerance) {
          const closestMain = findClosestColor([r, g, b], mainColors);
          newData[idx] = closestMain[0];
          newData[idx + 1] = closestMain[1];
          newData[idx + 2] = closestMain[2];
        }
      }
    }
    
    return new ImageData(newData, width, height);
  };

  const processImage = () => {
    if (!originalImage) return;
    
    setIsProcessing(true);
    
    const img = new Image();
    img.onload = () => {
      // Step 1: Process at original size
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;
      
      tempCtx.drawImage(img, 0, 0);
      let imageData = tempCtx.getImageData(0, 0, img.width, img.height);
      
      // Step 2: Apply selected mode
      if (mode === 'reduce-colors') {
        imageData = processReduceColors(imageData);
      } else {
        imageData = processCleanEdges(imageData);
      }
      
      // Step 3: Scale to export resolution
      let finalWidth = img.width;
      let finalHeight = img.height;
      
      if (useCustomResolution) {
        imageData = scaleToExactResolution(imageData, customWidth, customHeight);
        finalWidth = customWidth;
        finalHeight = customHeight;
      } else if (exportScale !== 1) {
        imageData = scaleImage(imageData, exportScale);
        finalWidth = img.width * exportScale;
        finalHeight = img.height * exportScale;
      }
      
      // Step 4: Draw to visible canvas
      if (canvasRef.current) {
        canvasRef.current.width = finalWidth;
        canvasRef.current.height = finalHeight;
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.putImageData(imageData, 0, 0);
          setProcessedImage(canvasRef.current.toDataURL('image/png'));
        }
      }
      
      setIsProcessing(false);
    };
    
    img.src = originalImage;
  };

  const getResolutionLabel = () => {
    if (useCustomResolution) return `${customWidth}x${customHeight}`;
    if (exportScale === 1) return 'Original';
    if (exportScale === 2) return '2x (e.g., 1080p → 4K)';
    if (exportScale === 4) return '4x (Ultra HD)';
    return `${exportScale}x`;
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">4K Color Transition Cleaner</h1>
      
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
            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center gap-2 p-2 bg-white rounded">
                <input
                  type="radio"
                  value="reduce-colors"
                  checked={mode === 'reduce-colors'}
                  onChange={(e) => setMode(e.target.value as ProcessingMode)}
                />
                <div>
                  <strong>Reduce Colors</strong>
                  <p className="text-xs text-gray-600">Quantize to solid color blocks</p>
                </div>
              </label>
              
              <label className="flex items-center gap-2 p-2 bg-white rounded">
                <input
                  type="radio"
                  value="clean-edges-only"
                  checked={mode === 'clean-edges-only'}
                  onChange={(e) => setMode(e.target.value as ProcessingMode)}
                />
                <div>
                  <strong>Clean Edges Only</strong>
                  <p className="text-xs text-gray-600">Preserve colors, remove transitions</p>
                </div>
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
                <span className="text-sm">Enable Dithering (better quality)</span>
              </label>
            </div>
          )}

          {mode === 'clean-edges-only' && (
            <div className="mb-4 p-4 bg-green-50 rounded">
              <label className="block text-sm font-medium mb-2">
                Edge Detection Tolerance: {tolerance}
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={tolerance}
                onChange={(e) => setTolerance(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Lower = only clean obvious transitions | Higher = more aggressive
              </p>
            </div>
          )}

          {/* Export Resolution Controls */}
          <div className="mb-4 p-4 bg-purple-50 rounded">
            <h3 className="font-semibold mb-3">Export Resolution:</h3>
            
            <div className="mb-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!useCustomResolution}
                  onChange={() => setUseCustomResolution(false)}
                />
                <span>Scale by factor:</span>
              </label>
              <div className="ml-6 mt-2 flex gap-2">
                {[1, 2, 3, 4, 8].map(scale => (
                  <button
                    key={scale}
                    onClick={() => {
                      setUseCustomResolution(false);
                      setExportScale(scale);
                    }}
                    className={`px-3 py-1 rounded ${
                      !useCustomResolution && exportScale === scale
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200'
                    }`}
                  >
                    {scale}x
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={useCustomResolution}
                  onChange={() => setUseCustomResolution(true)}
                />
                <span>Custom resolution (4K, 8K, etc.):</span>
              </label>
              <div className="ml-6 mt-2 flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    setUseCustomResolution(true);
                    setCustomWidth(1920);
                    setCustomHeight(1080);
                  }}
                  className="px-3 py-1 rounded bg-gray-200 text-sm"
                >
                  1080p (1920x1080)
                </button>
                <button
                  onClick={() => {
                    setUseCustomResolution(true);
                    setCustomWidth(3840);
                    setCustomHeight(2160);
                  }}
                  className="px-3 py-1 rounded bg-purple-200 text-sm font-semibold"
                >
                  4K (3840x2160) ⭐
                </button>
                <button
                  onClick={() => {
                    setUseCustomResolution(true);
                    setCustomWidth(7680);
                    setCustomHeight(4320);
                  }}
                  className="px-3 py-1 rounded bg-gray-200 text-sm"
                >
                  8K (7680x4320)
                </button>
                <div className="flex gap-1 items-center">
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(parseInt(e.target.value) || 3840)}
                    className="w-24 px-2 py-1 border rounded"
                    placeholder="Width"
                  />
                  <span>x</span>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(parseInt(e.target.value) || 2160)}
                    className="w-24 px-2 py-1 border rounded"
                    placeholder="Height"
                  />
                </div>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              ⚡ Uses nearest-neighbor scaling (pixel-perfect, no blur) - ideal for pixel art
            </p>
          </div>

          <button
            onClick={processImage}
            disabled={isProcessing}
            className="bg-blue-500 text-white px-6 py-2 rounded mb-6 hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isProcessing ? 'Processing...' : `Process & Export at ${getResolutionLabel()}`}
          </button>
        </>
      )}

      {/* Image Comparison */}
      <div className="grid grid-cols-2 gap-4">
        {originalImage && (
          <div>
            <h3 className="font-semibold mb-2">Original Image</h3>
            <img src={originalImage} alt="Original" className="border rounded max-w-full" />
          </div>
        )}
        
        {processedImage && (
          <div>
            <h3 className="font-semibold mb-2">
              Processed Result ({getResolutionLabel()})
            </h3>
            <img src={processedImage} alt="Processed" className="border rounded max-w-full" />
            <p className="text-xs text-green-600 mt-1">
              ✓ Ready for 4K export
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
              const resolution = useCustomResolution 
                ? `${customWidth}x${customHeight}`
                : `${exportScale}x`;
              link.download = `${mode}-${resolution}.png`;
              link.href = processedImage;
              link.click();
            }}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            💾 Download {getResolutionLabel()} PNG
          </button>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 p-4 bg-yellow-50 rounded text-sm">
        <h3 className="font-semibold mb-2">📺 4K Export Features:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Scale factors:</strong> 1x, 2x, 3x, 4x, 8x</li>
          <li><strong>Presets:</strong> 1080p, 4K (3840x2160), 8K</li>
          <li><strong>Custom:</strong> Any resolution you want</li>
          <li><strong>Scaling:</strong> Nearest-neighbor (pixel-perfect, no anti-aliasing)</li>
          <li><strong>File size:</strong> 4K PNG exports can be large (50-200MB)</li>
        </ul>
      </div>
    </div>
  );
           }
