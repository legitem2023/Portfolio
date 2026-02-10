'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const CityScape = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationIdRef = useRef<number>(0);
  const buildingsRef = useRef<THREE.InstancedMesh | null>(null);

  const getTimeOfDay = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return hours + minutes / 60;
  };

  const getSkyColor = (time: number) => {
    // 6AM to 6PM: Sky blue gradient
    if (time >= 6 && time <= 18) {
      const progress = (time - 6) / 12; // 0 at 6AM, 1 at 6PM
      // Sky blue gradient from light to medium blue
      const r = 135 + 40 * (1 - progress);
      const g = 206 + 49 * (1 - progress);
      const b = 235;
      return new THREE.Color(r / 255, g / 255, b / 255);
    } 
    // 6PM to 6AM: Dark indigo to light gradient
    else {
      let progress;
      if (time > 18) {
        progress = (time - 18) / 12; // 0 at 6PM, 1 at 6AM
      } else {
        progress = (time + 6) / 12; // For hours 0-6AM
      }
      
      // Dark indigo to lighter gradient
      const r = 25 + 30 * progress;
      const g = 0 + 20 * progress;
      const b = 50 + 100 * progress;
      return new THREE.Color(r / 255, g / 255, b / 255);
    }
  };

  const getAmbientLightColor = (time: number) => {
    // Brighter during day, darker at night
    if (time >= 6 && time <= 18) {
      const progress = (time - 6) / 12;
      const intensity = 0.5 + 0.3 * Math.sin(progress * Math.PI);
      return new THREE.Color(intensity, intensity, intensity);
    } else {
      return new THREE.Color(0.1, 0.1, 0.15);
    }
  };

  const init = () => {
    if (!canvasRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      600
    );
    camera.position.set(30, 15, 30);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    canvasRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 2, 0);
    controls.minDistance = 7;
    controls.maxDistance = 100;
    controls.maxPolarAngle = Math.PI / 2;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.1;
    controlsRef.current = controls;

    // Create buildings
    const createBuildings = () => {
      const buildingGeometry = new THREE.BoxGeometry(1, 1, 1);
      const buildingMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333,
        shininess: 30,
      });

      const buildingCount = 4000;
      const buildingMesh = new THREE.InstancedMesh(
        buildingGeometry,
        buildingMaterial,
        buildingCount
      );
      buildingMesh.castShadow = true;
      buildingMesh.receiveShadow = true;
      scene.add(buildingMesh);
      buildingsRef.current = buildingMesh;

      const dummy = new THREE.Object3D();
      const center = new THREE.Vector3();

      for (let i = 0; i < buildingCount; i++) {
        const scaleY = Math.random() * 7 + 0.5;

        dummy.position.x = Math.random() * 600 - 300;
        dummy.position.z = Math.random() * 600 - 300;

        const distance = Math.max(dummy.position.distanceTo(center) * 0.012, 1);
        dummy.position.y = 0.5 * scaleY * distance;

        dummy.scale.x = dummy.scale.z = Math.random() * 3 + 0.5;
        dummy.scale.y = scaleY * distance;

        dummy.updateMatrix();
        buildingMesh.setMatrixAt(i, dummy.matrix);
      }

      // Update windows based on time
      updateBuildingWindows();
    };

    // Update building window lights based on time of day
    const updateBuildingWindows = () => {
      const time = getTimeOfDay();
      const buildingMesh = buildingsRef.current;
      if (!buildingMesh) return;

      const colors = [];
      const color = new THREE.Color();
      
      for (let i = 0; i < buildingMesh.count; i++) {
        const isWindowLit = Math.random() > 0.7; // 30% of windows are lit
        
        if (time >= 6 && time <= 18) {
          // Daytime: fewer lit windows
          if (isWindowLit && Math.random() > 0.8) {
            color.setHex(0xffdd99); // Warm yellow for daytime lights
          } else {
            color.setHex(0x666666); // Dark gray for unlit windows
          }
        } else {
          // Nighttime: more lit windows
          if (isWindowLit || Math.random() > 0.6) {
            // Variety of warm window colors at night
            const colorChoice = Math.random();
            if (colorChoice < 0.33) {
              color.setHex(0xffaa33); // Warm orange
            } else if (colorChoice < 0.66) {
              color.setHex(0xffdd99); // Soft yellow
            } else {
              color.setHex(0x99ccff); // Cool blue
            }
          } else {
            color.setHex(0x333333); // Very dark for unlit windows
          }
        }
        
        colors.push(color.r, color.g, color.b);
      }

      // Update instance colors
      const colorAttribute = new THREE.InstancedBufferAttribute(
        new Float32Array(colors),
        3
      );
      buildingMesh.geometry.setAttribute('instanceColor', colorAttribute);
      
      // Update material to use instance colors
      const material = buildingMesh.material as THREE.MeshPhongMaterial;
      material.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader.replace(
          '#include <common>',
          `
            #include <common>
            attribute vec3 instanceColor;
            varying vec3 vInstanceColor;
          `
        );
        
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          `
            #include <begin_vertex>
            vInstanceColor = instanceColor;
          `
        );
        
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <common>',
          `
            #include <common>
            varying vec3 vInstanceColor;
          `
        );
        
        shader.fragmentShader = shader.fragmentShader.replace(
          'vec4 diffuseColor = vec4( diffuse, opacity );',
          `
            vec3 finalColor = diffuse * vInstanceColor;
            vec4 diffuseColor = vec4( finalColor, opacity );
          `
        );
      };
      material.needsUpdate = true;
    };

    // Ground
    const createGround = () => {
      const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
      const groundMaterial = new THREE.MeshPhongMaterial({
        color: 0x222222,
        side: THREE.DoubleSide,
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.scale.multiplyScalar(3);
      ground.receiveShadow = true;
      scene.add(ground);

      // Add subtle grid texture to ground
      const gridGeometry = new THREE.PlaneGeometry(600, 600, 60, 60);
      const gridMaterial = new THREE.LineBasicMaterial({
        color: 0x333333,
        transparent: true,
        opacity: 0.1,
      });
      const grid = new THREE.LineSegments(
        new THREE.WireframeGeometry(gridGeometry),
        gridMaterial
      );
      grid.rotation.x = -Math.PI / 2;
      grid.position.y = 0.01;
      scene.add(grid);
    };

    // Lighting
    const updateLighting = () => {
      const time = getTimeOfDay();
      const skyColor = getSkyColor(time);
      const ambientColor = getAmbientLightColor(time);

      // Clear existing lights
      scene.children = scene.children.filter(
        (child) => !(child instanceof THREE.Light)
      );

      // Set scene background
      scene.background = skyColor;

      // Hemisphere light for ambient illumination
      const hemisphereLight = new THREE.HemisphereLight(
        0xffffff,
        0x444444,
        time >= 6 && time <= 18 ? 0.6 : 0.3
      );
      scene.add(hemisphereLight);

      // Main directional light (sun/moon)
      const mainLight = new THREE.DirectionalLight(
        time >= 6 && time <= 18 ? 0xffffff : 0x4466aa,
        time >= 6 && time <= 18 ? 1.0 : 0.5
      );
      mainLight.position.set(50, 100, 50);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.width = 2048;
      mainLight.shadow.mapSize.height = 2048;
      mainLight.shadow.camera.near = 0.5;
      mainLight.shadow.camera.far = 500;
      mainLight.shadow.camera.left = -100;
      mainLight.shadow.camera.right = 100;
      mainLight.shadow.camera.top = 100;
      mainLight.shadow.camera.bottom = -100;
      scene.add(mainLight);

      // Add some point lights for building windows at night
      if (time < 6 || time > 18) {
        for (let i = 0; i < 20; i++) {
          const windowLight = new THREE.PointLight(0xffaa33, 0.5, 50);
          windowLight.position.set(
            Math.random() * 400 - 200,
            Math.random() * 50 + 5,
            Math.random() * 400 - 200
          );
          scene.add(windowLight);
        }
      }
    };

    // Initialize scene
    createBuildings();
    createGround();
    updateLighting();

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const time = getTimeOfDay();
      
      // Update sky and lighting every frame for smooth transitions
      updateLighting();
      updateBuildingWindows();

      // Slowly rotate scene for dynamic feel
      if (sceneRef.current) {
        sceneRef.current.rotation.y += 0.0001;
      }

      controlsRef.current?.update();
      rendererRef.current?.render(scene, camera);
    };

    // Handle window resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;

      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationIdRef.current);
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.domElement.remove();
      }
      
      controlsRef.current?.dispose();
    };
  };

  useEffect(() => {
    const cleanup = init();
    return cleanup;
  }, []);

  return (
    <div className="relative w-full h-screen">
      <div 
        ref={canvasRef} 
        className="absolute inset-0"
      />
      <div className="absolute bottom-4 left-4 text-white bg-black/50 p-3 rounded-lg">
        <div className="text-sm font-mono">
          Time-based Sky: 
          <span className="ml-2">
            {(() => {
              const now = new Date();
              const hours = now.getHours();
              const minutes = now.getMinutes().toString().padStart(2, '0');
              return `${hours}:${minutes}`;
            })()}
          </span>
        </div>
        <div className="text-xs mt-1 opacity-75">
          6AM-6PM: Sky Blue • 6PM-6AM: Dark Indigo Gradient
        </div>
      </div>
    </div>
  );
};

export default CityScape;
