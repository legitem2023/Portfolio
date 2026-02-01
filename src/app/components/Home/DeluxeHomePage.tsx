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

  useEffect(() => {
    if (categoryData?.categories) {
      const categoriesData = categoryData.categories.map((data: any) => ({
        id: data.id,
        name: data.name,
        image: data.image ? data.image : '/NoImage.webp',
        items: data.items,
      }));
      setCategories(categoriesData);
    }
    
    if (productData?.products?.items) {
      // Transform API response to match your Product type
      const productsData = productData.products.items.map((data: any) => ({
        id: data.id,
        name: data.name,
        originalPrice: data.price,
        price: data.salePrice || data.price,
        image: data.images?.[0]?.imageUrl || data.avatar || '/NoImage.webp',
        rating: data.rating || 0,
        reviews: data.reviewCount || 0,
        isNew: data.isNew || false
      }));
      setFeaturedProducts(productsData);
    }
  }, [categoryData, productData]);

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
  const testimonials = [
    {
      id: 1,
      name: "Emma Johnson",
      role: "Fashion Influencer",
      comment: "The quality of their products is exceptional. Every piece feels luxurious and lasts for years.",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face",
      rating: 5
    },
    {
      id: 2,
      name: "Michael Reynolds",
      role: "Lifestyle Blogger",
      comment: "Their customer service is as premium as their products. Always a pleasure to shop here.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
      rating: 5
    },
    {
      id: 3,
      name: "Sophia Williams",
      role: "Interior Designer",
      comment: "I always find unique, high-quality pieces that become conversation starters.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
      rating: 4
    },
    {
      id: 4,
      name: "David Chen",
      role: "Tech Entrepreneur",
      comment: "The attention to detail in their products is unmatched. Worth every penny.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
      rating: 5
    },
    {
      id: 5,
      name: "Olivia Martinez",
      role: "Art Director",
      comment: "Their collections always inspire me. Beautiful craftsmanship and timeless design.",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main>
        <VisitorCounter />
        <HeroCarousel slides={heroSlides} />
        <CategoryPage />
        
        {/* Featured Products Section */}
        <FeaturedProducts 
          products={featuredProducts} 
          loading={productLoading} 
        />
        
        {/* Optional: Add testimonials section if your HeroCarousel doesn't handle it */}
        {/* 
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                What Our Customers Say
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Join thousands of satisfied customers worldwide
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center mb-4">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full mr-4"
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4">{testimonial.comment}</p>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${
                          i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        */}
      </main>
    </div>
  );
};

export default DeluxeHomePage;
