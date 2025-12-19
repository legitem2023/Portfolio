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
  { key: 'PENDING', label: 'Placed', shortLabel: 'Placed', color: 'bg-purple-200', textColor: 'text-purple-800' },
  { key: 'CONFIRMED', label: 'Confirmed', shortLabel: 'Confirmed', color: 'bg-indigo-200', textColor: 'text-indigo-800' },
  { key: 'PROCESSING', label: 'Processing', shortLabel: 'Processing', color: 'bg-blue-200', textColor: 'text-blue-800' },
  { key: 'SHIPPED', label: 'Shipped', shortLabel: 'Shipped', color: 'bg-cyan-200', textColor: 'text-cyan-800' },
  { key: 'DELIVERED', label: 'Delivered', shortLabel: 'Delivered', color: 'bg-green-200', textColor: 'text-green-800' },
  { key: 'CANCELLED', label: 'Cancelled', shortLabel: 'Cancelled', color: 'bg-red-200', textColor: 'text-red-800' },
];

// Helper function to calculate order progress
const getOrderProgress = (status: string) => {
  const stageIndex = ORDER_STAGES.findIndex(s => s.key === status);
  const percentage = ((stageIndex + 1) / ORDER_STAGES.length) * 100;
  return { stageIndex, percentage: Math.round(percentage) };
};

// Helper function to format currency as pesos
const formatPeso = (amount: number) => {
  return `₱${amount.toFixed(2)}`;
};

// Type for order counts
type OrderCounts = {
  ALL: number;
  PENDING: number;
  CONFIRMED: number;
  PROCESSING: number;
  SHIPPED: number;
  DELIVERED: number;
  CANCELLED: number;
};

