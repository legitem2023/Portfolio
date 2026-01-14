// components/ProductThumbnailsShimmer.tsx
import React from 'react';

interface ProductThumbnailsShimmerProps {
  count?: number;
}

const ProductThumbnailsShimmer: React.FC<ProductThumbnailsShimmerProps> = ({ count = 20 }) => {
  return (
    <div className="w-full max-w-7xl grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-3 lg:gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="group bg-white shadow-md border border-gray-100 flex flex-col h-full">
          {/* Sale/New Badge placeholders */}

          
          {/* Product Image placeholder */}
          <div className="relative overflow-hidden bg-gray-100 flex-grow">
            <div className="aspect-square w-full">
              <div className="w-full h-full bg-gray-200 shimmer-effect"></div>
              
              {/* Quick View Button placeholder */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-white px-2 py-1 w-16 h-6 rounded-md shimmer-effect"></div>
              </div>
            </div>
          </div>
          
          {/* Product Details */}
          <div className="p-2 sm:p-3 flex flex-col flex-grow">
            <div className="flex justify-between items-start mb-1 sm:mb-2 flex-grow">
              {/* Product name placeholder */}
              <div className="w-full h-3 bg-gray-200 rounded shimmer-effect"></div>
              
              {/* Wishlist Button placeholder */}
              <div className="text-gray-400 flex-shrink-0 ml-1">
                <div className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 bg-gray-200 rounded shimmer-effect"></div>
              </div>
            </div>
            
            {/* Rating placeholder */}
            <div className="flex items-center mb-1 sm:mb-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 bg-gray-200 rounded-full shimmer-effect"
                  ></div>
                ))}
                <div className="w-4 h-3 bg-gray-200 rounded ml-0.5 xs:ml-1 shimmer-effect"></div>
              </div>
            </div>
            
            {/* Price placeholder */}
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center space-x-1">
                <div className="text-xs xs:text-sm sm:text-base md:text-lg w-16 h-4 bg-gray-200 rounded shimmer-effect"></div>
                <div className="text-[10px] xs:text-xs w-12 h-3 bg-gray-200 rounded shimmer-effect"></div>
              </div>
              
              {/* Add to Cart Button placeholder */}
              <div className="bg-gray-200 p-1 xs:p-1.5 sm:p-2 rounded-full w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 shimmer-effect"></div>
            </div>
            
            {/* Color Options placeholder */}
            <div className="mt-1 sm:mt-2 flex items-center space-x-1">
              <div className="text-[10px] xs:text-xs w-10 h-3 bg-gray-200 rounded shimmer-effect"></div>
              <div className="flex space-x-0.5 xs:space-x-1">
                {[1, 2, 3].map((color) => (
                  <div
                    key={color}
                    className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 rounded-full bg-gray-200 shimmer-effect"
                  ></div>
                ))}
                <div className="text-[10px] xs:text-xs w-6 h-3 bg-gray-200 rounded shimmer-effect"></div>
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
