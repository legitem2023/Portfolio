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
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };
    
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  // Create CSS radial gradient string (matches the Three.js gradient)
  const getCSSRadialGradient = () => {
    if (isDarkMode) {
      return `radial-gradient(circle at center, 
        #0a0a0a 0%, 
        #1a1a2e 50%, 
        #16213e 100%)`;
    } else {
      return `radial-gradient(circle at center, 
        #f5f5f5 0%, 
        #e0e0e8 40%, 
        #c8c8d8 70%, 
        #a0a0b8 100%)`;
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    
    // Create radial gradient background for Three.js
    const createRadialGradient = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return new THREE.Color(isDarkMode ? 0x0a0a0a : 0xf5f5f5);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = canvas.width / 2;
      
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      
      if (isDarkMode) {
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(0.5, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
      } else {
        gradient.addColorStop(0, '#f5f5f5');
        gradient.addColorStop(0.4, '#e0e0e8');
        gradient.addColorStop(0.7, '#c8c8d8');
        gradient.addColorStop(1, '#a0a0b8');
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    };
    
    scene.background = createRadialGradient();
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;
    camera.position.y = 5;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1500;
    const positions = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount; i++) {
      const radius = 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6;
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.2,
      color: isDarkMode ? 0x3b82f6 : 0x2563eb,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
    
    // Floating particles
    const floatingCount = 1000;
    const floatingGeometry = new THREE.BufferGeometry();
    const floatingPositions = new Float32Array(floatingCount * 3);
    
    for (let i = 0; i < floatingCount; i++) {
      floatingPositions[i * 3] = (Math.random() - 0.5) * 100;
      floatingPositions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      floatingPositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    
    floatingGeometry.setAttribute('position', new THREE.BufferAttribute(floatingPositions, 3));
    
    const floatingMaterial = new THREE.PointsMaterial({
      size: 0.08,
      color: isDarkMode ? 0x6b7280 : 0x9ca3af,
      transparent: true,
      opacity: 0.4
    });
    
    const floatingParticles = new THREE.Points(floatingGeometry, floatingMaterial);
    scene.add(floatingParticles);
    
    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    
    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = (event.clientY / window.innerHeight) * 2 - 1;
      targetRotationY = mouseX * 0.3;
      targetRotationX = mouseY * 0.2;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    // Animation
    let animationId: number;
    
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      particlesMesh.rotation.y += (targetRotationY - particlesMesh.rotation.y) * 0.05;
      particlesMesh.rotation.x += (targetRotationX - particlesMesh.rotation.x) * 0.05;
      
      camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 1.5 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup - Store references for disposal
    const backgroundTexture = scene.background;
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      // Remove meshes from scene
      scene.remove(particlesMesh);
      scene.remove(floatingParticles);
      
      // Dispose geometries and materials
      particlesGeometry.dispose();
      floatingGeometry.dispose();
      particlesMaterial.dispose();
      floatingMaterial.dispose();
      
      // Dispose background texture if it's a texture
      if (backgroundTexture instanceof THREE.Texture) {
        backgroundTexture.dispose();
      }
      
      // Remove renderer from DOM
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose renderer
      renderer.dispose();
    };
  }, [isDarkMode]);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 w-full h-full -z-10"
      style={{ 
        background: getCSSRadialGradient(),
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      }}
    >
      {children}
    </div>
  );
};

export default ParticleBackground;
