"use client";

import React, { useState, useRef, useEffect } from 'react';

interface ColorLayer {
  id: string;
  name: string;
  hex: string;
  rgb: string;
  cmyk: string;
  image: string;
  percentage: number;
  pixelCount: number;
  isSpot: boolean;
  underbase: boolean;
  choke: number;
  spread: number;
  halftone: {
    enabled: boolean;
    angle: number;
    frequency: number;
    shape: 'round' | 'ellipse' | 'diamond' | 'square' | 'line';
  };
}

interface SeparationSettings {
  colorCount: number;
  colorModel: 'auto' | 'spot' | 'process';
  underbaseColor: string;
  underbaseChoke: number;
  halftoneEnabled: boolean;
  halftoneFrequency: number;
  halftoneAngles: number[];
  trapSize: number;
  blackPlate: boolean;
  whiteUnderbase: boolean;
  minimumDot: number;
}

const SilkScreenSeparator: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [colorLayers, setColorLayers] = useState<ColorLayer[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [previewMode, setPreviewMode] = useState<'composite' | 'separations' | 'underbase'>('separations');
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [showRegistration, setShowRegistration] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [settings, setSettings] = useState<SeparationSettings>({
    colorCount: 6,
    colorModel: 'spot',
    underbaseColor: '#FFFFFF',
    underbaseChoke: 2,
    halftoneEnabled: true,
    halftoneFrequency: 45,
    halftoneAngles: [15, 45, 75, 105, 135, 165],
    trapSize: 1,
    blackPlate: true,
    whiteUnderbase: true,
    minimumDot: 3
  });

  // CMYK conversion
  const rgbToCmyk = (r: number, g: number, b: number): string => {
    let c = 1 - (r / 255);
    let m = 1 - (g / 255);
    let y = 1 - (b / 255);
    let k = Math.min(c, m, y);
    
    if (k === 1) {
      c = m = y = 0;
    } else {
      c = (c - k) / (1 - k);
      m = (m - k) / (1 - k);
      y = (y - k) / (1 - k);
    }
    
    return `${Math.round(c * 100)}%, ${Math.round(m * 100)}%, ${Math.round(y * 100)}%, ${Math.round(k * 100)}%`;
  };

  // Color quantization for spot color separation
  const quantizeForSilkscreen = (r: number, g: number, b: number): string => {
    // More aggressive quantization for silkscreen to group similar colors
    const step = 32; // 8 levels per channel
    const qR = Math.round(r / step) * step;
    const qG = Math.round(g / step) * step;
    const qB = Math.round(b / step) * step;
    return `${qR},${qG},${qB}`;
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(x).toString(16).padStart(2, '0');
      return hex;
    }).join('');
  };

  // Apply halftone pattern to a layer
  const applyHalftone = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    colorData: Uint8ClampedArray,
    angle: number,
    frequency: number,
    shape: 'round' | 'ellipse' | 'diamond' | 'square' | 'line'
  ): ImageData => {
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    
    const angleRad = (angle * Math.PI) / 180;
    const cosAngle = Math.cos(angleRad);
    const sinAngle = Math.sin(angleRad);
    
    const cellSize = 25.4 / frequency; // mm per cell at 300 DPI approximation
    const pixelsPerCell = Math.max(4, Math.floor(cellSize * 11.8)); // 300 DPI = 11.8 px/mm
    
    for (let y = 0; y < height; y += pixelsPerCell) {
      for (let x = 0; x < width; x += pixelsPerCell) {
        // Calculate rotated coordinates
        const rx = x * cosAngle + y * sinAngle;
        const ry = -x * sinAngle + y * cosAngle;
        
        // Calculate dot size based on average intensity in cell
        let totalIntensity = 0;
        let count = 0;
        
        for (let dy = 0; dy < pixelsPerCell && y + dy < height; dy++) {
          for (let dx = 0; dx < pixelsPerCell && x + dx < width; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            const intensity = colorData[idx]; // Use red channel as intensity
            totalIntensity += intensity;
            count++;
          }
        }
        
        const avgIntensity = totalIntensity / count;
        const dotSize = (255 - avgIntensity) / 255 * pixelsPerCell * 0.8;
        
        // Draw halftone dot
        const cellCenterX = x + pixelsPerCell / 2;
        const cellCenterY = y + pixelsPerCell / 2;
        
        for (let dy = 0; dy < pixelsPerCell && y + dy < height; dy++) {
          for (let dx = 0; dx < pixelsPerCell && x + dx < width; dx++) {
            const px = x + dx;
            const py = y + dy;
            const idx = (py * width + px) * 4;
            
            const distFromCenter = Math.sqrt(
              Math.pow(px - cellCenterX, 2) + Math.pow(py - cellCenterY, 2)
            );
            
            let dotValue = 0;
            
            switch (shape) {
              case 'round':
                dotValue = distFromCenter <= dotSize / 2 ? 255 : 0;
                break;
              case 'ellipse':
                const rx = Math.abs(px - cellCenterX) / (dotSize * 0.6);
                const ry = Math.abs(py - cellCenterY) / (dotSize * 0.4);
                dotValue = (rx * rx + ry * ry) <= 1 ? 255 : 0;
                break;
              case 'diamond':
                const dDist = Math.abs(px - cellCenterX) + Math.abs(py - cellCenterY);
                dotValue = dDist <= dotSize ? 255 : 0;
                break;
              case 'square':
                dotValue = (Math.abs(px - cellCenterX) <= dotSize / 2 && 
                          Math.abs(py - cellCenterY) <= dotSize / 2) ? 255 : 0;
                break;
              case 'line':
                const linePos = ((px * cosAngle + py * sinAngle) % pixelsPerCell);
                dotValue = Math.abs(linePos - pixelsPerCell / 2) <= dotSize / 2 ? 255 : 0;
                break;
            }
            
            if (dotValue > 0) {
              data[idx] = colorData[idx];
              data[idx + 1] = colorData[idx + 1];
              data[idx + 2] = colorData[idx + 2];
              data[idx + 3] = dotValue;
            } else {
              data[idx + 3] = 0;
            }
          }
        }
      }
    }
    
    return imageData;
  };

  // Apply trapping (choke/spread)
  const applyTrapping = (
    layerData: Uint8ClampedArray,
    underbaseData: Uint8ClampedArray,
    width: number,
    height: number,
    trapSize: number,
    isChoke: boolean
  ): Uint8ClampedArray => {
    const result = new Uint8ClampedArray(layerData.length);
    
    for (let i = 0; i < layerData.length; i += 4) {
      result[i] = layerData[i];
      result[i + 1] = layerData[i + 1];
      result[i + 2] = layerData[i + 2];
      result[i + 3] = layerData[i + 3];
    }
    
    if (trapSize <= 0) return result;
    
    for (let y = trapSize; y < height - trapSize; y++) {
      for (let x = trapSize; x < width - trapSize; x++) {
        const idx = (y * width + x) * 4;
        
        if (isChoke && layerData[idx + 3] > 0) {
          // Choke: shrink the color
          let hasTransparentNeighbor = false;
          
          for (let dy = -trapSize; dy <= trapSize && !hasTransparentNeighbor; dy++) {
            for (let dx = -trapSize; dx <= trapSize; dx++) {
              const nIdx = ((y + dy) * width + (x + dx)) * 4;
              if (layerData[nIdx + 3] === 0) {
                hasTransparentNeighbor = true;
                break;
              }
            }
          }
          
          if (hasTransparentNeighbor) {
            result[idx + 3] = 0;
          }
        } else if (!isChoke && layerData[idx + 3] === 0) {
          // Spread: expand the color
          let hasColorNeighbor = false;
          
          for (let dy = -trapSize; dy <= trapSize && !hasColorNeighbor; dy++) {
            for (let dx = -trapSize; dx <= trapSize; dx++) {
              const nIdx = ((y + dy) * width + (x + dx)) * 4;
              if (layerData[nIdx + 3] > 0) {
                hasColorNeighbor = true;
                break;
              }
            }
          }
          
          if (hasColorNeighbor) {
            result[idx] = layerData[idx];
            result[idx + 1] = layerData[idx + 1];
            result[idx + 2] = layerData[idx + 2];
            result[idx + 3] = 255;
          }
        }
      }
    }
    
    return result;
  };

  const processImage = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.onload = async () => {
        setIsProcessing(true);
        setProgress(0);
        setProcessingStep('Loading image...');
        
        const canvas = document.createElement('canvas');
        const width = img.width;
        const height = img.height;
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (!ctx) return;
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, width, height);
        const pixels = imageData.data;
        
        setProcessingStep('Analyzing colors...');
        setProgress(10);
        
        // Find dominant colors
        const colorMap = new Map<string, { 
          r: number; 
          g: number; 
          b: number; 
          count: number;
          positions: number[];
        }>();
        
        const totalPixels = pixels.length / 4;
        
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];
          
          if (a === 0) continue;
          
          const colorKey = settings.colorModel === 'spot' 
            ? quantizeForSilkscreen(r, g, b)
            : `${r},${g},${b}`;
          
          if (!colorMap.has(colorKey)) {
            colorMap.set(colorKey, {
              r, g, b,
              count: 0,
              positions: []
            });
          }
          
          const colorData = colorMap.get(colorKey)!;
          colorData.count++;
          colorData.positions.push(i);
        }
        
        setProcessingStep('Creating spot color separations...');
        setProgress(30);
        
        // Sort and select top colors
        const sortedColors = Array.from(colorMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, settings.colorCount);
        
        // Create underbase layer first if enabled
        let underbaseLayer: ImageData | null = null;
        
        if (settings.whiteUnderbase) {
          setProcessingStep('Creating underbase layer...');
          
          const underbaseCanvas = document.createElement('canvas');
          underbaseCanvas.width = width;
          underbaseCanvas.height = height;
          const ubCtx = underbaseCanvas.getContext('2d');
          
          if (ubCtx) {
            const ubData = ubCtx.createImageData(width, height);
            
            for (let i = 0; i < pixels.length; i += 4) {
              if (pixels[i + 3] > 0) {
                ubData.data[i] = 255;
                ubData.data[i + 1] = 255;
                ubData.data[i + 2] = 255;
                ubData.data[i + 3] = 255;
              }
            }
            
            ubCtx.putImageData(ubData, 0, 0);
            underbaseLayer = ubCtx.getImageData(0, 0, width, height);
          }
        }
        
        setProcessingStep('Generating color plates...');
        setProgress(50);
        
        // Create color layers
        const layers: ColorLayer[] = [];
        const totalColors = sortedColors.length;
        
        for (let idx = 0; idx < sortedColors.length; idx++) {
          const colorInfo = sortedColors[idx];
          setProgress(50 + Math.floor((idx / totalColors) * 40));
          setProcessingStep(`Processing ${getColorName(colorInfo.r, colorInfo.g, colorInfo.b)} plate...`);
          
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
          
          // Fill matching pixels
          for (const position of colorInfo.positions) {
            layerData.data[position] = colorInfo.r;
            layerData.data[position + 1] = colorInfo.g;
            layerData.data[position + 2] = colorInfo.b;
            layerData.data[position + 3] = 255;
          }
          
          // Apply trapping if underbase exists
          if (underbaseLayer && idx > 0) {
            const trappedData = applyTrapping(
              layerData.data,
              underbaseLayer.data,
              width,
              height,
              settings.trapSize,
              true
            );
            
            for (let i = 0; i < trappedData.length; i++) {
              layerData.data[i] = trappedData[i];
            }
          }
          
          // Apply halftone if enabled
          if (settings.halftoneEnabled) {
            const halftoneAngle = settings.halftoneAngles[idx % settings.halftoneAngles.length];
            const halftoneData = applyHalftone(
              layerCtx,
              width,
              height,
              layerData.data,
              halftoneAngle,
              settings.halftoneFrequency,
              'ellipse'
            );
            
            layerCtx.putImageData(halftoneData, 0, 0);
          } else {
            layerCtx.putImageData(layerData, 0, 0);
          }
          
          const hexColor = rgbToHex(colorInfo.r, colorInfo.g, colorInfo.b);
          const percentage = (colorInfo.count / totalPixels) * 100;
          const colorName = getColorName(colorInfo.r, colorInfo.g, colorInfo.b);
          
          layers.push({
            id: `layer-${idx}`,
            name: `${colorName} Plate`,
            hex: hexColor,
            rgb: `${colorInfo.r}, ${colorInfo.g}, ${colorInfo.b}`,
            cmyk: rgbToCmyk(colorInfo.r, colorInfo.g, colorInfo.b),
            image: layerCanvas.toDataURL('image/png'),
            percentage,
            pixelCount: colorInfo.count,
            isSpot: settings.colorModel === 'spot',
            underbase: idx === 0 && settings.whiteUnderbase,
            choke: idx === 0 ? 0 : settings.trapSize,
            spread: 0,
            halftone: {
              enabled: settings.halftoneEnabled,
              angle: settings.halftoneAngles[idx % settings.halftoneAngles.length],
              frequency: settings.halftoneFrequency,
              shape: 'ellipse'
            }
          });
          
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        // Add underbase as separate layer if enabled
        if (settings.whiteUnderbase && underbaseLayer) {
          const underbaseCanvas = document.createElement('canvas');
          underbaseCanvas.width = width;
          underbaseCanvas.height = height;
          const ubCtx = underbaseCanvas.getContext('2d');
          
          if (ubCtx) {
            ubCtx.putImageData(underbaseLayer, 0, 0);
            
            layers.unshift({
              id: 'underbase',
              name: 'White Underbase',
              hex: '#FFFFFF',
              rgb: '255, 255, 255',
              cmyk: '0%, 0%, 0%, 0%',
              image: underbaseCanvas.toDataURL('image/png'),
              percentage: 100,
              pixelCount: totalPixels,
              isSpot: true,
              underbase: true,
              choke: 0,
              spread: settings.underbaseChoke,
              halftone: {
                enabled: false,
                angle: 0,
                frequency: settings.halftoneFrequency,
                shape: 'round'
              }
            });
          }
        }
        
        setOriginalImage(canvas.toDataURL('image/png'));
        setColorLayers(layers);
        setProcessingStep('Complete!');
        setProgress(100);
        setIsProcessing(false);
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.readAsDataURL(file);
  };

  const getColorName = (r: number, g: number, b: number): string => {
    // Simple color naming for silkscreen plates
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    if (max - min < 30) {
      if (max < 50) return 'Black';
      if (max > 200) return 'White';
      return 'Gray';
    }
    
    if (r > g && r > b) return r > 200 ? 'Red' : 'Dark Red';
    if (g > r && g > b) return g > 200 ? 'Green' : 'Dark Green';
    if (b > r && b > g) return b > 200 ? 'Blue' : 'Dark Blue';
    if (r > 200 && g > 200) return 'Yellow';
    if (r > 200 && b > 200) return 'Magenta';
    if (g > 200 && b > 200) return 'Cyan';
    
    return 'Spot Color';
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    }
  };

  const downloadLayer = (layer: ColorLayer) => {
    const link = document.createElement('a');
    const filename = `${layer.name.toLowerCase().replace(/\s+/g, '_')}.png`;
    link.download = filename;
    link.href = layer.image;
    link.click();
  };

  const downloadAllPlates = async () => {
    for (const layer of colorLayers) {
      await new Promise(resolve => setTimeout(resolve, 200));
      downloadLayer(layer);
    }
  };

  const generatePrintSheet = () => {
    // Create a print sheet with all separations and registration marks
    const canvas = document.createElement('canvas');
    const padding = 50;
    const cols = 3;
    const rows = Math.ceil(colorLayers.length / cols);
    const cellWidth = 300;
    const cellHeight = 400;
    
    canvas.width = cols * cellWidth + (cols + 1) * padding;
    canvas.height = rows * cellHeight + (rows + 1) * padding;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw registration marks
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    
    // Corner registration marks
    const regSize = 20;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding + regSize, padding);
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + regSize);
    ctx.stroke();
    
    // Draw each separation
    colorLayers.forEach((layer, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = padding + col * (cellWidth + padding);
      const y = padding + row * (cellHeight + padding);
      
      // Load and draw the layer image
      const img = new Image();
      img.src = layer.image;
      
      img.onload = () => {
        const scale = Math.min(cellWidth / img.width, (cellHeight - 60) / img.height);
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        const drawX = x + (cellWidth - drawWidth) / 2;
        const drawY = y + 30;
        
        // Draw checkerboard for transparency
        const checkerSize = 8;
        ctx.fillStyle = '#CCCCCC';
        ctx.fillRect(drawX, drawY, drawWidth, drawHeight);
        
        for (let cy = 0; cy < drawHeight; cy += checkerSize) {
          for (let cx = 0; cx < drawWidth; cx += checkerSize) {
            if ((cy / checkerSize + cx / checkerSize) % 2 === 0) {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(drawX + cx, drawY + cy, checkerSize, checkerSize);
            }
          }
        }
        
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        
        // Draw color swatch
        ctx.fillStyle = layer.hex;
        ctx.fillRect(x, y, 30, 30);
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(x, y, 30, 30);
        
        // Draw text info
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.fillText(layer.name, x + 40, y + 20);
        ctx.font = '10px Arial';
        ctx.fillText(`${layer.percentage.toFixed(1)}% coverage`, x + 40, y + 35);
        ctx.fillText(`Angle: ${layer.halftone.angle}°`, x + 40, y + 50);
      };
    });
    
    // Download the print sheet
    setTimeout(() => {
      const link = document.createElement('a');
      link.download = 'silkscreen_print_sheet.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }, 1000);
  };

  const resetImage = () => {
    setOriginalImage(null);
    setColorLayers([]);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Silkscreen Color Separator</h1>
        <p className="text-gray-600">Professional spot color separation for screen printing</p>
      </div>

      {!originalImage && (
        <div>
          {/* Settings Panel */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Separation Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Colors
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={settings.colorCount}
                  onChange={(e) => setSettings({...settings, colorCount: Number(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color Model
                </label>
                <select
                  value={settings.colorModel}
                  onChange={(e) => setSettings({...settings, colorModel: e.target.value as 'auto' | 'spot' | 'process'})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="spot">Spot Colors</option>
                  <option value="process">Process (CMYK)</option>
                  <option value="auto">Auto-Detect</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Halftone Frequency (LPI)
                </label>
                <input
                  type="number"
                  min="20"
                  max="85"
                  value={settings.halftoneFrequency}
                  onChange={(e) => setSettings({...settings, halftoneFrequency: Number(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trap Size (pixels)
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={settings.trapSize}
                  onChange={(e) => setSettings({...settings, trapSize: Number(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Underbase Choke (pixels)
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={settings.underbaseChoke}
                  onChange={(e) => setSettings({...settings, underbaseChoke: Number(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.halftoneEnabled}
                  onChange={(e) => setSettings({...settings, halftoneEnabled: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm">Enable Halftones</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.whiteUnderbase}
                  onChange={(e) => setSettings({...settings, whiteUnderbase: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm">White Underbase (for dark garments)</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.blackPlate}
                  onChange={(e) => setSettings({...settings, blackPlate: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm">Separate Black Plate</span>
              </label>
            </div>
          </div>
          
          {/* Upload Area */}
          <div
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
            <div className="text-4xl mb-4">🖨️</div>
            <p className="text-gray-600 mb-2">Upload artwork for silkscreen separation</p>
            <p className="text-sm text-gray-400">Supports PNG, JPG, TIFF</p>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="text-center py-8 bg-white rounded-lg shadow-md">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2.5 mb-4">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-gray-600">{processingStep}</p>
          <p className="text-sm text-gray-500 mt-2">{progress}% complete</p>
        </div>
      )}

      {originalImage && !isProcessing && (
        <div>
          {/* Controls */}
          <div className="flex flex-wrap justify-between gap-3 mb-4">
            <div className="flex gap-2">
              <button
                onClick={resetImage}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                New Separation
              </button>
              
              <button
                onClick={downloadAllPlates}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Download All Plates
              </button>
              
              <button
                onClick={generatePrintSheet}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Generate Print Sheet
              </button>
            </div>
            
            <div className="flex gap-2">
              <select
                value={previewMode}
                onChange={(e) => setPreviewMode(e.target.value as any)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="separations">View Separations</option>
                <option value="composite">Composite View</option>
                <option value="underbase">Underbase Only</option>
              </select>
              
              <label className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg">
                <input
                  type="checkbox"
                  checked={showRegistration}
                  onChange={(e) => setShowRegistration(e.target.checked)}
                />
                <span className="text-sm">Show Registration Marks</span>
              </label>
            </div>
          </div>
          
          {/* Print Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{colorLayers.length}</p>
                <p className="text-sm text-gray-600">Total Screens</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {colorLayers.filter(l => l.underbase).length}
                </p>
                <p className="text-sm text-gray-600">Underbase</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {settings.halftoneFrequency} LPI
                </p>
                <p className="text-sm text-gray-600">Halftone</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {settings.trapSize}px
                </p>
                <p className="text-sm text-gray-600">Trapping</p>
              </div>
            </div>
          </div>
          
          {/* Color Plates Grid */}
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Screen Printing Plates ({colorLayers.length} separations)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {colorLayers.map((layer, index) => (
              <div 
                key={layer.id} 
                className={`bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer ${
                  selectedLayer === layer.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedLayer(layer.id)}
              >
                {/* Plate Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div 
                    className="w-8 h-8 rounded border-2 border-gray-300"
                    style={{ backgroundColor: layer.hex }}
                  ></div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{layer.name}</h4>
                    <p className="text-xs text-gray-500">
                      {layer.underbase ? 'UNDERBASE' : `Screen ${index + 1}`}
                    </p>
                  </div>
                  {layer.underbase && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                      Base
                    </span>
                  )}
                </div>
                
                {/* Plate Preview */}
                <div className="relative bg-gray-200 rounded-lg overflow-hidden mb-3" 
                     style={{ minHeight: '150px' }}>
                  {/* Checkerboard background */}
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: `linear-gradient(45deg, #808080 25%, transparent 25%),
                                    linear-gradient(-45deg, #808080 25%, transparent 25%),
                                    linear-gradient(45deg, transparent 75%, #808080 75%),
                                    linear-gradient(-45deg, transparent 75%, #808080 75%)`,
                    backgroundSize: '16px 16px',
                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
                  }}></div>
                  
                  <img 
                    src={layer.image} 
                    alt={layer.name}
                    className="relative w-full object-contain"
                  />
                  
                  {showRegistration && (
                    <>
                      {/* Registration marks */}
                      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-black"></div>
                      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-black"></div>
                      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-black"></div>
                      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-black"></div>
                    </>
                  )}
                </div>
                
                {/* Plate Info */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Coverage:</span>
                    <span className="font-semibold">{layer.percentage.toFixed(1)}%</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Color:</span>
                    <span className="font-mono">{layer.hex} / {layer.cmyk}</span>
                  </div>
                  
                  {layer.halftone.enabled && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Halftone:</span>
                        <span>{layer.halftone.angle}° @ {layer.halftone.frequency} LPI</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dot Shape:</span>
                        <span className="capitalize">{layer.halftone.shape}</span>
                      </div>
                    </>
                  )}
                  
                  {(layer.choke > 0 || layer.spread > 0) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trapping:</span>
                      <span>
                        {layer.choke > 0 && `Choke ${layer.choke}px`}
                        {layer.spread > 0 && `Spread ${layer.spread}px`}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadLayer(layer);
                    }}
                    className="flex-1 px-3 py-1.5 bg-black text-white text-xs rounded hover:bg-gray-800"
                  >
                    Download Plate
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Toggle layer visibility in composite view
                    }}
                    className="px-3 py-1.5 border text-xs rounded hover:bg-gray-50"
                  >
                    👁️
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Print Instructions */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-3">Print Instructions</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Print Order:</strong> {colorLayers.filter(l => l.underbase).length > 0 ? 'Underbase → ' : ''}{colorLayers.filter(l => !l.underbase).map((l, i) => `Color ${i + 1}`).join(' → ')}</p>
              <p><strong>Mesh Count:</strong> Underbase: 110-156, Colors: 156-230</p>
              <p><strong>Squeegee:</strong> 70 durometer for underbase, 80 for colors</p>
              <p><strong>Off-Contact:</strong> 1-2mm</p>
              <p><strong>Flash:</strong> Between underbase and first color</p>
              {settings.halftoneEnabled && (
                <p><strong>Halftone Angles:</strong> {colorLayers.filter(l => !l.underbase).map(l => `${l.name}: ${l.halftone.angle}°`).join(', ')}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SilkScreenSeparator;
