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

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111122); // Dark blueish background

    // Camera setup with aspect ratio consideration
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = width / 5; // 5:1 aspect ratio (width:height)
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(50, 30, 50); // Adjusted for city scale
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true; // Enable shadows if your model uses them
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.maxPolarAngle = Math.PI / 2; // Restrict below horizon
    controls.enableZoom = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;

    // Lighting
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0x404060);
    scene.add(ambientLight);

    // Directional light (simulating sun)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 30, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Additional fill lights
    const fillLight1 = new THREE.PointLight(0x4466ff, 0.5);
    fillLight1.position.set(-20, 10, 20);
    scene.add(fillLight1);

    const fillLight2 = new THREE.PointLight(0xffaa66, 0.3);
    fillLight2.position.set(20, 5, -20);
    scene.add(fillLight2);

    // Optional: Add a subtle grid helper for scale reference
    const gridHelper = new THREE.GridHelper(100, 20, 0x888888, 0x444444);
    scene.add(gridHelper);

    // Optional: Add axis helper (commented out by default)
    // const axesHelper = new THREE.AxesHelper(50);
    // scene.add(axesHelper);

    // Load FBX model
    const loader = new FBXLoader();
    
    loader.load(
      modelPath,
      (object) => {
        // Success callback
        setLoading(false);
        
        // Scale and position the model if needed
        // You might need to adjust these values based on your model's size
        object.scale.set(0.1, 0.1, 0.1); // Adjust scale as needed
        object.position.set(0, 0, 0);
        
        // Enable shadows if the model supports it
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Optional: Enhance materials
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(m => {
                  m.roughness = 0.7;
                  m.metalness = 0.3;
                });
              } else {
                child.material.roughness = 0.7;
                child.material.metalness = 0.3;
              }
            }
          }
        });
        
        scene.add(object);
        
        // Center the camera on the model
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Adjust camera to fit model
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraDistance = maxDim / (2 * Math.tan(fov / 2));
        cameraDistance *= 1.5; // Add some padding
        
        camera.position.copy(center);
        camera.position.x += cameraDistance;
        camera.position.y += cameraDistance / 2;
        camera.position.z += cameraDistance;
        camera.lookAt(center);
        
        controls.target.copy(center);
        controls.update();
      },
      (progress) => {
        // Progress callback
        const percentComplete = (progress.loaded / progress.total) * 100;
        console.log(`Loading model: ${Math.round(percentComplete)}%`);
      },
      (error:any) => {
        // Error callback
        setLoading(false);
        setError(`Failed to load model`);
        console.error('FBX loading error:', error);
      }
    );

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      controls.update(); // Only needed if damping or autoRotate is enabled
      
      renderer.render(scene, camera);
    };
    
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const newWidth = containerRef.current.clientWidth;
      const newHeight = newWidth / 5; // Maintain 5:1 aspect ratio
      
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [modelPath]);

  // Styles for the container
  const containerStyle: React.CSSProperties = {
    width: '100%',
    position: 'relative',
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  const innerStyle: React.CSSProperties = {
    width: '100%',
    paddingBottom: '20%', // This creates the 5:1 aspect ratio (100% width / 5 = 20% height)
    position: 'relative',
  };

  const canvasWrapperStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    fontSize: '1.2rem',
    zIndex: 10,
    pointerEvents: 'none',
  };

  return (
    <div style={containerStyle}>
      <div style={innerStyle}>
        <div style={canvasWrapperStyle} ref={containerRef} />
        {loading && (
          <div style={overlayStyle}>
            <div>Loading city model...</div>
          </div>
        )}
        {error && (
          <div style={{ ...overlayStyle, backgroundColor: 'rgba(255, 0, 0, 0.3)' }}>
            <div style={{ color: '#ff6b6b', textAlign: 'center' }}>
              <div>Error loading model</div>
              <div style={{ fontSize: '0.9rem', marginTop: '8px' }}>{error}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
