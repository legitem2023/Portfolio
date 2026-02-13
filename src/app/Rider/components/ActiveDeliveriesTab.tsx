"use client";
import { Package, Shield, CheckCircle, Clock } from "lucide-react";
import { formatPeso } from '../lib/utils';
import { useQuery } from '@apollo/client';
import { ACTIVE_ORDER_LIST } from '../lib/types'; // Adjust the import path
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';

// Add the enum here or import it from your types
enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

interface ActiveDeliveriesTabProps {
  isMobile: boolean;
}

// Define types based on your GraphQL query
interface OrderItem {
  id: string;
  orderId: string;
  supplierId: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    sku: string;
  };
  supplier: {
    id: string;
    firstName: string;
    addresses: Array<{
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    }>;
  };
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus; // Use the enum here
  total: number;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    email: string;
  };
  address: {
    id: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: OrderItem[];
  payments: Payment[];
}

interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ActiveOrderData {
  activeorder: {
    orders: Order[];
    pagination: PaginationInfo;
  };
}

export default function ActiveDeliveriesTab({ isMobile }: ActiveDeliveriesTabProps) {
  // Use the GraphQL query with Apollo Client
  const { user } = useAuth();
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  
  const { loading, error, data } = useQuery<ActiveOrderData>(ACTIVE_ORDER_LIST, {
    variables: {
      filter: {
        status: OrderStatus.PROCESSING, // Use enum here
        riderId: user?.userId
      },
      pagination: {
        page: 1,
        pageSize: 10
      }
    }
  });

  // Simple pickup handler
  const handleConfirmPickup = (orderId: string) => {
    if (confirm('Have you picked up this order from the supplier?')) {
      setProcessingOrderId(orderId);
      // TODO: Add your mutation here to change status from PROCESSING to SHIPPED
      console.log('Pickup confirmed for order:', orderId);
      setTimeout(() => setProcessingOrderId(null), 1000);
    }
  };

  if (loading) {
    return (
      <div className="p-2 lg:p-6">
        <h2 className="text-lg lg:text-2xl font-bold mb-3 lg:mb-6 flex items-center gap-1 lg:gap-2">
          <Package size={isMobile ? 20 : 24} />
          <span className="text-base lg:text-2xl">Active Deliveries</span>
        </h2>
        <div className="text-center py-4">Loading deliveries...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 lg:p-6">
        <h2 className="text-lg lg:text-2xl font-bold mb-3 lg:mb-6 flex items-center gap-1 lg:gap-2">
          <Package size={isMobile ? 20 : 24} />
          <span className="text-base lg:text-2xl">Active Deliveries</span>
        </h2>
        <div className="text-center py-4 text-red-500">Error loading deliveries: {error.message}</div>
      </div>
    );
  }

  const orders = data?.activeorder?.orders || [];

  // Format the createdAt date to show time ago or relative time
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffMins / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  // Calculate ETA based on order creation time or other logic
  const calculateETA = (createdAt: string, index: number) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    // Example logic - adjust based on your business rules
    const baseETA = 30; // Base 30 minutes for delivery
    const randomAdjustment = (index % 3) * 5; // Add some variation
    
    return Math.max(5, baseETA - diffMins + randomAdjustment); // Minimum 5 minutes
  };

  return (
    <div className="p-2 lg:p-6">
      <h2 className="text-lg lg:text-2xl font-bold mb-3 lg:mb-6 flex items-center gap-1 lg:gap-2">
        <Package size={isMobile ? 20 : 24} />
        <span className="text-base lg:text-2xl">Active Deliveries</span>
        {orders.length > 0 && (
          <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {orders.length} active
          </span>
        )}
      </h2>
      
      {orders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No active deliveries found
        </div>
      ) : (
        <div className="space-y-2 lg:space-y-4">
          {orders.map((order, index) => {
            const eta = calculateETA(order.createdAt, index);
            const totalEarnings = order.payments
              .filter(p => p.status === 'COMPLETED')
              .reduce((sum, payment) => sum + payment.amount, 0);

            return (
              <div key={order.id} className="bg-white p-2 lg:p-4 rounded-lg shadow border-l-4 border-blue-500">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-1 lg:gap-2">
                      <Shield size={isMobile ? 14 : 16} className="text-blue-500" />
                      <h3 className="font-bold text-base lg:text-lg">{order.orderNumber}</h3>
                    </div>
                    
                    <p className="text-gray-600 text-sm lg:text-base mt-0.5 lg:mt-1">
                      {order.address?.street}, {order.address?.city}, {order.address?.state} {order.address?.zipCode}
                    </p>
                    
                    <p className="text-gray-500 text-xs mt-0.5">
                      Customer: {order.user?.firstName} • {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                    
                    <div className="mt-1 lg:mt-2 flex flex-wrap items-center gap-1 lg:gap-2">
                      <span className="text-gray-500 text-xs flex items-center gap-0.5 lg:gap-1">
                        <Clock size={isMobile ? 10 : 12} />
                        <span className="text-xs">{eta} min ETA</span>
                      </span>
                      
                      <span className="text-gray-500 text-xs">
                        Placed {formatTimeAgo(order.createdAt)}
                      </span>
                    </div>
                    
                    {/* Display first product as summary */}
                    {order.items[0] && (
                      <div className="mt-2 text-xs text-gray-600">
                        <span className="font-medium">{order.items[0].product.name}</span>
                        {order.items.length > 1 && (
                          <span className="ml-1">+ {order.items.length - 1} more</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right ml-2">
                    <p className="font-bold text-lg lg:text-2xl">{formatPeso(totalEarnings || order.total)}</p>
                    <p className="text-gray-500 text-xs lg:text-sm">Earnings</p>
                    <div className="mt-1">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                        order.status === OrderStatus.DELIVERED 
                          ? 'bg-green-100 text-green-800'
                          : order.status === OrderStatus.PENDING
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.status === OrderStatus.PROCESSING
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === OrderStatus.SHIPPED
                          ? 'bg-purple-100 text-purple-800'
                          : order.status === OrderStatus.CANCELLED
                          ? 'bg-red-100 text-red-800'
                          : order.status === OrderStatus.REFUNDED
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    {/* PICKUP BUTTON - Only show for PROCESSING status */}
                    {order.status === OrderStatus.PROCESSING && (
                      <button
                        onClick={() => handleConfirmPickup(order.id)}
                        disabled={processingOrderId === order.id}
                        className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 disabled:bg-gray-400"
                      >
                        {processingOrderId === order.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Package size={14} />
                            <span>Confirm Pickup</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
    }
