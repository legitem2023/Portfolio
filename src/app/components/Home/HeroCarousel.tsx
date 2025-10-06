// components/HeroCarousel.tsx
import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  cta: string;
  bgColor: string;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ slides }) => {
  return (
    <section className="relative z-10">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        spaceBetween={0}
        slidesPerView={1}
        navigation={{
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        }}
        pagination={{ 
          clickable: true,
          dynamicBullets: true 
        }}
        autoplay={{ delay: 5000 }}
        effect="fade"
        loop={true}
        className="w-full"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id} className={`relative ${slide.bgColor} text-white`}>
            <div className="absolute inset-0 bg-black opacity-40"></div>
            <img 
              src={slide.image} 
              alt={slide.title}
              className="w-full h-full object-cover aspect-[4/3] md:aspect-[16/9]"
            />
            <div className="absolute inset-0 flex items-center justify-end">
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-8 text-white">
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight drop-shadow-md">
                  {slide.title}
                </h1>
                <p className="text-sm md:text-lg mt-2 md:mt-4 opacity-90 max-w-2xl drop-shadow-md">
                  {slide.subtitle}
                </p>
                <button className="mt-4 md:mt-6 px-6 py-2 md:px-8 md:py-3 bg-white text-black font-medium rounded-full text-sm md:text-base w-fit hover:bg-opacity-90 transition-all transform hover:scale-105">
                  {slide.cta}
                </button>
              </div>        
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default HeroCarousel;
