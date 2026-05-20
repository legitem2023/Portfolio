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
      limit: 8,
      category: undefined,
      sortBy: 'featured'
    }
  });

  const { data: userData, loading: userLoading } = useQuery(USERS);

  const products = productData?.products?.items || [];
  
  // Safely get categories with optional chaining and fallback
  const categoriesList = categoryData?.categories || [];

  // Complete Hero carousel data

  return (
    <div className="bg-white">
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <main>
        <div className="text-left m-2">
          <h2 className="text-1xl font-bold text-gray-500">Visits</h2>
        </div>
        <VisitorCounter />
        <div className="text-left m-2">
          <h2 className="text-1xl font-bold text-gray-500">Category</h2>
        </div>
        <CategoryPage />
        <div className="text-left m-2">
          <h2 className="text-1xl font-bold text-gray-500">Featured Products</h2>
        </div>
        {/* Featured Products Section */}
        {productLoading || categoryLoading ? (  // Changed && to || for better UX
          <ProductThumbnailsShimmer count={8} />
        ) : products.length > 0 && categoriesList.length > 0 ? (  // Added categoriesList check
          <ProductThumbnails products={products} categories={categoriesList} />
        ) : (
          <div className="text-center py-12 text-gray-500">
            No products found
          </div>
        )}
      </main>
    </div>
  );
};

export default DeluxeHomePage;
