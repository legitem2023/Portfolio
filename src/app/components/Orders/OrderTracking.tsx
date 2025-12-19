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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-900 mb-2">Order Tracking</h1>
          <p className="text-purple-600">Track your orders from placement to delivery</p>
        </header>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {/* All Orders Tab */}
            <button
              onClick={() => setActiveTab('ALL')}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'ALL'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-purple-700 hover:bg-purple-50'
              }`}
            >
              <span>All Orders</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                activeTab === 'ALL'
                  ? 'bg-purple-500 text-white'
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {orderCounts.ALL}
              </span>
            </button>

            {/* Stage Tabs */}
            {ORDER_STAGES.map((stage) => (
              <button
                key={stage.key}
                onClick={() => setActiveTab(stage.key)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === stage.key
                    ? `${stage.color.replace('200', '600')} text-white shadow-lg`
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{stage.label}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  activeTab === stage.key
                    ? 'bg-white bg-opacity-20 text-white'
                    : `${stage.color} ${stage.textColor}`
                }`}>
                  {orderCounts[stage.key as keyof OrderCounts]}
                </span>
              </button>
            ))}
          </div>

          {/* Progress Bar for All Orders View */}
          {activeTab === 'ALL' && orders.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">Overall Order Progress</h3>
              <div className="grid grid-cols-6 gap-2">
                {ORDER_STAGES.map((stage) => {
                  const stageOrders = ordersByStatus[stage.key] || [];
                  const percentage = orders.length > 0 ? (stageOrders.length / orders.length) * 100 : 0;
                  return (
                    <div key={stage.key} className="text-center">
                      <div className="text-sm font-medium text-gray-700 mb-1">{stage.label}</div>
                      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`absolute inset-y-0 left-0 ${stage.color.replace('200', '500')}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {stageOrders.length} ({Math.round(percentage)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Orders Grid */}
        {filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} onViewDetails={openOrderDetails} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-purple-900 mb-2">
              {activeTab === 'ALL' ? 'No orders found' : `No orders in ${ORDER_STAGES.find(s => s.key === activeTab)?.label || 'this stage'}`}
            </h3>
            <p className="text-purple-600">
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

// Order Card Component
function OrderCard({ order, onViewDetails }: { order: Order, onViewDetails: (order: Order) => void }) {
  const { percentage } = getOrderProgress(order.status);
  const stage = ORDER_STAGES.find(s => s.key === order.status);
  
  return (
    <article className="bg-white border border-purple-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Stage Indicator */}
      <div className={`${stage?.color} ${stage?.textColor} px-4 py-3 rounded-t-xl flex justify-between items-center`}>
        <h3 className="font-semibold">{stage?.label}</h3>
        <span className="text-sm font-medium px-2 py-1 bg-white bg-opacity-30 rounded-full">
          #{order.orderNumber}
        </span>
      </div>

      <div className="p-5">
        {/* Order Date and Total */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <time className="text-sm text-gray-600" dateTime={order.createdAt}>
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </time>
            <p className="text-xs text-gray-500">
              {new Date(order.createdAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-900">{formatPeso(order.total)}</div>
            <div className="text-xs text-gray-600">Total Amount</div>
          </div>
        </div>

        {/* Order Details */}
        <div className="space-y-3 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Items:</span>
            <span className="font-medium">{order.items.length} items</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span>{formatPeso(order.subtotal)}</span>
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
        <div className="mb-4">
          <div className="flex justify-between items-center text-xs text-gray-600 mb-2">
            <span>Order Progress</span>
            <span className="font-medium">{percentage}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${stage?.color.replace('200', '600') || 'bg-purple-600'}`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Placed</span>
            <span>Delivered</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={() => onViewDetails(order)}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors duration-200 text-sm"
          >
            View Details
          </button>
          <button className="px-4 py-2.5 border border-purple-600 text-purple-600 hover:bg-purple-50 rounded-lg font-medium transition-colors duration-200 text-sm">
            Track
          </button>
        </div>
      </div>
    </article>
  );
}

// Order Details Modal Component
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
      
      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Modal Header */}
          <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 flex-shrink-0">
            <div className="flex justify-between items-start">
              <div className="pr-4">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">Order #{order.orderNumber}</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${stage?.color} ${stage?.textColor}`}>
                    {stage?.label}
                  </span>
                </div>
                <p className="text-purple-200">
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
                aria-label="Close order details"
              >
                ×
              </button>
            </div>
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Order Timeline */}
            <section className="bg-purple-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">Order Timeline</h3>
              <div className="flex items-center justify-between relative">
                {ORDER_STAGES.map((stage, index) => (
                  <div key={stage.key} className="flex flex-col items-center flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${
                      index <= currentStageIndex 
                        ? `${stage.color.replace('200', '600')} border-purple-600 text-white` 
                        : 'bg-white border-purple-300 text-purple-400'
                    } font-bold text-sm`}>
                      {index + 1}
                    </div>
                    <span className={`text-sm mt-2 text-center font-medium ${
                      index <= currentStageIndex ? 'text-purple-700' : 'text-purple-400'
                    }`}>
                      {stage.label}
                    </span>
                    {index === currentStageIndex && (
                      <span className="text-xs text-purple-500 mt-1">Current</span>
                    )}
                  </div>
                ))}
                {/* Progress Line */}
                <div className="absolute top-6 left-0 right-0 h-1 bg-purple-300 -z-10">
                  <div 
                    className="h-full bg-purple-600 transition-all duration-500"
                    style={{ width: `${(currentStageIndex / (ORDER_STAGES.length - 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </section>

            {/* Order Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order Summary */}
              <section className="bg-white border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-4">Order Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatPeso(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping Fee:</span>
                    <span className="font-medium">{formatPeso(order.shipping)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-medium">{formatPeso(order.tax)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span className="font-medium">-{formatPeso(order.discount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-4 flex justify-between text-xl font-bold text-purple-900">
                    <span>Total Amount:</span>
                    <span>{formatPeso(order.total)}</span>
                  </div>
                </div>
              </section>

              {/* Order Information */}
              <section className="bg-white border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-4">Order Information</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="font-medium">{order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${stage?.color} ${stage?.textColor}`}>
                      {stage?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items Count:</span>
                    <span className="font-medium">{order.items.length} items</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payments:</span>
                    <span className="font-medium">{order.payments.length} payment(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium">{new Date(order.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </section>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200">
                Track Package
              </button>
              <button className="flex-1 bg-white hover:bg-purple-50 text-purple-600 border border-purple-600 py-3 px-6 rounded-lg font-medium transition-colors duration-200">
                Contact Support
              </button>
              <button className="flex-1 bg-white hover:bg-purple-50 text-purple-600 border border-purple-600 py-3 px-6 rounded-lg font-medium transition-colors duration-200">
                Download Invoice
              </button>
            </div>
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
        
        {/* Tab Loading Skeleton */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-12 w-32 bg-purple-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
        
        {/* Cards Loading Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg p-5 animate-pulse">
              <div className="h-6 bg-purple-200 rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-purple-100 rounded"></div>
                <div className="h-4 bg-purple-100 rounded"></div>
                <div className="h-4 bg-purple-100 rounded w-3/4"></div>
              </div>
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
