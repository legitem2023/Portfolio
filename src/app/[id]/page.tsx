'use client'
// app/product/[id]/page.tsx
import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useParams } from 'next/navigation';
import { GETPRODUCT } from '../components/graphql/query';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { Product } from '../../../types';
const ProductPage: React.FC = () => {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const params = useParams();
  const id = params?.id as string; // Extract id from URL params

  // Use networkStatus to track loading states
  const { data, loading, error } = useQuery(GETPRODUCT, {
    variables: {
      id: id || "" // Use the id from URL
    },
    skip: !id, // Skip query until id is available
  });
  
  console.log(data);
  const handleCloseQuickView = () => {
    alert("t");
  };
  const handleAddToCart = (product: Product) => {
    const cartItem = {
      // Include ALL Product properties
      id: product.id,
      name: product.name,
      price: product.price,
      onSale: product.onSale,           // This was missing
      isNew: product.isNew,             // This was missing
      isFeatured: product.isFeatured,   // This was missing
      originalPrice: product.originalPrice,
      rating: product.rating,
      reviewCount: product.reviewCount, // This was missing
      image: product.image,
      colors: product.colors,
      description: product.description,
      productCode: product.productCode,
      category: product.category,
      sku: product.sku,
      variants: product.variants,
      userId: 'current-user-id', // Replace with actual user ID from your auth context
      quantity: 1,
      color: product.colors,      // Make sure you have this variable
      size: product.size,
    };
     
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50 p-0">
      <Header/>
      <QuickViewModal 
        product={data} 
        isOpen={isQuickViewOpen} 
        onClose={handleCloseQuickView} 
        onAddToCart={handleAddToCart}
      />
      <Footer/>
    </div>
  );
};

export default ProductPage;
