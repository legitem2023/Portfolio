"use client";

import React, { useState, useRef, useEffect } from 'react';

interface ColorLayer {
  id: string;
  hex: string;
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

  // Convert RGB to Hex
  const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(x).toString(16).padStart(2, '0');
      return hex;
    }).join('').toUpperCase();
  };

  // Extract unique colors from image with better tolerance
  const extractColors = (imageData: ImageData): Map<string, { r: number; g: number; b: number; count: number; hex: string }> => {
    const pixels = imageData.data;
    const colorMap = new Map<string, { r: number; g: number; b: number; count: number; hex: string }>();
    
    // Use a smaller quantization step for more accurate colors
    const quantize = (value: number): number => Math.round(value / 16) * 16;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      
      if (a < 128) continue; // Skip transparent/semi-transparent pixels
      
      // Skip white and very light colors (optional - comment out if you want white included)
      // if (r > 250 && g > 250 && b > 250) continue;
      
      const qR = quantize(r);
      const qG = quantize(g);
      const qB = quantize(b);
      
      const key = `${qR},${qG},${qB}`;
      
      if (colorMap.has(key)) {
        colorMap.get(key)!.count++;
      } else {
        colorMap.set(key, { 
          r: qR, 
          g: qG, 
          b: qB, 
          count: 1,
          hex: rgbToHex(qR, qG, qB)
        });
      }
    }
    
    return colorMap;
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
        
        // Limit max size for performance
        const maxSize = 1200;
        let width = img.width;
        let height = img.height;
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const imageData = ctx.getImageData(0, 0, width, height);
        const colorMap = extractColors(imageData);
        
        console.log('Found colors:', colorMap.size);
        
        // Filter out colors with very few pixels (noise)
        const minPixels = (width * height) * 0.001; // 0.1% of image
        const filteredColors = Array.from(colorMap.entries())
          .filter(([_, data]) => data.count >= minPixels)
          .sort((a, b) => b[1].count - a[1].count);
        
        console.log('Filtered colors:', filteredColors.length);
        
        const layers: ColorLayer[] = [];
        const visibility: Record<string, boolean> = {};
        
        // Create separation for each color
        filteredColors.forEach(([key, colorData], index) => {
          const { r, g, b, hex } = colorData;
          
          // Create layer canvas
          const layerCanvas = document.createElement('canvas');
          layerCanvas.width = width;
          layerCanvas.height = height;
          const layerCtx = layerCanvas.getContext('2d')!;
          
          const layerImageData = layerCtx.createImageData(width, height);
          const pixels = imageData.data;
          const layerPixels = layerImageData.data;
          
          // Calculate color distance tolerance dynamically
          const tolerance = 35;
          
          // Extract only this color
          for (let i = 0; i < pixels.length; i += 4) {
            const pR = pixels[i];
            const pG = pixels[i + 1];
            const pB = pixels[i + 2];
            const pA = pixels[i + 3];
            
            if (pA < 128) {
              layerPixels[i + 3] = 0;
              continue;
            }
            
            // Calculate color distance
            const dist = Math.sqrt(
              Math.pow(pR - r, 2) + 
              Math.pow(pG - g, 2) + 
              Math.pow(pB - b, 2)
            );
            
            if (dist < tolerance) {
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
            hex: hex,
            imageData: layerCanvas.toDataURL('image/png'),
            pixelCount: colorData.count
          });
          
          visibility[layerId] = true;
        });
        
        setColorLayers(layers);
        setVisibleLayers(visibility);
        setOriginalImage(canvas.toDataURL('image/png'));
        
        // Create merged preview
        mergeLayers(layers, visibility, width, height);
        
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
    
    // White background
    mergeCtx.fillStyle = '#FFFFFF';
    mergeCtx.fillRect(0, 0, width, height);
    
    // Load and draw all visible layers
    let loadedCount = 0;
    const visibleLayerCount = layers.filter(l => visibility[l.id]).length;
    
    if (visibleLayerCount === 0) {
      setMergedImage(mergeCanvas.toDataURL('image/png'));
      return;
    }
    
    layers.forEach(layer => {
      if (visibility[layer.id]) {
        const img = new Image();
        img.onload = () => {
          mergeCtx.drawImage(img, 0, 0);
          loadedCount++;
          if (loadedCount === visibleLayerCount) {
            setMergedImage(mergeCanvas.toDataURL('image/png'));
          }
        };
        img.src = layer.imageData;
      }
    });
  };

  // Toggle layer visibility
  const toggleLayer = (layerId: string) => {
    const newVisibility = {
      ...visibleLayers,
      [layerId]: !visibleLayers[layerId]
    };
    setVisibleLayers(newVisibility);
    
    if (originalImage) {
      const img = new Image();
      img.src = originalImage;
      img.onload = () => {
        mergeLayers(colorLayers, newVisibility, img.width, img.height);
      };
    }
  };

  // Toggle all layers
  const toggleAll = (visible: boolean) => {
    const newVisibility: Record<string, boolean> = {};
    colorLayers.forEach(layer => {
      newVisibility[layer.id] = visible;
    });
    setVisibleLayers(newVisibility);
    
    if (originalImage) {
      const img = new Image();
      img.src = originalImage;
      img.onload = () => {
        mergeLayers(colorLayers, newVisibility, img.width, img.height);
      };
    }
  };

  // Download all layers
  const downloadAll = () => {
    colorLayers.forEach((layer, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.download = `separation_${layer.hex.replace('#', '')}.png`;
        link.href = layer.imageData;
        link.click();
      }, index * 200);
    });
  };

  // Download merged result
  const downloadMerged = () => {
    if (mergedImage) {
      const link = document.createElement('a');
      link.download = 'merged_result.png';
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
      <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>🎨 Automatic Color Separation</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
        Upload an image and colors will be automatically detected and separated
      </p>
      
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
          <p style={{ fontSize: '14px', color: '#999', marginTop: '10px' }}>
            PNG, JPG, GIF supported
          </p>
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
          <p style={{ marginTop: '20px', color: '#666' }}>Detecting colors and creating separations...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {originalImage && !isProcessing && (
        <div>
          {/* Controls */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button onClick={reset} style={buttonStyle('#666')}>← New Image</button>
            <button onClick={downloadAll} style={buttonStyle('#28a745')}>⬇ Download All ({colorLayers.length})</button>
            <button onClick={downloadMerged} style={buttonStyle('#0066cc')}>⬇ Download Merged</button>
            <div style={{ flex: 1 }} />
            <button onClick={() => toggleAll(true)} style={buttonStyle('#888', 'small')}>Show All</button>
            <button onClick={() => toggleAll(false)} style={buttonStyle('#888', 'small')}>Hide All</button>
          </div>

          {/* Original vs Merged comparison */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              backgroundColor: '#f5f5f5',
              borderRadius: '16px',
              padding: '20px'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '15px' }}>📷 Original Image</h3>
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '15px',
                textAlign: 'center'
              }}>
                <img 
                  src={originalImage} 
                  alt="Original" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '300px',
                    borderRadius: '8px'
                  }} 
                />
              </div>
            </div>

            <div style={{
              backgroundColor: '#f5f5f5',
              borderRadius: '16px',
              padding: '20px'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '15px' }}>
                🖼️ Merged Separations 
                <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#666', marginLeft: '10px' }}>
                  ({Object.values(visibleLayers).filter(v => v).length} layers)
                </span>
              </h3>
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '15px',
                textAlign: 'center',
                minHeight: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {mergedImage ? (
                  <img 
                    src={mergedImage} 
                    alt="Merged result" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '300px',
                      borderRadius: '8px'
                    }} 
                  />
                ) : (
                  <p style={{ color: '#999' }}>Loading merged result...</p>
                )}
              </div>
            </div>
          </div>

          {/* Color toggle buttons */}
          <div style={{
            backgroundColor: '#f9f9f9',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '30px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>🎨 Detected Colors ({colorLayers.length})</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              Click on any color to toggle visibility in the merged result
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {colorLayers.map(layer => (
                <button
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 18px',
                    borderRadius: '30px',
                    border: '2px solid',
                    borderColor: visibleLayers[layer.id] ? layer.hex : '#ddd',
                    backgroundColor: visibleLayers[layer.id] ? layer.hex + '20' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: visibleLayers[layer.id] ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <span style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '6px',
                    backgroundColor: layer.hex,
                    border: '1px solid #ccc'
                  }} />
                  <span style={{ 
                    fontWeight: visibleLayers[layer.id] ? '600' : '400',
                    color: visibleLayers[layer.id] ? '#333' : '#999',
                    textDecoration: visibleLayers[layer.id] ? 'none' : 'line-through'
                  }}>
                    {layer.hex}
                  </span>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#888',
                    marginLeft: '4px'
                  }}>
                    ({Math.round(layer.pixelCount / (originalImage ? 1 : 1)).toLocaleString()})
                  </span>
                  <span style={{ marginLeft: '4px' }}>
                    {visibleLayers[layer.id] ? '👁️' : '👁️‍🗨️'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Individual separations grid */}
          <h3 style={{ marginBottom: '20px' }}>📋 Individual Color Plates</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '15px'
          }}>
            {colorLayers.map(layer => (
              <div key={layer.id} style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid #eee'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  marginBottom: '10px' 
                }}>
                  <span style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    backgroundColor: layer.hex,
                    border: '2px solid #ddd'
                  }} />
                  <span style={{ 
                    fontWeight: '600', 
                    fontSize: '13px',
                    fontFamily: 'monospace'
                  }}>
                    {layer.hex}
                  </span>
                </div>
                
                <div style={{
                  backgroundColor: '#f0f0f0',
                  borderRadius: '8px',
                  padding: '6px',
                  marginBottom: '10px',
                  backgroundImage: `linear-gradient(45deg, #ccc 25%, transparent 25%),
                    linear-gradient(-45deg, #ccc 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #ccc 75%),
                    linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
                  backgroundSize: '10px 10px',
                  backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px'
                }}>
                  <img 
                    src={layer.imageData} 
                    alt={layer.hex}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
                
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.download = `plate_${layer.hex.replace('#', '')}.png`;
                    link.href = layer.imageData;
                    link.click();
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: layer.hex,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
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

const buttonStyle = (bgColor: string, size: 'normal' | 'small' = 'normal'): React.CSSProperties => ({
  padding: size === 'small' ? '8px 16px' : '12px 24px',
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
