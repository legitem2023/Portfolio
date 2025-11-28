"use client";
import { useState, useEffect } from 'react';

const LoadingShimmer = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Nav Shimmer */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-gray-800 border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-300 rounded-lg shimmer"></div>
            <div className="hidden md:block">
              <div className="w-32 h-4 bg-gray-300 rounded shimmer mb-2"></div>
              <div className="w-24 h-3 bg-gray-200 rounded shimmer"></div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-300 rounded-full shimmer"></div>
          </div>
        </div>
      </div>

      {/* Sidebar Shimmer */}
      <div className="fixed inset-y-0 left-0 z-20 hidden w-64 bg-gray-800 md:flex md:flex-col">
        <div className="flex flex-col flex-grow overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
            <div className="w-32 h-6 bg-gray-600 rounded shimmer"></div>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center px-2 py-3">
                <div className="w-6 h-6 bg-gray-600 rounded mr-3 shimmer"></div>
                <div className="w-32 h-4 bg-gray-600 rounded shimmer"></div>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Shimmer */}
      <div className="md:pl-64 pt-16">
        <div className="p-6">
          {/* Dashboard Header Shimmer */}
          <div className="mb-8">
            <div className="w-48 h-8 bg-gray-300 rounded shimmer mb-2"></div>
            <div className="w-64 h-4 bg-gray-200 rounded shimmer"></div>
          </div>

          {/* Stats Grid Shimmer */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-24 h-4 bg-gray-300 rounded shimmer"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded shimmer"></div>
                </div>
                <div className="w-16 h-6 bg-gray-400 rounded shimmer mb-2"></div>
                <div className="w-20 h-3 bg-gray-200 rounded shimmer"></div>
              </div>
            ))}
          </div>

          {/* Charts and Tables Shimmer */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="w-32 h-5 bg-gray-300 rounded shimmer mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded shimmer"></div>
                      <div className="w-24 h-4 bg-gray-300 rounded shimmer"></div>
                    </div>
                    <div className="w-16 h-4 bg-gray-200 rounded shimmer"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="w-32 h-5 bg-gray-300 rounded shimmer mb-4"></div>
              <div className="h-48 bg-gray-100 rounded shimmer"></div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .shimmer {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingShimmer;
