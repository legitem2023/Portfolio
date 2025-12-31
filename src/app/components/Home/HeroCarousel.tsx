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

  // Calculate responsive values
  const getCoverflowConfig = () => {
    if (isMobile) {
      return {
        slidesPerView: 1.5, // Shows ~1.5 slides at once for mobile
        spaceBetween: 8,
        coverflow: {
          rotate: 25,
          stretch: -40,
          depth: 80,
          modifier: 1.8,
          slideShadows: false, // Disable shadows on mobile for performance
        }
      };
    }
    
    return {
      slidesPerView: 2.2, // Shows ~2.2 slides at once for desktop
      spaceBetween: 20,
      coverflow: {
        rotate: 30,
        stretch: -50,
        depth: 150,
        modifier: 2,
        slideShadows: true,
      }
    };
  };

  const config = getCoverflowConfig();

  return (
    <section className="relative z-10 py-4 md:py-12 bg-gradient-to-b from-gray-900/10 to-gray-900/30">
      <div className="relative w-full overflow-visible px-2 md:px-8">
        {/* Main 3D Coverflow Carousel */}
        <Swiper
          ref={swiperRef}
          modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
          effect="coverflow"
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={config.slidesPerView}
          spaceBetween={config.spaceBetween}
          coverflowEffect={config.coverflow}
          navigation={{
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          }}
          pagination={{ 
            clickable: true,
            dynamicBullets: true,
            type: 'bullets',
            dynamicMainBullets: 5, // Always show 5 bullets
          }}
          autoplay={{ 
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          loop={true}
          
          breakpoints={{
            320: {
              slidesPerView: 1.4,
              spaceBetween: 8,
              coverflowEffect: {
                rotate: 20,
                stretch: -30,
                depth: 60,
                modifier: 1.5,
                slideShadows: false,
              }
            },
            480: {
              slidesPerView: 1.5,
              spaceBetween: 10,
              coverflowEffect: {
                rotate: 25,
                stretch: -35,
                depth: 70,
                modifier: 1.6,
                slideShadows: false,
              }
            },
            768: {
              slidesPerView: 2.0,
              spaceBetween: 15,
              coverflowEffect: {
                rotate: 30,
                stretch: -45,
                depth: 120,
                modifier: 1.8,
                slideShadows: true,
              }
            },
            1024: {
              slidesPerView: 2.2,
              spaceBetween: 20,
              coverflowEffect: {
                rotate: 30,
                stretch: -50,
                depth: 150,
                modifier: 2,
                slideShadows: true,
              }
            }
          }}
          className="w-full h-[300px] sm:h-[350px] md:h-[500px] lg:h-[600px]"
        >
          {slides.slice(0, 5).map((slide) => (
            <SwiperSlide key={slide.id} className="group">
              <div className={`relative rounded-xl md:rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl ${slide.bgColor} text-white transition-all duration-500 transform group-hover:scale-[1.02] group-hover:z-20`}>
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-transparent z-10"></div>
                
                {/* Image */}
                <img 
                  src={slide.image} 
                  alt={slide.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                
                {/* Content */}
                <div className="absolute inset-0 z-20 flex flex-col justify-end p-4 md:p-6 lg:p-8">
                  <div className="transform transition-all duration-500 group-hover:translate-y-[-5px]">
                    <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold tracking-tight drop-shadow-2xl mb-1 md:mb-2 lg:mb-4">
                      {slide.title}
                    </h1>
                    <p className="text-xs sm:text-sm md:text-base lg:text-lg opacity-95 mb-2 md:mb-4 lg:mb-6 drop-shadow-lg line-clamp-2 md:line-clamp-3">
                      {slide.subtitle}
                    </p>
                    <button className="px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 lg:px-6 lg:py-3 bg-white/95 text-black font-semibold rounded-full text-xs sm:text-sm md:text-base w-fit hover:bg-white transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl backdrop-blur-sm">
                      {slide.cta}
                    </button>
                  </div>
                </div>

                {/* Slide number indicator (for 5 slides) */}
                <div className="absolute top-3 right-3 z-30 bg-black/40 backdrop-blur-sm rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
                  <span className="text-white font-bold text-sm md:text-base">
                    {slide.id}
                  </span>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Navigation Buttons */}
        <button className="swiper-button-prev absolute left-1 sm:left-2 md:left-4 top-1/2 transform -translate-y-1/2 z-50 bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-full hover:bg-white/30 transition-all duration-300 group active:scale-95">
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-white group-hover:scale-110 transition-transform" />
        </button>
        
        <button className="swiper-button-next absolute right-1 sm:right-2 md:right-4 top-1/2 transform -translate-y-1/2 z-50 bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-full hover:bg-white/30 transition-all duration-300 group active:scale-95">
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-white group-hover:scale-110 transition-transform" />
        </button>

        {/* Slide Counter */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 hidden md:flex items-center space-x-2">
          <span className="text-white text-sm font-medium">
            {slides.slice(0, 5).length} Slides
          </span>
        </div>
      </div>

      {/* Mini Preview (for mobile) */}
      <div className="md:hidden mt-6 px-4">
        <div className="flex justify-center space-x-2">
          {slides.slice(0, 5).map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => swiperRef.current?.swiper.slideTo(index)}
              className="w-3 h-3 rounded-full bg-gray-400 hover:bg-white transition-colors"
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* CSS for 3D effects */}
      <style jsx global>{`
        .swiper-3d {
          perspective: ${isMobile ? '1000px' : '1500px'} !important;
        }
        
        .swiper-slide {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          filter: brightness(0.7) saturate(0.9);
          transform-origin: center center;
          backface-visibility: hidden;
        }
        
        .swiper-slide-active {
          filter: brightness(1) saturate(1.1);
          z-index: 10 !important;
          transform: scale(1.05) !important;
        }
        
        .swiper-slide-next,
        .swiper-slide-prev {
          filter: brightness(0.8) saturate(1);
          z-index: 5 !important;
        }
        
        .swiper-slide-next + .swiper-slide,
        .swiper-slide-prev + .swiper-slide {
          filter: brightness(0.6) saturate(0.8);
        }
        
        .swiper-pagination {
          bottom: 10px !important;
        }
        
        .swiper-pagination-bullet {
          background: rgba(255, 255, 255, 0.5);
          opacity: 1;
          width: 8px;
          height: 8px;
          transition: all 0.3s ease;
          margin: 0 4px !important;
        }
        
        .swiper-pagination-bullet-active {
          background: white;
          transform: scale(1.3);
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
        }
        
        .swiper-slide-shadow-left,
        .swiper-slide-shadow-right {
          background-image: linear-gradient(
            to right,
            rgba(0, 0, 0, 0.3),
            rgba(0, 0, 0, 0)
          ) !important;
          border-radius: 12px;
        }
        
        /* Mobile optimizations */
        @media (max-width: 767px) {
          .swiper {
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
          
          .swiper-3d .swiper-slide-shadow-left,
          .swiper-3d .swiper-slide-shadow-right {
            background-image: none !important;
          }
          
          .swiper-slide {
            height: 250px !important;
          }
          
          .swiper-slide-active {
            height: 280px !important;
          }
        }
        
        /* Desktop enhancements */
        @media (min-width: 1024px) {
          .swiper-slide {
            height: 500px !important;
          }
          
          .swiper-slide-active {
            height: 520px !important;
          }
        }
        
        /* Accessibility improvements */
        .swiper-slide:focus-visible {
          outline: 2px solid white;
          outline-offset: 4px;
          border-radius: 12px;
        }
        
        /* Smooth transitions */
        .swiper-wrapper {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </section>
  );
};

export default HeroCarousel3D;
