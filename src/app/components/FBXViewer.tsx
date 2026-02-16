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

    // Scene setup with dark evening sky
    const scene = new THREE.Scene();
    
    // Simple solid color background (much lighter than gradient)
    scene.background = new THREE.Color(0x1a1a2e); // Dark blue
    scene.fog = new THREE.Fog(0x1a1a2e, 80, 250); // Increased fog start for better performance

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
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

    // ============ OPTIMIZED EVENING LIGHTING ============
    
    // Single hemisphere light
    const hemiLight = new THREE.HemisphereLight(0x1a2b4a, 0x4a2a1a, 0.8);
    scene.add(hemiLight);

    // Main directional light (low sun)
    const dirLight = new THREE.DirectionalLight(0xffaa66, 0.8);
    dirLight.position.set(-30, 20, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048; // Reduced shadow map size
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.camera.left = -80;
    dirLight.shadow.camera.right = 80;
    dirLight.shadow.camera.top = 80;
    dirLight.shadow.camera.bottom = -80;
    scene.add(dirLight);

    // Single fill light (instead of multiple)
    const fillLight = new THREE.DirectionalLight(0x88aaff, 0.3);
    fillLight.position.set(20, 10, -30);
    scene.add(fillLight);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x2a2a4a, 1.0);
    scene.add(ambientLight);

    // ============ OPTIMIZED TINY GROUND LIGHTS ============
    // Use instanced mesh for better performance
    
    const groundLights = new THREE.Group();
    
    // Create a single geometry and material for all light spheres
    const lightGeometry = new THREE.SphereGeometry(0.15, 4, 4); // Lower poly sphere
    const lightMaterial = new THREE.MeshStandardMaterial({
      emissive: new THREE.Color(0xffaa66),
      emissiveIntensity: 1.5
    });

    // Reduce number of lights significantly
    const lightPositions = [];
    
    // Add lights in a sparse grid pattern
    for (let x = -40; x <= 40; x += 8) { // Increased spacing
      for (let z = -40; z <= 40; z += 8) {
        // Add only 30% of possible positions
        if (Math.random() > 0.3) continue;
        
        lightPositions.push({ x, z, color: 0xffaa66 });
      }
    }
    
    // Add some random lights
    for (let i = 0; i < 30; i++) { // Reduced from 200 to 30
      const angle = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random() * 30;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      lightPositions.push({ x, z, color: 0x88aaff });
    }

    // Create lights from positions
    lightPositions.forEach(pos => {
      // Light sphere
      const material = lightMaterial.clone();
      material.color.setHex(pos.color);
      material.emissive.setHex(pos.color);
      
      const lightSphere = new THREE.Mesh(lightGeometry, material);
      lightSphere.position.set(pos.x, 0.15, pos.z);
      groundLights.add(lightSphere);
      
      // Point light (reduced intensity and range)
      const pointLight = new THREE.PointLight(pos.color, 0.4, 8); // Reduced range
      pointLight.position.set(pos.x, 1, pos.z);
      groundLights.add(pointLight);
    });

    scene.add(groundLights);

    // ============ SIMPLIFIED EVENING ATMOSPHERE ============
    
    // Simple moon (just a sphere, no glow)
    const moonGeometry = new THREE.SphereGeometry(3, 16, 16); // Lower poly
    const moonMaterial = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      emissive: 0x444466,
      emissiveIntensity: 0.2
    });
    const moonSphere = new THREE.Mesh(moonGeometry, moonMaterial);
    moonSphere.position.set(-60, 40, -60);
    scene.add(moonSphere);

    // Reduced number of stars
    const starCount = 200; // Reduced from 800
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
      const radius = 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.4;
      
      starPositions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      starPositions[i * 3 + 1] = Math.cos(phi) * radius + 20;
      starPositions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.3,
      transparent: true,
      opacity: 0.6
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Remove mist particles entirely for performance

    // ============ GROUND PLANE ============
    const planeGeometry = new THREE.PlaneGeometry(500, 500);
    const planeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a2a,
      roughness: 0.7,
      emissive: new THREE.Color(0x0a0a1a),
      emissiveIntensity: 0.1
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
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
        
        // Simplified materials
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Simple material without emissive for better performance
            child.material = new THREE.MeshStandardMaterial({
              color: 0x3a3a4a,
              roughness: 0.6,
              metalness: 0.1
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
      
      // Simple star rotation (no mist or light pulsing for performance)
      stars.rotation.y += 0.0002;
      
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
      
      // Dispose geometries and materials
      planeGeometry.dispose();
      planeMaterial.dispose();
      moonGeometry.dispose();
      moonMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      lightGeometry.dispose();
      
      renderer.dispose();
    };
  }, [modelPath]);

  // Styles for the container
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    aspectRatio: 4/1,
    backgroundColor: '#1a1a2e',
    borderRadius: '0px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
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
    backgroundColor: 'rgba(26, 26, 46, 0.7)',
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
