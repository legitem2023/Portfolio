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
      isActive: false,
      createdAt: '2024-01-05T09:15:00Z',
      items: '200 items',
      productCount: 200,
      status: 'Inactive',
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
  ]);

  // Handle category click
  const handleCategoryClick = (category: category) => {
    console.log('Category clicked:', category);
    // Navigate to category page or show details
    // router.push(`/categories/${category.id}`);
  };

  // Fetch categories from API
  const fetchCategories = async (): Promise<category[]> => {
    const response = await fetch('/api/categories');
    const data = await response.json();
    setCategories(data); // Update state
    return data;
  };

  // Custom render function
  const renderCompactCard = (category: category, index: number) => (
    <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <span className="font-bold text-blue-600">{category.name.charAt(0)}</span>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">{category.name}</h4>
          <p className="text-xs text-gray-500">{category.productCount} products</p>
        </div>
        <div className={`w-3 h-3 rounded-full ${category.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Example 1: Default rendering */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">All Categories</h2>
        <SwiperComponent
          initialCategories={categories}
          slidesPerView={4}
          spaceBetween={30}
          navigation={true}
          pagination={{ clickable: true }}
          autoplay={{ delay: 4000 }}
          loop={true}
          onClickCategory={handleCategoryClick}
          breakpoints={{
            320: { slidesPerView: 1, spaceBetween: 16 },
            640: { slidesPerView: 2, spaceBetween: 20 },
            1024: { slidesPerView: 3, spaceBetween: 24 },
            1280: { slidesPerView: 4, spaceBetween: 30 },
          }}
        />
      </section>

      {/* Example 2: Custom rendering */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Compact View</h2>
        <SwiperComponent
          initialCategories={categories.filter(cat => cat.isActive)}
          slidesPerView={5}
          spaceBetween={20}
          renderSlide={renderCompactCard}
          showStatusBadge={false}
          showProductCount={false}
          className="max-w-6xl mx-auto"
        />
      </section>

      {/* Example 3: With API fetch */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Dynamic Categories</h2>
        <SwiperComponent
          fetchCategories={fetchCategories}
          slidesPerView={3}
          spaceBetween={24}
          navigation={true}
          breakpoints={{
            320: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
        />
      </section>
    </div>
  );
};

export default CategoryPage;
