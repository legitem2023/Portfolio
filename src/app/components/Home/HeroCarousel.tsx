// components/HeroCarousel3D.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, EffectCoverflow } from 'swiper/modules';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/effect-coverflow';

interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  cta: string;
  bgColor: string;
}

interface HeroCarousel3DProps {
  slides: HeroSlide[];
}

const HeroCarousel3D: React.FC<HeroCarousel3DProps> = ({ slides }) => {
  const [isMobile, setIsMobile] = useState(false);
  const swiperRef = useRef<any>(null);

  // Optimize resize handler with debounce
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    const debouncedCheck = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 100);
    };
    
    checkMobile();
    window.addEventListener('resize', debouncedCheck);
    return () => {
      window.removeEventListener('resize', debouncedCheck);
      clearTimeout(timeoutId);
    };
  }, []);

  // Memoize breakpoints to prevent recreation
  const breakpoints = useMemo(() => ({
    320: {
      slidesPerView: 2.2,
      spaceBetween: 4,
      coverflowEffect: {
        rotate: 0,
        stretch: 8,
        depth: 120,
        modifier: 3.2,
        slideShadows: false,
      }
    },
    480: {
      slidesPerView: 2.5,
      spaceBetween: 6,
      coverflowEffect: {
        rotate: 0,
        stretch: 10,
        depth: 150,
        modifier: 3.5,
        slideShadows: false,
      }
    },
    768: {
      slidesPerView: 2.8,
      spaceBetween: 10,
      coverflowEffect: {
        rotate: 0,
        stretch: 15,
        depth: 170,
        modifier: 3.7,
        slideShadows: false,
      }
    },
    1024: {
      slidesPerView: 3,
      spaceBetween: 12,
      coverflowEffect: {
        rotate: 0,
        stretch: 18,
        depth: 180,
        modifier: 3.8,
        slideShadows: false,
      }
    },
    1280: {
      slidesPerView: 3.2,
      spaceBetween: 15,
      coverflowEffect: {
        rotate: 0,
        stretch: 22,
        depth: 200,
        modifier: 4,
        slideShadows: false,
      }
    }
  }), []);

  // Memoize coverflow effect settings
  const coverflowEffect = useMemo(() => ({
    rotate: 0,
    stretch: isMobile ? 10 : 18,
    depth: isMobile ? 150 : 180,
    modifier: isMobile ? 3.5 : 3.8,
    slideShadows: false,
  }), [isMobile]);

  // Memoize navigation button handlers
  const handlePrevClick = useCallback(() => {
    if (swiperRef.current?.swiper) {
      swiperRef.current.swiper.slidePrev();
    }
  }, []);

  const handleNextClick = useCallback(() => {
    if (swiperRef.current?.swiper) {
      swiperRef.current.swiper.slideNext();
    }
  }, []);

  // Memoize button hover handlers
  const buttonHoverHandlers = useMemo(() => ({
    onMouseOver: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.95) 100%)';
      e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)';
    },
    onMouseOut: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)';
    }
  }), []);

  // Memoize click handler
  const handleCTAClick = useCallback((cta: string) => {
    console.log('Clicked:', cta);
  }, []);

  // Optimize slides - limit to first 5
  const visibleSlides = useMemo(() => slides.slice(0, 5), [slides]);

  return (
    <div 
      className="hero-carousel" 
      style={{ 
        width: "100%", 
        position: "relative", 
        padding: isMobile ? "10px" : "15px",
      }}
    >
      <Swiper
        ref={swiperRef}
        effect="coverflow"
        centeredSlides={true}
        slidesPerView={isMobile ? 2.5 : 3}
        spaceBetween={isMobile ? 5 : 12}
        autoplay={{ 
          delay: 2500, 
          disableOnInteraction: false,
          pauseOnMouseEnter: true, // Add this for better UX
        }}
        loop={true}
        navigation={false} // Disable built-in navigation
        coverflowEffect={coverflowEffect}
        modules={[Autoplay, EffectCoverflow]} // Remove Navigation from modules
        style={{ width: "100%" }}
        breakpoints={breakpoints}
        // Add performance optimizations
        grabCursor={true}
        speed={400} // Reduce transition speed for smoother performance
        watchSlidesProgress={true} // Optimize rendering
      >
        {visibleSlides.map((slide, idx) => (
          <SwiperSlide
            key={slide.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0px',
              backgroundColor: 'transparent'
            }}
          >
            <div 
              className={`slide-content ${slide.bgColor}`}
              style={{
                width: '100%',
                aspectRatio: '4 / 3',
                overflow: 'hidden',
                borderRadius: '6px',
                boxShadow: '0.5px 0.5px 3px rgba(0,0,0,0.4)',
                transform: 'translateZ(0)', // Force GPU acceleration
                willChange: 'transform', // Hint for browser optimization
              }}
            >
              {/* Optimized Image with proper loading strategy */}
              <Image
                src={slide.image || '/NoImage.webp'}
                alt={slide.title}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                style={{
                  objectFit: 'cover',
                }}
                priority={idx === 0}
                loading={idx === 0 ? 'eager' : 'lazy'}
                quality={75} // Reduce quality for better performance
              />
              
              {/* Simplified gradient overlay - use CSS class instead of inline style */}
              <div className="gradient-overlay" />
              
              {/* Content with inline styles minimized */}
              <div className="slide-content-wrapper">
                <div className="slide-text-content">
                  <h3 className="slide-title">
                    {slide.title}
                  </h3>
                  <p className="slide-subtitle">
                    {slide.subtitle}
                  </p>
                </div>

                {/* Optimized CTA Button */}
                <button 
                  className="cta-button"
                  {...buttonHoverHandlers}
                  onClick={() => handleCTAClick(slide.cta)}
                  aria-label={slide.cta}
                >
                  <span>{slide.cta}</span>
                  <ArrowRight className="arrow-icon" />
                </button>
              </div>
              
              {/* Slide Number */}
              <div className="slide-number">
                <span>{idx + 1}</span>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Navigation Buttons */}
      <button 
        className="nav-button prev-button"
        onClick={handlePrevClick}
        aria-label="Previous slide"
      >
        <ChevronLeft className="nav-icon" />
      </button>
      
      <button 
        className="nav-button next-button"
        onClick={handleNextClick}
        aria-label="Next slide"
      >
        <ChevronRight className="nav-icon" />
      </button>

      {/* Optimized Global Styles */}
      <style jsx global>{`
        .hero-carousel {
          font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        }
        
        .swiper {
          width: 100%;
          padding-top: ${isMobile ? '8px' : '15px'} !important;
          padding-bottom: ${isMobile ? '25px' : '35px'} !important;
        }
        
        .swiper-wrapper {
          align-items: center;
          padding: ${isMobile ? '4px 0' : '8px 0'};
        }
        
        .swiper-slide {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* Reduced transition time */
          opacity: 0.7;
          transform: scale(0.92) translateZ(0); /* GPU acceleration */
          filter: brightness(0.85);
          will-change: transform, opacity; /* Performance hint */
        }
        
        .swiper-slide-active {
          opacity: 1;
          transform: scale(1) translateZ(0);
          filter: brightness(1);
          z-index: 10;
        }
        
        /* Consolidated styles for slide content */
        .gradient-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 70%);
          pointer-events: none; /* Improve performance */
        }
        
        .slide-content-wrapper {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          color: white;
          z-index: 10;
        }
        
        .slide-text-content {
          flex: 1;
          padding-top: 1rem;
        }
        
        .slide-title {
          font-weight: 700;
          font-size: ${isMobile ? '16px' : '20px'};
          margin-bottom: 0.5rem;
          line-height: 1.2;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
          letter-spacing: -0.3px;
        }
        
        .slide-subtitle {
          opacity: 0.9;
          font-size: ${isMobile ? '12px' : '14px'};
          line-height: 1.5;
          font-weight: 400;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.6);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .cta-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%);
          color: #000;
          font-weight: 600;
          font-size: ${isMobile ? '13px' : '14px'};
          letter-spacing: 0.3px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3);
          border: 1px solid rgba(255,255,255,0.2);
          outline: none;
          cursor: pointer;
          backdrop-filter: blur(10px);
          margin-top: auto;
          margin-bottom: 8px;
          transition: all 0.2s ease;
          width: fit-content;
          transform: translateZ(0);
          will-change: transform, box-shadow;
        }
        
        .cta-button:hover {
          background: linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.95) 100%);
          box-shadow: 0 6px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3);
        }
        
        .cta-button:active {
          transform: scale(0.98);
        }
        
        .arrow-icon {
          width: 14px;
          height: 14px;
          stroke-width: 2.5px;
          transition: transform 0.2s ease;
        }
        
        .cta-button:hover .arrow-icon {
          transform: translateX(2px);
        }
        
        .slide-number {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(4px);
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          width: ${isMobile ? '28px' : '32px'};
          height: ${isMobile ? '28px' : '32px'};
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          z-index: 20;
          transition: background-color 0.2s ease;
          font-family: 'Segoe UI', monospace;
        }
        
        .slide-number span {
          color: white;
          font-weight: 700;
          font-size: ${isMobile ? '12px' : '14px'};
        }
        
        .slide-content:hover .slide-number {
          background: rgba(0,0,0,0.4);
        }
        
        /* Navigation buttons */
        .nav-button {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 50;
          background: rgba(0,0,0,0.2);
          backdrop-filter: blur(4px);
          padding: ${isMobile ? '0.5rem' : '0.625rem'};
          border-radius: 9999px;
          border: 1px solid rgba(255,255,255,0.1);
          outline: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          line-height: 0;
        }
        
        .nav-button:hover {
          background: rgba(0,0,0,0.4);
        }
        
        .nav-button:active {
          transform: translateY(-50%) scale(0.95);
        }
        
        .nav-button.prev-button {
          left: ${isMobile ? '0.25rem' : '0.5rem'};
        }
        
        .nav-button.next-button {
          right: ${isMobile ? '0.25rem' : '0.5rem'};
        }
        
        .nav-icon {
          width: ${isMobile ? '16px' : '20px'};
          height: ${isMobile ? '16px' : '20px'};
          color: white;
          stroke-width: 2.5px;
          transition: transform 0.2s ease;
        }
        
        .nav-button.prev-button:hover .nav-icon {
          transform: translateX(-2px);
        }
        
        .nav-button.next-button:hover .nav-icon {
          transform: translateX(2px);
        }
        
        .nav-button.swiper-button-disabled {
          opacity: 0.15;
          pointer-events: none;
        }
        
        /* Mobile optimizations */
        @media (max-width: 767px) {
          .swiper-3d .swiper-slide-shadow-left,
          .swiper-3d .swiper-slide-shadow-right {
            background-image: none !important;
          }
          
          .swiper-slide {
            height: auto !important;
            min-height: 200px;
          }
        }
        
        /* Coverflow effect adjustments */
        .swiper-3d {
          perspective: ${isMobile ? '1000px' : '1200px'} !important;
        }
        
        .swiper-slide-shadow-left,
        .swiper-slide-shadow-right {
          background-image: linear-gradient(
            to right,
            rgba(0, 0, 0, 0.15),
            rgba(0, 0, 0, 0)
          ) !important;
          border-radius: 6px;
        }
        
        /* Smooth transitions */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </div>
  );
};

export default HeroCarousel3D;
