"use client";
import { Package, Shield, CheckCircle, Clock, XCircle, AlertTriangle, MapPin, Store } from "lucide-react";
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
  status: string; // Each item has its own status: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED
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
  status: string; // Overall order status
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
  items: OrderItem[]; // Each with its own status
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

// Group items by supplier
interface SupplierGroup {
  supplierId: string;
  supplierName: string;
  supplierAddress: string;
  items: OrderItem[];
  totalItems: number;
  subtotal: number;
  status: string; // Overall status for this supplier's items
  itemStatuses: Record<string, number>; // Count of items by status
}

enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export default function ActiveDeliveriesTab({ isMobile }: ActiveDeliveriesTabProps) {
  const { user } = useAuth();
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [processingSupplierId, setProcessingSupplierId] = useState<string | null>(null);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierGroup | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
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

  // Group items by supplier and calculate status
  const groupItemsBySupplier = (items: OrderItem[]): SupplierGroup[] => {
    const groups = new Map<string, SupplierGroup>();
    
    // Define status priority with proper typing
    const statusPriority: Record<string, number> = {
      [OrderStatus.PENDING]: 1,
      [OrderStatus.PROCESSING]: 2,
      [OrderStatus.SHIPPED]: 3,
      [OrderStatus.DELIVERED]: 4,
      [OrderStatus.CANCELLED]: 5,
      [OrderStatus.REFUNDED]: 6
    };
    
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
          totalItems: 0,
          subtotal: 0,
          status: item.status,
          itemStatuses: {
            [OrderStatus.PENDING]: 0,
            [OrderStatus.PROCESSING]: 0,
            [OrderStatus.SHIPPED]: 0,
            [OrderStatus.DELIVERED]: 0,
            [OrderStatus.CANCELLED]: 0,
            [OrderStatus.REFUNDED]: 0
          }
        });
      }
      
      const group = groups.get(supplierId)!;
      group.items.push(item);
      group.totalItems += item.quantity;
      group.subtotal += item.price * item.quantity;
      
      // Count items by status - with proper typing
      if (item.status in group.itemStatuses) {
        group.itemStatuses[item.status] = (group.itemStatuses[item.status] || 0) + 1;
      }
      
      // Determine group status (lowest priority status wins)
      // Priority: PENDING > PROCESSING > SHIPPED > DELIVERED > CANCELLED > REFUNDED
      if (statusPriority[item.status] < statusPriority[group.status]) {
        group.status = item.status;
      }
    });
    
    return Array.from(groups.values());
  };

  // Check if all items from a supplier are in a specific status
  const areAllItemsInStatus = (group: SupplierGroup, status: string): boolean => {
    return group.items.every(item => item.status === status);
  };

  // Check if any items from a supplier are in a specific status
  const areAnyItemsInStatus = (group: SupplierGroup, status: string): boolean => {
    return group.items.some(item => item.status === status);
  };

  // UI handlers
  const handlePickup = (orderId: string, supplierId?: string) => {
    const message = supplierId 
      ? 'Confirm pickup from this supplier?' 
      : 'Confirm pickup from all suppliers?';
    
    if (confirm(message)) {
      setProcessingOrderId(orderId);
      if (supplierId) setProcessingSupplierId(supplierId);
      // TODO: Add mutation to update item status from PROCESSING to SHIPPED
      console.log('Pickup confirmed for:', orderId, 'Supplier:', supplierId || 'all');
      setTimeout(() => {
        setProcessingOrderId(null);
        setProcessingSupplierId(null);
      }, 1000);
    }
  };

  const handleDelivered = (orderId: string, supplierId?: string) => {
    const message = supplierId 
      ? 'Confirm delivery for items from this supplier?' 
      : 'Confirm full order delivered?';
    
    if (confirm(message)) {
      setProcessingOrderId(orderId);
      if (supplierId) setProcessingSupplierId(supplierId);
      // TODO: Add mutation to update item status from SHIPPED to DELIVERED
      console.log('Delivered:', orderId, 'Supplier:', supplierId || 'all');
      setTimeout(() => {
        setProcessingOrderId(null);
        setProcessingSupplierId(null);
      }, 1000);
    }
  };

  const handleFailed = (orderId: string, group?: SupplierGroup) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      if (group) setSelectedSupplier(group);
      setShowFailureModal(true);
    }
  };

  const handleCancel = (orderId: string, supplierId?: string) => {
    const message = supplierId 
      ? 'Cancel items from this supplier?' 
      : 'Cancel entire order?';
    
    if (confirm(message)) {
      setProcessingOrderId(orderId);
      if (supplierId) setProcessingSupplierId(supplierId);
      // TODO: Add mutation to update item status to CANCELLED
      console.log('Cancelled:', orderId, 'Supplier:', supplierId || 'all');
      setTimeout(() => {
        setProcessingOrderId(null);
        setProcessingSupplierId(null);
      }, 1000);
    }
  };

  const handleRefund = (orderId: string, supplierId?: string) => {
    const message = supplierId 
      ? 'Process refund for items from this supplier?' 
      : 'Process refund for entire order?';
    
    if (confirm(message)) {
      setProcessingOrderId(orderId);
      if (supplierId) setProcessingSupplierId(supplierId);
      // TODO: Add mutation to update item status to REFUNDED
      console.log('Refunded:', orderId, 'Supplier:', supplierId || 'all');
      setTimeout(() => {
        setProcessingOrderId(null);
        setProcessingSupplierId(null);
      }, 1000);
    }
  };

  const handleFailureSubmit = (reason: string, notes: string) => {
    if (!selectedOrder) return;
    
    setProcessingOrderId(selectedOrder.id);
    if (selectedSupplier) setProcessingSupplierId(selectedSupplier.supplierId);
    
    // TODO: Add mutation to update item status to CANCELLED or REFUNDED based on reason
    console.log('Failed:', selectedOrder.id, 'Supplier:', selectedSupplier?.supplierId, 'Reason:', reason, 'Notes:', notes);
    
    setTimeout(() => {
      setProcessingOrderId(null);
      setProcessingSupplierId(null);
      setShowFailureModal(false);
      setSelectedOrder(null);
      setSelectedSupplier(null);
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

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case OrderStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.PROCESSING:
        return 'bg-blue-100 text-blue-800';
      case OrderStatus.SHIPPED:
        return 'bg-purple-100 text-purple-800';
      case OrderStatus.DELIVERED:
        return 'bg-green-100 text-green-800';
      case OrderStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      case OrderStatus.REFUNDED:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case OrderStatus.PENDING:
        return Clock;
      case OrderStatus.PROCESSING:
        return Package;
      case OrderStatus.SHIPPED:
        return Package;
      case OrderStatus.DELIVERED:
        return CheckCircle;
      case OrderStatus.CANCELLED:
        return XCircle;
      case OrderStatus.REFUNDED:
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
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
            
            const supplierGroups = groupItemsBySupplier(order.items);
            const hasMultipleSuppliers = supplierGroups.length > 1;
            const isExpanded = expandedOrderId === order.id;

            return (
              <div key={order.id} className="bg-white rounded-lg shadow border-l-4 border-blue-500 overflow-hidden">
                {/* Order Header - Always Visible */}
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
                        Customer: {order.user?.firstName} • Total items: {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                      </p>
                      
                      <div className="mt-1 lg:mt-2 flex flex-wrap items-center gap-1 lg:gap-2">
                        <span className="text-gray-500 text-xs flex items-center gap-0.5">
                          <Clock size={10} />
                          {formatTimeAgo(order.createdAt)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {isExpanded ? '▼' : '▶'} {isExpanded ? 'Hide details' : 'View details'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right ml-2 min-w-[100px]">
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

                {/* Expanded Details - Shows supplier groups with item-level status */}
                {isExpanded && (
                  <div className="px-2 lg:px-4 pb-3 border-t border-gray-100">
                    {/* Supplier Groups */}
                    <div className="space-y-3 mt-3">
                      {supplierGroups.map((group) => {
                        const StatusIcon = getStatusIcon(group.status);
                        
                        return (
                          <div key={group.supplierId} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-start gap-2">
                              <Store size={16} className="text-gray-500 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium text-sm">{group.supplierName}</h4>
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getStatusBadgeClass(group.status)}`}>
                                        <StatusIcon size={10} />
                                        <span>{group.status}</span>
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">{group.supplierAddress}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-sm">{formatPeso(group.subtotal)}</p>
                                    <p className="text-xs text-gray-500">{group.totalItems} items</p>
                                  </div>
                                </div>
                                
                                {/* Items from this supplier with their individual status */}
                                <div className="mt-2 space-y-2">
                                  {group.items.map((item) => {
                                    const ItemStatusIcon = getStatusIcon(item.status);
                                    
                                    return (
                                      <div key={item.id} className="flex justify-between items-center text-xs border-b border-gray-200 last:border-0 pb-1 last:pb-0">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-gray-600">
                                              {item.quantity}x {item.product.name}
                                            </span>
                                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${getStatusBadgeClass(item.status)}`}>
                                              <ItemStatusIcon size={8} />
                                              <span>{item.status}</span>
                                            </span>
                                          </div>
                                        </div>
                                        <span className="text-gray-800 font-medium">
                                          {formatPeso(item.price * item.quantity)}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Supplier-level actions based on item statuses */}
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {/* Show pickup button if any items are PROCESSING */}
                                  {areAnyItemsInStatus(group, OrderStatus.PROCESSING) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePickup(order.id, group.supplierId);
                                      }}
                                      disabled={processingOrderId === order.id && processingSupplierId === group.supplierId}
                                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 px-2 rounded transition-colors flex items-center justify-center gap-1 disabled:bg-gray-400"
                                    >
                                      {processingOrderId === order.id && processingSupplierId === group.supplierId ? (
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                      ) : (
                                        <>
                                          <Package size={12} />
                                          <span>Pickup {group.itemStatuses[OrderStatus.PROCESSING]} item(s)</span>
                                        </>
                                      )}
                                    </button>
                                  )}

                                  {/* Show deliver button if any items are SHIPPED */}
                                  {areAnyItemsInStatus(group, OrderStatus.SHIPPED) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelivered(order.id, group.supplierId);
                                      }}
                                      disabled={processingOrderId === order.id && processingSupplierId === group.supplierId}
                                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-1.5 px-2 rounded transition-colors flex items-center justify-center gap-1 disabled:bg-gray-400"
                                    >
                                      {processingOrderId === order.id && processingSupplierId === group.supplierId ? (
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                      ) : (
                                        <>
                                          <CheckCircle size={12} />
                                          <span>Deliver {group.itemStatuses[OrderStatus.SHIPPED]} item(s)</span>
                                        </>
                                      )}
                                    </button>
                                  )}

                                  {/* Show failed button if any items are in progress */}
                                  {(areAnyItemsInStatus(group, OrderStatus.PROCESSING) || 
                                    areAnyItemsInStatus(group, OrderStatus.SHIPPED)) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleFailed(order.id, group);
                                      }}
                                      disabled={processingOrderId === order.id}
                                      className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium py-1.5 px-2 rounded transition-colors flex items-center justify-center gap-1 disabled:bg-gray-400"
                                    >
                                      <XCircle size={12} />
                                      <span>Report Issue</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Order-level summary */}
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">Order Summary by Status:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.values(OrderStatus).map(status => {
                          const count = order.items.filter(item => item.status === status).length;
                          if (count === 0) return null;
                          const StatusIcon = getStatusIcon(status);
                          
                          return (
                            <span key={status} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(status)}`}>
                              <StatusIcon size={10} />
                              <span>{status}: {count}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Failure Modal */}
      {showFailureModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">
              Report Issue
              {selectedSupplier && ` for ${selectedSupplier.supplierName}`}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Order: {selectedOrder.orderNumber}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason
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
                <option value="SUPPLIER_ISSUE">Supplier issue</option>
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
                  setSelectedSupplier(null);
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
