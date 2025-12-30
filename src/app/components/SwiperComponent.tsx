import React, { useState, useEffect, useRef } from 'react';
import { Swiper as SwiperType } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Type definitions
export type Category = {
  id: number | string;
  name: string;
  imageUrl: string;
  // Add other category properties as needed
  description?: string;
  slug?: string;
  count?: number;
};

interface SwiperComponentProps {
  // Data props
  initialCategories?: Category[];
  fetchCategories?: () => Promise<Category[]>;
  
  // Swiper configuration props
  slidesPerView?: number | 'auto';
  spaceBetween?: number;
  navigation?: boolean;
  pagination?: boolean | { clickable: boolean };
  autoplay?: boolean | { delay: number; disableOnInteraction: boolean };
  loop?: boolean;
  breakpoints?: Record<number, { slidesPerView: number; spaceBetween: number }>;
  
  // Customization props
  renderSlide: (category: Category, index: number) => React.ReactNode;
  className?: string;
  swiperClassName?: string;
}

const SwiperComponent: React.FC<SwiperComponentProps> = ({
  initialCategories = [],
  fetchCategories,
  slidesPerView = 3,
  spaceBetween = 30,
  navigation = true,
  pagination = false,
  autoplay = false,
  loop = false,
  breakpoints,
  renderSlide,
  className = '',
  swiperClassName = '',
}) => {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isLoading, setIsLoading] = useState<boolean>(!initialCategories.length);
  const [error, setError] = useState<string | null>(null);
  
  const swiperRef = useRef<SwiperType | null>(null);

  // Fetch categories if fetchCategories function is provided
  useEffect(() => {
    const loadCategories = async () => {
      if (fetchCategories && categories.length === 0) {
        setIsLoading(true);
        try {
          const data = await fetchCategories();
          setCategories(data);
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch categories');
          console.error('Error fetching categories:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadCategories();
  }, [fetchCategories, categories.length]);

  // Handle slide change
  const handleSlideChange = () => {
    console.log('Slide changed');
    // Add your slide change logic here
  };

  // Initialize swiper
  const handleSwiperInit = (swiper: SwiperType) => {
    swiperRef.current = swiper;
  };

  // Navigation handlers
  const handleNext = () => {
    if (swiperRef.current) {
      swiperRef.current.slideNext();
    }
  };

  const handlePrev = () => {
    if (swiperRef.current) {
      swiperRef.current.slidePrev();
    }
  };

  // Configuration for swiper
  const swiperConfig = {
    modules: [Navigation, Pagination, ...(autoplay ? [Autoplay] : [])],
    spaceBetween,
    slidesPerView,
    loop,
    navigation: navigation ? {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    } : false,
    pagination: pagination ? (typeof pagination === 'boolean' ? { clickable: true } : pagination) : false,
    autoplay: autoplay ? (typeof autoplay === 'boolean' ? { delay: 3000, disableOnInteraction: false } : autoplay) : false,
    onSlideChange: handleSlideChange,
    onSwiper: handleSwiperInit,
    breakpoints,
  };

  if (isLoading && categories.length === 0) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <div className="text-red-500 text-center">
          <p>Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <p className="text-gray-500">No categories found</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Swiper
        {...swiperConfig}
        className={`${swiperClassName}`}
      >
        {categories.map((category, index) => (
          <SwiperSlide key={category.id} className="h-auto">
            {renderSlide(category, index)}
          </SwiperSlide>
        ))}
      </Swiper>

      {navigation && categories.length > (typeof slidesPerView === 'number' ? slidesPerView : 1) && (
        <>
          <button
            onClick={handlePrev}
            className="swiper-button-prev absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-all hover:scale-110"
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="swiper-button-next absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full w-10 h-10 flex items-center justify shadow-lg transition-all hover:scale-110"
            aria-label="Next slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {pagination && (
        <div className="swiper-pagination mt-4 !relative !bottom-0"></div>
      )}
    </div>
  );
};

export default SwiperComponent;
