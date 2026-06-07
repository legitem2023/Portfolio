// components/OrderTracking.tsx

import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { useState } from 'react';
import { QrCode, Star, MapPin, X, RotateCcw, Package, ChevronDown, ChevronUp, Loader2, Phone, User } from "lucide-react";
import { CreateReviewForm } from './CreateReviewForm';
import { useRealtimeLocation } from '../hooks/useRealtimeLocation';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet map to avoid SSR issues
const RiderTrackingMap = dynamic(() => import('./RiderTrackingMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm text-gray-500">Loading map...</p>
      </div>
    </div>
  )
});

// GraphQL Queries and Mutations
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
          riderId
          product {
            name
            sku
            images
            id
          }
          rider {
            id
            firstName
            lastName
            phone
            email
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

const CREATE_RETURN_MUTATION = gql`
  mutation CreateReturn($input: CreateReturnInput!) {
    createReturn(input: $input) {
      id
      returnNumber
      status
      reason
      description
      items {
        id
        quantity
        reason
        condition
      }
      createdAt
    }
  }
`;

// Types
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
    riderId?: string;
    product: Array<{
      name: string;
      sku: string;
      images: string[];
      id?: string;
    }>;
    rider?: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
    };
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
  rider?: Order['items'][0]['rider'];
  riderId?: string;
}

const ORDER_STAGES = [
  { key: 'PENDING', label: 'Placed', color: 'bg-purple-100 text-purple-700' },
  { key: 'PROCESSING', label: 'Processing', color: 'bg-indigo-100 text-indigo-700' },
  { key: 'SHIPPED', label: 'Shipped', color: 'bg-cyan-100 text-cyan-700' },
  { key: 'DELIVERED', label: 'Delivered', color: 'bg-green-100 text-green-700' },
  { key: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
];

const RETURN_REASONS = [
  'Damaged Product',
  'Wrong Item Sent',
  'Missing Parts',
  'Defective Item',
  'Not as Described',
  'Expired Product',
  'Quality Issue',
  'Shipping Damage',
  'Wrong Quantity',
  'Changed Mind'
];

const ITEM_CONDITIONS = [
  'Unopened/Sealed',
  'Opened - Like New',
  'Used - Good Condition',
  'Used - Fair Condition',
  'Damaged',
  'Parts Missing'
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
        payments: order.payments,
        rider: item.rider,
        riderId: item.riderId
      });
    }
    
    const group = supplierMap.get(supplierId)!;
    group.items.push(item);
    group.subtotal += (item.price || 0) * (item.quantity || 0);
    
    // Update rider info if available
    if (item.rider && !group.rider) {
      group.rider = item.rider;
      group.riderId = item.riderId;
    }
  });
  
  return Array.from(supplierMap.values());
};

