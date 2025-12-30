'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import SwiperComponent, { category } from './SwiperComponent';
import { useSelector, useDispatch } from 'react-redux';
import { setSearchTerm, setCategoryFilter, setSortBy, clearAllFilters } from '../../../Redux/searchSlice';
import { GETCATEGORY } from './graphql/query'; // Adjust the import path as needed

// Define the GraphQL response type
interface GraphQLCategory {
  id: string;
  name: string;
  description: string;
  image: string;
  isActive: boolean;
  createdAt: string;
}

const CategoryPage: React.FC = () => {
  const dispatch = useDispatch();
  const [categories, setCategories] = useState<category[]>([]);
  
  // Use the GraphQL query
  const { loading, error, data } = useQuery(GETCATEGORY);

  // Fallback categories in case GraphQL fails or is loading
  const fallbackCategories: category[] = [
    {
      id: 'cat-1',
      name: 'Electronics',
      description: 'Latest electronic devices and gadgets',
      image: '/images/electronics.jpg',
      isActive: true,
      createdAt: '2024-01-15T10:30:00Z',
      items: '120 items',
      productCount: 120,
      status: 'Active',
    },
    // ... other fallback categories (keep your existing array)
  ];

  // Process GraphQL data when its available
  useEffect(() => {
    if (data?.categories) {
      const processedCategories = data.categories.map((cat: GraphQLCategory) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        image: cat.image,
        isActive: cat.isActive,
        createdAt: cat.createdAt,
        // Add fields that dont exist in GraphQL with default values
        items: '0 items', // Default value, you might want to calculate this
        productCount: 0, // Default value
        status: cat.isActive ? 'Active' : 'Inactive', // Convert boolean to string
        parentId: undefined, // Optional field
      }));
      setCategories(processedCategories);
    }
  }, [data]);

  // If loading, show fallback categories
  useEffect(() => {
    if (loading || error || !data?.categories) {
      setCategories(fallbackCategories);
    }
  }, [loading, error, data]);

  // Handle category click
  const handleCategoryClick = (categoryName: string) => {
    dispatch(setCategoryFilter(categoryName));
  };

  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const imgElement = e.currentTarget;
    imgElement.src = '/NoImage.webp';
    imgElement.onerror = null;
  };

  // Loading state
  if (loading && categories.length === 0) {
    return (
      <div className="container mx-auto p-0">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading categories...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && categories.length === 0) {
    console.error('GraphQL Error:', error);
    return (
      <div className="container mx-auto p-0">
        <div className="text-center text-red-600 p-4">
          Error loading categories. Showing fallback data.
        </div>
      </div>
    );
  }

  // Compact card render function
  const renderCompactCard = (category: category, index: number) => (
    <div 
      className="bg-white shadow-sm hover:shadow transition-shadow border border-gray-100 cursor-pointer"
      onClick={() => handleCategoryClick(category.name)}
    >
      <div className="relative aspect-[1/1] bg-gray-50">
        <div className="relative h-full w-full">
          <img
            src={category.image || '/NoImage.webp'}
            alt={category.name}
            className="aspect-[1/1] h-full w-full object-cover"
            onError={handleImageError}
            loading="lazy"
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
      {categories.length > 0 ? (
        <SwiperComponent
          initialCategories={categories}
          slidesPerView={4}
          spaceBetween={4}
          navigation={false}
          pagination={{ clickable: false }}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          loop={true}
          renderSlide={renderCompactCard}
          showStatusBadge={false}
          showProductCount={false}
          className="compact-swiper"
        />
      ) : (
        <div className="text-center p-4">No categories available</div>
      )}
    </div>
  );
};

export default CategoryPage;
