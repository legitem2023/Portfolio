"use client";
import { useState } from 'react';
import { Bell, AlertCircle, Package, Truck, CheckCircle } from "lucide-react";
import { useQuery } from "@apollo/client";
import { ACTIVE_ORDER_LIST, ActiveOrderListResponse } from '../lib/types';
import { mapOrdersToDeliveriesBySupplier } from '../lib/utils';
import ActiveDeliveryCard from './ActiveDeliveryCard';
import { useAuth } from '../hooks/useAuth';
import ActiveDeliveryCardSkeleton from './ActiveDeliveryCardSkeleton';
import ActiveDeliveryCardSkelitonError from './ActiveDeliveryCardSkelitonError';
interface ActiveDeliveriesTabProps {
  isMobile: boolean;
  onAcceptDelivery?: (deliveryId: string) => void;
  onRejectDelivery?: (deliveryId: string) => void;
}

enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export default function ActiveDeliveriesTab({ isMobile }: ActiveDeliveriesTabProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("PROCESSING");
  
  const { data, loading, error, refetch } = useQuery<ActiveOrderListResponse>(ACTIVE_ORDER_LIST, {
    variables: {
      filter: {
        status: activeTab,
        riderId: user?.userId
      },
      pagination: {
        page: 1,
        pageSize: 10
      }
    },
    fetchPolicy: "no-cache",
    pollInterval: 10000
  });

  // Transform GraphQL data to delivery format
  const deliveries = data?.activeorder.orders?.flatMap(mapOrdersToDeliveriesBySupplier) || [];

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    refetch();
  };

  const handleRefresh = () => {
    refetch();
  };

  // Loading state with skeletons
 /* if (loading) {
    return (
      <div className="p-2 lg:p-6">
        <div className="flex justify-between items-center mb-3 lg:mb-6">
          <h2 className="text-lg lg:text-2xl font-bold flex items-center gap-1 lg:gap-2">
            <Bell size={isMobile ? 20 : 24} className="text-orange-500" />
            <span className="text-base lg:text-2xl">Active Deliveries</span>
          </h2>
        </div>
        
        {/* Tab Buttons Skeleton */}
        <div className="flex gap-2 mb-4 lg:mb-6">
          <div className="flex-1 lg:flex-none px-4 py-2 bg-gray-200 rounded-lg shimmer h-10"></div>
          <div className="flex-1 lg:flex-none px-4 py-2 bg-gray-200 rounded-lg shimmer h-10"></div>
          <div className="flex-1 lg:flex-none px-4 py-2 bg-gray-200 rounded-lg shimmer h-10"></div>
        </div>

        {/* Skeleton Cards */}
        <div className="space-y-3 lg:space-y-6">
          {[1, 2, 3].map((i) => (
            <ActiveDeliveryCardSkeleton key={i} isMobile={isMobile} />
          ))}
        </div>

        <style jsx>{`
          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }
          .shimmer {
            animation: shimmer 2s infinite linear;
            background: linear-gradient(to right, #f0f0f0 0%, #e0e0e0 20%, #f0f0f0 40%, #f0f0f0 100%);
            background-size: 1000px 100%;
          }
        `}</style>
      </div>
    );
  }*/

  // Error state
 /* if (error) {
        return (
      <div className="p-2 lg:p-6">
        <div className="flex justify-between items-center mb-3 lg:mb-6">
          <h2 className="text-lg lg:text-2xl font-bold flex items-center gap-1 lg:gap-2">
            <Bell size={isMobile ? 20 : 24} className="text-orange-500" />
            <span className="text-base lg:text-2xl">Active Deliveries</span>
          </h2>
        </div>
        
        {/* Tab Buttons Skeleton */}
        <div className="flex gap-2 mb-4 lg:mb-6">
          <div className="flex-1 lg:flex-none px-4 py-2 bg-gray-200 rounded-lg shimmer h-10"></div>
          <div className="flex-1 lg:flex-none px-4 py-2 bg-gray-200 rounded-lg shimmer h-10"></div>
          <div className="flex-1 lg:flex-none px-4 py-2 bg-gray-200 rounded-lg shimmer h-10"></div>
        </div>

        {/* Skeleton Cards */}
        <div className="space-y-3 lg:space-y-6">
          {[1, 2, 3].map((i) => (
            <ActiveDeliveryCardSkelitonError key={i} isMobile={isMobile} />
          ))}
        </div>

        <style jsx>{`
          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }
          .shimmer {
            animation: shimmer 2s infinite linear;
            background: linear-gradient(to right, #f0f0f0 0%, #e0e0e0 20%, #f0f0f0 40%, #f0f0f0 100%);
            background-size: 1000px 100%;
          }
        `}</style>
      </div>
    );
  }*/

  return (
    <div className="p-2 lg:p-6">
      <div className="flex justify-between items-center mb-3 lg:mb-6">
        <h2 className="text-lg lg:text-2xl font-bold flex items-center gap-1 lg:gap-2">
          <Bell size={isMobile ? 20 : 24} className="text-orange-500" />
          <span className="text-base lg:text-2xl">Active Deliveries</span>
        </h2>
        
        {/* Quick stats */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex gap-2 text-sm">
            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
              <Package size={14} />
              {deliveries.length}
            </span>
          </div>
          <button 
            onClick={handleRefresh}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
            title="Refresh"
          >
            <Package size={18} />
          </button>
        </div>
      </div>
      
      {/* Tab Buttons - Now with 3 tabs for full flow */}
      <div className="flex gap-2 mb-4 lg:mb-6">
        <button
          onClick={() => handleTabChange("PROCESSING")}
          className={`flex-1 lg:flex-none px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === "PROCESSING"
              ? 'bg-orange-500 text-white shadow-md hover:bg-orange-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Package size={isMobile ? 16 : 18} />
          <span></span>
          {activeTab === "PROCESSING" && deliveries.length > 0 && (
            <span className="bg-white text-orange-500 px-2 py-0.5 rounded-full text-xs font-bold">
              {deliveries.length}
            </span>
          )}
        </button>
        
        <button
          onClick={() => handleTabChange("SHIPPED")}
          className={`flex-1 lg:flex-none px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === "SHIPPED"
              ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Truck size={isMobile ? 16 : 18} />
          <span></span>
          {activeTab === "SHIPPED" && deliveries.length > 0 && (
            <span className="bg-white text-blue-500 px-2 py-0.5 rounded-full text-xs font-bold">
              {deliveries.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange("DELIVERED")}
          className={`flex-1 lg:flex-none px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === "DELIVERED"
              ? 'bg-green-500 text-white shadow-md hover:bg-green-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <CheckCircle size={isMobile ? 16 : 18} />
          <span></span>
          {activeTab === "DELIVERED" && deliveries.length > 0 && (
            <span className="bg-white text-green-500 px-2 py-0.5 rounded-full text-xs font-bold">
              {deliveries.length}
            </span>
          )}
        </button>
      </div>

      {deliveries.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-4 lg:p-8 text-center">
          <Bell size={isMobile ? 32 : 48} className="mx-auto text-gray-400 mb-3 lg:mb-4" />
          <h3 className="text-base lg:text-lg font-semibold text-gray-600">
            {activeTab === "PROCESSING" && "No Orders to Pick Up"}
            {activeTab === "SHIPPED" && "No Orders on Delivery"}
            {activeTab === "DELIVERED" && "No Completed Orders"}
          </h3>
          <p className="text-gray-500 text-sm lg:text-base mt-1 lg:mt-2">
            {activeTab === "PROCESSING" && "Orders you accept will appear here"}
            {activeTab === "SHIPPED" && "Orders you've picked up will appear here"}
            {activeTab === "DELIVERED" && "Your delivery history will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-3 lg:space-y-6">
          {
            loading?(
      <div className="p-2 lg:p-6">
        {/* Skeleton Cards */}
        <div className="space-y-3 lg:space-y-6">
          {[1, 2, 3].map((i) => (
            <ActiveDeliveryCardSkeleton key={i} isMobile={isMobile} />
          ))}
        </div>

        <style jsx>{`
          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }
          .shimmer {
            animation: shimmer 2s infinite linear;
            background: linear-gradient(to right, #f0f0f0 0%, #e0e0e0 20%, #f0f0f0 40%, #f0f0f0 100%);
            background-size: 1000px 100%;
          }
        `}</style>
      </div>
    ) :deliveries.map((delivery) => (
            <ActiveDeliveryCard
              key={delivery.id}
              delivery={delivery}
              isMobile={isMobile}
              currentStatus={activeTab} // Pass the current tab status
              onReset={refetch}/>
          ))}
        </div>
      )}
    </div>
  );
}
