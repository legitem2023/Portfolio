// components/SilkScreenColorSeparator.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import NextImage from 'next/image';

interface ColorLayer {
  color: string;
  cmyk: { c: number; m: number; y: number; k: number };
  rgb: { r: number; g: number; b: number };
  imageData: ImageData | null;
  bitmapImageData: ImageData | null;
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

export default function SilkScreenColorSeparatorCMYK() {
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
  const [outputMode, setOutputMode] = useState<'grayscale' | 'bitmap' | 'halftone'>('halftone');
  const [halftoneFrequency, setHalftoneFrequency] = useState(45);
  const [halftoneAngle, setHalftoneAngle] = useState(45);
  const [simulateTransparency, setSimulateTransparency] = useState(true);
  const [registrationMarks, setRegistrationMarks] = useState(true);
  const [filmPositive, setFilmPositive] = useState(false);
  
  const LEGAL_WIDTH_PX = 2550;
  const LEGAL_HEIGHT_PX = 3300;
  
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

  const createLegalSizeCanvas = (imageData: ImageData): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = LEGAL_WIDTH_PX;
    canvas.height = LEGAL_HEIGHT_PX;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, LEGAL_WIDTH_PX, LEGAL_HEIGHT_PX);
    
    const marginX = 150;
    const marginY = 150;
    const maxWidth = LEGAL_WIDTH_PX - (marginX * 2);
    const maxHeight = LEGAL_HEIGHT_PX - (marginY * 2);
    
