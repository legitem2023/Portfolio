// components/UserProfileShimmer.tsx
'use client';

const UserProfileShimmer = () => {
  return (
    <div className="bg-gray-100 min-h-screen max-w-2xl">
      {/* Cover Photo Shimmer */}
      <div className="h-36 bg-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 shimmer-effect"></div>
        <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-gray-300/20 to-transparent"></div>
        
        {/* Profile Picture Shimmer */}
        <div className="absolute -bottom-12 md:-bottom-16 left-4 md:left-8 transform md:transform-none bg-transparent">
          <div className="relative w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full border-4 border-white shadow-lg bg-gray-300 overflow-hidden">
            <div className="absolute inset-0 shimmer-effect"></div>
          </div>
        </div>
      </div>

      {/* Profile Info Shimmer */}
      <div className="max-w-4xl mx-auto px-4 pt-16 md:pt-20 pb-4 bg-transparent">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="w-full md:w-auto">
            <div className="relative h-8 bg-gray-300 rounded-md overflow-hidden w-48 mb-2">
              <div className="absolute inset-0 shimmer-effect"></div>
            </div>
            <div className="relative h-4 bg-gray-300 rounded-md overflow-hidden w-32">
              <div className="absolute inset-0 shimmer-effect"></div>
            </div>
            
            <div className="flex gap-4 md:gap-6 mt-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="relative h-5 bg-gray-300 rounded-md overflow-hidden w-16">
                  <div className="absolute inset-0 shimmer-effect"></div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2 mt-4 md:mt-0 w-full md:w-auto justify-start md:justify-end">
            {[1, 2, 3].map((item) => (
              <div key={item} className="relative h-10 bg-gray-300 rounded-md overflow-hidden" 
                style={{ width: item === 1 ? '96px' : item === 2 ? '112px' : '40px' }}>
                <div className="absolute inset-0 shimmer-effect"></div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Tabs Navigation Shimmer */}
        <div className="mt-6 border-t border-transparent flex overflow-x-auto scrollbar-hide">
          <div className="flex space-x-4 md:space-x-8 min-w-max">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="px-3 py-3 md:px-4 md:py-3 flex items-center">
                <div className="relative h-5 bg-gray-300 rounded-md overflow-hidden w-16">
                  <div className="absolute inset-0 shimmer-effect"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Posts Grid Shimmer */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="relative group cursor-pointer rounded-lg overflow-hidden shadow-md">
              <div className="aspect-square bg-gray-300 relative overflow-hidden">
                <div className="absolute inset-0 shimmer-effect"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) translateY(-100%);
          }
          100% {
            transform: translateX(100%) translateY(100%);
          }
        }
        
        .shimmer-effect {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            115deg,
            transparent 0%,
            transparent 40%,
            rgba(255, 255, 255, 0.6) 50%,
            transparent 60%,
            transparent 100%
          );
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default UserProfileShimmer;
