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

    // Scene setup with bright daytime sky
    const scene = new THREE.Scene();
    
    // Create a gradient texture for the sky (daytime colors)
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 2;
    const context = canvas.getContext('2d');

    if (context) {
      const gradient = context.createLinearGradient(0, 0, 0, 2);
      gradient.addColorStop(0, '#87CEEB'); // Sky blue at top
      gradient.addColorStop(1, '#E0F6FF'); // Lighter blue at horizon
      context.fillStyle = gradient;
      context.fillRect(0, 0, 1, 2);
      const gradientTexture = new THREE.CanvasTexture(canvas);
      scene.background = gradientTexture;
    } else {
      scene.background = new THREE.Color(0x87CEEB);
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
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 2.0; // Brighter exposure for daytime
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

    // ============ DAYTIME LIGHTING ============
    
    // Main sun light (directional)
    const sunLight = new THREE.DirectionalLight(0xFFF5E6, 2.5);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    scene.add(sunLight);

    // Fill light from opposite side
    const fillLight = new THREE.DirectionalLight(0xE6F0FF, 1.2);
    fillLight.position.set(-40, 60, -30);
    scene.add(fillLight);

    // Hemisphere light for ambient sky/ground bounce
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x8B7355, 1.2);
    scene.add(hemiLight);

    // Soft ambient light
    const ambientLight = new THREE.AmbientLight(0x404060, 1.0);
    scene.add(ambientLight);

    // Add a subtle point light near the scene to brighten shadows
    const pointLight = new THREE.PointLight(0xFFFFFF, 0.5);
    pointLight.position.set(0, 20, 20);
    scene.add(pointLight);

    // ============ CIRCULAR GROUND ============
    
    // Create a circular ground using CircleGeometry
    const groundRadius = 500;
    const groundSegments = 64;
    
    // Create a canvas for the ground texture (more natural ground colors)
    const groundCanvas = document.createElement('canvas');
    groundCanvas.width = 1024;
    groundCanvas.height = 1024;
    const groundCtx = groundCanvas.getContext('2d');
    
    if (groundCtx) {
      // Base ground color (warm earth tones)
      groundCtx.fillStyle = '#8B7355';
      groundCtx.fillRect(0, 0, 1024, 1024);
      
      // Add variation with noise
      const imageData = groundCtx.getImageData(0, 0, 1024, 1024);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        // Add random variation for texture
        data[i] += Math.random() * 30;     // R
        data[i+1] += Math.random() * 20;   // G
        data[i+2] += Math.random() * 15;   // B
      }
      
      groundCtx.putImageData(imageData, 0, 0);
      
      // Draw some subtle lines for texture
      groundCtx.strokeStyle = '#A58B6F';
      groundCtx.lineWidth = 2;
      
      // Random lines pattern
      for (let i = 0; i < 50; i++) {
        groundCtx.beginPath();
        groundCtx.moveTo(Math.random() * 1024, Math.random() * 1024);
        groundCtx.lineTo(Math.random() * 1024, Math.random() * 1024);
        groundCtx.strokeStyle = `rgba(165, 139, 111, ${Math.random() * 0.3})`;
        groundCtx.stroke();
      }
    }
    
    const groundTexture = new THREE.CanvasTexture(groundCanvas);
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(8, 8);
    
    // Create the circular ground
    const groundGeometry = new THREE.CircleGeometry(groundRadius, groundSegments);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      map: groundTexture,
      color: 0x8B7355,
      roughness: 0.9,
      metalness: 0.05,
      emissive: new THREE.Color(0x000000)
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // Add a subtle edge ring for the ground
    const edgeGeometry = new THREE.TorusGeometry(groundRadius, 1.5, 16, 100);
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x6B5A44,
      emissive: new THREE.Color(0x2A231C),
      transparent: true,
      opacity: 0.5
    });
    const edgeRing = new THREE.Mesh(edgeGeometry, edgeMaterial);
    edgeRing.rotation.x = Math.PI / 2;
    edgeRing.position.y = 0.1;
    scene.add(edgeRing);

    // Add some subtle decorative elements on the ground (like paths or markings)
    const pathGeometry = new THREE.TorusGeometry(200, 2, 16, 100);
    const pathMaterial = new THREE.MeshStandardMaterial({
      color: 0x6B5A44,
      roughness: 0.8,
      emissive: new THREE.Color(0x000000)
    });
    const pathRing = new THREE.Mesh(pathGeometry, pathMaterial);
    pathRing.rotation.x = Math.PI / 2;
    pathRing.position.y = 0.05;
    scene.add(pathRing);

    // Add a second smaller ring
    const innerPathGeometry = new THREE.TorusGeometry(100, 1.5, 16, 100);
    const innerPathMaterial = new THREE.MeshStandardMaterial({
      color: 0x5A4A3A,
      roughness: 0.8
    });
    const innerPathRing = new THREE.Mesh(innerPathGeometry, innerPathMaterial);
    innerPathRing.rotation.x = Math.PI / 2;
    innerPathRing.position.y = 0.05;
    scene.add(innerPathRing);

    // Add radial lines from center
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const lineLength = groundRadius - 20;
      const points = [];
      points.push(new THREE.Vector3(0, 0.05, 0));
      points.push(new THREE.Vector3(
        Math.sin(angle) * lineLength,
        0.05,
        Math.cos(angle) * lineLength
      ));
      
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x5A4A3A, opacity: 0.3, transparent: true });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
    }

    setDebug('Loading FBX model...');

    // Load FBX model
    const loader = new FBXLoader();
    
    loader.load(
      modelPath,
      (object) => {
        setDebug('FBX model loaded successfully');
        setLoading(false);
        
        // Calculate bounding box for proper scaling
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        // Scale the model appropriately
        const targetSize = 30;
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = targetSize / maxDim;
        
        object.scale.set(scale * 20, scale * 20, scale * 20);
        object.rotation.x = -(90 * Math.PI / 180);
        
        // Position the model on the ground
        object.position.set(
          -center.x * scale,
          0,
          -center.z * scale
        );
        
        // Enhance building materials for daytime
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Brighter, more vibrant materials for daytime
            child.material = new THREE.MeshStandardMaterial({
              color: 0xCCCCCC,
              roughness: 0.3,
              metalness: 0.1,
              emissive: new THREE.Color(0x000000)
            });
          }
        });

        scene.add(object);
        
        const newBox = new THREE.Box3().setFromObject(object);
        const newCenter = newBox.getCenter(new THREE.Vector3());
        
        camera.lookAt(newCenter);
        controls.update();
        
        setDebug('Model positioned and ready');
      },
      (progress) => {
        const percent = (progress.loaded / progress.total) * 100;
        setDebug(`Loading: ${Math.round(percent)}%`);
      },
      (error: any) => {
        setLoading(false);
        const errorMsg = error?.message || 'Unknown error';
        setError(`Failed to load model: ${errorMsg}`);
        setDebug(`Error: ${errorMsg}`);
        console.error('FBX loading error details:', error);
      }
    );

    // Animation loop
    const clock = new THREE.Clock();
    
    const animate = () => {
      requestAnimationFrame(animate);
      
      const delta = clock.getDelta();
      const elapsedTime = performance.now() / 1000;
      
      // Subtle ground texture animation (very slow)
      if (groundTexture) {
        groundTexture.offset.x += 0.0001;
        groundTexture.offset.y += 0.00005;
      }
      
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const newWidth = containerRef.current.clientWidth;
      const newHeight = 400;
      
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);
    setDebug('Ready');

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
    aspectRatio: 4/1,
    backgroundColor: '#87CEEB',
    overflow: 'hidden'
  };

  const canvasWrapperStyle: React.CSSProperties = {
    width: '100%',
    height: '400px',
    position: 'relative',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(135, 206, 235, 0.3)',
    color: 'black',
    fontSize: '1.2rem',
    zIndex: 10,
    pointerEvents: 'none',
  };

  return (
    <div style={containerStyle}>
      <div style={canvasWrapperStyle} ref={containerRef} />
      {error && (
        <div style={{ ...overlayStyle, backgroundColor: 'rgba(255, 0, 0, 0.2)' }}>
          <div style={{ color: '#8B0000', textAlign: 'center' }}>
            <div>⚠️ Error loading model</div>
            <div style={{ fontSize: '0.9rem', marginTop: '8px' }}>{error}</div>
          </div>
        </div>
      )}
    </div>
  );
            }
