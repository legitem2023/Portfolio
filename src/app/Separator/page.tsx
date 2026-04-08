"use client";

import React, { useState, useRef } from 'react';

const ColorSeparator: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [dominantColors, setDominantColors] = useState<Array<{ color: string; hex: string; rgb: string; image: string; percentage: number }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [numColors, setNumColors] = useState(5);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getDominantColors = (pixels: Uint8ClampedArray, width: number, height: number, colorCount: number) => {
    const colorMap = new Map<string, { r: number; g: number; b: number; count: number; pixels: number[] }>();
    
    // Sample pixels (sample every 4th pixel for performance)
    for (let i = 0; i < pixels.length; i += 16) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      // Quantize colors to reduce variations
      const quantizedR = Math.round(r / 15) * 15;
      const quantizedG = Math.round(g / 15) * 15;
      const quantizedB = Math.round(b / 15) * 15;
      const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
      
      if (!colorMap.has(colorKey)) {
        colorMap.set(colorKey, {
          r: quantizedR,
          g: quantizedG,
          b: quantizedB,
          count: 0,
          pixels: []
        });
      }
      const colorData = colorMap.get(colorKey)!;
      colorData.count++;
      colorData.pixels.push(i);
    }
    
    // Convert to array and sort by count
    const sortedColors = Array.from(colorMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, colorCount);
    
    return sortedColors;
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const processImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setIsProcessing(true);
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return;
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const pixels = imageData.data;
        
        // Get dominant colors
        const dominantColorData = getDominantColors(pixels, img.width, img.height, numColors);
        
        // Create a separate layer for each dominant color
        const layers = dominantColorData.map(colorInfo => {
          const layerCanvas = document.createElement('canvas');
          layerCanvas.width = img.width;
          layerCanvas.height = img.height;
          const layerCtx = layerCanvas.getContext('2d');
          
          if (!layerCtx) return null;
          
          const layerData = layerCtx.createImageData(img.width, img.height);
          
          // Start with transparent
          for (let i = 0; i < layerData.data.length; i += 4) {
            layerData.data[i] = 0;
            layerData.data[i + 1] = 0;
            layerData.data[i + 2] = 0;
            layerData.data[i + 3] = 0;
          }
          
          // Find all pixels that match this color (with tolerance)
          const tolerance = 40;
          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            
            const colorDiff = Math.abs(r - colorInfo.r) + Math.abs(g - colorInfo.g) + Math.abs(b - colorInfo.b);
            
            /*if (colorDiff < tolerance) {
              layerData.data[i] = colorInfo.r;
              layerData.data[i + 1] = colorInfo.g;
              layerData.data[i + 2] = colorInfo.b;
              layerData.data[i + 3] = 255;
            }*/
            if (colorDiff < tolerance) {
             layerData.data[i] = 0;     // Red = 0
             layerData.data[i + 1] = 0; // Green = 0
             layerData.data[i + 2] = 0; // Blue = 0
             layerData.data[i + 3] = 255;
            }
          }
          
          layerCtx.putImageData(layerData, 0, 0);
          
          const hexColor = rgbToHex(colorInfo.r, colorInfo.g, colorInfo.b);
          const percentage = (colorInfo.count / (pixels.length / 4)) * 100;
          
          return {
            color: getColorName(colorInfo.r, colorInfo.g, colorInfo.b),
            hex: hexColor,
            rgb: `${colorInfo.r}, ${colorInfo.g}, ${colorInfo.b}`,
            image: layerCanvas.toDataURL(),
            percentage: percentage
          };
        }).filter(layer => layer !== null);
        
        setOriginalImage(canvas.toDataURL());
        setDominantColors(layers);
        setIsProcessing(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const getColorName = (r: number, g: number, b: number): string => {
    if (r > 200 && g < 100 && b < 100) return 'Red';
    if (r > 200 && g > 100 && g < 200 && b < 100) return 'Orange';
    if (r > 200 && g > 200 && b < 100) return 'Yellow';
    if (r < 100 && g > 200 && b < 100) return 'Green';
    if (r < 100 && g < 150 && b > 200) return 'Blue';
    if (r > 150 && g < 150 && b > 200) return 'Purple';
    if (r > 200 && g > 150 && b > 150) return 'Pink';
    if (r < 80 && g < 80 && b < 80) return 'Black';
    if (r > 200 && g > 200 && b > 200) return 'White';
    return 'Color';
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
    link.download = `${colorName.toLowerCase()}_layer.png`;
    link.href = image;
    link.click();
  };

  const resetImage = () => {
    setOriginalImage(null);
    setDominantColors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dominant Color Separator</h1>
        <p className="text-gray-600">Extracts and separates the main colors from your image</p>
      </div>

      {!originalImage && (
        <div>
          <div className="mb-4 flex justify-center gap-4 items-center">
            <label className="text-gray-700">Number of colors to extract:</label>
            <select 
              value={numColors} 
              onChange={(e) => setNumColors(Number(e.target.value))}
              className="px-3 py-2 border rounded-lg"
            >
              <option value={3}>3 Colors</option>
              <option value={4}>4 Colors</option>
              <option value={5}>5 Colors</option>
              <option value={6}>6 Colors</option>
              <option value={8}>8 Colors</option>
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
            <p className="text-sm text-gray-400">The {numColors} most dominant colors will be extracted</p>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 mt-2">Analyzing dominant colors...</p>
        </div>
      )}

      {originalImage && !isProcessing && (
        <div>
          <div className="flex justify-between mb-4">
            <button
              onClick={resetImage}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Upload New Image
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Original Image */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-center mb-3 text-gray-700">Original Image</h3>
              <img src={originalImage} alt="Original" className="w-full rounded-lg shadow-sm" />
            </div>

            {/* Dominant Colors Palette */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-center mb-3 text-gray-700">Dominant Colors</h3>
              <div className="space-y-3">
                {dominantColors.map((color, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 border rounded-lg">
                    <div 
                      className="w-12 h-12 rounded-lg shadow-sm" 
                      style={{ backgroundColor: color.hex }}
                    ></div>
                    <div className="flex-1">
                      <p className="font-semibold">{color.color}</p>
                      <p className="text-xs text-gray-500">{color.hex} • {color.percentage.toFixed(1)}%</p>
                    </div>
                    <button
                      onClick={() => downloadLayer(color.color, color.image)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Separated Color Layers */}
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Separated Color Layers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dominantColors.map((color, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div 
                    className="w-6 h-6 rounded-full" 
                    style={{ backgroundColor: color.hex }}
                  ></div>
                  <h3 className="text-lg font-semibold">{color.color} Layer</h3>
                </div>
                <img 
                  src={color.image} 
                  alt={`${color.color} layer`} 
                  className="w-full rounded-lg shadow-sm border mb-3"
                />
                <p className="text-xs text-gray-500 mb-2 text-center">
                  Shows only the {color.color} areas from the image
                </p>
                <button
                  onClick={() => downloadLayer(color.color, color.image)}
                  className="w-full px-3 py-2 bg-black text-white text-sm rounded hover:bg-gray-800 transition-colors"
                >
                  Download {color.color} Layer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorSeparator;
