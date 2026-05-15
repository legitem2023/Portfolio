import React from 'react';

const ShippingStageShimmer = () => {
  return (
    <div className="animate-pulse">
      <h2 className="text-2xl font-serif font-bold text-indigo-900 mb-6 pb-2 border-b border-indigo-100">
        Shipping Information
      </h2>

      {/* Saved Addresses Shimmer */}
      <div className="mb-8">
        <div className="h-6 w-48 bg-gradient-to-r from-indigo-100 to-indigo-50 rounded mb-4"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {[1, 2].map((i) => (
            <div key={i} className="border-2 border-indigo-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-20 bg-gradient-to-r from-indigo-100 to-indigo-50 rounded"></div>
                  <div className="h-4 w-16 bg-gradient-to-r from-indigo-100 to-indigo-50 rounded-full"></div>
                </div>
                <div className="w-3 h-3 bg-gradient-to-r from-indigo-100 to-indigo-50 rounded-full"></div>
              </div>
              
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gradient-to-r from-indigo-100 to-indigo-50 rounded"></div>
                <div className="h-4 w-40 bg-gradient-to-r from-indigo-100 to-indigo-50 rounded"></div>
                <div className="h-4 w-36 bg-gradient-to-r from-indigo-100 to-indigo-50 rounded"></div>
                <div className="h-4 w-24 bg-gradient-to-r from-indigo-100 to-indigo-50 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-4 w-32 bg-gradient-to-r from-indigo-100 to-indigo-50 rounded"></div>
      </div>

      {/* Form Shimmer */}
      <div className="space-y-5">
        {/* Full Name Field */}
        <div>
          <div className="h-4 w-24 bg-gradient-to-r from-indigo-100 to-indigo-50 rounded mb-2"></div>
          <div className="h-12 w-full bg-gradient-to-r from-indigo-100 to-indigo-50 rounded-lg"></div>
        </div>
        
        {/* Address Field */}
        <div>
          <div className="h-4 w-20 bg-gradient-to-r from-indigo-100 to-indigo-50 rounded mb-2"></div>
          <div className="h-12 w-full bg-gradient-to-r from-indigo-100 to-indigo-50 rounded-lg"></div>
        </div>
        
        {/* City and ZIP Code Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <div className="h-4 w-16 bg-gradient-to-r from-indigo-100 to-indigo-50 rounded mb-2"></div>
            <div className="h-12 w-full bg-gradient-to-r from-indigo-100 to-indigo-50 rounded-lg"></div>
          </div>
          <div>
            <div className="h-4 w-20 bg-gradient-to-r from-indigo-100 to-indigo-50 rounded mb-2"></div>
            <div className="h-12 w-full bg-gradient-to-r from-indigo-100 to-indigo-50 rounded-lg"></div>
          </div>
        </div>

        {/* State Field */}
        <div>
          <div className="h-4 w-32 bg-gradient-to-r from-indigo-100 to-indigo-50 rounded mb-2"></div>
          <div className="h-12 w-full bg-gradient-to-r from-indigo-100 to-indigo-50 rounded-lg"></div>
        </div>
        
        {/* Country Field */}
        <div>
          <div className="h-4 w-20 bg-gradient-to-r from-indigo-100 to-indigo-50 rounded mb-2"></div>
          <div className="h-12 w-full bg-gradient-to-r from-indigo-100 to-indigo-50 rounded-lg"></div>
        </div>
      </div>

      {/* Buttons Shimmer */}
      <div className="flex justify-between mt-8">
        <div className="h-11 w-28 bg-gradient-to-r from-indigo-100 to-indigo-50 rounded-lg"></div>
        <div className="h-11 w-48 bg-gradient-to-r from-indigo-100 to-indigo-50 rounded-lg"></div>
      </div>

      {/* Shimmer Animation Overlay */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
      </div>
    </div>
  );
};

export default ShippingStageShimmer;