    const scale = Math.min(maxWidth / imageData.width, maxHeight / imageData.height);
    const scaledWidth = imageData.width * scale;
    const scaledHeight = imageData.height * scale;
    const offsetX = marginX + (maxWidth - scaledWidth) / 2;
    const offsetY = marginY + (maxHeight - scaledHeight) / 2;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(imageData, 0, 0);
      ctx.drawImage(tempCanvas, offsetX, offsetY, scaledWidth, scaledHeight);
    }
    
    return canvas;
  };

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
        const intensity = sourcePixels[idx];
        
        const xRot = x * Math.cos(angleRad) - y * Math.sin(angleRad);
        const yRot = x * Math.sin(angleRad) + y * Math.cos(angleRad);
        
        let spotX = (xRot % period) / period;
        let spotY = (yRot % period) / period;
        if (spotX < 0) spotX += 1;
        if (spotY < 0) spotY += 1;
        
        let spotValue = 0;
        
        switch(shape) {
          case 'dot': {
            const centerX = 0.5;
            const centerY = 0.5;
            const dx = spotX - centerX;
            const dy = spotY - centerY;
            const distance = Math.sqrt(dx*dx + dy*dy) * 2;
            spotValue = 1 - Math.min(1, distance);
            break;
          }
          case 'square': {
            spotValue = Math.min(spotX, spotY) * 2;
            if (spotValue > 1) spotValue = 2 - spotValue;
            break;
          }
          case 'line': {
            spotValue = Math.sin(spotX * Math.PI * 2) * 0.5 + 0.5;
            break;
          }
        }
        
        const dotThreshold = (255 - intensity) / 255;
        
        let value;
        if (spotValue < dotThreshold - 0.1) {
          value = 0;
        } else if (spotValue > dotThreshold + 0.1) {
          value = 255;
        } else {
          const t = (spotValue - (dotThreshold - 0.1)) / 0.2;
          value = Math.round(255 * t);
        }
        
        resultPixels[idx] = value;
        resultPixels[idx + 1] = value;
        resultPixels[idx + 2] = value;
        resultPixels[idx + 3] = 255;
      }
    }
    
    return resultData;
  };

  const convertToBitmap = (imageData: ImageData, threshold: number = 128): ImageData => {
    const width = imageData.width;
    const height = imageData.height;
    const sourcePixels = imageData.data;
    const resultData = new ImageData(width, height);
    const resultPixels = resultData.data;
    
    for (let i = 0; i < sourcePixels.length; i += 4) {
      const intensity = sourcePixels[i];
      const value = intensity > threshold ? 255 : 0;
      
      resultPixels[i] = value;
      resultPixels[i + 1] = value;
      resultPixels[i + 2] = value;
      resultPixels[i + 3] = 255;
    }
    
    return resultData;
  };

  const addRegistrationMarks = (imageData: ImageData): ImageData => {
    const width = imageData.width;
    const height = imageData.height;
    const resultData = new ImageData(width, height);
    const resultPixels = resultData.data;
    const sourcePixels = imageData.data;
    
    for (let i = 0; i < sourcePixels.length; i++) {
      resultPixels[i] = sourcePixels[i];
    }
    
    const markSize = Math.min(width, height) * 0.015;
    const margin = Math.min(width, height) * 0.03;
    
    const addMark = (x: number, y: number) => {
      for (let i = -Math.floor(markSize); i <= Math.floor(markSize); i++) {
        for (let j = -Math.floor(markSize); j <= Math.floor(markSize); j++) {
          const px = Math.floor(x + i);
          const py = Math.floor(y + j);
          if (px >= 0 && px < width && py >= 0 && py < height) {
            const idx = (py * width + px) * 4;
            if (Math.abs(i) <= 2 || Math.abs(j) <= 2) {
              resultPixels[idx] = 0;
              resultPixels[idx + 1] = 0;
              resultPixels[idx + 2] = 0;
              resultPixels[idx + 3] = 255;
            }
            const distance = Math.sqrt(i*i + j*j);
            if (Math.abs(distance - markSize) <= 2) {
              resultPixels[idx] = 0;
              resultPixels[idx + 1] = 0;
              resultPixels[idx + 2] = 0;
              resultPixels[idx + 3] = 255;
            }
          }
        }
      }
    };
    
    addMark(margin, margin);
    addMark(width - margin, margin);
    addMark(margin, height - margin);
    addMark(width - margin, height - margin);
    addMark(width / 2, height / 2);
    
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
      
      let intensity = Math.round(255 * (1 - channelValue / 100));
      
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

  // Creates a COLORED preview image for UI display only (not for download)
  const createColoredPreviewImage = (layer: ColorLayer): string | null => {
    if (!layer.imageData) return null;
    
    const { width, height } = layer.imageData;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    const intensityData = layer.imageData;
    const imageData = ctx.createImageData(width, height);
    const pixels = imageData.data;
    const intensityPixels = intensityData.data;
    
    // Get the RGB color for this layer
    let colorRgb = { r: 0, g: 0, b: 0 };
    if (layer.separationType === 'cmyk') {
      // Standard CMYK process colors for preview
      switch(layer.color) {
        case '#00FFFF': colorRgb = { r: 0, g: 255, b: 255 }; break; // Cyan
        case '#FF00FF': colorRgb = { r: 255, g: 0, b: 255 }; break; // Magenta
        case '#FFFF00': colorRgb = { r: 255, g: 255, b: 0 }; break; // Yellow
        case '#000000': colorRgb = { r: 0, g: 0, b: 0 }; break; // Black
        default: colorRgb = { r: 255, g: 255, b: 255 };
      }
    } else {
      // Spot color - use the RGB values from the layer
      colorRgb = layer.rgb;
    }
    
    // Apply the color to the intensity data for preview
    for (let i = 0; i < intensityPixels.length; i += 4) {
      const intensity = intensityPixels[i];
      const inkAmount = 1 - (intensity / 255);
      
      // Blend with white background for transparency effect
      pixels[i] = colorRgb.r * inkAmount + 255 * (1 - inkAmount);
      pixels[i+1] = colorRgb.g * inkAmount + 255 * (1 - inkAmount);
      pixels[i+2] = colorRgb.b * inkAmount + 255 * (1 - inkAmount);
      pixels[i+3] = 255;
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  };

  const processLayerForOutput = (layer: ColorLayer): ColorLayer => {
    if (!layer.imageData) return layer;
    
    let processedImageData = layer.imageData;
    
    const legalCanvas = createLegalSizeCanvas(processedImageData);
    const legalCtx = legalCanvas.getContext('2d');
    if (legalCtx) {
      processedImageData = legalCtx.getImageData(0, 0, LEGAL_WIDTH_PX, LEGAL_HEIGHT_PX);
    }
    
    if (outputMode === 'bitmap') {
      processedImageData = convertToBitmap(processedImageData, 128);
    } else if (outputMode === 'halftone') {
      const angle = layer.separationType === 'cmyk' 
        ? getHalftoneAngleForChannel(layer.color)
        : halftoneAngle;
      processedImageData = applyHalftone(processedImageData, halftoneFrequency, angle, 'dot');
    } else if (outputMode === 'grayscale') {
      const pixels = processedImageData.data;
      for (let i = 0; i < pixels.length; i += 4) {
        let v = pixels[i];
        v = Math.min(255, Math.max(0, (v - 20) * 1.2));
        pixels[i] = v;
        pixels[i+1] = v;
        pixels[i+2] = v;
      }
    }
    
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
    switch(color) {
      case '#00FFFF': return 75;
      case '#FF00FF': return 15;  
      case '#FFFF00': return 0;
      case '#000000': return 45;
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
      
      let intensity = 0;
      if (colorDist <= threshold) {
        intensity = 255;
      } else if (simulateTransparency && colorDist <= threshold * 2) {
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
        rgb: channel.key === 'c' ? { r: 0, g: 255, b: 255 } :
              channel.key === 'm' ? { r: 255, g: 0, b: 255 } :
              channel.key === 'y' ? { r: 255, g: 255, b: 0 } :
              { r: 0, g: 0, b: 0 },
        imageData: layerImageData,
        bitmapImageData: null,
        percentage: 25,
        pixelCount: imageData.width * imageData.height,
        isDominant: true,
        index: index,
        separationType: 'cmyk'
      };
      
      return processLayerForOutput(layer);
    });

    setCmykLayers(layers);
    setAllColorLayers(layers);
    setDominantLayers(layers);
    setIsProcessing(false);
  };

  const extractSpotColors = (imageData: ImageData) => {
    const pixels = imageData.data;
    
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
    
    let optimalColorCount: number;
    if (useAutoDetect) {
      optimalColorCount = detectOptimalColorCount(mergedColors);
      setAutoColorCount(optimalColorCount);
    } else {
      optimalColorCount = manualColorCount;
    }
    
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
    extractSpotColors(imageData);
  };

  const detectOptimalColorCount = (colors: ColorCluster[]): number => {
    if (colors.length <= 2) return colors.length;
    
    let cumulativePercentage = 0;
    let optimalK = 4;
    
    for (let i = 0; i < colors.length; i++) {
      cumulativePercentage += colors[i].percentage;
      if (cumulativePercentage >= 0.85) {
        optimalK = Math.max(2, i + 1);
        break;
      }
    }
    
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

  // This returns the BLACK film image for download/preview
  const renderBlackFilmPreview = (layer: ColorLayer): string | null => {
    if (!layer.imageData) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = layer.imageData.width;
    canvas.height = layer.imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.putImageData(layer.imageData, 0, 0);
    return canvas.toDataURL();
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
    link.download = `screen-${layerType}-${index + 1}-${layer.color}-${outputType}-legal.png`;
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

  // Generate composite preview with COLORS for simulation
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

    // Start with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // For composite, blend the colored versions of each layer
    layers.forEach(layer => {
      const coloredPreviewDataUrl = createColoredPreviewImage(layer);
      if (coloredPreviewDataUrl) {
        const img = new Image();
        img.src = coloredPreviewDataUrl;
        // Draw synchronously - we need to wait for image load
        // For simplicity, we'll use an async approach
      }
    });

    // Alternative: Blend using multiply with intensity data
    layers.forEach(layer => {
      if (layer.imageData) {
        // Create a colored version of this layer
        const coloredCanvas = document.createElement('canvas');
        coloredCanvas.width = width;
        coloredCanvas.height = height;
        const coloredCtx = coloredCanvas.getContext('2d');
        if (coloredCtx) {
          const intensityData = layer.imageData;
          const coloredImageData = coloredCtx.createImageData(width, height);
          const coloredPixels = coloredImageData.data;
          const intensityPixels = intensityData.data;
          
          let colorRgb = { r: 0, g: 0, b: 0 };
          if (layer.separationType === 'cmyk') {
            switch(layer.color) {
              case '#00FFFF': colorRgb = { r: 0, g: 255, b: 255 }; break;
              case '#FF00FF': colorRgb = { r: 255, g: 0, b: 255 }; break;
              case '#FFFF00': colorRgb = { r: 255, g: 255, b: 0 }; break;
              case '#000000': colorRgb = { r: 0, g: 0, b: 0 }; break;
              default: colorRgb = { r: 255, g: 255, b: 255 };
            }
          } else {
            colorRgb = layer.rgb;
          }
          
          for (let i = 0; i < intensityPixels.length; i += 4) {
            const intensity = intensityPixels[i];
            const inkAmount = 1 - (intensity / 255);
            
            coloredPixels[i] = colorRgb.r * inkAmount + 255 * (1 - inkAmount);
            coloredPixels[i+1] = colorRgb.g * inkAmount + 255 * (1 - inkAmount);
            coloredPixels[i+2] = colorRgb.b * inkAmount + 255 * (1 - inkAmount);
            coloredPixels[i+3] = 255;
          }
          
          coloredCtx.putImageData(coloredImageData, 0, 0);
          
          // Blend using multiply for transparency simulation
          ctx.globalCompositeOperation = 'multiply';
          ctx.drawImage(coloredCanvas, 0, 0);
          ctx.globalCompositeOperation = 'source-over';
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
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
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Screen Printing Color Separator</h1>
        <p className="text-sm sm:text-base text-gray-600">Create professional color separations for silk screen printing - Legal Size Output</p>
      </div>

      {/* Controls */}
      <div className="mb-6 sm:mb-8 bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col md:flex-row flex-wrap gap-4 items-start md:items-center justify-between">
          <button
            onClick={triggerFileInput}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 w-full sm:w-auto"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Upload Image'}
          </button>
          
          <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
            {/* Separation Mode */}
            <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <button
                onClick={() => setSeparationMode('cmyk')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm rounded-lg transition-colors ${
                  separationMode === 'cmyk'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                CMYK Process
              </button>
              <button
                onClick={() => setSeparationMode('spot')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm rounded-lg transition-colors ${
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
                    <span className="ml-3 text-xs sm:text-sm font-medium text-gray-700">Auto-detect</span>
                  </label>
                </div>

                {!useAutoDetect && (
                  <div className="w-full sm:w-auto">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Screens: {manualColorCount}
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="8"
                      value={manualColorCount}
                      onChange={(e) => setManualColorCount(parseInt(e.target.value))}
                      className="w-full sm:w-32"
                    />
                  </div>
                )}
              </>
            )}

            {/* Output Settings */}
            <div className="w-full sm:w-auto border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-4 mt-2 sm:mt-0">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Output Mode
              </label>
              <select
                value={outputMode}
                onChange={(e) => setOutputMode(e.target.value as 'grayscale' | 'bitmap' | 'halftone')}
                className="w-full sm:w-auto px-3 py-1 border rounded text-sm"
              >
                <option value="grayscale">Grayscale (Film)</option>
                <option value="bitmap">Bitmap (1-bit)</option>
                <option value="halftone">Halftone Dots</option>
              </select>
            </div>

            {outputMode === 'halftone' && (
              <>
                <div className="w-full sm:w-auto">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    LPI: {halftoneFrequency}
                  </label>
                  <input
                    type="range"
                    min="25"
                    max="65"
                    value={halftoneFrequency}
                    onChange={(e) => setHalftoneFrequency(parseInt(e.target.value))}
                    className="w-full sm:w-32"
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Angle: {halftoneAngle}°
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={halftoneAngle}
                    onChange={(e) => setHalftoneAngle(parseInt(e.target.value))}
                    className="w-full sm:w-32"
                  />
                </div>
              </>
            )}

            {/* Screen Printing Options */}
            <div className="w-full flex flex-wrap gap-3 border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-4 mt-2 sm:mt-0">
              <label className="flex items-center gap-2 text-xs sm:text-sm">
                <input
                  type="checkbox"
                  checked={filmPositive}
                  onChange={(e) => setFilmPositive(e.target.checked)}
                  className="rounded"
                />
                <span>Film Positive</span>
              </label>
              <label className="flex items-center gap-2 text-xs sm:text-sm">
                <input
                  type="checkbox"
                  checked={registrationMarks}
                  onChange={(e) => setRegistrationMarks(e.target.checked)}
                  className="rounded"
                />
                <span>Reg Marks</span>
              </label>
              <label className="flex items-center gap-2 text-xs sm:text-sm">
                <input
                  type="checkbox"
                  checked={simulateTransparency}
                  onChange={(e) => setSimulateTransparency(e.target.checked)}
                  className="rounded"
                />
                <span>Transparency</span>
              </label>
            </div>
          </div>
        </div>

        {isProcessing && (
          <div className="mt-4 text-center text-gray-600 text-sm">
            Processing image for screen printing...
          </div>
        )}
      </div>

      {/* Display area */}
      {originalImage && layersToDisplay.length > 0 && (
        <div className="space-y-6 sm:space-y-8">
          {/* Original image */}
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
              Original Artwork ({originalDimensions.width} x {originalDimensions.height})
            </h3>
            <div className="relative w-full max-h-[300px] sm:max-h-[400px] flex justify-center">
              <NextImage
                src={originalImage}
                alt="Original artwork"
                width={originalDimensions.width}
                height={originalDimensions.height}
                className="object-contain max-h-[300px] sm:max-h-[400px] w-auto"
                unoptimized={true}
              />
            </div>
          </div>

          {/* Screen Printing Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
            <h4 className="font-semibold text-yellow-800 mb-2 text-sm sm:text-base">Screen Printing Instructions</h4>
            <ul className="text-xs sm:text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>Each layer below represents a separate screen</li>
              <li>{outputMode === 'halftone' ? 'Halftone dots are optimized for screen mesh' : 'Use with your preferred screen mesh count'}</li>
              <li>{filmPositive ? 'Film positive mode: Black areas = emulsion to burn' : 'Standard mode: Black areas = where ink will print'}</li>
              <li>Registration marks help align multiple screens</li>
              <li>Download each layer and print on transparency film</li>
              <li>Output size: Legal (8.5 x 11) at 300 DPI</li>
            </ul>
          </div>

          {/* Screen Layers Grid - Showing BLACK film images */}
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h3 className="text-base sm:text-lg font-semibold">
                Screen Separations ({layersToDisplay.length} screens)
              </h3>
              <button
                onClick={downloadAllLayers}
                className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
              >
                Download All Screens
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {layersToDisplay.map((layer, index) => {
                const blackPreview = renderBlackFilmPreview(layer);
                
                return (
                  <div key={layer.index} className="border rounded-lg overflow-hidden">
                    {/* Screen header */}
                    <div 
                      className="p-3 text-white font-medium"
                      style={{ backgroundColor: layer.color }}
                    >
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <span className="text-sm sm:text-base">{getChannelLabel(layer)}</span>
                        <span className="text-xs bg-black bg-opacity-30 px-2 py-1 rounded">
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
                    
                    {/* Screen preview - BLACK for film output */}
                    <div className="bg-gray-100 p-2">
                      {blackPreview && (
                        <div className="relative w-full" style={{ 
                          aspectRatio: `${layer.imageData?.width} / ${layer.imageData?.height}`,
                          minHeight: '150px'
                        }}>
                          <NextImage
                            src={blackPreview}
                            alt={`Screen ${index + 1} - Film Output`}
                            fill
                            className="object-contain border"
                            unoptimized={true}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Screen info */}
                    <div className="p-3 bg-gray-50">
                      <p className="text-xs text-gray-600 mb-2">
                        {outputMode === 'halftone' 
                          ? `Halftone: ${halftoneFrequency} LPI at ${halftoneAngle}°`
                          : outputMode === 'bitmap'
                          ? '1-bit bitmap output'
                          : 'Grayscale film output'}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">
                        Legal size: 8.5 x 11 @ 300 DPI
                      </p>
                      
                      <button
                        onClick={() => downloadLayer(layer, index)}
                        className="w-full px-3 py-2 bg-blue-500 text-white text-xs sm:text-sm rounded hover:bg-blue-600 transition-colors"
                      >
                        Download Screen {index + 1}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Composite preview - COLORED simulation */}
          {compositeImage && (
            <div className="bg-white rounded-lg shadow p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                Simulated Print Preview (Colored)
              </h3>
              <div className="relative w-full max-h-[300px] sm:max-h-[400px] flex justify-center">
                <NextImage
                  src={compositeImage}
                  alt="Simulated print result"
                  width={LEGAL_WIDTH_PX}
                  height={LEGAL_HEIGHT_PX}
                  className="object-contain max-h-[300px] sm:max-h-[400px] w-auto border border-gray-300"
                  unoptimized={true}
                />
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-2 text-center">
                Simulated result when screens are printed in registration (shows actual ink colors)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
        }
