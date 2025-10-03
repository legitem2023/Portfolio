import { useQuery } from '@apollo/client';
import { ORDER_ITEMS } from '../graphql/query';

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
          <MobileOrderView ordersByStatus={ordersByStatus} />
        </div>

        {/* Desktop View - Kanban Board */}
        <div className="hidden lg:block">
          <DesktopOrderView ordersByStatus={ordersByStatus} />
        </div>
      </div>
    </div>
  );
}

// Mobile View Component
function MobileOrderView({ ordersByStatus }: { ordersByStatus: Record<string, Order[]> }) {
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
                <OrderCard key={order.id} order={order} />
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
function DesktopOrderView({ ordersByStatus }: { ordersByStatus: Record<string, Order[]> }) {
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
                <OrderCard key={order.id} order={order} />
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
function OrderCard({ order }: { order: Order }) {
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
      <button className="w-full mt-3 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200">
        View Details
      </button>
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
