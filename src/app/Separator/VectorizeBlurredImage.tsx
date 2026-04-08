"use client"
import React, { useRef, useState, useCallback } from 'react';

interface VectorizedPath {
  d: string;
  color: string;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

const VectorizeBlurredImage: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [vectorizedSvg, setVectorizedSvg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle image upload
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

  // Convert image to grayscale and apply edge detection
  const detectEdges = (
    imageData: ImageData,
    lowThreshold: number = 30,
    highThreshold: number = 80
  ): ImageData => {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    // Convert to grayscale first
    const gray = new Uint8ClampedArray(width * height);
    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }
    
    // Apply Sobel operator
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    const magnitude = new Uint8ClampedArray(width * height);
    const direction = new Float32Array(width * height);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = (y + ky) * width + (x + kx);
            const pixel = gray[idx];
            const sobelIdx = (ky + 1) * 3 + (kx + 1);
            gx += pixel * sobelX[sobelIdx];
            gy += pixel * sobelY[sobelIdx];
          }
        }
        const mag = Math.sqrt(gx * gx + gy * gy);
        magnitude[y * width + x] = Math.min(255, mag);
        direction[y * width + x] = Math.atan2(gy, gx);
      }
    }
    
    // Non-maximum suppression
    const suppressed = new Uint8ClampedArray(width * height);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const angle = direction[y * width + x];
        let angleDeg = (angle * 180) / Math.PI;
        if (angleDeg < 0) angleDeg += 180;
        
        let q = 255, r = 255;
        
        if ((0 <= angleDeg && angleDeg < 22.5) || (157.5 <= angleDeg && angleDeg <= 180)) {
          q = magnitude[y * width + (x - 1)];
          r = magnitude[y * width + (x + 1)];
        } else if (22.5 <= angleDeg && angleDeg < 67.5) {
          q = magnitude[(y - 1) * width + (x + 1)];
          r = magnitude[(y + 1) * width + (x - 1)];
        } else if (67.5 <= angleDeg && angleDeg < 112.5) {
          q = magnitude[(y - 1) * width + x];
          r = magnitude[(y + 1) * width + x];
        } else if (112.5 <= angleDeg && angleDeg < 157.5) {
          q = magnitude[(y - 1) * width + (x - 1)];
          r = magnitude[(y + 1) * width + (x + 1)];
        }
        
        if (magnitude[y * width + x] >= q && magnitude[y * width + x] >= r) {
          suppressed[y * width + x] = magnitude[y * width + x];
        } else {
          suppressed[y * width + x] = 0;
        }
      }
    }
    
    // Edge tracking by hysteresis
    const result = new Uint8ClampedArray(width * height);
    const stack: [number, number][] = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (suppressed[idx] >= highThreshold) {
          result[idx] = 255;
          stack.push([x, y]);
        } else if (suppressed[idx] >= lowThreshold) {
          result[idx] = 128;
        }
      }
    }
    
    // Grow edges from strong to weak
    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = ny * width + nx;
            if (result[nIdx] === 128) {
              result[nIdx] = 255;
              stack.push([nx, ny]);
            }
          }
        }
      }
    }
    
    // Convert back to ImageData
    const edgeImageData = new ImageData(width, height);
    for (let i = 0; i < width * height; i++) {
      const val = result[i] === 255 ? 0 : 255;
      edgeImageData.data[i * 4] = val;
      edgeImageData.data[i * 4 + 1] = val;
      edgeImageData.data[i * 4 + 2] = val;
      edgeImageData.data[i * 4 + 3] = 255;
    }
    
    return edgeImageData;
  };

  // Simple polygon simplification using Ramer-Douglas-Peucker
  const simplifyPolygon = (points: [number, number][], epsilon: number = 2): [number, number][] => {
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

  // Trace contours from edge image
  const traceContours = (edgeImageData: ImageData): [number, number][][] => {
    const width = edgeImageData.width;
    const height = edgeImageData.height;
    const data = edgeImageData.data;
    const visited = new Uint8Array(width * height);
    const contours: [number, number][][] = [];
    
    // Find edge pixels and trace contours
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (data[idx * 4] === 0 && !visited[idx]) {
          // Found an edge pixel, trace the contour
          const contour: [number, number][] = [];
          let cx = x;
          let cy = y;
          
          // Moore-neighbor tracing
          let startX = cx;
          let startY = cy;
          let dir = 7; // Start direction (8 directions)
          
          do {
            visited[cy * width + cx] = 1;
            contour.push([cx, cy]);
            
            // Search in clockwise direction
            let found = false;
            for (let i = 0; i < 8; i++) {
              const nextDir = (dir + 1 + i) % 8;
              const nx = cx + (nextDir === 0 ? 1 : nextDir === 1 ? 1 : nextDir === 2 ? 0 : nextDir === 3 ? -1 : nextDir === 4 ? -1 : nextDir === 5 ? -1 : nextDir === 6 ? 0 : 1);
              const ny = cy + (nextDir === 0 ? 0 : nextDir === 1 ? 1 : nextDir === 2 ? 1 : nextDir === 3 ? 1 : nextDir === 4 ? 0 : nextDir === 5 ? -1 : nextDir === 6 ? -1 : nextDir === 7 ? -1 : 0);
              
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nIdx = ny * width + nx;
                if (data[nIdx * 4] === 0) {
                  cx = nx;
                  cy = ny;
                  dir = (nextDir + 4) % 8;
                  found = true;
                  break;
                }
              }
            }
            
            if (!found) break;
            
          } while (cx !== startX || cy !== startY);
          
          if (contour.length > 10) {
            const simplified = simplifyPolygon(contour, 1.5);
            if (simplified.length >= 3) {
              contours.push(simplified);
            }
          }
        }
      }
    }
    
    return contours;
  };

  // Main vectorization process
  const vectorizeImage = useCallback(async () => {
    if (!originalImage || !canvasRef.current) return;
    
    setIsProcessing(true);
    setProgress('Loading image...');
    
    const img = new Image();
    img.src = originalImage;
    
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Resize image to manageable size (max 400px)
    let width = img.width;
    let height = img.height;
    const maxDim = 400;
    
    if (width > maxDim || height > maxDim) {
      const ratio = Math.min(maxDim / width, maxDim / height);
      width = Math.floor(width * ratio);
      height = Math.floor(height * ratio);
    }
    
    canvas.width = width;
    canvas.height = height;
    
    setProgress('Drawing image...');
    ctx.drawImage(img, 0, 0, width, height);
    
    setProgress('Detecting edges...');
    const imageData = ctx.getImageData(0, 0, width, height);
    const edgeData = detectEdges(imageData);
    
    setProgress('Tracing contours...');
    const contours = traceContours(edgeData);
    
    setProgress(`Found ${contours.length} contours, generating SVG...`);
    
    // Generate SVG
    const svgWidth = width;
    const svgHeight = height;
    let svgPaths = '';
    
    for (const contour of contours) {
      if (contour.length < 3) continue;
      
      let pathData = `M ${contour[0][0]} ${contour[0][1]}`;
      for (let i = 1; i < contour.length; i++) {
        pathData += ` L ${contour[i][0]} ${contour[i][1]}`;
      }
      pathData += ' Z';
      
      svgPaths += `<path d="${pathData}" fill="none" stroke="black" stroke-width="1.5" stroke-linejoin="round" />`;
    }
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">${svgPaths}</svg>`;
    
    setVectorizedSvg(svg);
    setProgress('Complete!');
    setIsProcessing(false);
    
    // Draw vectorized result on canvas for preview
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    for (const contour of contours) {
      if (contour.length < 3) continue;
      ctx.beginPath();
      ctx.moveTo(contour[0][0], contour[0][1]);
      for (let i = 1; i < contour.length; i++) {
        ctx.lineTo(contour[i][0], contour[i][1]);
      }
      ctx.closePath();
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [originalImage]);

  const downloadSvg = () => {
    if (!vectorizedSvg) return;
    
    const blob = new Blob([vectorizedSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vectorized-image.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-4">Image Vectorizer for Blurred Images</h1>
      
      <div className="mb-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      
      {originalImage && (
        <div className="mb-4">
          <button
            onClick={vectorizeImage}
            disabled={isProcessing}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Vectorizing...' : 'Vectorize Image'}
          </button>
        </div>
      )}
      
      {progress && isProcessing && (
        <div className="mb-4 text-sm text-gray-600">
          Progress: {progress}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            Vectorized Result {vectorizedSvg && '(Preview)'}
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
        <p>
          <strong>How it works:</strong> This component uses edge detection (Sobel operator + Canny-like hysteresis)
          to find contours in blurred images, then traces and simplifies the contours into vector paths.
          Works best on images with clear boundaries between light and dark areas.
        </p>
      </div>
    </div>
  );
};

export default VectorizeBlurredImage;
