'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

// Snowflake texture paths - you'll need to add these to your public folder
const SNOWFLAKE_TEXTURES = [
  '/textures/sprites/snowflake1.png',
  '/textures/sprites/snowflake2.png',
  '/textures/sprites/snowflake3.png',
  '/textures/sprites/snowflake4.png',
  '/textures/sprites/snowflake5.png'
];

interface ParticleBackgroundProps {
  intensity?: number;
  color?: string;
  enableMouseInteraction?: boolean;
  className?: string;
}

const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  intensity = 0.0008,
  color = '#000000',
  enableMouseInteraction = true,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const particlesRef = useRef<THREE.Points[]>([]);
  const materialsRef = useRef<THREE.PointsMaterial[]>([]);
  const animationRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const windowHalfRef = useRef({ x: 0, y: 0 });

  const [isLoaded, setIsLoaded] = useState(false);
  const parametersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Initialize Three.js
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(parseInt(color.replace('#', '0x'), 16), intensity);

    const camera = new THREE.PerspectiveCamera(75, width / height, 1, 2000);
    camera.position.z = 1000;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // Transparent background
    
    // Set SRGB encoding for better color accuracy
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.appendChild(renderer.domElement);

    // Store references
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    windowHalfRef.current = { x: width / 2, y: height / 2 };

    // Create particle system
    const createParticles = async () => {
      const geometry = new THREE.BufferGeometry();
      const vertices = [];

      // Create 10,000 particles
      for (let i = 0; i < 10000; i++) {
        const x = Math.random() * 2000 - 1000;
        const y = Math.random() * 2000 - 1000;
        const z = Math.random() * 2000 - 1000;
        vertices.push(x, y, z);
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

      // Load textures
      const textureLoader = new THREE.TextureLoader();
      const textures = await Promise.all(
        SNOWFLAKE_TEXTURES.map(path => 
          new Promise<THREE.Texture>((resolve) => {
            textureLoader.load(path, (texture) => {
              texture.colorSpace = THREE.SRGBColorSpace;
              resolve(texture);
            });
          })
        )
      );

      // Parameters for different particle groups
      parametersRef.current = [
        [[1.0, 0.2, 0.5], textures[1], 20],
        [[0.95, 0.1, 0.5], textures[2], 15],
        [[0.90, 0.05, 0.5], textures[0], 10],
        [[0.85, 0, 0.5], textures[4], 8],
        [[0.80, 0, 0.5], textures[3], 5]
      ];

      // Create materials and particles
      parametersRef.current.forEach((params, i) => {
        const color = params[0];
        const sprite = params[1];
        const size = params[2];

        const material = new THREE.PointsMaterial({
          size: size,
          map: sprite,
          blending: THREE.AdditiveBlending,
          depthTest: false,
          transparent: true,
          opacity: 0.8
        });
        
        material.color.setHSL(color[0], color[1], color[2]);
        material.toneMapped = false; // Disable tone mapping for better control

        const particles = new THREE.Points(geometry, material);
        
        // Random initial rotation
        particles.rotation.x = Math.random() * 6;
        particles.rotation.y = Math.random() * 6;
        particles.rotation.z = Math.random() * 6;

        scene.add(particles);
        particlesRef.current.push(particles);
        materialsRef.current.push(material);
      });

      setIsLoaded(true);
    };

    createParticles();

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      render();
    };

    const render = () => {
      if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;

      const time = Date.now() * 0.00005;

      // Smooth camera movement based on mouse position
      if (enableMouseInteraction) {
        camera.position.x += (mouseRef.current.x - camera.position.x) * 0.05;
        camera.position.y += (-mouseRef.current.y - camera.position.y) * 0.05;
      }

      camera.lookAt(sceneRef.current.position);

      // Rotate particle groups
      particlesRef.current.forEach((object, i) => {
        object.rotation.y = time * (i < 4 ? i + 1 : -(i + 1));
      });

      // Update colors over time
      materialsRef.current.forEach((material, i) => {
        if (parametersRef.current[i]) {
          const color = parametersRef.current[i][0];
          const h = (360 * (color[0] + time) % 360) / 360;
          material.color.setHSL(h, color[1], color[2]);
        }
      });

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    // Start animation
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      windowHalfRef.current = { x: width / 2, y: height / 2 };

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    // Handle mouse movement
    const handleMouseMove = (event: MouseEvent) => {
      if (!enableMouseInteraction) return;

      mouseRef.current = {
        x: (event.clientX - windowHalfRef.current.x) * 0.5,
        y: (event.clientY - windowHalfRef.current.y) * 0.5
      };
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!enableMouseInteraction || !event.touches.length) return;

      const touch = event.touches[0];
      mouseRef.current = {
        x: (touch.clientX - windowHalfRef.current.x) * 0.5,
        y: (touch.clientY - windowHalfRef.current.y) * 0.5
      };
    };

    window.addEventListener('resize', handleResize);
    if (enableMouseInteraction) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove);
    }

    // Initial render
    render();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);

      // Dispose Three.js resources
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
      }

      materialsRef.current.forEach(material => {
        if (material.map) material.map.dispose();
        material.dispose();
      });

      particlesRef.current.forEach(particles => {
        if (particles.geometry) particles.geometry.dispose();
        scene.remove(particles);
      });

      if (sceneRef.current) {
        sceneRef.current.clear();
      }
    };
  }, [intensity, color, enableMouseInteraction]);

  return (
    <div 
      ref={containerRef} 
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: enableMouseInteraction ? 'auto' : 'none'
      }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <div className="text-white">Loading particles...</div>
        </div>
      )}
    </div>
  );
};

export default ParticleBackground;
