import { useQuery } from '@apollo/client';
import { ORDER_ITEMS } from '../graphql/query';
import { useState } from 'react';

// Define types based on your schema
interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  createdAt: string;
  updatedAt: string;
  user: { id: string };
  address: { id: string };
  items: Array<{ id: string }>;
  payments: Array<{ id: string }>;
}

// Define order stages
const ORDER_STAGES = [
  { key: 'PENDING', label: 'Order Placed', color: 'bg-purple-200', textColor: 'text-purple-800' },
  { key: 'CONFIRMED', label: 'Confirmed', color: 'bg-indigo-200', textColor: 'text-indigo-800' },
  { key: 'PROCESSING', label: 'Processing', color: 'bg-blue-200', textColor: 'text-blue-800' },
  { key: 'SHIPPED', label: 'Shipped', color: 'bg-cyan-200', textColor: 'text-cyan-800' },
  { key: 'DELIVERED', label: 'Delivered', color: 'bg-green-200', textColor: 'text-green-800' },
  { key: 'CANCELLED', label: 'Cancelled', color: 'bg-red-200', textColor: 'text-red-800' },
];

export default function OrderTracking({ userId }: { userId: string }) {
  const { loading, error, data } = useQuery(ORDER_ITEMS, {
    variables: { userId }
  });

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeOrderDetails = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  if (loading) return <OrderLoadingSkeleton />;
  if (error) return <OrderError error={error} />;

  const orders: Order[] = data.orders;
  
  // Group orders by status
  const ordersByStatus = ORDER_STAGES.reduce((acc, stage) => {
    acc[stage.key] = orders.filter(order => order.status === stage.key);
    return acc;
  }, {} as Record<string, Order[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-900 mb-2">Order Tracking</h1>
          <p className="text-purple-600">Track your orders from placement to delivery</p>
        </div>

        {/* Mobile View - Vertical Timeline */}
        <div className="lg:hidden">
          <MobileOrderView ordersByStatus={ordersByStatus} onViewDetails={openOrderDetails} />
        </div>

        {/* Desktop View - Kanban Board */}
        <div className="hidden lg:block">
          <DesktopOrderView ordersByStatus={ordersByStatus} onViewDetails={openOrderDetails} />
        </div>

        {/* Order Details Modal */}
        {isModalOpen && selectedOrder && (
          <OrderDetailsModal order={selectedOrder} onClose={closeOrderDetails} />
        )}
      </div>
    </div>
  );
}

// Mobile View Component
function MobileOrderView({ ordersByStatus, onViewDetails }: { ordersByStatus: Record<string, Order[]>, onViewDetails: (order: Order) => void }) {
  return (
    <div className="space-y-6">
      {ORDER_STAGES.map((stage) => (
        <div key={stage.key} className="bg-white rounded-xl shadow-lg border border-purple-200">
          <div className={`${stage.color} ${stage.textColor} px-4 py-3 rounded-t-xl`}>
            <h3 className="font-semibold text-lg">
              {stage.label} ({ordersByStatus[stage.key]?.length || 0})
            </h3>
          </div>
          <div className="p-4 space-y-4">
            {ordersByStatus[stage.key]?.length > 0 ? (
              ordersByStatus[stage.key].map((order) => (
                <OrderCard key={order.id} order={order} onViewDetails={onViewDetails} />
              ))
            ) : (
              <div className="text-center py-8 text-purple-400">
                <div className="text-4xl mb-2">📦</div>
                <p>No orders in this stage</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Desktop View Component
function DesktopOrderView({ ordersByStatus, onViewDetails }: { ordersByStatus: Record<string, Order[]>, onViewDetails: (order: Order) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {ORDER_STAGES.map((stage) => (
        <div key={stage.key} className="bg-white rounded-xl shadow-lg border border-purple-200 min-h-[600px]">
          <div className={`${stage.color} ${stage.textColor} px-4 py-3 rounded-t-xl`}>
            <h3 className="font-semibold text-lg text-center">
              {stage.label} ({ordersByStatus[stage.key]?.length || 0})
            </h3>
          </div>
          <div className="p-4 space-y-4 h-[550px] overflow-y-auto">
            {ordersByStatus[stage.key]?.length > 0 ? (
              ordersByStatus[stage.key].map((order) => (
                <OrderCard key={order.id} order={order} onViewDetails={onViewDetails} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-purple-400">
                <div className="text-4xl mb-2">📦</div>
                <p className="text-sm">No orders</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Order Card Component
function OrderCard({ order, onViewDetails }: { order: Order, onViewDetails: (order: Order) => void }) {
  return (
    <div className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
      {/* Order Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-purple-900">#{order.orderNumber}</h4>
          <p className="text-xs text-purple-600">
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
          ${order.total.toFixed(2)}
        </span>
      </div>

      {/* Order Details */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-purple-600">Items:</span>
          <span className="font-medium">{order.items.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-purple-600">Subtotal:</span>
          <span>${order.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-purple-600">Shipping:</span>
          <span>${order.shipping.toFixed(2)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount:</span>
            <span>-${order.discount.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-purple-500 mb-1">
          <span>Progress</span>
          <span>{Math.round((ORDER_STAGES.findIndex(s => s.key === order.status) + 1) / ORDER_STAGES.length * 100)}%</span>
        </div>
        <div className="w-full bg-purple-200 rounded-full h-2">
          <div 
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${(ORDER_STAGES.findIndex(s => s.key === order.status) + 1) / ORDER_STAGES.length * 100}%` 
            }}
          ></div>
        </div>
      </div>

      {/* Action Button */}
      <button 
        onClick={() => onViewDetails(order)}
        className="w-full mt-3 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
      >
        View Details
      </button>
    </div>
  );
}

// Order Details Modal Component - Fixed for mobile
function OrderDetailsModal({ order, onClose }: { order: Order, onClose: () => void }) {
  const currentStageIndex = ORDER_STAGES.findIndex(s => s.key === order.status);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-2 max-h-[95vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 sm:p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div className="pr-4">
              <h2 className="text-xl sm:text-2xl font-bold">Order #{order.orderNumber}</h2>
              <p className="text-purple-200 text-sm sm:text-base">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:text-purple-200 text-2xl font-bold transition-colors flex-shrink-0 ml-2"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Order Status Timeline - Fixed for mobile */}
          <div className="bg-purple-50 rounded-lg p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">Order Status</h3>
            <div className="overflow-x-auto pb-4">
              <div className="flex items-center justify-between min-w-max">
                {ORDER_STAGES.map((stage, index) => (
                  <div key={stage.key} className="flex flex-col items-center min-w-[60px] sm:min-w-[80px]">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 ${
                      index <= currentStageIndex 
                        ? 'bg-purple-600 border-purple-600 text-white' 
                        : 'bg-white border-purple-300 text-purple-400'
                    } font-bold text-xs sm:text-sm`}>
                      {index + 1}
                    </div>
                    <span className={`text-xs mt-2 text-center ${
                      index <= currentStageIndex ? 'text-purple-700 font-medium' : 'text-purple-400'
                    }`}>
                      {stage.label}
                    </span>
                  </div>
                ))}
              </div>
              {/* Progress Line */}
              <div className="relative -mt-6 sm:-mt-7 mx-4 sm:mx-10">
                <div className="h-0.5 bg-purple-300">
                  <div 
                    className="h-full bg-purple-600 transition-all duration-500"
                    style={{ width: `${(currentStageIndex / (ORDER_STAGES.length - 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Pricing Details */}
            <div className="bg-white border border-purple-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm sm:text-base">
                <div className="flex justify-between">
                  <span className="text-purple-600">Subtotal:</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-600">Shipping:</span>
                  <span>${order.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-600">Tax:</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-${order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-purple-200 pt-3 flex justify-between text-lg font-bold text-purple-900">
                  <span>Total:</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Order Information */}
            <div className="bg-white border border-purple-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">Order Information</h3>
              <div className="space-y-3 text-sm sm:text-base">
                <div className="flex justify-between">
                  <span className="text-purple-600">Order Number:</span>
                  <span className="font-medium">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    ORDER_STAGES.find(s => s.key === order.status)?.color || 'bg-gray-200'
                  } ${ORDER_STAGES.find(s => s.key === order.status)?.textColor || 'text-gray-800'}`}>
                    {ORDER_STAGES.find(s => s.key === order.status)?.label || order.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-600">Items:</span>
                  <span className="font-medium">{order.items.length} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-600">Payments:</span>
                  <span className="font-medium">{order.payments.length} payment(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-600">Last Updated:</span>
                  <span className="text-sm">{new Date(order.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Fixed for mobile */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
            <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 sm:px-6 rounded-lg font-medium transition-colors duration-200 text-sm sm:text-base">
              Track Package
            </button>
            <button className="flex-1 bg-white hover:bg-purple-50 text-purple-600 border border-purple-600 py-3 px-4 sm:px-6 rounded-lg font-medium transition-colors duration-200 text-sm sm:text-base">
              Contact Support
            </button>
            <button className="flex-1 bg-white hover:bg-purple-50 text-purple-600 border border-purple-600 py-3 px-4 sm:px-6 rounded-lg font-medium transition-colors duration-200 text-sm sm:text-base">
              Download Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading Skeleton
function OrderLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="h-8 bg-purple-200 rounded w-48 mx-auto mb-2"></div>
          <div className="h-4 bg-purple-200 rounded w-64 mx-auto"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg p-4">
              <div className="h-6 bg-purple-200 rounded mb-4"></div>
              {[...Array(3)].map((_, j) => (
                <div key={j} className="bg-purple-100 rounded-lg p-4 mb-4 animate-pulse">
                  <div className="h-4 bg-purple-200 rounded mb-2"></div>
                  <div className="h-3 bg-purple-200 rounded mb-1"></div>
                  <div className="h-3 bg-purple-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Error Component
function OrderError({ error }: { error: any }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">😔</div>
        <h2 className="text-2xl font-bold text-purple-900 mb-2">Unable to Load Orders</h2>
        <p className="text-purple-600 mb-4">{error.message}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded-lg font-medium transition-colors duration-200"
        >
          Try Again
        </button>
      </div>
    </div>
  );
                    }
