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

    // Scene setup with realistic sky
    const scene = new THREE.Scene();
    
    // Simple gradient sky (lightweight)
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const context = canvas.getContext('2d');

    if (context) {
      const gradient = context.createLinearGradient(0, 0, 0, 2);
      gradient.addColorStop(0, '#0B2B4A'); // Deep blue at top
      gradient.addColorStop(0.5, '#3A6D8C'); // Medium blue mid
      gradient.addColorStop(1, '#D4C4A8'); // Warm horizon
      context.fillStyle = gradient;
      context.fillRect(0, 0, 2, 2);
      const gradientTexture = new THREE.CanvasTexture(canvas);
      scene.background = gradientTexture;
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
      powerPreference: "default"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 2.2; // TINAASAN KO PA (from 1.8 to 2.2)
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

    // ============ MALIWANAG NA LIGHTING ============
    
    // Main sun light (TINAASAN KO intensity)
    const sunLight = new THREE.DirectionalLight(0xFFE6AA, 2.5); // from 1.2 to 2.5
    sunLight.position.set(40, 50, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);

    // ============ SUN HELPER ============
    const sunSphereGeometry = new THREE.SphereGeometry(2, 16, 16);
    const sunSphereMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFAA00,
      emissive: 0xFF6600,
      emissiveIntensity: 3.0, // TINAASAN KO glow
      roughness: 0.1,
      metalness: 0.1
    });
    
    const sunSphere = new THREE.Mesh(sunSphereGeometry, sunSphereMaterial);
    sunSphere.position.copy(sunLight.position);
    scene.add(sunSphere);
    
    const sunGlowLight = new THREE.PointLight(0xFFAA00, 2.5, 40); // TINAASAN KO
    sunGlowLight.position.copy(sunLight.position);
    scene.add(sunGlowLight);
    
    const sunRingGeometry = new THREE.TorusGeometry(2.8, 0.15, 16, 32);
    const sunRingMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFDD00,
      emissive: 0xFF8800,
      emissiveIntensity: 2.0,
      transparent: true,
      opacity: 0.8
    });
    const sunRing = new THREE.Mesh(sunRingGeometry, sunRingMaterial);
    sunRing.position.copy(sunLight.position);
    sunRing.rotation.x = Math.PI / 2;
    scene.add(sunRing);

    // Ambient light (TINAASAN KO)
    const ambientLight = new THREE.AmbientLight(0xA0B0C0, 0.9); // from 0.6 to 0.9, mas blue-white
    scene.add(ambientLight);

    // Fill light (TINAASAN KO)
    const fillLight = new THREE.DirectionalLight(0xE0F0FF, 0.8); // from 0.4 to 0.8
    fillLight.position.set(-30, 30, 40);
    scene.add(fillLight);

    // Back light (TINAASAN KO)
    const backLight = new THREE.DirectionalLight(0xFFFFFF, 0.6); // from 0.3 to 0.6
    backLight.position.set(-20, 40, -40);
    scene.add(backLight);

    // ADDITIONAL LIGHTS PARA MAS MALIWANAG
    
    // Front fill light
    const frontLight = new THREE.DirectionalLight(0xFFF0E0, 0.7);
    frontLight.position.set(20, 30, 50);
    scene.add(frontLight);
    
    // Top light para sa general brightness
    const topLight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
    topLight.position.set(0, 80, 0);
    scene.add(topLight);
    
    // Additional point light sa gitna
    const centerLight = new THREE.PointLight(0xFFFFFF, 0.6, 100);
    centerLight.position.set(0, 20, 0);
    scene.add(centerLight);

    // ============ GROUND ============
    
    const groundRadius = 500;
    const groundSegments = 32;
    
    // Ground texture (MEDYO PINAPUTI KO ONTIIII)
    const groundCanvas = document.createElement('canvas');
    groundCanvas.width = 512;
    groundCanvas.height = 512;
    const groundCtx = groundCanvas.getContext('2d');
    
    if (groundCtx) {
      // Base color - pinaputi ko nang bahagya para sumasalamin sa liwanag
      groundCtx.fillStyle = '#5A5045'; // from #4A4035
      groundCtx.fillRect(0, 0, 512, 512);
      
      // Add texture
      const imageData = groundCtx.getImageData(0, 0, 512, 512);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const variation = (Math.random() - 0.5) * 25;
        // TINAASAN KO ang minimum para mas maliwanag
        data[i] = Math.min(220, Math.max(80, data[i] + variation));
        data[i+1] = Math.min(200, Math.max(70, data[i+1] + variation * 0.8));
        data[i+2] = Math.min(180, Math.max(60, data[i+2] + variation * 0.6));
      }
      
      groundCtx.putImageData(imageData, 0, 0);
      
      // Grid lines - pinaputi ko rin
      groundCtx.strokeStyle = '#7A6A55';
      groundCtx.lineWidth = 1;
      
      for (let i = 0; i < 512; i += 64) {
        groundCtx.beginPath();
        groundCtx.moveTo(i, 0);
        groundCtx.lineTo(i, 512);
        groundCtx.strokeStyle = 'rgba(122, 106, 85, 0.15)'; // opacity from 0.1 to 0.15
        groundCtx.stroke();
        
        groundCtx.beginPath();
        groundCtx.moveTo(0, i);
        groundCtx.lineTo(512, i);
        groundCtx.stroke();
      }
    }
    
    const groundTexture = new THREE.CanvasTexture(groundCanvas);
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(6, 6);
    
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      map: groundTexture,
      color: 0x6A6055, // from 0x5A5045
      roughness: 0.8, // from 0.9 (medyo pinakintab ko para sumasalamin)
      metalness: 0.05,
      emissive: new THREE.Color(0x000000)
    });
    
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(groundRadius, groundSegments),
      groundMaterial
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // Edge ring
    const edgeRing = new THREE.Mesh(
      new THREE.TorusGeometry(groundRadius, 1.5, 8, 48),
      new THREE.MeshStandardMaterial({
        color: 0x5A5045, // from 0x4A4035
        emissive: new THREE.Color(0x2A251F),
        transparent: true,
        opacity: 0.3
      })
    );
    edgeRing.rotation.x = Math.PI / 2;
    edgeRing.position.y = 0.05;
    scene.add(edgeRing);

    // Fog - binawasan ko para mas malinaw
    scene.fog = new THREE.FogExp2(0x9AA9B5, 0.0008); // from 0.0012 to 0.0008

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
        
        const scale = 600 / Math.max(size.x, size.y, size.z);
        
        object.scale.set(scale, scale, scale);
        object.rotation.x = -(90 * Math.PI / 180);
        
        object.position.set(
          -center.x * scale,
          0,
          -center.z * scale
        );
        
        // ============ 200+ BUILDING COLORS ============
        
        // Grayscale colors (dark parin pero may konting bright variations)
        const grays = [
          0x303030, 0x343434, 0x383838, 0x3C3C3C, 0x404040, 0x444444, 0x484848, 0x4C4C4C, 0x505050, 0x545454,
          0x585858, 0x5C5C5C, 0x606060, 0x646464, 0x686868, 0x6C6C6C, 0x707070, 0x747474, 0x787878, 0x7C7C7C,
          0x2A2A2A, 0x2E2E2E, 0x323232, 0x363636, 0x3A3A3A, 0x3E3E3E, 0x424242, 0x464646, 0x4A4A4A, 0x4E4E4E,
          // Dagdag ng lighter grays
          0x808080, 0x848484, 0x888888
        ];
        
        // Brown tones
        const browns = [
          0x3A2E25, 0x3E3229, 0x42362D, 0x463A31, 0x4A3E35, 0x4E4239, 0x52463D, 0x564A41, 0x5A4E45, 0x5E5249,
          0x4A382A, 0x4E3C2E, 0x524032, 0x564436, 0x58483A, 0x5C4C3E, 0x605042, 0x645446, 0x68584A, 0x6C5C4E,
          0x3A2C1E, 0x3E3022, 0x423426, 0x46382A, 0x4A3C2E, 0x4E4032, 0x524436, 0x56483A, 0x5A4C3E, 0x5E5042
        ];
        
        // Red brick / terracotta
        const reds = [
          0x3A2620, 0x3E2A24, 0x422E28, 0x46322C, 0x4A3630, 0x4E3A34, 0x523E38, 0x56423C, 0x5A4640, 0x5E4A44,
          0x442E24, 0x483228, 0x4C362C, 0x503A30, 0x543E34, 0x584238, 0x5A463C, 0x5E4A40, 0x624E44, 0x665248
        ];
        
        // Blue-grays
        const bluegrays = [
          0x2A3A40, 0x2E3E44, 0x324248, 0x36464C, 0x3A4A50, 0x3E4E54, 0x425258, 0x46565C, 0x4A5A60, 0x4E5E64,
          0x2A3440, 0x2E3844, 0x323C48, 0x36404C, 0x3A4450, 0x3E4854, 0x424C58, 0x46505C, 0x4A5460, 0x4E5864
        ];
        
        // Green-grays
        const greens = [
          0x2A3A30, 0x2E3E34, 0x324238, 0x36463C, 0x3A4A40, 0x3E4E44, 0x425248, 0x46564C, 0x4A5A50, 0x4E5E54,
          0x2A342C, 0x2E3830, 0x323C34, 0x364038, 0x3A443C, 0x3E4840, 0x424C44, 0x465048, 0x4A544C, 0x4E5850
        ];
        
        // Purplish grays
        const purples = [
          0x302A30, 0x342E34, 0x383238, 0x3C363C, 0x403A40, 0x443E44, 0x484248, 0x4C464C, 0x504A50, 0x544E54,
          0x2A242A, 0x2E282E, 0x322C32, 0x363036, 0x3A343A, 0x3E383E, 0x423C42, 0x464046, 0x4A444A, 0x4E484E
        ];
        
        // Yellow ochre / sandstone
        const yellows = [
          0x3A3420, 0x3E3824, 0x423C28, 0x46402C, 0x4A4430, 0x4E4834, 0x524C38, 0x56503C, 0x5A5440, 0x5E5844,
          0x3A301A, 0x3E341E, 0x423822, 0x463C26, 0x4A402A, 0x4E442E, 0x524832, 0x564C36, 0x5A503A, 0x5E543E
        ];
        
        // Combine all colors
        const buildingColors = [
          ...grays,
          ...browns,
          ...reds,
          ...bluegrays,
          ...greens,
          ...purples,
          ...yellows
        ];
        
        // Additional variations
        for (let i = 0; i < 30; i++) {
          const r = Math.floor(40 + Math.random() * 70); // from 30-80 to 40-110 (mas bright)
          const g = Math.floor(35 + Math.random() * 65);
          const b = Math.floor(30 + Math.random() * 60);
          const color = (r << 16) | (g << 8) | b;
          buildingColors.push(color);
        }
        
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            const randomColor = buildingColors[Math.floor(Math.random() * buildingColors.length)];
            const roughness = 0.5 + Math.random() * 0.3; // from 0.6-0.9 to 0.5-0.8 (mas makintab konti)
            const metalness = Math.random() * 0.2;
            
            // Bawasan ang emissive para hindi lumiwanag ang buildings mismo
            const hasEmissive = Math.random() > 0.8; // from 0.7 to 0.8 (mas konti ang may emissive)
            
            child.material = new THREE.MeshStandardMaterial({
              color: randomColor,
              roughness: roughness,
              metalness: metalness,
              emissive: hasEmissive ? new THREE.Color(0x111111) : new THREE.Color(0x000000),
              emissiveIntensity: hasEmissive ? 0.05 : 0, // from 0.1 to 0.05
              flatShading: false
            });
          }
        });

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
      
      // I-rotate ang sun ring
      if (sunRing) {
        sunRing.rotation.y += 0.005;
        sunRing.rotation.x = Math.PI / 2 + Math.sin(Date.now() * 0.001) * 0.1;
      }
      
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
    backgroundColor: '#0B2B4A',
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
