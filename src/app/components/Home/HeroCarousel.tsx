// components/HeroCarousel3D.tsx
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image'; // Add this import
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
        }}
        loop={true}
        navigation={{
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        }}
        coverflowEffect={{
          rotate: 0,
          stretch: isMobile ? 10 : 18,
          depth: isMobile ? 150 : 180,
          modifier: isMobile ? 3.5 : 3.8,
          slideShadows: false,
        }}
        modules={[Autoplay, EffectCoverflow, Navigation]}
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
              className={`relative rounded-lg overflow-hidden ${slide.bgColor} transition-all duration-300 hover:scale-[1.02] hover:z-10 group`}
              style={{
                width: '100%',
                aspectRatio: '4 / 3',
                overflow: 'hidden',
                borderRadius: '6px',
                boxShadow: '0.5px 0.5px 3px rgba(0,0,0,0.4)'
              }}
            >
              {/* Background Image - Updated to use next/image */}
              <Image
                src={slide.image || '/NoImage.webp'}
                alt={slide.title}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                style={{
                  objectFit: 'cover',
                }}
                priority={idx === 0}
              />
              
              {/* Gradient Overlay - More subtle */}
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 70%)'
                }}
              />
              
              {/* Content with better spacing */}
              <div 
                className="absolute inset-0 flex flex-col justify-between p-4 md:p-5 text-white z-10"
                style={{
                  fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
                }}
              >
                {/* Top Content */}
                <div className="flex-1 pt-4">
                  <h3 
                    className="font-bold mb-2 leading-tight"
                    style={{
                      fontSize: isMobile ? '16px' : '20px',
                      fontWeight: 700,
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                      fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                      letterSpacing: '-0.3px'
                    }}
                  >
                    {slide.title}
                  </h3>
                  <p 
                    className="opacity-90 mb-3"
                    style={{
                      fontSize: isMobile ? '12px' : '14px',
                      lineHeight: '1.5',
                      fontWeight: 400,
                      textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
                      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {slide.subtitle}
                  </p>
                </div>

                {/* CTA Button - Modern Style */}
                <button 
                  className="group/btn inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] w-fit"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
                    color: '#000',
                    fontWeight: 600,
                    fontSize: isMobile ? '13px' : '14px',
                    letterSpacing: '0.3px',
                    fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    outline: 'none',
                    cursor: 'pointer',
                    backdropFilter: 'blur(10px)',
                    marginTop: 'auto',
                    marginBottom: '8px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.95) 100%)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)';
                  }}
                  onClick={() => console.log('Clicked:', slide.cta)}
                >
                  <span style={{ fontWeight: 600 }}>{slide.cta}</span>
                  <ArrowRight 
                    className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-1" 
                    style={{ 
                      strokeWidth: '2.5px',
                      marginLeft: '2px'
                    }}
                  />
                </button>
              </div>
              
              {/* Slide Number - Modern Design */}
              <div 
                className="absolute top-3 right-3 bg-black/30 backdrop-blur-md rounded-lg flex items-center justify-center z-20 group-hover:bg-black/40 transition-colors duration-300"
                style={{
                  width: isMobile ? '28px' : '32px',
                  height: isMobile ? '28px' : '32px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontFamily: "'Segoe UI', monospace"
                }}
              >
                <span 
                  className="text-white font-bold"
                  style={{
                    fontSize: isMobile ? '12px' : '14px',
                    fontWeight: 700
                  }}
                >
                  {idx + 1}
                </span>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Navigation Buttons - More subtle */}
      <button 
        className="swiper-button-prev absolute left-1 md:left-2 top-1/2 transform -translate-y-1/2 z-50 bg-black/20 backdrop-blur-sm p-2 md:p-2.5 rounded-full hover:bg-black/40 transition-all duration-200 active:scale-95 group/nav"
        style={{
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.1)',
          outline: 'none',
          cursor: 'pointer',
          fontFamily: "'Segoe UI', sans-serif"
        }}
      >
        <ChevronLeft 
          className="w-4 h-4 md:w-5 md:h-5 text-white transition-transform duration-200 group-hover/nav:-translate-x-0.5" 
          style={{ strokeWidth: '2.5px' }}
        />
      </button>
      
      <button 
        className="swiper-button-next absolute right-1 md:right-2 top-1/2 transform -translate-y-1/2 z-50 bg-black/20 backdrop-blur-sm p-2 md:p-2.5 rounded-full hover:bg-black/40 transition-all duration-200 active:scale-95 group/nav"
        style={{
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.1)',
          outline: 'none',
          cursor: 'pointer',
          fontFamily: "'Segoe UI', sans-serif"
        }}
      >
        <ChevronRight 
          className="w-4 h-4 md:w-5 md:h-5 text-white transition-transform duration-200 group-hover/nav:translate-x-0.5" 
          style={{ strokeWidth: '2.5px' }}
        />
      </button>

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
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
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
        
        /* Navigation buttons */
        .swiper-button-disabled {
          opacity: 0.15;
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
