// components/FeaturedProducts.tsx
import React from 'react';
import { Heart, Star } from 'lucide-react';
import { Product } from '../../../../types';
import CategoryShimmer from '../CategoryShimmer';

interface FeaturedProductsProps {
  products: Product[];
  loading: boolean;
  title?: string;
  description?: string;
}

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({
  products,
  loading,
  title = "Featured Products",
  description = "Handpicked selection of our most exclusive and sought-after items."
}) => {
  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">{description}</p>
        </div>

        {loading ? (
          <CategoryShimmer count={4} />
        ) : (
          <div className="w-full max-w-7xl grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-3 lg:gap-4">
            {products.map((product) => (
              <div key={product.id} className="group bg-white rounded-xl shadow-md transition-all duration-300 hover:shadow-xl border border-gray-100 flex flex-col h-full">
                {/* Sale/New Badge */}
                {(product.onSale || product.isNew) && (
                  <div className="absolute top-2 left-2 z-10 flex flex-col space-y-1">
                    {product.onSale && (
                      <span className="px-1.5 py-0.5 text-[10px] xs:text-xs font-bold bg-red-600 text-white rounded-md">SALE</span>
                    )}
                    {product.isNew && (
                      <span className="px-1.5 py-0.5 text-[10px] xs:text-xs font-bold bg-blue-600 text-white rounded-md">NEW</span>
                    )}
                  </div>
                )}
                
                {/* Featured Badge */}
                {product.isFeatured && (
                  <div className="absolute top-2 right-2 z-10">
                    <span className="px-1.5 py-0.5 text-[10px] xs:text-xs font-bold bg-amber-600 text-white rounded-md">FEATURED</span>
                  </div>
                )}
                
                {/* Product Image */}
                <div className="relative overflow-hidden bg-gray-100 flex-grow">
                  <div className="aspect-square w-full">
                    <img 
                      src={product.image || '/NoImage.webp'} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    
                    {/* Quick View Button */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                      <button 
                        className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-white text-gray-900 font-medium px-2 py-1 text-[10px] xs:text-xs rounded-md"
                      >
                        Quick View
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Product Details */}
                <div className="p-2 sm:p-3 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-1 sm:mb-2 flex-grow">
                    <h3 className="font-medium text-gray-900 text-[11px] xs:text-xs sm:text-sm hover:text-amber-700 transition-colors cursor-pointer line-clamp-2 leading-tight">
                      {product.name}
                    </h3>
                    
                    {/* Wishlist Button */}
                    <button className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-1">
                      <Heart size={14} className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                  
                  {/* Rating */}
                  <div className="flex items-center mb-1 sm:mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i}
                          size={12}
                          className={`h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-4 sm:w-4 ${i < Math.floor(product.rating) ? "text-amber-400 fill-amber-400" : "text-gray-300"}`}
                        />
                      ))}
                      <span className="text-[10px] xs:text-xs text-gray-500 ml-0.5 xs:ml-1">({product.reviewCount})</span>
                    </div>
                  </div>
                  
                  {/* Price */}
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs xs:text-sm sm:text-base md:text-lg font-bold text-gray-900">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-[10px] xs:text-xs text-gray-500 line-through">
                          ${product.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    
                    {/* Add to Cart Button */}
                    <button className="bg-violet-200 hover:bg-violet-300 text-white p-1 xs:p-1.5 sm:p-2 rounded-full transition-colors flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Color Options */}
                  {product.colors && product.colors.length > 0 && (
                    <div className="mt-1 sm:mt-2 flex items-center space-x-1">
                      <span className="text-[10px] xs:text-xs text-gray-500">Colors:</span>
                      <div className="flex space-x-0.5 xs:space-x-1">
                        {product.colors.slice(0, 4).map((color, index) => (
                          <span
                            key={index}
                            className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 rounded-full border border-gray-200"
                            style={{ backgroundColor: color }}
                          ></span>
                        ))}
                        {product.colors.length > 4 && (
                          <span className="text-[10px] xs:text-xs text-gray-500">+{product.colors.length - 4}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <button className="bg-gray-900 text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors">
            View All Products
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
