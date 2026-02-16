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

    // Scene setup with dark indigo sky
    const scene = new THREE.Scene();
    
    // Create a gradient texture for the background
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 2;
    const context = canvas.getContext('2d');

    if (context) {
      const gradient = context.createLinearGradient(0, 0, 0, 2);
      gradient.addColorStop(0, '#1a1a4a');
      gradient.addColorStop(1, '#4a4a8a');
      context.fillStyle = gradient;
      context.fillRect(0, 0, 1, 2);
      const gradientTexture = new THREE.CanvasTexture(canvas);
      scene.background = gradientTexture;
    } else {
      scene.background = new THREE.Color(0x2a2a6a);
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
    renderer.toneMappingExposure = 1.5;
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
    
    const hemiLight = new THREE.HemisphereLight(0x4a4a8a, 0x8a8a8a, 1.0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffcc88, 1.5);
    dirLight.position.set(50, 80, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x8a8acc, 0.6);
    fillLight.position.set(-30, 40, -30);
    scene.add(fillLight);

    const ambientLight = new THREE.AmbientLight(0x6a6a9a, 1.0);
    scene.add(ambientLight);

    // ============ ROUND/CIRCULAR ANIMATED GROUND ============
    
    // Create a circular ground using CircleGeometry instead of PlaneGeometry
    const groundRadius = 500; // Large radius for the ground
    const groundSegments = 64; // High segment count for smooth edge
    
    // Create a canvas for the ground texture
    const groundCanvas = document.createElement('canvas');
    groundCanvas.width = 512;
    groundCanvas.height = 512;
    const groundCtx = groundCanvas.getContext('2d');
    
    if (groundCtx) {
      // Draw a circular/radial pattern for the ground
      groundCtx.fillStyle = '#2a2a2a';
      groundCtx.fillRect(0, 0, 512, 512);
      
      // Draw concentric circles for radial pattern
      groundCtx.strokeStyle = '#4a4a4a';
      groundCtx.lineWidth = 2;
      
      const centerX = 256;
      const centerY = 256;
      const maxRadius = 256;
      
      // Draw concentric circles
      for (let r = 40; r <= maxRadius; r += 40) {
        groundCtx.beginPath();
        groundCtx.arc(centerX, centerY, r, 0, Math.PI * 2);
        groundCtx.strokeStyle = `rgba(74, 74, 74, ${0.7 - r/maxRadius * 0.3})`;
        groundCtx.stroke();
      }
      
      // Draw radial lines
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        groundCtx.beginPath();
        groundCtx.moveTo(centerX, centerY);
        groundCtx.lineTo(
          centerX + Math.cos(angle) * maxRadius,
          centerY + Math.sin(angle) * maxRadius
        );
        groundCtx.strokeStyle = 'rgba(74, 74, 74, 0.3)';
        groundCtx.stroke();
      }
      
      // Add some noise for texture
      const imageData = groundCtx.getImageData(0, 0, 512, 512);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        // Add slight random variation, but fade towards edges for circular effect
        const x = (i / 4) % 512;
        const y = Math.floor((i / 4) / 512);
        const distFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        
        if (distFromCenter < maxRadius) {
          // Inside circle - normal texture
          data[i] += Math.random() * 20;     // R
          data[i+1] += Math.random() * 20;   // G
          data[i+2] += Math.random() * 20;   // B
        } else {
          // Outside circle - make transparent (alpha 0)
          data[i+3] = 0;
        }
      }
      groundCtx.putImageData(imageData, 0, 0);
    }
    
    const groundTexture = new THREE.CanvasTexture(groundCanvas);
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(4, 4); // Adjust tiling for circular pattern
    
    // Use CircleGeometry for round ground
    const groundGeometry = new THREE.CircleGeometry(groundRadius, groundSegments);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      map: groundTexture,
      color: 0x888888,
      roughness: 0.8,
      metalness: 0.1,
      emissive: new THREE.Color(0x111111),
      side: THREE.DoubleSide // Show both sides
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // ============ ANIMATED WATER PLANE ============
    

     
    // Create circular water plane (smaller than ground)
    const waterRadius = 400;
    const waterGeometry = new THREE.CircleGeometry(waterRadius, 64);
    const waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a8a,
      emissive: new THREE.Color(0x1a1a3a),
      transparent: true,
      opacity: 0.3
    });
    
    const waterPlane = new THREE.Mesh(waterGeometry, waterMaterial);
    waterPlane.rotation.x = -Math.PI / 2;
    waterPlane.position.y = 0.1; // Slightly above ground
    waterPlane.receiveShadow = true;
    scene.add(waterPlane);

    // Add a subtle rim light/edge highlight for the ground
    const edgeGeometry = new THREE.TorusGeometry(groundRadius, 1, 16, 100);
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a8a,
      emissive: new THREE.Color(0x1a1a3a),
      transparent: true,
      opacity: 0.3
    });
    const edgeRing = new THREE.Mesh(edgeGeometry, edgeMaterial);
    edgeRing.rotation.x = Math.PI / 2;
    edgeRing.position.y = 0.05;
    scene.add(edgeRing);

    setDebug('Loading FBX model...');

    // Load FBX model
    const loader = new FBXLoader();
    
    loader.load(
      modelPath,
      (object) => {
        setDebug('FBX model loaded successfully');
        setLoading(false);
        
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        const targetSize = 30;
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = targetSize / maxDim;
        
        object.scale.set(scale * 20, scale * 20, scale * 20);
        object.rotation.x = -(90 * Math.PI / 180);
        
        object.position.set(
          -center.x * scale,
          0,
          -center.z * scale
        );
        
        // Building materials
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            child.material = new THREE.MeshStandardMaterial({
              color: 0x9a9ab0,
              roughness: 0.4,
              metalness: 0.2
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
      
      // Animate ground texture (slow rotation for circular effect)
      if (groundTexture) {
        groundTexture.offset.x += 0.0005;
        groundTexture.offset.y += 0.0003;
      }
      
      
      
      // Animate water plane
      if (waterPlane) {
        waterPlane.position.y = 0.1 + Math.sin(elapsedTime * 2) * 0.05;
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
    backgroundColor: '#2a2a6a',
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
    backgroundColor: 'rgba(42, 42, 106, 0.7)',
    color: 'white',
    fontSize: '1.2rem',
    zIndex: 10,
    pointerEvents: 'none',
  };

  return (
    <div style={containerStyle}>
      <div style={canvasWrapperStyle} ref={containerRef} />
      {error && (
        <div style={{ ...overlayStyle, backgroundColor: 'rgba(255, 0, 0, 0.3)' }}>
          <div style={{ color: '#ff6b6b', textAlign: 'center' }}>
            <div>⚠️ Error loading model</div>
            <div style={{ fontSize: '0.9rem', marginTop: '8px' }}>{error}</div>
          </div>
        </div>
      )}
    </div>
  );
}
