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
      gradient.addColorStop(0, '#0B3B5C'); // Deep blue at top
      gradient.addColorStop(0.5, '#4A90E2'); // Bright blue mid
      gradient.addColorStop(1, '#F5E6D3'); // Warm horizon
      context.fillStyle = gradient;
      context.fillRect(0, 0, 2, 2);
      const gradientTexture = new THREE.CanvasTexture(canvas);
      scene.background = gradientTexture;
    }

    // Camera setup - ORIGINAL POSITION PRESERVED
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 400;
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(7, 21, 37); // ORIGINAL POSITION
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
    renderer.toneMappingExposure = 2.2; // Mas maliwanag
    container.appendChild(renderer.domElement);

    // Controls - ORIGINAL SETTINGS PRESERVED
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.maxPolarAngle = Math.PI / 2;
    controls.enableZoom = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.0; // ORIGINAL SPEED
    controls.target.set(0, 5, 0); // ORIGINAL TARGET

    // ============ MALIWANAG NA LIGHTING ============
    
    // Main sun light (mas maliwanag)
    const sunLight = new THREE.DirectionalLight(0xFFF5E6, 2.5);
    sunLight.position.set(40, 60, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);

    // Additional key light para sa front illumination
    const keyLight = new THREE.DirectionalLight(0xFFE6CC, 1.5);
    keyLight.position.set(20, 30, 50);
    scene.add(keyLight);

    // Ambient light (mas maliwanag)
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.2);
    scene.add(ambientLight);

    // Fill light from multiple directions
    const fillLight1 = new THREE.DirectionalLight(0xCCE5FF, 0.8);
    fillLight1.position.set(-30, 20, 30);
    scene.add(fillLight1);

    const fillLight2 = new THREE.DirectionalLight(0xFFE6CC, 0.6);
    fillLight2.position.set(10, 15, -30);
    scene.add(fillLight2);

    // Back light para sa rim lighting
    const backLight = new THREE.DirectionalLight(0xE6F0FF, 0.7);
    backLight.position.set(-20, 30, -40);
    scene.add(backLight);

    // Point light para sa general brightness
    const pointLight = new THREE.PointLight(0xFFFFFF, 0.8);
    pointLight.position.set(0, 20, 0);
    scene.add(pointLight);

    // ============ GROUND ============
    
    const groundRadius = 500;
    const groundSegments = 32;
    
    // Ground texture
    const groundCanvas = document.createElement('canvas');
    groundCanvas.width = 512;
    groundCanvas.height = 512;
    const groundCtx = groundCanvas.getContext('2d');
    
    if (groundCtx) {
      // Base color (mas maliwanag na earth tone)
      groundCtx.fillStyle = '#8A7A65';
      groundCtx.fillRect(0, 0, 512, 512);
      
      // Add texture
      const imageData = groundCtx.getImageData(0, 0, 512, 512);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        // Magdagdag ng variation para hindi flat
        const variation = (Math.random() - 0.5) * 30;
        data[i] = Math.min(255, Math.max(160, data[i] + variation));
        data[i+1] = Math.min(255, Math.max(140, data[i+1] + variation * 0.8));
        data[i+2] = Math.min(255, Math.max(120, data[i+2] + variation * 0.6));
      }
      
      groundCtx.putImageData(imageData, 0, 0);
      
      // Magaan na grid lines
      groundCtx.strokeStyle = '#AFA08B';
      groundCtx.lineWidth = 1;
      
      for (let i = 0; i < 512; i += 64) {
        groundCtx.beginPath();
        groundCtx.moveTo(i, 0);
        groundCtx.lineTo(i, 512);
        groundCtx.strokeStyle = 'rgba(175, 160, 139, 0.15)';
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
      color: 0xA0907A,
      roughness: 0.7,
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
        color: 0x7A6A55,
        emissive: new THREE.Color(0x2A251F),
        transparent: true,
        opacity: 0.4
      })
    );
    edgeRing.rotation.x = Math.PI / 2;
    edgeRing.position.y = 0.05;
    scene.add(edgeRing);

    // Fog
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.0015);

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
        
        // ============ MAGKAKAIBA-IBANG KULAY NG BUILDINGS ============
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Random na pumili ng building color mula sa common building palette
            const buildingColors = [
              0xE8E8E8, // Light gray / puti
              0xD4D4D4, // Silver gray
              0xC0C0C0, // Gray
              0xCD853F, // Bronze / tansy
              0x8B7355, // Brown / kayumanggi
              0x9A7D5A, // Light brown
              0x7A6A55, // Dark beige
              0x5A4A3A, // Dark brown
              0x4A6A8A, // Blue-gray
              0x6A8A9A, // Gray-blue
              0x8A9AA0, // Blue-gray light
              0x9CB0B0, // Green-gray
              0xA09A80, // Tan
              0xB0A090, // Beige
              0xC0B0A0, // Light beige
              0x708090, // Slate gray
              0x606060, // Dark gray
              0x505050, // Charcoal
              0x804020, // Dark brown (wood)
              0xA06040, // Rustic brown
            ];
            
            // Random na pumili ng kulay
            const randomColor = buildingColors[Math.floor(Math.random() * buildingColors.length)];
            
            // Random roughness at metalness para hindi pare-pareho ang itsura
            const roughness = 0.3 + Math.random() * 0.4;
            const metalness = Math.random() * 0.3;
            
            child.material = new THREE.MeshStandardMaterial({
              color: randomColor,
              roughness: roughness,
              metalness: metalness,
              emissive: new THREE.Color(0x000000),
              emissiveIntensity: 0
            });
          }
        });

        scene.add(object);
        
        // Update controls target to center of model but keep original camera position
        const newBox = new THREE.Box3().setFromObject(object);
        const newCenter = newBox.getCenter(new THREE.Vector3());
        controls.target.set(newCenter.x, 5, newCenter.z); // Keep y at 5 like original
        controls.update();
        
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
    backgroundColor: '#0B3B5C',
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
