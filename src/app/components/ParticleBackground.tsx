// components/MinimalParticles.tsx
'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ParticleBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a); // Dark blue background
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 500;
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    
    // Create snowflake-like particles with different shapes
    const createSnowflakeGeometry = (type: number) => {
      const geometry = new THREE.BufferGeometry();
      const vertices = [];
      const colors = [];
      
      // Different neon colors for winter theme
      const neonColors = [
        new THREE.Color(0x00ffff), // Cyan
        new THREE.Color(0xff00ff), // Magenta
        new THREE.Color(0x00ff00), // Green
        new THREE.Color(0xffff00), // Yellow
        new THREE.Color(0xff1493), // Deep Pink
        new THREE.Color(0x00ced1), // Dark Turquoise
        new THREE.Color(0x9370db), // Medium Purple
      ];
      
      for (let i = 0; i < 150; i++) {
        const x = Math.random() * 1000 - 500;
        const y = Math.random() * 1000 - 500;
        const z = Math.random() * 1000 - 500;
        
        // Different snowflake patterns
        if (type === 0) {
          // Hexagonal pattern
          for (let j = 0; j < 6; j++) {
            const angle = (Math.PI * 2 * j) / 6;
            const radius = 2 + Math.random() * 3;
            vertices.push(
              x + Math.cos(angle) * radius,
              y + Math.sin(angle) * radius,
              z
            );
          }
        } else if (type === 1) {
          // Star pattern
          for (let j = 0; j < 8; j++) {
            const angle = (Math.PI * 2 * j) / 8;
            const radius = j % 2 === 0 ? 4 : 2;
            vertices.push(
              x + Math.cos(angle) * radius,
              y + Math.sin(angle) * radius,
              z
            );
          }
        } else {
          // Simple cross
          vertices.push(x - 3, y, z);
          vertices.push(x + 3, y, z);
          vertices.push(x, y - 3, z);
          vertices.push(x, y + 3, z);
        }
        
        // Assign random neon color
        const color = neonColors[Math.floor(Math.random() * neonColors.length)];
        for (let j = 0; j < (type === 0 ? 6 : type === 1 ? 8 : 4); j++) {
          colors.push(color.r, color.g, color.b);
        }
      }
      
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      return geometry;
    };
    
    // Create multiple particle systems with different snowflake types
    const particles = [];
    const materials = [];
    
    for (let i = 0; i < 3; i++) {
      const geometry = createSnowflakeGeometry(i);
      
      const material = new THREE.PointsMaterial({
        size: i === 0 ? 3 : i === 1 ? 4 : 2,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        map: createTexture(i)
      });
      
      const particleSystem = new THREE.Points(geometry, material);
      scene.add(particleSystem);
      particles.push(particleSystem);
      materials.push(material);
    }
    
    // Create texture function for snowflakes
    function createTexture(type: number) {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const context = canvas.getContext('2d')!;
      
      // Clear canvas
      context.clearRect(0, 0, 64, 64);
      
      // Create different snowflake textures
      context.beginPath();
      context.fillStyle = 'white';
      
      if (type === 0) {
        // Hexagon snowflake
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI * 2 * i) / 6;
          const x = 32 + Math.cos(angle) * 20;
          const y = 32 + Math.sin(angle) * 20;
          if (i === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.closePath();
        context.fill();
      } else if (type === 1) {
        // Star snowflake
        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          const x = 32 + Math.cos(angle) * 25;
          const y = 32 + Math.sin(angle) * 25;
          if (i === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
          
          const innerAngle = angle + Math.PI / 5;
          const ix = 32 + Math.cos(innerAngle) * 12;
          const iy = 32 + Math.sin(innerAngle) * 12;
          context.lineTo(ix, iy);
        }
        context.closePath();
        context.fill();
      } else {
        // Simple cross
        context.fillRect(30, 12, 4, 40);
        context.fillRect(12, 30, 40, 4);
      }
      
      // Create subtle glow effect
      context.beginPath();
      context.arc(32, 32, 15, 0, Math.PI * 2);
      const gradient = context.createRadialGradient(32, 32, 5, 32, 32, 20);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      context.fillStyle = gradient;
      context.fill();
      
      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    }
    
    // Add subtle ambient light for depth
    const ambientLight = new THREE.AmbientLight(0x222222);
    scene.add(ambientLight);
    
    // Add directional light for highlights
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Individual rotation speeds and directions for each particle system
    const rotationSpeeds = [
      { x: 0.0001, y: 0.0003, z: 0.0002 },
      { x: 0.0002, y: 0.0001, z: 0.0003 },
      { x: 0.0003, y: 0.0002, z: 0.0001 }
    ];
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate each particle system at different speeds
      particles.forEach((particleSystem, index) => {
        const speed = rotationSpeeds[index];
        particleSystem.rotation.x += speed.x;
        particleSystem.rotation.y += speed.y;
        particleSystem.rotation.z += speed.z;
        
        // Gentle floating motion
        particleSystem.position.y = Math.sin(Date.now() * 0.001 + index) * 5;
        particleSystem.position.x = Math.cos(Date.now() * 0.0005 + index) * 3;
      });
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose all geometries and materials
      particles.forEach(particle => {
        particle.geometry.dispose();
      });
      materials.forEach(material => {
        if (material.map) material.map.dispose();
        material.dispose();
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className="fixed inset-0 pointer-events-none"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '80vh',
        zIndex: 0,
        background: 'linear-gradient(to bottom, #0a0a1a 0%, #1a1a2e 100%)'
      }}
    />
  );
        }
