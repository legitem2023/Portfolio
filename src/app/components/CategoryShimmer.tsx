// components/CategoryShimmer.tsx
"use client";
import React from 'react';

const CategoryShimmer: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="group relative overflow-hidden rounded-2xl shadow-lg bg-white">
          {/* Image placeholder */}
          <div className="w-full h-80 bg-gray-200 relative overflow-hidden">
            <div className="shimmer-effect absolute inset-0"></div>
          </div>
          
          {/* Content overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-6">
            {/* Title placeholder */}
            <div className="h-6 bg-gray-300 rounded mb-1 relative overflow-hidden">
              <div className="shimmer-effect absolute inset-0"></div>
            </div>
            
            {/* Items count placeholder */}
            <div className="h-4 w-1/2 bg-gray-300 rounded mb-4 relative overflow-hidden">
              <div className="shimmer-effect absolute inset-0"></div>
            </div>
            
            {/* Button placeholder */}
            <div className="h-5 w-1/4 bg-gray-300 rounded relative overflow-hidden">
              <div className="shimmer-effect absolute inset-0"></div>
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
          animation: shimmer 1.5s infinite;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.3) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
};

export default CategoryShimmer;
