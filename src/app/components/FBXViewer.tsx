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

    // Scene setup with cyan-themed sky
    const scene = new THREE.Scene();
    
    // Cyan gradient sky para tugma sa buildings
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const context = canvas.getContext('2d');

    if (context) {
      const gradient = context.createLinearGradient(0, 0, 0, 2);
      gradient.addColorStop(0, '#0A2A2A'); // Dark cyan at top
      gradient.addColorStop(0.5, '#1A4A4A'); // Medium cyan mid
      gradient.addColorStop(1, '#6A8A7A'); // Light cyan-green horizon
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

    // ============ LIGHTING ============
    
    // Main sun light (with cyan tint para tugma)
    const sunLight = new THREE.DirectionalLight(0xCCFFEE, 2.5);
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
      color: 0x88FFAA,
      emissive: 0x44CC88,
      emissiveIntensity: 3.0,
      roughness: 0.1,
      metalness: 0.1
    });
    
    const sunSphere = new THREE.Mesh(sunSphereGeometry, sunSphereMaterial);
    sunSphere.position.copy(sunLight.position);
    scene.add(sunSphere);
    
    const sunGlowLight = new THREE.PointLight(0x88FFAA, 2.5, 40);
    sunGlowLight.position.copy(sunLight.position);
    scene.add(sunGlowLight);
    
    const sunRingGeometry = new THREE.TorusGeometry(2.8, 0.15, 16, 32);
    const sunRingMaterial = new THREE.MeshStandardMaterial({
      color: 0xAAFFCC,
      emissive: 0x66FF99,
      emissiveIntensity: 2.0,
      transparent: true,
      opacity: 0.8
    });
    const sunRing = new THREE.Mesh(sunRingGeometry, sunRingMaterial);
    sunRing.position.copy(sunLight.position);
    sunRing.rotation.x = Math.PI / 2;
    scene.add(sunRing);

    // Ambient light with cyan tint
    const ambientLight = new THREE.AmbientLight(0xA0D0D0, 0.9);
    scene.add(ambientLight);

    // Fill light with cyan tint
    const fillLight = new THREE.DirectionalLight(0xC0F0F0, 0.8);
    fillLight.position.set(-30, 30, 40);
    scene.add(fillLight);

    // Back light
    const backLight = new THREE.DirectionalLight(0xE0FFFF, 0.6);
    backLight.position.set(-20, 40, -40);
    scene.add(backLight);

    // Front fill light
    const frontLight = new THREE.DirectionalLight(0xD0FFE0, 0.7);
    frontLight.position.set(20, 30, 50);
    scene.add(frontLight);
    
    // Top light
    const topLight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
    topLight.position.set(0, 80, 0);
    scene.add(topLight);
    
    // Center point light
    const centerLight = new THREE.PointLight(0xC0FFFF, 0.6, 100);
    centerLight.position.set(0, 20, 0);
    scene.add(centerLight);

    // ============ GROUND (CYAN THEMED) ============
    
    const groundRadius = 500;
    const groundSegments = 32;
    
    // Ground texture - cyan themed
    const groundCanvas = document.createElement('canvas');
    groundCanvas.width = 512;
    groundCanvas.height = 512;
    const groundCtx = groundCanvas.getContext('2d');
    
    if (groundCtx) {
      // Base color - dark cyan
      groundCtx.fillStyle = '#1A3A3A';
      groundCtx.fillRect(0, 0, 512, 512);
      
      // Add texture variation
      const imageData = groundCtx.getImageData(0, 0, 512, 512);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const variation = (Math.random() - 0.5) * 30;
        // Keep colors in cyan range
        data[i] = Math.min(100, Math.max(20, data[i] + variation * 0.3)); // R low
        data[i+1] = Math.min(160, Math.max(50, data[i+1] + variation * 0.7)); // G medium
        data[i+2] = Math.min(180, Math.max(70, data[i+2] + variation)); // B higher
      }
      
      groundCtx.putImageData(imageData, 0, 0);
      
      // Cyan grid lines
      groundCtx.strokeStyle = '#2A5A5A';
      groundCtx.lineWidth = 1;
      
      for (let i = 0; i < 512; i += 64) {
        groundCtx.beginPath();
        groundCtx.moveTo(i, 0);
        groundCtx.lineTo(i, 512);
        groundCtx.strokeStyle = 'rgba(42, 90, 90, 0.2)';
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
      color: 0x2A5A5A,
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

    // Edge ring - cyan
    const edgeRing = new THREE.Mesh(
      new THREE.TorusGeometry(groundRadius, 1.5, 8, 48),
      new THREE.MeshStandardMaterial({
        color: 0x1A4A4A,
        emissive: new THREE.Color(0x0A2A2A),
        transparent: true,
        opacity: 0.3
      })
    );
    edgeRing.rotation.x = Math.PI / 2;
    edgeRing.position.y = 0.05;
    scene.add(edgeRing);

    // Fog - cyan tinted
    scene.fog = new THREE.FogExp2(0x7A9A9A, 0.0008);

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
        
        const darkCyans: number[] = [];
        
        // Generate systematic dark cyan shades
        for (let r = 0; r <= 50; r += 5) {
          for (let g = 40; g <= 120; g += 5) {
            for (let b = 60; b <= 150; b += 5) {
              // Ensure cyan characteristics (blue >= green > red)
              if (b >= g && g > r) {
                const color = (r << 16) | (g << 8) | b;
                darkCyans.push(color);
              }
            }
          }
        }
        
        // Add more random variations
        for (let i = 0; i < 150; i++) {
          const r = Math.floor(Math.random() * 45);
          const g = Math.floor(45 + Math.random() * 70);
          const b = Math.floor(g + 10 + Math.random() * 40);
          const color = (r << 16) | (g << 8) | b;
          darkCyans.push(color);
        }
        
        // Specific cyan shades para sure na marami
        const specificShades = [
          // Deep teals
          0x103030, 0x103838, 0x104040, 0x184040, 0x184848, 0x185050, 0x205050, 0x205858,
          0x206060, 0x286060, 0x286868, 0x287070, 0x307070, 0x307878, 0x308080, 0x388080,
          
          // Blue-greens
          0x084848, 0x085050, 0x085858, 0x105858, 0x106060, 0x106868, 0x186868, 0x187070,
          0x187878, 0x207878, 0x208080, 0x208888, 0x288888, 0x289090, 0x289898, 0x309898,
          
          // Forest cyans
          0x204030, 0x204838, 0x205040, 0x285040, 0x285848, 0x286050, 0x306050, 0x306858,
          0x307060, 0x387060, 0x387868, 0x388070, 0x408070, 0x408878, 0x409080, 0x489080,
          
          // Steel cyans
          0x304040, 0x304848, 0x305050, 0x385050, 0x385858, 0x386060, 0x406060, 0x406868,
          0x407070, 0x487070, 0x487878, 0x488080, 0x508080, 0x508888, 0x509090, 0x589090,
          
          // Ocean cyans
          0x083838, 0x084040, 0x084848, 0x104848, 0x105050, 0x105858, 0x185858, 0x186060,
          0x186868, 0x206868, 0x207070, 0x207878, 0x287878, 0x288080, 0x288888, 0x308888
        ];
        
        specificShades.forEach(color => darkCyans.push(color));
        
        // Remove duplicates - FIXED: Hindi na gumagamit ng Set spread
        const uniqueCyans: number[] = [];
        darkCyans.forEach(color => {
          if (!uniqueCyans.includes(color)) {
            uniqueCyans.push(color);
          }
        });
        
        // Shuffle para hindi magkakasunod ang similar colors
        for (let i = uniqueCyans.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [uniqueCyans[i], uniqueCyans[j]] = [uniqueCyans[j], uniqueCyans[i]];
        }
        
        console.log(`Generated ${uniqueCyans.length} dark cyan colors`);
        
        // ===== SIGURADUHING LAHAT NG MESH AY MAPALITAN =====
        let meshCount = 0;
        
        object.traverse((child) => {
          if (child.isMesh) {
            meshCount++;
            
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Pumili ng random cyan color
            const randomColor = uniqueCyans[Math.floor(Math.random() * uniqueCyans.length)];
            
            // Random material properties
            const roughness = 0.4 + Math.random() * 0.4;
            const metalness = 0.1 + Math.random() * 0.3;
            
            // I-set ang bagong material
            if (Array.isArray(child.material)) {
              // Kung maraming materials, palitan lahat
              child.material = child.material.map(() => 
                new THREE.MeshStandardMaterial({
                  color: randomColor,
                  roughness: roughness,
                  metalness: metalness,
                  emissive: new THREE.Color(0x000000),
                  emissiveIntensity: 0
                })
              );
            } else {
              // Kung iisang material lang
              child.material = new THREE.MeshStandardMaterial({
                color: randomColor,
                roughness: roughness,
                metalness: metalness,
                emissive: new THREE.Color(0x000000),
                emissiveIntensity: 0
              });
            }
          }
        });
        
        console.log(`Colored ${meshCount} meshes with cyan shades`);
        setDebug(`Colored ${meshCount} buildings`);

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
    backgroundColor: '#0A2A2A',
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
