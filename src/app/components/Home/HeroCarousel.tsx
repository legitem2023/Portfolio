// components/HeroCarousel3D.tsx
import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <section className="relative z-10 py-8 md:py-12">
      <div className="relative w-full overflow-visible">
        <Swiper
          modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
          effect="coverflow"
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={isMobile ? 1.2 : 1.5}
          spaceBetween={isMobile ? 10 : 30}
          coverflowEffect={{
            rotate: isMobile ? 20 : 25,
            stretch: isMobile ? -30 : 0,
            depth: isMobile ? 50 : 100,
            modifier: isMobile ? 1.5 : 2,
            slideShadows: true,
          }}
          navigation={{
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          }}
          pagination={{ 
            clickable: true,
            dynamicBullets: true,
            type: 'bullets'
          }}
          autoplay={{ 
            delay: 5000,
            disableOnInteraction: false 
          }}
          loop={true}
          className="w-full h-[400px] md:h-[600px]"
          style={{
            padding: isMobile ? '20px 0' : '40px 0',
          }}
        >
          {slides.map((slide) => (
            <SwiperSlide key={slide.id} className="group">
              <div className={`relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl ${slide.bgColor} text-white transition-all duration-500 transform group-hover:scale-[1.02]`}>
                <div className="absolute inset-0 bg-black/20 z-10"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-black/20 z-20"></div>
                
                {/* Glossy overlay effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/5 via-transparent to-transparent z-30 pointer-events-none"></div>
                
                <img 
                  src={slide.image} 
                  alt={slide.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                
                {/* Content overlay */}
                <div className="absolute inset-0 z-40 flex flex-col justify-end p-6 md:p-8">
                  <div className="transform transition-transform duration-500 group-hover:translate-y-[-8px]">
                    <h1 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight drop-shadow-2xl mb-2 md:mb-4">
                      {slide.title}
                    </h1>
                    <p className="text-sm md:text-base lg:text-lg opacity-95 mb-4 md:mb-6 drop-shadow-lg max-w-lg">
                      {slide.subtitle}
                    </p>
                    <button className="px-5 py-2 md:px-7 md:py-3 bg-white text-black font-semibold rounded-full text-sm md:text-base w-fit hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl">
                      {slide.cta}
                    </button>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom Navigation Buttons */}
        <button className="swiper-button-prev absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 z-50 bg-white/20 backdrop-blur-sm p-3 rounded-full hover:bg-white/30 transition-all duration-300 group">
          <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-white group-hover:scale-110 transition-transform" />
        </button>
        
        <button className="swiper-button-next absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 z-50 bg-white/20 backdrop-blur-sm p-3 rounded-full hover:bg-white/30 transition-all duration-300 group">
          <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-white group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* CSS for 3D effects */}
      <style jsx global>{`
        .swiper-3d {
          perspective: ${isMobile ? '800px' : '1200px'} !important;
        }
        
        .swiper-slide {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          filter: brightness(0.85);
        }
        
        .swiper-slide-active {
          filter: brightness(1);
          z-index: 10 !important;
        }
        
        .swiper-slide-next,
        .swiper-slide-prev {
          filter: brightness(0.7);
        }
        
        .swiper-pagination-bullet {
          background: rgba(255, 255, 255, 0.5);
          opacity: 1;
          width: ${isMobile ? '8px' : '12px'};
          height: ${isMobile ? '8px' : '12px'};
          transition: all 0.3s ease;
        }
        
        .swiper-pagination-bullet-active {
          background: white;
          transform: scale(1.3);
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
        }
        
        .swiper-slide-shadow-left,
        .swiper-slide-shadow-right {
          background-image: linear-gradient(
            to right,
            rgba(0, 0, 0, 0.3),
            rgba(0, 0, 0, 0)
          ) !important;
          border-radius: 20px;
        }
        
        /* Mobile optimization */
        @media (max-width: 768px) {
          .swiper-3d .swiper-slide-shadow-left,
          .swiper-3d .swiper-slide-shadow-right {
            background-image: none;
          }
          
          .swiper-slide {
            border-radius: 16px;
          }
        }
      `}</style>
    </section>
  );
};

export default HeroCarousel3D;
