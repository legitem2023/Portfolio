"use client"
import React, { useRef, useState, useCallback } from 'react';

interface ColorCluster {
  color: { r: number; g: number; b: number };
  count: number;
  pixels: Array<{ x: number; y: number; r: number; g: number; b: number }>;
}

const SmartColorReducer: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [vectorizedSvg, setVectorizedSvg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<string>('');
  const [targetColorCount, setTargetColorCount] = useState<number>(4);
  const [colorReductionMethod, setColorReductionMethod] = useState<'kmeans' | 'median-cut' | 'popularity'>('kmeans');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imgUrl = e.target?.result as string;
      setOriginalImage(imgUrl);
      setVectorizedSvg(null);
    };
    reader.readAsDataURL(file);
  };

  // Calculate color distance (Euclidean)
  const colorDistance = (c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }) => {
    return Math.sqrt(
      Math.pow(c1.r - c2.r, 2) +
      Math.pow(c1.g - c2.g, 2) +
      Math.pow(c1.b - c2.b, 2)
    );
  };

  // Find the closest color in a palette
  const findClosestColor = (
    color: { r: number; g: number; b: number },
    palette: Array<{ r: number; g: number; b: number }>
  ) => {
    let minDist = Infinity;
    let closest = palette[0];
    
    for (const paletteColor of palette) {
      const dist = colorDistance(color, paletteColor);
      if (dist < minDist) {
        minDist = dist;
        closest = paletteColor;
      }
    }
    
    return closest;
  };

  // Method 1: K-Means clustering for color quantization
  const quantizeKMeans = (
    imageData: ImageData,
    k: number
  ): { quantizedData: ImageData; palette: Array<{ r: number; g: number; b: number }> } => {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    // Collect all unique pixels (sampling for performance)
    const pixels: Array<{ r: number; g: number; b: number }> = [];
    const sampleStep = Math.max(1, Math.floor((width * height) / 10000));
    
    for (let i = 0; i < width * height; i += sampleStep) {
      pixels.push({
        r: data[i * 4],
        g: data[i * 4 + 1],
        b: data[i * 4 + 2]
      });
    }
    
    // Initialize centroids randomly from pixels
    let centroids: Array<{ r: number; g: number; b: number }> = [];
    const shuffled = [...pixels];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    centroids = shuffled.slice(0, k);
    
    // Run k-means iterations
    let changed = true;
    let iterations = 0;
    const maxIterations = 20;
    
    while (changed && iterations < maxIterations) {
      changed = false;
      
      // Assign pixels to nearest centroid
      const clusters: Array<Array<{ r: number; g: number; b: number }>> = Array(k).fill(null).map(() => []);
      
      for (const pixel of pixels) {
        let minDist = Infinity;
        let closestIdx = 0;
        
        for (let i = 0; i < centroids.length; i++) {
          const dist = colorDistance(pixel, centroids[i]);
          if (dist < minDist) {
            minDist = dist;
            closestIdx = i;
          }
        }
        
        clusters[closestIdx].push(pixel);
      }
      
      // Update centroids
      const newCentroids: Array<{ r: number; g: number; b: number }> = [];
      for (let i = 0; i < k; i++) {
        if (clusters[i].length > 0) {
          const sum = clusters[i].reduce(
            (acc, p) => ({
              r: acc.r + p.r,
              g: acc.g + p.g,
              b: acc.b + p.b
            }),
            { r: 0, g: 0, b: 0 }
          );
          
          newCentroids.push({
            r: sum.r / clusters[i].length,
            g: sum.g / clusters[i].length,
            b: sum.b / clusters[i].length
          });
        } else {
          newCentroids.push(centroids[i]);
        }
      }
      
      // Check if centroids changed
      for (let i = 0; i < k; i++) {
        if (colorDistance(centroids[i], newCentroids[i]) > 1) {
          changed = true;
          break;
        }
      }
      
      centroids = newCentroids;
      iterations++;
    }
    
    // Quantize the entire image
    const quantizedData = new ImageData(width, height);
    for (let i = 0; i < width * height; i++) {
      const pixel = {
        r: data[i * 4],
        g: data[i * 4 + 1],
        b: data[i * 4 + 2]
      };
      
      const closest = findClosestColor(pixel, centroids);
      
      quantizedData.data[i * 4] = Math.round(closest.r);
      quantizedData.data[i * 4 + 1] = Math.round(closest.g);
      quantizedData.data[i * 4 + 2] = Math.round(closest.b);
      quantizedData.data[i * 4 + 3] = 255;
    }
    
    return { quantizedData, palette: centroids };
  };

  // Method 2: Median Cut algorithm
  const quantizeMedianCut = (
    imageData: ImageData,
    targetColors: number
  ): { quantizedData: ImageData; palette: Array<{ r: number; g: number; b: number }> } => {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    // Collect all pixels
    const pixels: Array<{ r: number; g: number; b: number }> = [];
    for (let i = 0; i < width * height; i++) {
      pixels.push({
        r: data[i * 4],
        g: data[i * 4 + 1],
        b: data[i * 4 + 2]
      });
    }
    
    // Recursive median cut
    const medianCut = (
      colorList: Array<{ r: number; g: number; b: number }>,
      depth: number,
      maxDepth: number
    ): Array<{ r: number; g: number; b: number }> => {
      if (colorList.length === 0) return [];
      if (depth >= maxDepth) {
        // Return average color
        const sum = colorList.reduce(
          (acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }),
          { r: 0, g: 0, b: 0 }
        );
        return [{
          r: sum.r / colorList.length,
          g: sum.g / colorList.length,
          b: sum.b / colorList.length
        }];
      }
      
      // Find the channel with the largest range
      let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
      for (const c of colorList) {
        minR = Math.min(minR, c.r);
        maxR = Math.max(maxR, c.r);
        minG = Math.min(minG, c.g);
        maxG = Math.max(maxG, c.g);
        minB = Math.min(minB, c.b);
        maxB = Math.max(maxB, c.b);
      }
      
      const rangeR = maxR - minR;
      const rangeG = maxG - minG;
      const rangeB = maxB - minB;
      
      let channel: 'r' | 'g' | 'b' = 'r';
      if (rangeG >= rangeR && rangeG >= rangeB) channel = 'g';
      if (rangeB >= rangeR && rangeB >= rangeG) channel = 'b';
      
      // Sort by the chosen channel
      colorList.sort((a, b) => a[channel] - b[channel]);
      
      // Split at median
      const medianIndex = Math.floor(colorList.length / 2);
      const left = colorList.slice(0, medianIndex);
      const right = colorList.slice(medianIndex);
      
      return [
        ...medianCut(left, depth + 1, maxDepth),
        ...medianCut(right, depth + 1, maxDepth)
      ];
    };
    
    const maxDepth = Math.ceil(Math.log2(targetColors));
    let palette = medianCut(pixels, 0, maxDepth);
    
    // Ensure we don't exceed target colors
    if (palette.length > targetColors) {
      palette = palette.slice(0, targetColors);
    }
    
    // Quantize the image
    const quantizedData = new ImageData(width, height);
    for (let i = 0; i < width * height; i++) {
      const pixel = {
        r: data[i * 4],
        g: data[i * 4 + 1],
        b: data[i * 4 + 2]
      };
      
      const closest = findClosestColor(pixel, palette);
      
      quantizedData.data[i * 4] = Math.round(closest.r);
      quantizedData.data[i * 4 + 1] = Math.round(closest.g);
      quantizedData.data[i * 4 + 2] = Math.round(closest.b);
      quantizedData.data[i * 4 + 3] = 255;
    }
    
    return { quantizedData, palette };
  };

  // Method 3: Popularity algorithm (most frequent colors)
  const quantizePopularity = (
    imageData: ImageData,
    targetColors: number
  ): { quantizedData: ImageData; palette: Array<{ r: number; g: number; b: number }> } => {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    // Count color frequencies (with quantization to reduce noise)
    const colorMap = new Map<string, number>();
    const quantizationLevel = 16; // Reduce to 16^3 = 4096 colors
    
    for (let i = 0; i < width * height; i++) {
      const r = Math.floor(data[i * 4] / quantizationLevel) * quantizationLevel;
      const g = Math.floor(data[i * 4 + 1] / quantizationLevel) * quantizationLevel;
      const b = Math.floor(data[i * 4 + 2] / quantizationLevel) * quantizationLevel;
      const key = `${r},${g},${b}`;
      colorMap.set(key, (colorMap.get(key) || 0) + 1);
    }
    
    // Get most frequent colors
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, targetColors);
    
    const palette = sortedColors.map(([key]) => {
      const [r, g, b] = key.split(',').map(Number);
      return { r, g, b };
    });
    
    // Quantize the image
    const quantizedData = new ImageData(width, height);
    for (let i = 0; i < width * height; i++) {
      const pixel = {
        r: data[i * 4],
        g: data[i * 4 + 1],
        b: data[i * 4 + 2]
      };
      
      const closest = findClosestColor(pixel, palette);
      
      quantizedData.data[i * 4] = Math.round(closest.r);
      quantizedData.data[i * 4 + 1] = Math.round(closest.g);
      quantizedData.data[i * 4 + 2] = Math.round(closest.b);
      quantizedData.data[i * 4 + 3] = 255;
    }
    
    return { quantizedData, palette };
  };

  // Find connected components (contiguous regions of same color)
  const findConnectedComponents = (
    imageData: ImageData,
    tolerance: number = 5
  ): Array<{ color: { r: number; g: number; b: number }; pixels: Array<[number, number]> }> => {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const visited = new Uint8Array(width * height);
    const components: Array<{ color: { r: number; g: number; b: number }; pixels: Array<[number, number]> }> = [];
    
    const isSameColor = (x1: number, y1: number, x2: number, y2: number): boolean => {
      const idx1 = (y1 * width + x1) * 4;
      const idx2 = (y2 * width + x2) * 4;
      
      return Math.abs(data[idx1] - data[idx2]) <= tolerance &&
             Math.abs(data[idx1 + 1] - data[idx2 + 1]) <= tolerance &&
             Math.abs(data[idx1 + 2] - data[idx2 + 2]) <= tolerance;
    };
    
    const floodFill = (startX: number, startY: number): Array<[number, number]> => {
      const queue: [number, number][] = [[startX, startY]];
      const component: [number, number][] = [];
      visited[startY * width + startX] = 1;
      
      while (queue.length > 0) {
        const [x, y] = queue.shift()!;
        component.push([x, y]);
        
        // Check 8-directional neighbors
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            
            if (
              nx >= 0 && nx < width &&
              ny >= 0 && ny < height &&
              !visited[ny * width + nx] &&
              isSameColor(x, y, nx, ny)
            ) {
              visited[ny * width + nx] = 1;
              queue.push([nx, ny]);
            }
          }
        }
      }
      
      return component;
    };
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (!visited[idx]) {
          const component = floodFill(x, y);
          if (component.length > 10) {
            const colorIdx = (y * width + x) * 4;
            components.push({
              color: {
                r: data[colorIdx],
                g: data[colorIdx + 1],
                b: data[colorIdx + 2]
              },
              pixels: component
            });
          }
        }
      }
    }
    
    return components;
  };

  // Extract contour from component
  const extractContour = (
    component: Array<[number, number]>,
    width: number,
    height: number
  ): [number, number][] => {
    const grid = new Uint8Array(width * height);
    for (const [x, y] of component) {
      grid[y * width + x] = 1;
    }
    
    // Find starting point
    let startX = -1, startY = -1;
    for (let y = 0; y < height && startX === -1; y++) {
      for (let x = 0; x < width; x++) {
        if (grid[y * width + x] === 1) {
          startX = x;
          startY = y;
          break;
        }
      }
    }
    
    if (startX === -1) return [];
    
    // Moore-neighbor tracing
    const contour: [number, number][] = [];
    let x = startX;
    let y = startY;
    let dir = 7;
    
    do {
      contour.push([x, y]);
      
      let found = false;
      for (let i = 0; i < 8; i++) {
        const nextDir = (dir + 1 + i) % 8;
        let nx = x, ny = y;
        
        switch (nextDir) {
          case 0: nx = x + 1; ny = y; break;
          case 1: nx = x + 1; ny = y - 1; break;
          case 2: nx = x; ny = y - 1; break;
          case 3: nx = x - 1; ny = y - 1; break;
          case 4: nx = x - 1; ny = y; break;
          case 5: nx = x - 1; ny = y + 1; break;
          case 6: nx = x; ny = y + 1; break;
          case 7: nx = x + 1; ny = y + 1; break;
        }
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height && grid[ny * width + nx] === 1) {
          x = nx;
          y = ny;
          dir = (nextDir + 4) % 8;
          found = true;
          break;
        }
      }
      
      if (!found) break;
      
    } while (x !== startX || y !== startY);
    
    return simplifyPolygon(contour);
  };

  // Simplify polygon
  const simplifyPolygon = (points: [number, number][], epsilon: number = 1.0): [number, number][] => {
    if (points.length <= 2) return points;
    
    const findPerpendicularDistance = (p: [number, number], p1: [number, number], p2: [number, number]): number => {
      const [x, y] = p;
      const [x1, y1] = p1;
      const [x2, y2] = p2;
      
      const numerator = Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1);
      const denominator = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
      
      return denominator === 0 ? 0 : numerator / denominator;
    };
    
    let maxDistance = 0;
    let index = 0;
    
    for (let i = 1; i < points.length - 1; i++) {
      const distance = findPerpendicularDistance(points[i], points[0], points[points.length - 1]);
      if (distance > maxDistance) {
        maxDistance = distance;
        index = i;
      }
    }
    
    if (maxDistance > epsilon) {
      const left = simplifyPolygon(points.slice(0, index + 1), epsilon);
      const right = simplifyPolygon(points.slice(index), epsilon);
      return [...left.slice(0, -1), ...right];
    } else {
      return [points[0], points[points.length - 1]];
    }
  };

  // Smooth contour
  const smoothContour = (points: [number, number][], iterations: number = 1): [number, number][] => {
    if (points.length < 3) return points;
    
    let result = points;
    
    for (let iter = 0; iter < iterations; iter++) {
      const smoothed: [number, number][] = [];
      
      for (let i = 0; i < result.length; i++) {
        const p0 = result[i];
        const p1 = result[(i + 1) % result.length];
        
        const q0: [number, number] = [
          0.75 * p0[0] + 0.25 * p1[0],
          0.75 * p0[1] + 0.25 * p1[1]
        ];
        const q1: [number, number] = [
          0.25 * p0[0] + 0.75 * p1[0],
          0.25 * p0[1] + 0.75 * p1[1]
        ];
        
        smoothed.push(q0, q1);
      }
      
      result = smoothed;
    }
    
    return result;
  };

  // Main vectorization process
  const vectorizeImage = useCallback(async () => {
    if (!originalImage) return;
    
    setIsProcessing(true);
    setProgress('Loading image...');
    
    const img = new Image();
    img.src = originalImage;
    
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    
    // Set canvas size
    let width = img.width;
    let height = img.height;
    const maxDim = 500;
    
    if (width > maxDim || height > maxDim) {
      const ratio = Math.min(maxDim / width, maxDim / height);
      width = Math.floor(width * ratio);
      height = Math.floor(height * ratio);
    }
    
    canvas.width = width;
    canvas.height = height;
    
    setProgress('Drawing image...');
    ctx.drawImage(img, 0, 0, width, height);
    
    setProgress('Getting image data...');
    const imageData = ctx.getImageData(0, 0, width, height);
    
    setProgress(`Applying ${colorReductionMethod} color reduction to ${targetColorCount} colors...`);
    let result;
    
    switch (colorReductionMethod) {
      case 'kmeans':
        result = quantizeKMeans(imageData, targetColorCount);
        break;
      case 'median-cut':
        result = quantizeMedianCut(imageData, targetColorCount);
        break;
      case 'popularity':
        result = quantizePopularity(imageData, targetColorCount);
        break;
      default:
        result = quantizeKMeans(imageData, targetColorCount);
    }
    
    // Show quantized image
    ctx.putImageData(result.quantizedData, 0, 0);
    
    setProgress('Finding connected regions...');
    const components = findConnectedComponents(result.quantizedData);
    
    setProgress(`Found ${components.length} regions, generating SVG...`);
    
    // Group components by color - Fixed iteration issue
    const colorGroups = new Map<string, Array<Array<[number, number]>>>();
    
    for (const component of components) {
      const colorKey = `${component.color.r},${component.color.g},${component.color.b}`;
      const existing = colorGroups.get(colorKey);
      if (existing) {
        existing.push(component.pixels);
      } else {
        colorGroups.set(colorKey, [component.pixels]);
      }
    }
    
    // Generate SVG - Fixed iteration issue
    let svgPaths = '';
    const colorGroupEntries = Array.from(colorGroups.entries());
    
    for (let idx = 0; idx < colorGroupEntries.length; idx++) {
      const [colorKey, regions] = colorGroupEntries[idx];
      const [r, g, b] = colorKey.split(',').map(Number);
      const fillColor = `rgb(${r}, ${g}, ${b})`;
      
      for (let j = 0; j < regions.length; j++) {
        const region = regions[j];
        let contour = extractContour(region, width, height);
        if (contour.length < 3) continue;
        
        contour = smoothContour(contour, 1);
        
        let pathData = `M ${contour[0][0]} ${contour[0][1]}`;
        for (let k = 1; k < contour.length; k++) {
          pathData += ` L ${contour[k][0]} ${contour[k][1]}`;
        }
        pathData += ' Z';
        
        svgPaths += `<path d="${pathData}" fill="${fillColor}" stroke="${fillColor}" stroke-width="0.5" stroke-linejoin="round" />\n`;
      }
    }
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">${svgPaths}</svg>`;
    
    setVectorizedSvg(svg);
    setProgress('Complete!');
    setIsProcessing(false);
    
  }, [originalImage, targetColorCount, colorReductionMethod]);

  const downloadSvg = () => {
    if (!vectorizedSvg) return;
    
    const blob = new Blob([vectorizedSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'color-reduced-image.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const showPreview = () => {
    if (!originalImage || !previewCanvasRef.current) return;
    
    const img = new Image();
    img.src = originalImage;
    img.onload = () => {
      const canvas = previewCanvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      
      let width = img.width;
      let height = img.height;
      const maxDim = 300;
      
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      const imageData = ctx.getImageData(0, 0, width, height);
      let result;
      
      switch (colorReductionMethod) {
        case 'kmeans':
          result = quantizeKMeans(imageData, targetColorCount);
          break;
        case 'median-cut':
          result = quantizeMedianCut(imageData, targetColorCount);
          break;
        case 'popularity':
          result = quantizePopularity(imageData, targetColorCount);
          break;
        default:
          result = quantizeKMeans(imageData, targetColorCount);
      }
      
      ctx.putImageData(result.quantizedData, 0, 0);
    };
  };

  return (
    <div className="p-6 max-w-6xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-4">Smart Color Reducer & Vectorizer</h1>
      <p className="text-gray-600 mb-6">
        Reduces image colors by merging blended/transitional pixels into the nearest pure color
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Upload Image</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Target Color Count: {targetColorCount}
            </label>
            <input
              type="range"
              min="2"
              max="16"
              value={targetColorCount}
              onChange={(e) => setTargetColorCount(parseInt(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lower = fewer colors, more aggressive merging of blended pixels
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Color Reduction Method</label>
            <select
              value={colorReductionMethod}
              onChange={(e) => setColorReductionMethod(e.target.value as any)}
              className="w-full p-2 border rounded-md"
            >
              <option value="kmeans">K-Means Clustering (Best quality)</option>
              <option value="median-cut">Median Cut (Fast, good quality)</option>
              <option value="popularity">Popularity Algorithm (Fastest)</option>
            </select>
          </div>
          
          {originalImage && (
            <div className="flex gap-2">
              <button
                onClick={showPreview}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Preview Reduced Colors
              </button>
              <button
                onClick={vectorizeImage}
                disabled={isProcessing}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'Vectorizing...' : 'Generate Vector SVG'}
              </button>
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">Color Reduced Preview</h2>
          <div className="border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center min-h-[200px]">
            <canvas ref={previewCanvasRef} className="max-w-full h-auto" />
            {!originalImage && (
              <p className="text-gray-400">Upload an image to see preview</p>
            )}
          </div>
        </div>
      </div>
      
      {progress && isProcessing && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm text-blue-700">
          Progress: {progress}
        </div>
      )}
      
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {originalImage && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Original Image</h2>
            <div className="border rounded-lg overflow-hidden bg-gray-100">
              <img src={originalImage} alt="Original" className="max-w-full h-auto" />
            </div>
          </div>
        )}
        
        <div>
          <h2 className="text-lg font-semibold mb-2">
            Vectorized Result {vectorizedSvg && '(SVG Preview)'}
          </h2>
          <div className="border rounded-lg overflow-hidden bg-white">
            <canvas ref={canvasRef} className="max-w-full h-auto" />
          </div>
        </div>
      </div>
      
      {vectorizedSvg && (
        <div className="mt-6">
          <button
            onClick={downloadSvg}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Download SVG
          </button>
          
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-600">View SVG Code</summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-96">
              {vectorizedSvg}
            </pre>
          </details>
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-500 border-t pt-4">
        <h3 className="font-semibold mb-2">How it works:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Color Quantization:</strong> Reduces the image to a specific number of colors using K-Means, Median Cut, or Popularity algorithms</li>
          <li><strong>Pixel Assignment:</strong> Every pixel (including blended/transitional ones) is assigned to the closest color in the reduced palette</li>
          <li><strong>Region Detection:</strong> Finds connected regions of the same color</li>
          <li><strong>Contour Tracing:</strong> Extracts the boundary of each region</li>
          <li><strong>Path Generation:</strong> Creates smooth SVG paths for each color region</li>
        </ul>
        <p className="mt-2">
          This eliminates all gradients and transitional pixels, replacing them with solid, flat colors.
          Perfect for creating vector illustrations, logos, and graphics from photos!
        </p>
      </div>
    </div>
  );
};

export default SmartColorReducer;
