'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const CityScape = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Camera - adjust FOV for wide aspect ratio
    const camera = new THREE.PerspectiveCamera(
      30, // Reduced FOV for wider view
      mount.clientWidth / mount.clientHeight,
      1,
      800 // Increased far plane for wider view
    );
    camera.position.set(80, 40, 0); // Position camera to the side for wide view
    camera.lookAt(0, 20, 0);
    
    // Renderer with optimized pixel ratio for header
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true // Allow transparency for header overlay
    });
    rendererRef.current = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    
    // Custom fog effect
    const skyColor = new THREE.Color(0xf0f5f5);
    const groundColor = new THREE.Color(0xd0dee7);
    
    // Create fog
    const fog = new THREE.Fog(skyColor, 1, 600); // Increased fog distance for wide view
    scene.fog = fog;
    
    // Background gradient
    const bgTexture = createGradientTexture(skyColor, groundColor);
    if (bgTexture) {
      scene.background = bgTexture;
    }
    
    // Create building geometry with windows
    const createBuildingGeometry = () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      
      // Create window texture
      const windowCanvas = document.createElement('canvas');
      windowCanvas.width = 64;
      windowCanvas.height = 64;
      const ctx = windowCanvas.getContext('2d');
      
      if (ctx) {
        // Building base color
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 0, 64, 64);
        
        // Draw windows in grid pattern
        const windowSize = 8;
        const spacing = 16;
        
        for (let x = 4; x < 64; x += spacing) {
          for (let y = 4; y < 64; y += spacing) {
            // Randomly light up some windows
            if (Math.random() > 0.3) {
              ctx.fillStyle = '#ffaa33';
              ctx.globalAlpha = 0.8 + Math.random() * 0.2;
            } else {
              ctx.fillStyle = '#444444';
              ctx.globalAlpha = 0.3;
            }
            ctx.fillRect(x, y, windowSize, windowSize);
          }
        }
        
        ctx.globalAlpha = 1;
      }
      
      const windowTexture = new THREE.CanvasTexture(windowCanvas);
      windowTexture.wrapS = THREE.RepeatWrapping;
      windowTexture.wrapT = THREE.RepeatWrapping;
      windowTexture.repeat.set(4, 8);
      
      const buildingMaterial = new THREE.MeshPhongMaterial({
        map: windowTexture,
        color: 0x333333,
        specular: 0x111111,
        shininess: 30,
        emissive: 0x222222,
        emissiveIntensity: 0.1,
        transparent: true,
        opacity: 0.95
      });
      
      return { geometry, material: buildingMaterial, texture: windowTexture };
    };
    
    // Create different building types
    const buildingTypes = [
      { color: 0x333333, windowColor: 0xffaa33, scaleMod: 1.0 },
      { color: 0x2a2a2a, windowColor: 0x88ccff, scaleMod: 0.8 },
      { color: 0x444444, windowColor: 0xff8888, scaleMod: 1.2 },
    ];
    
    const buildingCount = 1500; // Optimized for header
    const gridSize = 60; // Wider grid for 5:1 aspect
    const spacing = 10; // Closer spacing for denser look
    
    // Create organized rows of buildings
    const buildings: THREE.InstancedMesh[] = [];
    
    buildingTypes.forEach((type, typeIndex) => {
      const { geometry, material, texture } = createBuildingGeometry();
      const buildingMesh = new THREE.InstancedMesh(geometry, material, buildingCount / 3);
      buildings.push(buildingMesh);
      
      const dummy = new THREE.Object3D();
      const center = new THREE.Vector3();
      
      // Calculate grid positions for wide aspect ratio
      const cols = Math.floor(Math.sqrt(buildingCount / 3) * 2); // More columns for width
      const rows = Math.floor((buildingCount / 3) / cols);
      
      for (let i = 0; i < buildingMesh.count; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        // Position buildings in wide grid
        const x = (col - cols / 2) * spacing * 1.2; // Wider spread
        const z = (row - rows / 2) * spacing * 0.6; // Less depth
        
        // Height variation - taller in center
        const distanceFromCenter = Math.sqrt(x * x * 0.5 + z * z * 2); // Adjusted for wide view
        const baseHeight = Math.random() * 8 + 4; // Taller buildings
        const heightMod = 1.5 - (distanceFromCenter * 0.001); // Taller in center
        
        // Wider buildings for header view
        const widthScale = Math.random() * 3 + 2;
        
        dummy.position.set(x, 0, z);
        dummy.scale.set(
          widthScale * type.scaleMod,
          baseHeight * heightMod * type.scaleMod,
          widthScale * 0.7 * type.scaleMod // Less depth for wide view
        );
        
        // Alternate building rotations
        if (col % 4 === 0) {
          dummy.rotation.y = Math.PI / 6;
        }
        
        // Set height after scale
        dummy.position.y = dummy.scale.y / 2;
        
        dummy.updateMatrix();
        buildingMesh.setMatrixAt(i, dummy.matrix);
      }
      
      // Update instance matrix
      buildingMesh.instanceMatrix.needsUpdate = true;
      scene.add(buildingMesh);
      
      // Store texture for cleanup
      (buildingMesh as any).texture = texture;
    });
    
    // Add skyscrapers along the horizon
    const skyscraperGeometry = new THREE.BoxGeometry(1, 1, 1);
    const skyscraperMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a1a,
      emissive: 0x333333,
      emissiveIntensity: 0.3,
      specular: 0x666666,
      transparent: true,
      opacity: 0.9
    });
    
    const skyscraperCount = 15;
    const skyscraperMesh = new THREE.InstancedMesh(skyscraperGeometry, skyscraperMaterial, skyscraperCount);
    
    const skyscraperDummy = new THREE.Object3D();
    
    for (let i = 0; i < skyscraperCount; i++) {
      // Distribute skyscrapers along wider horizontal range
      const x = (i - skyscraperCount / 2) * 25;
      const z = -30 + Math.random() * 10; // Place in background
      
      skyscraperDummy.position.set(x, 0, z);
      
      const height = 25 + Math.random() * 15;
      const width = 3 + Math.random() * 2;
      
      skyscraperDummy.scale.set(width, height, width * 0.8);
      skyscraperDummy.position.y = height / 2;
      
      skyscraperDummy.updateMatrix();
      skyscraperMesh.setMatrixAt(i, skyscraperDummy.matrix);
    }
    
    skyscraperMesh.instanceMatrix.needsUpdate = true;
    scene.add(skyscraperMesh);
    
    // Ground plane - much wider for 5:1 aspect
    const groundGeometry = new THREE.PlaneGeometry(800, 200); // Wider, less deep
    const groundMaterial = new THREE.MeshPhongMaterial({
      color: 0x666666,
      side: THREE.DoubleSide,
      shininess: 10,
      transparent: true,
      opacity: 0.8
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = -50; // Move back to show more foreground
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Add road grid lines - optimized for wide view
    const roadGeometry = new THREE.PlaneGeometry(1, 300); // Longer roads
    const roadMaterial = new THREE.MeshBasicMaterial({
      color: 0x444444,
      transparent: true,
      opacity: 0.7
    });
    
    for (let i = -150; i <= 150; i += spacing * 2) {
      // Horizontal roads (main roads)
      const roadH = new THREE.Mesh(roadGeometry, roadMaterial);
      roadH.rotation.x = -Math.PI / 2;
      roadH.position.set(i * 1.5, 0.01, 0);
      roadH.scale.set(0.3, 1, 1);
      scene.add(roadH);
    }
    
    // Lights
    const ambientLight = new THREE.HemisphereLight(skyColor.getHex(), groundColor.getHex(), 0.7);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, -50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.left = -300; // Wider shadow camera
    directionalLight.shadow.camera.right = 300;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 600;
    scene.add(directionalLight);
    
    // Add distant lights for atmosphere
    const distantLightCount = 20;
    for (let i = 0; i < distantLightCount; i++) {
      const angle = (i / distantLightCount) * Math.PI * 2;
      const radius = 200;
      
      const pointLight = new THREE.PointLight(0xffffaa, 0.5, 100);
      pointLight.position.set(
        Math.cos(angle) * radius,
        20 + Math.random() * 10,
        Math.sin(angle) * radius - 100
      );
      scene.add(pointLight);
    }
    
    // Controls - minimal auto-rotation for header
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 15, -20);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.02; // Slower rotation for header
    
    // Handle window resize
    const handleResize = () => {
      if (!mount) return;
      
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;
      
      // Animate fog color
      const fogColor = skyColor.clone().lerp(
        new THREE.Color(0xd0dee7), 
        Math.sin(time * 0.05) * 0.1 + 0.5
      );
      
      if (scene.fog) {
        scene.fog.color = fogColor;
      }
      
      // Slowly animate camera for dynamic header
      controls.update();
      
      // Subtle camera movement for header
      camera.position.x = 80 + Math.sin(time * 0.02) * 10;
      camera.position.y = 40 + Math.sin(time * 0.03) * 3;
      
      // Animate window lights
      if (time % 5 < 0.1) {
        buildings.forEach(building => {
          if (building.material instanceof THREE.MeshPhongMaterial) {
            building.material.emissiveIntensity = 0.1 + Math.sin(time * 2) * 0.05;
          }
        });
      }
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (rendererRef.current && mount && mount.contains(rendererRef.current.domElement)) {
        mount.removeChild(rendererRef.current.domElement);
      }
      
      renderer.dispose();
      
      buildings.forEach(building => {
        building.geometry.dispose();
        if (building.material instanceof THREE.Material) {
          building.material.dispose();
        }
        if ((building as any).texture) {
          (building as any).texture.dispose();
        }
      });
      
      skyscraperGeometry.dispose();
      skyscraperMaterial.dispose();
      groundGeometry.dispose();
      groundMaterial.dispose();
      if (bgTexture) bgTexture.dispose();
    };
  }, []);

  return (
    <div className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: '5/1' }}>
      <div 
        ref={mountRef} 
        className="absolute inset-0"
      />
      {/* Optional overlay for website header content */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="container mx-auto h-full flex items-center">
          {/* Your website header content can go here */}
          {/* <h1 className="text-white text-4xl font-bold">Your Website Title</h1> */}
        </div>
      </div>
    </div>
  );
};

// Helper function to create gradient background
const createGradientTexture = (topColor: THREE.Color, bottomColor: THREE.Color): THREE.CanvasTexture | null => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; // Wider for 5:1 aspect
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    if (!context) {
      return null;
    }
    
    // Create horizontal gradient for wide aspect
    const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, `#${topColor.clone().multiplyScalar(0.8).getHexString()}`);
    gradient.addColorStop(0.3, `#${topColor.getHexString()}`);
    gradient.addColorStop(0.7, `#${topColor.getHexString()}`);
    gradient.addColorStop(1, `#${bottomColor.getHexString()}`);
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle horizontal gradient from dark to light
    const overlayGradient = context.createLinearGradient(0, 0, canvas.width, 0);
    overlayGradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
    overlayGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    overlayGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    
    context.globalAlpha = 0.3;
    context.fillStyle = overlayGradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    
    return texture;
  } catch (error) {
    console.error('Failed to create gradient texture:', error);
    return null;
  }
};

export default CityScape;
