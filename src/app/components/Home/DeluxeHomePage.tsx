// components/DeluxeHomePage.tsx
"use client";
import { GETCATEGORY, MANAGEMENTPRODUCTS, USERS } from './graphql/query';
import { useQuery } from '@apollo/client';
import { Category, Product } from './types/types';
import React, { useState, useEffect } from 'react';
import MobileMenu from './MobileMenu';
import HeroCarousel from './HeroCarousel';
import FeaturedCategories from './FeaturedCategories';
import FeaturedProducts from './FeaturedProducts';
import Testimonials from './Testimonials';

const DeluxeHomePage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const { data: categoryData, loading: categoryLoading } = useQuery(GETCATEGORY);
  const { data: productData, loading: productLoading } = useQuery(MANAGEMENTPRODUCTS);
  const { data: userData, loading: userLoading } = useQuery(USERS);

  useEffect(() => {
    console.log(userData);
    if (categoryData?.categories) {
      const categoriesData = categoryData.categories.map((data: any) => ({
        id: data.id,
        name: data.name,
        image: data.image ? data.image : '/NoImage.webp',
        items: data.items,
      }));
      setCategories(categoriesData);
    }
    if (productData?.getProducts) {
      const productsData = productData.getProducts.map((data: any) => ({
        id: 1,
        name: data.name,
        originalPrice: data.price,
        price: data.salePrice,
        image: data.avatar,
        rating: 0,
        reviews: 4,
        isNew: false
      }));
      setProducts(productsData);
    }
  }, [categoryData, productData, userData]);

  // Hero carousel data
  const heroSlides = [
    {
      id: 1,
      title: "Elevate",
      subtitle: "Discover the latest collection of luxury fashion",
      image: "https://images.unsplash.com/photo-1521335629791-ce4aec67dd47?w=1200&h=600&fit=crop",
      cta: "Shop Now",
      bgColor: "bg-gradient-to-r from-purple-900 to-indigo-800"
    },
    {
      id: 2,
      title: "Summer Collection",
      subtitle: "Exquisite pieces for the warmest season",
      image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&h=600&fit=crop",
      cta: "Explore Collection",
      bgColor: "bg-gradient-to-r from-amber-800 to-orange-700"
    },
    {
      id: 3,
      title: "Limited Edition",
      subtitle: "Unique items crafted with precision and care",
      image: "https://images.unsplash.com/photo-1542060748-10c28b62716f?w=1200&h=600&fit=crop",
      cta: "View Items",
      bgColor: "bg-gradient-to-r from-emerald-800 to-teal-700"
    }
  ];

  // Testimonials
  const testimonials = [
    {
      id: 1,
      name: "Emma Johnson",
      role: "Fashion Influencer",
      comment: "The quality of their products is exceptional. Every piece feels luxurious and lasts for years.",
      avatar: "/NoImage.webp",
      rating: 5
    },
    {
      id: 2,
      name: "Michael Reynolds",
      role: "Lifestyle Blogger",
      comment: "Their customer service is as premium as their products. Always a pleasure to shop here.",
      avatar: "/NoImage.webp",
      rating: 5
    },
    {
      id: 3,
      name: "Sophia Williams",
      role: "Interior Designer",
      comment: "I always find unique, high-quality pieces that become conversation starters.",
      avatar: "/NoImage.webp",
      rating: 4
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main>
        <HeroCarousel slides={heroSlides} />
        <FeaturedCategories 
          categories={categories} 
          loading={categoryLoading} 
        />
        <FeaturedProducts 
          products={products} 
          loading={productLoading} 
        />
        <Testimonials testimonials={testimonials} />
      </main>
    </div>
  );
};

export default DeluxeHomePage;
