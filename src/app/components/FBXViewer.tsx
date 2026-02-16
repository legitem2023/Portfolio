'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface FBXViewerProps {
  modelPath?: string; // Optional prop to customize path
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
      // Create gradient from dark indigo (top) to light indigo (bottom)
      const gradient = context.createLinearGradient(0, 0, 0, 2);
      gradient.addColorStop(0, '#1a1a4a'); // Dark indigo at top
      gradient.addColorStop(1, '#4a4a8a'); // Light indigo at bottom

      context.fillStyle = gradient;
      context.fillRect(0, 0, 1, 2);

      const gradientTexture = new THREE.CanvasTexture(canvas);
      scene.background = gradientTexture;
      scene.fog = new THREE.Fog(0x4a4a8a, 50, 300);
    } else {
      scene.background = new THREE.Color(0x2a2a6a);
      scene.fog = new THREE.Fog(0x2a2a6a, 50, 300);
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

    // ============ DARK GRAY GROUND (5x SCALE) ============
    
    // Main ground plane with dark gray color - scaled 5x
    const planeGeometry = new THREE.PlaneGeometry(500, 500);
    const planeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333, // Dark gray
      roughness: 0.7,
      metalness: 0.1
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.scale.set(1000, 1000, 1000); // Scale 5x
    plane.rotation.x = Math.PI / 2;
    plane.position.y = 0;
    plane.receiveShadow = true;
    scene.add(plane);

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
    const animate = () => {
      requestAnimationFrame(animate);
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
