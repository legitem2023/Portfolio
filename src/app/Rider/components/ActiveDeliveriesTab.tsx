"use client";
import { useState } from 'react';
import { Bell, AlertCircle, AlertTriangle, Loader2, Package, Truck } from "lucide-react";
import { useQuery } from "@apollo/client";
import { ACTIVE_ORDER_LIST, ActiveOrderListResponse } from '../lib/types';
import { mapOrdersToDeliveriesBySupplier, formatPeso } from '../lib/utils';
import ActiveDeliveryCard from './ActiveDeliveryCard';
import { useAuth } from '../hooks/useAuth';
import ActiveDeliveryCardSkeleton from './ActiveDeliveryCardSkeleton';

interface ActiveDeliveriesTabProps {
  isMobile: boolean;
  onAcceptDelivery: (deliveryId: string) => void;
  onRejectDelivery: (deliveryId: string) => void;
}

export default function ActiveDeliveriesTab({ isMobile, onAcceptDelivery, onRejectDelivery }: ActiveDeliveriesTabProps) {
  const { user } = useAuth();
  const [useStat, setStat] = useState("PROCESSING");
  
  const { data, loading, error, refetch } = useQuery<ActiveOrderListResponse>(ACTIVE_ORDER_LIST, {
    variables: {
      filter: {
        status: useStat,
        riderId: user?.userId
      },
      pagination: {
        page: 1,
        pageSize: 10
      }
    },
    fetchPolicy: "no-cache", // Disables caching completely
    pollInterval: 10000 // Keeps polling every 10 seconds
  });

  // Transform GraphQL data to delivery format - split by supplier
  const newDeliveries = data?.activeorder.orders?.flatMap(mapOrdersToDeliveriesBySupplier) || [];

  const handleTab = (tabStatus: string) => {
    setStat(tabStatus);
    refetch();
  };

  // Show loading skeletons while fetching data OR if theres an error (to allow retry)
  if (loading || error) {
    return (
      <div className="p-2 lg:p-6">
        <div className="flex justify-between items-center mb-3 lg:mb-6">
          <div>
            <h2 className="text-lg lg:text-2xl font-bold flex items-center gap-1 lg:gap-2">
              <Bell size={isMobile ? 20 : 24} className="text-orange-500" />
              <span className="text-base lg:text-2xl">Active Delivery</span>
            </h2>
          </div>
        </div>
        
        {/* Tab Buttons */}
        <div className="flex gap-2 mb-4 lg:mb-6">
          <button
            onClick={() => handleTab("PROCESSING")}
            className={`flex-1 lg:flex-none px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              useStat === "PROCESSING"
                ? 'bg-orange-500 text-white shadow-md hover:bg-orange-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Package size={isMobile ? 16 : 18} />
            <span>To Process</span>
          </button>
          <button
            onClick={() => handleTab("SHIPPED")}
            className={`flex-1 lg:flex-none px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              useStat === "SHIPPED"
                ? 'bg-green-500 text-white shadow-md hover:bg-green-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Truck size={isMobile ? 16 : 18} />
            <span>Shipped</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">
              Failed to load deliveries. Retrying...
            </p>
          </div>
        )}

        <div className="space-y-3 lg:space-y-6">
          {[1, 2, 3].map((i) => (
            <ActiveDeliveryCardSkeleton key={i} isMobile={isMobile} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 lg:p-6">
      <div className="flex justify-between items-center mb-3 lg:mb-6">
        <div>
          <h2 className="text-lg lg:text-2xl font-bold flex items-center gap-1 lg:gap-2">
            <Bell size={isMobile ? 20 : 24} className="text-orange-500" />
            <span className="text-base lg:text-2xl">Active Delivery</span>
          </h2>
        </div>
      </div>
      
      {/* Tab Buttons */}
      <div className="flex gap-2 mb-4 lg:mb-6">
        <button
          onClick={() => handleTab("PROCESSING")}
          className={`flex-1 lg:flex-none px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            useStat === "PROCESSING"
              ? 'bg-orange-500 text-white shadow-md hover:bg-orange-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Package size={isMobile ? 16 : 18} />
          <span>To Process</span>
          {useStat === "PROCESSING" && newDeliveries.length > 0 && (
            <span className="bg-white text-orange-500 px-2 py-0.5 rounded-full text-xs font-bold">
              {newDeliveries.length}
            </span>
          )}
        </button>
        <button
          onClick={() => handleTab("SHIPPED")}
          className={`flex-1 lg:flex-none px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            useStat === "SHIPPED"
              ? 'bg-green-500 text-white shadow-md hover:bg-green-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Truck size={isMobile ? 16 : 18} />
          <span>Shipped</span>
          {useStat === "SHIPPED" && newDeliveries.length > 0 && (
            <span className="bg-white text-green-500 px-2 py-0.5 rounded-full text-xs font-bold">
              {newDeliveries.length}
            </span>
          )}
        </button>
      </div>

      {newDeliveries.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-4 lg:p-8 text-center">
          <Bell size={isMobile ? 32 : 48} className="mx-auto text-gray-400 mb-3 lg:mb-4" />
          <h3 className="text-base lg:text-lg font-semibold text-gray-600">
            {useStat === "PROCESSING" ? "No Orders to Process" : "No Shipped Orders"}
          </h3>
          <p className="text-gray-500 text-sm lg:text-base mt-1 lg:mt-2">
            {useStat === "PROCESSING" 
              ? "No pending delivery orders at the moment" 
              : "No orders have been shipped yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3 lg:space-y-6">
          {newDeliveries.map((delivery) => (
            <ActiveDeliveryCard
              key={delivery.id}
              delivery={delivery}
              isMobile={isMobile}
              onReset={refetch}
            />
          ))}
        </div>
      )}
    </div>
  );
}
