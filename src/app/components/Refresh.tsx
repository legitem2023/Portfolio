import React, { useState } from 'react';

const Refresh = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh action
    setTimeout(() => {
      setIsRefreshing(false);
      window.location.reload(); // Or your refresh logic
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg">
      {/* Error Icon */}
      <div className="w-16 h-16 mb-4 flex items-center justify-center bg-red-100 rounded-full">
        <svg 
          className="w-8 h-8 text-red-500" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      {/* Error Message */}
      <p className="text-gray-700 text-lg font-medium mb-2">
        Something went wrong
      </p>
      <p className="text-gray-500 text-sm mb-6 text-center max-w-md">
        We encountered an issue loading your content. Please try refreshing.
      </p>

      {/* Refresh Button */}
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={`
          flex items-center gap-2 px-6 py-3 
          bg-gradient-to-r from-blue-500 to-blue-600 
          text-white font-medium rounded-lg
          transition-all duration-300
          hover:from-blue-600 hover:to-blue-700
          hover:shadow-lg hover:-translate-y-0.5
          active:translate-y-0
          disabled:opacity-70 disabled:cursor-not-allowed
        `}
      >
        {isRefreshing ? (
          <>
            {/* Spinner */}
            <svg 
              className="w-5 h-5 animate-spin" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Refreshing...
          </>
        ) : (
          <>
            {/* Refresh Icon */}
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh Page
          </>
        )}
      </button>
    </div>
  );
};

export default Refresh;
