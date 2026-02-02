"use client";
import { Bell, AlertCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useQuery } from "@apollo/client";
import { ORDER_LIST_QUERY, OrderListResponse } from '../lib/types';
import { mapOrdersToDeliveriesBySupplier, formatPeso } from '../lib/utils';
import DeliveryCard from './DeliveryCard';

interface NewDeliveriesTabProps {
  isMobile: boolean;
  onAcceptDelivery: (deliveryId: string) => void;
  onRejectDelivery: (deliveryId: string) => void;
}

export default function NewDeliveriesTab({ isMobile, onAcceptDelivery, onRejectDelivery }: NewDeliveriesTabProps) {
  const { data, loading, error, refetch } = useQuery<OrderListResponse>(ORDER_LIST_QUERY, {
    variables: {
      filter: {
        status: "PENDING"
      },
      pagination: {
        page: 1,
        pageSize: 10
      }
    },
    pollInterval: 10000
  });

  // Transform GraphQL data to delivery format - split by supplier
  const newDeliveries = data?.neworder?.orders?.flatMap(mapOrdersToDeliveriesBySupplier) || [];

  if (loading) {
    return (
      <div className="p-2 lg:p-6 flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-600">Loading delivery requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 lg:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 lg:p-4">
          <h3 className="text-red-800 font-semibold flex items-center gap-2 text-sm lg:text-base">
            <AlertTriangle size={isMobile ? 18 : 20} />
            Error loading orders
          </h3>
          <p className="text-red-600 mt-2 text-sm lg:text-base">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-3 bg-red-100 text-red-700 px-3 lg:px-4 py-1 lg:py-2 rounded-lg font-medium hover:bg-red-200 transition text-sm lg:text-base"
          >
            Retry
          </button>
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
            <span className="text-base lg:text-2xl">New Delivery Requests</span>
          </h2>
          <p className="text-gray-600 text-xs lg:text-base mt-1">
            {newDeliveries.length} delivery piece{newDeliveries.length !== 1 ? "s" : ""} from {data?.orderlist?.orders?.length || 0} order{data?.orderlist?.orders?.length !== 1 ? "s" : ""}
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

      {/* Bottom stats */}
      <div className="mt-4 lg:mt-8 grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
        <div className="bg-blue-50 p-2 lg:p-4 rounded-lg border border-blue-100">
          <p className="text-gray-600 text-xs lg:text-sm">Today&apos;s Earnings</p>
          <p className="font-bold text-lg lg:text-2xl">{formatPeso(86.50)}</p>
        </div>
        <div className="bg-green-50 p-2 lg:p-4 rounded-lg border border-green-100">
          <p className="text-gray-600 text-xs lg:text-sm">Acceptance Rate</p>
          <p className="font-bold text-lg lg:text-2xl">94%</p>
        </div>
        <div className="bg-purple-50 p-2 lg:p-4 rounded-lg border border-purple-100">
          <p className="text-gray-600 text-xs lg:text-sm">Avg. Payout</p>
          <p className="font-bold text-lg lg:text-2xl">{formatPeso(12.15)}</p>
        </div>
        <div className="bg-orange-50 p-2 lg:p-4 rounded-lg border border-orange-100">
          <p className="text-gray-600 text-xs lg:text-sm">Response Time</p>
          <p className="font-bold text-lg lg:text-2xl">8s</p>
        </div>
      </div>
    </div>
  );
            }
