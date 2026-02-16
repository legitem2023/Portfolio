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

    // Scene setup with dark evening sky gradient
    const scene = new THREE.Scene();
    
    // Create a gradient texture for the evening sky
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 2;
    const context = canvas.getContext('2d');

    if (context) {
      // Evening gradient: dark blue/purple at top to orange/purple horizon
      const gradient = context.createLinearGradient(0, 0, 0, 2);
      gradient.addColorStop(0, '#0a0a2a'); // Deep night blue at top
      gradient.addColorStop(0.5, '#2a1b3d'); // Dark purple in middle
      gradient.addColorStop(1, '#4a2b4d'); // Warm purple/orange at horizon

      context.fillStyle = gradient;
      context.fillRect(0, 0, 1, 2);

      const gradientTexture = new THREE.CanvasTexture(canvas);
      gradientTexture.wrapS = THREE.RepeatWrapping;
      gradientTexture.wrapT = THREE.RepeatWrapping;
      gradientTexture.repeat.set(1, 1);

      scene.background = gradientTexture;
      scene.fog = new THREE.Fog(0x4a2b4d, 50, 300); // Warm fog at horizon
    } else {
      scene.background = new THREE.Color(0x1a1a2e); // Dark blue fallback
      scene.fog = new THREE.Fog(0x1a1a2e, 50, 300);
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
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2; // Slightly lower exposure for evening
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

    // ============ EVENING LIGHTING SETUP ============
    
    // 1. Dim hemisphere light for evening ambiance
    const hemiLight = new THREE.HemisphereLight(0x1a2b4a, 0x4a2a1a, 0.8);
    scene.add(hemiLight);

    // 2. Main directional light (low sun - orange/red tint)
    const dirLight = new THREE.DirectionalLight(0xffaa66, 0.8);
    dirLight.position.set(-30, 20, 40); // Low in the sky
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
    scene.add(dirLight);

    // 3. Fill light with cool evening color
    const fillLight = new THREE.DirectionalLight(0x88aaff, 0.4);
    fillLight.position.set(20, 10, -30);
    scene.add(fillLight);

    // 4. Ambient light with evening color
    const ambientLight = new THREE.AmbientLight(0x2a2a4a, 1.2);
    scene.add(ambientLight);

    // 5. Create a container for ground lights
    const groundLights = new THREE.Group();

    // ============ TINY GROUND LIGHTS ============
    // Function to create a tiny glowing light
    const createTinyLight = (x: number, z: number, color: number, intensity: number = 0.8) => {
      // Tiny sphere for the light source
      const geometry = new THREE.SphereGeometry(0.15, 8, 8);
      const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: intensity * 1.5
      });
      const lightSphere = new THREE.Mesh(geometry, material);
      lightSphere.position.set(x, 0.15, z);
      
      // Add a point light for illumination
      const pointLight = new THREE.PointLight(color, intensity, 15);
      pointLight.position.set(x, 1, z);
      
      groundLights.add(lightSphere);
      groundLights.add(pointLight);
    };

    // Create a grid of lights
    const gridSize = 60;
    const spacing = 4;
    
    // Warm white lights for main streets
    for (let x = -gridSize; x <= gridSize; x += spacing) {
      for (let z = -gridSize; z <= gridSize; z += spacing) {
        // Add some randomness to placement
        if (Math.random() > 0.7) continue; // Skip some positions for natural look
        
        // Different colors for variety
        if (Math.random() > 0.8) {
          createTinyLight(x, z, 0xffaa66, 0.6); // Warm orange
        } else if (Math.random() > 0.6) {
          createTinyLight(x, z, 0x88aaff, 0.5); // Cool blue
        } else {
          createTinyLight(x, z, 0xffdd88, 0.7); // Warm white
        }
      }
    }

    // Add some random lights in patterns
    for (let i = 0; i < 200; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random() * 30;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const colorChoice = Math.random();
      if (colorChoice > 0.6) {
        createTinyLight(x, z, 0xff6666, 0.5); // Reddish
      } else if (colorChoice > 0.3) {
        createTinyLight(x, z, 0x66ff66, 0.4); // Greenish
      } else {
        createTinyLight(x, z, 0x6666ff, 0.6); // Blue
      }
    }

    scene.add(groundLights);

    // ============ EVENING ATMOSPHERE ============
    
    // Add a moon sphere
    const moonGeometry = new THREE.SphereGeometry(4, 32, 32);
    const moonMaterial = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      emissive: 0x444466,
      emissiveIntensity: 0.3
    });
    const moonSphere = new THREE.Mesh(moonGeometry, moonMaterial);
    moonSphere.position.set(-80, 60, -80);
    scene.add(moonSphere);

    // Add evening stars
    const starCount = 800;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
      // Position stars in a dome above
      const radius = 150;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.4; // Keep stars in upper hemisphere
      
      starPositions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      starPositions[i * 3 + 1] = Math.cos(phi) * radius + 20;
      starPositions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
      
      // Random star colors (mostly white, some blue/red)
      const colorRand = Math.random();
      if (colorRand > 0.95) {
        starColors[i * 3] = 1.0; // Red
        starColors[i * 3 + 1] = 0.6;
        starColors[i * 3 + 2] = 0.6;
      } else if (colorRand > 0.85) {
        starColors[i * 3] = 0.6; // Blue
        starColors[i * 3 + 1] = 0.6;
        starColors[i * 3 + 2] = 1.0;
      } else {
        starColors[i * 3] = 1.0; // White
        starColors[i * 3 + 1] = 1.0;
        starColors[i * 3 + 2] = 1.0;
      }
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    
    const starMaterial = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Add some floating particles for evening mist
    const mistCount = 300;
    const mistGeometry = new THREE.BufferGeometry();
    const mistPositions = new Float32Array(mistCount * 3);
    
    for (let i = 0; i < mistCount; i++) {
      mistPositions[i * 3] = (Math.random() - 0.5) * 200;
      mistPositions[i * 3 + 1] = Math.random() * 30;
      mistPositions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }
    
    mistGeometry.setAttribute('position', new THREE.BufferAttribute(mistPositions, 3));
    
    const mistMaterial = new THREE.PointsMaterial({
      color: 0x88aaff,
      size: 0.3,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending
    });
    
    const mist = new THREE.Points(mistGeometry, mistMaterial);
    scene.add(mist);

    // ============ GROUND PLANE ============
    const planeGeometry = new THREE.PlaneGeometry(500, 500);
    const planeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a2a,
      roughness: 0.7,
      metalness: 0.1,
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
        
        console.log('FBX Model loaded:', object);
        
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        console.log('Original model size:', size);
        
        // Scale the model
        const targetSize = 30;
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = targetSize / maxDim;
        
        console.log(`Applying scale factor: ${scale}`);
        
        object.scale.set(scale * 20, scale * 20, scale * 20);
        object.rotation.x = -(90 * Math.PI / 180);
        
        object.position.set(
          -center.x * scale,
          0,
          -center.z * scale
        );
        
        // Apply materials to buildings
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Darker materials for evening
            const material = new THREE.MeshStandardMaterial({
              color: 0x3a3a4a,
              roughness: 0.6,
              metalness: 0.2,
              emissive: new THREE.Color(0x111122),
              emissiveIntensity: 0.1
            });
            
            child.material = material;
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
      
      // Animate stars (subtle twinkling)
      stars.rotation.y += 0.0002;
      
      // Animate mist
      mist.rotation.y += 0.0003;
      
      // Animate ground lights (subtle pulsing)
      groundLights.children.forEach((child, index) => {
        if (child instanceof THREE.Mesh && child.material.emissive) {
          const time = Date.now() * 0.002 + index;
          const pulse = 0.8 + Math.sin(time) * 0.2;
          child.material.emissiveIntensity = pulse * 1.5;
        }
      });
      
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

  // Styles for the container
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    aspectRatio: 4/1,
    backgroundColor: '#1a1a2e', // Dark blue background
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
