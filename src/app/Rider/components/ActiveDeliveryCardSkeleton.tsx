"use client";
import { 
  Package, 
  MapPin, 
  Building, 
  User, 
  Shield, 
  Clock, 
  Navigation,
  Camera,
  ChevronDown
} from "lucide-react";

export default function ActiveDeliveryCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-indigo-200 overflow-hidden">
      {/* Header Skeleton */}
      <div className="bg-indigo-50 px-4 py-3 border-b border-orange-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-indigo-300 rounded-full animate-pulse"></div>
            <div className="h-4 w-24 bg-indigo-200 rounded-lg animate-pulse"></div>
            <div className="h-5 w-20 bg-blue-200 rounded-full animate-pulse"></div>
          </div>
          <div className="h-6 w-28 bg-orange-200 rounded-full animate-pulse"></div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Order info Skeleton */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <Shield size={18} className="text-blue-200 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="h-5 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-3 w-36 bg-gray-200 rounded-lg animate-pulse mt-1"></div>
            </div>
          </div>
          
          <div className="bg-green-50 p-3 rounded-xl">
            <div className="h-7 w-32 bg-green-200 rounded-lg animate-pulse"></div>
            <div className="h-3 w-24 bg-green-200 rounded-lg animate-pulse mt-1"></div>
            <div className="h-3 w-20 bg-green-100 rounded-lg animate-pulse mt-1"></div>
          </div>
        </div>

        {/* Collapsible Item details Skeleton */}
        <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
          <div className="w-full px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-gray-300" />
              <div className="h-4 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
              <ChevronDown size={18} className="text-gray-300" />
            </div>
          </div>

          {/* Items content skeleton */}
          <div className="px-4 pb-4 space-y-3 border-t border-gray-200 pt-3">
            {[1, 2].map((item) => (
              <div key={item} className="flex flex-col gap-3 bg-white rounded-xl p-3 shadow-sm">
                <div className="flex gap-3">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <div className="w-full h-full bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-5 w-12 bg-gray-100 rounded animate-pulse"></div>
                        </div>
                        <div className="h-4 w-40 bg-gray-200 rounded-lg animate-pulse"></div>
                      </div>
                      <div className="text-left w-full sm:w-auto">
                        <div className="h-5 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
                        <div className="h-3 w-16 bg-gray-100 rounded-lg animate-pulse mt-1"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex flex-col gap-2 bg-gray-100 rounded-xl p-4 mt-3">
              <div className="h-4 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Route info Skeleton */}
        <div className="space-y-3">
          <div className="bg-blue-50 p-3 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <MapPin size={16} className="text-blue-200" />
                <div className="h-4 w-20 bg-blue-200 rounded-lg animate-pulse"></div>
              </div>
              <div className="h-6 w-16 bg-blue-200 rounded-full animate-pulse"></div>
            </div>
            <div className="h-4 w-48 bg-blue-100 rounded-lg animate-pulse"></div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1">
                <Building size={10} className="text-blue-200" />
                <div className="h-3 w-32 bg-blue-100 rounded-lg animate-pulse"></div>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 bg-blue-200 rounded-full"></div>
                <div className="h-3 w-24 bg-blue-100 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center py-1">
            <div className="w-full border-t-2 border-dashed border-gray-200 relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                <div className="flex items-center gap-1">
                  <Navigation size={12} className="text-gray-300" />
                  <div className="h-3 w-12 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-3 rounded-xl">
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin size={16} className="text-green-200" />
              <div className="h-4 w-16 bg-green-200 rounded-lg animate-pulse"></div>
            </div>
            <div className="h-4 w-52 bg-green-100 rounded-lg animate-pulse"></div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1">
                <User size={10} className="text-green-200" />
                <div className="h-3 w-36 bg-green-100 rounded-lg animate-pulse"></div>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 bg-green-200 rounded-full"></div>
                <div className="h-3 w-24 bg-green-100 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional info Skeleton */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-lg">
            <Package size={14} className="text-gray-300" />
            <div className="h-3 w-12 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-lg">
            <Navigation size={14} className="text-gray-300" />
            <div className="h-3 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-lg">
            <Clock size={14} className="text-gray-300" />
            <div className="h-3 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Proof of Delivery Section Skeleton */}
        <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
          <div className="w-full px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera size={16} className="text-gray-300" />
              <div className="h-4 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
            <ChevronDown size={18} className="text-gray-300" />
          </div>
        </div>

        {/* Action buttons Skeleton */}
        <div className="grid grid-cols-1 gap-3">
          <div className="h-14 bg-green-200 rounded-xl animate-pulse"></div>
          <div className="h-14 bg-red-100 border border-red-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
