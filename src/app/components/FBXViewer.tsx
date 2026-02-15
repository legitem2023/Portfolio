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

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111122); // Dark blueish background

    // Camera setup with proper aspect ratio
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 400; // Fixed height for better visibility
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(30, 20, 30); // Better initial position
    camera.lookAt(0, 5, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.maxPolarAngle = Math.PI / 2;
    controls.enableZoom = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;
    controls.target.set(0, 5, 0);

    // ============ ENHANCED LIGHTING ============
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0x404060, 0.8);
    scene.add(ambientLight);

    // Hemisphere light for sky/ground bounce
    const hemiLight = new THREE.HemisphereLight(0x443333, 0x111122, 1.2);
    scene.add(hemiLight);

    // Main directional light (simulating sun)
    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.5);
    dirLight.position.set(20, 30, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    scene.add(dirLight);

    // Fill light 1 (cool)
    const fillLight1 = new THREE.PointLight(0x4466ff, 0.8);
    fillLight1.position.set(-20, 15, 20);
    scene.add(fillLight1);

    // Fill light 2 (warm)
    const fillLight2 = new THREE.PointLight(0xffaa66, 0.6);
    fillLight2.position.set(20, 10, -20);
    scene.add(fillLight2);

    // Back light
    const backLight = new THREE.PointLight(0xffffff, 0.4);
    backLight.position.set(-10, 10, -30);
    scene.add(backLight);

    // ============ DEBUG AIDS ============
    // Add test objects to verify rendering works
    const addTestObjects = () => {
      // Red cube - should be visible at (-15, 2.5, 0)
      const geometry1 = new THREE.BoxGeometry(5, 5, 5);
      const material1 = new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        emissive: 0x220000,
        roughness: 0.3,
        metalness: 0.1
      });
      const cube1 = new THREE.Mesh(geometry1, material1);
      cube1.castShadow = true;
      cube1.receiveShadow = true;
      cube1.position.set(-15, 2.5, 0);
      scene.add(cube1);

      // Blue sphere - should be visible at (15, 3, 0)
      const geometry2 = new THREE.SphereGeometry(3, 32, 32);
      const material2 = new THREE.MeshStandardMaterial({ 
        color: 0x0066ff,
        emissive: 0x001122,
        roughness: 0.2,
        metalness: 0.3
      });
      const sphere = new THREE.Mesh(geometry2, material2);
      sphere.castShadow = true;
      sphere.receiveShadow = true;
      sphere.position.set(15, 3, 0);
      scene.add(sphere);

      // Yellow cylinder - should be visible at (0, 2.5, -15)
      const geometry3 = new THREE.CylinderGeometry(2, 2, 5, 32);
      const material3 = new THREE.MeshStandardMaterial({ 
        color: 0xffaa00,
        emissive: 0x221100,
        roughness: 0.4
      });
      const cylinder = new THREE.Mesh(geometry3, material3);
      cylinder.castShadow = true;
      cylinder.receiveShadow = true;
      cylinder.position.set(0, 2.5, -15);
      scene.add(cylinder);

      // Ground plane (semi-transparent for debugging)
      const planeGeometry = new THREE.PlaneGeometry(100, 100);
      const planeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x336633, 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3
      });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.rotation.x = Math.PI / 2;
      plane.position.y = 0;
      plane.receiveShadow = true;
      scene.add(plane);
    };

    addTestObjects();

    // Grid helper (enhanced)
    const gridHelper = new THREE.GridHelper(100, 20, 0x88aaff, 0x335588);
    scene.add(gridHelper);

    // Axis helper (optional - uncomment if needed)
    // const axesHelper = new THREE.AxesHelper(20);
    // scene.add(axesHelper);

    // Add a simple point light at origin to see if lighting works
    const originLight = new THREE.PointLight(0xffffff, 0.5);
    originLight.position.set(0, 5, 0);
    scene.add(originLight);

    setDebug('Loading FBX model...');

    // Load FBX model
    const loader = new FBXLoader();
    
    loader.load(
      modelPath,
      (object) => {
        setDebug('FBX model loaded successfully');
        setLoading(false);
        
        console.log('FBX Model loaded:', object);
        console.log('Model children:', object.children);
        
        // Calculate bounding box for scaling
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        console.log('Original model size:', size);
        console.log('Original model center:', center);
        
        // Smart scaling - target a reasonable size
        const targetSize = 30; // We want the model to fit within 30 units
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = targetSize / maxDim;
        
        console.log(`Applying scale factor: ${scale} (from ${maxDim} to ${targetSize})`);
        
        // Apply scale
        object.scale.set(scale, scale, scale);
        
        // Center the model
        object.position.set(
          -center.x * scale,
          -center.y * scale,
          -center.z * scale
        );
        
        // Enable shadows and enhance materials
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Enhance materials for better visibility
            if (child.material) {
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              materials.forEach(material => {
                material.roughness = 0.6;
                material.metalness = 0.2;
                material.emissive = new THREE.Color(0x111111);
                material.emissiveIntensity = 0.1;
                
                // Ensure material is responsive to lights
                material.needsUpdate = true;
              });
            }
          }
        });
        
        scene.add(object);
        
        // Remove test objects after model loads (optional)
        // You can comment this out if you want to keep test objects for comparison
        // scene.remove(cube1, sphere, cylinder, plane);
        
        // Adjust camera to frame the model
        const newBox = new THREE.Box3().setFromObject(object);
        const newCenter = newBox.getCenter(new THREE.Vector3());
        const newSize = newBox.getSize(new THREE.Vector3());
        
        const maxDim2 = Math.max(newSize.x, newSize.y, newSize.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraDistance = maxDim2 / (2 * Math.tan(fov / 2));
        cameraDistance *= 1.5; // Add padding
        
        camera.position.set(
          newCenter.x + cameraDistance,
          newCenter.y + cameraDistance * 0.6,
          newCenter.z + cameraDistance
        );
        camera.lookAt(newCenter);
        
        controls.target.copy(newCenter);
        controls.update();
        
        setDebug('Model positioned and ready');
      },
      (progress) => {
        const percent = (progress.loaded / progress.total) * 100;
        setDebug(`Loading: ${Math.round(percent)}%`);
        console.log(`FBX loading: ${Math.round(percent)}%`);
      },
      (error: any) => {
        setLoading(false);
        const errorMsg = error?.message || 'Unknown error';
        setError(`Failed to load model: ${errorMsg}`);
        setDebug(`Error: ${errorMsg}`);
        console.error('FBX loading error details:', error);
        
        // Keep test objects so user can see something
        console.log('Keeping test objects for debugging');
      }
    );

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Update controls
      controls.update();
      
      // Render scene
      renderer.render(scene, camera);
    };
    
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const newWidth = containerRef.current.clientWidth;
      const newHeight = 400; // Keep fixed height
      
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Log renderer info
    console.log('Renderer:', renderer.info);
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

  // Styles for the container
  const containerStyle: React.CSSProperties = {
    width: '100%',
    position: 'relative',
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    minHeight: '400px',
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    fontSize: '1.2rem',
    zIndex: 10,
    pointerEvents: 'none',
  };

  const debugStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '10px',
    left: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#0f0',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
    zIndex: 20,
  };

  return (
    <div style={containerStyle}>
      <div style={canvasWrapperStyle} ref={containerRef} />
      <div style={debugStyle}>Debug: {debug}</div>
      {loading && (
        <div style={overlayStyle}>
          <div>Loading city model...</div>
          <div style={{ fontSize: '0.9rem', marginTop: '8px', color: '#aaa' }}>
            {debug}
          </div>
        </div>
      )}
      {error && (
        <div style={{ ...overlayStyle, backgroundColor: 'rgba(255, 0, 0, 0.3)' }}>
          <div style={{ color: '#ff6b6b', textAlign: 'center' }}>
            <div>⚠️ Error loading model</div>
            <div style={{ fontSize: '0.9rem', marginTop: '8px' }}>{error}</div>
            <div style={{ fontSize: '0.8rem', marginTop: '16px', color: '#ffaaaa' }}>
              Showing test objects instead
            </div>
          </div>
        </div>
      )}
    </div>
  );
              }
