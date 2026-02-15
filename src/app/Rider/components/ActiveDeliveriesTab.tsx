"use client";
import { useState } from 'react';
import { 
  Bell, AlertCircle, Package, Truck, 
  CheckCircle, XCircle, Clock, MapPin,
  Navigation, Home, RefreshCw
} from "lucide-react";
import { useQuery, useMutation } from "@apollo/client";
import { 
  ACTIVE_ORDER_LIST, 
  UPDATE_ORDER_STATUS,
  ActiveOrderListResponse 
} from '../lib/types';
import { mapOrdersToDeliveriesBySupplier } from '../lib/utils';
import ActiveDeliveryCard from './ActiveDeliveryCard';
import { useAuth } from '../hooks/useAuth';
import ActiveDeliveryCardSkeleton from './ActiveDeliveryCardSkeleton';

// Your current Order Status enum
enum OrderStatus {
  PENDING = 'PENDING',           // Available for riders to accept
  PROCESSING = 'PROCESSING',     // Rider accepted, preparing
  SHIPPED = 'SHIPPED',           // Picked up, on the way
  DELIVERED = 'DELIVERED',       // Successfully delivered
  CANCELLED = 'CANCELLED',       // Cancelled
  REFUNDED = 'REFUNDED'          // Refunded
}

interface ActiveDeliveriesTabProps {
  isMobile: boolean;
  onAcceptDelivery?: (deliveryId: string) => void;
  onRejectDelivery?: (deliveryId: string) => void;
}

