import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { useState } from 'react';
import { QrCode } from "lucide-react";
// Define types based on your schema - product is an ARRAY
interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  address: {
    id: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    lat: string;
    lng: string;
  };
  proofOfDelivery?: {
    id: string;
    photoUrl: string;
    signatureData: string;
    receivedBy: string;
    receivedAt: string;
  };
  items: Array<{
    id: string;
    orderId: string;
    supplierId: string;
    quantity: number;
    price: number;
    status: string;
    individualShipping: boolean;
    individualDistance: number;
    trackingNumber?: string;
    product: Array<{
      name: string;
      sku: string;
      images: string[];
    }>;
    supplier: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      addresses: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
        lat: string;
        lng: string;
      };
    };
  }>;
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    status: string;
  }>;
}

interface SupplierGroup {
  supplierId: string;
  supplier: Order['items'][0]['supplier'];
  items: Order['items'];
  subtotal: number;
  orderId: string;
  orderNumber: string;
  createdAt: string;
  address: Order['address'];
  user: Order['user'];
  payments: Order['payments'];
}

interface ActiveOrderResponse {
  ordered_products: {
    orders: Order[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  };
}

const ACTIVE_ORDER_LIST = gql`
  query ActiveOrder(
    $filter: OrderFilterInput
    $pagination: OrderPaginationInput
  ) {
    ordered_products(filter: $filter, pagination: $pagination) {
      orders {
        id
        orderNumber
        status
        total
        createdAt
        user {
          id
          firstName
          lastName
          email
          phone
        }
        address {
          id
          street
          city
          state
          zipCode
          country
          lat
          lng
        }
        proofOfDelivery {
          id
          photoUrl
          signatureData
          receivedBy
          receivedAt
        }
        items {
          id
          orderId
          supplierId
          quantity
          price
          status
          individualShipping
          individualDistance
          trackingNumber
          product {
            name
            sku
            images
          }
          supplier {
            id
            firstName
            lastName
            email
            phone
            addresses {
              street
              city
              state
              zipCode
              country
              lat
              lng
            }
          }
        }
        payments {
          id
          amount
          method
          status
        }
      }
      pagination {
        total
        page
        pageSize
        totalPages
      }
    }
  }
`;

const ORDER_STAGES = [
  { key: 'PENDING', label: 'Placed', color: 'bg-purple-100 text-purple-700' },
  { key: 'PROCESSING', label: 'Processing', color: 'bg-indigo-100 text-indigo-700' },
  { key: 'SHIPPED', label: 'Shipped', color: 'bg-cyan-100 text-cyan-700' },
  { key: 'DELIVERED', label: 'Delivered', color: 'bg-green-100 text-green-700' },
  { key: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-700' },
];

const getOrderProgress = (status: string) => {
  const stageIndex = ORDER_STAGES.findIndex(s => s.key === status);
  const percentage = ((stageIndex + 1) / ORDER_STAGES.length) * 100;
  return { stageIndex, percentage: Math.round(percentage) };
};

const formatPrice = (amount: number): string => {
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// Helper function to group order items by supplier
const groupOrderBySupplier = (order: Order): SupplierGroup[] => {
  const supplierMap = new Map<string, SupplierGroup>();
  
  order.items.forEach(item => {
    const supplierId = item.supplierId;
    
    if (!supplierMap.has(supplierId)) {
      supplierMap.set(supplierId, {
        supplierId: supplierId,
        supplier: item.supplier,
        items: [],
        subtotal: 0,
        orderId: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        address: order.address,
        user: order.user,
        payments: order.payments
      });
    }
    
    const group = supplierMap.get(supplierId)!;
    group.items.push(item);
    group.subtotal += (item.price || 0) * (item.quantity || 0);
  });
  
  return Array.from(supplierMap.values());
};

export default function OrderTracking({ userId }: { userId: string }) {
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING');
  const [selectedGroup, setSelectedGroup] = useState<SupplierGroup | null>(null);
  
  const { loading, error, data, refetch } = useQuery<ActiveOrderResponse>(ACTIVE_ORDER_LIST, {
    variables: { 
      filter: { 
        userId: userId,
        status: selectedStatus
      },
      pagination: { page: 1, pageSize: 50 }
    },
    skip: !userId
  });

  const handleStatusChange = (status: string) => {
    refetch({
      filter: {
        userId: userId,
        status: status
      },
      pagination: { page: 1, pageSize: 50 }
    });
    setSelectedStatus(status);
  };

  // FIX: Check loading first, then error, then empty state
  if (loading) return <ShimmerLoading status={selectedStatus}/>;
  if (error) {
    console.error('GraphQL Error:', error);
    return <ErrorMessage error={error} />;
  }
  
  // Check if there are orders
  const hasOrders = data?.ordered_products?.orders && data?.ordered_products?.orders.length > 0;
  
  // Show empty state only when not loading and no orders
   if (!hasOrders) return <ShimmerLoading status={selectedStatus}/>;

  const orders: Order[] = data?.ordered_products?.orders;
  const currentOrderCount = orders.length;
  
  const allSupplierGroups: SupplierGroup[] = [];
  orders.forEach(order => {
    if (order.items && order.items.length > 0) {
      const groups = groupOrderBySupplier(order);
      allSupplierGroups.push(...groups);
    }
  });

  const currentStatus = ORDER_STAGES.find(s => s.key === selectedStatus);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="text-left mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-purple-700 mb-1">My Orders</h1>
          <p className="text-sm text-gray-500">Track and manage your orders</p>
        </div>

        {/* Status Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max pb-2">
            {ORDER_STAGES.map((stage) => (
              <TabButton
                key={stage.key}
                label={stage.label}
                status={stage.key}
                isActive={selectedStatus === stage.key}
                onClick={() => handleStatusChange(stage.key)}
              />
            ))}
          </div>
        </div>

        {/* Current Status Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-sm px-3 py-1 rounded-full ${currentStatus?.color || 'bg-gray-100 text-gray-700'}`}>
              {currentStatus?.label || selectedStatus}
            </span>
            <span className="text-sm text-gray-500">
              {currentOrderCount} order{currentOrderCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Orders List */}
        {allSupplierGroups.length > 0 ? (
          <div className="space-y-3">
            {allSupplierGroups.map((group, index) => (
              <SupplierOrderCard 
                key={`${group.orderId}-${group.supplierId}-${index}`}
                group={group} 
                onSelect={() => setSelectedGroup(group)}
              />
            ))}
          </div>
        ) : (
          <EmptyState status={selectedStatus} />
        )}

        {/* Order Details Modal */}
        {selectedGroup && (
          <SupplierOrderModal 
            group={selectedGroup} 
            onClose={() => setSelectedGroup(null)} 
          />
        )}
      </div>
    </div>
  );
}

// Tab Button Component
function TabButton({ label, status, isActive, onClick }: { 
  label: string; 
  status: string;
  isActive: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
        isActive
          ? 'bg-purple-600 text-white'
          : 'bg-white text-gray-600 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );
}

// Helper function to get product info from array
const getProductInfo = (productArray: Array<{ name: string; sku: string; images?: string[] }> | undefined) => {
  if (!productArray || productArray.length === 0) {
    return { name: 'Product Unavailable', sku: 'N/A' };
  }
  const firstProduct = productArray[0];
  return {
    name: firstProduct.name || 'Product Unavailable',
    sku: firstProduct.sku || 'N/A'
  };
};

// Supplier Order Card Component
function SupplierOrderCard({ group, onSelect }: { group: SupplierGroup; onSelect: () => void }) {
  const itemStatuses = group.items.map(item => item.status);
  const hasCancelled = itemStatuses.includes('CANCELLED');
  const hasDelivered = itemStatuses.includes('DELIVERED');
  const hasShipped = itemStatuses.includes('SHIPPED');
  
  let displayStatus = 'PROCESSING';
  if (hasDelivered) displayStatus = 'DELIVERED';
  else if (hasShipped) displayStatus = 'SHIPPED';
  else if (hasCancelled) displayStatus = 'CANCELLED';
  
  const stage = ORDER_STAGES.find(s => s.key === displayStatus);
  const { percentage } = getOrderProgress(displayStatus);
  
  const supplierName = group.supplier 
    ? `${group.supplier.firstName || ''} ${group.supplier.lastName || ''}`.trim() || 'Unknown Supplier'
    : 'Unknown Supplier';
  const itemCount = group.items.length;
  
  const hasTrackingNumber = group.items.some(item => item.trackingNumber && item.trackingNumber.trim() !== '');
  const trackingNumber = group.items.find(item => item.trackingNumber && item.trackingNumber.trim() !== '')?.trackingNumber;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-semibold text-gray-900 flex flex-row items-center">
                {hasTrackingNumber && trackingNumber 
                  ? <><QrCode/>{trackingNumber}</>
                  : <><QrCode/>{group.orderNumber || 'N/A'}</>}
              </span>
              <span className="text-xs text-gray-500">•</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${stage?.color || 'bg-gray-100 text-gray-700'}`}>
                {stage?.label || displayStatus}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {group.createdAt 
                ? new Date(group.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                : 'Date not available'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-purple-700">
              {formatPrice(group.subtotal)}
            </div>
            <div className="text-xs text-gray-500">{itemCount} item(s)</div>
          </div>
        </div>

        <div className="mb-3 space-y-1">
          {group.items.slice(0, 2).map((item) => {
            const productInfo = getProductInfo(item.product);
            return (
              <div key={item.id} className="text-sm text-gray-600 flex justify-between">
                <span className="truncate mr-2">
                  {productInfo.name} × {item.quantity || 0}
                </span>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatPrice((item.price || 0) * (item.quantity || 0))}
                </span>
              </div>
            );
          })}
          {group.items.length > 2 && (
            <div className="text-xs text-gray-500">+{group.items.length - 2} more items</div>
          )}
        </div>

        <div className="mb-3">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-purple-600 h-1.5 rounded-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <button
          onClick={onSelect}
          className="w-full py-2 text-center text-sm font-medium text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  );
}

// Supplier Order Modal Component
function SupplierOrderModal({ group, onClose }: { group: SupplierGroup; onClose: () => void }) {
  const itemStatuses = group.items.map(item => item.status);
  const hasCancelled = itemStatuses.includes('CANCELLED');
  const hasDelivered = itemStatuses.includes('DELIVERED');
  const hasShipped = itemStatuses.includes('SHIPPED');
  
  let displayStatus = 'PROCESSING';
  if (hasDelivered) displayStatus = 'DELIVERED';
  else if (hasShipped) displayStatus = 'SHIPPED';
  else if (hasCancelled) displayStatus = 'CANCELLED';
  
  const stage = ORDER_STAGES.find(s => s.key === displayStatus);
  const supplierName = group.supplier 
    ? `${group.supplier.firstName || ''} ${group.supplier.lastName || ''}`.trim() || 'Unknown Supplier'
    : 'Unknown Supplier';
  
  const hasTrackingNumber = group.items.some(item => item.trackingNumber && item.trackingNumber.trim() !== '');
  const trackingNumber = group.items.find(item => item.trackingNumber && item.trackingNumber.trim() !== '')?.trackingNumber;
  
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="flex flex-row text-xl font-bold text-gray-900 items-center">
                {hasTrackingNumber && trackingNumber 
                  ? <><QrCode/>{trackingNumber}</>
                  : <><QrCode/>{group.orderNumber || 'N/A'}</>}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {group.createdAt 
                  ? new Date(group.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })
                  : 'Date not available'}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 text-2xl hover:text-gray-600">
              ×
            </button>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Status</span>
              <span className={`text-sm px-2 py-0.5 rounded-full ${stage?.color || 'bg-gray-100 text-gray-700'}`}>
                {stage?.label || displayStatus}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${((ORDER_STAGES.findIndex(s => s.key === displayStatus) + 1) / ORDER_STAGES.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
            <div className="space-y-3">
              {group.items.map((item) => {
                const productInfo = getProductInfo(item.product);
                return (
                  <div key={item.id} className="flex justify-between items-start border-b border-gray-100 pb-3">
                    <div className="flex-1 pr-4">
                      <div className="font-medium text-gray-900">
                        {productInfo.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        SKU: {productInfo.sku}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Quantity: {item.quantity || 0} × {formatPrice(item.price || 0)}
                      </div>
                      {item.trackingNumber && (
                        <div className="text-xs text-blue-600 mt-1">
                          Tracking: {item.trackingNumber}
                        </div>
                      )}
                    </div>
                    <div className="font-semibold text-gray-900 whitespace-nowrap">
                      {formatPrice((item.price || 0) * (item.quantity || 0))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Subtotal</span>
              <span className="text-xl font-bold text-purple-700">
                {formatPrice(group.subtotal)}
              </span>
            </div>
          </div>

          {group.supplier?.addresses && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-1">Supplier Address</h3>
              <p className="text-sm text-gray-600">
                {group.supplier.addresses.street}<br />
                {group.supplier.addresses.city}, {group.supplier.addresses.state} {group.supplier.addresses.zipCode}<br />
                {group.supplier.addresses.country}
              </p>
            </div>
          )}

          {group.address && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-1">Shipping Address</h3>
              <p className="text-sm text-gray-600">
                {group.address.street}<br />
                {group.address.city}, {group.address.state} {group.address.zipCode}<br />
                {group.address.country}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors">
              Track Order
            </button>
            <button className="flex-1 border border-purple-600 text-purple-600 py-2.5 rounded-lg font-medium text-sm hover:bg-purple-50 transition-colors">
              Contact Supplier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Shimmer Loading Component - Follows UI structure
function ShimmerLoading({ status }: { status: string }) {
  const handleStatusChange = (e:any) =>{
    return
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="text-left mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-purple-700 mb-1">My Orders</h1>
          <p className="text-sm text-gray-500">Track and manage your orders</p>
        </div>
        {/* Status Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max pb-2">
            {ORDER_STAGES.map((stage) => (
              <TabButton
                key={stage.key}
                label={stage.label}
                status={stage.key}
                isActive={status===stage.key}
                onClick={() => handleStatusChange(stage.key)}
              />
            ))}
          </div>
        </div>

        
        {/* Status Header Shimmer */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-20 bg-gray-200 rounded-full shimmer"></div>
            <div className="h-5 w-16 bg-gray-200 rounded shimmer"></div>
          </div>
        </div>

        {/* Order Cards Shimmer */}
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-5 w-32 bg-gray-200 rounded shimmer"></div>
                    <div className="h-5 w-16 bg-gray-200 rounded-full shimmer"></div>
                  </div>
                  <div className="h-4 w-24 bg-gray-200 rounded shimmer"></div>
                </div>
                <div className="text-right">
                  <div className="h-6 w-20 bg-gray-200 rounded shimmer"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded mt-1 shimmer"></div>
                </div>
              </div>

              {/* Items Shimmer */}
              <div className="mb-3 space-y-2">
                <div className="h-5 w-full bg-gray-200 rounded shimmer"></div>
                <div className="h-5 w-3/4 bg-gray-200 rounded shimmer"></div>
              </div>

              {/* Progress Bar Shimmer */}
              <div className="mb-3">
                <div className="w-full h-1.5 bg-gray-200 rounded-full">
                  <div className="w-1/3 h-1.5 bg-gray-300 rounded-full shimmer"></div>
                </div>
              </div>

              {/* Button Shimmer */}
              <div className="h-9 w-full bg-gray-200 rounded-lg shimmer"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Add shimmer animation styles */}
      <style jsx>{`
        .shimmer {
          animation: shimmer 1.5s infinite;
          background: linear-gradient(
            to right,
            #f3f4f6 0%,
            #e5e7eb 50%,
            #f3f4f6 100%
          );
          background-size: 200% 100%;
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
}

// Error Message
function ErrorMessage({ error }: { error: any }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="text-lg font-semibold text-red-600 mb-2">Failed to Load Orders</h2>
        <p className="text-sm text-gray-500 mb-4">{error?.message || 'Please try again later'}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

// Empty State
function EmptyState({ status }: { status: string }) {
  const statusLabel = ORDER_STAGES.find(s => s.key === status)?.label || status;
  return (
    <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
      <div className="text-4xl mb-2">📦</div>
      <p className="text-gray-500">No {statusLabel.toLowerCase()} orders found</p>
    </div>
  );
}
