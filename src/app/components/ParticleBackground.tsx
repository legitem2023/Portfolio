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

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing canvas
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    const scene = new THREE.Scene();
    
    // Set solid color background first (fallback)
    scene.background = new THREE.Color(isDarkMode ? 0x0a0a0a : 0xf5f5f5);
    
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
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      particlesGeometry.dispose();
      floatingGeometry.dispose();
      particlesMaterial.dispose();
      floatingMaterial.dispose();
      renderer.dispose();
      
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [isDarkMode]);

  // Create CSS radial gradient for container background
  const getContainerStyle = () => {
    if (isDarkMode) {
      return {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -10,
        background: `radial-gradient(circle at center, 
          #0a0a0a 0%, 
          #1a1a2e 50%, 
          #16213e 100%)`
      };
    } else {
      return {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -10,
        background: `radial-gradient(circle at center, 
          #f5f5f5 0%, 
          #e0e0e8 40%, 
          #c8c8d8 70%, 
          #a0a0b8 100%)`
      };
    }
  };

  return (
    <>
      <div ref={containerRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -10 }} />
      <div style={getContainerStyle()}>
        {children}
      </div>
    </>
  );
};

export default ParticleBackground;
