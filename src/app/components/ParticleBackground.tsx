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
    scene.background = new THREE.Color(0x050520); // Deep blue winter night
    
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
    
    // Winter ice blue colors - various shades of blue/white
    const winterColors = [
      0x88ccff, // Light sky blue
      0xaaddff, // Very light blue
      0xcceeff, // Pale blue
      0x99ddff, // Soft blue
      0xbbefff, // Ice blue
      0xddefff, // Frosty white-blue
      0xaaccff, // Crystal blue
      0xbbddff, // Winter sky
      0xccffff, // Cyan ice
      0xddf5ff, // Snow white-blue
    ];
    
    // Create winter snowflake textures
    const createSnowflakeTextures = (): THREE.Texture[] => {
      const textures: THREE.Texture[] = [];
      
      // Create different snowflake patterns
      for (let pattern = 0; pattern < 4; pattern++) {
        const canvas = document.createElement('canvas');
        canvas.width = 128; // Larger for better detail
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        if (!context) {
          textures.push(new THREE.Texture());
          continue;
        }
        
        // Clear with transparent background
        context.clearRect(0, 0, 128, 128);
        
        // Center point
        const centerX = 64;
        const centerY = 64;
        
        context.beginPath();
        context.fillStyle = 'rgba(255, 255, 255, 0.95)';
        context.shadowColor = '#aaddff';
        context.shadowBlur = 20;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        
        switch(pattern) {
          case 0: // Classic hexagonal snowflake
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI * 2 * i) / 6;
              const x = centerX + Math.cos(angle) * 30;
              const y = centerY + Math.sin(angle) * 30;
              if (i === 0) context.moveTo(x, y);
              else context.lineTo(x, y);
            }
            context.closePath();
            context.fill();
            
            // Add inner details
            context.beginPath();
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI * 2 * i) / 6;
              const x1 = centerX + Math.cos(angle) * 15;
              const y1 = centerY + Math.sin(angle) * 15;
              const x2 = centerX + Math.cos(angle + Math.PI/6) * 25;
              const y2 = centerY + Math.sin(angle + Math.PI/6) * 25;
              context.moveTo(x1, y1);
              context.lineTo(x2, y2);
            }
            context.strokeStyle = 'rgba(200, 230, 255, 0.8)';
            context.lineWidth = 3;
            context.stroke();
            break;
            
          case 1: // Star snowflake
            context.beginPath();
            for (let i = 0; i < 8; i++) {
              const angle = (Math.PI * 2 * i) / 8 - Math.PI / 2;
              const radius = i % 2 === 0 ? 40 : 20;
              const x = centerX + Math.cos(angle) * radius;
              const y = centerY + Math.sin(angle) * radius;
              if (i === 0) context.moveTo(x, y);
              else context.lineTo(x, y);
            }
            context.closePath();
            context.fill();
            
            // Add center circle
            context.beginPath();
            context.arc(centerX, centerY, 8, 0, Math.PI * 2);
            context.fillStyle = 'rgba(220, 240, 255, 1)';
            context.fill();
            break;
            
          case 2: // Dendritic snowflake
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI * 2 * i) / 6;
              const branchLength = 35;
              
              // Main branch
              context.beginPath();
              context.moveTo(centerX, centerY);
              const endX = centerX + Math.cos(angle) * branchLength;
              const endY = centerY + Math.sin(angle) * branchLength;
              context.lineTo(endX, endY);
              context.strokeStyle = 'rgba(255, 255, 255, 0.9)';
              context.lineWidth = 4;
              context.stroke();
              
              // Side branches
              for (let j = 1; j <= 2; j++) {
                const branchPos = j * 0.3;
                const sideX = centerX + Math.cos(angle) * branchLength * branchPos;
                const sideY = centerY + Math.sin(angle) * branchLength * branchPos;
                
                context.beginPath();
                context.moveTo(sideX, sideY);
                context.lineTo(
                  sideX + Math.cos(angle + Math.PI/3) * 15,
                  sideY + Math.sin(angle + Math.PI/3) * 15
                );
                context.moveTo(sideX, sideY);
                context.lineTo(
                  sideX + Math.cos(angle - Math.PI/3) * 15,
                  sideY + Math.sin(angle - Math.PI/3) * 15
                );
                context.strokeStyle = 'rgba(220, 240, 255, 0.8)';
                context.lineWidth = 2;
                context.stroke();
              }
            }
            break;
            
          case 3: // Simple crystal
            context.beginPath();
            context.arc(centerX, centerY, 25, 0, Math.PI * 2);
            context.fill();
            
            // Add cross lines
            context.beginPath();
            context.moveTo(centerX - 35, centerY);
            context.lineTo(centerX + 35, centerY);
            context.moveTo(centerX, centerY - 35);
            context.lineTo(centerX, centerY + 35);
            context.strokeStyle = 'rgba(200, 230, 255, 0.7)';
            context.lineWidth = 3;
            context.stroke();
            break;
        }
        
        // Add intense glow around snowflake
        context.beginPath();
        context.arc(centerX, centerY, 50, 0, Math.PI * 2);
        const glowGradient = context.createRadialGradient(
          centerX, centerY, 10,
          centerX, centerY, 50
        );
        glowGradient.addColorStop(0, 'rgba(170, 220, 255, 0.8)');
        glowGradient.addColorStop(0.5, 'rgba(170, 220, 255, 0.3)');
        glowGradient.addColorStop(1, 'rgba(170, 220, 255, 0)');
        
        context.fillStyle = glowGradient;
        context.fill();
        
        const texture = new THREE.CanvasTexture(canvas);
        textures.push(texture);
      }
      
      return textures;
    };
    
    // Create particle system
    const createParticleSystem = (textures: THREE.Texture[]) => {
      const particleCount = 2500; // Increased for denser snow
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);
      const textureIndices = new Float32Array(particleCount);
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Spread particles in a wide area
        positions[i3] = (Math.random() - 0.5) * 2500;
        positions[i3 + 1] = (Math.random() - 0.5) * 2000 + 200; // Start higher
        positions[i3 + 2] = (Math.random() - 0.5) * 1200;
        
        // Assign winter blue color with slight variations
        const colorIndex = Math.floor(Math.random() * winterColors.length);
        const color = new THREE.Color(winterColors[colorIndex]);
        
        // Add subtle brightness variation
        const brightness = 0.9 + Math.random() * 0.2;
        color.multiplyScalar(brightness);
        
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
        
        // Size variation
        sizes[i] = 4 + Math.random() * 8;
        
        // Random texture index
        textureIndices[i] = Math.floor(Math.random() * textures.length);
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      geometry.setAttribute('textureIndex', new THREE.BufferAttribute(textureIndices, 1));
      
      return geometry;
    };
    
    // Create custom shader material for better glow
    const createGlowMaterial = (textures: THREE.Texture[]) => {
      return new THREE.ShaderMaterial({
        uniforms: {
          pointTexture: { value: textures[0] }, // Use first texture as default
          textureAtlas: { value: textures },
          alphaTest: { value: 0.5 },
          size: { value: 10.0 },
          scale: { value: 1.0 }
        },
        vertexShader: `
          attribute float size;
          attribute float textureIndex;
          attribute vec3 color;
          varying float vTextureIndex;
          varying vec3 vColor;
          
          void main() {
            vTextureIndex = textureIndex;
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z) * scale;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform sampler2D pointTexture;
          uniform float alphaTest;
          varying float vTextureIndex;
          varying vec3 vColor;
          
          void main() {
            // Create soft circular point
            vec2 coord = gl_PointCoord - vec2(0.5);
            float distance = length(coord);
            if (distance > 0.5) discard;
            
            // Main color with blue tint
            vec3 baseColor = vColor;
            
            // Intense glow effect
            float glow = (0.5 - distance) * 2.0;
            glow = pow(glow, 2.0);
            
            // Blue-white glow
            vec3 glowColor = mix(vec3(0.7, 0.9, 1.0), vec3(1.0), glow);
            
            // Combine colors
            vec3 finalColor = mix(baseColor, glowColor, 0.7) + glowColor * 0.3;
            
            // Alpha with falloff
            float alpha = smoothstep(0.5, 0.0, distance) * 0.9;
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
    };
    
    // Create textures and particle systems
    const textures = createSnowflakeTextures();
    const geometry = createParticleSystem(textures);
    const material = createGlowMaterial(textures);
    
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    
    // Create intense glow particles (larger, more transparent)
    const glowGeometry = createParticleSystem(textures);
    const glowMaterial = createGlowMaterial(textures);
    glowMaterial.uniforms.size.value = 25.0; // Much larger for glow
    glowMaterial.uniforms.scale.value = 1.5;
    
    const glowParticles = new THREE.Points(glowGeometry, glowMaterial);
    scene.add(glowParticles);
    
    // Add atmospheric fog
    scene.fog = new THREE.FogExp2(0x050520, 0.0008);
    
    // Add multiple light sources for enhanced glow
    const lights: THREE.Light[] = [];
    
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0x88aaff, 0.3);
    scene.add(ambientLight);
    lights.push(ambientLight);
    
    // Multiple point lights for dynamic glow
    for (let i = 0; i < 6; i++) {
      const intensity = 0.6 + Math.random() * 0.4;
      const distance = 300 + Math.random() * 200;
      const light = new THREE.PointLight(0xaaddff, intensity, distance);
      
      // Position in a hemisphere pattern
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI * 0.5;
      const radius = 150 + Math.random() * 100;
      
      light.position.x = radius * Math.sin(theta) * Math.cos(phi);
      light.position.y = radius * Math.sin(theta) * Math.sin(phi);
      light.position.z = radius * Math.cos(theta);
      
      scene.add(light);
      lights.push(light);
    }
    
    // Add a directional light for highlighting
    const directionalLight = new THREE.DirectionalLight(0xccffff, 0.5);
    directionalLight.position.set(0.5, 1, 0.5);
    scene.add(directionalLight);
    lights.push(directionalLight);
    
    // Animation variables
    let time = 0;
    const velocities = new Float32Array(geometry.attributes.position.count * 3);
    const rotations = new Float32Array(geometry.attributes.position.count);
    
    // Initialize velocities and rotations
    for (let i = 0; i < velocities.length; i += 3) {
      velocities[i] = (Math.random() - 0.5) * 0.3; // x drift
      velocities[i + 1] = -1.0 - Math.random() * 1.5; // y fall speed
      velocities[i + 2] = (Math.random() - 0.5) * 0.3; // z drift
      
      rotations[i / 3] = Math.random() * Math.PI * 2;
    }
    
    // Animation loop
    let animationId: number;
    
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      time += 0.016; // ~60fps
      
      const positions = geometry.attributes.position.array as Float32Array;
      const glowPositions = glowGeometry.attributes.position.array as Float32Array;
      
      // Update particle positions with winter snow motion
      for (let i = 0; i < positions.length; i += 3) {
        const particleIndex = i / 3;
        
        // Gentle drifting motion
        positions[i] += Math.sin(time * 0.5 + particleIndex * 0.1) * 0.05;
        positions[i + 1] += velocities[i + 1] * (0.8 + Math.sin(time * 0.3 + particleIndex) * 0.2);
        positions[i + 2] += Math.cos(time * 0.4 + particleIndex * 0.05) * 0.05;
        
        // Add slight rotation to particles
        rotations[particleIndex] += 0.01;
        
        // Reset particles that fall too low
        if (positions[i + 1] < -600) {
          positions[i + 1] = 600;
          positions[i] = (Math.random() - 0.5) * 2500;
          positions[i + 2] = (Math.random() - 0.5) * 1200;
        }
        
        // Copy positions to glow particles
        glowPositions[i] = positions[i];
        glowPositions[i + 1] = positions[i + 1];
        glowPositions[i + 2] = positions[i + 2];
      }
      
      geometry.attributes.position.needsUpdate = true;
      glowGeometry.attributes.position.needsUpdate = true;
      
      // Animate lights for dynamic glow effect
      lights.forEach((light, index) => {
        if (light instanceof THREE.PointLight) {
          light.position.x = Math.sin(time * 0.2 + index) * 200;
          light.position.y = Math.cos(time * 0.3 + index) * 150;
          light.position.z = Math.sin(time * 0.4 + index) * 100;
          
          // Pulsing intensity
          light.intensity = 0.5 + Math.sin(time * 0.5 + index) * 0.3;
        }
      });
      
      // Rotate entire scene slowly
      particles.rotation.y = time * 0.02;
      glowParticles.rotation.y = time * 0.02 + 0.01;
      
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
      
      // Dispose all resources
      geometry.dispose();
      glowGeometry.dispose();
      material.dispose();
      glowMaterial.dispose();
      textures.forEach(texture => texture.dispose());
      lights.forEach(light => light.dispose());
      scene.remove(particles);
      scene.remove(glowParticles);
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
        background: 'linear-gradient(to bottom, #050520 0%, #0a0a30 30%, #1a1a40 100%)'
      }}
    />
  );
                  }
