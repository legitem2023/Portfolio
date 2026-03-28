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

  // Dynamic styles based on isMobile
  const containerStyle = useMemo(() => ({
    width: "100%",
    position: "relative" as const,
    padding: isMobile ? "10px" : "15px",
    fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    height: "auto", // Remove fixed height
    minHeight: "auto" // Ensure no minimum height constraint
  }), [isMobile]);

  const swiperStyle = useMemo(() => ({
    width: "100%",
    paddingTop: isMobile ? '8px' : '15px',
    paddingBottom: isMobile ? '25px' : '35px',
    height: "auto" // Remove fixed height from swiper container
  }), [isMobile]);

  const swiperWrapperStyle = useMemo(() => ({
    alignItems: "center",
    padding: isMobile ? '4px 0' : '8px 0',
    height: "auto" // Ensure wrapper doesn't constrain height
  }), [isMobile]);

  const slideTitleStyle = useMemo(() => ({
    fontWeight: 700,
    fontSize: isMobile ? '16px' : '20px',
    marginBottom: '0.5rem',
    lineHeight: 1.2,
    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
    letterSpacing: '-0.3px',
    color: 'white'
  }), [isMobile]);

  const slideSubtitleStyle = useMemo(() => ({
    opacity: 0.9,
    fontSize: isMobile ? '12px' : '14px',
    lineHeight: 1.5,
    fontWeight: 400,
    textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
    color: 'white'
  }), [isMobile]);

  const ctaButtonStyle = useMemo(() => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    borderRadius: '9999px',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
    color: '#000',
    fontWeight: 600,
    fontSize: isMobile ? '13px' : '14px',
    letterSpacing: '0.3px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
    border: '1px solid rgba(255,255,255,0.2)',
    outline: 'none',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
    marginTop: 'auto',
    marginBottom: '8px',
    transition: 'all 0.2s ease',
    width: 'fit-content',
    transform: 'translateZ(0)',
    willChange: 'transform, box-shadow'
  }), [isMobile]);

  const arrowIconStyle = {
    width: '14px',
    height: '14px',
    strokeWidth: '2.5px',
    transition: 'transform 0.2s ease'
  };

  const slideNumberStyle = useMemo(() => ({
    position: 'absolute' as const,
    top: '0.75rem',
    right: '0.75rem',
    background: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(4px)',
    borderRadius: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: isMobile ? '28px' : '32px',
    height: isMobile ? '28px' : '32px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    zIndex: 20,
    transition: 'background-color 0.2s ease',
    fontFamily: "'Segoe UI', monospace"
  }), [isMobile]);

  const slideNumberSpanStyle = {
    color: 'white',
    fontWeight: 700,
    fontSize: isMobile ? '12px' : '14px'
  };

  const navButtonStyle = useMemo(() => ({
    position: 'absolute' as const,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 50,
    background: 'rgba(0,0,0,0.2)',
    backdropFilter: 'blur(4px)',
    padding: isMobile ? '0.5rem' : '0.625rem',
    borderRadius: '9999px',
    border: '1px solid rgba(255,255,255,0.1)',
    outline: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
    lineHeight: 0
  }), [isMobile]);

  const prevButtonStyle = useMemo(() => ({
    ...navButtonStyle,
    left: isMobile ? '0.25rem' : '0.5rem'
  }), [navButtonStyle, isMobile]);

  const nextButtonStyle = useMemo(() => ({
    ...navButtonStyle,
    right: isMobile ? '0.25rem' : '0.5rem'
  }), [navButtonStyle, isMobile]);

  const navIconStyle = useMemo(() => ({
    width: isMobile ? '16px' : '20px',
    height: isMobile ? '16px' : '20px',
    color: 'white',
    strokeWidth: '2.5px',
    transition: 'transform 0.2s ease'
  }), [isMobile]);

  const gradientOverlayStyle = {
    position: 'absolute' as const,
    inset: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 70%)',
    pointerEvents: 'none' as const
  };

  const slideContentWrapperStyle = {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between' as const,
    padding: '1rem 1.25rem',
    color: 'white',
    zIndex: 10
  };

  const slideTextContentStyle = {
    flex: 1,
    paddingTop: '1rem'
  };

  // CSS for Swiper elements that can't be inlined
  useEffect(() => {
    // Add style tag for Swiper-specific styles that need to be global
    const style = document.createElement('style');
    style.textContent = `
      .swiper {
        height: auto !important;
      }
      
      .swiper-wrapper {
        height: auto !important;
      }
      
      .swiper-slide {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        opacity: 0.7;
        transform: scale(0.92) translateZ(0);
        filter: brightness(0.85);
        will-change: transform, opacity;
        height: auto !important;
      }
      
      .swiper-slide-active {
        opacity: 1;
        transform: scale(1) translateZ(0);
        filter: brightness(1);
        z-index: 10;
      }
      
      .cta-button:hover .arrow-icon {
        transform: translateX(2px);
      }
      
      .slide-content:hover .slide-number {
        background: rgba(0,0,0,0.4);
      }
      
      .nav-button:hover {
        background: rgba(0,0,0,0.4);
      }
      
      .nav-button:active {
        transform: translateY(-50%) scale(0.95);
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
      
      * {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
    `;
    
    // Add mobile-specific styles
    if (isMobile) {
      const mobileStyle = document.createElement('style');
      mobileStyle.textContent = `
        @media (max-width: 767px) {
          .swiper-3d .swiper-slide-shadow-left,
          .swiper-3d .swiper-slide-shadow-right {
            background-image: none !important;
          }
          
          .swiper-slide {
            min-height: 200px;
          }
        }
      `;
      document.head.appendChild(mobileStyle);
      return () => {
        if (document.head.contains(mobileStyle)) {
          document.head.removeChild(mobileStyle);
        }
      };
    }
    
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [isMobile]);

  return (
    <div style={containerStyle}>
      <Swiper
        ref={swiperRef}
        effect="coverflow"
        centeredSlides={true}
        slidesPerView={isMobile ? 2.5 : 3}
        spaceBetween={isMobile ? 5 : 12}
        autoplay={{ 
          delay: 2500, 
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        loop={true}
        navigation={false}
        coverflowEffect={coverflowEffect}
        modules={[Autoplay, EffectCoverflow]}
        style={swiperStyle}
        breakpoints={breakpoints}
        grabCursor={true}
        speed={400}
        watchSlidesProgress={true}
      >
        {visibleSlides.map((slide, idx) => (
          <SwiperSlide
            key={slide.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0px',
              backgroundColor: 'transparent',
              height: 'auto'
            }}
          >
            <div 
              className={`slide-content ${slide.bgColor}`}
              style={{
                width: '100%',
                overflow: 'hidden',
                borderRadius: '6px',
                boxShadow: '0.5px 0.5px 3px rgba(0,0,0,0.4)',
                transform: 'translateZ(0)',
                willChange: 'transform',
                position: 'relative',
                aspectRatio: '16/9'
              }}
            >
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
                quality={75}
              />
              
              <div style={gradientOverlayStyle} />
              
              <div style={slideContentWrapperStyle}>
                <div style={slideTextContentStyle}>
                  <h3 style={slideTitleStyle}>
                    {slide.title}
                  </h3>
                  <p style={slideSubtitleStyle}>
                    {slide.subtitle}
                  </p>
                </div>

                <button 
                  className="cta-button"
                  style={ctaButtonStyle}
                  {...buttonHoverHandlers}
                  onClick={() => handleCTAClick(slide.cta)}
                  aria-label={slide.cta}
                >
                  <span>{slide.cta}</span>
                  <ArrowRight className="arrow-icon" style={arrowIconStyle} />
                </button>
              </div>
              
              <div style={slideNumberStyle}>
                <span style={slideNumberSpanStyle}>{idx + 1}</span>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <button 
        className="nav-button prev-button"
        style={prevButtonStyle}
        onClick={handlePrevClick}
        aria-label="Previous slide"
      >
        <ChevronLeft className="nav-icon" style={navIconStyle} />
      </button>
      
      <button 
        className="nav-button next-button"
        style={nextButtonStyle}
        onClick={handleNextClick}
        aria-label="Next slide"
      >
        <ChevronRight className="nav-icon" style={navIconStyle} />
      </button>
    </div>
  );
};

export default HeroCarousel3D;
