'use client';

const CartStageShimmer = () => {
  const currentStage = 'cart';

  return (
    <div>
      {/* Checkout Steps with Shimmer */}
      <div className="relative overflow-hidden rounded-lg mb-6">
        <div className="flex justify-between relative mb-6 sm:mb-8 md:mb-10">
          <div className="absolute top-3 left-0 right-0 h-0.5 bg-indigo-200 z-0"></div>
          
          {['cart', 'shipping', 'payment', 'confirmation'].map((stage, index) => {
            const stageIndex = ['cart', 'shipping', 'payment', 'confirmation'].indexOf(currentStage);
            const isCompleted = index < stageIndex;
            const isActive = index === stageIndex;
            
            return (
              <div key={stage} className="flex flex-col items-center relative z-10">
                <div className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center border-2 text-xs sm:text-sm ${
                  isActive || isCompleted
                    ? 'bg-indigo-500 border-indigo-500 text-white' 
                    : 'bg-white border-indigo-300 text-indigo-300'
                }`}>
                  
                </div>
                <span className={`mt-1 text-xs sm:text-sm font-medium ${
                  isActive || isCompleted ? 'text-indigo-800' : 'text-indigo-400'
                }`}>
                  {stage.charAt(0).toUpperCase() + stage.slice(1)}
                </span>
              </div>
            );
          })}
        </div>
        {/* Shimmer overlay - this creates the moving light effect */}
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
      </div>

      {/* Cart Items Shimmer */}
      <div className="bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
          {/* Title shimmer - using background with animation overlay */}
          <div className="relative overflow-hidden h-8 md:h-10 w-48 bg-gray-200 rounded-lg mb-6 md:mb-8">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items Section */}
            <div className="flex-1">
              <div className="flow-root">
                <ul role="list" className="-my-6 divide-y divide-gray-200">
                  {/* Generate 3 shimmer items */}
                  {[1, 2, 3].map((index) => (
                    <li key={index} className="flex py-4 md:py-6">
                      {/* Image shimmer */}
                      <div className="relative overflow-hidden h-16 w-16 md:h-24 md:w-24 flex-shrink-0 rounded-md bg-gray-200">
                        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                      </div>

                      {/* Product Details shimmer */}
                      <div className="ml-3 md:ml-4 flex flex-1 flex-col">
                        <div className="flex flex-col sm:flex-row sm:justify-between">
                          <div className="flex-1 space-y-2">
                            {/* Product name shimmer */}
                            <div className="relative overflow-hidden h-4 md:h-5 w-32 md:w-48 bg-gray-200 rounded">
                              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                            </div>
                            
                            {/* Color and size shimmer */}
                            <div className="flex items-center space-x-2 md:space-x-4">
                              <div className="relative overflow-hidden h-4 w-4 md:h-6 md:w-6 rounded-full bg-gray-200">
                                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                              </div>
                              <div className="relative overflow-hidden h-3 md:h-4 w-12 bg-gray-200 rounded">
                                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                              </div>
                            </div>
                          </div>
                          {/* Price shimmer */}
                          <div className="relative overflow-hidden h-4 md:h-5 w-16 md:w-20 bg-gray-200 rounded mt-1 sm:mt-0 sm:ml-4">
                            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                          </div>
                        </div>

                        {/* Quantity Controls and Actions shimmer */}
                        <div className="flex flex-1 items-end justify-between mt-2 md:mt-4">
                          <div className="flex items-center space-x-2">
                            <div className="relative overflow-hidden h-3 md:h-4 w-6 bg-gray-200 rounded">
                              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                            </div>
                            <div className="relative overflow-hidden h-7 w-20 md:h-8 md:w-24 bg-gray-200 rounded-md">
                              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                            </div>
                          </div>
                          
                          {/* Remove button shimmer */}
                          <div className="relative overflow-hidden h-4 md:h-5 w-16 bg-gray-200 rounded">
                            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                          </div>
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
    </div>
  );
};

export default CartStageShimmer;
