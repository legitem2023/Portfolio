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
        padding: isMobile ? "10px" : "20px"
      }}
    >
      <Swiper
        ref={swiperRef}
        effect="coverflow"
        centeredSlides={true}
        slidesPerView={isMobile ? 2.5 : 3}
        spaceBetween={isMobile ? 5 : 15}
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
          stretch: isMobile ? 10 : 20,
          depth: isMobile ? 150 : 200,
          modifier: isMobile ? 3.5 : 4,
          slideShadows: false,
        }}
        modules={[Autoplay, EffectCoverflow, Pagination, Navigation]}
        style={{ width: "100%" }}
        breakpoints={{
          320: {
            slidesPerView: 2.2,
            spaceBetween: 5,
            coverflowEffect: {
              rotate: 0,
              stretch: 5,
              depth: 100,
              modifier: 3,
              slideShadows: false,
            }
          },
          480: {
            slidesPerView: 2.5,
            spaceBetween: 8,
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
            spaceBetween: 12,
            coverflowEffect: {
              rotate: 0,
              stretch: 15,
              depth: 180,
              modifier: 3.8,
              slideShadows: false,
            }
          },
          1024: {
            slidesPerView: 3,
            spaceBetween: 15,
            coverflowEffect: {
              rotate: 0,
              stretch: 20,
              depth: 200,
              modifier: 4,
              slideShadows: false,
            }
          },
          1280: {
            slidesPerView: 3.2,
            spaceBetween: 20,
            coverflowEffect: {
              rotate: 0,
              stretch: 25,
              depth: 250,
              modifier: 4.2,
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
                borderRadius: '8px',
                boxShadow: '0.5px 0.5px 3px #000000'
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
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)'
                }}
              />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6 text-white z-10">
                <div className="transform transition-transform duration-300 group-hover:-translate-y-1">
                  <h3 
                    className="text-base md:text-xl lg:text-2xl font-bold mb-1 md:mb-2"
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                  >
                    {slide.title}
                  </h3>
                  <p 
                    className="text-xs md:text-sm lg:text-base opacity-90 mb-2 md:mb-3 line-clamp-2"
                    style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.6)' }}
                  >
                    {slide.subtitle}
                  </p>
                  <button 
                    className="px-3 py-1.5 md:px-4 md:py-2 bg-white text-black text-xs md:text-sm font-medium rounded-full hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 active:scale-95"
                    style={{
                      boxShadow: '0.5px 0.5px 2px rgba(0,0,0,0.3)'
                    }}
                  >
                    {slide.cta}
                  </button>
                </div>
              </div>
              
              {/* Slide Number */}
              <div 
                className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center z-20"
                style={{
                  boxShadow: '0.5px 0.5px 2px rgba(0,0,0,0.3)'
                }}
              >
                <span className="text-white font-bold text-xs md:text-sm">
                  {idx + 1}
                </span>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Navigation Buttons */}
      <button 
        className="swiper-button-prev absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 z-50 bg-black/30 backdrop-blur-sm p-2 md:p-3 rounded-full hover:bg-black/50 transition-all duration-300 active:scale-95"
        style={{
          boxShadow: '0.5px 0.5px 3px rgba(0,0,0,0.5)'
        }}
      >
        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
      </button>
      
      <button 
        className="swiper-button-next absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 z-50 bg-black/30 backdrop-blur-sm p-2 md:p-3 rounded-full hover:bg-black/50 transition-all duration-300 active:scale-95"
        style={{
          boxShadow: '0.5px 0.5px 3px rgba(0,0,0,0.5)'
        }}
      >
        <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
      </button>

      {/* Slide Indicator Dots */}
      <div className="flex justify-center mt-4 md:mt-6 space-x-2">
        {slides.slice(0, 5).map((_, index) => (
          <button
            key={index}
            onClick={() => swiperRef.current?.swiper.slideTo(index)}
            className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-gray-400 hover:bg-white transition-colors duration-300"
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Global Styles for Swiper */}
      <style jsx global>{`
        .swiper {
          width: 100%;
          padding-top: ${isMobile ? '10px' : '20px'} !important;
          padding-bottom: ${isMobile ? '30px' : '40px'} !important;
        }
        
        .swiper-wrapper {
          align-items: center;
          padding: ${isMobile ? '5px 0' : '10px 0'};
        }
        
        .swiper-slide {
          transition: all 0.4s ease;
          opacity: 0.7;
          transform: scale(0.9);
          filter: brightness(0.8);
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
          transform: scale(0.95);
          filter: brightness(0.9);
          z-index: 5 !important;
        }
        
        /* Pagination bullets */
        .swiper-pagination {
          bottom: ${isMobile ? '5px' : '10px'} !important;
        }
        
        .swiper-pagination-bullet {
          background: rgba(255, 255, 255, 0.6) !important;
          opacity: 1 !important;
          width: ${isMobile ? '6px' : '8px'} !important;
          height: ${isMobile ? '6px' : '8px'} !important;
          transition: all 0.3s ease !important;
        }
        
        .swiper-pagination-bullet-active {
          background: white !important;
          transform: scale(1.3);
          box-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
        }
        
        /* Navigation buttons */
        .swiper-button-disabled {
          opacity: 0.3;
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
          perspective: ${isMobile ? '1200px' : '1500px'} !important;
        }
        
        .swiper-slide-shadow-left,
        .swiper-slide-shadow-right {
          background-image: linear-gradient(
            to right,
            rgba(0, 0, 0, 0.2),
            rgba(0, 0, 0, 0)
          ) !important;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
};

export default HeroCarousel3D;
