// components/ColdStartErrorUI.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ColdStartErrorUI() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleFullRefresh = () => {
    setIsRefreshing(true);
    // Hard refresh - clears cache and reloads everything
    window.location.href = window.location.href;
  };

  const handleSoftRefresh = () => {
    setIsRefreshing(true);
    // Try router refresh first (preserves some state)
    router.refresh();
    // Fallback to hard refresh after delay if needed
    setTimeout(() => {
      if (!isRefreshing) {
        window.location.href = window.location.href;
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Warning Icon */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full">
            <svg 
              className="w-10 h-10 text-yellow-600" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Session Expired
        </h1>

        {/* Message */}
        <div className="text-gray-600 mb-8 space-y-3">
          <p>
            Your session has timed out due to inactivity.
          </p>
          <p className="text-sm text-gray-500">
            This can happen when you leave the page open for too long. 
            Dont worry, your data is safe.
          </p>
        </div>

        {/* Refresh Button */}
        <div className="space-y-4">
          <button
            onClick={handleFullRefresh}
            disabled={isRefreshing}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center"
          >
            <svg 
              className={`w-5 h-5 mr-3 ${isRefreshing ? 'animate-spin' : ''}`} 
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
            {isRefreshing ? 'Refreshing...' : 'Refresh Page'}
          </button>

          <button
            onClick={handleSoftRefresh}
            disabled={isRefreshing}
            className="w-full py-3 px-6 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Try Quick Refresh
          </button>
        </div>

        {/* Additional Information */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <details className="text-left">
            <summary className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer list-none">
              Why did this happen?
            </summary>
            <div className="mt-3 p-4 bg-gray-50 rounded-lg">
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Page was left idle for an extended period</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Browser cleared temporary data to save memory</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Session tokens expired for security reasons</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Service worker cache needs updating</span>
                </li>
              </ul>
            </div>
          </details>
        </div>

        {/* Prevent Future Occurrences Tip */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-700">
            <strong>Tip:</strong> To prevent this, keep the page active or refresh 
            periodically if leaving it open for a long time.
          </p>
        </div>
      </div>
    </div>
  );
}
