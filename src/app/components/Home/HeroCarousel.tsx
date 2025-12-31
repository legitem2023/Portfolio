// components/HeroCarousel3D.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectCoverflow } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div 
      className="card" 
      style={{ 
        width: "100%", 
        position: "relative", 
        padding: isMobile ? "10px" : "15px",
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
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
          pauseOnMouseEnter: true 
        }}
        loop={true}
        navigation={{
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        }}
        pagination={{ 
          dynamicBullets: true,
          clickable: true 
        }}
        coverflowEffect={{
          rotate: 0,
          stretch: isMobile ? 10 : 18,
          depth: isMobile ? 150 : 180,
          modifier: isMobile ? 3.5 : 3.8,
          slideShadows: false,
        }}
        modules={[Autoplay, EffectCoverflow, Pagination, Navigation]}
        style={{ width: "100%" }}
        breakpoints={{
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
        }}
      >
        {slides.slice(0, 5).map((slide, idx) => (
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
              className={`relative rounded-lg overflow-hidden ${slide.bgColor} transition-all duration-300 hover:scale-[1.02] hover:z-10`}
              style={{
                width: '100%',
                aspectRatio: '4 / 3',
                overflow: 'hidden',
                borderRadius: '6px',
                boxShadow: '0.5px 0.5px 3px rgba(0,0,0,0.4)'
              }}
            >
              {/* Background Image */}
              <img
                src={slide.image}
                alt={slide.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              
              {/* Gradient Overlay */}
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 30%, transparent 60%)'
                }}
              />
              
              {/* Content */}
              <div 
                className="absolute inset-0 flex flex-col justify-end p-3 md:p-4 text-white z-10"
                style={{
                  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                }}
              >
                <div className="transform transition-transform duration-300">
                  <h3 
                    className="font-semibold mb-1"
                    style={{
                      fontSize: isMobile ? '14px' : '16px',
                      lineHeight: '1.3',
                      letterSpacing: '0.2px',
                      fontWeight: 600,
                      textShadow: '1px 1px 2px rgba(0,0,0,0.9)',
                      fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
                    }}
                  >
                    {slide.title}
                  </h3>
                  <p 
                    className="opacity-95 mb-2"
                    style={{
                      fontSize: isMobile ? '11px' : '13px',
                      lineHeight: '1.4',
                      letterSpacing: '0.1px',
                      fontWeight: 400,
                      textShadow: '0.5px 0.5px 1px rgba(0,0,0,0.7)',
                      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {slide.subtitle}
                  </p>
                  <button 
                    className="px-3 py-1.5 bg-white text-black font-medium rounded-full hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 active:scale-95"
                    style={{
                      fontSize: isMobile ? '11px' : '12px',
                      letterSpacing: '0.3px',
                      fontWeight: 500,
                      fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                      boxShadow: '0.5px 0.5px 2px rgba(0,0,0,0.3)',
                      border: 'none',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                  >
                    {slide.cta}
                  </button>
                </div>
              </div>
              
              {/* Slide Number */}
              <div 
                className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center z-20"
                style={{
                  width: isMobile ? '22px' : '26px',
                  height: isMobile ? '22px' : '26px',
                  boxShadow: '0.5px 0.5px 2px rgba(0,0,0,0.5)',
                  fontFamily: "'Segoe UI', monospace"
                }}
              >
                <span 
                  className="text-white"
                  style={{
                    fontSize: isMobile ? '11px' : '12px',
                    fontWeight: 600
                  }}
                >
                  {idx + 1}
                </span>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Navigation Buttons */}
      <button 
        className="swiper-button-prev absolute left-1 md:left-2 top-1/2 transform -translate-y-1/2 z-50 bg-black/40 backdrop-blur-sm p-1.5 md:p-2 rounded-full hover:bg-black/60 transition-all duration-200 active:scale-95"
        style={{
          boxShadow: '0.5px 0.5px 3px rgba(0,0,0,0.5)',
          border: 'none',
          outline: 'none',
          cursor: 'pointer',
          fontFamily: "'Segoe UI', sans-serif"
        }}
      >
        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-white" />
      </button>
      
      <button 
        className="swiper-button-next absolute right-1 md:right-2 top-1/2 transform -translate-y-1/2 z-50 bg-black/40 backdrop-blur-sm p-1.5 md:p-2 rounded-full hover:bg-black/60 transition-all duration-200 active:scale-95"
        style={{
          boxShadow: '0.5px 0.5px 3px rgba(0,0,0,0.5)',
          border: 'none',
          outline: 'none',
          cursor: 'pointer',
          fontFamily: "'Segoe UI', sans-serif"
        }}
      >
        <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
      </button>

      {/* Slide Indicator Dots */}
      <div 
        className="flex justify-center mt-3 md:mt-4 space-x-1.5"
        style={{
          fontFamily: "'Segoe UI', sans-serif"
        }}
      >
        {slides.slice(0, 5).map((_, index) => (
          <button
            key={index}
            onClick={() => swiperRef.current?.swiper.slideTo(index)}
            className="rounded-full transition-colors duration-200"
            style={{
              width: isMobile ? '6px' : '8px',
              height: isMobile ? '6px' : '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.4)',
              border: 'none',
              outline: 'none',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.4)'}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Global Styles for Swiper */}
      <style jsx global>{`
        .swiper {
          width: 100%;
          padding-top: ${isMobile ? '8px' : '15px'} !important;
          padding-bottom: ${isMobile ? '25px' : '35px'} !important;
          font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        }
        
        .swiper-wrapper {
          align-items: center;
          padding: ${isMobile ? '4px 0' : '8px 0'};
        }
        
        .swiper-slide {
          transition: all 0.3s ease;
          opacity: 0.7;
          transform: scale(0.92);
          filter: brightness(0.85);
        }
        
        .swiper-slide-active {
          opacity: 1;
          transform: scale(1);
          filter: brightness(1);
          z-index: 10 !important;
        }
        
        .swiper-slide-next,
        .swiper-slide-prev {
          opacity: 0.85;
          transform: scale(0.96);
          filter: brightness(0.9);
          z-index: 5 !important;
        }
        
        /* Pagination bullets */
        .swiper-pagination {
          bottom: ${isMobile ? '4px' : '8px'} !important;
        }
        
        .swiper-pagination-bullet {
          background: rgba(255, 255, 255, 0.5) !important;
          opacity: 1 !important;
          width: ${isMobile ? '5px' : '7px'} !important;
          height: ${isMobile ? '5px' : '7px'} !important;
          transition: all 0.2s ease !important;
        }
        
        .swiper-pagination-bullet-active {
          background: white !important;
          transform: scale(1.4);
          box-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
        }
        
        /* Navigation buttons */
        .swiper-button-disabled {
          opacity: 0.2;
          pointer-events: none;
        }
        
        /* Remove default navigation styles */
        .swiper-button-next:after,
        .swiper-button-prev:after {
          content: none !important;
        }
        
        /* Mobile optimizations */
        @media (max-width: 767px) {
          .swiper-3d .swiper-slide-shadow-left,
          .swiper-3d .swiper-slide-shadow-right {
            background-image: none !important;
          }
          
          .swiper-slide {
            height: auto !important;
            min-height: 180px;
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
        
        /* Consistent font sizing */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </div>
  );
};

export default HeroCarousel3D;
