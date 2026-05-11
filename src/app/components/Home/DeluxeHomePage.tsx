// components/DeluxeHomePage.tsx
"use client";
import { GETCATEGORY, GETPRODUCTS, USERS } from '../graphql/query';
import { useQuery } from '@apollo/client';
import { category, Product } from '../../../../types';
import React, { useState, useEffect } from 'react';
import MobileMenu from './MobileMenu';
import HeroCarousel from './HeroCarousel';
import CategoryPage from '../CategoryPage';
import FeaturedProducts from './FeaturedProducts';
import VisitorCounter from '../VisitorCounter';
import ProductThumbnails from '../ProductThumbnails';
import ProductThumbnailsShimmer from '../ProductThumbnailsShimmer';
import ReviewsList from './ReviewsList';
const DeluxeHomePage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState<category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  // Fetch categories
  const { data: categoryData, loading: categoryLoading } = useQuery(GETCATEGORY);
  
  // Fetch products using GETPRODUCTS query
  const { data: productData, loading: productLoading, error: productError } = useQuery(GETPRODUCTS, {
    variables: {
      search: '',
      cursor: '',
      limit: 8, // Only fetch 8 products for featured section
      category: undefined,
      sortBy: 'featured' // Or 'newest' or whatever makes sense
    }
  });

  const { data: userData, loading: userLoading } = useQuery(USERS);


const products = productData?.products?.items || [];
  // Complete Hero carousel data
  const heroSlides = [
    {
      "id": 1,
      "title": "New Arrivals",
      "subtitle": "Be the first to discover our latest collection",
      "image": "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&h=600&fit=crop",
      "cta": "Shop New Arrivals",
      "bgColor": "bg-gradient-to-r from-fuchsia-900 to-purple-800"
    },
    {
      "id": 2,
      "title": "Summer Collection",
      "subtitle": "Exquisite pieces for the warmest season",
      "image": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&h=600&fit=crop",
      "cta": "Explore Collection",
      "bgColor": "bg-gradient-to-r from-amber-800 to-orange-700"
    },
    {
      "id": 3,
      "title": "Limited Edition",
      "subtitle": "Unique items crafted with precision and care",
      "image": "https://images.unsplash.com/photo-1542060748-10c28b62716f?w=1200&h=600&fit=crop",
      "cta": "View Items",
      "bgColor": "bg-gradient-to-r from-emerald-800 to-teal-700"
    },
    {
      "id": 4,
      "title": "Autumn Essentials",
      "subtitle": "Cozy and stylish pieces for the fall season",
      "image": "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&h=600&fit=crop",
      "cta": "Discover Essentials",
      "bgColor": "bg-gradient-to-r from-rose-900 to-pink-700"
    },
    {
      "id": 5,
      "title": "Winter Collection",
      "subtitle": "Stay warm and fashionable this winter",
      "image": "https://images.unsplash.com/photo-1556906781-2f0520405b71?w=1200&h=600&fit=crop",
      "cta": "Browse Winter",
      "bgColor": "bg-gradient-to-r from-blue-900 to-cyan-700"
    },
    {
      "id": 6,
      "title": "Spring Refresh",
      "subtitle": "Brighten your space with our spring favorites",
      "image": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1200&h=600&fit=crop",
      "cta": "Shop Spring",
      "bgColor": "bg-gradient-to-r from-green-800 to-emerald-700"
    },
    {
      "id": 7,
      "title": "Premium Quality",
      "subtitle": "Experience luxury with every purchase",
      "image": "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=600&fit=crop",
      "cta": "Shop Luxury",
      "bgColor": "bg-gradient-to-r from-gray-900 to-gray-700"
    },
    {
      "id": 8,
      "title": "Exclusive Sale",
      "subtitle": "Up to 50% off on selected items",
      "image": "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=600&fit=crop",
      "cta": "Shop Sale",
      "bgColor": "bg-gradient-to-r from-red-900 to-pink-700"
    },
    {
      "id": 9,
      "title": "Best Sellers",
      "subtitle": "Our customers' most loved products",
      "image": "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=1200&h=600&fit=crop",
      "cta": "View Best Sellers",
      "bgColor": "bg-gradient-to-r from-indigo-900 to-purple-700"
    },
    {
      "id": 10,
      "title": "Gift Ideas",
      "subtitle": "Perfect presents for every occasion",
      "image": "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1200&h=600&fit=crop",
      "cta": "Find Gifts",
      "bgColor": "bg-gradient-to-r from-yellow-700 to-amber-600"
    }
  ];

  // Complete Testimonials data

  return (
    <div className="bg-white">
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <main>
        <div className="text-left m-2">
          <h2 className="text-1xl font-bold text-gray-500">Visits</h2>
        </div>
        <VisitorCounter />
        {/*<HeroCarousel slides={heroSlides} />*/}
        <div className="text-left m-2">
          <h2 className="text-1xl font-bold text-gray-500">Category</h2>
        </div>
        <CategoryPage />
        <div className="text-left m-2">
          <h2 className="text-1xl font-bold text-gray-500">Featured Products</h2>
        </div>
        {/* Featured Products Section */}
          {productLoading ? (
            <ProductThumbnailsShimmer count={8} />
            ) : products.length > 0 ? (
            <ProductThumbnails products={products} />
            ) : (
                <div className="text-center py-12 text-gray-500">
                  No products found
                </div>
        )}
        {/* Optional: Add testimonials section if your HeroCarousel doesn't handle it */}
        <div className="text-left m-2">
          <h2 className="text-1xl font-bold text-gray-500">Testimonials</h2>
        </div>
      </main>
    </div>
  );
};

export default DeluxeHomePage;
