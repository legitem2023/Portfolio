// Example usage in your products tab
import React from 'react';
import ProductThumbnails, { generateSampleProducts } from '../components/ProductThumbnails';

const ProductsTab: React.FC = () => {
  const products = generateSampleProducts(100);
  
  return (
    <div className="p-1 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Our Products</h3>
        <div className="flex space-x-2">
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option>All Categories</option>
            <option>Clothing</option>
            <option>Accessories</option>
            <option>Footwear</option>
            <option>Jewelry</option>
            <option>Beauty</option>
            <option>Home</option>
            <option>Electronics</option>
            <option>Gifts</option>
          </select>
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option>Sort by: Featured</option>
            <option>Sort by: Newest</option>
            <option>Sort by: Price: Low to High</option>
            <option>Sort by: Price: High to Low</option>
            <option>Sort by: Highest Rated</option>
          </select>
        </div>
      </div>
      
      <ProductThumbnails products={products} />
      
      <div className="mt-8 flex justify-center">
        <button className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-6 rounded-md">
          Load More Products
        </button>
      </div>
    </div>
  );
};

export default ProductsTab;
