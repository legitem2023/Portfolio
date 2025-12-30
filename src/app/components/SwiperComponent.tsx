import React, { useState, useEffect, useRef } from 'react';
import { Swiper as SwiperType } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import Image from 'next/image';

// Your exact category interface
export interface category {
  id: string;
  name: string;
  description: string;
  image: string;
  isActive: boolean;
  createdAt: string;
  items: string;
  productCount: number;
  status: 'Active' | 'Inactive';
  parentId?: number;
}

interface SwiperComponentProps {
  // Data props
  initialCategories?: category[];
  fetchCategories?: () => Promise<category[]>;
  
  // Swiper configuration
  slidesPerView?: number | 'auto';
  spaceBetween?: number;
  navigation?: boolean;
  pagination?: boolean | { clickable: boolean };
  autoplay?: boolean | { delay: number; disableOnInteraction: boolean };
  loop?: boolean;
  breakpoints?: Record<number, { slidesPerView: number; spaceBetween: number }>;
  
  // Customization
  renderSlide?: (category: category, index: number) => React.ReactNode;
  className?: string;
  swiperClassName?: string;
  showStatusBadge?: boolean;
  showProductCount?: boolean;
  onClickCategory?: (category: category) => void;
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
  showStatusBadge = true,
  showProductCount = true,
  onClickCategory,
}) => {
  const [categories, setCategories] = useState<category[]>(initialCategories);
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

  // Filter active categories if needed
  const activeCategories = categories.filter(cat => cat.isActive || cat.status === 'Active');

  const handleSlideChange = () => {
    console.log('Slide changed');
  };

  const handleSwiperInit = (swiper: SwiperType) => {
    swiperRef.current = swiper;
  };

  const handleNext = () => swiperRef.current?.slideNext();
  const handlePrev = () => swiperRef.current?.slidePrev();

  // Default category card renderer
  const defaultRenderSlide = (category: category, index: number) => (
    <div 
      className={`group relative bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 cursor-pointer ${
        !category.isActive ? 'opacity-70' : ''
      }`}
      onClick={() => onClickCategory?.(category)}
    >
      {/* Category Image */}
      <div className="relative h-48 w-full bg-gray-100">
        {category.image ? (
          <Image
            src={category.image}
            alt={category.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-center">
            <span className="text-4xl font-bold text-gray-300">
              {category.name.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        
        {/* Status Badge */}
        {showStatusBadge && (
          <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${
            category.status === 'Active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {category.status}
          </div>
        )}
      </div>
      
      {/* Category Content */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{category.name}</h3>
          {showProductCount && (
            <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-semibold whitespace-nowrap">
              {category.productCount} products
            </span>
          )}
        </div>
        
        <p className="text-gray-600 text-sm line-clamp-2 mb-4">{category.description}</p>
        
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Items: {category.items || 'N/A'}</span>
          <span>{new Date(category.createdAt).toLocaleDateString()}</span>
        </div>
        
        {/* Parent ID indicator */}
        {category.parentId && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">Parent ID: {category.parentId}</span>
          </div>
        )}
      </div>
    </div>
  );

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
          <p className="mb-2">Error loading categories</p>
          <p className="text-sm mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className={`flex flex-col justify-center items-center h-64 ${className}`}>
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
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
        {activeCategories.map((category, index) => (
          <SwiperSlide key={category.id} className="h-auto">
            {renderSlide ? renderSlide(category, index) : defaultRenderSlide(category, index)}
          </SwiperSlide>
        ))}
      </Swiper>

      {navigation && activeCategories.length > (typeof slidesPerView === 'number' ? slidesPerView : 1) && (
        <>
          <button
            onClick={handlePrev}
            className="swiper-button-prev absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous slide"
            disabled={!loop && swiperRef.current?.isBeginning}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="swiper-button-next absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next slide"
            disabled={!loop && swiperRef.current?.isEnd}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {pagination && (
        <div className="swiper-pagination mt-6 !relative !bottom-0"></div>
      )}
    </div>
  );
};

export default SwiperComponent;
