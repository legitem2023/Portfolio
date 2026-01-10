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

        <div className="w-full max-w-7xl grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-3 lg:gap-4">
          {loading ? (
            <CategoryShimmer count={4} />
          ) : (
            products.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl shadow-md overflow-hidden group">
                <div className="relative overflow-hidden">
                  <img 
                    src={product.image || '/NoImage.webp'} 
                    alt={product.name}
                    className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {product.isNew && (
                    <div className="absolute top-4 left-4 bg-white text-gray-900 text-xs font-bold px-2 py-1 rounded">
                      NEW
                    </div>
                  )}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100">
                      <Heart size={18} />
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="bg-gray-900 text-white px-6 py-2 rounded-full font-medium">
                      Add to Cart
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
                  <div className="flex items-center mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i}
                          size={14}
                          className={i < Math.floor(product.rating) ? "text-amber-400 fill-amber-400" : "text-gray-300"}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 ml-1">({product.reviewCount})</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-500 line-through ml-2">${product.originalPrice.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

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
