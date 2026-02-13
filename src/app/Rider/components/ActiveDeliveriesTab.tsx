"use client";
import { Package, Shield, CheckCircle, Clock, XCircle, AlertTriangle, MapPin, Store } from "lucide-react";
import { formatPeso } from '../lib/utils';
import { useQuery } from '@apollo/client';
import { ACTIVE_ORDER_LIST } from '../lib/types';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';

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

interface OrderItem {
  id: string;
  orderId: string;
  supplierId: string;
  quantity: number;
  price: number;
  status: OrderStatus;
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
  status: OrderStatus;
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

// Group by supplier
interface SupplierGroup {
  supplierId: string;
  supplierName: string;
  supplierAddress: string;
  items: OrderItem[];
  totalAmount: number;
  itemCount: number;
}

export default function ActiveDeliveriesTab({ isMobile }: ActiveDeliveriesTabProps) {
  const { user } = useAuth();
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  const { loading, error, data } = useQuery<ActiveOrderData>(ACTIVE_ORDER_LIST, {
    variables: {
      filter: {
        status: OrderStatus.PROCESSING,
        riderId: user?.userId
      },
      pagination: {
        page: 1,
        pageSize: 10
      }
    }
  });

  // Group items by supplier
  const groupBySupplier = (items: OrderItem[]): SupplierGroup[] => {
    const groups = new Map<string, SupplierGroup>();
    
    items.forEach(item => {
      const supplierId = item.supplierId;
      
      if (!groups.has(supplierId)) {
        groups.set(supplierId, {
          supplierId,
          supplierName: item.supplier.firstName,
          supplierAddress: item.supplier.addresses[0] 
            ? `${item.supplier.addresses[0].street}, ${item.supplier.addresses[0].city}`
            : 'Address not available',
          items: [],
          totalAmount: 0,
          itemCount: 0
        });
      }
      
      const group = groups.get(supplierId)!;
      group.items.push(item);
      group.totalAmount += item.price * item.quantity;
      group.itemCount += item.quantity;
    });
    
    return Array.from(groups.values());
  };

  const handleConfirmPickup = (orderId: string, supplierId?: string) => {
    const message = supplierId 
      ? `Confirm pickup from this supplier?` 
      : 'Confirm pickup for all suppliers?';
    
    if (confirm(message)) {
      setProcessingOrderId(orderId);
      console.log('Pickup confirmed:', { orderId, supplierId });
      setTimeout(() => setProcessingOrderId(null), 1000);
    }
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch(status) {
      case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.PROCESSING: return 'bg-blue-100 text-blue-800';
      case OrderStatus.SHIPPED: return 'bg-purple-100 text-purple-800';
      case OrderStatus.DELIVERED: return 'bg-green-100 text-green-800';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-800';
      case OrderStatus.REFUNDED: return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-2 lg:p-6">
        <h2 className="text-lg lg:text-2xl font-bold mb-3 lg:mb-6 flex items-center gap-1 lg:gap-2">
          <Package size={isMobile ? 20 : 24} />
          <span>Active Deliveries</span>
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
          <span>Active Deliveries</span>
        </h2>
        <div className="text-center py-4 text-red-500">Error: {error.message}</div>
      </div>
    );
  }

  const orders = data?.activeorder?.orders || [];

  return (
    <div className="p-2 lg:p-6">
      <h2 className="text-lg lg:text-2xl font-bold mb-3 lg:mb-6 flex items-center gap-1 lg:gap-2">
        <Package size={isMobile ? 20 : 24} />
        <span>Active Deliveries</span>
        {orders.length > 0 && (
          <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {orders.length}
          </span>
        )}
      </h2>
      
      {orders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No active deliveries found</div>
      ) : (
        <div className="space-y-2 lg:space-y-4">
          {orders.map((order) => {
            const supplierGroups = groupBySupplier(order.items);
            const hasMultipleSuppliers = supplierGroups.length > 1;
            const isExpanded = expandedOrderId === order.id;
            const totalEarnings = order.payments
              .filter(p => p.status === 'COMPLETED')
              .reduce((sum, p) => sum + p.amount, 0);

            return (
              <div key={order.id} className="bg-white rounded-lg shadow border-l-4 border-blue-500 overflow-hidden">
                {/* Order Header */}
                <div 
                  className="p-2 lg:p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleOrderExpand(order.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-1 lg:gap-2">
                        <Shield size={isMobile ? 14 : 16} className="text-blue-500" />
                        <h3 className="font-bold text-base lg:text-lg">{order.orderNumber}</h3>
                        {hasMultipleSuppliers && (
                          <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {supplierGroups.length} suppliers
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm lg:text-base mt-0.5 lg:mt-1">
                        Deliver to: {order.address?.street}, {order.address?.city}
                      </p>
                      
                      <p className="text-gray-500 text-xs mt-0.5">
                        Customer: {order.user?.firstName}
                      </p>
                      
                      <div className="mt-1 lg:mt-2 flex items-center gap-2">
                        <span className="text-gray-500 text-xs flex items-center gap-0.5">
                          <Clock size={10} />
                          {formatTimeAgo(order.createdAt)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {isExpanded ? '▼' : '▶'} {isExpanded ? 'Hide' : 'View'} details
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right ml-2">
                      <p className="font-bold text-lg lg:text-2xl">{formatPeso(totalEarnings || order.total)}</p>
                      <p className="text-gray-500 text-xs">Total</p>
                      <div className="mt-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Supplier Groups */}
                {isExpanded && (
                  <div className="px-2 lg:px-4 pb-3 border-t border-gray-100">
                    <div className="space-y-3 mt-3">
                      {supplierGroups.map((group) => (
                        <div key={group.supplierId} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Store size={16} className="text-gray-500 mt-0.5" />
                            <div className="flex-1">
                              {/* Supplier Header */}
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium text-sm">{group.supplierName}</h4>
                                  <p className="text-xs text-gray-500 mt-0.5">{group.supplierAddress}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-sm">{formatPeso(group.totalAmount)}</p>
                                  <p className="text-xs text-gray-500">{group.itemCount} items</p>
                                </div>
                              </div>
                              
                              {/* Items List */}
                              <div className="mt-2 space-y-1">
                                {group.items.map((item) => (
                                  <div key={item.id} className="flex justify-between text-xs">
                                    <span className="text-gray-600">
                                      {item.quantity}x {item.product.name}
                                    </span>
                                    <span className="text-gray-800 font-medium">
                                      {formatPeso(item.price * item.quantity)}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {/* Pickup Button - Only for PROCESSING status */}
                              {order.status === OrderStatus.PROCESSING && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConfirmPickup(order.id, group.supplierId);
                                  }}
                                  disabled={processingOrderId === order.id}
                                  className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 disabled:bg-gray-400"
                                >
                                  {processingOrderId === order.id ? (
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <>
                                      <Package size={12} />
                                      <span>Confirm Pickup from {group.supplierName}</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Global Pickup Button for Single Supplier */}
                    {!hasMultipleSuppliers && order.status === OrderStatus.PROCESSING && (
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
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
                                  }