export default function OrderTracking({ userId }: { userId: string }) {
  const { loading, error, data } = useQuery(ORDER_ITEMS, {
    variables: { userId }
  });

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('ALL');

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeOrderDetails = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedOrder(null), 300);
  };

  if (loading) return <OrderLoadingSkeleton />;
  if (error) return <OrderError error={error} />;

  const orders: Order[] = data.orders;
  
  // Group orders by status
  const ordersByStatus = ORDER_STAGES.reduce((acc, stage) => {
    acc[stage.key] = orders.filter(order => order.status === stage.key);
    return acc;
  }, {} as Record<string, Order[]>);

  // Calculate order counts for each tab
  const orderCounts: OrderCounts = {
    ALL: orders.length,
    PENDING: ordersByStatus['PENDING']?.length || 0,
    CONFIRMED: ordersByStatus['CONFIRMED']?.length || 0,
    PROCESSING: ordersByStatus['PROCESSING']?.length || 0,
    SHIPPED: ordersByStatus['SHIPPED']?.length || 0,
    DELIVERED: ordersByStatus['DELIVERED']?.length || 0,
    CANCELLED: ordersByStatus['CANCELLED']?.length || 0,
  };

  // Get filtered orders based on active tab
  const filteredOrders = activeTab === 'ALL' 
    ? orders 
    : ordersByStatus[activeTab] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-4 sm:mb-6 md:mb-8 px-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-900 mb-1 sm:mb-2">Order Tracking</h1>
          <p className="text-sm sm:text-base text-purple-600">Track your orders from placement to delivery</p>
        </header>

        {/* Tab Navigation */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-wrap justify-center gap-1 sm:gap-2 mb-3 sm:mb-4 px-1">
            {/* All Orders Tab */}
            <button
              onClick={() => setActiveTab('ALL')}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                activeTab === 'ALL'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-purple-700 hover:bg-purple-50'
              }`}
            >
              <span className="whitespace-nowrap">All</span>
              <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded-full ${
                activeTab === 'ALL'
                  ? 'bg-purple-500 text-white'
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {orderCounts.ALL}
              </span>
            </button>

            {/* Stage Tabs - Responsive labels */}
            {ORDER_STAGES.map((stage) => (
              <button
                key={stage.key}
                onClick={() => setActiveTab(stage.key)}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                  activeTab === stage.key
                    ? `${stage.color.replace('200', '600')} text-white shadow-lg`
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="hidden xs:inline sm:inline">{stage.label}</span>
                <span className="xs:hidden sm:hidden">{stage.shortLabel}</span>
                <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded-full ${
                  activeTab === stage.key
                    ? 'bg-white bg-opacity-20 text-white'
                    : `${stage.color} ${stage.textColor}`
                }`}>
                  {orderCounts[stage.key as keyof OrderCounts]}
                </span>
              </button>
            ))}
          </div>

          {/* Progress Bar for All Orders View - Responsive */}
          {activeTab === 'ALL' && orders.length > 0 && (
            <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 mx-1">
              <h3 className="text-base sm:text-lg font-semibold text-purple-900 mb-2 sm:mb-3 md:mb-4">Overall Progress</h3>
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-2">
                {ORDER_STAGES.map((stage) => {
                  const stageOrders = ordersByStatus[stage.key] || [];
                  const percentage = orders.length > 0 ? (stageOrders.length / orders.length) * 100 : 0;
                  return (
                    <div key={stage.key} className="text-center">
                      <div className="text-xs sm:text-sm font-medium text-gray-700 mb-1 truncate">{stage.shortLabel}</div>
                      <div className="relative h-2 sm:h-3 md:h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`absolute inset-y-0 left-0 ${stage.color.replace('200', '500')}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5 sm:mt-1">
                        {stageOrders.length} <span className="hidden xs:inline">({Math.round(percentage)}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Orders Grid - Responsive */}
        {filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 px-1">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} onViewDetails={openOrderDetails} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-6 sm:p-8 md:p-12 text-center mx-2">
            <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">📦</div>
            <h3 className="text-lg sm:text-xl font-semibold text-purple-900 mb-1 sm:mb-2">
              {activeTab === 'ALL' ? 'No orders found' : `No orders in ${ORDER_STAGES.find(s => s.key === activeTab)?.label || 'this stage'}`}
            </h3>
            <p className="text-sm sm:text-base text-purple-600">
              {activeTab === 'ALL' 
                ? 'You haven\'t placed any orders yet.' 
                : 'All your orders have moved past this stage.'}
            </p>
          </div>
        )}

        {/* Order Details Modal */}
        {isModalOpen && selectedOrder && (
          <OrderDetailsModal order={selectedOrder} onClose={closeOrderDetails} />
        )}
      </div>
    </div>
  );
}

// Order Card Component - Responsive
function OrderCard({ order, onViewDetails }: { order: Order, onViewDetails: (order: Order) => void }) {
  const { percentage } = getOrderProgress(order.status);
  const stage = ORDER_STAGES.find(s => s.key === order.status);
  
  return (
    <article className="bg-white border border-purple-200 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Stage Indicator */}
      <div className={`${stage?.color} ${stage?.textColor} px-3 sm:px-4 py-2 sm:py-3 rounded-t-lg sm:rounded-t-xl flex justify-between items-center`}>
        <h3 className="font-semibold text-sm sm:text-base truncate pr-2">{stage?.label}</h3>
        <span className="text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white bg-opacity-30 rounded-full whitespace-nowrap">
          #{order.orderNumber}
        </span>
      </div>

      <div className="p-3 sm:p-4 md:p-5">
        {/* Order Date and Total */}
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          <div className="min-w-0 flex-1 pr-2">
            <time className="text-xs sm:text-sm text-gray-600 truncate" dateTime={order.createdAt}>
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </time>
            <p className="text-xs text-gray-500">
              {new Date(order.createdAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true
              }).replace(/^0/, '')}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-900 whitespace-nowrap">
              {formatPeso(order.total)}
            </div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
        </div>

        {/* Order Details */}
        <div className="space-y-2 text-xs sm:text-sm mb-3 sm:mb-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Items:</span>
            <span className="font-medium">{order.items.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span className="truncate pl-2">{formatPeso(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Shipping:</span>
            <span>{formatPeso(order.shipping)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount:</span>
              <span className="font-medium">-{formatPeso(order.discount)}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-3 sm:mb-4">
          <div className="flex justify-between items-center text-xs text-gray-600 mb-1.5 sm:mb-2">
            <span>Progress</span>
            <span className="font-medium">{percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 md:h-2.5">
            <div 
              className={`h-full rounded-full ${stage?.color.replace('200', '600') || 'bg-purple-600'}`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-0.5 sm:mt-1">
            <span>Placed</span>
            <span>Delivered</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1.5 sm:gap-2">
          <button 
            onClick={() => onViewDetails(order)}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-1.5 sm:py-2 px-2 sm:px-4 rounded-lg font-medium transition-colors duration-200 text-xs sm:text-sm"
          >
            Details
          </button>
          <button className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 border border-purple-600 text-purple-600 hover:bg-purple-50 rounded-lg font-medium transition-colors duration-200 text-xs sm:text-sm whitespace-nowrap">
            Track
          </button>
        </div>
      </div>
    </article>
  );
}

// Order Details Modal Component - Fully Responsive
function OrderDetailsModal({ order, onClose }: { order: Order, onClose: () => void }) {
  const { stageIndex: currentStageIndex } = getOrderProgress(order.status);
  const stage = ORDER_STAGES.find(s => s.key === order.status);
  
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Container - Bottom sheet on mobile, centered on larger screens */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center p-0 sm:p-4">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full h-[90vh] sm:h-auto sm:max-h-[90vh] sm:max-w-4xl flex flex-col overflow-hidden">
          {/* Drag handle for mobile */}
          <div className="sm:hidden flex justify-center py-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
          </div>
          
          {/* Modal Header */}
          <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 sm:p-4 md:p-6 flex-shrink-0">
            <div className="flex justify-between items-start">
              <div className="pr-2 sm:pr-4 flex-1 min-w-0">
                <div className="flex flex-col xs:flex-row xs:items-center gap-1 sm:gap-2 md:gap-3 mb-1 sm:mb-2">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Order #{order.orderNumber}</h2>
                  <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${stage?.color} ${stage?.textColor} whitespace-nowrap`}>
                    {stage?.label}
                  </span>
                </div>
                <p className="text-purple-200 text-xs sm:text-sm truncate">
                  Placed {new Date(order.createdAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="text-white hover:text-purple-200 text-xl sm:text-2xl font-bold transition-colors flex-shrink-0 ml-1 sm:ml-2"
                aria-label="Close order details"
              >
                ×
              </button>
            </div>
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
            {/* Order Timeline - Responsive */}
            <section className="bg-purple-50 rounded-lg p-3 sm:p-4 md:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-purple-900 mb-2 sm:mb-3 md:mb-4">Order Timeline</h3>
              
              {/* Mobile - Vertical Timeline */}
              <div className="block sm:hidden">
                <div className="relative">
                  {/* Vertical Line */}
                  <div className="absolute left-3 sm:left-4 top-0 bottom-0 w-0.5 bg-purple-300">
                    <div 
                      className="bg-purple-600 w-0.5 transition-all duration-500"
                      style={{ height: `${(currentStageIndex / (ORDER_STAGES.length - 1)) * 100}%` }}
                    ></div>
                  </div>
                  
                  {ORDER_STAGES.map((stage, index) => (
                    <div key={stage.key} className="flex items-start mb-4 sm:mb-6 last:mb-0">
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 z-10 ${
                        index <= currentStageIndex 
                          ? `${stage.color.replace('200', '600')} border-purple-600 text-white` 
                          : 'bg-white border-purple-300 text-purple-400'
                      } font-bold text-xs sm:text-sm flex-shrink-0`}>
                        {index + 1}
                      </div>
                      <div className="ml-2 sm:ml-3 pt-0.5 sm:pt-1">
                        <span className={`font-medium text-sm ${
                          index <= currentStageIndex ? 'text-purple-700' : 'text-purple-400'
                        }`}>
                          {stage.label}
                        </span>
                        {index === currentStageIndex && (
                          <p className="text-xs text-purple-500 mt-0.5">Current</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Desktop - Horizontal Timeline */}
              <div className="hidden sm:block">
                <div className="flex items-center justify-between relative">
                  {ORDER_STAGES.map((stage, index) => (
                    <div key={stage.key} className="flex flex-col items-center flex-1 px-1">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 sm:border-3 md:border-4 ${
                        index <= currentStageIndex 
                          ? `${stage.color.replace('200', '600')} border-purple-600 text-white` 
                          : 'bg-white border-purple-300 text-purple-400'
                      } font-bold text-sm`}>
                        {index + 1}
                      </div>
                      <span className={`text-xs sm:text-sm mt-1 sm:mt-2 text-center font-medium ${
                        index <= currentStageIndex ? 'text-purple-700' : 'text-purple-400'
                      }`}>
                        {stage.shortLabel}
                      </span>
                    </div>
                  ))}
                  {/* Progress Line */}
                  <div className="absolute top-4 sm:top-5 md:top-6 left-0 right-0 h-0.5 sm:h-1 bg-purple-300 -z-10">
                    <div 
                      className="h-full bg-purple-600 transition-all duration-500"
                      style={{ width: `${(currentStageIndex / (ORDER_STAGES.length - 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </section>

            {/* Order Details Grid - Responsive */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {/* Order Summary */}
              <section className="bg-white border border-purple-200 rounded-lg p-3 sm:p-4 md:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-purple-900 mb-2 sm:mb-3 md:mb-4">Order Summary</h3>
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm sm:text-base">Subtotal:</span>
                    <span className="font-medium text-sm sm:text-base">{formatPeso(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm sm:text-base">Shipping:</span>
                    <span className="font-medium text-sm sm:text-base">{formatPeso(order.shipping)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm sm:text-base">Tax:</span>
                    <span className="font-medium text-sm sm:text-base">{formatPeso(order.tax)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="text-sm sm:text-base">Discount:</span>
                      <span className="font-medium text-sm sm:text-base">-{formatPeso(order.discount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 sm:pt-3 md:pt-4 flex justify-between text-base sm:text-lg md:text-xl font-bold text-purple-900">
                    <span className="text-sm sm:text-base md:text-lg">Total:</span>
                    <span>{formatPeso(order.total)}</span>
                  </div>
                </div>
              </section>

              {/* Order Information */}
              <section className="bg-white border border-purple-200 rounded-lg p-3 sm:p-4 md:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-purple-900 mb-2 sm:mb-3 md:mb-4">Order Info</h3>
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm sm:text-base">Order #:</span>
                    <span className="font-medium text-sm sm:text-base truncate pl-2">{order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm sm:text-base">Status:</span>
                    <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${stage?.color} ${stage?.textColor} whitespace-nowrap`}>
                      {stage?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm sm:text-base">Items:</span>
                    <span className="font-medium text-sm sm:text-base">{order.items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm sm:text-base">Payments:</span>
                    <span className="font-medium text-sm sm:text-base">{order.payments.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm sm:text-base">Updated:</span>
                    <span className="font-medium text-xs sm:text-sm">{new Date(order.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </section>
            </div>

            {/* Action Buttons - Responsive */}
            <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 pt-2 sm:pt-3 md:pt-4">
              <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 sm:py-3 px-3 sm:px-4 md:px-6 rounded-lg font-medium transition-colors duration-200 text-sm sm:text-base">
                Track Package
              </button>
              <button className="flex-1 bg-white hover:bg-purple-50 text-purple-600 border border-purple-600 py-2 sm:py-3 px-3 sm:px-4 md:px-6 rounded-lg font-medium transition-colors duration-200 text-sm sm:text-base">
                Support
              </button>
              <button className="flex-1 bg-white hover:bg-purple-50 text-purple-600 border border-purple-600 py-2 sm:py-3 px-3 sm:px-4 md:px-6 rounded-lg font-medium transition-colors duration-200 text-sm sm:text-base">
                Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading Skeleton - Responsive
function OrderLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <div className="h-6 sm:h-8 bg-purple-200 rounded w-40 sm:w-48 mx-auto mb-1 sm:mb-2"></div>
          <div className="h-3 sm:h-4 bg-purple-200 rounded w-48 sm:w-64 mx-auto"></div>
        </div>
        
        {/* Tab Loading Skeleton */}
        <div className="flex flex-wrap justify-center gap-1 sm:gap-2 mb-4 sm:mb-6 md:mb-8 px-1">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-10 sm:h-12 w-16 sm:w-24 md:w-32 bg-purple-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
        
        {/* Cards Loading Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 px-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 md:p-5 animate-pulse">
              <div className="h-4 sm:h-6 bg-purple-200 rounded mb-3 sm:mb-4"></div>
              <div className="space-y-2 sm:space-y-3">
                <div className="h-3 sm:h-4 bg-purple-100 rounded"></div>
                <div className="h-3 sm:h-4 bg-purple-100 rounded"></div>
                <div className="h-3 sm:h-4 bg-purple-100 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Error Component - Responsive
function OrderError({ error }: { error: any }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 md:p-8 max-w-sm sm:max-w-md w-full text-center">
        <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">😔</div>
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-purple-900 mb-1 sm:mb-2">Unable to Load Orders</h2>
        <p className="text-sm sm:text-base text-purple-600 mb-3 sm:mb-4">{error.message}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 sm:px-6 rounded-lg font-medium transition-colors duration-200 text-sm sm:text-base"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
