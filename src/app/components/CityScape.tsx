'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const CityScape = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationIdRef = useRef<number>(0);
  const cameraAngleRef = useRef<number>(0);
  const buildingsRef = useRef<THREE.Group[]>([]);

  const getTimeOfDay = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return hours + minutes / 60;
  };

  const getSkyColor = (time: number) => {
    if (time >= 6 && time <= 18) {
      const progress = (time - 6) / 12;
      // Sky blue gradient
      const r = 135 + 40 * (1 - progress);
      const g = 206 + 49 * (1 - progress);
      const b = 235;
      return new THREE.Color(r / 255, g / 255, b / 255);
    } else {
      let progress;
      if (time > 18) {
        progress = (time - 18) / 12;
      } else {
        progress = (time + 6) / 12;
      }
      
      // Dark indigo to light blue gradient
      const r = 25 + 30 * progress;
      const g = 0 + 40 * progress;
      const b = 50 + 150 * progress;
      return new THREE.Color(r / 255, g / 255, b / 255);
    }
  };

  const createSimpleBuilding = (x: number, z: number, height: number) => {
    const group = new THREE.Group();
    
    // Random building width/depth
    const width = 2 + Math.random() * 3;
    const depth = 2 + Math.random() * 3;
    
    // Main building structure
    const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
    
    // Create building color with variation
    const hue = 0.1 + Math.random() * 0.1; // Grayish tones
    const saturation = 0.1;
    const lightness = 0.1 + Math.random() * 0.1;
    const buildingColor = new THREE.Color().setHSL(hue, saturation, lightness);
    
    const buildingMaterial = new THREE.MeshPhongMaterial({
      color: buildingColor,
      shininess: 10
    });
    
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.castShadow = true;
    building.receiveShadow = true;
    building.position.y = height / 2;
    group.add(building);

    // Create window texture
    const createWindowTexture = (isDayTime: boolean) => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      
      // Fill with building color
      ctx.fillStyle = `rgb(${Math.floor(buildingColor.r * 255)}, ${Math.floor(buildingColor.g * 255)}, ${Math.floor(buildingColor.b * 255)})`;
      ctx.fillRect(0, 0, 64, 64);
      
      // Draw window grid
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 2;
      
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          const x = i * 16;
          const y = j * 16;
          
          // Window frame
          ctx.strokeRect(x + 2, y + 2, 12, 12);
          
          // Random lit windows
          if (Math.random() > 0.7) {
            if (isDayTime) {
              ctx.fillStyle = '#666666';
            } else {
              // Yellow window lights at night
              ctx.fillStyle = Math.random() > 0.5 ? '#ffaa33' : '#ffcc66';
            }
            ctx.fillRect(x + 4, y + 4, 8, 8);
          } else {
            ctx.fillStyle = '#111111';
            ctx.fillRect(x + 4, y + 4, 8, 8);
          }
        }
      }
      
      return canvas;
    };

    const isDayTime = getTimeOfDay() >= 6 && getTimeOfDay() <= 18;
    const windowTexture = createWindowTexture(isDayTime);
    const texture = new THREE.CanvasTexture(windowTexture);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, Math.ceil(height / 3));

    // Apply window texture to all sides
    const buildingMaterialWithWindows = new THREE.MeshPhongMaterial({
      map: texture,
      color: buildingColor,
      shininess: 10
    });

    building.material = buildingMaterialWithWindows;

    group.position.set(x, 0, z);
    return group;
  };

  const init = () => {
    if (!canvasRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera - Fixed 5:1 aspect ratio
    const aspectRatio = 5 / 1;
    const camera = new THREE.PerspectiveCamera(
      45,
      aspectRatio,
      1,
      2000
    );
    camera.position.set(150, 80, 150);
    cameraRef.current = camera;

    // Renderer with 5:1 aspect ratio
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1)); // Lower for performance
    renderer.setSize(window.innerWidth, window.innerWidth / 5); // 5:1 aspect ratio
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap; // Simpler shadows for performance
    rendererRef.current = renderer;

    // Clear existing content
    while (canvasRef.current.firstChild) {
      canvasRef.current.removeChild(canvasRef.current.firstChild);
    }
    canvasRef.current.appendChild(renderer.domElement);

    // Create city grid with buildings
    const createCity = () => {
      buildingsRef.current = [];
      
      // Create buildings in a grid pattern
      const gridSize = 20;
      const spacing = 6;
      
      for (let i = -gridSize; i <= gridSize; i++) {
        for (let j = -gridSize; j <= gridSize; j++) {
          // Skip some positions for streets
          if (Math.random() > 0.3) continue;
          
          const x = i * spacing + (Math.random() - 0.5) * 2;
          const z = j * spacing + (Math.random() - 0.5) * 2;
          
          // Vary building heights
          const height = 5 + Math.random() * 20 + Math.sqrt(i*i + j*j) * 0.5;
          
          const building = createSimpleBuilding(x, z, height);
          scene.add(building);
          buildingsRef.current.push(building);
        }
      }
    };

    // Create ground
    const createGround = () => {
      const groundGeometry = new THREE.PlaneGeometry(300, 300);
      const groundMaterial = new THREE.MeshPhongMaterial({
        color: 0x111111,
        shininess: 5
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);
    };

    // Setup lighting
    const setupLighting = () => {
      const time = getTimeOfDay();
      const isDayTime = time >= 6 && time <= 18;
      
      // Clear existing lights
      scene.children = scene.children.filter(
        child => !(child instanceof THREE.Light)
      );

      // Set sky color
      scene.background = getSkyColor(time);

      // Main directional light (sun/moon)
      const mainLight = new THREE.DirectionalLight(
        isDayTime ? 0xffffff : 0x4466aa,
        isDayTime ? 1.0 : 0.5
      );
      mainLight.position.set(50, 100, 50);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.width = 1024; // Reduced for performance
      mainLight.shadow.mapSize.height = 1024;
      scene.add(mainLight);

      // Ambient light
      const ambientLight = new THREE.AmbientLight(
        isDayTime ? 0x404040 : 0x222233,
        isDayTime ? 0.5 : 0.3
      );
      scene.add(ambientLight);
    };

    // Initialize scene
    createCity();
    createGround();
    setupLighting();

    // Camera animation for circling the city
    const updateCamera = () => {
      cameraAngleRef.current += 0.002; // Slower rotation
      
      const radius = 150;
      const height = 80;
      
      // Calculate camera position in a circle
      const x = Math.cos(cameraAngleRef.current) * radius;
      const z = Math.sin(cameraAngleRef.current) * radius;
      
      camera.position.x = x;
      camera.position.z = z;
      camera.position.y = height;
      
      // Make camera look at center of city
      camera.lookAt(0, 20, 0);
      
      // Add slight up/down movement for more dynamic feel
      camera.position.y += Math.sin(cameraAngleRef.current * 0.5) * 10;
    };

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      // Update camera position
      updateCamera();
      
      // Slowly rotate buildings for variation
      buildingsRef.current.forEach((building, index) => {
        building.rotation.y += 0.0001 * (index % 3 + 1);
      });
      
      // Update lighting based on time (less frequently for performance)
      if (Math.random() > 0.98) { // Only update 2% of frames
        setupLighting();
      }
      
      renderer.render(scene, camera);
    };

    // Handle window resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;

      const newWidth = window.innerWidth;
      const newHeight = newWidth / 5; // Maintain 5:1 aspect ratio
      
      cameraRef.current.aspect = 5 / 1;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size set
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationIdRef.current);
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (rendererRef.current.domElement.parentNode) {
          rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
        }
      }
      
      // Dispose geometries and materials
      buildingsRef.current.forEach(building => {
        building.traverse(child => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      });
      
      buildingsRef.current = [];
    };
  };

  useEffect(() => {
    const cleanup = init();
    return cleanup;
  }, []);

  return (
    <div className="relative w-full" style={{ height: 'calc(100vw / 5)' }}>
      <div 
        ref={canvasRef} 
        className="absolute inset-0"
      />
      <div className="absolute top-4 left-4 text-white bg-black/70 p-2 rounded-lg text-xs">
        <div className="font-mono">
          {(() => {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
          })()}
        </div>
        <div className=" opacity-75">
          Camera circling city • 5:1 aspect ratio
        </div>
      </div>
    </div>
  );
};

export default CityScape;
