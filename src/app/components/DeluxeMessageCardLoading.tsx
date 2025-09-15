// components/DeluxeMessageCardLoading.tsx
import React from 'react';

const DeluxeMessageCardLoading: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden mb-6">
      {/* Card Header Skeleton */}
      <div className="flex items-center p-4 border-b border-gray-200">
        <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden mr-3 relative bg-gray-200 animate-pulse"></div>
        
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </div>
        
        <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
      </div>
      
      {/* Message Content Skeleton */}
      <div className="p-4">
        {/* Text lines */}
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>
        </div>
        
        {/* Post Image Skeleton (if any) */}
        <div className="relative h-80 md:h-96 w-full mb-3 rounded-lg overflow-hidden bg-gray-200 animate-pulse"></div>
        
        {/* Engagement Metrics Skeleton */}
        <div className="flex justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center">
            <div className="flex -space-x-1 mr-1">
              <div className="w-5 h-5 rounded-full bg-gray-200 border-2 border-white animate-pulse"></div>
              <div className="w-5 h-5 rounded-full bg-gray-200 border-2 border-white animate-pulse"></div>
              <div className="w-5 h-5 rounded-full bg-gray-200 border-2 border-white animate-pulse"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
          </div>
          <div className="flex space-x-2">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-14 animate-pulse"></div>
          </div>
        </div>
        
        {/* Action Buttons Skeleton */}
        <div className="flex justify-between border-t border-b border-gray-200 py-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center justify-center flex-1 py-1">
              <div className="h-5 w-5 bg-gray-200 rounded mr-1 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
            </div>
          ))}
        </div>
        
        {/* Comment Input Skeleton */}
        <div className="flex items-center mt-3">
          <div className="flex-shrink-0 h-8 w-8 rounded-full overflow-hidden mr-2 relative bg-gray-200 animate-pulse"></div>
          <div className="flex-1 bg-gray-200 rounded-full py-2 px-4 animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-2/3"></div>
          </div>
        </div>
      </div>
      
      {/* Message Status Skeleton */}
      <div className="px-4 py-2 bg-gray-50 text-right">
        <div className="h-3 bg-gray-200 rounded w-12 ml-auto animate-pulse"></div>
      </div>
    </div>
  );
};

export default DeluxeMessageCardLoading;
