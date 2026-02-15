"use client";

interface ActiveDeliveryCardSkelitonErrorProps {
  isMobile: boolean;
}

export default function ActiveDeliveryCardSkelitonError({ isMobile }: ActiveDeliveryCardSkelitonErrorProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-red-200 overflow-hidden">
      {/* Header Skeleton */}
      <div className="bg-red-50 px-3 lg:px-4 py-2 lg:py-3 border-b border-red-100">
        <div className="flex items-center gap-1 lg:gap-2">
          <div className="w-2 h-2 bg-red-200 rounded-full"></div>
          <div className="h-4 w-24 bg-red-200 rounded error-shimmer"></div>
        </div>
      </div>

      <div className="p-2 lg:p-6">
        {/* Order info Skeleton */}
        <div className="flex justify-between items-start mb-3 lg:mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-1 lg:gap-2 mb-1 lg:mb-2">
              <div className="w-4 h-4 bg-red-100 rounded error-shimmer"></div>
              <div>
                <div className="h-6 w-32 bg-red-100 rounded error-shimmer mb-2"></div>
                <div className="h-3 w-48 bg-red-100 rounded error-shimmer"></div>
              </div>
            </div>
            <div className="flex items-center gap-1 lg:gap-2 mb-0.5 lg:mb-1">
              <div className="w-3.5 h-3.5 bg-red-100 rounded error-shimmer"></div>
              <div className="h-4 w-40 bg-red-100 rounded error-shimmer"></div>
            </div>
            <div className="flex items-center gap-1 lg:gap-2">
              <div className="w-3.5 h-3.5 bg-red-100 rounded error-shimmer"></div>
              <div className="h-4 w-32 bg-red-100 rounded error-shimmer"></div>
            </div>
          </div>
          <div className="text-right">
            <div className="h-8 w-24 bg-red-100 rounded error-shimmer mb-1"></div>
            <div className="h-3 w-20 bg-red-100 rounded error-shimmer"></div>
          </div>
        </div>

        {/* Item details Skeleton */}
        <div className="mb-3 lg:mb-4 bg-red-50 p-2 lg:p-3 rounded-lg">
          <div className="flex items-center gap-1 lg:gap-2 mb-1 lg:mb-2">
            <div className="w-3.5 h-3.5 bg-red-100 rounded error-shimmer"></div>
            <div className="h-4 w-32 bg-red-100 rounded error-shimmer"></div>
          </div>
          <div className="space-y-1 lg:space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-32 bg-red-100 rounded error-shimmer"></div>
                  <div className="h-3 w-12 bg-red-100 rounded error-shimmer"></div>
                </div>
                <div className="h-3 w-16 bg-red-100 rounded error-shimmer"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Route info Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-4 mb-4 lg:mb-6">
          <div className="bg-red-50 p-2 lg:p-3 rounded-lg">
            <div className="flex items-center gap-1 lg:gap-2 mb-1 lg:mb-2">
              <div className="w-3.5 h-3.5 bg-red-200 rounded error-shimmer"></div>
              <div className="h-3 w-20 bg-red-200 rounded error-shimmer"></div>
            </div>
            <div className="h-3 w-full bg-red-200 rounded error-shimmer mb-1"></div>
            <div className="h-2 w-24 bg-red-200 rounded error-shimmer"></div>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="w-full border-t-2 border-dashed border-red-200 relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-1 lg:px-2">
                <div className="flex items-center gap-0.5 lg:gap-1">
                  <div className="w-3 h-3 bg-red-100 rounded error-shimmer"></div>
                  <div className="h-3 w-12 bg-red-100 rounded error-shimmer"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 p-2 lg:p-3 rounded-lg">
            <div className="flex items-center gap-1 lg:gap-2 mb-1 lg:mb-2">
              <div className="w-3.5 h-3.5 bg-red-200 rounded error-shimmer"></div>
              <div className="h-3 w-20 bg-red-200 rounded error-shimmer"></div>
            </div>
            <div className="h-3 w-full bg-red-200 rounded error-shimmer mb-1"></div>
            <div className="h-2 w-24 bg-red-200 rounded error-shimmer"></div>
          </div>
        </div>

        {/* Additional info Skeleton */}
        <div className="flex flex-wrap gap-2 lg:gap-4 mb-4 lg:mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-1 lg:gap-2 bg-red-50 px-2 lg:px-3 py-1 lg:py-2 rounded-lg">
              <div className="w-3.5 h-3.5 bg-red-100 rounded error-shimmer"></div>
              <div className="h-3 w-16 bg-red-100 rounded error-shimmer"></div>
            </div>
          ))}
        </div>

        {/* Action buttons Skeleton */}
        <div className="grid grid-cols-2 gap-2 lg:gap-4">
          <div className="h-10 lg:h-12 bg-red-200 rounded-lg error-shimmer"></div>
          <div className="h-10 lg:h-12 bg-red-100 rounded-lg error-shimmer"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes errorShimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        
        .error-shimmer {
          animation: errorShimmer 2s infinite linear;
          background: linear-gradient(
            to right,
            #fee2e2 0%,
            #fecaca 20%,
            #fee2e2 40%,
            #fee2e2 100%
          );
          background-size: 1000px 100%;
        }
      `}</style>
    </div>
  );
}