export default function ActiveDeliveriesTab({ isMobile }: ActiveDeliveriesTabProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<OrderStatus>(OrderStatus.PROCESSING);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Query for active orders
  const { data, loading, error, refetch } = useQuery<ActiveOrderListResponse>(ACTIVE_ORDER_LIST, {
    variables: {
      filter: {
        status: activeTab,
        riderId: user?.userId
      },
      pagination: {
        page: 1,
        pageSize: 50
      }
    },
    fetchPolicy: "no-cache",
    pollInterval: 5000 // Poll every 5 seconds for real-time updates
  });

  // Update order status mutation
  const [updateOrderStatus] = useMutation(UPDATE_ORDER_STATUS, {
    onCompleted: () => {
      refetch(); // Refresh the list after update
      setUpdatingId(null);
    },
    onError: (error) => {
      console.error('Error updating status:', error);
      setUpdatingId(null);
    }
  });

  // Transform GraphQL data to delivery format
  const deliveries = data?.activeorder.orders?.flatMap(mapOrdersToDeliveriesBySupplier) || [];

  // Filter deliveries based on active tab
  const filteredDeliveries = deliveries.filter(delivery => {
    if (activeTab === OrderStatus.PROCESSING) {
      return delivery.status === OrderStatus.PROCESSING;
    } else if (activeTab === OrderStatus.SHIPPED) {
      return delivery.status === OrderStatus.SHIPPED;
    } else if (activeTab === OrderStatus.DELIVERED) {
      return delivery.status === OrderStatus.DELIVERED;
    }
    return false;
  });

  // Handle tab change
  const handleTabChange = (tab: OrderStatus) => {
    setActiveTab(tab);
    refetch();
  };

  // Handle pickup (PROCESSING → SHIPPED)
  const handlePickup = async (delivery: any) => {
    setUpdatingId(delivery.id);
    try {
      for (const item of delivery.supplierItems || []) {
        await updateOrderStatus({
          variables: {
            itemId: item.id,
            riderId: user?.userId,
            supplierId: item.supplierId,
            userId: delivery.customerId,
            status: OrderStatus.SHIPPED,
            title: "Order On The Way",
            message: "Your order has been picked up and is on the way!"
          }
        });
      }
    } catch (error) {
      console.error('Error marking as shipped:', error);
      setUpdatingId(null);
    }
  };

  // Handle delivery (SHIPPED → DELIVERED)
  const handleDelivered = async (delivery: any) => {
    setUpdatingId(delivery.id);
    try {
      for (const item of delivery.supplierItems || []) {
        await updateOrderStatus({
          variables: {
            itemId: item.id,
            riderId: user?.userId,
            supplierId: item.supplierId,
            userId: delivery.customerId,
            status: OrderStatus.DELIVERED,
            title: "Order Delivered",
            message: "Your order has been successfully delivered!"
          }
        });
      }
    } catch (error) {
      console.error('Error marking as delivered:', error);
      setUpdatingId(null);
    }
  };

  // Handle cancel order
  const handleCancel = async (delivery: any, reason?: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    setUpdatingId(delivery.id);
    try {
      for (const item of delivery.supplierItems || []) {
        await updateOrderStatus({
          variables: {
            itemId: item.id,
            riderId: user?.userId,
            supplierId: item.supplierId,
            userId: delivery.customerId,
            status: OrderStatus.CANCELLED,
            title: "Order Cancelled",
            message: reason || "Your order has been cancelled"
          }
        });
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      setUpdatingId(null);
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    refetch();
  };

  // Tab configuration
  const tabs = [
    { 
      status: OrderStatus.PROCESSING, 
      label: 'To Pick Up', 
      icon: Package, 
      color: 'orange',
      bgColor: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600'
    },
    { 
      status: OrderStatus.SHIPPED, 
      label: 'On Delivery', 
      icon: Truck, 
      color: 'blue',
      bgColor: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    { 
      status: OrderStatus.DELIVERED, 
      label: 'Completed', 
      icon: CheckCircle, 
      color: 'green',
      bgColor: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    }
  ];

  // Loading state with skeletons
  if (loading || error) {
    return (
      <div className="p-2 lg:p-6">
        <div className="flex justify-between items-center mb-3 lg:mb-6">
          <h2 className="text-lg lg:text-2xl font-bold flex items-center gap-1 lg:gap-2">
            <Bell size={isMobile ? 20 : 24} className="text-orange-500" />
            <span className="text-base lg:text-2xl">Active Deliveries</span>
          </h2>
          <button 
            onClick={handleRefresh}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            disabled={loading}
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 mb-4 lg:mb-6">
          {tabs.map(({ status, label, icon: Icon, color }) => (
            <button
              key={status}
              className={`flex-1 lg:flex-none px-4 py-2 rounded-lg font-semibold transition-all 
                flex items-center justify-center gap-2 opacity-50 cursor-not-allowed
                ${activeTab === status 
                  ? `bg-${color}-500 text-white` 
                  : 'bg-gray-100 text-gray-600'
                }`}
              disabled
            >
              <Icon size={isMobile ? 16 : 18} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">
              Failed to load deliveries. Retrying...
            </p>
          </div>
        )}

        {/* Skeleton Cards */}
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
        <h2 className="text-lg lg:text-2xl font-bold flex items-center gap-1 lg:gap-2">
          <Bell size={isMobile ? 20 : 24} className="text-orange-500" />
          <span className="text-base lg:text-2xl">Active Deliveries</span>
        </h2>
        
        {/* Quick stats */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex gap-2 text-sm">
            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
              <Package size={14} />
              {deliveries.filter(d => d.status === OrderStatus.PROCESSING).length}
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
              <Truck size={14} />
              {deliveries.filter(d => d.status === OrderStatus.SHIPPED).length}
            </span>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
              <CheckCircle size={14} />
              {deliveries.filter(d => d.status === OrderStatus.DELIVERED).length}
            </span>
          </div>
          <button 
            onClick={handleRefresh}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-2 mb-4 lg:mb-6">
        {tabs.map(({ status, label, icon: Icon, bgColor, hoverColor }) => (
          <button
            key={status}
            onClick={() => handleTabChange(status)}
            className={`flex-1 lg:flex-none px-4 py-2 rounded-lg font-semibold transition-all duration-200 
              flex items-center justify-center gap-2 text-sm lg:text-base
              ${activeTab === status 
                ? `${bgColor} text-white shadow-md ${hoverColor}` 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            <Icon size={isMobile ? 16 : 18} />
            <span>{label}</span>
            {filteredDeliveries.length > 0 && activeTab === status && (
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold 
                ${activeTab === status ? 'bg-white bg-opacity-20' : 'bg-gray-200'}`}>
                {filteredDeliveries.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Deliveries List */}
      {filteredDeliveries.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-4 lg:p-8 text-center">
          <Bell size={isMobile ? 32 : 48} className="mx-auto text-gray-400 mb-3 lg:mb-4" />
          <h3 className="text-base lg:text-lg font-semibold text-gray-600">
            {activeTab === OrderStatus.PROCESSING && "No Orders to Pick Up"}
            {activeTab === OrderStatus.SHIPPED && "No Orders on Delivery"}
            {activeTab === OrderStatus.DELIVERED && "No Completed Orders"}
          </h3>
          <p className="text-gray-500 text-sm lg:text-base mt-1 lg:mt-2">
            {activeTab === OrderStatus.PROCESSING && "Orders you accept will appear here"}
            {activeTab === OrderStatus.SHIPPED && "Orders you've picked up will appear here"}
            {activeTab === OrderStatus.DELIVERED && "Your delivery history will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-3 lg:space-y-6">
          {filteredDeliveries.map((delivery) => (
            <ActiveDeliveryCard
              key={delivery.id}
              delivery={{
                ...delivery,
                status: delivery.status // Pass current status
              }}
              isMobile={isMobile}
              onPickup={() => handlePickup(delivery)}
              onDelivered={() => handleDelivered(delivery)}
              onCancel={() => handleCancel(delivery)}
              isUpdating={updatingId === delivery.id}
              onReset={refetch}
            />
          ))}
        </div>
      )}
    </div>
  );
}
