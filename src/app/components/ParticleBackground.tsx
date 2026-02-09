// components/MinimalParticles.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function ParticleBackground() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!mountRef.current) return;

    // Get container dimensions
    const updateContainerSize = () => {
      if (mountRef.current) {
        const { width, height } = mountRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };

    // Initial size
    updateContainerSize();

    // Create ResizeObserver to track container size changes
    const resizeObserver = new ResizeObserver(() => {
      updateContainerSize();
    });

    if (mountRef.current) {
      resizeObserver.observe(mountRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!mountRef.current || containerSize.width === 0 || containerSize.height === 0) return;

    // Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050520); // Deep blue winter night
    
    const camera = new THREE.PerspectiveCamera(75, containerSize.width / containerSize.height, 1, 1000);
    camera.position.z = 400;
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(containerSize.width, containerSize.height);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    
    // Winter ice blue colors
    const winterColors = [
      0x88ccff, // Light sky blue
      0xaaddff, // Very light blue
      0xcceeff, // Pale blue
      0x99ddff, // Soft blue
      0xbbefff, // Ice blue
      0xddefff, // Frosty white-blue
    ];
    
    // Create a proper snowflake texture
    const createSnowflakeTexture = (): THREE.Texture => {
      const canvas = document.createElement('canvas');
      const size = 256; // Larger for better quality
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      
      if (!context) return new THREE.Texture();
      
      // Clear with transparent
      context.clearRect(0, 0, size, size);
      const center = size / 2;
      
      // Create hexagonal snowflake
      context.beginPath();
      context.fillStyle = 'rgba(255, 255, 255, 0.95)';
      
      // Main hexagon
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6;
        const radius = 80;
        const x = center + Math.cos(angle) * radius;
        const y = center + Math.sin(angle) * radius;
        if (i === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.closePath();
      context.fill();
      
      // Add arms/points to make it look like a snowflake
      context.lineWidth = 6;
      context.strokeStyle = 'rgba(220, 240, 255, 0.9)';
      
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6;
        const innerRadius = 40;
        const outerRadius = 110;
        
        const x1 = center + Math.cos(angle) * innerRadius;
        const y1 = center + Math.sin(angle) * innerRadius;
        const x2 = center + Math.cos(angle) * outerRadius;
        const y2 = center + Math.sin(angle) * outerRadius;
        
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
        
        // Add branches
        const branchAngle = angle + Math.PI / 6;
        const branchX1 = x1 + Math.cos(branchAngle) * 30;
        const branchY1 = y1 + Math.sin(branchAngle) * 30;
        const branchX2 = x1 - Math.cos(branchAngle) * 30;
        const branchY2 = y1 - Math.sin(branchAngle) * 30;
        
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(branchX1, branchY1);
        context.moveTo(x1, y1);
        context.lineTo(branchX2, branchY2);
        context.stroke();
      }
      
      // Add intense glow
      context.beginPath();
      context.arc(center, center, 120, 0, Math.PI * 2);
      const gradient = context.createRadialGradient(
        center, center, 20,
        center, center, 120
      );
      gradient.addColorStop(0, 'rgba(170, 220, 255, 0.8)');
      gradient.addColorStop(0.3, 'rgba(170, 220, 255, 0.4)');
      gradient.addColorStop(1, 'rgba(170, 220, 255, 0)');
      context.fillStyle = gradient;
      context.fill();
      
      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    };
    
    // Create particle system - adjust particle count based on container size
    const createParticleSystem = () => {
      // Calculate particle count based on container size
      const baseParticles = 1000;
      const density = (containerSize.width * containerSize.height) / (1920 * 1080); // Relative to 1080p
      const particleCount = Math.max(500, Math.min(2000, Math.floor(baseParticles * density)));
      
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);
      
      // Calculate bounds based on container size
      const widthBound = containerSize.width * 2;
      const heightBound = containerSize.height * 2;
      const depthBound = 1000;
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Spread particles within container bounds
        positions[i3] = (Math.random() - 0.5) * widthBound;
        positions[i3 + 1] = (Math.random() - 0.5) * heightBound;
        positions[i3 + 2] = (Math.random() - 0.5) * depthBound;
        
        // Winter blue color
        const colorIndex = Math.floor(Math.random() * winterColors.length);
        const color = new THREE.Color(winterColors[colorIndex]);
        
        // Make it slightly brighter
        const brightness = 0.9 + Math.random() * 0.3;
        color.r *= brightness;
        color.g *= brightness;
        color.b *= brightness;
        
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
        
        // Size variation - adjust based on container size
        const baseSize = Math.min(15, Math.max(5, containerSize.width / 100));
        sizes[i] = baseSize + Math.random() * (baseSize * 0.5);
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      
      return geometry;
    };
    
    // Create texture
    const snowflakeTexture = createSnowflakeTexture();
    
    // Adjust material size based on container
    const baseSize = Math.min(20, Math.max(8, containerSize.width / 80));
    
    // Create material with glow
    const material = new THREE.PointsMaterial({
      size: baseSize,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      map: snowflakeTexture,
      alphaTest: 0.1,
      depthWrite: false
    });
    
    // Create main particle system
    const geometry = createParticleSystem();
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    
    // Create glow particles (larger, more transparent)
    const glowGeometry = createParticleSystem();
    const glowMaterial = new THREE.PointsMaterial({
      size: baseSize * 2, // Much larger for glow
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.3, // More transparent
      blending: THREE.AdditiveBlending,
      map: snowflakeTexture,
      alphaTest: 0.05,
      depthWrite: false
    });
    
    const glowParticles = new THREE.Points(glowGeometry, glowMaterial);
    scene.add(glowParticles);
    
    // Add fog for depth
    //scene.fog = new THREE.FogExp2(0x050520, 0.001);
    
    // Add lights for glow effect
    const ambientLight = new THREE.AmbientLight(0x88aaff, 0.4);
   // scene.add(ambientLight);
    
    // Add point lights that move around - scale with container
    const pointLights: THREE.PointLight[] = [];
    const lightRange = Math.min(containerSize.width, containerSize.height) * 0.5;
    
    for (let i = 0; i < 3; i++) {
      const light = new THREE.PointLight(0xaaddff, 0.7, lightRange);
      light.position.set(
        Math.random() * lightRange - lightRange / 2,
        Math.random() * lightRange - lightRange / 2,
        Math.random() * lightRange * 0.5 - lightRange * 0.25
      );
      scene.add(light);
      pointLights.push(light);
    }
    
    // Animation
    let time = 0;
    let animationId: number;
    
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      time += 0.01;
      
      // Update particle positions (snow falling)
      const positions = geometry.attributes.position.array as Float32Array;
      const glowPositions = glowGeometry.attributes.position.array as Float32Array;
      
      // Adjust fall speed based on container height
      const fallSpeed = containerSize.height * 0.001;
      
      for (let i = 0; i < positions.length; i += 3) {
        // Gentle falling motion
        positions[i + 1] -= fallSpeed * (0.8 + Math.random() * 0.4);
        
        // Gentle swaying
        positions[i] += Math.sin(time * 0.5 + i * 0.001) * 0.2;
        positions[i + 2] += Math.cos(time * 0.3 + i * 0.001) * 0.1;
        
        // Reset if fallen too low (use container height as reference)
        if (positions[i + 1] < -containerSize.height) {
          positions[i + 1] = containerSize.height;
          positions[i] = (Math.random() - 0.5) * containerSize.width * 2;
          positions[i + 2] = (Math.random() - 0.5) * 1000;
        }
        
        // Copy to glow particles
        glowPositions[i] = positions[i];
        glowPositions[i + 1] = positions[i + 1];
        glowPositions[i + 2] = positions[i + 2];
      }
      
      geometry.attributes.position.needsUpdate = true;
      glowGeometry.attributes.position.needsUpdate = true;
      
      // Rotate entire scene slowly
      particles.rotation.y = time * 0.02;
      glowParticles.rotation.y = time * 0.02;
      
      // Animate lights - scale movement with container
      const lightMovement = Math.min(containerSize.width, containerSize.height) * 0.3;
      pointLights.forEach((light, index) => {
        light.position.x = Math.sin(time * 0.3 + index) * lightMovement;
        light.position.y = Math.cos(time * 0.4 + index) * lightMovement * 0.7;
        light.position.z = Math.sin(time * 0.5 + index) * lightMovement * 0.4;
      });
      
      renderer.render(scene, camera);
    };
    
    // Start animation
    animate();
    
    // Handle container resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      const { width, height } = mountRef.current.getBoundingClientRect();
      
      if (width > 0 && height > 0) {
        // Update camera aspect ratio
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        
        // Update renderer size
        renderer.setSize(width, height);
        
        // Update particle bounds if needed (simpler approach - just resize)
        // Note: For a perfect solution, you might want to recreate the particle system
        // But this keeps it simple and responsive
      }
    };
    
    // Create ResizeObserver for the container
    const containerResizeObserver = new ResizeObserver(handleResize);
    if (mountRef.current) {
      containerResizeObserver.observe(mountRef.current);
    }
    
    // Cleanup
    return () => {
      containerResizeObserver.disconnect();
      if (animationId) cancelAnimationFrame(animationId);
      
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose resources
      geometry.dispose();
      glowGeometry.dispose();
      material.dispose();
      glowMaterial.dispose();
      snowflakeTexture.dispose();
      ambientLight.dispose();
      pointLights.forEach(light => light.dispose());
      renderer.dispose();
    };
  }, [containerSize]); // Re-run when container size changes

  return (
    <div 
      ref={mountRef} 
      className="fixed inset-0 pointer-events-none"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '80%', // This sets the container height
        zIndex: -1,
        background: 'linear-gradient(to bottom, #050520 0%, #0a0a30 30%, #1a1a40 100%)'
      }}
    />
  );
                      }
