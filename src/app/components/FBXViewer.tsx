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

    // Scene setup with bright daylight sky
    const scene = new THREE.Scene();
    
    // Bright daylight sky gradient
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const context = canvas.getContext('2d');

    if (context) {
      const gradient = context.createLinearGradient(0, 0, 0, 512);
      gradient.addColorStop(0, '#4A90E2'); // Deep sky blue sa itaas
      gradient.addColorStop(0.3, '#6BA5E8'); // Medium blue
      gradient.addColorStop(0.6, '#87C1FF'); // Light blue
      gradient.addColorStop(0.8, '#E0F0FF'); // Very light near horizon
      gradient.addColorStop(1, '#FFFFFF'); // White at horizon
      context.fillStyle = gradient;
      context.fillRect(0, 0, 2, 512);
      const gradientTexture = new THREE.CanvasTexture(canvas);
      scene.background = gradientTexture;
    }

    // Camera setup
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 400;
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(7, 24, 37);
    camera.lookAt(0, 0, 0);

    // Renderer with daylight settings
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance",
      alpha: false
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 2.0; // Increased for brighter scene
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.minDistance = 20;
    controls.maxDistance = 60;
    controls.enableZoom = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;
    controls.target.set(0, 8, 0);

    // ============ BRIGHT DAYLIGHT LIGHTING ============
    
    // Main sunlight (bright white/yellow for midday)
    const sunLight = new THREE.DirectionalLight(0xFFF5E6, 2.5); // Brighter, slightly warm
    sunLight.position.set(30, 50, 20); // Higher sun for less shadows
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -40;
    sunLight.shadow.camera.right = 40;
    sunLight.shadow.camera.top = 40;
    sunLight.shadow.camera.bottom = -40;
    scene.add(sunLight);

    // Sun representation (lighter for daylight)
    const sunGlowGeometry = new THREE.SphereGeometry(1.8, 16, 16);
    const sunGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFEECC,
      transparent: true,
      opacity: 0.2 // More subtle
    });
    const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
    sunGlow.position.copy(sunLight.position);
    scene.add(sunGlow);

    // Bright sky light
    const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xE0F0FF, 1.2); // Brighter
    scene.add(hemiLight);

    // Fill light (brighter for daylight)
    const fillLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    fillLight.position.set(-20, 30, 30);
    scene.add(fillLight);

    // Back light (brighter rim lighting)
    const backLight = new THREE.DirectionalLight(0xFFFFFF, 0.6);
    backLight.position.set(20, 30, -40);
    scene.add(backLight);

    // Ambient light (brighter for daylight)
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.8);
    scene.add(ambientLight);

    // Additional fill from below (bounced light)
    const bounceLight = new THREE.DirectionalLight(0xE0F0FF, 0.4);
    bounceLight.position.set(0, -10, 0);
    scene.add(bounceLight);

    // ============ BRIGHTER GROUND ============
    
    const groundRadius = 400;
    const groundSegments = 64;
    
    // Create brighter ground texture
    const groundCanvas = document.createElement('canvas');
    groundCanvas.width = 1024;
    groundCanvas.height = 1024;
    const groundCtx = groundCanvas.getContext('2d');
    
    if (groundCtx) {
      // Lighter base color - light concrete/asphalt
      groundCtx.fillStyle = '#8A8F85';
      groundCtx.fillRect(0, 0, 1024, 1024);
      
      // Add subtle texture
      const imageData = groundCtx.getImageData(0, 0, 1024, 1024);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 15; // Less contrast for brighter look
        
        data[i] = Math.min(180, Math.max(120, data[i] + noise));
        data[i+1] = Math.min(175, Math.max(115, data[i+1] + noise));
        data[i+2] = Math.min(170, Math.max(110, data[i+2] + noise));
      }
      
      groundCtx.putImageData(imageData, 0, 0);
      
      // Very subtle road markings
      groundCtx.strokeStyle = '#B0B0A0';
      groundCtx.lineWidth = 2;
      
      // Faint grid lines
      groundCtx.strokeStyle = '#A0A090';
      groundCtx.lineWidth = 1;
      
      for (let i = 0; i < 1024; i += 128) {
        groundCtx.beginPath();
        groundCtx.moveTo(i, 0);
        groundCtx.lineTo(i, 1024);
        groundCtx.strokeStyle = 'rgba(160, 160, 140, 0.05)';
        groundCtx.stroke();
        
        groundCtx.beginPath();
        groundCtx.moveTo(0, i);
        groundCtx.lineTo(1024, i);
        groundCtx.stroke();
      }
    }
    
    const groundTexture = new THREE.CanvasTexture(groundCanvas);
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(8, 8);
    
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      map: groundTexture,
      color: 0xB0B5A5, // Lighter color
      roughness: 0.8,
      metalness: 0.2,
      emissive: new THREE.Color(0x000000),
      bumpMap: groundTexture,
      bumpScale: 0.3
    });
    
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(groundRadius, groundSegments),
      groundMaterial
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // Lighter atmospheric fog
    scene.fog = new THREE.FogExp2(0xE0F0FF, 0.0003);

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
        
        const scale = 700 / Math.max(size.x, size.y, size.z);
        
        object.scale.set(scale, scale, scale);
        object.rotation.x = -(90 * Math.PI / 180);
        
        object.position.set(
          -center.x * scale,
          0,
          -center.z * scale
        );
        
        // ============ BRIGHTER BUILDING MATERIALS ============
        
        // Brighter, more varied color palette for daylight
        const daylightColors = [
          // Light concrete and building materials
          0xE8E8E0, // Off-white
          0xD8D8D0, // Light gray
          0xC8C8C0, // Medium light gray
          0xF0F0E8, // Almost white
          0xE0E0D8, // Warm light gray
          0xD0D8D0, // Slight green tint
          0xD8D0C8, // Warm beige
          0xE8E0D8, // Light sandstone
          0xF5F5F0, // Very light
          0xE0D8D0, // Light taupe
        ];
        
        // Brighter accent colors for variety
        const accentColors = [
          0xC0C8D0, // Light blue-gray
          0xD0C8C0, // Light warm gray
          0xC8D0C0, // Light sage
          0xD0C8D0, // Light lavender-gray
        ];
        
        console.log(`Using ${daylightColors.length} daylight colors`);
        
        let meshCount = 0;
        
        object.traverse((child: any) => {
          if (child.isMesh) {
            meshCount++;
            
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Choose base color (mostly light, sometimes accent)
            let baseColor;
            if (Math.random() > 0.8) { // 20% chance for accent
              baseColor = accentColors[Math.floor(Math.random() * accentColors.length)];
            } else {
              baseColor = daylightColors[Math.floor(Math.random() * daylightColors.length)];
            }
            
            // Small variation
            const color = new THREE.Color(baseColor);
            const variation = 0.95 + Math.random() * 0.1; // 0.95 to 1.05
            color.multiplyScalar(variation);
            
            // Material properties for daylight (less rough, slightly reflective)
            const roughness = 0.4 + Math.random() * 0.3; // Less rough for brighter appearance
            const metalness = 0.1 + Math.random() * 0.2; // Slight metalness for some shine
            
            // Create material
            const material = new THREE.MeshStandardMaterial({
              color: color,
              roughness: roughness,
              metalness: metalness,
              emissive: new THREE.Color(0x000000),
              emissiveIntensity: 0,
              flatShading: false
            });
            
            // Add subtle window reflections (more common in daylight)
            if (Math.random() > 0.6) {
              material.emissive = new THREE.Color(0x112233);
              material.emissiveIntensity = 0.03; // Very subtle
            }
            
            child.material = material;
          }
        });
        
        console.log(`Applied daylight materials to ${meshCount} meshes`);
        setDebug(`Loaded ${meshCount} building elements`);

        scene.add(object);
        
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
    backgroundColor: '#4A90E2',
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
