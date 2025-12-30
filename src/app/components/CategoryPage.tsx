'use client';

import React, { useState } from 'react';
import SwiperComponent, { category } from './SwiperComponent';

const CategoryPage: React.FC = () => {
  const [categories, setCategories] = useState<category[]>([
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
    {
      id: 'cat-2',
      name: 'Fashion',
      description: 'Trendy clothing and accessories',
      image: '/images/fashion.jpg',
      isActive: true,
      createdAt: '2024-01-10T14:20:00Z',
      items: '85 items',
      productCount: 85,
      status: 'Active',
    },
    {
      id: 'cat-3',
      name: 'Home & Kitchen',
      description: 'Home appliances and kitchenware',
      image: '/images/home-kitchen.jpg',
      isActive: true,
      createdAt: '2024-01-05T09:15:00Z',
      items: '200 items',
      productCount: 200,
      status: 'Active',
      parentId: 1,
    },
    {
      id: 'cat-4',
      name: 'Books',
      description: 'Best selling books and novels',
      image: '/images/books.jpg',
      isActive: true,
      createdAt: '2024-01-20T11:45:00Z',
      items: '150 items',
      productCount: 150,
      status: 'Active',
    },
    {
      id: 'cat-5',
      name: 'Sports',
      description: 'Sports equipment and gear',
      image: '/images/sports.jpg',
      isActive: true,
      createdAt: '2024-01-18T16:30:00Z',
      items: '75 items',
      productCount: 75,
      status: 'Active',
    },
    {
      id: 'cat-6',
      name: 'Beauty',
      description: 'Beauty products and cosmetics',
      image: '/images/beauty.jpg',
      isActive: true,
      createdAt: '2024-01-25T09:30:00Z',
      items: '90 items',
      productCount: 90,
      status: 'Active',
    },
    {
      id: 'cat-7',
      name: 'Toys',
      description: 'Toys and games for all ages',
      image: '/images/toys.jpg',
      isActive: true,
      createdAt: '2024-01-22T14:15:00Z',
      items: '110 items',
      productCount: 110,
      status: 'Active',
    },
    {
      id: 'cat-8',
      name: 'Automotive',
      description: 'Car parts and accessories',
      image: '/images/automotive.jpg',
      isActive: true,
      createdAt: '2024-01-28T11:20:00Z',
      items: '65 items',
      productCount: 65,
      status: 'Active',
    },
  ]);

  // Handle category click
  const handleCategoryClick = (category: category) => {
    console.log('Category clicked:', category);
    // Navigate to category page or show details
    // router.push(`/categories/${category.id}`);
  };

  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const imgElement = e.currentTarget;
    imgElement.src = '/NoImage.webp';
    imgElement.onerror = null; // Prevent infinite loop if NoImage.webp also fails
  };

  // Compact card render function with minimal padding
  const renderCompactCard = (category: category, index: number) => (
    <div 
      className="p-0.5 bg-white rounded-lg shadow-sm hover:shadow transition-shadow border border-gray-100 cursor-pointer"
      onClick={() => handleCategoryClick(category)}
    >
      <div className="relative aspect-[1/1] bg-gray-50 rounded-t-lg">
        <div className="relative h-full w-full">
          <img
            src={category.image || '/NoImage.webp'}
            alt={category.name}
            className="aspect-[1/1] h-full w-full object-cover rounded-t-lg"
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
    <div className="container mx-auto px-2 py-6">
      <SwiperComponent
        initialCategories={categories}
        slidesPerView={4}
        spaceBetween={4}
        navigation={true}
        pagination={{ clickable: true }}
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
