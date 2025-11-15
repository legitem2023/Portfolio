// components/CylindricalCarousel.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CarouselItem {
  id: string | number;
  content: React.ReactNode;
  background?: string;
}

interface CylindricalCarouselProps {
  items: CarouselItem[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showNavigation?: boolean;
  className?: string;
}

const CylindricalCarousel: React.FC<CylindricalCarouselProps> = ({
  items,
  autoPlay = false,
  autoPlayInterval = 3000,
  showNavigation = true,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Cylinder geometry calculations
  const totalItems = items.length;
  const radius = 300; // Increased radius for better cylindrical effect
  const angleStep = (2 * Math.PI) / totalItems;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalItems);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && autoPlay) {
      autoPlayRef.current = setInterval(nextSlide, autoPlayInterval);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, autoPlay, autoPlayInterval]);

  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (autoPlay) {
      setIsAutoPlaying(true);
    }
  };

  if (!items.length) return null;

  return (
    <div 
      className={`relative w-full h-[500px] ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 3D Carousel Container */}
      <div className="relative w-full h-full" style={{
        perspective: '1200px',
      }}>
        <div className="relative w-full h-full" style={{
          transformStyle: 'preserve-3d',
        }}>
          {items.map((item, index) => {
            // Calculate position in 3D space for cylindrical layout
            const angle = angleStep * (index - currentIndex);
            const x = Math.sin(angle) * radius;
            const z = Math.cos(angle) * radius;
            
            // Calculate rotation to face the center
            const rotationY = (-angle * 180) / Math.PI;
            
            // Calculate scale based on depth
            const scale = 0.8 + (0.2 * (z + radius) / (2 * radius));
            
            // Calculate opacity based on position
            const opacity = 0.6 + (0.4 * (z + radius) / (2 * radius));

            return (
              <motion.div
                key={item.id}
                className="absolute top-1/2 left-1/2 w-80 h-60 -mt-32 -ml-40 cursor-pointer"
                style={{
                  transform: `translateX(${x}px) translateZ(${z}px) rotateY(${rotationY}deg) scale(${scale})`,
                  transformStyle: 'preserve-3d',
                  opacity,
                }}
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity,
                  transition: { 
                    duration: 0.8,
                    ease: "easeOut"
                  }
                }}
                whileHover={{ 
                  scale: scale * 1.1,
                  z: z + 50,
                  transition: { duration: 0.3 }
                }}
                onClick={() => goToSlide(index)}
              >
                <div 
                  className="w-full h-full rounded-2xl shadow-2xl overflow-hidden border-4 border-white/30 backdrop-blur-sm"
                  style={{
                    background: item.background || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)',
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center p-6 text-white">
                    {item.content}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Navigation Arrows */}
      {showNavigation && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white/20"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white/20"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {showNavigation && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3 z-10">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-white scale-125 shadow-lg' 
                  : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* Current Item Indicator */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white text-sm bg-black/60 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
        {currentIndex + 1} / {totalItems}
      </div>
    </div>
  );
};

export default CylindricalCarousel;
