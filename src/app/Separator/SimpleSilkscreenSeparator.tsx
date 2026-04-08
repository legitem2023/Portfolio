'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ColorLayer {
  id: string;
  hex: string;
  imageData: string;
  blackImageData: string; // Black version for download
  pixelCount: number;
}

const SimpleSilkscreenSeparator: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [colorLayers, setColorLayers] = useState<ColorLayer[]>([]);
  const [mergedImage, setMergedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>({});
  const [maxColors, setMaxColors] = useState<number>(8); // User-configurable max colors
  const [colorCount, setColorCount] = useState<number>(0); // Actual detected color count
  
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

  // Convert colored separation to black (for film output)
  const convertToBlackSeparation = (coloredImageData: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        // Convert all non-transparent pixels to black
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i + 3] > 0) {
            pixels[i] = 0;       // R
            pixels[i + 1] = 0;   // G
            pixels[i + 2] = 0;   // B
            // Alpha stays the same
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = coloredImageData;
    });
  };

  // Process image and create separations
  const processImage = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.onload = async () => {
        setIsProcessing(true);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        
        // Increase max size for 4K quality output
        // Target 4K resolution: 3840 x 2160 or similar, but respect original aspect ratio
        // Max dimension set to 3840px for 4K quality
        const maxSize = 3840; // 4K width/height cap for quality
        let width = img.width;
        let height = img.height;
        
        // For 4K output: if image is larger than 3840px in any dimension, scale down to 3840
        // but if it's smaller, keep original size to preserve quality
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
        let filteredColors = Array.from(colorMap.entries())
          .filter(([_, data]) => data.count >= minPixels)
          .sort((a, b) => b[1].count - a[1].count);
        
        console.log('Initial colors after filtering:', filteredColors.length);
        
        // Smart color merging - respect user's maxColors setting
        // If the actual number of colors is less than maxColors, use the actual number
        const targetMaxColors = maxColors;
        let finalColorCount = filteredColors.length;
        
        if (filteredColors.length > targetMaxColors) {
          // Calculate color similarity (Euclidean distance)
          const colorDistance = (c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }) => {
            return Math.sqrt(
              Math.pow(c1.r - c2.r, 2) +
              Math.pow(c1.g - c2.g, 2) +
              Math.pow(c1.b - c2.b, 2)
            );
          };
          
          // Merge two colors by weighted average (by pixel count)
          const mergeColors = (
            c1: { r: number; g: number; b: number; count: number },
            c2: { r: number; g: number; b: number; count: number }
          ) => {
            const totalCount = c1.count + c2.count;
            return {
              r: (c1.r * c1.count + c2.r * c2.count) / totalCount,
              g: (c1.g * c1.count + c2.g * c2.count) / totalCount,
              b: (c1.b * c1.count + c2.b * c2.count) / totalCount,
              count: totalCount,
              hex: ''
            };
          };
          
          // Convert to mutable array
          let colorsToMerge = filteredColors.map(([key, data]) => ({
            key,
            r: data.r,
            g: data.g,
            b: data.b,
            count: data.count,
            hex: data.hex
          }));
          
          // Keep merging closest colors until we have targetMaxColors or less
          while (colorsToMerge.length > targetMaxColors) {
            let closestPair: { i: number; j: number; distance: number } | null = null;
            
            // Find the two most similar colors
            for (let i = 0; i < colorsToMerge.length; i++) {
              for (let j = i + 1; j < colorsToMerge.length; j++) {
                const distance = colorDistance(colorsToMerge[i], colorsToMerge[j]);
                if (!closestPair || distance < closestPair.distance) {
                  closestPair = { i, j, distance };
                }
              }
            }
            
            if (closestPair) {
              const { i, j } = closestPair;
              const merged = mergeColors(colorsToMerge[i], colorsToMerge[j]);
              merged.hex = rgbToHex(merged.r, merged.g, merged.b);
              
              // Replace the first color with merged version, remove the second
              colorsToMerge[i] = {
                ...merged,
                key: `merged-${colorsToMerge[i].key}-${colorsToMerge[j].key}`
              };
              colorsToMerge.splice(j, 1);
            } else {
              break;
            }
          }
          
          // Convert back to filteredColors format
          filteredColors = colorsToMerge.map(color => [
            color.key,
            {
              r: Math.round(color.r),
              g: Math.round(color.g),
              b: Math.round(color.b),
              count: color.count,
              hex: color.hex
            }
          ]) as [string, any][];
          
          finalColorCount = filteredColors.length;
          console.log(`Merged from ${colorMap.size} to ${finalColorCount} colors (max ${targetMaxColors})`);
        } else {
          finalColorCount = filteredColors.length;
          console.log(`Using all ${finalColorCount} colors (less than max ${targetMaxColors})`);
        }
        
        setColorCount(finalColorCount);
        console.log('Final colors:', finalColorCount);
        
        const layers: ColorLayer[] = [];
        const visibility: Record<string, boolean> = {};
        
        // Create separation for each color at full resolution
        for (let index = 0; index < filteredColors.length; index++) {
          const [key, colorData] = filteredColors[index];
          const { r, g, b, hex } = colorData;
          
          // Create layer canvas at original processed dimensions (up to 4K)
          const layerCanvas = document.createElement('canvas');
          layerCanvas.width = width;
          layerCanvas.height = height;
          const layerCtx = layerCanvas.getContext('2d')!;
          
          const layerImageData = layerCtx.createImageData(width, height);
          const pixels = imageData.data;
          const layerPixels = layerImageData.data;
          
          // Calculate color distance tolerance dynamically - adjusted for higher quality
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
          
          // Use PNG with maximum quality
          const coloredImageData = layerCanvas.toDataURL('image/png');
          const blackImageData = await convertToBlackSeparation(coloredImageData);
          
          const layerId = `layer-${index}`;
          layers.push({
            id: layerId,
            hex: hex,
            imageData: coloredImageData,
            blackImageData: blackImageData,
            pixelCount: colorData.count
          });
          
          visibility[layerId] = true;
        }
        
        setColorLayers(layers);
        setVisibleLayers(visibility);
        setOriginalImage(canvas.toDataURL('image/png'));
        
        // Create merged preview at full resolution
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

  // Download all layers as black separations
  const downloadAll = () => {
    colorLayers.forEach((layer, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.download = `separation_${layer.hex.replace('#', '')}_black.png`;
        link.href = layer.blackImageData;
        link.click();
      }, index * 200);
    });
  };

  // Download single layer as black separation
  const downloadLayer = (layer: ColorLayer) => {
    const link = document.createElement('a');
    link.download = `plate_${layer.hex.replace('#', '')}_black.png`;
    link.href = layer.blackImageData;
    link.click();
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
    setColorCount(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMaxColorsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 24) {
      setMaxColors(value);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>🎨 Automatic Color Separation</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
        Upload an image and colors will be automatically detected and separated
      </p>
      <p style={{ textAlign: 'center', color: '#0066cc', marginBottom: '30px', fontSize: '14px' }}>
        ⚫ Downloads are black separations ready for screen printing films
      </p>
      
      {!originalImage && (
        <div>
          {/* Max Colors Setting */}
          <div style={{
            backgroundColor: '#f0f7ff',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '30px',
            border: '1px solid #cce4ff'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '10px' }}>⚙️ Separation Settings</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Maximum Colors to Extract:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="range"
                    min="1"
                    max="24"
                    value={maxColors}
                    onChange={handleMaxColorsChange}
                    style={{ width: '200px' }}
                  />
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={maxColors}
                    onChange={handleMaxColorsChange}
                    style={{
                      width: '70px',
                      padding: '6px',
                      borderRadius: '6px',
                      border: '1px solid #ccc',
                      textAlign: 'center'
                    }}
                  />
                  <span style={{ color: '#666', fontSize: '14px' }}>
                    (1-24 colors)
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#666', marginTop: '8px', marginBottom: 0 }}>
                  If the image has fewer colors than the maximum, all detected colors will be used.
                </p>
              </div>
            </div>
          </div>

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
              PNG, JPG, GIF supported (up to {maxColors} colors)
            </p>
          </div>
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
            <button onClick={downloadAll} style={buttonStyle('#000000')}>⬇ Download All Black ({colorLayers.length})</button>
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
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>
              🎨 Detected Colors 
              <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#666', marginLeft: '10px' }}>
                ({colorLayers.length} colors extracted)
              </span>
            </h3>
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
          <h3 style={{ marginBottom: '20px' }}>📋 Individual Color Plates (Download = Black Film)</h3>
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
                  onClick={() => downloadLayer(layer)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#000000',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  ⚫ Download Black Film
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
