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
  const [colorDistanceThreshold, setColorDistanceThreshold] = useState<number>(30);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert RGB to Hex
  const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(x).toString(16).padStart(2, '0');
      return hex;
    }).join('').toUpperCase();
  };

  // Calculate color distance (Euclidean)
  const colorDistance = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number => {
    return Math.sqrt(
      Math.pow(r1 - r2, 2) +
      Math.pow(g1 - g2, 2) +
      Math.pow(b1 - b2, 2)
    );
  };

  // Find closest existing color group
  const findClosestColorGroup = (
    r: number, 
    g: number, 
    b: number, 
    groups: Array<{ r: number; g: number; b: number; count: number; colors: Array<{ r: number; g: number; b: number }> }>,
    threshold: number
  ): number | null => {
    let minDistance = Infinity;
    let closestIndex = null;
    
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const dist = colorDistance(r, g, b, group.r, group.g, group.b);
      
      if (dist < minDistance && dist <= threshold) {
        minDistance = dist;
        closestIndex = i;
      }
    }
    
    return closestIndex;
  };

  // Extract and group similar colors
  const extractAndGroupColors = (imageData: ImageData, threshold: number, onProgress?: (progress: number) => void): Map<string, { r: number; g: number; b: number; count: number; hex: string }> => {
    const pixels = imageData.data;
    const colorGroups: Array<{ r: number; g: number; b: number; count: number; colors: Array<{ r: number; g: number; b: number }> }> = [];
    
    const totalPixels = pixels.length / 4;
    let processedPixels = 0;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      
      if (a < 128) {
        processedPixels++;
        if (onProgress && processedPixels % 1000 === 0) {
          onProgress((processedPixels / totalPixels) * 30);
        }
        continue;
      }
      
      // Find if this color belongs to an existing group
      const closestGroupIndex = findClosestColorGroup(r, g, b, colorGroups, threshold);
      
      if (closestGroupIndex !== null) {
        // Add to existing group and update average
        const group = colorGroups[closestGroupIndex];
        group.colors.push({ r, g, b });
        group.count++;
        
        // Recalculate average color for the group (do this every 100 pixels for performance)
        if (group.colors.length % 100 === 0) {
          let sumR = 0, sumG = 0, sumB = 0;
          for (const color of group.colors) {
            sumR += color.r;
            sumG += color.g;
            sumB += color.b;
          }
          group.r = sumR / group.colors.length;
          group.g = sumG / group.colors.length;
          group.b = sumB / group.colors.length;
        }
      } else {
        // Create new group
        colorGroups.push({
          r, g, b,
          count: 1,
          colors: [{ r, g, b }]
        });
      }
      
      processedPixels++;
      if (onProgress && processedPixels % 1000 === 0) {
        onProgress((processedPixels / totalPixels) * 30);
      }
    }
    
    // Final average calculation for all groups
    for (const group of colorGroups) {
      let sumR = 0, sumG = 0, sumB = 0;
      for (const color of group.colors) {
        sumR += color.r;
        sumG += color.g;
        sumB += color.b;
      }
      group.r = sumR / group.colors.length;
      group.g = sumG / group.colors.length;
      group.b = sumB / group.colors.length;
    }
    
    // Convert to Map format
    const colorMap = new Map<string, { r: number; g: number; b: number; count: number; hex: string }>();
    
    for (const group of colorGroups) {
      const key = `${Math.round(group.r)},${Math.round(group.g)},${Math.round(group.b)}`;
      colorMap.set(key, {
        r: Math.round(group.r),
        g: Math.round(group.g),
        b: Math.round(group.b),
        count: group.count,
        hex: rgbToHex(Math.round(group.r), Math.round(group.g), Math.round(group.b))
      });
    }
    
    return colorMap;
  };

  // Process image and create separations
  const processImage = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        setIsProcessing(true);
        setLoadingProgress(0);
        
        try {
          setLoadingStage('Loading image...');
          setLoadingProgress(5);
          
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
          
          setLoadingStage('Reading image data...');
          setLoadingProgress(10);
          
          const imageData = ctx.getImageData(0, 0, width, height);
          
          setLoadingStage('Analyzing colors...');
          setLoadingProgress(15);
          
          // Extract and group similar colors with progress callback
          const colorMap = await new Promise<Map<string, { r: number; g: number; b: number; count: number; hex: string }>>((resolve) => {
            const result = extractAndGroupColors(imageData, colorDistanceThreshold, (progress) => {
              setLoadingProgress(15 + (progress * 0.3));
            });
            resolve(result);
          });
          
          setLoadingStage(`Found ${colorMap.size} color groups...`);
          setLoadingProgress(50);
          
          // Filter out colors with very few pixels (noise)
          const minPixels = (width * height) * 0.002; // 0.2% of image
          const filteredColors = Array.from(colorMap.entries())
            .filter(([_, data]) => data.count >= minPixels)
            .sort((a, b) => b[1].count - a[1].count);
          
          setLoadingStage(`Creating ${filteredColors.length} color separations...`);
          setLoadingProgress(60);
          
          const layers: ColorLayer[] = [];
          const visibility: Record<string, boolean> = {};
          
          // Create separation for each color group with progress
          for (let index = 0; index < filteredColors.length; index++) {
            const [key, colorData] = filteredColors[index];
            const { r, g, b, hex } = colorData;
            
            setLoadingStage(`Creating layer ${index + 1} of ${filteredColors.length}...`);
            setLoadingProgress(60 + (index / filteredColors.length) * 30);
            
            // Create layer canvas
            const layerCanvas = document.createElement('canvas');
            layerCanvas.width = width;
            layerCanvas.height = height;
            const layerCtx = layerCanvas.getContext('2d')!;
            
            const layerImageData = layerCtx.createImageData(width, height);
            const pixels = imageData.data;
            const layerPixels = layerImageData.data;
            
            // Use adaptive tolerance based on color distance threshold
            const tolerance = colorDistanceThreshold;
            
            // Extract pixels belonging to this color group
            for (let i = 0; i < pixels.length; i += 4) {
              const pR = pixels[i];
              const pG = pixels[i + 1];
              const pB = pixels[i + 2];
              const pA = pixels[i + 3];
              
              if (pA < 128) {
                layerPixels[i + 3] = 0;
                continue;
              }
              
              // Calculate color distance from group center
              const dist = colorDistance(pR, pG, pB, r, g, b);
              
              if (dist <= tolerance) {
                // Use the original color or group color? Using group color for consistency
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
          }
          
          setLoadingStage('Merging layers for preview...');
          setLoadingProgress(95);
          
          setColorLayers(layers);
          setVisibleLayers(visibility);
          setOriginalImage(canvas.toDataURL('image/png'));
          
          // Create merged preview
          await mergeLayers(layers, visibility, width, height);
          
          setLoadingStage('Complete!');
          setLoadingProgress(100);
          
          // Short delay to show 100%
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error('Error processing image:', error);
          setLoadingStage('Error processing image');
        } finally {
          setIsProcessing(false);
          setLoadingProgress(0);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Merge visible layers into one image
  const mergeLayers = (layers: ColorLayer[], visibility: Record<string, boolean>, width: number, height: number): Promise<void> => {
    return new Promise((resolve) => {
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
        resolve();
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
              resolve();
            }
          };
          img.src = layer.imageData;
        }
      });
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
    setLoadingStage('');
    setLoadingProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateThreshold = (newThreshold: number) => {
    setColorDistanceThreshold(newThreshold);
    if (fileInputRef.current?.files?.[0]) {
      processImage(fileInputRef.current.files[0]);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>🎨 Smart Color Distinction</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
        Automatically detects and distinguishes similar colors in your image
      </p>
      
      {!originalImage && !isProcessing && (
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
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 40px',
          backgroundColor: '#f9f9f9',
          borderRadius: '20px',
          border: '2px solid #e0e0e0'
        }}>
          <div style={{ 
            display: 'inline-block',
            width: '60px',
            height: '60px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #0066cc',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }} />
          
          <h3 style={{ marginBottom: '10px', color: '#333' }}>{loadingStage || 'Processing...'}</h3>
          
          <div style={{ 
            maxWidth: '400px', 
            margin: '20px auto',
            backgroundColor: '#e0e0e0',
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${loadingProgress}%`, 
              height: '8px', 
              backgroundColor: '#0066cc',
              transition: 'width 0.3s ease'
            }} />
          </div>
          
          <p style={{ fontSize: '14px', color: '#666' }}>
            {Math.round(loadingProgress)}% complete
          </p>
          
          <p style={{ fontSize: '12px', color: '#999', marginTop: '20px' }}>
            Please wait while we analyze your image...
          </p>
          
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {originalImage && !isProcessing && (
        <div>
          {/* Controls */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={reset} style={buttonStyle('#666')}>← New Image</button>
            <button onClick={downloadAll} style={buttonStyle('#28a745')}>⬇ Download All ({colorLayers.length})</button>
            <button onClick={downloadMerged} style={buttonStyle('#0066cc')}>⬇ Download Merged</button>
            
            <div style={{ flex: 1 }} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '14px', color: '#666' }}>
                Color Sensitivity: 
              </label>
              <input
                type="range"
                min="10"
                max="80"
                value={colorDistanceThreshold}
                onChange={(e) => updateThreshold(Number(e.target.value))}
                style={{ width: '150px' }}
              />
              <span style={{ fontSize: '12px', color: '#999', minWidth: '60px' }}>
                {colorDistanceThreshold === 10 ? 'Strict' : 
                 colorDistanceThreshold <= 30 ? 'Normal' : 
                 colorDistanceThreshold <= 50 ? 'Loose' : 'Very Loose'}
              </span>
            </div>
            
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
                🖼️ Distinguished Colors 
                <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#666', marginLeft: '10px' }}>
                  ({Object.values(visibleLayers).filter(v => v).length} / {colorLayers.length} layers)
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
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>🎨 Distinguished Color Groups ({colorLayers.length})</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              Similar colors are grouped together. Adjust the sensitivity slider to merge or separate colors.
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
                    ({Math.round(layer.pixelCount / 1000).toLocaleString()}K px)
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
