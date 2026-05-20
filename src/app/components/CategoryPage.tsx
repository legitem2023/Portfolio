'use client';

import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { useDispatch, useSelector } from 'react-redux';
import SwiperComponent, { category } from './SwiperComponent';
import { setActiveIndex } from '../../../Redux/activeIndexSlice';
import { setCategoryFilter } from '../../../Redux/searchSlice';
import { GETCATEGORY } from './graphql/query';
import { showToast } from '../../../utils/toastify';
import Image from 'next/image';

interface GraphQLCategory {
  id: string;
  name: string;
  description: string;
  image: string;
  isActive: boolean;
  createdAt: string;
  variantCount: number;
}

interface CategoriesResponse {
  categories: GraphQLCategory[];
}

// Inject global styles for the pulse animation (only once)
if (typeof document !== 'undefined' && !document.getElementById('pulse-green-styles')) {
  const style = document.createElement('style');
  style.id = 'pulse-green-styles';
  style.textContent = `
    @keyframes pulse-green-custom {
      0% {
        transform: scale(0.8);
        opacity: 0.4;
        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
      }
      50% {
        transform: scale(1.4);
        opacity: 1;
        box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
      }
      100% {
        transform: scale(0.8);
        opacity: 0.4;
        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
      }
    }
    .animate-pulse-green-custom {
      animation: pulse-green-custom 1s ease-in-out infinite !important;
    }
  `;
  document.head.appendChild(style);
}

const CategoryPage: React.FC = () => {
  const dispatch = useDispatch();
  const isMounted = useRef(true);

  // Get current category filter from Redux
  const categoryFilter = useSelector((state: any) => state.search.categoryFilter);

  const { loading, error, data } = useQuery<CategoriesResponse>(GETCATEGORY, {
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: false,
  });

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const categories = useMemo(() => {
    if (!data?.categories) return [];

    return data.categories.map((cat: GraphQLCategory) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      image: cat.image || '/NoImage.webp',
      isActive: cat.isActive,
      createdAt: cat.createdAt,
      items: '0 items',
      productCount: 0,
      variantCount: cat.variantCount,
      status: cat.isActive ? 'Active' as const : 'Inactive' as const,
      parentId: undefined,
    }));
  }, [data]);

  const handleCategoryClick = useCallback(
    (categoryId: string, variantCount: number) => {
      if (variantCount < 1) {
        showToast('This category has no items available', 'error');
        return;
      }

      if (isMounted.current) {
        dispatch(setCategoryFilter(categoryId));
        dispatch(setActiveIndex(2));
      }
    },
    [dispatch]
  );

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    if (isMounted.current) {
      e.currentTarget.src = '/NoImage.webp';
    }
  }, []);

  const renderCompactCard = useCallback(
    (category: category, index: number) => {
      const isActiveFilter = categoryFilter === category.id;
      const hasVariants = category.variantCount > 0;
      const shouldPulse = hasVariants && isActiveFilter;

      return (
        <div
          className="group backdrop-blur-md shadow-md transition-all duration-300 hover:shadow-xl border border-gray-100/50 flex flex-col h-full relative"
          style={{
            border: 'solid 1px transparent',
            borderRadius: '1px',
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(200,180,255,0.5) 100%)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
          }}
          onClick={() => handleCategoryClick(category.id, category.variantCount)}
        >
          <div className="relative aspect-[1/1] bg-gray-50">
            <div className="relative h-full w-full">
              <Image
                src={category.image}
                alt={category.name}
                fill
                quality={25}
                className={`object-cover ${!hasVariants ? 'grayscale' : ''}`}
                loading="lazy"
                priority={index < 4}
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                onError={handleImageError}
              />
            </div>
            {/* Enhanced visible pulsing indicator - using both scale and glow */}
            <div className="absolute top-1 right-1 z-10">
              {shouldPulse && (
                <>
                  {/* Outer pulsing ring */}
                  <div
                    className="absolute rounded-full bg-green-400 animate-ping"
                    style={{
                      width: '20px',
                      height: '20px',
                      top: '-6px',
                      left: '-6px',
                      opacity: 0.6,
                    }}
                  />
                  {/* Middle pulsing ring */}
                  <div
                    className="absolute rounded-full bg-green-300"
                    style={{
                      width: '14px',
                      height: '14px',
                      top: '-3px',
                      left: '-3px',
                      animation: 'pulse-green-custom 1s ease-in-out infinite',
                    }}
                  />
                </>
              )}
              {/* Core dot (green or red) */}
              <div
                className={`w-3 h-3 rounded-full relative z-10 ${
                  hasVariants ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{
                  boxShadow: shouldPulse ? '0 0 8px 2px #22c55e' : 'none',
                  animation: shouldPulse ? 'pulse-green-custom 1s ease-in-out infinite' : 'none',
                }}
              />
            </div>
          </div>

          <div className="p-1.5">
            <h4 className="font-medium text-gray-800 text-xs truncate">{category.name}</h4>
            <div className="flex justify-between items-center mt-0.5">
              <span className="text-xs text-gray-500">{category.variantCount} items</span>
              <span className="text-xs text-blue-600 font-medium">→</span>
            </div>
          </div>
        </div>
      );
    },
    [handleCategoryClick, handleImageError, categoryFilter]
  );

  if (loading) {
    return <ShimmerLoader />;
  }

  if (error) {
    console.error('GraphQL Error:', error);
    return (
      <div className="container mx-auto p-0">
        <div className="text-center text-red-600 p-4">
          Error loading categories. Please try again later.
        </div>
      </div>
    );
  }

  if (!categories.length) {
    return (
      <div className="container mx-auto p-0">
        <div className="text-center p-4">
          <div className="text-gray-500 mb-2">No categories found</div>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-0">
      <SwiperComponent
        initialCategories={categories}
        slidesPerView={4}
        spaceBetween={8}
        navigation={false}
        pagination={false}
        loop={true}
        renderSlide={renderCompactCard}
        showStatusBadge={false}
        showProductCount={false}
        className="compact-swiper"
      />
    </div>
  );
};

// Optimized ShimmerLoader with cleanup
const ShimmerLoader = () => {
  const shimmerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (shimmerRef.current) {
        // cleanup
      }
    };
  }, []);

  return (
    <div className="container mx-auto p-0" ref={shimmerRef}>
      <div className="grid grid-cols-4 gap-2 p-0">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="bg-white shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="relative aspect-[1/1] bg-gray-200">
              <div className="shimmer absolute inset-0"></div>
            </div>
            <div className="p-1.5">
              <div className="h-4 bg-gray-200 rounded mb-1 shimmer"></div>
              <div className="flex justify-between items-center mt-0.5">
                <div className="h-3 w-12 bg-gray-200 rounded shimmer"></div>
                <div className="h-3 w-3 bg-gray-200 rounded shimmer"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryPage;
