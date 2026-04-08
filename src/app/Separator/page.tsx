"use client";

import React, { useState, useRef } from 'react';

interface ChannelSettings {
  threshold: number;
  inverted: boolean;
}

const ColorSeparator: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<string, ChannelSettings>>({
    red: { threshold: 128, inverted: false },
    green: { threshold: 128, inverted: false },
    blue: { threshold: 128, inverted: false },
    grayscale: { threshold: 128, inverted: false },
  });
  const [channels, setChannels] = useState<Record<string, string | null>>({
    red: null,
    green: null,
    blue: null,
    grayscale: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = (file: File) => {
    setOriginalFile(file);
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
        
        // Process each channel
        const channelTypes = ['red', 'green', 'blue', 'grayscale'];
        const results: Record<string, string> = {};
        
        channelTypes.forEach(channel => {
          const channelCanvas = document.createElement('canvas');
          channelCanvas.width = img.width;
          channelCanvas.height = img.height;
          const channelCtx = channelCanvas.getContext('2d');
          
          if (!channelCtx) return;
          
          const channelData = channelCtx.createImageData(img.width, img.height);
          const channelSettings = settings[channel];
          
          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];
            
            let value: number;
            
            switch(channel) {
              case 'red':
                value = r;
                break;
              case 'green':
                value = g;
                break;
              case 'blue':
                value = b;
                break;
              case 'grayscale':
                value = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
                break;
              default:
                value = 0;
            }
            
            // Apply threshold - creates pure black/white for silk screen
            let finalValue = value >= channelSettings.threshold ? 255 : 0;
            
            // Apply inversion if needed
            if (channelSettings.inverted) {
              finalValue = finalValue === 255 ? 0 : 255;
            }
            
            channelData.data[i] = finalValue;
            channelData.data[i + 1] = finalValue;
            channelData.data[i + 2] = finalValue;
            channelData.data[i + 3] = a;
          }
          
          channelCtx.putImageData(channelData, 0, 0);
          results[channel] = channelCanvas.toDataURL();
        });
        
        setOriginalImage(canvas.toDataURL());
        setChannels(results);
        setIsProcessing(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const updateThreshold = (channel: string, threshold: number) => {
    setSettings(prev => ({
      ...prev,
      [channel]: { ...prev[channel], threshold }
    }));
  };

  const updateInverted = (channel: string, inverted: boolean) => {
    setSettings(prev => ({
      ...prev,
      [channel]: { ...prev[channel], inverted }
    }));
  };

  const reapplySettings = () => {
    if (originalFile) {
      processImage(originalFile);
    }
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

  const downloadChannel = (channel: string, dataUrl: string | null) => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = `${channel}_screen_print.png`;
    link.href = dataUrl;
    link.click();
  };

  const resetImage = () => {
    setOriginalImage(null);
    setChannels({ red: null, green: null, blue: null, grayscale: null });
    setOriginalFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Silk Screen Color Separator</h1>
        <p className="text-gray-600">Upload an image to create black & white separation stencils for screen printing</p>
      </div>

      {/* Upload Area */}
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
          <p className="text-sm text-gray-400">For best results, use high contrast images</p>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 mt-2">Creating separations...</p>
        </div>
      )}

      {/* Results */}
      {originalImage && !isProcessing && (
        <div>
          <div className="flex justify-between mb-4">
            <button
              onClick={resetImage}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Upload New Image
            </button>
            <button
              onClick={reapplySettings}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Settings
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Original Image */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-center mb-3 text-gray-700">Original</h3>
              <img src={originalImage} alt="Original" className="w-full rounded-lg shadow-sm" />
            </div>

            {/* Red Channel */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-center mb-3 text-red-600">Red Stencil</h3>
              {channels.red && (
                <>
                  <img src={channels.red} alt="Red Channel" className="w-full rounded-lg shadow-sm mb-3" />
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Threshold: {settings.red.threshold}</label>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={settings.red.threshold}
                        onChange={(e) => updateThreshold('red', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={settings.red.inverted}
                        onChange={(e) => updateInverted('red', e.target.checked)}
                      />
                      Invert (positive/negative)
                    </label>
                    <button
                      onClick={() => downloadChannel('red', channels.red)}
                      className="w-full mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      Download
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Green Channel */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-center mb-3 text-green-600">Green Stencil</h3>
              {channels.green && (
                <>
                  <img src={channels.green} alt="Green Channel" className="w-full rounded-lg shadow-sm mb-3" />
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Threshold: {settings.green.threshold}</label>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={settings.green.threshold}
                        onChange={(e) => updateThreshold('green', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={settings.green.inverted}
                        onChange={(e) => updateInverted('green', e.target.checked)}
                      />
                      Invert (positive/negative)
                    </label>
                    <button
                      onClick={() => downloadChannel('green', channels.green)}
                      className="w-full mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      Download
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Blue Channel */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-center mb-3 text-blue-600">Blue Stencil</h3>
              {channels.blue && (
                <>
                  <img src={channels.blue} alt="Blue Channel" className="w-full rounded-lg shadow-sm mb-3" />
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Threshold: {settings.blue.threshold}</label>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={settings.blue.threshold}
                        onChange={(e) => updateThreshold('blue', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={settings.blue.inverted}
                        onChange={(e) => updateInverted('blue', e.target.checked)}
                      />
                      Invert (positive/negative)
                    </label>
                    <button
                      onClick={() => downloadChannel('blue', channels.blue)}
                      className="w-full mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      Download
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Grayscale / Key Channel */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-center mb-3 text-gray-700">Black Stencil</h3>
              {channels.grayscale && (
                <>
                  <img src={channels.grayscale} alt="Grayscale" className="w-full rounded-lg shadow-sm mb-3" />
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Threshold: {settings.grayscale.threshold}</label>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={settings.grayscale.threshold}
                        onChange={(e) => updateThreshold('grayscale', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={settings.grayscale.inverted}
                        onChange={(e) => updateInverted('grayscale', e.target.checked)}
                      />
                      Invert (positive/negative)
                    </label>
                    <button
                      onClick={() => downloadChannel('black', channels.grayscale)}
                      className="w-full mt-2 px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-800 transition-colors"
                    >
                      Download
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Silk Screen Tips:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Threshold:</strong> Adjust to control how much of each color gets printed (lower = more ink, higher = less ink)</li>
              <li>• <strong>Invert:</strong> Switch between positive and negative stencils</li>
              <li>• Download each channel as a separate PNG for screen burning</li>
              <li>• For multi-color prints, use Red, Green, and Blue channels as separate screens</li>
              <li>• Use Black stencil for dark areas or as a key layer</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorSeparator;
