'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ParticleBackgroundProps {
  children?: React.ReactNode;
}

const ParticleBackground: React.FC<ParticleBackgroundProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check for dark mode
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };
    
    checkDarkMode();
    
    // Watch for dark mode changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = isDarkMode ? new THREE.Color(0x0a0a0a) : new THREE.Color(0xf5f5f5);
    scene.fog = new THREE.FogExp2(isDarkMode ? 0x0a0a0a : 0xf5f5f5, 0.0008);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;
    camera.position.y = 5;
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Create particle system
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);
    
    // Colors based on theme
    const primaryColor = isDarkMode ? new THREE.Color(0x3b82f6) : new THREE.Color(0x2563eb);
    const secondaryColor = isDarkMode ? new THREE.Color(0x8b5cf6) : new THREE.Color(0x7c3aed);
    const accentColor = isDarkMode ? new THREE.Color(0xec4899) : new THREE.Color(0xdb2777);
    
    for (let i = 0; i < particlesCount; i++) {
      // Position in a sphere-like distribution
      const radius = 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6; // Flatten slightly
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      // Color based on position
      const colorChoice = Math.random();
      let color: THREE.Color;
      if (colorChoice < 0.6) {
        color = primaryColor;
      } else if (colorChoice < 0.8) {
        color = secondaryColor;
      } else {
        color = accentColor;
      }
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Create particle texture (circular gradient)
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.arc(16, 16, 14, 0, 2 * Math.PI);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.shadowBlur = 0;
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 14);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.5, 'rgba(255,255,255,0.8)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
    }
    
    const particleTexture = new THREE.CanvasTexture(canvas);
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.25,
      map: particleTexture,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.8
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
    
    // Create additional floating particles
    const floatingParticlesCount = 800;
    const floatingGeometry = new THREE.BufferGeometry();
    const floatingPositions = new Float32Array(floatingParticlesCount * 3);
    
    for (let i = 0; i < floatingParticlesCount; i++) {
      floatingPositions[i * 3] = (Math.random() - 0.5) * 80;
      floatingPositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      floatingPositions[i * 3 + 2] = (Math.random() - 0.5) * 50 - 20;
    }
    
    floatingGeometry.setAttribute('position', new THREE.BufferAttribute(floatingPositions, 3));
    
    const floatingMaterial = new THREE.PointsMaterial({
      size: 0.08,
      color: isDarkMode ? 0x6b7280 : 0x9ca3af,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    
    const floatingParticles = new THREE.Points(floatingGeometry, floatingMaterial);
    scene.add(floatingParticles);
    
    // Create connecting lines between nearby particles
    const linePositions: number[] = [];
    const connectionDistance = 4;
    
    for (let i = 0; i < particlesCount; i++) {
      const x1 = positions[i * 3];
      const y1 = positions[i * 3 + 1];
      const z1 = positions[i * 3 + 2];
      
      for (let j = i + 1; j < particlesCount; j++) {
        const x2 = positions[j * 3];
        const y2 = positions[j * 3 + 1];
        const z2 = positions[j * 3 + 2];
        
        const distance = Math.sqrt(
          Math.pow(x2 - x1, 2) + 
          Math.pow(y2 - y1, 2) + 
          Math.pow(z2 - z1, 2)
        );
        
        if (distance < connectionDistance) {
          linePositions.push(x1, y1, z1, x2, y2, z2);
        }
      }
    }
    
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
    
    const lineMaterial = new THREE.LineBasicMaterial({
      color: isDarkMode ? 0x1f2937 : 0xe5e7eb,
      transparent: true,
      opacity: 0.15
    });
    
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    // Add directional light for depth
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Mouse interaction variables
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    
    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = (event.clientY / window.innerHeight) * 2 - 1;
      targetRotationY = mouseX * 0.5;
      targetRotationX = mouseY * 0.3;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    // Animation variables
    let time = 0;
    let animationId: number;
    
    // Helper function to check if object is a texture
    const isTexture = (obj: any): obj is THREE.Texture => {
      return obj && typeof obj.dispose === 'function';
    };
    
    // Animation loop
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      time += 0.002;
      
      // Smooth rotation following mouse
      particlesMesh.rotation.y += (targetRotationY - particlesMesh.rotation.y) * 0.05;
      particlesMesh.rotation.x += (targetRotationX - particlesMesh.rotation.x) * 0.05;
      floatingParticles.rotation.y = time * 0.1;
      floatingParticles.rotation.x = Math.sin(time * 0.2) * 0.1;
      lines.rotation.y = particlesMesh.rotation.y;
      lines.rotation.x = particlesMesh.rotation.x;
      
      // Camera slight movement for parallax effect
      camera.position.x += (mouseX * 2 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 2 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup function
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      // Dispose geometries and materials
      particlesGeometry.dispose();
      floatingGeometry.dispose();
      lineGeometry.dispose();
      
      particlesMaterial.dispose();
      floatingMaterial.dispose();
      lineMaterial.dispose();
      
      if (isTexture(particleTexture)) {
        particleTexture.dispose();
      }
      
      // Dispose renderer
      renderer.dispose();
      
      // Remove canvas from DOM
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [isDarkMode]);

  return (
    <div ref={containerRef} className="fixed inset-0 w-full h-full -z-10">
      {children}
    </div>
  );
};

export default ParticleBackground;
