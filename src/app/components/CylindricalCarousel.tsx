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
  const radius = 200; // Radius of the cylinder
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
      className={`relative w-full h-96 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 3D Carousel Container */}
      <div className="relative w-full h-full perspective-1000">
        <div className="relative w-full h-full transform-style-preserve-3d">
          {items.map((item, index) => {
            // Calculate position in 3D space
            const angle = angleStep * index - (angleStep * currentIndex);
            const x = Math.sin(angle) * radius;
            const z = Math.cos(angle) * radius - radius; // Adjust so items face forward
            
            // Calculate rotation and scale
            const rotationY = (-angle * 180) / Math.PI;
            const scale = z < -150 ? 0.8 : 1; // Scale items in the back
            
            // Calculate opacity based on position
            const opacity = Math.max(0.3, 1 - Math.abs(angle) / (Math.PI / 2));

            return (
              <motion.div
                key={item.id}
                className="absolute top-1/2 left-1/2 w-64 h-48 -mt-24 -ml-32 cursor-pointer"
                style={{
                  transform: `translateX(${x}px) translateZ(${z}px) rotateY(${rotationY}deg) scale(${scale})`,
                  transformStyle: 'preserve-3d',
                  opacity,
                }}
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity,
                  transition: { duration: 0.5 }
                }}
                whileHover={{ scale: scale * 1.05 }}
                onClick={() => goToSlide(index)}
              >
                <div 
                  className="w-full h-full rounded-xl shadow-lg overflow-hidden border-2 border-white/20 backdrop-blur-sm"
                  style={{
                    background: item.background || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center p-4 text-white">
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
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {showNavigation && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-white scale-125' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}

      {/* Current Item Indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
        {currentIndex + 1} / {totalItems}
      </div>
    </div>
  );
};

export default CylindricalCarousel;
