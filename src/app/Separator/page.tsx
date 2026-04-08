import React, { useState, useRef } from 'react';

const ColorSeparator: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [channels, setChannels] = useState<{ red: string | null; green: string | null; blue: string | null; gray: string | null }>({
    red: null,
    green: null,
    blue: null,
    gray: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setIsProcessing(true);
        
        // Create canvas for original and channels
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        const originalData = ctx.getImageData(0, 0, img.width, img.height);
        const imageData = originalData.data;
        
        // Create canvases for each channel
        const redCanvas = document.createElement('canvas');
        const greenCanvas = document.createElement('canvas');
        const blueCanvas = document.createElement('canvas');
        const grayCanvas = document.createElement('canvas');
        
        redCanvas.width = greenCanvas.width = blueCanvas.width = grayCanvas.width = img.width;
        redCanvas.height = greenCanvas.height = blueCanvas.height = grayCanvas.height = img.height;
        
        const redCtx = redCanvas.getContext('2d');
        const greenCtx = greenCanvas.getContext('2d');
        const blueCtx = blueCanvas.getContext('2d');
        const grayCtx = grayCanvas.getContext('2d');
        
        if (!redCtx || !greenCtx || !blueCtx || !grayCtx) return;
        
        // Create ImageData for each channel
        const redImageData = redCtx.createImageData(img.width, img.height);
        const greenImageData = greenCtx.createImageData(img.width, img.height);
        const blueImageData = blueCtx.createImageData(img.width, img.height);
        const grayImageData = grayCtx.createImageData(img.width, img.height);
        
        // Process each pixel
        for (let i = 0; i < imageData.length; i += 4) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const a = imageData[i + 3];
          
          // Red channel: keep red, zero out green and blue
          redImageData.data[i] = r;
          redImageData.data[i + 1] = 0;
          redImageData.data[i + 2] = 0;
          redImageData.data[i + 3] = a;
          
          // Green channel: keep green, zero out red and blue
          greenImageData.data[i] = 0;
          greenImageData.data[i + 1] = g;
          greenImageData.data[i + 2] = 0;
          greenImageData.data[i + 3] = a;
          
          // Blue channel: keep blue, zero out red and green
          blueImageData.data[i] = 0;
          blueImageData.data[i + 1] = 0;
          blueImageData.data[i + 2] = b;
          blueImageData.data[i + 3] = a;
          
          // Grayscale: using luminance formula 0.299*R + 0.587*G + 0.114*B
          const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
          grayImageData.data[i] = gray;
          grayImageData.data[i + 1] = gray;
          grayImageData.data[i + 2] = gray;
          grayImageData.data[i + 3] = a;
        }
        
        // Put the processed data onto canvases
        redCtx.putImageData(redImageData, 0, 0);
        greenCtx.putImageData(greenImageData, 0, 0);
        blueCtx.putImageData(blueImageData, 0, 0);
        grayCtx.putImageData(grayImageData, 0, 0);
        
        // Convert to data URLs
        setOriginalImage(canvas.toDataURL());
        setChannels({
          red: redCanvas.toDataURL(),
          green: greenCanvas.toDataURL(),
          blue: blueCanvas.toDataURL(),
          gray: grayCanvas.toDataURL(),
        });
        
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

  const resetImage = () => {
    setOriginalImage(null);
    setChannels({ red: null, green: null, blue: null, gray: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Image Color Channel Separator</h1>
        <p className="text-gray-600">Upload an image to see its Red, Green, Blue, and Grayscale channels</p>
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
          <div className="text-4xl mb-4">📷</div>
          <p className="text-gray-600 mb-2">Click or drag & drop an image here</p>
          <p className="text-sm text-gray-400">Supports JPG, PNG, GIF, etc.</p>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 mt-2">Processing image...</p>
        </div>
      )}

      {/* Results */}
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Original Image */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-center mb-3 text-gray-700">Original</h3>
              <img src={originalImage} alt="Original" className="w-full rounded-lg shadow-sm" />
            </div>

            {/* Red Channel */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-center mb-3 text-red-600">Red Channel</h3>
              {channels.red && <img src={channels.red} alt="Red Channel" className="w-full rounded-lg shadow-sm" />}
            </div>

            {/* Green Channel */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-center mb-3 text-green-600">Green Channel</h3>
              {channels.green && <img src={channels.green} alt="Green Channel" className="w-full rounded-lg shadow-sm" />}
            </div>

            {/* Blue Channel */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-center mb-3 text-blue-600">Blue Channel</h3>
              {channels.blue && <img src={channels.blue} alt="Blue Channel" className="w-full rounded-lg shadow-sm" />}
            </div>

            {/* Grayscale */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-center mb-3 text-gray-700">Grayscale</h3>
              {channels.gray && <img src={channels.gray} alt="Grayscale" className="w-full rounded-lg shadow-sm" />}
            </div>
          </div>

          <div className="mt-6 text-sm text-gray-500 text-center">
            <p>Red, Green, and Blue channels show only their respective color information.</p>
            <p>Grayscale uses the luminance formula: 0.299×R + 0.587×G + 0.114×B</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorSeparator;
