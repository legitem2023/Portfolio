// components/ProfessionalColorSeparator.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import NextImage from 'next/image';

interface SeparationLayer {
  id: string;
  name: string;
  color: string;
  cmyk: { c: number; m: number; y: number; k: number };
  rgb: { r: number; g: number; b: number };
  imageData: ImageData | null;
  processedData: ImageData | null;
  type: 'process' | 'spot' | 'underbase' | 'highlight';
  percentage: number;
  settings: LayerSettings;
}

interface LayerSettings {
  curves: { input: number; output: number }[];
  levels: { black: number; gamma: number; white: number };
  threshold: number;
  choke: number; // For trapping
  spread: number; // For trapping
  underbase: boolean;
  highlight: boolean;
  halftone: {
    frequency: number;
    angle: number;
    shape: 'dot' | 'ellipse' | 'line' | 'square';
    stochastic: boolean;
  };
}

export default function ProfessionalColorSeparator() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [separations, setSeparations] = useState<SeparationLayer[]>([]);
  const [activeTab, setActiveTab] = useState<'process' | 'spot' | 'output'>('process');
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  
  // Advanced settings
  const [separationMethod, setSeparationMethod] = useState<'photoshop' | 'gcr' | 'ucr'>('photoshop');
  const [blackGeneration, setBlackGeneration] = useState(50); // GCR amount
  const [totalInkLimit, setTotalInkLimit] = useState(280); // 280% typical for screen printing
  const [underbaseWhite, setUnderbaseWhite] = useState(80); // Underbase percentage
  
  // Spot color settings
  const [spotColors, setSpotColors] = useState<Array<{ name: string; color: string; tolerance: number }>>([]);
  const [selectedSpotColor, setSelectedSpotColor] = useState<string>('');
  
  // Output settings
  const [outputDPI, setOutputDPI] = useState(300);
  const [meshCount, setMeshCount] = useState(230); // Typical screen mesh
  const [printOnDark, setPrintOnDark] = useState(true);
  const [simulateTrapping, setSimulateTrapping] = useState(true);
  const [trappingAmount, setTrappingAmount] = useState(0.5); // pixels
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Professional CMYK separation with GCR/UCR
  const rgbToCmykAdvanced = (
    r: number, 
    g: number, 
    b: number, 
    method: 'photoshop' | 'gcr' | 'ucr',
    blackGen: number,
    inkLimit: number
  ): { c: number; m: number; y: number; k: number } => {
    // Convert to percentages
    let c = 1 - (r / 255);
    let m = 1 - (g / 255);
    let y = 1 - (b / 255);
    
    // Calculate black (K)
    let k = Math.min(c, m, y);
    
    if (method === 'gcr') {
      // Gray Component Replacement - removes gray from CMY and replaces with K
      const grayReplacement = k * (blackGen / 100);
      k = grayReplacement;
      c = Math.max(0, c - grayReplacement);
      m = Math.max(0, m - grayReplacement);
      y = Math.max(0, y - grayReplacement);
    } else if (method === 'ucr') {
      // Under Color Removal - similar to GCR but more aggressive
      const underColor = Math.min(c, m, y) * (blackGen / 100);
      k = underColor;
      c = c - underColor;
      m = m - underColor;
      y = y - underColor;
    }
    
    // Apply ink limit
    const total = (c + m + y + k) * 100;
    if (total > inkLimit) {
      const ratio = inkLimit / total;
      c *= ratio;
      m *= ratio;
      y *= ratio;
      k *= ratio;
    }
    
    return {
      c: Math.min(100, Math.max(0, Math.round(c * 100))),
      m: Math.min(100, Math.max(0, Math.round(m * 100))),
      y: Math.min(100, Math.max(0, Math.round(y * 100))),
      k: Math.min(100, Math.max(0, Math.round(k * 100)))
    };
  };

  // Apply curves adjustment (like Photoshop curves)
  const applyCurves = (imageData: ImageData, curves: { input: number; output: number }[]): ImageData => {
    const width = imageData.width;
    const height = imageData.height;
    const pixels = imageData.data;
    const result = new ImageData(width, height);
    const resultPixels = result.data;
    
    // Build lookup table
    const lut = new Array(256);
    for (let i = 0; i < 256; i++) {
      let value = i;
      for (let j = 0; j < curves.length - 1; j++) {
        if (i >= curves[j].input && i <= curves[j + 1].input) {
          const t = (i - curves[j].input) / (curves[j + 1].input - curves[j].input);
          value = curves[j].output + t * (curves[j + 1].output - curves[j].output);
          break;
        }
      }
      lut[i] = Math.min(255, Math.max(0, Math.round(value)));
    }
    
    for (let i = 0; i < pixels.length; i += 4) {
      resultPixels[i] = lut[pixels[i]];
      resultPixels[i + 1] = lut[pixels[i + 1]];
      resultPixels[i + 2] = lut[pixels[i + 2]];
      resultPixels[i + 3] = pixels[i + 3];
    }
    
    return result;
  };

  // Apply levels adjustment
  const applyLevels = (imageData: ImageData, black: number, gamma: number, white: number): ImageData => {
    const width = imageData.width;
    const height = imageData.height;
    const pixels = imageData.data;
    const result = new ImageData(width, height);
    const resultPixels = result.data;
    
    const gammaCorrection = 1 / gamma;
    
    for (let i = 0; i < pixels.length; i += 4) {
      for (let j = 0; j < 3; j++) {
        let value = pixels[i + j];
        value = (value - black) / (white - black) * 255;
        value = Math.pow(value / 255, gammaCorrection) * 255;
        resultPixels[i + j] = Math.min(255, Math.max(0, Math.round(value)));
      }
      resultPixels[i + 3] = pixels[i + 3];
    }
    
    return result;
  };

  // Create underbase (for dark garments)
  const createUnderbase = (imageData: ImageData, opacity: number): ImageData => {
    const width = imageData.width;
    const height = imageData.height;
    const pixels = imageData.data;
    const result = new ImageData(width, height);
    const resultPixels = result.data;
    
    for (let i = 0; i < pixels.length; i += 4) {
      // Calculate luminance
      const luminance = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
      // Underbase where image is bright
      const underbaseValue = Math.min(255, Math.max(0, (255 - luminance) * (opacity / 100)));
      
      resultPixels[i] = underbaseValue;
      resultPixels[i + 1] = underbaseValue;
      resultPixels[i + 2] = underbaseValue;
      resultPixels[i + 3] = 255;
    }
    
    return result;
  };

  // Apply trapping (choke/spread)
  const applyTrapping = (imageData: ImageData, amount: number, type: 'choke' | 'spread'): ImageData => {
    const width = imageData.width;
    const height = imageData.height;
    const pixels = imageData.data;
    const result = new ImageData(width, height);
    const resultPixels = result.data;
    
    // Simple morphological operation
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        let maxValue = 0;
        
        // Sample surrounding pixels
        for (let dy = -amount; dy <= amount; dy++) {
          for (let dx = -amount; dx <= amount; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nidx = (ny * width + nx) * 4;
              const value = pixels[nidx];
              if (type === 'spread') {
                maxValue = Math.max(maxValue, value);
              } else {
                // Choke - shrink the image
                if (value > 0) maxValue = 255;
              }
            }
          }
        }
        
        if (type === 'spread') {
          resultPixels[idx] = maxValue;
          resultPixels[idx + 1] = maxValue;
          resultPixels[idx + 2] = maxValue;
        } else {
          resultPixels[idx] = maxValue > 0 ? 255 : 0;
          resultPixels[idx + 1] = maxValue > 0 ? 255 : 0;
          resultPixels[idx + 2] = maxValue > 0 ? 255 : 0;
        }
        resultPixels[idx + 3] = 255;
      }
    }
    
    return result;
  };

  // Advanced halftone with multiple dot shapes
  const applyAdvancedHalftone = (
    imageData: ImageData,
    frequency: number,
    angle: number,
    shape: 'dot' | 'ellipse' | 'line' | 'square',
    stochastic: boolean = false
  ): ImageData => {
    if (stochastic) {
      return applyStochasticHalftone(imageData, frequency);
    }
    
    const width = imageData.width;
    const height = imageData.height;
    const pixels = imageData.data;
    const result = new ImageData(width, height);
    const resultPixels = result.data;
    
    const angleRad = angle * Math.PI / 180;
    const period = width / frequency;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const intensity = pixels[idx];
        
        const xRot = x * Math.cos(angleRad) - y * Math.sin(angleRad);
        const yRot = x * Math.sin(angleRad) + y * Math.cos(angleRad);
        
        const spotX = ((xRot % period) + period) % period / period;
        const spotY = ((yRot % period) + period) % period / period;
        
        let spotValue = 0;
        const threshold = (255 - intensity) / 255;
        
        switch(shape) {
          case 'dot': {
            const dx = spotX - 0.5;
            const dy = spotY - 0.5;
            const distance = Math.sqrt(dx*dx + dy*dy) * 2;
            spotValue = Math.max(0, 1 - Math.min(1, distance));
            break;
          }
          case 'ellipse': {
            const dx = (spotX - 0.5) * 1.5;
            const dy = spotY - 0.5;
            const distance = Math.sqrt(dx*dx + dy*dy);
            spotValue = Math.max(0, 1 - Math.min(1, distance));
            break;
          }
          case 'line': {
            spotValue = 1 - spotX;
            break;
          }
          case 'square': {
            const size = Math.min(spotX, spotY);
            spotValue = 1 - size * 2;
            break;
          }
        }
        
        const value = spotValue < threshold ? 0 : 255;
        
        resultPixels[idx] = value;
        resultPixels[idx + 1] = value;
        resultPixels[idx + 2] = value;
        resultPixels[idx + 3] = 255;
      }
    }
    
    return result;
  };

  // Stochastic/FM screening (like Photoshop's stochastic)
  const applyStochasticHalftone = (imageData: ImageData, frequency: number): ImageData => {
    const width = imageData.width;
    const height = imageData.height;
    const pixels = imageData.data;
    const result = new ImageData(width, height);
    const resultPixels = result.data;
    
    // Use blue noise pattern
    const seed = 12345;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const intensity = pixels[idx];
        
        // Generate pseudo-random value
        const random = ((Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453) % 1 + 1) % 1;
        const threshold = (255 - intensity) / 255;
        
        const value = random < threshold ? 0 : 255;
        
        resultPixels[idx] = value;
        resultPixels[idx + 1] = value;
        resultPixels[idx + 2] = value;
        resultPixels[idx + 3] = 255;
      }
    }
    
    return result;
  };

  // Professional CMYK separation with all adjustments
  const generateCmykSeparations = (imageData: ImageData) => {
    const width = imageData.width;
    const height = imageData.height;
    const pixels = imageData.data;
    
    // Initialize channels
    const channels = {
      c: new ImageData(width, height),
      m: new ImageData(width, height),
      y: new ImageData(width, height),
      k: new ImageData(width, height)
    };
    
    const channelData = {
      c: channels.c.data,
      m: channels.m.data,
      y: channels.y.data,
      k: channels.k.data
    };
    
    // Convert each pixel
    for (let i = 0; i < pixels.length; i += 4) {
      const cmyk = rgbToCmykAdvanced(
        pixels[i], pixels[i + 1], pixels[i + 2],
        separationMethod,
        blackGeneration,
        totalInkLimit
      );
      
      channelData.c[i] = 255 - (cmyk.c * 2.55);
      channelData.c[i + 1] = 255 - (cmyk.c * 2.55);
      channelData.c[i + 2] = 255 - (cmyk.c * 2.55);
      channelData.c[i + 3] = 255;
      
      channelData.m[i] = 255 - (cmyk.m * 2.55);
      channelData.m[i + 1] = 255 - (cmyk.m * 2.55);
      channelData.m[i + 2] = 255 - (cmyk.m * 2.55);
      channelData.m[i + 3] = 255;
      
      channelData.y[i] = 255 - (cmyk.y * 2.55);
      channelData.y[i + 1] = 255 - (cmyk.y * 2.55);
      channelData.y[i + 2] = 255 - (cmyk.y * 2.55);
      channelData.y[i + 3] = 255;
      
      channelData.k[i] = 255 - (cmyk.k * 2.55);
      channelData.k[i + 1] = 255 - (cmyk.k * 2.55);
      channelData.k[i + 2] = 255 - (cmyk.k * 2.55);
      channelData.k[i + 3] = 255;
    }
    
    // Create layers with professional settings
    const cmykLayers: SeparationLayer[] = [
      {
        id: 'cyan',
        name: 'Cyan',
        color: '#00FFFF',
        cmyk: { c: 100, m: 0, y: 0, k: 0 },
        rgb: { r: 0, g: 255, b: 255 },
        imageData: channels.c,
        processedData: channels.c,
        type: 'process',
        percentage: 25,
        settings: {
          curves: [],
          levels: { black: 0, gamma: 1, white: 255 },
          threshold: 128,
          choke: 0,
          spread: 0,
          underbase: false,
          highlight: false,
          halftone: { frequency: 45, angle: 75, shape: 'dot', stochastic: false }
        }
      },
      {
        id: 'magenta',
        name: 'Magenta',
        color: '#FF00FF',
        cmyk: { c: 0, m: 100, y: 0, k: 0 },
        rgb: { r: 255, g: 0, b: 255 },
        imageData: channels.m,
        processedData: channels.m,
        type: 'process',
        percentage: 25,
        settings: {
          curves: [],
          levels: { black: 0, gamma: 1, white: 255 },
          threshold: 128,
          choke: 0,
          spread: 0,
          underbase: false,
          highlight: false,
          halftone: { frequency: 45, angle: 15, shape: 'dot', stochastic: false }
        }
      },
      {
        id: 'yellow',
        name: 'Yellow',
        color: '#FFFF00',
        cmyk: { c: 0, m: 0, y: 100, k: 0 },
        rgb: { r: 255, g: 255, b: 0 },
        imageData: channels.y,
        processedData: channels.y,
        type: 'process',
        percentage: 25,
        settings: {
          curves: [],
          levels: { black: 0, gamma: 1, white: 255 },
          threshold: 128,
          choke: 0,
          spread: 0,
          underbase: false,
          highlight: false,
          halftone: { frequency: 45, angle: 0, shape: 'dot', stochastic: false }
        }
      },
      {
        id: 'black',
        name: 'Black',
        color: '#000000',
        cmyk: { c: 0, m: 0, y: 0, k: 100 },
        rgb: { r: 0, g: 0, b: 0 },
        imageData: channels.k,
        processedData: channels.k,
        type: 'process',
        percentage: 25,
        settings: {
          curves: [],
          levels: { black: 0, gamma: 1, white: 255 },
          threshold: 128,
          choke: 0,
          spread: 0,
          underbase: false,
          highlight: false,
          halftone: { frequency: 45, angle: 45, shape: 'dot', stochastic: false }
        }
      }
    ];
    
    // Add underbase if printing on dark
    if (printOnDark) {
      const underbaseData = createUnderbase(imageData, underbaseWhite);
      cmykLayers.push({
        id: 'underbase',
        name: 'Underbase White',
        color: '#FFFFFF',
        cmyk: { c: 0, m: 0, y: 0, k: 0 },
        rgb: { r: 255, g: 255, b: 255 },
        imageData: underbaseData,
        processedData: underbaseData,
        type: 'underbase',
        percentage: 15,
        settings: {
          curves: [],
          levels: { black: 0, gamma: 1, white: 255 },
          threshold: 128,
          choke: 2,
          spread: 0,
          underbase: true,
          highlight: false,
          halftone: { frequency: 45, angle: 22.5, shape: 'dot', stochastic: false }
        }
      });
    }
    
    setSeparations(cmykLayers);
    setIsProcessing(false);
  };

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
        
        const canvas = originalCanvasRef.current;
        if (!canvas) return;
        
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        
        generateCmykSeparations(imageData);
      };
    };
    
    reader.readAsDataURL(file);
  };

  const processLayer = (layer: SeparationLayer): SeparationLayer => {
    if (!layer.imageData) return layer;
    
    let processed = layer.imageData;
    
    // Apply curves
    if (layer.settings.curves.length > 0) {
      processed = applyCurves(processed, layer.settings.curves);
    }
    
    // Apply levels
    if (layer.settings.levels.black !== 0 || layer.settings.levels.gamma !== 1 || layer.settings.levels.white !== 255) {
      processed = applyLevels(processed, layer.settings.levels.black, layer.settings.levels.gamma, layer.settings.levels.white);
    }
    
    // Apply trapping
    if (simulateTrapping) {
      if (layer.type === 'underbase' && layer.settings.choke > 0) {
        processed = applyTrapping(processed, layer.settings.choke, 'choke');
      } else if (layer.settings.spread > 0) {
        processed = applyTrapping(processed, layer.settings.spread, 'spread');
      }
    }
    
    // Apply halftone
    if (outputMode !== 'grayscale') {
      processed = applyAdvancedHalftone(
        processed,
        layer.settings.halftone.frequency,
        layer.settings.halftone.angle,
        layer.settings.halftone.shape,
        layer.settings.halftone.stochastic
      );
    }
    
    return { ...layer, processedData: processed };
  };

  const downloadSeparation = (layer: SeparationLayer, index: number) => {
    if (!layer.processedData) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = layer.processedData.width;
    canvas.height = layer.processedData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.putImageData(layer.processedData, 0, 0);
    
    const link = document.createElement('a');
    link.download = `separation-${layer.id}-${meshCount}mesh-${outputDPI}dpi.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const renderPreview = (layer: SeparationLayer): string | null => {
    if (!layer.processedData) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = layer.processedData.width;
    canvas.height = layer.processedData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.putImageData(layer.processedData, 0, 0);
    return canvas.toDataURL();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // State for output mode
  const [outputMode, setOutputMode] = useState<'grayscale' | 'halftone'>('halftone');

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <canvas ref={originalCanvasRef} className="hidden" />
      <canvas ref={previewCanvasRef} className="hidden" />
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Professional Color Separator</h1>
        <p className="text-gray-600">Photoshop-quality color separations for screen printing</p>
      </div>

      {/* Professional Controls */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
          <button
            onClick={triggerFileInput}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Upload Artwork'}
          </button>
          
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('process')}
              className={`px-4 py-2 rounded-lg ${activeTab === 'process' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Process Color
            </button>
            <button
              onClick={() => setActiveTab('spot')}
              className={`px-4 py-2 rounded-lg ${activeTab === 'spot' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Spot Colors
            </button>
            <button
              onClick={() => setActiveTab('output')}
              className={`px-4 py-2 rounded-lg ${activeTab === 'output' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Output Settings
            </button>
          </div>
        </div>

        {/* Process Color Settings */}
        {activeTab === 'process' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Separation Method</label>
              <select
                value={separationMethod}
                onChange={(e) => setSeparationMethod(e.target.value as any)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="photoshop">Photoshop Style</option>
                <option value="gcr">GCR (Gray Component Replacement)</option>
                <option value="ucr">UCR (Under Color Removal)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Black Generation: {blackGeneration}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={blackGeneration}
                onChange={(e) => setBlackGeneration(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Total Ink Limit: {totalInkLimit}%</label>
              <input
                type="range"
                min="200"
                max="350"
                value={totalInkLimit}
                onChange={(e) => setTotalInkLimit(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Screen printing typical: 280-300%</p>
            </div>
          </div>
        )}

        {/* Output Settings */}
        {activeTab === 'output' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Output DPI</label>
              <select
                value={outputDPI}
                onChange={(e) => setOutputDPI(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="150">150 DPI (Low Res)</option>
                <option value="300">300 DPI (Standard)</option>
                <option value="600">600 DPI (High Res)</option>
                <option value="1200">1200 DPI (Ultra)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Mesh Count: {meshCount}</label>
              <input
                type="range"
                min="110"
                max="355"
                step="5"
                value={meshCount}
                onChange={(e) => setMeshCount(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500">Recommended LPI: {Math.floor(meshCount / 5)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Halftone Shape</label>
              <select
                value={separations[0]?.settings.halftone.shape || 'dot'}
                onChange={(e) => {
                  setSeparations(prev => prev.map(layer => ({
                    ...layer,
                    settings: {
                      ...layer.settings,
                      halftone: { ...layer.settings.halftone, shape: e.target.value as any }
                    }
                  })));
                }}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="dot">Elliptical Dot</option>
                <option value="ellipse">Elliptical Dot</option>
                <option value="square">Square Dot</option>
                <option value="line">Line Screen</option>
              </select>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={printOnDark}
                  onChange={(e) => setPrintOnDark(e.target.checked)}
                />
                <span>Print on Dark Garments</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={simulateTrapping}
                  onChange={(e) => setSimulateTrapping(e.target.checked)}
                />
                <span>Apply Trapping</span>
              </label>
            </div>
            
            {printOnDark && (
              <div>
                <label className="block text-sm font-medium mb-1">Underbase Opacity: {underbaseWhite}%</label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={underbaseWhite}
                  onChange={(e) => setUnderbaseWhite(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {originalImage && separations.length > 0 && (
        <div className="space-y-8">
          {/* Original Artwork */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Original Artwork</h3>
            <div className="relative w-full" style={{ maxHeight: '400px' }}>
              <NextImage
                src={originalImage}
                alt="Original"
                width={originalDimensions.width}
                height={originalDimensions.height}
                className="object-contain max-h-[400px] w-auto mx-auto"
                unoptimized={true}
              />
            </div>
          </div>

          {/* Professional Tip */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Professional Tips</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• {separationMethod.toUpperCase()} separation provides better detail than basic CMYK</li>
              <li>• For dark garments, underbase white is automatically generated</li>
              <li>• Halftone LPI should be {Math.floor(meshCount / 5)} for {meshCount} mesh screens</li>
              <li>• Standard angles: Cyan 75°, Magenta 15°, Yellow 0°, Black 45°</li>
              <li>• Trapping prevents gaps between colors during registration</li>
            </ul>
          </div>

          {/* Separations Grid */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Color Separations ({separations.length} screens)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {separations.map((layer, index) => {
                const preview = renderPreview(layer);
                
                return (
                  <div key={layer.id} className="border rounded-lg overflow-hidden">
                    <div 
                      className="p-3 text-white font-medium"
                      style={{ backgroundColor: layer.color }}
                    >
                      <div className="flex justify-between items-center">
                        <span>{layer.name}</span>
                        <span className="text-xs bg-black bg-opacity-30 px-2 py-1 rounded">
                          {layer.type === 'underbase' ? 'Underbase' : 'Screen'}
                        </span>
                      </div>
                      <div className="text-xs mt-1">
                        {layer.type === 'process' && (
                          <>CMYK: {layer.cmyk.c}%, {layer.cmyk.m}%, {layer.cmyk.y}%, {layer.cmyk.k}%</>
                        )}
                        {layer.type === 'underbase' && (
                          <>Opacity: {underbaseWhite}% | Mesh: {meshCount}</>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-gray-100 p-2">
                      {preview && (
                        <div className="relative" style={{ aspectRatio: '1/1', maxHeight: '200px' }}>
                          <NextImage
                            src={preview}
                            alt={layer.name}
                            fill
                            className="object-contain"
                            unoptimized={true}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3 bg-gray-50 space-y-2">
                      <div className="text-sm text-gray-600">
                        {layer.type === 'process' && (
                          <>Angle: {layer.settings.halftone.angle}° | LPI: {layer.settings.halftone.frequency}</>
                        )}
                        {layer.type === 'underbase' && (
                          <>Choke: {layer.settings.choke}px to prevent overlap</>
                        )}
                      </div>
                      
                      <button
                        onClick={() => downloadSeparation(layer, index)}
                        className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Download {layer.name} Separation
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
        }
