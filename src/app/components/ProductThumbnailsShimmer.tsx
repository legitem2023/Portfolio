// components/ProductThumbnailsShimmer.tsx
import React from 'react';

interface ProductThumbnailsShimmerProps {
  count?: number;
}

const ProductThumbnailsShimmer: React.FC<ProductThumbnailsShimmerProps> = ({ count = 20 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-3 lg:gap:4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="group relative bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
          {/* Badge placeholders */}
          <div className="absolute top-3 left-3 z-10 flex flex-col space-y-1">
            <div className="px-2 py-1 w-10 h-6 bg-gray-200 rounded-md shimmer-effect"></div>
          </div>
          
          <div className="absolute top-3 right-3 z-10">
            <div className="px-2 py-1 w-14 h-6 bg-gray-200 rounded-md shimmer-effect"></div>
          </div>
          
          {/* Image placeholder */}
          <div className="relative overflow-hidden h-48 bg-gray-200">
            <div className="shimmer-effect absolute inset-0"></div>
          </div>
          
          {/* Product Details */}
          <div className="p-3">
            <div className="flex justify-between items-start mb-2">
              {/* Title placeholder */}
              <div className="w-3/4 h-4 bg-gray-200 rounded shimmer-effect"></div>
              
              {/* Wishlist button placeholder */}
              <div className="w-5 h-5 bg-gray-200 rounded shimmer-effect"></div>
            </div>
            
            <div className="flex items-center mb-2">
              {/* Rating placeholder */}
              <div className="flex items-center w-full">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-200 rounded shimmer-effect"></div>
                  ))}
                </div>
                <div className="w-8 h-3 bg-gray-200 rounded ml-1 shimmer-effect"></div>
              </div>
            </div>
            
            {/* Price placeholder */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-10 h-4 sm:w-12 sm:h-6 bg-gray-200 rounded shimmer-effect"></div>
                <div className="w-8 h-3 bg-gray-200 rounded shimmer-effect"></div>
              </div>
              
              {/* Add to cart button placeholder */}
              <div className="w-8 h-8 bg-gray-200 rounded-full shimmer-effect"></div>
            </div>
            
            {/* Color options placeholder */}
            <div className="mt-2 flex items-center space-x-1">
              <div className="w-10 h-3 bg-gray-200 rounded shimmer-effect"></div>
              <div className="flex space-x-1">
                {[1, 2, 3].map((color) => (
                  <div key={color} className="w-4 h-4 bg-gray-200 rounded-full shimmer-effect"></div>
                ))}
                <div className="w-6 h-3 bg-gray-200 rounded shimmer-effect"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .shimmer-effect {
          position: relative;
          overflow: hidden;
        }
        
        .shimmer-effect::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.3) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default ProductThumbnailsShimmer;
