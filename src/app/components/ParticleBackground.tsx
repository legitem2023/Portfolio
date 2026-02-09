'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

// Simple snowflake textures as base64 to avoid external dependencies
const SNOWFLAKE_BASE64 = {
  snowflake1: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAI0lEQVQ4jWNkYGBg+M8wPMEIBgYGBgaG////MzAwMDAwAAAEXwH5C6QMRgAAAABJRU5ErkJggg==',
  snowflake2: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAJklEQVQ4jWNkYGBg+M8wPMEIBgYGBgaG////MzAwMDAwAAAAqAF5Cy6jgQAAAABJRU5ErkJggg==',
  snowflake3: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIklEQVQ4jWNkYGBg+M8wPMEIBgYGBgaG////MzAwMDAwAAAAggF5C8nEgQAAAABJRU5ErkJggg==',
  snowflake4: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAJUlEQVQ4jWNkYGBg+M8wPMEIBgYGBgaG////MzAwMDAwAAAAwgF5CzDEgQAAAABJRU5ErkJggg==',
  snowflake5: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAKElEQVQ4jWNkYGBg+M8wPMEIBgYGBgaG////MzAwMDAwAAAA+AF5C0NmgQAAAABJRU5ErkJggg=='
};

interface ParticleBackgroundProps {
  intensity?: number;
  backgroundColor?: string;
  particleColor?: string;
  enableMouseInteraction?: boolean;
  particleCount?: number;
  className?: string;
}

// Type for parameters array
type ParticleParameter = [number[], THREE.Texture, number];

const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  intensity = 0.0008,
  backgroundColor = '#000000',
  particleColor = '#ffffff',
  enableMouseInteraction = true,
  particleCount = 5000,
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // Clear any existing canvas
    const existingCanvas = container.querySelector('canvas');
    if (existingCanvas) {
      container.removeChild(existingCanvas);
    }

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Initialize scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 1, 2000);
    camera.position.z = 1000;
    cameraRef.current = camera;

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // Transparent background
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    windowHalfRef.current = { x: width / 2, y: height / 2 };

    // Create particle system
    const createParticles = () => {
      try {
        // Create geometry with vertices
        const geometry = new THREE.BufferGeometry();
        const vertices = [];

        // Create particles
        for (let i = 0; i < particleCount; i++) {
          const x = Math.random() * 2000 - 1000;
          const y = Math.random() * 2000 - 1000;
          const z = Math.random() * 2000 - 1000;
          vertices.push(x, y, z);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        // Create materials with base64 textures
        const textureLoader = new THREE.TextureLoader();
        
        // Try to load base64 textures, fall back to circles
        const textures = [
          textureLoader.load(SNOWFLAKE_BASE64.snowflake1),
          textureLoader.load(SNOWFLAKE_BASE64.snowflake2),
          textureLoader.load(SNOWFLAKE_BASE64.snowflake3),
          textureLoader.load(SNOWFLAKE_BASE64.snowflake4),
          textureLoader.load(SNOWFLAKE_BASE64.snowflake5)
        ];

        // Parameters for particle groups - explicitly typed
        const parameters: ParticleParameter[] = [
          [[1.0, 0.2, 0.5], textures[1], 20],
          [[0.95, 0.1, 0.5], textures[2], 15],
          [[0.90, 0.05, 0.5], textures[0], 10],
          [[0.85, 0, 0.5], textures[4], 8],
          [[0.80, 0, 0.5], textures[3], 5]
        ];

        // Clear previous particles
        particlesRef.current.forEach(particles => {
          scene.remove(particles);
          if (particles.geometry) particles.geometry.dispose();
        });
        materialsRef.current.forEach(material => {
          if (material.map) material.map.dispose();
          material.dispose();
        });
        particlesRef.current = [];
        materialsRef.current = [];

        // Create particle groups
        parameters.forEach((params, i) => {
          const color = params[0];
          const sprite = params[1];
          const size = params[2];

          const material = new THREE.PointsMaterial({
            size: size,
            map: sprite,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
          });
          
          // Convert hex color to HSL
          const hexColor = parseInt(particleColor.replace('#', ''), 16);
          const threeColor = new THREE.Color(hexColor);
          const hsl = { h: 0, s: 0, l: 0 };
          threeColor.getHSL(hsl);
          
          material.color.setHSL(hsl.h, hsl.s * color[1], hsl.l * color[2]);

          const particles = new THREE.Points(geometry, material);
          
          // Random initial rotation
          particles.rotation.x = Math.random() * 6;
          particles.rotation.y = Math.random() * 6;
          particles.rotation.z = Math.random() * 6;

          scene.add(particles);
          particlesRef.current.push(particles);
          materialsRef.current.push(material);
        });

        // Add fog
        const fogColor = new THREE.Color(backgroundColor);
        scene.fog = new THREE.FogExp2(fogColor.getHex(), intensity);

        setIsLoaded(true);
        setError(null);

      } catch (err) {
        console.error('Error creating particles:', err);
        setError('Failed to create particle effect');
        setIsLoaded(false);
      }
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
        const h = ((Date.now() * 0.0001) % 1);
        material.color.setHSL(h, 0.5, 0.5);
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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);

      // Dispose Three.js resources
      if (rendererRef.current) {
        rendererRef.current.dispose();
        const canvas = rendererRef.current.domElement;
        if (canvas && canvas.parentNode === container) {
          container.removeChild(canvas);
        }
        rendererRef.current = null;
      }

      materialsRef.current.forEach(material => {
        if (material.map) material.map.dispose();
        material.dispose();
      });

      particlesRef.current.forEach(particles => {
        if (particles.geometry) particles.geometry.dispose();
        if (sceneRef.current) {
          sceneRef.current.remove(particles);
        }
      });

      particlesRef.current = [];
      materialsRef.current = [];
      
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
    };
  }, [intensity, backgroundColor, particleColor, enableMouseInteraction, particleCount]);

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
        pointerEvents: enableMouseInteraction ? 'auto' : 'none',
        backgroundColor: backgroundColor
      }}
    >
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white bg-red-500/50 p-4 rounded">
            {error}
          </div>
        </div>
      )}
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white">Loading particles...</div>
        </div>
      )}
    </div>
  );
};

export default ParticleBackground;
