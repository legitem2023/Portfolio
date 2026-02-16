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

    // Scene setup with photorealistic sky
    const scene = new THREE.Scene();
    
    // Realistic sky gradient (parang totoong sunset/sunrise)
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512; // Mas mataas para sa mas smooth na gradient
    const context = canvas.getContext('2d');

    if (context) {
      const gradient = context.createLinearGradient(0, 0, 0, 512);
      gradient.addColorStop(0, '#0A1A2A'); // Deep night blue sa itaas
      gradient.addColorStop(0.3, '#2A4A6A'); // Medium blue
      gradient.addColorStop(0.6, '#6A8A9A'); // Gray-blue sa gitna
      gradient.addColorStop(0.8, '#B0A090'); // Warm horizon
      gradient.addColorStop(1, '#C0B0A0'); // Light horizon
      context.fillStyle = gradient;
      context.fillRect(0, 0, 2, 512);
      const gradientTexture = new THREE.CanvasTexture(canvas);
      scene.background = gradientTexture;
    }

    // Camera setup
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 400;
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(7, 24, 37);
    camera.lookAt(0, 0, 0);

    // Renderer with realistic settings
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance",
      alpha: false
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows
    //renderer.shadowMap.bias = 0.0001;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // Film-like tone mapping
    renderer.toneMappingExposure = 1.5; // Balanced exposure
    renderer.outputEncoding = THREE.sRGBEncoding; // Correct color space
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
   // controls.maxPolarAngle = Math.PI / 2.5; // Limit angle para realistic
    controls.minDistance = 20;
    controls.maxDistance = 60;
    controls.enableZoom = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8; // Mas mabagal, parang totoo
    controls.target.set(0, 8, 0);

    // ============ REALISTIC LIGHTING ============
    
    // Main sunlight (warm, parang araw sa hapon)
    const sunLight = new THREE.DirectionalLight(0xFFE6CC, 1.5);
    sunLight.position.set(30, 40, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -40;
    sunLight.shadow.camera.right = 40;
    sunLight.shadow.camera.top = 40;
    sunLight.shadow.camera.bottom = -40;
    scene.add(sunLight);

    // ============ SUN HELPER (mas realistic) ============
    const sunGlowGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    const sunGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFAA66,
      transparent: true,
      opacity: 0.3
    });
    const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
    sunGlow.position.copy(sunLight.position);
    scene.add(sunGlow);

    // Environment light (sky light)
    const hemiLight = new THREE.HemisphereLight(0x88AACC, 0x332211, 0.8);
    scene.add(hemiLight);

    // Fill light (reflected light from surroundings)
    const fillLight = new THREE.DirectionalLight(0xAACCFF, 0.4);
    fillLight.position.set(-20, 20, 30);
    scene.add(fillLight);

    // Back light (rim lighting)
    const backLight = new THREE.DirectionalLight(0xCCDDFF, 0.3);
    backLight.position.set(-20, 30, -40);
    scene.add(backLight);

    // Ambient light (base illumination)
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambientLight);

    // ============ REALISTIC GROUND ============
    
    const groundRadius = 600; // Mas malaki para hindi kita ang edge
    const groundSegments = 64;
    
    // Create realistic ground texture (asphalt/concrete with wear)
    const groundCanvas = document.createElement('canvas');
    groundCanvas.width = 1024;
    groundCanvas.height = 1024;
    const groundCtx = groundCanvas.getContext('2d');
    
    if (groundCtx) {
      // Base color - weathered asphalt
      groundCtx.fillStyle = '#3A4035';
      groundCtx.fillRect(0, 0, 1024, 1024);
      
      // Add realistic texture (asphalt grain)
      const imageData = groundCtx.getImageData(0, 0, 1024, 1024);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        // Asphalt texture - irregular grain
        const noise = (Math.random() - 0.5) * 30;
        const wear = Math.random() > 0.99 ? 40 : 0; // Random light spots (wear)
        
        data[i] = Math.min(140, Math.max(40, data[i] + noise + wear));
        data[i+1] = Math.min(130, Math.max(35, data[i+1] + noise * 0.9 + wear * 0.8));
        data[i+2] = Math.min(120, Math.max(30, data[i+2] + noise * 0.8 + wear * 0.6));
      }
      
      groundCtx.putImageData(imageData, 0, 0);
      
      // Add subtle road lines/markings (weathered)
      groundCtx.strokeStyle = '#6A6050';
      groundCtx.lineWidth = 4;
      
      // Random cracks and wear lines
      for (let i = 0; i < 50; i++) {
        groundCtx.beginPath();
        groundCtx.moveTo(Math.random() * 1024, Math.random() * 1024);
        groundCtx.lineTo(Math.random() * 1024, Math.random() * 1024);
        groundCtx.strokeStyle = `rgba(80, 70, 60, ${Math.random() * 0.3})`;
        groundCtx.stroke();
      }
      
      // Faint grid (urban planning)
      groundCtx.strokeStyle = '#5A5A50';
      groundCtx.lineWidth = 1;
      
      for (let i = 0; i < 1024; i += 128) {
        groundCtx.beginPath();
        groundCtx.moveTo(i, 0);
        groundCtx.lineTo(i, 1024);
        groundCtx.strokeStyle = 'rgba(90, 90, 80, 0.1)';
        groundCtx.stroke();
        
        groundCtx.beginPath();
        groundCtx.moveTo(0, i);
        groundCtx.lineTo(1024, i);
        groundCtx.stroke();
      }
    }
    
    const groundTexture = new THREE.CanvasTexture(groundCanvas);
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(8, 8);
    
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      map: groundTexture,
      color: 0x5A6050,
      roughness: 0.9, // Napaka-rough (asphalt)
      metalness: 0.0,
      emissive: new THREE.Color(0x000000),
      bumpMap: groundTexture, // Same texture as bump for depth
      bumpScale: 0.5
    });
    
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(groundRadius, groundSegments),
      groundMaterial
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // Atmospheric fog (realistic depth)
    scene.fog = new THREE.FogExp2(0xA0B0B5, 0.0005);

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
        
        const scale = 500 / Math.max(size.x, size.y, size.z);
        
        object.scale.set(scale, scale, scale);
        object.rotation.x = -(90 * Math.PI / 180);
        
        object.position.set(
          -center.x * scale,
          0,
          -center.z * scale
        );
        
        // ============ REALISTIC BUILDING MATERIALS ============
        
        // Realistic color palette based on real building materials
        const realisticColors = [
          // Concrete variations
          0x7A7A70, 0x6A6A60, 0x5A5A50, 0x8A8A80, 0x9A9A90,
          // Brick variations
          0x8A5A4A, 0x7A4A3A, 0x9A6A5A, 0x6A4A3A, 0x5A3A2A,
          // Stone variations
          0x8A7A6A, 0x9A8A7A, 0x7A6A5A, 0x6A5A4A, 0x5A4A3A,
          // Weathered metal
          0x6A6A70, 0x5A5A60, 0x7A7A80, 0x4A4A50,
          // Dark glass
          0x1A2A3A, 0x2A3A4A, 0x3A4A5A,
          // Terracotta
          0x9A6A4A, 0x8A5A3A, 0x7A4A2A,
          // Limestone
          0x9A928A, 0x8A827A, 0x7A726A,
          // Granite
          0x6A6A6A, 0x7A7A7A, 0x5A5A5A,
          // Sandstone
          0x9A8A6A, 0x8A7A5A, 0x7A6A4A,
          // Slate
          0x4A505A, 0x5A606A, 0x6A707A
        ];
        
        console.log(`Using ${realisticColors.length} realistic building colors`);
        
        let meshCount = 0;
        
        object.traverse((child:any) => {
          if (child.isMesh) {
            meshCount++;
            
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Pumili ng realistic na kulay
            const baseColor = realisticColors[Math.floor(Math.random() * realisticColors.length)];
            
            // Add subtle variation (±5% sa brightness)
            const color = new THREE.Color(baseColor);
            const variation = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
            color.multiplyScalar(variation);
            
            // Realistic material properties
            const roughness = 0.6 + Math.random() * 0.3; // Mostly rough
            const metalness = Math.random() * 0.2; // Konting metalness lang
            const bumpScale = 0.1 + Math.random() * 0.3; // Texture depth
            
            // Create realistic material
            const material = new THREE.MeshStandardMaterial({
              color: color,
              roughness: roughness,
              metalness: metalness,
              emissive: new THREE.Color(0x000000),
              emissiveIntensity: 0,
              flatShading: false
            });
            
            // Add subtle emissive for windows (random)
            if (Math.random() > 0.7) {
              material.emissive = new THREE.Color(0x332211);
              material.emissiveIntensity = 0.05;
            }
            
            child.material = material;
            
            // Optional: Add subtle color variation sa mga building na maraming parts
            if (child.children && child.children.length > 0) {
              child.children.forEach((part: any) => {
                if (part.isMesh) {
                  const partColor = new THREE.Color(baseColor);
                  partColor.multiplyScalar(0.9 + Math.random() * 0.2);
                  part.material = new THREE.MeshStandardMaterial({
                    color: partColor,
                    roughness: roughness,
                    metalness: metalness
                  });
                }
              });
            }
          }
        });
        
        console.log(`Applied realistic materials to ${meshCount} meshes`);
        setDebug(`Loaded ${meshCount} building elements`);

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
      
      // Very subtle sun movement (optional)
      if (sunLight) {
        // Hindi na natin ginagalaw para consistent ang shadows
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
    backgroundColor: '#0A1A2A',
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
