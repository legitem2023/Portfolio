"use client";

import React, { useState, useRef } from 'react';

const ColorSeparator: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [colorLayers, setColorLayers] = useState<Array<{ color: string; image: string; count: number }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getColorName = (r: number, g: number, b: number): string => {
    // Find dominant color
    if (r > 200 && g < 100 && b < 100) return 'Red';
    if (r > 200 && g > 100 && g < 200 && b < 100) return 'Orange';
    if (r > 200 && g > 200 && b < 100) return 'Yellow';
    if (r < 100 && g > 200 && b < 100) return 'Green';
    if (r < 100 && g < 150 && b > 200) return 'Blue';
    if (r > 150 && g < 150 && b > 200) return 'Purple';
    if (r > 200 && g > 150 && b > 150) return 'Pink';
    if (r < 100 && g < 100 && b < 100) return 'Black';
    if (r > 200 && g > 200 && b > 200) return 'White';
    if (r > 150 && g > 150 && b < 100) return 'Gold';
    if (r > 100 && g > 100 && b > 100) return 'Gray';
    return 'Other';
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
        
        // Group pixels by color
        const colorMap = new Map<string, { r: number; g: number; b: number; count: number; pixels: number[] }>();
        
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const colorKey = `${Math.round(r/20) * 20},${Math.round(g/20) * 20},${Math.round(b/20) * 20}`;
          
          if (!colorMap.has(colorKey)) {
            colorMap.set(colorKey, {
              r: Math.round(r/20) * 20,
              g: Math.round(g/20) * 20,
              b: Math.round(b/20) * 20,
              count: 0,
              pixels: []
            });
          }
          const colorData = colorMap.get(colorKey)!;
          colorData.count++;
          colorData.pixels.push(i);
        }
        
        // Sort colors by count and take top 8
        const sortedColors = Array.from(colorMap.values()).sort((a, b) => b.count - a.count).slice(0, 8);
        
        // Create a layer for each dominant color
        const layers = sortedColors.map(colorInfo => {
          const layerCanvas = document.createElement('canvas');
          layerCanvas.width = img.width;
          layerCanvas.height = img.height;
          const layerCtx = layerCanvas.getContext('2d');
          
          if (!layerCtx) return null;
          
          const layerData = layerCtx.createImageData(img.width, img.height);
          
          // Fill with transparent
          for (let i = 0; i < layerData.data.length; i += 4) {
            layerData.data[i + 3] = 0;
          }
          
          // Add pixels of this color
          colorInfo.pixels.forEach(pixelIndex => {
            layerData.data[pixelIndex] = colorInfo.r;
            layerData.data[pixelIndex + 1] = colorInfo.g;
            layerData.data[pixelIndex + 2] = colorInfo.b;
            layerData.data[pixelIndex + 3] = 255;
          });
          
          layerCtx.putImageData(layerData, 0, 0);
          
          const colorName = getColorName(colorInfo.r, colorInfo.g, colorInfo.b);
          
          return {
            color: colorName,
            image: layerCanvas.toDataURL(),
            count: colorInfo.count
          };
        }).filter(layer => layer !== null) as Array<{ color: string; image: string; count: number }>;
        
        setOriginalImage(canvas.toDataURL());
        setColorLayers(layers);
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

  const downloadLayer = (color: string, image: string) => {
    const link = document.createElement('a');
    link.download = `${color.toLowerCase()}_layer.png`;
    link.href = image;
    link.click();
  };

  const resetImage = () => {
    setOriginalImage(null);
    setColorLayers([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Color Separator</h1>
        <p className="text-gray-600">Upload an image to separate it into individual colors</p>
      </div>

      {!originalImage && (
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
          <p className="text-sm text-gray-400">JPG, PNG, GIF supported</p>
        </div>
      )}

      {isProcessing && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 mt-2">Separating colors...</p>
        </div>
      )}

      {originalImage && !isProcessing && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={resetImage}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Upload New Image
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Original Image */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-center mb-3 text-gray-700">Original Image</h3>
              <img src={originalImage} alt="Original" className="w-full rounded-lg shadow-sm" />
            </div>

            {/* Color Layers */}
            {colorLayers.map((layer, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold text-center mb-3" style={{ color: `rgb(${getColorRGB(layer.color)})` }}>
                  {layer.color} Layer
                </h3>
                <img src={layer.image} alt={`${layer.color} layer`} className="w-full rounded-lg shadow-sm mb-3" />
                <button
                  onClick={() => downloadLayer(layer.color, layer.image)}
                  className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  Download {layer.color} Layer
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Each color is separated into its own layer. Download individual layers for editing or printing.</p>
          </div>
        </div>
      )}
    </div>
  );
};

function getColorRGB(colorName: string): string {
  const colors: Record<string, string> = {
    'Red': '255, 0, 0',
    'Orange': '255, 165, 0',
    'Yellow': '255, 255, 0',
    'Green': '0, 128, 0',
    'Blue': '0, 0, 255',
    'Purple': '128, 0, 128',
    'Pink': '255, 192, 203',
    'Black': '0, 0, 0',
    'White': '255, 255, 255',
    'Gold': '255, 215, 0',
    'Gray': '128, 128, 128'
  };
  return colors[colorName] || '0, 0, 0';
}

export default ColorSeparator;
