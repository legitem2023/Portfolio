'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Note: For Three.js TSL features, you'd need to use WebGPU renderer
// This is a WebGL version that works in Next.js with Three.js

const CityScape = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    
    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      1,
      600
    );
    camera.position.set(30, 15, 30);
    
    // Renderer (WebGL version for broader compatibility)
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    
    // Custom fog effect (simulated without TSL)
    const skyColor = new THREE.Color(0xf0f5f5);
    const groundColor = new THREE.Color(0xd0dee7);
    
    // Create fog with gradient
    const fog = new THREE.Fog(skyColor, 1, 500);
    scene.fog = fog;
    
    // Background gradient
    const bgTexture = createGradientTexture(skyColor, groundColor);
    scene.background = bgTexture;
    
    // Buildings
    const buildingGeometry = new THREE.BoxGeometry(1, 1, 1);
    const buildingMaterial = new THREE.MeshPhongMaterial({
      color: 0x333333,
      specular: 0x111111,
      shininess: 30
    });
    
    const buildingCount = 4000;
    const buildingMesh = new THREE.InstancedMesh(buildingGeometry, buildingMaterial, buildingCount);
    scene.add(buildingMesh);
    
    const dummy = new THREE.Object3D();
    const center = new THREE.Vector3();
    
    // Randomize building positions and sizes
    for (let i = 0; i < buildingCount; i++) {
      const scaleY = Math.random() * 7 + 0.5;
      
      dummy.position.x = Math.random() * 600 - 300;
      dummy.position.z = Math.random() * 600 - 300;
      
      const distance = Math.max(dummy.position.distanceTo(center) * 0.012, 1);
      dummy.position.y = 0.5 * scaleY * distance;
      
      // Create some variation in building widths
      const widthScale = Math.random() * 3 + 0.5;
      dummy.scale.x = widthScale;
      dummy.scale.z = widthScale;
      dummy.scale.y = scaleY * distance;
      
      // Add some rotation variation for more organic feel
      dummy.rotation.y = Math.random() * Math.PI * 2;
      
      dummy.updateMatrix();
      buildingMesh.setMatrixAt(i, dummy.matrix);
    }
    
    // Add windows to buildings using a different approach
    // We'll create emissive materials for some buildings to simulate lights
    const lightBuildingCount = Math.floor(buildingCount * 0.3);
    const lightBuildings = new THREE.InstancedMesh(
      buildingGeometry,
      new THREE.MeshPhongMaterial({
        color: 0xffaa33,
        emissive: 0xffaa33,
        emissiveIntensity: 0.5
      }),
      lightBuildingCount
    );
    
    for (let i = 0; i < lightBuildingCount; i++) {
      const scaleY = Math.random() * 7 + 0.5;
      
      dummy.position.x = Math.random() * 600 - 300;
      dummy.position.z = Math.random() * 600 - 300;
      
      const distance = Math.max(dummy.position.distanceTo(center) * 0.012, 1);
      dummy.position.y = 0.5 * scaleY * distance;
      
      const widthScale = Math.random() * 2 + 0.5;
      dummy.scale.x = widthScale;
      dummy.scale.z = widthScale;
      dummy.scale.y = scaleY * distance;
      
      // Make light buildings shorter for variety
      dummy.scale.y *= 0.7;
      
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.updateMatrix();
      lightBuildings.setMatrixAt(i, dummy.matrix);
    }
    scene.add(lightBuildings);
    
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshPhongMaterial({
      color: 0x999999,
      side: THREE.DoubleSide
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.scale.multiplyScalar(3);
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Lights
    const ambientLight = new THREE.HemisphereLight(skyColor.getHex(), groundColor.getHex(), 0.5);
    scene.add(ambientLight);
    
    // Directional light for shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);
    
    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 2, 0);
    controls.minDistance = 7;
    controls.maxDistance = 100;
    controls.maxPolarAngle = Math.PI / 2;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.1;
    
    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      // Update building materials for a "breathing" fog effect
      const time = Date.now() * 0.001;
      const fogColor = skyColor.clone().lerp(new THREE.Color(0xd0dee7), Math.sin(time * 0.2) * 0.2 + 0.5);
      scene.fog.color = fogColor;
      
      // Auto-rotate
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose of resources
      renderer.dispose();
      buildingGeometry.dispose();
      buildingMaterial.dispose();
      groundGeometry.dispose();
      groundMaterial.dispose();
      bgTexture.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-black">
      <div 
        ref={mountRef} 
        className="absolute inset-0"
      />
      
      {/* Info panel */}
      <div className="absolute top-4 left-4 text-white font-sans pointer-events-none">
        <div className="flex items-center space-x-2 mb-2">
          <a 
            href="https://threejs.org/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 pointer-events-auto"
          >
            three.js
          </a>
          <span className="text-gray-400">Cityscape with Fog</span>
        </div>
        <small className="text-gray-400 block">
          A procedural city with atmospheric fog effects
        </small>
      </div>
      
      {/* Instructions */}
      <div className="absolute bottom-4 left-4 text-white text-sm text-gray-300 pointer-events-none">
        <div>Drag to rotate • Scroll to zoom</div>
      </div>
    </div>
  );
};

// Helper function to create gradient background
const createGradientTexture = (topColor: THREE.Color, bottomColor: THREE.Color): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  
  if (!context) {
    return new THREE.Texture();
  }
  
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, `#${topColor.getHexString()}`);
  gradient.addColorStop(1, `#${bottomColor.getHexString()}`);
  
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  
  return texture;
};

export default CityScape;
