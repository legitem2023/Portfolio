// components/UserProfileShimmerRed.tsx
'use client';

const UserProfileShimmerRed = () => {
  return (
    <div className="bg-red-50 min-h-screen max-w-2xl">
      {/* Cover Photo Shimmer with red theme */}
      <div className="h-48 md:h-60 lg:h-80 bg-gradient-to-r from-red-100 to-red-200 animate-pulse relative">
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-red-300/20 to-transparent"></div>
        
        {/* Profile Picture Shimmer */}
        <div className="absolute -bottom-12 md:-bottom-16 left-4 md:left-8 transform md:transform-none">
          <div className="relative w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-r from-red-100 to-red-200 animate-pulse"></div>
        </div>
      </div>

      {/* Profile Info Shimmer */}
      <div className="max-w-4xl mx-auto px-4 pt-16 md:pt-20 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="w-full md:w-auto">
            <div className="h-8 bg-gradient-to-r from-red-100 to-red-200 rounded-md animate-pulse w-48 mb-2"></div>
            <div className="h-4 bg-gradient-to-r from-red-100 to-red-200 rounded-md animate-pulse w-32"></div>
            
            <div className="flex gap-4 md:gap-6 mt-4">
              <div className="h-5 bg-gradient-to-r from-red-100 to-red-200 rounded-md animate-pulse w-16"></div>
              <div className="h-5 bg-gradient-to-r from-red-100 to-red-200 rounded-md animate-pulse w-20"></div>
              <div className="h-5 bg-gradient-to-r from-red-100 to-red-200 rounded-md animate-pulse w-20"></div>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4 md:mt-0 w-full md:w-auto justify-start md:justify-end">
            <div className="h-10 bg-gradient-to-r from-red-100 to-red-200 rounded-md animate-pulse w-24"></div>
            <div className="h-10 bg-gradient-to-r from-red-100 to-red-200 rounded-md animate-pulse w-28"></div>
            <div className="h-10 bg-gradient-to-r from-red-100 to-red-200 rounded-md animate-pulse w-10"></div>
          </div>
        </div>
        
        {/* Tabs Navigation Shimmer */}
        <div className="mt-6 border-t border-red-200 flex overflow-x-auto scrollbar-hide">
          <div className="flex space-x-4 md:space-x-8 min-w-max">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="px-3 py-3 md:px-4 md:py-3 flex items-center">
                <div className="h-5 bg-gradient-to-r from-red-100 to-red-200 rounded-md animate-pulse w-16"></div>
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
              <div className="aspect-square relative overflow-hidden bg-gradient-to-r from-red-100 to-red-200 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserProfileShimmerRed;
