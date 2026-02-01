'use client';

import React, { useMemo, useCallback } from 'react';
import { useQuery } from '@apollo/client';
import SwiperComponent, { category } from './SwiperComponent';
import { useDispatch } from 'react-redux';
import { setCategoryFilter } from '../../../Redux/searchSlice';
import { GETCATEGORY } from './graphql/query';
import Image from 'next/image';

interface GraphQLCategory {
  id: string;
  name: string;
  description: string;
  image: string;
  isActive: boolean;
  createdAt: string;
}

interface CategoriesResponse {
  categories: GraphQLCategory[];
}

const CategoryPage: React.FC = () => {
  const dispatch = useDispatch();
  
  const { loading, error, data } = useQuery<CategoriesResponse>(GETCATEGORY);

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
      status: cat.isActive ? "Active" as const : "Inactive" as const,
      parentId: undefined,
    }));
  }, [data]);

  const handleCategoryClick = useCallback((categoryId: string) => {
    dispatch(setCategoryFilter(categoryId));
  }, [dispatch]);

  const renderCompactCard = useCallback((category: category, index: number) => (
    <div 
      className="group backdrop-blur-md shadow-md transition-all duration-300 hover:shadow-xl border border-gray-100/50 flex flex-col h-full"
      style={{
        border:'solid 1px transparent',
        borderRadius:'1px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(200,180,255,0.5) 100%)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)'
      }}
      onClick={() => handleCategoryClick(category.id)}
    >
      <div className="relative aspect-[1/1] bg-gray-50">
        <div className="relative h-full w-full">
          <Image
            src={category.image}
            alt={category.name}
            fill
            quality={25}
            className="object-cover"
            loading="lazy"
            priority={index < 4}
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            onError={(e) => {
              e.currentTarget.src = '/NoImage.webp';
            }}
          />
        </div>
        <div className="absolute top-1 right-1">
          <div className={`w-2 h-2 rounded-full ${category.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
      </div>
      
      <div className="p-1.5">
        <h4 className="font-medium text-gray-800 text-xs truncate">{category.name}</h4>
        <div className="flex justify-between items-center mt-0.5">
          <span className="text-xs text-gray-500">{category.productCount} items</span>
          <span className="text-xs text-blue-600 font-medium">→</span>
        </div>
      </div>
    </div>
  ), [handleCategoryClick]);

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

// Keep your ShimmerLoader component as is
const ShimmerLoader = () => {
  return (
    <div className="container mx-auto p-0">
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
