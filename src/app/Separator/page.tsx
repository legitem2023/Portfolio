// components/SilkScreenColorSeparator.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import NextImage from 'next/image';

interface ColorLayer {
  color: string;
  cmyk: { c: number; m: number; y: number; k: number };
  rgb: { r: number; g: number; b: number };
  imageData: ImageData | null;
  bitmapImageData: ImageData | null; // For halftone/bitmap conversion
  percentage: number;
  pixelCount: number;
  isDominant: boolean;
  index: number;
  separationType: 'cmyk' | 'rgb' | 'spot';
  halftoneSettings?: {
    frequency: number;
    angle: number;
    shape: 'dot' | 'line' | 'square';
  };
}

interface ColorCluster {
  r: number;
  g: number;
  b: number;
  c: number;
  m: number;
  y: number;
  k: number;
  count: number;
  hex: string;
  percentage: number;
}

export default function SilkScreenColorSeparator() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [cmykLayers, setCmykLayers] = useState<ColorLayer[]>([]);
  const [dominantLayers, setDominantLayers] = useState<ColorLayer[]>([]);
  const [allColorLayers, setAllColorLayers] = useState<ColorLayer[]>([]);
  const [allColors, setAllColors] = useState<ColorCluster[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoColorCount, setAutoColorCount] = useState<number>(0);
  const [manualColorCount, setManualColorCount] = useState<number>(4);
  const [similarityThreshold, setSimilarityThreshold] = useState(30);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [useAutoDetect, setUseAutoDetect] = useState(true);
  const [showAllColors, setShowAllColors] = useState(false);
  const [minPercentage, setMinPercentage] = useState(0.5);
  const [selectedColorForLayer, setSelectedColorForLayer] = useState<ColorCluster | null>(null);
  const [compositeImage, setCompositeImage] = useState<string | null>(null);
  const [separationMode, setSeparationMode] = useState<'cmyk' | 'spot' | 'simulated'>('cmyk');
  const [outputMode, setOutputMode] = useState<'grayscale' | 'bitmap' | 'halftone'>('grayscale');
  const [halftoneFrequency, setHalftoneFrequency] = useState(20); // LPI
  const [halftoneAngle, setHalftoneAngle] = useState(45); // Degrees
  const [simulateTransparency, setSimulateTransparency] = useState(true);
  const [registrationMarks, setRegistrationMarks] = useState(true);
  const [filmPositive, setFilmPositive] = useState(false); // Invert for film output
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const layerCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const rgbToCmyk = (r: number, g: number, b: number): { c: number; m: number; y: number; k: number } => {
    let c = 1 - (r / 255);
    let m = 1 - (g / 255);
    let y = 1 - (b / 255);
    let k = Math.min(c, m, y);
    
    if (k === 1) {
      return { c: 0, m: 0, y: 0, k: 100 };
    }
    
    c = ((c - k) / (1 - k)) * 100;
    m = ((m - k) / (1 - k)) * 100;
    y = ((y - k) / (1 - k)) * 100;
    k = k * 100;
    
    return {
      c: Math.round(c),
      m: Math.round(m),
      y: Math.round(y),
      k: Math.round(k)
    };
  };

  // Create halftone pattern
  const applyHalftone = (imageData: ImageData, frequency: number, angle: number, shape: 'dot' | 'line' | 'square' = 'dot'): ImageData => {
    const width = imageData.width;
    const height = imageData.height;
    const sourcePixels = imageData.data;
    const resultData = new ImageData(width, height);
    const resultPixels = resultData.data;
    
    const angleRad = angle * Math.PI / 180;
    const period = width / frequency;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const intensity = sourcePixels[idx]; // Grayscale intensity
        
        // Rotate coordinates for halftone screen angle
        const xRot = x * Math.cos(angleRad) - y * Math.sin(angleRad);
        const yRot = x * Math.sin(angleRad) + y * Math.cos(angleRad);
        
        // Calculate halftone spot position
        const spotX = (xRot % period) / period;
        const spotY = (yRot % period) / period;
        
        let spotValue = 0;
        
        switch(shape) {
          case 'dot': {
            // Circular dot
            const centerX = 0.5;
            const centerY = 0.5;
            const dx = spotX - centerX;
            const dy = spotY - centerY;
            const distance = Math.sqrt(dx*dx + dy*dy) * 2;
            spotValue = 1 - Math.min(1, distance);
            break;
          }
          case 'square': {
            // Square dot
            spotValue = Math.min(spotX, spotY) * 2;
            break;
          }
          case 'line': {
            // Line screen
            spotValue = spotX;
            break;
          }
        }
        
        // Determine if pixel should be black based on intensity
        const threshold = (255 - intensity) / 255;
        const value = spotValue < threshold ? 0 : 255;
        
        resultPixels[idx] = value;
        resultPixels[idx + 1] = value;
        resultPixels[idx + 2] = value;
        resultPixels[idx + 3] = 255;
      }
    }
    
    return resultData;
  };

  // Convert to bitmap (pure black and white)
  const convertToBitmap = (imageData: ImageData, threshold: number = 128): ImageData => {
    const width = imageData.width;
    const height = imageData.height;
    const sourcePixels = imageData.data;
    const resultData = new ImageData(width, height);
    const resultPixels = resultData.data;
    
    for (let i = 0; i < sourcePixels.length; i += 4) {
      const intensity = sourcePixels[i]; // Grayscale value
      const value = intensity > threshold ? 255 : 0;
      
      resultPixels[i] = value;
      resultPixels[i + 1] = value;
      resultPixels[i + 2] = value;
      resultPixels[i + 3] = 255;
    }
    
    return resultData;
  };

  // Add registration marks
  const addRegistrationMarks = (imageData: ImageData): ImageData => {
    const width = imageData.width;
    const height = imageData.height;
    const resultData = new ImageData(width, height);
    const resultPixels = resultData.data;
    const sourcePixels = imageData.data;
    
    // Copy original pixels
    for (let i = 0; i < sourcePixels.length; i++) {
      resultPixels[i] = sourcePixels[i];
    }
    
    const markSize = Math.min(width, height) * 0.02;
    const margin = markSize;
    
    // Add registration marks at corners
    const addMark = (x: number, y: number) => {
      for (let i = -markSize; i <= markSize; i++) {
        for (let j = -markSize; j <= markSize; j++) {
          const px = Math.floor(x + i);
          const py = Math.floor(y + j);
          if (px >= 0 && px < width && py >= 0 && py < height) {
            const idx = (py * width + px) * 4;
            if (Math.abs(i) <= 1 || Math.abs(j) <= 1 || Math.abs(i) === Math.abs(j)) {
              resultPixels[idx] = 0;
              resultPixels[idx + 1] = 0;
              resultPixels[idx + 2] = 0;
              resultPixels[idx + 3] = 255;
            }
          }
        }
      }
    };
    
    // Add marks at four corners
    addMark(margin, margin);
    addMark(width - margin, margin);
    addMark(margin, height - margin);
    addMark(width - margin, height - margin);
    
    return resultData;
  };

  const createCmykLayer = (sourceData: ImageData, channel: 'c' | 'm' | 'y' | 'k'): ImageData => {
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
      
      const cmyk = rgbToCmyk(r, g, b);
      let channelValue = 0;
      
      switch(channel) {
        case 'c': channelValue = cmyk.c; break;
        case 'm': channelValue = cmyk.m; break;
        case 'y': channelValue = cmyk.y; break;
        case 'k': channelValue = cmyk.k; break;
      }
      
      // Convert channel value to grayscale intensity
      let intensity = Math.round(255 * (1 - channelValue / 100));
      
      // Apply film positive inversion if needed
      if (filmPositive) {
        intensity = 255 - intensity;
      }
      
      layerPixels[i] = intensity;
      layerPixels[i + 1] = intensity;
      layerPixels[i + 2] = intensity;
      layerPixels[i + 3] = a;
    }
    
    return layerData;
  };

  const processLayerForOutput = (layer: ColorLayer): ColorLayer => {
    if (!layer.imageData) return layer;
    
    let processedImageData = layer.imageData;
    
    // Convert to grayscale if not already
    if (outputMode === 'bitmap') {
      processedImageData = convertToBitmap(processedImageData, 128);
    } else if (outputMode === 'halftone') {
      const angle = layer.separationType === 'cmyk' 
        ? getHalftoneAngleForChannel(layer.color)
        : halftoneAngle;
      processedImageData = applyHalftone(processedImageData, halftoneFrequency, angle, 'dot');
    }
    
    // Add registration marks
    if (registrationMarks) {
      processedImageData = addRegistrationMarks(processedImageData);
    }
    
    return {
      ...layer,
      imageData: processedImageData,
      bitmapImageData: processedImageData
    };
  };

  const getHalftoneAngleForChannel = (color: string): number => {
    // Standard screen printing angles
    switch(color) {
      case '#00FFFF': return 75; // Cyan
      case '#FF00FF': return 15; // Magenta
      case '#FFFF00': return 0;  // Yellow
      case '#000000': return 45; // Black
      default: return 45;
    }
  };

  const createSpotColorLayer = (
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
      
      // Calculate intensity based on color similarity
      let intensity = 0;
      if (colorDist <= threshold) {
        // Full intensity for exact matches
        intensity = 255;
      } else if (simulateTransparency && colorDist <= threshold * 2) {
        // Partial intensity for similar colors (creates transparency effect)
        intensity = Math.max(0, 255 * (1 - (colorDist - threshold) / threshold));
      }
      
      if (filmPositive) {
        intensity = 255 - intensity;
      }
      
      layerPixels[i] = intensity;
      layerPixels[i + 1] = intensity;
      layerPixels[i + 2] = intensity;
      layerPixels[i + 3] = intensity > 0 ? a : 0;
    }
    
    return layerData;
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
        processImage(img);
      };
    };
    
    reader.readAsDataURL(file);
  };

  const processImage = (img: HTMLImageElement) => {
    const canvas = originalCanvasRef.current;
    if (!canvas) return;

    canvas.width = img.width;
    canvas.height = img.height;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, img.width, img.height);
    
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    
    if (separationMode === 'cmyk') {
      generateCmykLayers(imageData);
    } else if (separationMode === 'spot') {
      extractSpotColors(imageData);
    } else if (separationMode === 'simulated') {
      generateSimulatedProcess(imageData);
    }
  };

  const generateCmykLayers = (imageData: ImageData) => {
    const channels: Array<{ key: 'c' | 'm' | 'y' | 'k'; name: string; color: string }> = [
      { key: 'c', name: 'Cyan', color: '#00FFFF' },
      { key: 'm', name: 'Magenta', color: '#FF00FF' },
      { key: 'y', name: 'Yellow', color: '#FFFF00' },
      { key: 'k', name: 'Black', color: '#000000' }
    ];

    let layers: ColorLayer[] = channels.map((channel, index) => {
      let layerImageData = createCmykLayer(imageData, channel.key);
      const cmykValues = channel.key === 'c' ? { c: 100, m: 0, y: 0, k: 0 } :
                         channel.key === 'm' ? { c: 0, m: 100, y: 0, k: 0 } :
                         channel.key === 'y' ? { c: 0, m: 0, y: 100, k: 0 } :
                         { c: 0, m: 0, y: 0, k: 100 };
      
      const layer: ColorLayer = {
        color: channel.color,
        cmyk: cmykValues,
        rgb: { r: 0, g: 0, b: 0 },
        imageData: layerImageData,
        bitmapImageData: null,
        percentage: 25,
        pixelCount: imageData.width * imageData.height,
        isDominant: true,
        index: index,
        separationType: 'cmyk'
      };
      
      // Apply output processing
      return processLayerForOutput(layer);
    });

    setCmykLayers(layers);
    setAllColorLayers(layers);
    setDominantLayers(layers);
    setIsProcessing(false);
  };

  const extractSpotColors = (imageData: ImageData) => {
    const pixels = imageData.data;
    
    // Collect all colors
    const colorMap = new Map<string, { count: number; r: number; g: number; b: number }>();
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      
      if (a < 10) continue;
      
      const quantized = {
        r: Math.round(r / 10) * 10,
        g: Math.round(g / 10) * 10,
        b: Math.round(b / 10) * 10
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
    
    const colorsWithPercentage = colorsArray.map(color => ({
      ...color,
      percentage: (color.count / totalPixels) * 100
    }));

    const mergedColors = mergeSimilarColors(colorsWithPercentage, similarityThreshold);
    
    setAllColors(mergedColors);
    
    // Get optimal number of spot colors
    let optimalColorCount: number;
    if (useAutoDetect) {
      optimalColorCount = detectOptimalColorCount(mergedColors);
      setAutoColorCount(optimalColorCount);
    } else {
      optimalColorCount = manualColorCount;
    }
    
    // Create layers for spot colors
    const layers: ColorLayer[] = mergedColors.slice(0, optimalColorCount).map((color, index) => {
      let layerImageData = createSpotColorLayer(imageData, color.r, color.g, color.b, similarityThreshold);
      const cmyk = rgbToCmyk(color.r, color.g, color.b);
      
      const layer: ColorLayer = {
        color: color.hex,
        cmyk: cmyk,
        rgb: { r: color.r, g: color.g, b: color.b },
        imageData: layerImageData,
        bitmapImageData: null,
        percentage: color.percentage,
        pixelCount: color.count,
        isDominant: true,
        index: index,
        separationType: 'spot'
      };
      
      return processLayerForOutput(layer);
    });
    
    setDominantLayers(layers);
    setAllColorLayers(layers);
    setIsProcessing(false);
  };

  const generateSimulatedProcess = (imageData: ImageData) => {
    // Simplified simulated process (similar to spot colors but with blending)
    extractSpotColors(imageData);
  };

  const detectOptimalColorCount = (colors: ColorCluster[]): number => {
    if (colors.length <= 2) return colors.length;
    
    const totalPixels = colors.reduce((sum, c) => sum + c.count, 0);
    
    // For screen printing, limit to reasonable number of screens
    let cumulativePercentage = 0;
    let optimalK = 4; // Start with 4 colors
    
    for (let i = 0; i < colors.length; i++) {
      cumulativePercentage += colors[i].percentage;
      if (cumulativePercentage >= 0.85) { // 85% coverage
        optimalK = Math.max(2, i + 1);
        break;
      }
    }
    
    // Screen printing practical limits
    return Math.min(optimalK, 8);
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
      const cmyk = rgbToCmyk(avgR, avgG, avgB);

      merged.push({
        r: avgR,
        g: avgG,
        b: avgB,
        c: cmyk.c,
        m: cmyk.m,
        y: cmyk.y,
        k: cmyk.k,
        count: totalCount,
        hex: rgbToHex(avgR, avgG, avgB),
        percentage: (totalCount / colors.reduce((sum, c) => sum + c.count, 0)) * 100
      });

      similarIndices.forEach(idx => used.add(idx));
    }

    return merged.sort((a, b) => b.count - a.count);
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
    const layerType = layer.separationType === 'cmyk' ? 'cmyk' : 'spot';
    const outputType = outputMode === 'halftone' ? 'halftone' : 'film';
    link.download = `screen-${layerType}-${index + 1}-${layer.color}-${outputType}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const downloadAllLayers = () => {
    layersToDisplay.forEach((layer, index) => {
      setTimeout(() => downloadLayer(layer, index), index * 100);
    });
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
      img.onload = () => processImage(img);
    }
  };

  useEffect(() => {
    if (originalImage && !isProcessing) {
      reprocessImage();
    }
  }, [useAutoDetect, manualColorCount, similarityThreshold, separationMode, outputMode, halftoneFrequency, filmPositive, registrationMarks]);

  const filteredAllColors = allColors.filter(color => color.percentage >= minPercentage);
  
  const layersToDisplay = separationMode === 'cmyk' ? cmykLayers :
                         (showAllColors ? allColorLayers : dominantLayers);

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

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    layers.forEach(layer => {
      if (layer.imageData) {
        const layerCanvas = document.createElement('canvas');
        layerCanvas.width = width;
        layerCanvas.height = height;
        const layerCtx = layerCanvas.getContext('2d');
        if (layerCtx) {
          layerCtx.putImageData(layer.imageData, 0, 0);
          ctx.globalCompositeOperation = 'multiply';
          ctx.drawImage(layerCanvas, 0, 0);
        }
      }
    });

    setCompositeImage(canvas.toDataURL());
  }, []);

  useEffect(() => {
    generateComposite(layersToDisplay);
  }, [layersToDisplay, generateComposite]);

  const getChannelLabel = (layer: ColorLayer) => {
    if (layer.separationType === 'cmyk') {
      if (layer.color === '#00FFFF') return 'Cyan Screen';
      if (layer.color === '#FF00FF') return 'Magenta Screen';
      if (layer.color === '#FFFF00') return 'Yellow Screen';
      if (layer.color === '#000000') return 'Black Screen';
    }
    return `Spot Color ${layer.color}`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Screen Printing Color Separator</h1>
        <p className="text-gray-600">Create professional color separations for silk screen printing</p>
      </div>

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
            {/* Separation Mode */}
            <div className="flex gap-2">
              <button
                onClick={() => setSeparationMode('cmyk')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  separationMode === 'cmyk'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                CMYK Process
              </button>
              <button
                onClick={() => setSeparationMode('spot')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  separationMode === 'spot'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Spot Colors
              </button>
            </div>

            {separationMode === 'spot' && (
              <>
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useAutoDetect}
                      onChange={(e) => setUseAutoDetect(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">Auto-detect colors</span>
                  </label>
                </div>

                {!useAutoDetect && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Screens: {manualColorCount}
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="8"
                      value={manualColorCount}
                      onChange={(e) => setManualColorCount(parseInt(e.target.value))}
                      className="w-32"
                    />
                  </div>
                )}
              </>
            )}

            {/* Output Settings */}
            <div className="border-l pl-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Output Mode
              </label>
              <select
                value={outputMode}
                onChange={(e) => setOutputMode(e.target.value as 'grayscale' | 'bitmap' | 'halftone')}
                className="px-3 py-1 border rounded"
              >
                <option value="grayscale">Grayscale (Film)</option>
                <option value="bitmap">Bitmap (1-bit)</option>
                <option value="halftone">Halftone Dots</option>
              </select>
            </div>

            {outputMode === 'halftone' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LPI: {halftoneFrequency}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="65"
                    value={halftoneFrequency}
                    onChange={(e) => setHalftoneFrequency(parseInt(e.target.value))}
                    className="w-32"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Angle: {halftoneAngle}°
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={halftoneAngle}
                    onChange={(e) => setHalftoneAngle(parseInt(e.target.value))}
                    className="w-32"
                  />
                </div>
              </>
            )}

            {/* Screen Printing Options */}
            <div className="border-l pl-4 flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filmPositive}
                  onChange={(e) => setFilmPositive(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Film Positive (Invert)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={registrationMarks}
                  onChange={(e) => setRegistrationMarks(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Registration Marks</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={simulateTransparency}
                  onChange={(e) => setSimulateTransparency(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Simulate Transparency</span>
              </label>
            </div>
          </div>
        </div>

        {isProcessing && (
          <div className="mt-4 text-center text-gray-600">
            Processing image for screen printing...
          </div>
        )}
      </div>

      {/* Display area */}
      {originalImage && layersToDisplay.length > 0 && (
        <div className="space-y-8">
          {/* Original image */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">
              Original Artwork ({originalDimensions.width} x {originalDimensions.height})
            </h3>
            <div className="relative w-full" style={{ maxHeight: '400px' }}>
              <NextImage
                src={originalImage}
                alt="Original artwork"
                width={originalDimensions.width}
                height={originalDimensions.height}
                className="object-contain max-h-[400px] w-auto mx-auto"
                unoptimized={true}
              />
            </div>
          </div>

          {/* Screen Printing Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Screen Printing Instructions</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Each layer below represents a separate screen</li>
              <li>• {outputMode === 'halftone' ? 'Halftone dots are optimized for screen mesh' : 'Use with your preferred screen mesh count'}</li>
              <li>• {filmPositive ? 'Film positive mode: Black areas = emulsion to burn' : 'Standard mode: Black areas = where ink will print'}</li>
              <li>• Registration marks help align multiple screens</li>
              <li>• Download each layer and print on transparency film</li>
            </ul>
          </div>

          {/* Screen Layers Grid */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Screen Separations ({layersToDisplay.length} screens)
              </h3>
              <button
                onClick={downloadAllLayers}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Download All Screens
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {layersToDisplay.map((layer, index) => {
                const layerPreview = renderLayerToCanvas(layer);
                
                return (
                  <div key={layer.index} className="border rounded-lg overflow-hidden">
                    {/* Screen header */}
                    <div 
                      className="p-3 text-white font-medium"
                      style={{ backgroundColor: layer.color }}
                    >
                      <div className="flex justify-between items-center">
                        <span>{getChannelLabel(layer)}</span>
                        <span className="text-sm bg-black bg-opacity-30 px-2 py-1 rounded">
                          Screen #{index + 1}
                        </span>
                      </div>
                      {layer.separationType === 'cmyk' && (
                        <div className="text-xs mt-1 opacity-90">
                          {layer.color === '#00FFFF' && 'Cyan - 75°'}
                          {layer.color === '#FF00FF' && 'Magenta - 15°'}
                          {layer.color === '#FFFF00' && 'Yellow - 0°'}
                          {layer.color === '#000000' && 'Black - 45°'}
                        </div>
                      )}
                      {layer.separationType === 'spot' && (
                        <>
                          <div className="text-xs mt-1 opacity-90">
                            {layer.percentage.toFixed(1)}% of image
                          </div>
                          <div className="text-xs opacity-90">
                            CMYK: {layer.cmyk.c}%, {layer.cmyk.m}%, {layer.cmyk.y}%, {layer.cmyk.k}%
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Screen preview */}
                    <div className="bg-gray-100 p-2">
                      {layerPreview && (
                        <div className="relative" style={{ 
                          aspectRatio: `${layer.imageData?.width} / ${layer.imageData?.height}`,
                          maxHeight: '200px'
                        }}>
                          <NextImage
                            src={layerPreview}
                            alt={`Screen ${index + 1}`}
                            fill
                            className="object-contain border"
                            unoptimized={true}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Screen info */}
                    <div className="p-3 bg-gray-50">
                      <p className="text-sm text-gray-600 mb-2">
                        {outputMode === 'halftone' 
                          ? `Halftone: ${halftoneFrequency} LPI at ${halftoneAngle}°`
                          : outputMode === 'bitmap'
                          ? '1-bit bitmap output'
                          : 'Grayscale film output'}
                      </p>
                      
                      <button
                        onClick={() => downloadLayer(layer, index)}
                        className="w-full px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                      >
                        Download Screen {index + 1}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Composite preview */}
          {compositeImage && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4">
                Simulated Print Preview
              </h3>
              <div className="relative w-full" style={{ maxHeight: '400px' }}>
                <NextImage
                  src={compositeImage}
                  alt="Simulated print result"
                  width={originalDimensions.width}
                  height={originalDimensions.height}
                  className="object-contain max-h-[400px] w-auto mx-auto border border-gray-300"
                  unoptimized={true}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2 text-center">
                Simulated result when screens are printed in registration
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
      }
