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
    scene.background = new THREE.Color(0x0a0a1a); // Dark blue winter background
    
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
    
    // Neon winter colors
    const neonColors = [
      0x00ffff, // Cyan
      0xff00ff, // Magenta
      0x00ff00, // Green
      0xffff00, // Yellow
      0xff1493, // Deep Pink
      0x00ced1, // Dark Turquoise
      0x9370db, // Medium Purple
    ];
    
    // Snowflake texture from CDN - Using a simple snowflake texture
    const textureLoader = new THREE.TextureLoader();
    
    // Simple particle system with texture
    const createParticleSystem = () => {
      const particleCount = 2000;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);
      
      // Initialize particles
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Random positions in a larger space
        positions[i3] = (Math.random() - 0.5) * 2000;
        positions[i3 + 1] = (Math.random() - 0.5) * 2000;
        positions[i3 + 2] = (Math.random() - 0.5) * 1000;
        
        // Assign random neon color
        const colorIndex = Math.floor(Math.random() * neonColors.length);
        const color = new THREE.Color(neonColors[colorIndex]);
        
        // Add some color variation
        color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.3);
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
        
        // Random sizes for variety
        sizes[i] = 3 + Math.random() * 5;
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      
      return geometry;
    };
    
    // Create particle system
    const geometry = createParticleSystem();
    
    // Load snowflake texture from CDN - using a public snowflake texture
    // Fallback to a simple circle sprite if CDN fails
    let texture: THREE.Texture;
    
    try {
      // Using a simple snowflake/snow texture from a reliable CDN
      texture = textureLoader.load(
        'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/sprites/snowflake.png',
        () => {
          console.log('Snowflake texture loaded');
        },
        undefined,
        (err) => {
          console.error('Failed to load snowflake texture, using fallback', err);
          createFallbackTexture();
        }
      );
    } catch (error) {
      console.error('Texture loading error:', error);
      createFallbackTexture();
    }
    
    function createFallbackTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const context = canvas.getContext('2d');
      if (!context) return;
      
      // Create a simple glowing circle
      context.beginPath();
      context.arc(32, 32, 24, 0, Math.PI * 2);
      
      // Inner white glow
      const gradient = context.createRadialGradient(32, 32, 4, 32, 32, 24);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      context.fillStyle = gradient;
      context.fill();
      
      // Add subtle sparkle effect
      context.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6;
        const x1 = 32 + Math.cos(angle) * 8;
        const y1 = 32 + Math.sin(angle) * 8;
        const x2 = 32 + Math.cos(angle) * 20;
        const y2 = 32 + Math.sin(angle) * 20;
        
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
      }
      context.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      context.lineWidth = 2;
      context.stroke();
      
      texture = new THREE.CanvasTexture(canvas);
    }
    
    // Create material with glow effect
    const material = new THREE.PointsMaterial({
      size: 8,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      map: texture,
      alphaTest: 0.5,
      depthWrite: false
    });
    
    // Create particle system
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    
    // Add fog for depth and atmosphere
    scene.fog = new THREE.FogExp2(0x0a0a1a, 0.001);
    
    // Add lighting for glow effect
    const ambientLight = new THREE.AmbientLight(0x222222);
    scene.add(ambientLight);
    
    // Create point lights for dynamic glow
    const pointLights: THREE.PointLight[] = [];
    for (let i = 0; i < 4; i++) {
      const colorIndex = Math.floor(Math.random() * neonColors.length);
      const pointLight = new THREE.PointLight(neonColors[colorIndex], 0.5, 100);
      pointLight.position.set(
        Math.random() * 400 - 200,
        Math.random() * 400 - 200,
        Math.random() * 200 - 100
      );
      scene.add(pointLight);
      pointLights.push(pointLight);
    }
    
    // Post-processing for additional glow (simulated with bloom effect)
    // Create a second particle system with larger, more transparent particles for glow
    const glowGeometry = createParticleSystem();
    const glowMaterial = new THREE.PointsMaterial({
      size: 15,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      map: texture,
      depthWrite: false
    });
    
    const glowParticles = new THREE.Points(glowGeometry, glowMaterial);
    scene.add(glowParticles);
    
    // Animation variables
    let time = 0;
    const velocity = new Float32Array(geometry.attributes.position.count * 3);
    
    // Initialize velocities
    for (let i = 0; i < velocity.length; i += 3) {
      velocity[i] = (Math.random() - 0.5) * 0.5;     // x
      velocity[i + 1] = (Math.random() - 0.5) * 1; // y - slower for snow effect
      velocity[i + 2] = (Math.random() - 0.5) * 0.5; // z
    }
    
    // Animation loop
    let animationId: number;
    
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      time += 0.01;
      
      const positions = geometry.attributes.position.array as Float32Array;
      
      // Update particle positions with snow-like motion
      for (let i = 0; i < positions.length; i += 3) {
        // Snow falling effect with gentle swaying
        positions[i + 1] -= 0.5; // Fall speed
        
        // Gentle horizontal sway
        positions[i] += Math.sin(time * 0.5 + i * 0.01) * 0.1;
        
        // Reset particles that fall too low
        if (positions[i + 1] < -500) {
          positions[i + 1] = 500;
          positions[i] = (Math.random() - 0.5) * 2000;
          positions[i + 2] = (Math.random() - 0.5) * 1000;
        }
      }
      
      geometry.attributes.position.needsUpdate = true;
      
      // Rotate the whole scene slowly
      particles.rotation.y = time * 0.05;
      glowParticles.rotation.y = time * 0.05;
      
      // Animate point lights for dynamic glow
      pointLights.forEach((light, index) => {
        light.position.x = Math.sin(time * 0.5 + index) * 200;
        light.position.y = Math.cos(time * 0.7 + index) * 200;
        light.position.z = Math.sin(time * 0.3 + index) * 100;
      });
      
      // Update glow particles to follow main particles
      const glowPositions = glowGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i++) {
        glowPositions[i] = positions[i];
      }
      glowGeometry.attributes.position.needsUpdate = true;
      
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
      cancelAnimationFrame(animationId);
      
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose resources
      geometry.dispose();
      glowGeometry.dispose();
      material.dispose();
      glowMaterial.dispose();
      if (texture) texture.dispose();
      
      pointLights.forEach(light => light.dispose());
      ambientLight.dispose();
      
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
