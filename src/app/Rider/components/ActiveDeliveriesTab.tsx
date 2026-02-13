"use client";
import { Package, Shield, CheckCircle, Clock, XCircle, AlertTriangle, MapPin } from "lucide-react";
import { formatPeso } from '../lib/utils';
import { useQuery } from '@apollo/client';
import { ACTIVE_ORDER_LIST } from '../lib/types';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';

interface ActiveDeliveriesTabProps {
  isMobile: boolean;
}

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
  status: string;
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

// Status constants
const ORDER_STATUS = {
  PROCESSING: 'PROCESSING',
  PICKED_UP: 'PICKED_UP',
  IN_TRANSIT: 'IN_TRANSIT',
  ARRIVED: 'ARRIVED',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  RETURNED: 'RETURNED'
};

export default function ActiveDeliveriesTab({ isMobile }: ActiveDeliveriesTabProps) {
  const { user } = useAuth();
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const { loading, error, data } = useQuery<ActiveOrderData>(ACTIVE_ORDER_LIST, {
    variables: {
      filter: {
        status: "PROCESSING",
        riderId: user?.userId
      },
      pagination: {
        page: 1,
        pageSize: 10
      }
    }
  });

  // Just the UI handlers - no actual GraphQL mutations yet
  const handlePickup = (orderId: string) => {
    if (confirm('Confirm pickup from supplier?')) {
      setProcessingOrderId(orderId);
      // TODO: Add confirmPickup mutation
      console.log('Pickup confirmed for:', orderId);
      setTimeout(() => setProcessingOrderId(null), 1000);
    }
  };

  const handleStartDelivery = (orderId: string) => {
    if (confirm('Start delivery to customer?')) {
      setProcessingOrderId(orderId);
      // TODO: Add updateStatus mutation
      console.log('Delivery started for:', orderId);
      setTimeout(() => setProcessingOrderId(null), 1000);
    }
  };

  const handleArrived = (orderId: string) => {
    if (confirm('Mark as arrived at customer location?')) {
      setProcessingOrderId(orderId);
      // TODO: Add updateStatus mutation
      console.log('Arrived at location for:', orderId);
      setTimeout(() => setProcessingOrderId(null), 1000);
    }
  };

  const handleDelivered = (orderId: string) => {
    if (confirm('Confirm order delivered to customer?')) {
      setProcessingOrderId(orderId);
      // TODO: Add updateStatus mutation
      console.log('Delivered order:', orderId);
      setTimeout(() => setProcessingOrderId(null), 1000);
    }
  };

  const handleFailed = (orderId: string) => {
    setSelectedOrder(orders.find(o => o.id === orderId) || null);
    setShowFailureModal(true);
  };

  const handleReturn = (orderId: string) => {
    if (confirm('Confirm return to supplier?')) {
      setProcessingOrderId(orderId);
      // TODO: Add updateStatus mutation
      console.log('Return initiated for:', orderId);
      setTimeout(() => setProcessingOrderId(null), 1000);
    }
  };

  const handleFailureSubmit = (reason: string, notes: string) => {
    if (!selectedOrder) return;
    
    setProcessingOrderId(selectedOrder.id);
    // TODO: Add failed status mutation with reason and notes
    console.log('Failed order:', selectedOrder.id, 'Reason:', reason, 'Notes:', notes);
    
    setTimeout(() => {
      setProcessingOrderId(null);
      setShowFailureModal(false);
      setSelectedOrder(null);
    }, 1000);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
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
            const totalEarnings = order.payments
              .filter(p => p.status === 'COMPLETED')
              .reduce((sum, p) => sum + p.amount, 0);

            return (
              <div key={order.id} className="bg-white p-2 lg:p-4 rounded-lg shadow border-l-4 border-blue-500">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-1 lg:gap-2">
                      <Shield size={isMobile ? 14 : 16} className="text-blue-500" />
                      <h3 className="font-bold text-base lg:text-lg">{order.orderNumber}</h3>
                    </div>
                    
                    <p className="text-gray-600 text-sm lg:text-base mt-0.5 lg:mt-1">
                      {order.address?.street}, {order.address?.city}
                    </p>
                    
                    <p className="text-gray-500 text-xs mt-0.5">
                      Customer: {order.user?.firstName} • {order.items.length} items
                    </p>
                    
                    <div className="mt-1 lg:mt-2 flex flex-wrap items-center gap-1 lg:gap-2">
                      <span className="text-gray-500 text-xs flex items-center gap-0.5">
                        <Clock size={10} />
                        {formatTimeAgo(order.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right ml-2 min-w-[100px]">
                    <p className="font-bold text-lg lg:text-2xl">{formatPeso(totalEarnings || order.total)}</p>
                    <p className="text-gray-500 text-xs">Earnings</p>
                    <div className="mt-1">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* STATUS BUTTONS - Different buttons based on current status */}
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                  
                  {/* BUTTONS FOR PROCESSING STATUS (Ready for Pickup) */}
                  {order.status === 'PROCESSING' && (
                    <button
                      onClick={() => handlePickup(order.id)}
                      disabled={processingOrderId === order.id}
                      className="flex-1 min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 disabled:bg-gray-400"
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

                  {/* BUTTONS FOR PICKED_UP STATUS (Has items, ready to deliver) */}
                  {order.status === 'PICKED_UP' && (
                    <>
                      <button
                        onClick={() => handleStartDelivery(order.id)}
                        disabled={processingOrderId === order.id}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 disabled:bg-gray-400"
                      >
                        {processingOrderId === order.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Clock size={14} />
                            <span>Start Delivery</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleFailed(order.id)}
                        disabled={processingOrderId === order.id}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 disabled:bg-gray-400"
                      >
                        <XCircle size={14} />
                        <span>Failed</span>
                      </button>
                    </>
                  )}

                  {/* BUTTONS FOR IN_TRANSIT STATUS (On the way) */}
                  {order.status === 'IN_TRANSIT' && (
                    <>
                      <button
                        onClick={() => handleArrived(order.id)}
                        disabled={processingOrderId === order.id}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 disabled:bg-gray-400"
                      >
                        {processingOrderId === order.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <MapPin size={14} />
                            <span>Arrived</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleFailed(order.id)}
                        disabled={processingOrderId === order.id}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 disabled:bg-gray-400"
                      >
                        <XCircle size={14} />
                        <span>Failed</span>
                      </button>
                    </>
                  )}

                  {/* BUTTONS FOR ARRIVED STATUS (At location) */}
                  {order.status === 'ARRIVED' && (
                    <>
                      <button
                        onClick={() => handleDelivered(order.id)}
                        disabled={processingOrderId === order.id}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 disabled:bg-gray-400"
                      >
                        {processingOrderId === order.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <CheckCircle size={14} />
                            <span>Delivered</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleFailed(order.id)}
                        disabled={processingOrderId === order.id}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 disabled:bg-gray-400"
                      >
                        <XCircle size={14} />
                        <span>Failed</span>
                      </button>
                    </>
                  )}

                  {/* BUTTONS FOR FAILED STATUS (Can return) */}
                  {order.status === 'FAILED' && (
                    <button
                      onClick={() => handleReturn(order.id)}
                      disabled={processingOrderId === order.id}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 disabled:bg-gray-400"
                    >
                      {processingOrderId === order.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <AlertTriangle size={14} />
                          <span>Return to Supplier</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAILURE MODAL - Simple version */}
      {showFailureModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Report Delivery Failure</h3>
            <p className="text-sm text-gray-600 mb-4">
              Order: {selectedOrder.orderNumber}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Failure
              </label>
              <select
                id="failure-reason"
                className="w-full p-2 border border-gray-300 rounded-lg"
                defaultValue=""
              >
                <option value="" disabled>Select a reason</option>
                <option value="CUSTOMER_NOT_AVAILABLE">Customer not available</option>
                <option value="WRONG_ADDRESS">Wrong address</option>
                <option value="CUSTOMER_REFUSED">Customer refused order</option>
                <option value="PACKAGE_DAMAGED">Package damaged</option>
                <option value="OTHER">Other reason</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                id="failure-notes"
                placeholder="Add details..."
                className="w-full p-2 border border-gray-300 rounded-lg"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const reason = (document.getElementById('failure-reason') as HTMLSelectElement)?.value;
                  const notes = (document.getElementById('failure-notes') as HTMLTextAreaElement)?.value;
                  handleFailureSubmit(reason, notes);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg"
              >
                Submit
              </button>
              <button
                onClick={() => {
                  setShowFailureModal(false);
                  setSelectedOrder(null);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
                  }
