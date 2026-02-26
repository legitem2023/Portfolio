'use client';

const CartStageShimmer = () => {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Title shimmer */}
        <div className="h-8 md:h-10 w-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg mb-6 md:mb-8 shimmer"></div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items Section */}
          <div className="flex-1">
            <div className="flow-root">
              <ul role="list" className="-my-6 divide-y divide-gray-200">
                {/* Generate 3 shimmer items */}
                {[1, 2, 3].map((index) => (
                  <li key={index} className="flex py-4 md:py-6">
                    {/* Image shimmer */}
                    <div className="h-16 w-16 md:h-24 md:w-24 flex-shrink-0 overflow-hidden rounded-md bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 shimmer"></div>

                    {/* Product Details shimmer */}
                    <div className="ml-3 md:ml-4 flex flex-1 flex-col">
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <div className="flex-1">
                          {/* Product name shimmer */}
                          <div className="h-4 md:h-5 w-32 md:w-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded shimmer"></div>
                          
                          {/* Color and size shimmer */}
                          <div className="mt-2 flex items-center space-x-2 md:space-x-4">
                            <div className="h-4 w-4 md:h-6 md:w-6 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 shimmer"></div>
                            <div className="h-3 md:h-4 w-12 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded shimmer"></div>
                          </div>
                        </div>
                        {/* Price shimmer */}
                        <div className="h-4 md:h-5 w-16 md:w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded mt-1 sm:mt-0 sm:ml-4 shimmer"></div>
                      </div>

                      {/* Quantity Controls and Actions shimmer */}
                      <div className="flex flex-1 items-end justify-between mt-2 md:mt-4">
                        <div className="flex items-center space-x-2">
                          <div className="h-3 md:h-4 w-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded shimmer"></div>
                          <div className="h-7 w-20 md:h-8 md:w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-md shimmer"></div>
                        </div>
                        
                        {/* Remove button shimmer */}
                        <div className="h-4 md:h-5 w-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded shimmer"></div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartStageShimmer;
