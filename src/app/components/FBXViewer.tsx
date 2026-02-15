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

    // Scene setup with sky blue background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    scene.fog = new THREE.Fog(0x87CEEB, 50, 200); // Add fog for depth

    // Camera setup with proper aspect ratio
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 400; // Fixed height for better visibility
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(30, 20, 30); // Better initial position
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5; // Increase exposure for brighter scene
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

    // ============ ENHANCED BRIGHT LIGHTING FOR SKY EFFECT ============
    
    // 1. Hemisphere light for sky/ground bounce (very bright)
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x44AA88, 3.0);
    scene.add(hemiLight);

    // 2. Main directional light (simulating bright sun)
    const dirLight = new THREE.DirectionalLight(0xFFEECC, 2.5);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.camera.left = -80;
    dirLight.shadow.camera.right = 80;
    dirLight.shadow.camera.top = 80;
    dirLight.shadow.camera.bottom = -80;
    dirLight.shadow.bias = -0.0005;
    
    // Add a second directional light from opposite side for fill
    const dirLight2 = new THREE.DirectionalLight(0xCCDDFF, 1.5);
    dirLight2.position.set(-30, 40, -30);
    scene.add(dirLight2);
    
    scene.add(dirLight);

    // 3. Multiple point lights for ambient brightness
    const pointLight1 = new THREE.PointLight(0x88AAFF, 1.5, 100);
    pointLight1.position.set(20, 30, 20);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xFFAA88, 1.2, 100);
    pointLight2.position.set(-20, 20, -20);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0x88FFAA, 1.0, 100);
    pointLight3.position.set(30, 15, -30);
    scene.add(pointLight3);

    // 4. Ambient light with sky color
    const ambientLight = new THREE.AmbientLight(0x404060, 2.5);
    scene.add(ambientLight);

    // 5. Add some colored lights for visual interest
    const colorLight1 = new THREE.PointLight(0xFF8855, 1.2);
    colorLight1.position.set(40, 20, 40);
    scene.add(colorLight1);

    const colorLight2 = new THREE.PointLight(0x55AAFF, 1.2);
    colorLight2.position.set(-40, 15, 30);
    scene.add(colorLight2);

    // 6. Add a subtle blue tint light from above
    const topLight = new THREE.PointLight(0xAACCFF, 1.8);
    topLight.position.set(0, 60, 0);
    scene.add(topLight);

    // 7. Add a ring of lights around the scene for even illumination
    const ringRadius = 80;
    const ringHeight = 30;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = Math.cos(angle) * ringRadius;
      const z = Math.sin(angle) * ringRadius;
      
      const ringLight = new THREE.PointLight(0xCCDDFF, 0.8);
      ringLight.position.set(x, ringHeight, z);
      scene.add(ringLight);
    }

    // ============ VISUAL ENHANCEMENTS ============
    
    // Add a sun sphere for visual effect
    const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFAA55,
      
      transparent: true,
      opacity: 0.3
    });
    const sunSphere = new THREE.Mesh(sunGeometry, sunMaterial);
    sunSphere.position.set(100, 80, 100);
    scene.add(sunSphere);

    // Add some floating particles to simulate atmosphere
    const particleCount = 500;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 200;
      particlePositions[i * 3 + 1] = Math.random() * 80;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x88AAFF,
      size: 0.2,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // ============ DEBUG AIDS ============
    // Add test objects to verify rendering works
    const addTestObjects = () => {

      // Ground plane (semi-transparent for debugging)
      const planeGeometry = new THREE.PlaneGeometry(100, 100);
      const planeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x707070, 
        side: THREE.DoubleSide,
        transparent:false,
        opacity: 1
      });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.rotation.x = Math.PI / 2;
      plane.position.y = 1;
      plane.receiveShadow = true;
      scene.add(plane);
    };

    addTestObjects();


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
        object.scale.set(scale * 20, scale * 20, scale * 20);
        
        object.rotation.x = -(90 * Math.PI / 180);  // Formula: degrees * PI/180
        
        // Center the model
        object.position.set(
          -center.x * scale,
          0,
          -center.z * scale
        );
        
        // Enable shadows and enhance materials for better light response
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Enhance materials for better visibility and brighter appearance
            if (child.material) {
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              materials.forEach(material => {
                // Make materials more reflective and brighter
                material.roughness = 0.4;
                material.metalness = 0.1;
                material.emissive = new THREE.Color(0x112233);
                material.emissiveIntensity = 0.2;
                material.color.multiplyScalar(1.2); // Brighten colors
                
                // Ensure material is responsive to lights
                material.needsUpdate = true;
              });
            }
          }
        });
        
        scene.add(object);
        
        // Adjust camera to frame the model
        const newBox = new THREE.Box3().setFromObject(object);
        const newCenter = newBox.getCenter(new THREE.Vector3());
        const newSize = newBox.getSize(new THREE.Vector3());
        
        const maxDim2 = Math.max(newSize.x, newSize.y, newSize.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraDistance = maxDim2 / (2 * Math.tan(fov / 2));
        cameraDistance *= 1.5; // Add padding
        
        /*camera.position.set(
          newCenter.x + cameraDistance,
          newCenter.y + cameraDistance * 0.6,
          newCenter.z + cameraDistance
        );*/
        camera.lookAt(newCenter);
        
        //controls.target.copy(newCenter);
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
      
      // Animate particles (subtle movement)
      particles.rotation.y += 0.0005;
      
      // Animate sun sphere (subtle pulsing)
      const time = Date.now() * 0.001;
      sunSphere.scale.setScalar(1 + Math.sin(time) * 0.1);
      
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
    backgroundColor: '#87CEEB', // Sky blue background
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
    backgroundColor: 'rgba(135, 206, 235, 0.7)', // Semi-transparent sky blue
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
          <div style={{ fontSize: '0.9rem', marginTop: '8px', color: '#333' }}>
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
