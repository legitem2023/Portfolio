"use client";

export default function NewDeliveriesTabShimmer({ isMobile }: { isMobile: boolean }) {
  return (
    <div className="p-2 lg:p-6">
      {/* Header Section Shimmer */}
      <div className="flex justify-between items-center mb-3 lg:mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-1 lg:gap-2 mb-2">
            <div className="w-5 h-5 lg:w-6 lg:h-6 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-full shimmer-animation"></div>
            <div className="h-6 lg:h-8 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg shimmer-animation w-40 lg:w-48"></div>
          </div>
          <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg shimmer-animation w-32 lg:w-48"></div>
        </div>
        <div className="flex items-center gap-1 lg:gap-2">
          <div className="w-3.5 h-3.5 lg:w-4 lg:h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-full shimmer-animation"></div>
          <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg shimmer-animation w-24 lg:w-32 hidden sm:block"></div>
          <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg shimmer-animation w-16 sm:hidden"></div>
          <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg shimmer-animation w-12 lg:w-14 ml-1 lg:ml-2"></div>
        </div>
      </div>

      {/* Delivery Cards Shimmer - Show 2 shimmer cards */}
      <div className="space-y-3 lg:space-y-6">
        {[...Array(2)].map((_, index) => (
          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden shimmer-container">
            <div className="p-3 lg:p-6">
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg shimmer-animation"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg w-32 lg:w-40 mb-2 shimmer-animation"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg w-24 lg:w-32 shimmer-animation"></div>
                  </div>
                </div>
                <div className="flex gap-2 self-end sm:self-auto">
                  <div className="h-8 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg w-16 lg:w-20 shimmer-animation"></div>
                  <div className="h-8 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg w-16 lg:w-20 shimmer-animation"></div>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3 mb-4">
                {[...Array(2)].map((_, itemIndex) => (
                  <div key={itemIndex} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg shimmer-animation"></div>
                      <div>
                        <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg w-24 lg:w-32 mb-1 shimmer-animation"></div>
                        <div className="h-3 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg w-16 lg:w-20 shimmer-animation"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg w-12 lg:w-16 shimmer-animation"></div>
                  </div>
                ))}
              </div>

              {/* Delivery Info */}
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-full shimmer-animation"></div>
                  <div className="h-3 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg w-20 lg:w-24 shimmer-animation"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-full shimmer-animation"></div>
                  <div className="h-3 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg w-24 lg:w-28 shimmer-animation"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-full shimmer-animation"></div>
                  <div className="h-3 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg w-16 lg:w-20 shimmer-animation"></div>
                </div>
              </div>

              {/* Price Section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t pt-4 gap-3">
                <div>
                  <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg w-20 lg:w-24 mb-1 shimmer-animation"></div>
                  <div className="h-6 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg w-24 lg:w-28 shimmer-animation"></div>
                </div>
                <div>
                  <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg w-16 lg:w-20 mb-1 shimmer-animation"></div>
                  <div className="h-6 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg w-20 lg:w-24 shimmer-animation"></div>
                </div>
                <div>
                  <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg w-20 lg:w-24 mb-1 shimmer-animation"></div>
                  <div className="h-6 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg w-24 lg:w-28 shimmer-animation"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Stats Shimmer */}
      <div className="mt-4 lg:mt-8 grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-gray-50 p-2 lg:p-4 rounded-lg border border-gray-100 shimmer-container">
            <div className="h-3 lg:h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg w-20 lg:w-24 mb-2 shimmer-animation"></div>
            <div className="h-6 lg:h-8 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg w-16 lg:w-20 shimmer-animation"></div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        
        .shimmer-animation {
          background: linear-gradient(
            90deg,
            #f3f4f6 0%,
            #e5e7eb 50%,
            #f3f4f6 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 2s infinite linear;
        }
        
        .shimmer-container {
          position: relative;
          overflow: hidden;
        }
        
        .shimmer-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.6),
            transparent
          );
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
}
