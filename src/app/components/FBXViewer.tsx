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
      gradient.addColorStop(0, '#1E3B5C'); // Deep blue at top
      gradient.addColorStop(0.6, '#7BA9C9'); // Mid blue
      gradient.addColorStop(1, '#F5E6D3'); // Warm horizon
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

    // Renderer with optimized settings
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "default" // Less aggressive power usage
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Lower pixel ratio for performance
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2;
    controls.enableZoom = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;
    controls.target.set(0, 5, 0);

    // ============ OPTIMIZED REALISTIC LIGHTING ============
    
    // Single sun light (main source)
    const sunLight = new THREE.DirectionalLight(0xFFF5E6, 1.8);
    sunLight.position.set(30, 50, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024; // Reduced for performance
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);

    // Simple ambient + hemisphere combined
    const ambientLight = new THREE.AmbientLight(0x404060, 0.8);
    scene.add(ambientLight);

    // One fill light
    const fillLight = new THREE.DirectionalLight(0xC0D0E0, 0.5);
    fillLight.position.set(-20, 20, -20);
    scene.add(fillLight);

    // ============ REALISTIC GROUND (LIGHTWEIGHT) ============
    
    // Simple circular ground with texture
    const groundRadius = 500;
    const groundSegments = 32; // Reduced segments for performance
    
    // Create a simple ground texture procedurally (no external images)
    const groundCanvas = document.createElement('canvas');
    groundCanvas.width = 512;
    groundCanvas.height = 512;
    const groundCtx = groundCanvas.getContext('2d');
    
    if (groundCtx) {
      // Base earth color
      groundCtx.fillStyle = '#5C4E3D';
      groundCtx.fillRect(0, 0, 512, 512);
      
      // Add simple noise for texture (fast)
      const imageData = groundCtx.getImageData(0, 0, 512, 512);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 8) { // Skip every other pixel for speed
        const noise = (Math.random() - 0.5) * 40;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise * 0.8));
        data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise * 0.6));
      }
      
      groundCtx.putImageData(imageData, 0, 0);
      
      // Add simple grid pattern
      groundCtx.strokeStyle = '#7A6A55';
      groundCtx.lineWidth = 1;
      
      // Fewer lines for performance
      for (let i = 0; i < 512; i += 64) {
        groundCtx.beginPath();
        groundCtx.moveTo(i, 0);
        groundCtx.lineTo(i, 512);
        groundCtx.strokeStyle = 'rgba(122, 106, 85, 0.2)';
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
    groundTexture.repeat.set(4, 4);
    
    // Ground material
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      map: groundTexture,
      color: 0x8A7A65,
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

    // Simple edge ring (lightweight)
    const edgeRing = new THREE.Mesh(
      new THREE.TorusGeometry(groundRadius, 1, 8, 48), // Lower segment count
      new THREE.MeshStandardMaterial({
        color: 0x6B5A44,
        emissive: new THREE.Color(0x1A1510),
        transparent: true,
        opacity: 0.3
      })
    );
    edgeRing.rotation.x = Math.PI / 2;
    edgeRing.position.y = 0.05;
    scene.add(edgeRing);

    // Add a few simple markers (instead of many lines)
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const markerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 6);
      const markerMaterial = new THREE.MeshStandardMaterial({ color: 0x9A8A75 });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(
        Math.sin(angle) * 200,
        0.05,
        Math.cos(angle) * 200
      );
      marker.rotation.x = 0;
      marker.receiveShadow = true;
      scene.add(marker);
    }

    // Add subtle fog for depth
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.002);

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
        
        // Simplify materials for performance
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material = new THREE.MeshStandardMaterial({
              color: 0xCCCCCC,
              roughness: 0.4,
              metalness: 0.1
            });
          }
        });

        scene.add(object);
        
        const newCenter = new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3());
        camera.lookAt(newCenter);
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

    // Simple animation loop
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

  // Simple styles
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    aspectRatio: '4/1',
    backgroundColor: '#1E3B5C',
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