export default function OrderTracking({ userId }: { userId: string }) {
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING');
  const [selectedGroup, setSelectedGroup] = useState<SupplierGroup | null>(null);
  const [showReviewForm, setShowReviewForm] = useState<{ show: boolean; productId: string; productName: string }>({
    show: false,
    productId: '',
    productName: ''
  });
  const [showReturnModal, setShowReturnModal] = useState<{ show: boolean; order: Order | null; items: Order['items'] }>({
    show: false,
    order: null,
    items: []
  });
  const [showRiderTracking, setShowRiderTracking] = useState<{ 
    show: boolean; 
    riderId: string; 
    orderId: string; 
    deliveryAddress: { lat: number; lng: number; address: string } | null;
    rider?: Order['items'][0]['rider'];
  }>({
    show: false,
    riderId: '',
    orderId: '',
    deliveryAddress: null,
    rider: undefined
  });
  
  // Loading states for buttons
  const [refetchLoading, setRefetchLoading] = useState(false);
  const [createReturnLoading, setCreateReturnLoading] = useState(false);
  
  const { loading, error, data, refetch } = useQuery<{ ordered_products: { orders: Order[] } }>(ACTIVE_ORDER_LIST, {
    variables: { 
      filter: { 
        userId: userId,
        status: selectedStatus
      },
      pagination: { page: 1, pageSize: 50 }
    },
    skip: !userId
  });
  
  const [createReturn] = useMutation(CREATE_RETURN_MUTATION);
  
  const { getCurrentUserLocation } = useRealtimeLocation(userId);

  const handleStatusChange = async (status: string) => {
    setRefetchLoading(true);
    try {
      await refetch({
        filter: {
          userId: userId,
          status: status
        },
        pagination: { page: 1, pageSize: 50 }
      });
      setSelectedStatus(status);
    } finally {
      setRefetchLoading(false);
    }
  };

  const handleWriteReview = (productId: string, productName: string) => {
    setShowReviewForm({ show: true, productId, productName });
  };

  const handleReturnRequest = (order: Order, items: Order['items']) => {
    setShowReturnModal({ show: true, order, items });
  };

  const handleTrackOrder = (riderId: string, orderId: string, deliveryAddress: { lat: number; lng: number; address: string }, rider?: Order['items'][0]['rider']) => {
    setShowRiderTracking({ show: true, riderId, orderId, deliveryAddress, rider });
  };

  const handleSubmitReturn = async (returnData: { reason: string; description: string; items: Array<{ itemId: string; quantity: number; reason: string; condition: string }> }) => {
    setCreateReturnLoading(true);
    try {
      const result = await createReturn({
        variables: {
          input: {
            orderId: showReturnModal.order?.id,
            userId: userId,
            reason: returnData.reason,
            description: returnData.description,
            items: returnData.items
          }
        }
      });
      
      if (result.data?.createReturn) {
        alert('Return request submitted successfully!');
        setShowReturnModal({ show: false, order: null, items: [] });
      }
    } catch (err: any) {
      console.error('Error creating return:', err);
      alert(`Failed to submit return request: ${err.message}`);
    } finally {
      setCreateReturnLoading(false);
    }
  };

  if (loading) return <ShimmerLoading status={selectedStatus}/>;
  if (error) {
    console.error('GraphQL Error:', error);
    return <ErrorMessage error={error} />;
  }

  const hasOrders = data?.ordered_products?.orders && data.ordered_products.orders.length > 0;

  if (!hasOrders) return <EmptyState status={selectedStatus} />;

  const orders: Order[] = data?.ordered_products?.orders || [];
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
        <div className="text-left mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-purple-700 mb-1">My Orders</h1>
          <p className="text-sm text-gray-500">Track and manage your orders</p>
        </div>

        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max pb-2">
            {ORDER_STAGES.map((stage) => (
              <TabButton
                key={stage.key}
                label={stage.label}
                status={stage.key}
                isActive={selectedStatus === stage.key}
                onClick={() => handleStatusChange(stage.key)}
                isLoading={refetchLoading}
              />
            ))}
          </div>
        </div>

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

        {allSupplierGroups.length > 0 ? (
          <div className="space-y-3">
            {allSupplierGroups.map((group, index) => (
              <SupplierOrderCard 
                key={`${group.orderId}-${group.supplierId}-${index}`}
                group={group} 
                onSelect={() => setSelectedGroup(group)}
                onTrackOrder={handleTrackOrder}
                onReturnRequest={() => {
                  const fullOrder = orders.find(o => o.id === group.orderId);
                  if (fullOrder) handleReturnRequest(fullOrder, group.items);
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState status={selectedStatus} />
        )}

        {selectedGroup && (
          <SupplierOrderModal 
            group={selectedGroup} 
            onClose={() => setSelectedGroup(null)}
            onWriteReview={handleWriteReview}
            onTrackOrder={handleTrackOrder}
            onReturnRequest={() => {
              const fullOrder = orders.find(o => o.id === selectedGroup.orderId);
              if (fullOrder) handleReturnRequest(fullOrder, selectedGroup.items);
            }}
          />
        )}

        {showReviewForm.show && (
          <ReviewFormModal
            productId={showReviewForm.productId}
            userId={userId}
            productName={showReviewForm.productName}
            onClose={() => setShowReviewForm({ show: false, productId: '', productName: '' })}
          />
        )}

        {showReturnModal.show && showReturnModal.order && (
          <CreateReturnModal
            order={showReturnModal.order}
            items={showReturnModal.items}
            userId={userId}
            onClose={() => setShowReturnModal({ show: false, order: null, items: [] })}
            onSubmit={handleSubmitReturn}
            isLoading={createReturnLoading}
          />
        )}

        {showRiderTracking.show && showRiderTracking.deliveryAddress && (
          <RiderTrackingModal
            riderId={showRiderTracking.riderId}
            rider={showRiderTracking.rider}
            orderId={showRiderTracking.orderId}
            deliveryAddress={showRiderTracking.deliveryAddress}
            onClose={() => setShowRiderTracking({ show: false, riderId: '', orderId: '', deliveryAddress: null, rider: undefined })}
          />
        )}
      </div>
    </div>
  );
}

// Create Return Modal Component
function CreateReturnModal({ order, items, userId, onClose, onSubmit, isLoading }: { 
  order: Order;
  items: Order['items'];
  userId: string;
  onClose: () => void;
  onSubmit: (data: { reason: string; description: string; items: Array<{ itemId: string; quantity: number; reason: string; condition: string }> }) => void;
  isLoading: boolean;
}) {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [itemDetails, setItemDetails] = useState<Map<string, { quantity: number; reason: string; condition: string }>>(new Map());

  const handleItemSelect = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
      itemDetails.delete(itemId);
    } else {
      newSelected.add(itemId);
      itemDetails.set(itemId, {
        quantity: 1,
        reason: '',
        condition: ''
      });
    }
    setSelectedItems(newSelected);
    setItemDetails(new Map(itemDetails));
  };

  const updateItemDetail = (
    itemId: string,
    field: 'quantity' | 'reason' | 'condition',
    value: any
  ) => {
    const details:any = itemDetails.get(itemId);
    if (details) {
      details[field] = value;
      itemDetails.set(itemId, details);
      setItemDetails(new Map(itemDetails));
    }
  };

  const handleSubmit = () => {
    const returnItems = Array.from(selectedItems).map(itemId => {
      const details = itemDetails.get(itemId)!;
      return {
        itemId,
        quantity: details.quantity,
        reason: details.reason,
        condition: details.condition
      };
    });

    onSubmit({
      reason: selectedReason,
      description,
      items: returnItems
    });
  };

  const isValid = selectedReason && selectedItems.size > 0 &&
    Array.from(selectedItems).every(itemId => {
      const details = itemDetails.get(itemId);
      return details && details.reason && details.condition && details.quantity > 0;
    });

  const totalRefund = Array.from(selectedItems).reduce((sum, itemId) => {
    const item = items.find(i => i.id === itemId);
    const details = itemDetails.get(itemId);
    if (item && details) {
      return sum + (item.price * details.quantity);
    }
    return sum;
  }, 0);

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Request Return</h2>
              <p className="text-sm text-gray-500">Order #{order.orderNumber}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Return Reason *
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select reason...</option>
              {RETURN_REASONS.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Details (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Please provide more details about the issue..."
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Items to Return *
            </label>
            <div className="space-y-3">
              {items.map((item) => {
                const productInfo = getProductInfo(item.product);
                return (
                  <div key={item.id} className="border rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => handleItemSelect(item.id)}
                        className="mt-1"
                      />
                      {productInfo.images?.[0] && (
                        <img 
                          src={productInfo.images[0]}
                          alt={productInfo.name}
                          className="w-12 h-12 object-cover rounded border"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">{productInfo.name}</h4>
                        <p className="text-xs text-gray-500">SKU: {productInfo.sku}</p>
                        <p className="text-sm text-green-600">{formatPrice(item.price)}</p>
                      </div>
                    </div>

                    {selectedItems.has(item.id) && (
                      <div className="mt-3 pl-6 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Quantity to Return *
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={item.quantity}
                            value={itemDetails.get(item.id)?.quantity || 1}
                            onChange={(e) => updateItemDetail(item.id, 'quantity', parseInt(e.target.value))}
                            className="w-24 px-2 py-1 border border-gray-300 rounded"
                          />
                          <span className="text-xs text-gray-500 ml-2">of {item.quantity}</span>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Return Reason *
                          </label>
                          <select
                            value={itemDetails.get(item.id)?.reason || ''}
                            onChange={(e) => updateItemDetail(item.id, 'reason', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select reason...</option>
                            {RETURN_REASONS.map(reason => (
                              <option key={reason} value={reason}>{reason}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Item Condition *
                          </label>
                          <select
                            value={itemDetails.get(item.id)?.condition || ''}
                            onChange={(e) => updateItemDetail(item.id, 'condition', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select condition...</option>
                            {ITEM_CONDITIONS.map(condition => (
                              <option key={condition} value={condition}>{condition}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {totalRefund > 0 && (
            <div className="mb-4 p-3 bg-purple-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Estimated Refund:</span>
                <span className="text-xl font-bold text-purple-700">{formatPrice(totalRefund)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                * Final refund amount will be determined after vendor review
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSubmit}
              disabled={!isValid || isLoading}
              className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              Submit Return Request
            </button>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tab Button Component
function TabButton({ label, status, isActive, onClick, isLoading }: { 
  label: string; 
  status: string;
  isActive: boolean; 
  onClick: () => void;
  isLoading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
        isActive
          ? 'bg-purple-600 text-white'
          : 'bg-white text-gray-600 hover:bg-gray-100'
      } disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2`}
    >
      {isLoading && isActive && <Loader2 size={14} className="animate-spin" />}
      {label}
    </button>
  );
}

const getProductInfo = (productArray: Array<{ name: string; sku: string; images?: string[]; id?: string }> | undefined) => {
  if (!productArray || productArray.length === 0) {
    return { name: 'Product Unavailable', sku: 'N/A', id: '', images: [] };
  }
  const firstProduct = productArray[0];
  return {
    name: firstProduct.name || 'Product Unavailable',
    sku: firstProduct.sku || 'N/A',
    id: firstProduct.id || '',
    images: firstProduct.images || []
  };
};

// Supplier Order Card Component
function SupplierOrderCard({ group, onSelect, onTrackOrder, onReturnRequest }: { 
  group: SupplierGroup; 
  onSelect: () => void;
  onTrackOrder: (riderId: string, orderId: string, deliveryAddress: { lat: number; lng: number; address: string }, rider?: Order['items'][0]['rider']) => void;
  onReturnRequest: () => void;
}) {
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
  
  const itemCount = group.items.length;
  const hasTrackingNumber = group.items.some(item => item.trackingNumber && item.trackingNumber.trim() !== '');
  const trackingNumber = group.items.find(item => item.trackingNumber && item.trackingNumber.trim() !== '')?.trackingNumber;
  const riderId = group.riderId || group.items.find(item => item.riderId)?.riderId;
  const rider = group.rider || group.items.find(item => item.rider)?.rider;
 // console.log(group,group.rider,"<-riderses");
  const deliveryAddress = group.address ? {
    lat: parseFloat(group.address.lat),
    lng: parseFloat(group.address.lng),
    address: `${group.address.street}, ${group.address.city}, ${group.address.state} ${group.address.zipCode}, ${group.address.country}`
  } : null;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-semibold text-gray-900 flex flex-row items-center gap-1">
                <QrCode size={14} />
                {hasTrackingNumber && trackingNumber ? trackingNumber : group.orderNumber || 'N/A'}
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
            {rider && displayStatus === 'SHIPPED' && (
              <div className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                <User size={10} />
                Rider: {rider.firstName} {rider.lastName}
              </div>
            )}
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

        <div className="flex gap-2">
          <button
            onClick={onSelect}
            className="flex-1 py-2 text-center text-sm font-medium text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
          >
            View Details
          </button>
          {displayStatus === 'DELIVERED' && (
            <button
              onClick={onReturnRequest}
              className="py-2 px-3 text-center text-sm font-medium text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-1"
            >
              <RotateCcw size={14} />
              Return
            </button>
          )}
          {riderId && displayStatus === 'SHIPPED' && deliveryAddress && (
            <button
              onClick={() => onTrackOrder(riderId, group.orderId, deliveryAddress, rider)}
              className="py-2 px-3 text-center text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1"
            >
              <MapPin size={14} />
              Track {rider ? rider.firstName : 'Rider'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Supplier Order Modal Component
function SupplierOrderModal({ group, onClose, onWriteReview, onTrackOrder, onReturnRequest }: { 
  group: SupplierGroup; 
  onClose: () => void;
  onWriteReview: (productId: string, productName: string) => void;
  onTrackOrder: (riderId: string, orderId: string, deliveryAddress: { lat: number; lng: number; address: string }, rider?: Order['items'][0]['rider']) => void;
  onReturnRequest: () => void;
}) {
  const VAT_RATE = Number(process.env.NEXT_PUBLIC_VAT) || 0.12;
  
  const shipping = group.items.reduce((total, item) => {
    const shippingAmount = typeof item.individualShipping === 'number' 
      ? item.individualShipping 
      : (item.individualShipping ? Number(item.individualShipping) : 0);
    return total + shippingAmount;
  }, 0);
  
  const vat = group.subtotal * VAT_RATE;
  const grandTotal = group.subtotal + shipping + vat;
  
  const itemStatuses = group.items.map(item => item.status);
  const hasCancelled = itemStatuses.includes('CANCELLED');
  const hasDelivered = itemStatuses.includes('DELIVERED');
  const hasShipped = itemStatuses.includes('SHIPPED');
  
  let displayStatus = 'PROCESSING';
  if (hasDelivered) displayStatus = 'DELIVERED';
  else if (hasShipped) displayStatus = 'SHIPPED';
  else if (hasCancelled) displayStatus = 'CANCELLED';
  
  const stage = ORDER_STAGES.find(s => s.key === displayStatus);
  const hasTrackingNumber = group.items.some(item => item.trackingNumber && item.trackingNumber.trim() !== '');
  const trackingNumber = group.items.find(item => item.trackingNumber && item.trackingNumber.trim() !== '')?.trackingNumber;
  const riderId = group.riderId || group.items.find(item => item.riderId)?.riderId;
  const rider = group.rider || group.items.find(item => item.rider)?.rider;
  const isDelivered = displayStatus === 'DELIVERED';
  const isShipped = displayStatus === 'SHIPPED';

  const deliveryAddress = group.address ? {
    lat: parseFloat(group.address.lat),
    lng: parseFloat(group.address.lng),
    address: `${group.address.street}, ${group.address.city}, ${group.address.state} ${group.address.zipCode}, ${group.address.country}`
  } : null;
   console.log(rider,"riders");
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
              <h2 className="flex flex-row text-xl font-bold text-gray-900 items-center gap-1">
                <QrCode size={18} />
                {hasTrackingNumber && trackingNumber ? trackingNumber : group.orderNumber || 'N/A'}
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

          {/* Rider Information Section */}
          {riderId && isShipped && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <MapPin size={16} className="text-purple-600" />
                Delivery Rider Information
              </h3>
              <div className="bg-purple-50 rounded-lg p-3">
                {rider ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                        <User size={16} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {rider.firstName} {rider.lastName}
                        </p>
                        <p className="text-xs text-gray-600">Rider</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {rider.phone && (
                        <p className="text-xs text-gray-700 flex items-center gap-1">
                          <Phone size={12} className="text-purple-600" />
                          <span className="font-medium">Phone:</span> {rider.phone}
                        </p>
                      )}
                      {rider.email && (
                        <p className="text-xs text-gray-700">
                          <span className="font-medium">Email:</span> {rider.email}
                        </p>
                      )}
                      <p className="text-xs text-gray-700">
                        <span className="font-medium">Rider ID:</span> {riderId.slice(-8)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-700 flex items-center gap-2">
                      <User size={14} className="text-purple-600" />
                      Rider assigned
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Rider ID: {riderId.slice(-8)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
            <div className="space-y-3">
              {group.items.map((item) => {
                const productInfo = getProductInfo(item.product);
                const shippingAmount = typeof item.individualShipping === 'number' 
                  ? item.individualShipping 
                  : (item.individualShipping ? Number(item.individualShipping) : 0);
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
                      {shippingAmount > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Shipping: {formatPrice(shippingAmount)}
                        </div>
                      )}
                      {item.trackingNumber && (
                        <div className="text-xs text-blue-600 mt-1">
                          Tracking: {item.trackingNumber}
                        </div>
                      )}
                      {isDelivered && productInfo.id && (
                        <button
                          onClick={() => onWriteReview(productInfo.id, productInfo.name)}
                          className="mt-2 inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium"
                        >
                          <Star size={12} />
                          Write a Review
                        </button>
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

          <div className="border-t border-gray-200 pt-3 mb-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold text-gray-900">
                {formatPrice(group.subtotal)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Shipping</span>
              <span className="font-semibold text-gray-900">
                {formatPrice(shipping)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">VAT ({Math.round(VAT_RATE * 100)}%)</span>
              <span className="font-semibold text-gray-900">
                {formatPrice(vat)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="font-semibold text-gray-900">Grand Total</span>
              <span className="text-xl font-bold text-purple-700">
                {formatPrice(grandTotal)}
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
            {isDelivered ? (
              <>
                <button
                  onClick={onReturnRequest}
                  className="flex-1 bg-orange-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} />
                  Request Return
                </button>
                <button className="flex-1 border border-purple-600 text-purple-600 py-2.5 rounded-lg font-medium text-sm hover:bg-purple-50 transition-colors">
                  Contact Supplier
                </button>
              </>
            ) : riderId && isShipped && deliveryAddress ? (
              <>
                <button
                  onClick={() => onTrackOrder(riderId, group.orderId, deliveryAddress, rider)}
                  className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  <MapPin size={16} />
                  Track {rider ? rider.firstName : 'Rider'}
                </button>
                <button className="flex-1 border border-purple-600 text-purple-600 py-2.5 rounded-lg font-medium text-sm hover:bg-purple-50 transition-colors">
                  Contact Supplier
                </button>
              </>
            ) : (
              <button className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors">
                Order Processing
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Rider Tracking Modal Component
function RiderTrackingModal({ riderId, rider, orderId, deliveryAddress, onClose }: { 
  riderId: string;
  rider?: Order['items'][0]['rider'];
  orderId: string;
  deliveryAddress: { lat: number; lng: number; address: string };
  onClose: () => void;
}) {
  const { getCurrentUserLocation } = useRealtimeLocation(riderId);
  const riderLocation = getCurrentUserLocation();
  
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Track Your Order</h2>
            <p className="text-xs text-gray-500">Order #{orderId.slice(-8)}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="mb-4 p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {rider ? `${rider.firstName} ${rider.lastName}` : `Rider #${riderId.slice(-8)}`}
                </p>
                {rider?.phone && (
                  <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                    <Phone size={12} className="text-purple-600" />
                    {rider.phone}
                  </p>
                )}
                <p className="text-xs text-gray-500">On Delivery</p>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <RiderTrackingMap 
              riderLocation={riderLocation}
              deliveryLocation={deliveryAddress}
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <p className="font-medium text-gray-900">Rider is on the way</p>
                <p className="text-xs text-gray-500">Tracking live location</p>
              </div>
            </div>
            
            {riderLocation && (
              <div className="flex items-center gap-3">
                <MapPin size={20} className="text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">Current Location</p>
                  <p className="text-xs text-gray-500">
                    Lat: {riderLocation.latitude.toFixed(6)}, Lng: {riderLocation.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <MapPin size={16} className="text-red-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Delivery Location</p>
                <p className="text-xs text-gray-500">{deliveryAddress.address}</p>
              </div>
            </div>

            {rider?.phone && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <button
                  onClick={() => window.location.href = `tel:${rider.phone}`}
                  className="w-full bg-green-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Phone size={16} />
                  Contact Rider
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Review Form Modal Component
function ReviewFormModal({ productId, userId, productName, onClose }: {
  productId: string;
  userId: string;
  productName: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Write a Review</h2>
            <button onClick={onClose} className="text-gray-400 text-2xl hover:text-gray-600">
              ×
            </button>
          </div>
          <div className="mb-4">
            <p className="text-sm text-gray-600">Product: <span className="font-medium">{productName}</span></p>
          </div>
          <CreateReviewForm productId={productId} userId={userId} />
        </div>
      </div>
    </div>
  );
}

// Shimmer Loading Component
function ShimmerLoading({ status }: { status: string }) {
  const handleStatusChange = (e:any) => {
    return
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="text-left mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-purple-700 mb-1">My Orders</h1>
          <p className="text-sm text-gray-500">Track and manage your orders</p>
        </div>
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
        
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-20 bg-gray-200 rounded-full shimmer"></div>
            <div className="h-5 w-16 bg-gray-200 rounded shimmer"></div>
          </div>
        </div>

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
              <div className="mb-3 space-y-2">
                <div className="h-5 w-full bg-gray-200 rounded shimmer"></div>
                <div className="h-5 w-3/4 bg-gray-200 rounded shimmer"></div>
              </div>
              <div className="mb-3">
                <div className="w-full h-1.5 bg-gray-200 rounded-full">
                  <div className="w-1/3 h-1.5 bg-gray-300 rounded-full shimmer"></div>
                </div>
              </div>
              <div className="h-9 w-full bg-gray-200 rounded-lg shimmer"></div>
            </div>
          ))}
        </div>
      </div>

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

function EmptyState({ status }: { status: string }) {
  const statusLabel = ORDER_STAGES.find(s => s.key === status)?.label || status;
  return (
    <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
      <div className="text-4xl mb-2">📦</div>
      <p className="text-gray-500">No {statusLabel.toLowerCase()} orders found</p>
    </div>
  );
        }
