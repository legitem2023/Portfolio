"use client";
import { 
  Package, 
  MapPin, 
  Building, 
  User, 
  Shield, 
  Clock, 
  Navigation,
  Grab,
  CheckCircle,
  AlertCircle,
  Truck,
  Home,
  XCircle
} from "lucide-react";
import { Delivery } from '../lib/types';
import { formatPeso } from '../lib/utils';
import { useMutation } from '@apollo/client';
import { UPDATE_ORDER_STATUS } from '../lib/types';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';

interface ActiveDeliveryCardProps {
  delivery: Delivery & { status?: string };
  isMobile: boolean;
  onPickup?: () => void;
  onDelivered?: () => void;
  onCancel?: () => void;
  isUpdating?: boolean;
  onReset: () => void;
}

// OrderStatus enum matching your backend
enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export default function ActiveDeliveryCard({ 
  delivery, 
  isMobile, 
  onPickup, 
  onDelivered, 
  onCancel,
  isUpdating = false,
  onReset 
}: ActiveDeliveryCardProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCancelReason, setShowCancelReason] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Set up the mutation
  const [updateOrderStatus, { loading: mutationLoading }] = useMutation(UPDATE_ORDER_STATUS, {
    onCompleted: (data) => {
      const successMessage = data.updateOrderStatus?.statusText || 'Status updated successfully!';
      setMessage({ type: 'success', text: successMessage });
      
      setTimeout(() => {
        onReset();
        setMessage(null);
      }, 2000);
    },
    onError: (error) => {
      const errorMessage = error.message || 'Failed to update order status';
      setMessage({ type: 'error', text: errorMessage });
      setTimeout(() => setMessage(null), 5000);
    }
  });

  const isLoading = mutationLoading || isUpdating;

  const handlePickup = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'User not authenticated' });
      return;
    }

    if (!delivery.orderParentId) {
      setMessage({ type: 'error', text: 'Order ID is missing' });
      return;
    }

    if (onPickup) {
      onPickup();
    } else {
      // Fallback to direct mutation if onPickup not provided
      const supplierItems = delivery.supplierItems || [];
      
      try {
        for (const item of supplierItems) {
          await updateOrderStatus({
            variables: {
              itemId: item.id,
              riderId: user.userId,
              supplierId: item.supplierId,
              userId: delivery.customerId,
              status: OrderStatus.SHIPPED,
              title: "Order On The Way",
              message: "Your order has been picked up and is on the way!"
            }
          });
        }
      } catch (error) {
        console.error('Error updating order status:', error);
      }
    }
  };

  const handleDelivered = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'User not authenticated' });
      return;
    }

    if (onDelivered) {
      onDelivered();
    } else {
      const supplierItems = delivery.supplierItems || [];
      
      try {
        for (const item of supplierItems) {
          await updateOrderStatus({
            variables: {
              itemId: item.id,
              riderId: user.userId,
              supplierId: item.supplierId,
              userId: delivery.customerId,
              status: OrderStatus.DELIVERED,
              title: "Order Delivered",
              message: "Your order has been successfully delivered!"
            }
          });
        }
      } catch (error) {
        console.error('Error updating order status:', error);
      }
    }
  };

  const handleCancel = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'User not authenticated' });
      return;
    }

    if (!cancelReason.trim()) {
      setMessage({ type: 'error', text: 'Please provide a reason for cancellation' });
      return;
    }

    if (onCancel) {
      onCancel();
    } else {
      const supplierItems = delivery.supplierItems || [];
      
      try {
        for (const item of supplierItems) {
          await updateOrderStatus({
            variables: {
              itemId: item.id,
              riderId: user.userId,
              supplierId: item.supplierId,
              userId: delivery.customerId,
              status: OrderStatus.CANCELLED,
              title: "Order Cancelled",
              message: cancelReason
            }
          });
        }
        setShowCancelReason(false);
        setCancelReason('');
      } catch (error) {
        console.error('Error cancelling order:', error);
      }
    }
  };

  // Determine which actions to show based on status
  const getActionButtons = () => {
    const status = delivery.status || OrderStatus.PROCESSING;

    switch (status) {
      case OrderStatus.PROCESSING:
        return (
          <>
            <button
              onClick={handlePickup}
              disabled={isLoading || !!message}
              className={`
                flex-1 px-3 lg:px-4 py-2 lg:py-3 rounded-lg font-semibold 
                transition flex items-center justify-center gap-1 lg:gap-2 
                text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed
                ${isLoading 
                  ? 'bg-yellow-500 text-white cursor-wait' 
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                }
              `}
            >
              <Grab size={isMobile ? 18 : 20} className={isLoading ? 'animate-bounce' : ''} />
              <span>{isLoading ? 'Processing...' : 'Mark as Picked Up'}</span>
            </button>
            <button
              onClick={() => setShowCancelReason(true)}
              disabled={isLoading}
              className="flex-1 bg-white border border-red-300 text-red-600 px-3 lg:px-4 py-2 lg:py-3 rounded-lg font-semibold hover:bg-red-50 transition flex items-center justify-center gap-1 lg:gap-2 text-sm lg:text-base disabled:opacity-50"
            >
              <XCircle size={isMobile ? 18 : 20} />
              <span>Cancel Order</span>
            </button>
          </>
        );

      case OrderStatus.SHIPPED:
        return (
          <>
            <button
              onClick={handleDelivered}
              disabled={isLoading || !!message}
              className={`
                flex-1 px-3 lg:px-4 py-2 lg:py-3 rounded-lg font-semibold 
                transition flex items-center justify-center gap-1 lg:gap-2 
                text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed
                ${isLoading 
                  ? 'bg-yellow-500 text-white cursor-wait' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                }
              `}
            >
              <Home size={isMobile ? 18 : 20} className={isLoading ? 'animate-bounce' : ''} />
              <span>{isLoading ? 'Processing...' : 'Mark as Delivered'}</span>
            </button>
            <button
              onClick={() => setShowCancelReason(true)}
              disabled={isLoading}
              className="flex-1 bg-white border border-red-300 text-red-600 px-3 lg:px-4 py-2 lg:py-3 rounded-lg font-semibold hover:bg-red-50 transition flex items-center justify-center gap-1 lg:gap-2 text-sm lg:text-base disabled:opacity-50"
            >
              <XCircle size={isMobile ? 18 : 20} />
              <span>Report Issue</span>
            </button>
          </>
        );

      case OrderStatus.DELIVERED:
        return (
          <div className="col-span-2 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <CheckCircle size={isMobile ? 20 : 24} />
              <span className="font-semibold">Order Delivered Successfully</span>
            </div>
          </div>
        );

      case OrderStatus.CANCELLED:
        return (
          <div className="col-span-2 bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-red-700">
              <XCircle size={isMobile ? 20 : 24} />
              <span className="font-semibold">Order Cancelled</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Get status badge color
  const getStatusBadge = () => {
    const status = delivery.status || OrderStatus.PROCESSING;
    
    switch (status) {
      case OrderStatus.PROCESSING:
        return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Ready for Pickup' };
      case OrderStatus.SHIPPED:
        return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'On Delivery' };
      case OrderStatus.DELIVERED:
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Delivered' };
      case OrderStatus.CANCELLED:
        return { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="bg-white rounded-lg shadow-lg border border-indigo-200 overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-50 px-3 lg:px-4 py-2 lg:py-3 border-b border-orange-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1 lg:gap-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
            <span className="font-bold text-indigo-700 text-xs lg:text-sm">
              {delivery.status === OrderStatus.SHIPPED ? 'On Delivery' : 'Active Order'}
            </span>
            {delivery.isPartialDelivery && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">
                Piece {delivery.supplierIndex} of {delivery.totalSuppliersInOrder}
              </span>
            )}
          </div>
          {/* Status Badge */}
          <span className={`${statusBadge.bg} ${statusBadge.text} text-xs px-2 py-1 rounded-full font-medium`}>
            {statusBadge.label}
          </span>
        </div>
      </div>

      <div className="p-2 lg:p-6">
        {/* Order info */}
        <div className="flex justify-between items-start mb-3 lg:mb-4">
          <div>
            <div className="flex items-center gap-1 lg:gap-2 mb-1 lg:mb-2">
              <Shield size={isMobile ? 16 : 18} className="text-blue-500" />
              <div>
                <h3 className="font-bold text-base lg:text-xl">{delivery.orderId}</h3>
                {delivery.isPartialDelivery && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Partial delivery - This order has items from {delivery.totalSuppliersInOrder} different suppliers
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 lg:gap-2 text-gray-600 mb-0.5 lg:mb-1">
              <Building size={isMobile ? 14 : 16} className="text-blue-400" />
              <span className="font-medium text-sm lg:text-base">{delivery.restaurant}</span>
            </div>
            <div className="flex items-center gap-1 lg:gap-2 text-gray-600">
              <User size={isMobile ? 14 : 16} />
              <span className="text-sm lg:text-base">{delivery.customer}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl lg:text-3xl font-bold text-green-600">{delivery.payout}</div>
            <p className="text-gray-500 text-xs lg:text-sm">Payout for this piece</p>
            {delivery.subtotal && (
              <p className="text-xs text-gray-400 mt-0.5">Subtotal: {delivery.subtotal}</p>
            )}
          </div>
        </div>

        {/* Item details */}
        <div className="mb-3 lg:mb-4 bg-gray-50 p-2 lg:p-3 rounded-lg">
          <h4 className="font-semibold text-sm lg:text-base mb-1 lg:mb-2 flex items-center gap-1 lg:gap-2">
            <Package size={isMobile ? 14 : 16} />
            Items from this supplier ({delivery.items} item{delivery.items !== 1 ? "s" : ""})
          </h4>
          <div className="space-y-1 lg:space-y-2">
            {delivery.supplierItems?.map((item) => (
              <div key={item.id} className="flex justify-between text-xs lg:text-sm">
                <div>
                  <span className="font-medium">{item.product.name}</span>
                  <span className="text-gray-600 ml-1">(Qty: {item.quantity})</span>
                </div>
                <div className="text-gray-700">{formatPeso(item.price * item.quantity)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Route info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-4 mb-4 lg:mb-6">
          <div className="bg-blue-50 p-2 lg:p-3 rounded-lg">
            <div className="flex items-center gap-1 lg:gap-2 mb-1 lg:mb-2">
              <MapPin size={isMobile ? 14 : 16} className="text-blue-500" />
              <span className="font-semibold text-xs lg:text-sm">Pickup From</span>
            </div>
            <p className="text-gray-700 text-xs lg:text-sm">{delivery.pickup}</p>
            {delivery.supplierName && (
              <div className="mt-1 lg:mt-2 text-xs text-gray-500">
                <div className="flex items-center gap-0.5 lg:gap-1">
                  <Building size={isMobile ? 8 : 10} />
                  <span className="text-xs">{delivery.supplierName}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-center">
            <div className="w-full border-t-2 border-dashed border-gray-300 relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-1 lg:px-2">
                <div className="flex items-center gap-0.5 lg:gap-1 text-gray-500">
                  <Navigation size={isMobile ? 12 : 14} />
                  <span className="text-xs lg:text-sm font-medium">{delivery.distance}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-2 lg:p-3 rounded-lg">
            <div className="flex items-center gap-1 lg:gap-2 mb-1 lg:mb-2">
              <MapPin size={isMobile ? 14 : 16} className="text-green-500" />
              <span className="font-semibold text-xs lg:text-sm">Deliver To</span>
            </div>
            <p className="text-gray-700 text-xs lg:text-sm">{delivery.dropoff}</p>
            {delivery.dropoffAddress && (
              <div className="mt-1 lg:mt-2 text-xs text-gray-500">
                <div className="flex items-center gap-0.5 lg:gap-1">
                  <User size={isMobile ? 8 : 10} />
                  <span className="text-xs">{delivery.customer}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional info */}
        <div className="flex flex-wrap gap-2 lg:gap-4 mb-4 lg:mb-6">
          <div className="flex items-center gap-1 lg:gap-2 bg-gray-50 px-2 lg:px-3 py-1 lg:py-2 rounded-lg">
            <Package size={isMobile ? 14 : 16} className="text-gray-600" />
            <span className="text-xs lg:text-sm font-medium">{delivery.items} item{delivery.items !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-1 lg:gap-2 bg-gray-50 px-2 lg:px-3 py-1 lg:py-2 rounded-lg">
            <Navigation size={isMobile ? 14 : 16} className="text-gray-600" />
            <span className="text-xs lg:text-sm font-medium">{delivery.distance}</span>
          </div>
          <div className="flex items-center gap-1 lg:gap-2 bg-gray-50 px-2 lg:px-3 py-1 lg:py-2 rounded-lg">
            <Clock size={isMobile ? 14 : 16} className="text-gray-600" />
            <span className="text-xs lg:text-sm font-medium">~15-20 min</span>
          </div>
        </div>

        {/* Status/Error Messages */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <p className={`text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Cancel Reason Modal */}
        {showCancelReason && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-sm mb-2">Cancel Order</h4>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please provide a reason for cancellation..."
              className="w-full p-2 border border-gray-300 rounded-lg text-sm mb-2"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={isLoading || !cancelReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-semibold text-sm disabled:opacity-50"
              >
                Confirm Cancel
              </button>
              <button
                onClick={() => {
                  setShowCancelReason(false);
                  setCancelReason('');
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg font-semibold text-sm"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 lg:gap-4">
          {getActionButtons()}
        </div>
      </div>
    </div>
  );
}
