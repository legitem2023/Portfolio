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
  XCircle,
  AlertTriangle
} from "lucide-react";
import { Delivery } from '../lib/types';
import { formatPeso } from '../lib/utils';
import { useMutation } from '@apollo/client';
import { UPDATE_ORDER_STATUS } from '../lib/types';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';

interface ActiveDeliveryCardProps {
  delivery: Delivery;
  isMobile: boolean;
  currentStatus?: string; // Pass the current tab status
  onReset: () => void;
}

enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export default function ActiveDeliveryCard({ delivery, isMobile, currentStatus = 'PROCESSING', onReset }: ActiveDeliveryCardProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCancelReason, setShowCancelReason] = useState(false);
  const [showFailedReason, setShowFailedReason] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [failedReason, setFailedReason] = useState('');
  const [actionType, setActionType] = useState<'pickup' | 'delivered' | 'cancel' | 'failed' | null>(null);

  // Set up the mutation
  const [updateOrderStatus, { loading: mutationLoading }] = useMutation(UPDATE_ORDER_STATUS, {
    onCompleted: (data) => {
      const successMessage = data.updateOrderStatus?.statusText || 'Status updated successfully!';
      setMessage({ type: 'success', text: successMessage });
      
      setTimeout(() => {
        onReset();
        setMessage(null);
        setActionType(null);
      }, 2000);
    },
    onError: (error) => {
      const errorMessage = error.message || 'Failed to update order status';
      setMessage({ type: 'error', text: errorMessage });
      setTimeout(() => {
        setMessage(null);
        setActionType(null);
      }, 5000);
    }
  });

  const isLoading = mutationLoading;

  const handlePickup = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'User not authenticated' });
      return;
    }

    setActionType('pickup');
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
      setActionType(null);
    }
  };

  const handleDelivered = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'User not authenticated' });
      return;
    }

    setActionType('delivered');
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
      setActionType(null);
    }
  };

  const handleFailedDelivery = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'User not authenticated' });
      return;
    }

    if (!failedReason.trim()) {
      setMessage({ type: 'error', text: 'Please provide a reason for failed delivery' });
      return;
    }

    setActionType('failed');
    const supplierItems = delivery.supplierItems || [];
    
    try {
      for (const item of supplierItems) {
        await updateOrderStatus({
          variables: {
            itemId: item.id,
            riderId: user.userId,
            supplierId: item.supplierId,
            userId: delivery.customerId,
            status: OrderStatus.CANCELLED, // or you might have a FAILED_DELIVERY status
            title: "Delivery Failed",
            message: failedReason
          }
        });
      }
      setShowFailedReason(false);
      setFailedReason('');
    } catch (error) {
      console.error('Error marking delivery as failed:', error);
      setActionType(null);
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

    setActionType('cancel');
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
      setActionType(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-indigo-200 overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-50 px-3 lg:px-4 py-2 lg:py-3 border-b border-orange-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1 lg:gap-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
            <span className="font-bold text-indigo-700 text-xs lg:text-sm">Active Order</span>
            {delivery.isPartialDelivery && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">
                Piece {delivery.supplierIndex} of {delivery.totalSuppliersInOrder}
              </span>
            )}
          </div>
          {/* Status Badge */}
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            currentStatus === 'PROCESSING' ? 'bg-orange-100 text-orange-700' :
            currentStatus === 'SHIPPED' ? 'bg-blue-100 text-blue-700' :
            currentStatus === 'DELIVERED' ? 'bg-green-100 text-green-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {currentStatus === 'PROCESSING' && 'Ready for Pickup'}
            {currentStatus === 'SHIPPED' && 'On Delivery'}
            {currentStatus === 'DELIVERED' && 'Delivered'}
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
                {isLoading && actionType === 'cancel' ? 'Processing...' : 'Confirm Cancel'}
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

        {/* Failed Delivery Modal */}
        {showFailedReason && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-sm mb-2">Report Failed Delivery</h4>
            <textarea
              value={failedReason}
              onChange={(e) => setFailedReason(e.target.value)}
              placeholder="Please provide a reason for failed delivery (e.g., customer not available, wrong address, etc.)..."
              className="w-full p-2 border border-gray-300 rounded-lg text-sm mb-2"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleFailedDelivery}
                disabled={isLoading || !failedReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-semibold text-sm disabled:opacity-50"
              >
                {isLoading && actionType === 'failed' ? 'Processing...' : 'Confirm Failed Delivery'}
              </button>
              <button
                onClick={() => {
                  setShowFailedReason(false);
                  setFailedReason('');
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg font-semibold text-sm"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Action buttons - based on current status */}
        <div className="grid grid-cols-2 gap-2 lg:gap-4">
          {currentStatus === 'PROCESSING' && (
            <>
              <button
                onClick={handlePickup}
                disabled={isLoading || !!message}
                className={`
                  px-3 lg:px-4 py-2 lg:py-3 rounded-lg font-semibold 
                  transition flex items-center justify-center gap-1 lg:gap-2 
                  text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed
                  ${isLoading && actionType === 'pickup'
                    ? 'bg-yellow-500 text-white cursor-wait' 
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                  }
                `}
              >
                <Grab size={isMobile ? 18 : 20} className={isLoading && actionType === 'pickup' ? 'animate-bounce' : ''} />
                <span>
                  {isLoading && actionType === 'pickup' ? 'Processing...' : 'Mark as Picked Up'}
                </span>
              </button>
              <button
                onClick={() => setShowCancelReason(true)}
                disabled={isLoading}
                className="bg-white border border-red-300 text-red-600 px-3 lg:px-4 py-2 lg:py-3 rounded-lg font-semibold hover:bg-red-50 transition flex items-center justify-center gap-1 lg:gap-2 text-sm lg:text-base disabled:opacity-50"
              >
                <XCircle size={isMobile ? 18 : 20} />
                <span>Cancel Order</span>
              </button>
            </>
          )}

          {currentStatus === 'SHIPPED' && (
            <>
              <button
                onClick={handleDelivered}
                disabled={isLoading || !!message}
                className={`
                  flex-1 px-3 lg:px-4 py-2 lg:py-3 rounded-lg font-semibold 
                  transition flex items-center justify-center gap-1 lg:gap-2 
                  text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed
                  ${isLoading && actionType === 'delivered'
                    ? 'bg-yellow-500 text-white cursor-wait' 
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                  }
                `}
              >
                <Home size={isMobile ? 18 : 20} className={isLoading && actionType === 'delivered' ? 'animate-bounce' : ''} />
                <span>
                  {isLoading && actionType === 'delivered' ? 'Processing...' : 'Mark as Delivered'}
                </span>
              </button>
              <button
                onClick={() => setShowFailedReason(true)}
                disabled={isLoading}
                className="flex-1 bg-white border border-red-300 text-red-600 px-3 lg:px-4 py-2 lg:py-3 rounded-lg font-semibold hover:bg-red-50 transition flex items-center justify-center gap-1 lg:gap-2 text-sm lg:text-base disabled:opacity-50"
              >
                <AlertTriangle size={isMobile ? 18 : 20} />
                <span>Delivery Failed</span>
              </button>
            </>
          )}

          {currentStatus === 'DELIVERED' && (
            <div className="col-span-2 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <CheckCircle size={isMobile ? 20 : 24} />
                <span className="font-semibold">Order Delivered Successfully</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  }
