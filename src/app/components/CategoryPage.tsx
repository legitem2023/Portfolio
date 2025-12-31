'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import SwiperComponent, { category } from './SwiperComponent';
import { useSelector, useDispatch } from 'react-redux';
import { setSearchTerm, setCategoryFilter, setSortBy, clearAllFilters } from '../../../Redux/searchSlice';
import { GETCATEGORY } from './graphql/query'; // Adjust the import path as needed
import Image from 'next/image'; // Added Next.js Image component

// Define the GraphQL response type
interface GraphQLCategory {
  id: string;
  name: string;
  description: string;
  image: string;
  isActive: boolean;
  createdAt: string;
}

// Define the expected GraphQL response structure
interface CategoriesResponse {
  categories: GraphQLCategory[];
}

const CategoryPage: React.FC = () => {
  const dispatch = useDispatch();
  const [categories, setCategories] = useState<category[]>([]);
  
  // Use the GraphQL query - only source of data
  const { loading, error, data } = useQuery<CategoriesResponse>(GETCATEGORY);

  // Process GraphQL data when it's available - ONLY SOURCE
  useEffect(() => {
    if (data?.categories && data.categories.length > 0) {
      const processedCategories = data.categories.map((cat: GraphQLCategory) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        image: cat.image || '/NoImage.webp', // Default image if GraphQL returns empty
        isActive: cat.isActive,
        createdAt: cat.createdAt,
        // Add fields that don't exist in GraphQL with proper types
        items: '0 items', // You might want to fetch product count separately
        productCount: 0, // Consider adding productCount to your GraphQL query
        status: cat.isActive ? "Active" as const : "Inactive" as const, // Fixed: Use const assertion
        parentId: undefined,
      }));
      setCategories(processedCategories);
    }
  }, [data]);

  // Handle category click
  const handleCategoryClick = (categoryName: string) => {
    dispatch(setCategoryFilter(categoryName));
  };

  // Shimmer Loading Component
  const ShimmerLoader = () => {
    return (
      <div className="container mx-auto p-0">
        <div className="grid grid-cols-4 gap-4 p-0">
          {[...Array(4)].map((_, index) => (
            <div 
              key={index} 
              className="bg-white shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Image shimmer */}
              <div className="relative aspect-[1/1] bg-gray-200">
                <div className="shimmer absolute inset-0"></div>
              </div>
              
              {/* Content shimmer */}
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

  // Loading state - only show loader when loading from GraphQL
  if (loading) {
    return <ShimmerLoader />;
  }

  // Error state - only show error when GraphQL fails
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

  // No data state - when GraphQL returns empty array
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

  // Compact card render function - Using Next.js Image component
  const renderCompactCard = (category: category, index: number) => (
    <div 
      className="bg-white shadow-sm hover:shadow transition-shadow border border-gray-100 cursor-pointer"
      onClick={() => handleCategoryClick(category.id)}
    >
      <div className="relative aspect-[1/1] bg-gray-50">
        <div className="relative h-full w-full">
          <Image
            src={category.image}
            alt={category.name}
            fill
            className="object-cover"
            onError={() => {
              // You can use state to change the src on error if needed
            }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className="absolute top-1 right-1">
          <div className={`w-2 h-2 rounded-full ${category.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
      </div>
      
      <div className="p-1.5">
        <h4 className="font-medium text-gray-800 text-sm truncate">{category.name}</h4>
        <div className="flex justify-between items-center mt-0.5">
          <span className="text-xs text-gray-500">{category.productCount} items</span>
          <span className="text-xs text-blue-600 font-medium">→</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-0">
      <SwiperComponent
        initialCategories={categories}
        slidesPerView={4}
        spaceBetween={4}
        navigation={false}
        pagination={false}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        loop={true}
        renderSlide={renderCompactCard}
        showStatusBadge={false}
        showProductCount={false}
        className="compact-swiper"
      />
    </div>
  );
};

export default CategoryPage;
