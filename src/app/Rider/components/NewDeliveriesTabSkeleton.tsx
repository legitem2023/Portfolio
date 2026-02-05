"use client";

export default function NewDeliveriesTabSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div className="p-2 lg:p-6">
      {/* Header Section Skeleton */}
      <div className="flex justify-between items-center mb-3 lg:mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-1 lg:gap-2 mb-2">
            <div className="w-5 h-5 lg:w-6 lg:h-6 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-6 lg:h-8 bg-gray-200 rounded-lg animate-pulse w-40 lg:w-48"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-32 lg:w-48"></div>
        </div>
        <div className="flex items-center gap-1 lg:gap-2">
          <div className="w-3.5 h-3.5 lg:w-4 lg:h-4 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-24 lg:w-32 hidden sm:block"></div>
          <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-16 sm:hidden"></div>
          <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-12 lg:w-14 ml-1 lg:ml-2"></div>
        </div>
      </div>

      {/* Delivery Cards Skeleton - Show 2 skeleton cards */}
      <div className="space-y-3 lg:space-y-6">
        {[...Array(2)].map((_, index) => (
          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden animate-pulse">
            <div className="p-3 lg:p-6">
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded-lg w-32 lg:w-40 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded-lg w-24 lg:w-32"></div>
                  </div>
                </div>
                <div className="flex gap-2 self-end sm:self-auto">
                  <div className="h-8 bg-gray-200 rounded-lg w-16 lg:w-20"></div>
                  <div className="h-8 bg-gray-200 rounded-lg w-16 lg:w-20"></div>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3 mb-4">
                {[...Array(2)].map((_, itemIndex) => (
                  <div key={itemIndex} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-200 rounded-lg"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded-lg w-24 lg:w-32 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded-lg w-16 lg:w-20"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded-lg w-12 lg:w-16"></div>
                  </div>
                ))}
              </div>

              {/* Delivery Info */}
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                  <div className="h-3 bg-gray-200 rounded-lg w-20 lg:w-24"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                  <div className="h-3 bg-gray-200 rounded-lg w-24 lg:w-28"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                  <div className="h-3 bg-gray-200 rounded-lg w-16 lg:w-20"></div>
                </div>
              </div>

              {/* Price Section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t pt-4 gap-3">
                <div>
                  <div className="h-4 bg-gray-200 rounded-lg w-20 lg:w-24 mb-1"></div>
                  <div className="h-6 bg-gray-200 rounded-lg w-24 lg:w-28"></div>
                </div>
                <div>
                  <div className="h-4 bg-gray-200 rounded-lg w-16 lg:w-20 mb-1"></div>
                  <div className="h-6 bg-gray-200 rounded-lg w-20 lg:w-24"></div>
                </div>
                <div>
                  <div className="h-4 bg-gray-200 rounded-lg w-20 lg:w-24 mb-1"></div>
                  <div className="h-6 bg-gray-200 rounded-lg w-24 lg:w-28"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Stats Skeleton */}
      <div className="mt-4 lg:mt-8 grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-gray-50 p-2 lg:p-4 rounded-lg border border-gray-100 animate-pulse">
            <div className="h-3 lg:h-4 bg-gray-200 rounded-lg w-20 lg:w-24 mb-2"></div>
            <div className="h-6 lg:h-8 bg-gray-200 rounded-lg w-16 lg:w-20"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
