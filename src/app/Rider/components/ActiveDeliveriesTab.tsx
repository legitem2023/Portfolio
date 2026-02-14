"use client";
import { Bell, AlertCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useQuery } from "@apollo/client";
import { ACTIVE_ORDER_LIST, ActiveOrderListResponse } from '../lib/types';
import { mapOrdersToDeliveriesBySupplier, formatPeso } from '../lib/utils';
import DeliveryCard from './DeliveryCard';
import { useAuth } from '../hooks/useAuth';
import NewDeliveriesTabSkeleton from './NewDeliveriesTabSkeleton';
interface ActiveDeliveriesTabProps {
  isMobile: boolean;
  onAcceptDelivery: (deliveryId: string) => void;
  onRejectDelivery: (deliveryId: string) => void;
}

export default function ActiveDeliveriesTab({ isMobile, onAcceptDelivery, onRejectDelivery }: ActiveDeliveriesTabProps) {
 const { user } = useAuth();
  
  const { data, loading, error, refetch } = useQuery<ActiveOrderListResponse>(ACTIVE_ORDER_LIST, {
  variables: {
    filter: {
      status: "PROCESSING",
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

  
if (loading) {
  return <NewDeliveriesTabSkeleton isMobile={isMobile} />;
}
if (error) {
  return <NewDeliveriesTabSkeleton isMobile={isMobile} />;
}

  return (
    <div className="p-2 lg:p-6">
      <div className="flex justify-between items-center mb-3 lg:mb-6">
        <div>
          <h2 className="text-lg lg:text-2xl font-bold flex items-center gap-1 lg:gap-2">
            <Bell size={isMobile ? 20 : 24} className="text-orange-500" />
            <span className="text-base lg:text-2xl">Active Delivery</span>
          </h2>
          <p className="text-gray-600 text-xs lg:text-base mt-1">
            {newDeliveries.length} delivery piece{newDeliveries.length !== 1 ? "s" : ""} from {data?.activeorder.orders?.length || 0} order{data?.activeorder.orders?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm text-gray-600">
          <AlertCircle size={isMobile ? 14 : 16} />
          <span className="hidden sm:inline">Requests auto-expire in 2 minutes</span>
          <span className="sm:hidden">2 min expiry</span>
          <button
            onClick={() => refetch()}
            className="ml-1 lg:ml-2 text-blue-600 hover:text-blue-800 text-xs lg:text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {newDeliveries.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-4 lg:p-8 text-center">
          <Bell size={isMobile ? 32 : 48} className="mx-auto text-gray-400 mb-3 lg:mb-4" />
          <h3 className="text-base lg:text-lg font-semibold text-gray-600">No New Requests</h3>
          <p className="text-gray-500 text-sm lg:text-base mt-1 lg:mt-2">No pending delivery orders at the moment</p>
        </div>
      ) : (
        <div className="space-y-3 lg:space-y-6">
          {newDeliveries.map((delivery) => (
            <DeliveryCard
              key={delivery.id}
              delivery={delivery}
              isMobile={isMobile}
              onAccept={onAcceptDelivery}
              onReject={onRejectDelivery}
            />
          ))}
        </div>
      )}


    </div>
  );
}
