"use client";

import React, { useState, useRef, useEffect } from 'react';

interface ColorLayer {
  color: string;
  hex: string;
  rgb: string;
  image: string;
  percentage: number;
  pixelCount: number;
}

const ColorSeparator: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [colorLayers, setColorLayers] = useState<ColorLayer[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalColorsFound, setTotalColorsFound] = useState(0);
  const [filterThreshold, setFilterThreshold] = useState(0.01); // Minimum percentage to show
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Color quantization - reduce to exact color values for true separation
  const quantizeColor = (r: number, g: number, b: number, precision: number = 1): string => {
    // Use precision 1 for exact colors (no quantization)
    // This ensures we capture every single distinct color
    const qR = Math.round(r / precision) * precision;
    const qG = Math.round(g / precision) * precision;
    const qB = Math.round(b / precision) * precision;
    return `${qR},${qG},${qB}`;
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(x).toString(16).padStart(2, '0');
      return hex;
    }).join('');
  };

  const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  const getColorNameFromRgb = (r: number, g: number, b: number): string => {
    const hsl = rgbToHsl(r, g, b);
    
    // Handle grayscale
    if (hsl.s < 10) {
      if (hsl.l < 15) return 'Black';
      if (hsl.l > 85) return 'White';
      if (hsl.l < 35) return 'Dark Gray';
      if (hsl.l > 65) return 'Light Gray';
      return 'Gray';
    }

    // Handle colors based on hue
    const h = hsl.h;
    
    if (h < 15) return 'Red';
    if (h < 35) return 'Orange-Red';
    if (h < 45) return 'Orange';
    if (h < 55) return 'Orange-Yellow';
    if (h < 70) return 'Yellow';
    if (h < 90) return 'Yellow-Green';
    if (h < 150) return 'Green';
    if (h < 180) return 'Teal';
    if (h < 210) return 'Cyan';
    if (h < 240) return 'Blue';
    if (h < 270) return 'Indigo';
    if (h < 300) return 'Purple';
    if (h < 330) return 'Magenta';
    if (h < 345) return 'Pink';
    return 'Red';
  };

  const processImage = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.onload = async () => {
        setIsProcessing(true);
        setProgress(0);
        
        const canvas = document.createElement('canvas');
        const maxDimension = 1200; // Limit size for performance while maintaining detail
        
        let width = img.width;
        let height = img.height;
        
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (!ctx) return;
        
        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const pixels = imageData.data;
        
        // Step 1: Find all unique colors
        setProgress(10);
        const colorMap = new Map<string, { 
          r: number; 
          g: number; 
          b: number; 
          count: number;
          positions: number[];
        }>();
        
        const totalPixels = pixels.length / 4;
        
        // Process every pixel to find all exact colors
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];
          
          // Skip fully transparent pixels
          if (a === 0) continue;
          
          // Use exact color values (no quantization) for true separation
          const colorKey = `${r},${g},${b}`;
          
          if (!colorMap.has(colorKey)) {
            colorMap.set(colorKey, {
              r,
              g,
              b,
              count: 0,
              positions: []
            });
          }
          
          const colorData = colorMap.get(colorKey)!;
          colorData.count++;
          colorData.positions.push(i);
          
          // Update progress during counting
          if (i % 10000 === 0) {
            setProgress(10 + Math.floor((i / pixels.length) * 30));
            await new Promise(resolve => setTimeout(resolve, 0)); // Allow UI updates
          }
        }
        
        setTotalColorsFound(colorMap.size);
        setProgress(40);
        
        // Convert to array and sort by frequency
        const sortedColors = Array.from(colorMap.values())
          .sort((a, b) => b.count - a.count);
        
        // Filter colors that meet the threshold
        const significantColors = sortedColors.filter(
          color => (color.count / totalPixels) * 100 >= filterThreshold
        );
        
        setProgress(50);
        
        // Step 2: Create separate layer for each color
        const layers: ColorLayer[] = [];
        const totalColors = significantColors.length;
        
        for (let idx = 0; idx < significantColors.length; idx++) {
          const colorInfo = significantColors[idx];
          
          // Update progress
          setProgress(50 + Math.floor((idx / totalColors) * 45));
          
          // Create canvas for this color layer
          const layerCanvas = document.createElement('canvas');
          layerCanvas.width = width;
          layerCanvas.height = height;
          const layerCtx = layerCanvas.getContext('2d');
          
          if (!layerCtx) continue;
          
          const layerData = layerCtx.createImageData(width, height);
          
          // Initialize with transparency
          for (let i = 0; i < layerData.data.length; i += 4) {
            layerData.data[i + 3] = 0;
          }
          
          // Fill pixels that match this exact color
          for (const position of colorInfo.positions) {
            layerData.data[position] = colorInfo.r;
            layerData.data[position + 1] = colorInfo.g;
            layerData.data[position + 2] = colorInfo.b;
            layerData.data[position + 3] = 255;
          }
          
          layerCtx.putImageData(layerData, 0, 0);
          
          const hexColor = rgbToHex(colorInfo.r, colorInfo.g, colorInfo.b);
          const percentage = (colorInfo.count / totalPixels) * 100;
          const colorName = getColorNameFromRgb(colorInfo.r, colorInfo.g, colorInfo.b);
          
          // Add variation to name if needed
          let finalName = colorName;
          const sameNameCount = layers.filter(l => l.color.startsWith(colorName)).length;
          if (sameNameCount > 0) {
            finalName = `${colorName} ${sameNameCount + 1}`;
          }
          
          layers.push({
            color: finalName,
            hex: hexColor,
            rgb: `${colorInfo.r}, ${colorInfo.g}, ${colorInfo.b}`,
            image: layerCanvas.toDataURL('image/png'),
            percentage,
            pixelCount: colorInfo.count
          });
          
          // Allow UI to update periodically
          if (idx % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
        
        setOriginalImage(canvas.toDataURL('image/png'));
        setColorLayers(layers);
        setProgress(100);
        setIsProcessing(false);
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    }
  };

  const downloadLayer = (colorName: string, image: string) => {
    const link = document.createElement('a');
    link.download = `${colorName.toLowerCase().replace(/\s+/g, '_')}_layer.png`;
    link.href = image;
    link.click();
  };

  const downloadAllLayers = async () => {
    for (const layer of colorLayers) {
      await new Promise(resolve => setTimeout(resolve, 100));
      downloadLayer(layer.color, layer.image);
    }
  };

  const resetImage = () => {
    setOriginalImage(null);
    setColorLayers([]);
    setProgress(0);
    setTotalColorsFound(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Exact Color Separator</h1>
        <p className="text-gray-600">Separates every distinct color in your image down to the smallest detail</p>
      </div>

      {!originalImage && (
        <div>
          <div className="mb-4 flex justify-center gap-4 items-center">
            <label className="text-gray-700">Minimum color percentage to show:</label>
            <select 
              value={filterThreshold} 
              onChange={(e) => setFilterThreshold(Number(e.target.value))}
              className="px-3 py-2 border rounded-lg"
            >
              <option value={0}>Show all colors (no filter)</option>
              <option value={0.001}>0.001% minimum</option>
              <option value={0.01}>0.01% minimum</option>
              <option value={0.05}>0.05% minimum</option>
              <option value={0.1}>0.1% minimum</option>
              <option value={0.5}>0.5% minimum</option>
              <option value={1}>1% minimum</option>
            </select>
          </div>
          
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer bg-white"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <div className="text-4xl mb-4">🎨</div>
            <p className="text-gray-600 mb-2">Click or drag & drop an image here</p>
            <p className="text-sm text-gray-400">Every distinct color will be separated into individual layers</p>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2.5 mb-4">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-gray-600">
            {progress < 40 && "Analyzing pixels..."}
            {progress >= 40 && progress < 50 && `Found ${totalColorsFound.toLocaleString()} unique colors...`}
            {progress >= 50 && progress < 95 && "Creating color layers..."}
            {progress >= 95 && "Finalizing..."}
          </p>
          <p className="text-sm text-gray-500 mt-2">{progress}% complete</p>
        </div>
      )}

      {originalImage && !isProcessing && (
        <div>
          <div className="flex flex-wrap justify-between gap-3 mb-4">
            <button
              onClick={resetImage}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Upload New Image
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={downloadAllLayers}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                disabled={colorLayers.length === 0}
              >
                Download All Layers
              </button>
              
              <select 
                value={filterThreshold} 
                onChange={(e) => {
                  setFilterThreshold(Number(e.target.value));
                  if (fileInputRef.current?.files?.[0]) {
                    processImage(fileInputRef.current.files[0]);
                  }
                }}
                className="px-3 py-2 border rounded-lg"
              >
                <option value={0}>Show all</option>
                <option value={0.001}>≥0.001%</option>
                <option value={0.01}>≥0.01%</option>
                <option value={0.05}>≥0.05%</option>
                <option value={0.1}>≥0.1%</option>
                <option value={0.5}>≥0.5%</option>
                <option value={1}>≥1%</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{totalColorsFound.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Unique Colors</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{colorLayers.length.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Color Layers Created</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{colorLayers.filter(l => l.percentage >= 1).length}</p>
                <p className="text-sm text-gray-600">Colors ≥1%</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {colorLayers.length > 0 ? colorLayers[0].percentage.toFixed(2) : '0'}%
                </p>
                <p className="text-sm text-gray-600">Most Dominant Color</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Original Image */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-center mb-3 text-gray-700">Original Image</h3>
              <img src={originalImage} alt="Original" className="w-full rounded-lg shadow-sm" />
            </div>

            {/* Color Palette */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-center mb-3 text-gray-700">
                Color Palette ({colorLayers.length} colors)
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {colorLayers.map((color, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 border rounded-lg hover:bg-gray-50">
                    <div 
                      className="w-10 h-10 rounded-lg shadow-sm flex-shrink-0 border" 
                      style={{ backgroundColor: color.hex }}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{color.color}</p>
                      <p className="text-xs text-gray-500">{color.hex} • RGB({color.rgb})</p>
                      <p className="text-xs text-gray-400">{color.percentage.toFixed(3)}% • {color.pixelCount.toLocaleString()} pixels</p>
                    </div>
                    <button
                      onClick={() => downloadLayer(color.color, color.image)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex-shrink-0"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Separated Color Layers */}
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Separated Color Layers ({colorLayers.length} layers)
          </h3>
          
          {colorLayers.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg">
              <p className="text-gray-500">No colors found above the threshold. Try lowering the minimum percentage.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {colorLayers.map((color, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-3 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-5 h-5 rounded-full border flex-shrink-0" 
                      style={{ backgroundColor: color.hex }}
                    ></div>
                    <h3 className="text-sm font-semibold truncate">{color.color}</h3>
                    <span className="text-xs text-gray-500 ml-auto">{color.percentage.toFixed(2)}%</span>
                  </div>
                  
                  <div className="relative group mb-2">
                    <img 
                      src={color.image} 
                      alt={`${color.color} layer`} 
                      className="w-full rounded border bg-gray-100"
                      style={{ minHeight: '100px' }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded"></div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600">RGB: {color.rgb}</p>
                    <p className="text-xs text-gray-600">HEX: {color.hex}</p>
                    <p className="text-xs text-gray-600">{color.pixelCount.toLocaleString()} pixels</p>
                    
                    <button
                      onClick={() => downloadLayer(color.color, color.image)}
                      className="w-full px-3 py-1.5 bg-black text-white text-xs rounded hover:bg-gray-800 transition-colors mt-2"
                    >
                      Download Layer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ColorSeparator;
