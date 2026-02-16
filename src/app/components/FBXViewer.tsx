'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface FBXViewerProps {
  modelPath?: string;
}

export default function FBXViewer({ modelPath = '/City/City.FBX' }: FBXViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string>('Initializing...');

  useEffect(() => {
    if (!containerRef.current) {
      setDebug('Container not ready');
      return;
    }

    setDebug('Setting up scene...');

    // Scene setup with realistic sky
    const scene = new THREE.Scene();
    
    // Simple gradient sky (lightweight)
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const context = canvas.getContext('2d');

    if (context) {
      const gradient = context.createLinearGradient(0, 0, 0, 2);
      gradient.addColorStop(0, '#0B2B4A'); // Deep blue at top
      gradient.addColorStop(0.5, '#3A6D8C'); // Medium blue mid
      gradient.addColorStop(1, '#D4C4A8'); // Warm horizon
      context.fillStyle = gradient;
      context.fillRect(0, 0, 2, 2);
      const gradientTexture = new THREE.CanvasTexture(canvas);
      scene.background = gradientTexture;
    }

    // Camera setup
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 400;
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(7, 21, 37);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "default"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 2.2;
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.maxPolarAngle = Math.PI / 2;
    controls.enableZoom = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.0;
    controls.target.set(0, 5, 0);

    // ============ MALIWANAG NA LIGHTING ============
    
    // Main sun light
    const sunLight = new THREE.DirectionalLight(0xFFE6AA, 2.5);
    sunLight.position.set(40, 50, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);

    // ============ SUN HELPER ============
    const sunSphereGeometry = new THREE.SphereGeometry(2, 16, 16);
    const sunSphereMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFAA00,
      emissive: 0xFF6600,
      emissiveIntensity: 3.0,
      roughness: 0.1,
      metalness: 0.1
    });
    
    const sunSphere = new THREE.Mesh(sunSphereGeometry, sunSphereMaterial);
    sunSphere.position.copy(sunLight.position);
    scene.add(sunSphere);
    
    const sunGlowLight = new THREE.PointLight(0xFFAA00, 2.5, 40);
    sunGlowLight.position.copy(sunLight.position);
    scene.add(sunGlowLight);
    
    const sunRingGeometry = new THREE.TorusGeometry(2.8, 0.15, 16, 32);
    const sunRingMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFDD00,
      emissive: 0xFF8800,
      emissiveIntensity: 2.0,
      transparent: true,
      opacity: 0.8
    });
    const sunRing = new THREE.Mesh(sunRingGeometry, sunRingMaterial);
    sunRing.position.copy(sunLight.position);
    sunRing.rotation.x = Math.PI / 2;
    scene.add(sunRing);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xA0B0C0, 0.9);
    scene.add(ambientLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0xE0F0FF, 0.8);
    fillLight.position.set(-30, 30, 40);
    scene.add(fillLight);

    // Back light
    const backLight = new THREE.DirectionalLight(0xFFFFFF, 0.6);
    backLight.position.set(-20, 40, -40);
    scene.add(backLight);

    // Front fill light
    const frontLight = new THREE.DirectionalLight(0xFFF0E0, 0.7);
    frontLight.position.set(20, 30, 50);
    scene.add(frontLight);
    
    // Top light
    const topLight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
    topLight.position.set(0, 80, 0);
    scene.add(topLight);
    
    // Center point light
    const centerLight = new THREE.PointLight(0xFFFFFF, 0.6, 100);
    centerLight.position.set(0, 20, 0);
    scene.add(centerLight);

    // ============ GROUND ============
    
    const groundRadius = 500;
    const groundSegments = 32;
    
    // Ground texture
    const groundCanvas = document.createElement('canvas');
    groundCanvas.width = 512;
    groundCanvas.height = 512;
    const groundCtx = groundCanvas.getContext('2d');
    
    if (groundCtx) {
      // Base color - dark cyan/gray
      groundCtx.fillStyle = '#2A403F';
      groundCtx.fillRect(0, 0, 512, 512);
      
      // Add texture
      const imageData = groundCtx.getImageData(0, 0, 512, 512);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const variation = (Math.random() - 0.5) * 25;
        data[i] = Math.min(200, Math.max(50, data[i] + variation));
        data[i+1] = Math.min(190, Math.max(60, data[i+1] + variation * 0.9));
        data[i+2] = Math.min(180, Math.max(70, data[i+2] + variation * 0.8));
      }
      
      groundCtx.putImageData(imageData, 0, 0);
      
      // Grid lines
      groundCtx.strokeStyle = '#3A5A55';
      groundCtx.lineWidth = 1;
      
      for (let i = 0; i < 512; i += 64) {
        groundCtx.beginPath();
        groundCtx.moveTo(i, 0);
        groundCtx.lineTo(i, 512);
        groundCtx.strokeStyle = 'rgba(58, 90, 85, 0.15)';
        groundCtx.stroke();
        
        groundCtx.beginPath();
        groundCtx.moveTo(0, i);
        groundCtx.lineTo(512, i);
        groundCtx.stroke();
      }
    }
    
    const groundTexture = new THREE.CanvasTexture(groundCanvas);
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(6, 6);
    
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      map: groundTexture,
      color: 0x3A5A55,
      roughness: 0.8,
      metalness: 0.1,
      emissive: new THREE.Color(0x000000)
    });
    
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(groundRadius, groundSegments),
      groundMaterial
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // Edge ring
    const edgeRing = new THREE.Mesh(
      new THREE.TorusGeometry(groundRadius, 1.5, 8, 48),
      new THREE.MeshStandardMaterial({
        color: 0x2A504A,
        emissive: new THREE.Color(0x1A3530),
        transparent: true,
        opacity: 0.3
      })
    );
    edgeRing.rotation.x = Math.PI / 2;
    edgeRing.position.y = 0.05;
    scene.add(edgeRing);

    // Fog
    scene.fog = new THREE.FogExp2(0x9AA9B5, 0.0008);

    setDebug('Loading FBX model...');

    // Load FBX model
    const loader = new FBXLoader();
    
    loader.load(
      modelPath,
      (object) => {
        setDebug('FBX model loaded successfully');
        setLoading(false);
        
        // Scale and position
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        const scale = 600 / Math.max(size.x, size.y, size.z);
        
        object.scale.set(scale, scale, scale);
        object.rotation.x = -(90 * Math.PI / 180);
        
        object.position.set(
          -center.x * scale,
          0,
          -center.z * scale
        );
        
        // ============ 200+ DARK CYAN COLORS ============
        
        const darkCyans = [];
        
        // Generate 200+ dark cyan shades
        // Dark cyan range: R low (0-80), G medium (60-140), B medium-high (80-160)
        
        for (let r = 0; r <= 60; r += 5) {
          for (let g = 50; g <= 120; g += 5) {
            for (let b = 70; b <= 150; b += 5) {
              // Para hindi masyadong marami, magdagdag lang kapag nasa dark cyan range
              if (b > g && g > r) {
                const color = (r << 16) | (g << 8) | b;
                darkCyans.push(color);
              }
            }
          }
        }
        
        // Add more variations with different combinations
        for (let i = 0; i < 100; i++) {
          const r = Math.floor(Math.random() * 50); // 0-49
          const g = Math.floor(50 + Math.random() * 70); // 50-119
          const b = Math.floor(80 + Math.random() * 70); // 80-149
          
          // Ensure cyan characteristics (blue >= green > red)
          if (b >= g && g > r) {
            const color = (r << 16) | (g << 8) | b;
            darkCyans.push(color);
          } else {
            // Adjust to make it cyan
            const adjustedR = Math.floor(Math.random() * 40);
            const adjustedG = Math.floor(60 + Math.random() * 50);
            const adjustedB = Math.floor(adjustedG + 10 + Math.random() * 30);
            const color = (adjustedR << 16) | (adjustedG << 8) | adjustedB;
            darkCyans.push(color);
          }
        }
        
        // Specific dark cyan ranges
        const cyanRanges = [
          // Deep teals
          { r: 0, g: 60, b: 80 }, { r: 5, g: 65, b: 85 }, { r: 10, g: 70, b: 90 }, { r: 15, g: 75, b: 95 },
          { r: 0, g: 70, b: 100 }, { r: 5, g: 75, b: 105 }, { r: 10, g: 80, b: 110 }, { r: 15, g: 85, b: 115 },
          
          // Dark blue-greens
          { r: 20, g: 80, b: 100 }, { r: 25, g: 85, b: 105 }, { r: 30, g: 90, b: 110 }, { r: 35, g: 95, b: 115 },
          { r: 20, g: 90, b: 120 }, { r: 25, g: 95, b: 125 }, { r: 30, g: 100, b: 130 }, { r: 35, g: 105, b: 135 },
          
          // Forest cyans
          { r: 40, g: 100, b: 110 }, { r: 45, g: 105, b: 115 }, { r: 50, g: 110, b: 120 }, { r: 55, g: 115, b: 125 },
          { r: 40, g: 110, b: 130 }, { r: 45, g: 115, b: 135 }, { r: 50, g: 120, b: 140 }, { r: 55, g: 125, b: 145 },
          
          // Steel cyans
          { r: 30, g: 70, b: 90 }, { r: 35, g: 75, b: 95 }, { r: 40, g: 80, b: 100 }, { r: 45, g: 85, b: 105 },
          { r: 30, g: 80, b: 110 }, { r: 35, g: 85, b: 115 }, { r: 40, g: 90, b: 120 }, { r: 45, g: 95, b: 125 },
          
          // Ocean depths
          { r: 0, g: 50, b: 90 }, { r: 5, g: 55, b: 95 }, { r: 10, g: 60, b: 100 }, { r: 15, g: 65, b: 105 },
          { r: 0, g: 60, b: 110 }, { r: 5, g: 65, b: 115 }, { r: 10, g: 70, b: 120 }, { r: 15, g: 75, b: 125 },
          
          // Mossy cyans
          { r: 40, g: 80, b: 90 }, { r: 45, g: 85, b: 95 }, { r: 50, g: 90, b: 100 }, { r: 55, g: 95, b: 105 },
          { r: 40, g: 90, b: 110 }, { r: 45, g: 95, b: 115 }, { r: 50, g: 100, b: 120 }, { r: 55, g: 105, b: 125 },
          
          // Deep turquoise
          { r: 20, g: 70, b: 100 }, { r: 25, g: 75, b: 105 }, { r: 30, g: 80, b: 110 }, { r: 35, g: 85, b: 115 },
          { r: 20, g: 80, b: 120 }, { r: 25, g: 85, b: 125 }, { r: 30, g: 90, b: 130 }, { r: 35, g: 95, b: 135 },
          
          // Shadow cyans
          { r: 10, g: 40, b: 70 }, { r: 15, g: 45, b: 75 }, { r: 20, g: 50, b: 80 }, { r: 25, g: 55, b: 85 },
          { r: 10, g: 50, b: 90 }, { r: 15, g: 55, b: 95 }, { r: 20, g: 60, b: 100 }, { r: 25, g: 65, b: 105 }
        ];
        
        // Add from predefined ranges
        cyanRanges.forEach(range => {
          const color = (range.r << 16) | (range.g << 8) | range.b;
          darkCyans.push(color);
          
          // Add slight variations
          for (let v = 0; v < 3; v++) {
            const varR = Math.min(60, Math.max(0, range.r + (Math.random() * 10 - 5)));
            const varG = Math.min(130, Math.max(40, range.g + (Math.random() * 10 - 5)));
            const varB = Math.min(150, Math.max(60, range.b + (Math.random() * 10 - 5)));
            const varColor = (Math.floor(varR) << 16) | (Math.floor(varG) << 8) | Math.floor(varB);
            darkCyans.push(varColor);
          }
        });
        
        // Remove duplicates and ensure we have at least 200
        const uniqueCyans = [...new Set(darkCyans)];
        
        // If we need more, generate more random ones
        while (uniqueCyans.length < 220) {
          const r = Math.floor(Math.random() * 45);
          const g = Math.floor(50 + Math.random() * 70);
          const b = Math.floor(g + 10 + Math.random() * 40);
          const color = (r << 16) | (g << 8) | b;
          if (!uniqueCyans.includes(color)) {
            uniqueCyans.push(color);
          }
        }
        
        console.log(`Generated ${uniqueCyans.length} dark cyan colors`);
        
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            const randomColor = uniqueCyans[Math.floor(Math.random() * uniqueCyans.length)];
            const roughness = 0.5 + Math.random() * 0.3;
            const metalness = 0.1 + Math.random() * 0.2; // Slightly metallic para sa cyan buildings
            
            child.material = new THREE.MeshStandardMaterial({
              color: randomColor,
              roughness: roughness,
              metalness: metalness,
              emissive: new THREE.Color(0x000000),
              emissiveIntensity: 0,
              flatShading: false
            });
            
            // Optional: Add slight emissive for windows effect
            if (Math.random() > 0.85) {
              child.material.emissive = new THREE.Color(0x112233);
              child.material.emissiveIntensity = 0.1;
            }
          }
        });

        scene.add(object);
        
        setDebug('Ready');
      },
      (progress) => {
        if (progress.total) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          setDebug(`Loading: ${percent}%`);
        }
      },
      (error: any) => {
        setLoading(false);
        setError('Failed to load model');
        setDebug('Error loading model');
        console.error('FBX loading error:', error);
      }
    );

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // I-rotate ang sun ring
      if (sunRing) {
        sunRing.rotation.y += 0.005;
        sunRing.rotation.x = Math.PI / 2 + Math.sin(Date.now() * 0.001) * 0.1;
      }
      
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const newWidth = containerRef.current.clientWidth;
      const newHeight = 400;
      
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [modelPath]);

  // Styles
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    aspectRatio: '4/1',
    backgroundColor: '#0B2B4A',
    overflow: 'hidden'
  };

  const canvasWrapperStyle: React.CSSProperties = {
    width: '100%',
    height: '400px',
    position: 'relative',
  };

  return (
    <div style={containerStyle}>
      <div style={canvasWrapperStyle} ref={containerRef} />
      {error && (
        <div style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          color: '#FF6B6B',
          fontSize: '0.9rem',
          zIndex: 10
        }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
            }
