"use client";

import React, { useState, useRef, useEffect } from 'react';

interface ColorLayer {
  id: string;
  color: string;
  name: string;
  imageData: string;
  pixelCount: number;
}

const SimpleSilkscreenSeparator: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [colorLayers, setColorLayers] = useState<ColorLayer[]>([]);
  const [mergedImage, setMergedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Extract unique colors from image
  const extractColors = (imageData: ImageData): Map<string, { r: number; g: number; b: number; count: number }> => {
    const pixels = imageData.data;
    const colorMap = new Map<string, { r: number; g: number; b: number; count: number }>();
    
    // Quantize colors to group similar ones (makes separation cleaner)
    const quantize = (value: number): number => Math.round(value / 32) * 32;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      
      if (a < 128) continue; // Skip transparent pixels
      
      // Quantize to group similar colors
      const qR = quantize(r);
      const qG = quantize(g);
      const qB = quantize(b);
      
      const key = `${qR},${qG},${qB}`;
      
      if (colorMap.has(key)) {
        colorMap.get(key)!.count++;
      } else {
        colorMap.set(key, { r: qR, g: qG, b: qB, count: 1 });
      }
    }
    
    return colorMap;
  };

  // Get color name
  const getColorName = (r: number, g: number, b: number): string => {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    if (diff < 30) {
      if (max < 50) return 'Black';
      if (max > 200) return 'White';
      return 'Gray';
    }
    
    if (r === max && r > 150) return g > 100 && b > 100 ? 'Orange' : 'Red';
    if (g === max && g > 150) return r > 100 && b > 100 ? 'Yellow-Green' : 'Green';
    if (b === max && b > 150) return r > 100 && g > 100 ? 'Purple' : 'Blue';
    if (r > 200 && g > 200 && b < 100) return 'Yellow';
    if (r > 200 && b > 200 && g < 100) return 'Magenta';
    if (g > 200 && b > 200 && r < 100) return 'Cyan';
    
    return 'Color';
  };

  // Process image and create separations
  const processImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setIsProcessing(true);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const colorMap = extractColors(imageData);
        
        // Sort colors by pixel count (most used first)
        const sortedColors = Array.from(colorMap.entries())
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 8); // Limit to 8 colors max
        
        const layers: ColorLayer[] = [];
        const visibility: Record<string, boolean> = {};
        
        // Create separation for each color
        sortedColors.forEach(([key, colorData], index) => {
          const [r, g, b] = key.split(',').map(Number);
          const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          
          // Create layer canvas
          const layerCanvas = document.createElement('canvas');
          layerCanvas.width = canvas.width;
          layerCanvas.height = canvas.height;
          const layerCtx = layerCanvas.getContext('2d')!;
          
          const layerImageData = layerCtx.createImageData(canvas.width, canvas.height);
          const pixels = imageData.data;
          const layerPixels = layerImageData.data;
          
          // Extract only this color
          for (let i = 0; i < pixels.length; i += 4) {
            const pR = pixels[i];
            const pG = pixels[i + 1];
            const pB = pixels[i + 2];
            const pA = pixels[i + 3];
            
            // Check if pixel matches this color (with tolerance)
            const tolerance = 40;
            if (pA > 128 && 
                Math.abs(pR - r) < tolerance && 
                Math.abs(pG - g) < tolerance && 
                Math.abs(pB - b) < tolerance) {
              layerPixels[i] = r;
              layerPixels[i + 1] = g;
              layerPixels[i + 2] = b;
              layerPixels[i + 3] = 255;
            } else {
              layerPixels[i + 3] = 0;
            }
          }
          
          layerCtx.putImageData(layerImageData, 0, 0);
          
          const layerId = `layer-${index}`;
          layers.push({
            id: layerId,
            color: hex,
            name: `${getColorName(r, g, b)} ${index + 1}`,
            imageData: layerCanvas.toDataURL('image/png'),
            pixelCount: colorData.count
          });
          
          visibility[layerId] = true;
        });
        
        setColorLayers(layers);
        setVisibleLayers(visibility);
        setOriginalImage(canvas.toDataURL('image/png'));
        
        // Create merged preview
        mergeLayers(layers, visibility, canvas.width, canvas.height);
        
        setIsProcessing(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Merge visible layers into one image
  const mergeLayers = (layers: ColorLayer[], visibility: Record<string, boolean>, width: number, height: number) => {
    const mergeCanvas = document.createElement('canvas');
    mergeCanvas.width = width;
    mergeCanvas.height = height;
    const mergeCtx = mergeCanvas.getContext('2d')!;
    
    // Clear with white background
    mergeCtx.fillStyle = '#FFFFFF';
    mergeCtx.fillRect(0, 0, width, height);
    
    // Draw visible layers
    layers.forEach(layer => {
      if (visibility[layer.id]) {
        const img = new Image();
        img.src = layer.imageData;
        mergeCtx.drawImage(img, 0, 0);
      }
    });
    
    setMergedImage(mergeCanvas.toDataURL('image/png'));
  };

  // Toggle layer visibility
  const toggleLayer = (layerId: string) => {
    const newVisibility = {
      ...visibleLayers,
      [layerId]: !visibleLayers[layerId]
    };
    setVisibleLayers(newVisibility);
    
    // Update merged preview
    if (originalImage) {
      const img = new Image();
      img.src = originalImage;
      img.onload = () => {
        mergeLayers(colorLayers, newVisibility, img.width, img.height);
      };
    }
  };

  // Download all layers as ZIP
  const downloadAll = () => {
    colorLayers.forEach((layer, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.download = `separation_${index + 1}_${layer.name.replace(/\s+/g, '_')}.png`;
        link.href = layer.imageData;
        link.click();
      }, index * 200);
    });
  };

  // Download merged result
  const downloadMerged = () => {
    if (mergedImage) {
      const link = document.createElement('a');
      link.download = 'merged_separations.png';
      link.href = mergedImage;
      link.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const reset = () => {
    setOriginalImage(null);
    setColorLayers([]);
    setMergedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>🎨 Automatic Color Separation</h1>
      
      {!originalImage && (
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '3px dashed #ccc',
            borderRadius: '20px',
            padding: '60px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: '#f9f9f9',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#0066cc';
            e.currentTarget.style.backgroundColor = '#f0f7ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#ccc';
            e.currentTarget.style.backgroundColor = '#f9f9f9';
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🖼️</div>
          <p style={{ fontSize: '18px', color: '#666' }}>Click to upload your image</p>
          <p style={{ fontSize: '14px', color: '#999', marginTop: '10px' }}>Colors will be automatically detected and separated</p>
        </div>
      )}

      {isProcessing && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ 
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #0066cc',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ marginTop: '20px', color: '#666' }}>Processing image...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {originalImage && !isProcessing && (
        <div>
          {/* Controls */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
            <button onClick={reset} style={buttonStyle('#666')}>← New Image</button>
            <button onClick={downloadAll} style={buttonStyle('#28a745')}>⬇ Download All Separations</button>
            <button onClick={downloadMerged} style={buttonStyle('#0066cc')}>⬇ Download Merged Result</button>
          </div>

          {/* MERGED RESULT - Main display at bottom */}
          <div style={{
            backgroundColor: '#f5f5f5',
            borderRadius: '16px',
            padding: '30px',
            marginBottom: '30px'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              🖼️ Merged Result
              <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#666' }}>
                ({Object.values(visibleLayers).filter(v => v).length} of {colorLayers.length} layers visible)
              </span>
            </h2>
            
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              {mergedImage && (
                <img 
                  src={mergedImage} 
                  alt="Merged separations" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '400px',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }} 
                />
              )}
            </div>

            {/* Layer toggle buttons */}
            <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {colorLayers.map(layer => (
                <button
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '30px',
                    border: '2px solid',
                    borderColor: visibleLayers[layer.id] ? layer.color : '#ddd',
                    backgroundColor: visibleLayers[layer.id] ? layer.color + '20' : '#f5f5f5',
                    color: visibleLayers[layer.id] ? '#333' : '#999',
                    cursor: 'pointer',
                    fontWeight: visibleLayers[layer.id] ? '600' : '400',
                    transition: 'all 0.2s',
                    textDecoration: visibleLayers[layer.id] ? 'none' : 'line-through'
                  }}
                >
                  <span style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    backgroundColor: layer.color,
                    border: '1px solid #ccc'
                  }} />
                  {layer.name}
                  <span style={{ marginLeft: '4px' }}>
                    {visibleLayers[layer.id] ? '👁️' : '👁️‍🗨️'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Individual separations */}
          <h2 style={{ marginBottom: '20px' }}>📋 Individual Color Separations</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            {colorLayers.map(layer => (
              <div key={layer.id} style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid #eee'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    backgroundColor: layer.color,
                    border: '2px solid #ddd'
                  }} />
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>{layer.name}</span>
                </div>
                
                <div style={{
                  backgroundColor: '#f0f0f0',
                  borderRadius: '8px',
                  padding: '8px',
                  marginBottom: '12px',
                  backgroundImage: `linear-gradient(45deg, #ccc 25%, transparent 25%),
                    linear-gradient(-45deg, #ccc 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #ccc 75%),
                    linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
                  backgroundSize: '12px 12px',
                  backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px'
                }}>
                  <img 
                    src={layer.imageData} 
                    alt={layer.name}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
                
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                  Pixels: {layer.pixelCount.toLocaleString()}
                </div>
                
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.download = `${layer.name.replace(/\s+/g, '_')}.png`;
                    link.href = layer.imageData;
                    link.click();
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#333',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const buttonStyle = (bgColor: string): React.CSSProperties => ({
  padding: '12px 24px',
  backgroundColor: bgColor,
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  transition: 'all 0.2s'
});

export default SimpleSilkscreenSeparator;
