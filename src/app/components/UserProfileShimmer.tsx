// components/UserProfileShimmer.tsx
const UserProfileShimmer = () => {
  return (
    <div className="bg-gray-50 min-h-screen max-w-2xl mx-auto">
      {/* Cover Photo Shimmer */}
      <div className="h-48 md:h-60 lg:h-80 bg-gradient-to-r from-violet-100 to-indigo-100 relative overflow-hidden">
        <div className="shimmer-overlay"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>
      
      <div className="px-4 sm:px-6 md:px-8">
        {/* Profile Picture Shimmer */}
        <div className="relative -mt-16 mb-4">
          <div className="w-32 h-32 rounded-full bg-gray-300 border-4 border-white mx-auto overflow-hidden relative">
            <div className="shimmer-overlay"></div>
          </div>
        </div>
        
        {/* User Name Shimmer */}
        <div className="h-8 bg-gray-300 rounded-md w-3/5 mx-auto mb-4 overflow-hidden relative">
          <div className="shimmer-overlay"></div>
        </div>
        
        {/* User Bio Shimmer */}
        <div className="space-y-3 mb-6">
          <div className="h-4 bg-gray-300 rounded w-full overflow-hidden relative">
            <div className="shimmer-overlay"></div>
          </div>
          <div className="h-4 bg-gray-300 rounded w-5/6 overflow-hidden relative">
            <div className="shimmer-overlay"></div>
          </div>
          <div className="h-4 bg-gray-300 rounded w-4/6 overflow-hidden relative">
            <div className="shimmer-overlay"></div>
          </div>
        </div>
        
        {/* Stats Shimmer */}
        <div className="flex justify-center space-x-8 mb-6">
          {[1, 2, 3].map((item) => (
            <div key={item} className="text-center">
              <div className="h-6 bg-gray-300 rounded w-12 mx-auto mb-2 overflow-hidden relative">
                <div className="shimmer-overlay"></div>
              </div>
              <div className="h-4 bg-gray-300 rounded w-16 mx-auto overflow-hidden relative">
                <div className="shimmer-overlay"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Tab Navigation Shimmer */}
        <div className="flex border-b border-gray-200 mb-6">
          {[1, 2, 3].map((item) => (
            <div key={item} className="mr-8 pb-3">
              <div className="h-6 bg-gray-300 rounded w-16 overflow-hidden relative">
                <div className="shimmer-overlay"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Content Grid Shimmer */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="aspect-square bg-gray-300 rounded-md overflow-hidden relative">
              <div className="shimmer-overlay"></div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Shimmer Animation Styles */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .shimmer-overlay {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
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

export default UserProfileShimmer;
