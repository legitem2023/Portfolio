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
    
    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      1,
      600
    );
    camera.position.set(50, 30, 50);
    
    // Renderer with optimized pixel ratio 5:1
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: 'high-performance'
    });
    rendererRef.current = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Reduced from default
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    
    // Custom fog effect
    const skyColor = new THREE.Color(0xf0f5f5);
    const groundColor = new THREE.Color(0xd0dee7);
    
    // Create fog
    const fog = new THREE.Fog(skyColor, 1, 400);
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
        ctx.fillStyle = '#ffaa33';
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
      windowTexture.repeat.set(4, 8); // More windows on taller buildings
      
      const buildingMaterial = new THREE.MeshPhongMaterial({
        map: windowTexture,
        color: 0x333333,
        specular: 0x111111,
        shininess: 30,
        emissive: 0x222222,
        emissiveIntensity: 0.1
      });
      
      return { geometry, material: buildingMaterial, texture: windowTexture };
    };
    
    // Create different building types
    const buildingTypes = [
      { color: 0x333333, windowColor: 0xffaa33, scaleMod: 1.0 },
      { color: 0x2a2a2a, windowColor: 0x88ccff, scaleMod: 0.8 },
      { color: 0x444444, windowColor: 0xff8888, scaleMod: 1.2 },
    ];
    
    const buildingCount = 2000; // Half of original 4000
    const gridSize = 50;
    const spacing = 12;
    
    // Create organized rows of buildings
    const buildings: THREE.InstancedMesh[] = [];
    
    buildingTypes.forEach((type, typeIndex) => {
      const { geometry, material, texture } = createBuildingGeometry();
      const buildingMesh = new THREE.InstancedMesh(geometry, material, buildingCount / 3);
      buildings.push(buildingMesh);
      
      const dummy = new THREE.Object3D();
      const center = new THREE.Vector3();
      
      // Calculate grid positions
      const rows = Math.floor(Math.sqrt(buildingCount / 3));
      const cols = rows;
      
      for (let i = 0; i < buildingMesh.count; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        // Position buildings in organized grid with slight randomness
        const x = (col - cols / 2) * spacing + (Math.random() * 4 - 2);
        const z = (row - rows / 2) * spacing + (Math.random() * 4 - 2);
        
        // Height variation based on position from center
        const distanceFromCenter = Math.sqrt(x * x + z * z);
        const baseHeight = Math.random() * 6 + 3;
        const heightMod = 1 + (distanceFromCenter * 0.002);
        
        // Vary building widths slightly
        const widthScale = Math.random() * 2 + 1.5;
        
        dummy.position.set(x, 0, z);
        dummy.scale.set(
          widthScale * type.scaleMod,
          baseHeight * heightMod * type.scaleMod,
          widthScale * type.scaleMod
        );
        
        // Alternate building rotations for visual variety
        if (col % 3 === 0) {
          dummy.rotation.y = Math.PI / 4;
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
    
    // Add some skyscrapers in the center
    const skyscraperGeometry = new THREE.BoxGeometry(1, 1, 1);
    const skyscraperMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a1a,
      emissive: 0x333333,
      emissiveIntensity: 0.2,
      specular: 0x666666
    });
    
    const skyscraperCount = 20;
    const skyscraperMesh = new THREE.InstancedMesh(skyscraperGeometry, skyscraperMaterial, skyscraperCount);
    
    const skyscraperDummy = new THREE.Object3D();
    const centerRingRadius = 30;
    
    for (let i = 0; i < skyscraperCount; i++) {
      const angle = (i / skyscraperCount) * Math.PI * 2;
      const radius = centerRingRadius + Math.random() * 10 - 5;
      
      skyscraperDummy.position.set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );
      
      const height = 15 + Math.random() * 10;
      const width = 2 + Math.random() * 1;
      
      skyscraperDummy.scale.set(width, height, width);
      skyscraperDummy.position.y = height / 2;
      
      skyscraperDummy.rotation.y = angle;
      skyscraperDummy.updateMatrix();
      skyscraperMesh.setMatrixAt(i, skyscraperDummy.matrix);
    }
    
    skyscraperMesh.instanceMatrix.needsUpdate = true;
    scene.add(skyscraperMesh);
    
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(400, 400);
    const groundMaterial = new THREE.MeshPhongMaterial({
      color: 0x666666,
      side: THREE.DoubleSide,
      shininess: 10
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.scale.multiplyScalar(1.5);
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Add road grid lines
    const roadGeometry = new THREE.PlaneGeometry(1, 400);
    const roadMaterial = new THREE.MeshBasicMaterial({
      color: 0x444444
    });
    
    for (let i = -gridSize * spacing / 2; i <= gridSize * spacing / 2; i += spacing) {
      // Horizontal roads
      const roadH = new THREE.Mesh(roadGeometry, roadMaterial);
      roadH.rotation.x = -Math.PI / 2;
      roadH.position.set(i, 0.01, 0);
      roadH.scale.set(0.5, 1, 1);
      scene.add(roadH);
      
      // Vertical roads
      const roadV = new THREE.Mesh(roadGeometry, roadMaterial);
      roadV.rotation.x = -Math.PI / 2;
      roadV.rotation.z = Math.PI / 2;
      roadV.position.set(0, 0.01, i);
      roadV.scale.set(0.5, 1, 1);
      scene.add(roadV);
    }
    
    // Lights
    const ambientLight = new THREE.HemisphereLight(skyColor.getHex(), groundColor.getHex(), 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(100, 150, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024; // Reduced for performance
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);
    
    // Add street lights
    const streetLightGeometry = new THREE.CylinderGeometry(0.1, 0.2, 2, 8);
    const streetLightMaterial = new THREE.MeshPhongMaterial({
      color: 0xaaaaaa,
      emissive: 0xffffaa,
      emissiveIntensity: 0.5
    });
    
    const streetLightCount = 40;
    for (let i = 0; i < streetLightCount; i++) {
      const angle = (i / streetLightCount) * Math.PI * 2;
      const radius = 100;
      
      const light = new THREE.Mesh(streetLightGeometry, streetLightMaterial);
      light.position.set(
        Math.cos(angle) * radius,
        1,
        Math.sin(angle) * radius
      );
      scene.add(light);
      
      // Add point light at top
      const pointLight = new THREE.PointLight(0xffffaa, 0.8, 30);
      pointLight.position.set(light.position.x, 3, light.position.z);
      scene.add(pointLight);
    }
    
    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 10, 0);
    controls.minDistance = 10;
    controls.maxDistance = 200;
    controls.maxPolarAngle = Math.PI / 2;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.05;
    
    // Handle window resize
    const handleResize = () => {
      if (!mount) return;
      
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation for window lights
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;
      
      // Animate fog color
      const fogColor = skyColor.clone().lerp(
        new THREE.Color(0xd0dee7), 
        Math.sin(time * 0.1) * 0.1 + 0.5
      );
      
      if (scene.fog) {
        scene.fog.color = fogColor;
      }
      
      // Slowly rotate camera around city
      controls.update();
      
      // Animate window lights (simulate lights turning on/off)
      if (time % 10 < 0.1) { // Every 10 seconds, update some windows
        buildings.forEach(building => {
          if (building.material instanceof THREE.MeshPhongMaterial && building.material.map) {
            // This would require updating the window texture canvas
            // For performance, we'll just update the emissive intensity
            building.material.emissiveIntensity = 0.1 + Math.sin(time) * 0.05;
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
      
      // Dispose of all resources
      renderer.dispose();
      
      // Dispose buildings and their textures
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
      streetLightGeometry.dispose();
      streetLightMaterial.dispose();
      if (bgTexture) bgTexture.dispose();
    };
  }, []);

  return (
    <div className="ratio-[5/1] relative w-full h-screen bg-black">
      <div 
        ref={mountRef} 
        className="absolute inset-0"
      />  
    </div>
  );
};

// Helper function to create gradient background
const createGradientTexture = (topColor: THREE.Color, bottomColor: THREE.Color): THREE.CanvasTexture | null => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    if (!context) {
      return null;
    }
    
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, `#${topColor.getHexString()}`);
    gradient.addColorStop(0.5, `#${topColor.clone().multiplyScalar(0.9).getHexString()}`);
    gradient.addColorStop(1, `#${bottomColor.getHexString()}`);
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some subtle noise for atmosphere
    context.globalAlpha = 0.02;
    for (let i = 0; i < canvas.width * canvas.height * 0.01; i++) {
      const x = Math.floor(Math.random() * canvas.width);
      const y = Math.floor(Math.random() * canvas.height);
      context.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
      context.fillRect(x, y, 1, 1);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
  } catch (error) {
    console.error('Failed to create gradient texture:', error);
    return null;
  }
};

export default CityScape;
