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
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Phone
} from "lucide-react";
import { Delivery } from '../lib/types';
import { formatPeso } from '../lib/utils';
import { useMutation } from '@apollo/client';
import { UPDATE_ORDER_STATUS } from '../lib/types';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import DeliveryMap from './DeliveryMap';

interface ActiveDeliveryCardProps {
  delivery: Delivery;
  isMobile: boolean;
  currentStatus?: string;
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
  const [showMap, setShowMap] = useState(false);
  const [showItems, setShowItems] = useState(false);

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
            status: OrderStatus.CANCELLED,
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

  const toggleItems = () => {
    setShowItems(!showItems);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-indigo-200 overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-orange-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse"></div>
              <span className="font-bold text-indigo-700 text-sm sm:text-base">Active Order</span>
              {delivery.isPartialDelivery && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
                  Piece {delivery.supplierIndex} of {delivery.totalSuppliersInOrder}
                </span>
              )}
            </div>
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap ${
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

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Order info */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
            <div className="w-full sm:w-auto">
              <div className="flex items-start gap-2 mb-2">
                <Shield size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-lg sm:text-xl break-all">{delivery.orderId}</h3>
                  {delivery.isPartialDelivery && (
                    <p className="text-xs text-gray-500 mt-1">
                      Partial delivery - Items from {delivery.totalSuppliersInOrder} suppliers
                    </p>
                  )}
                </div>
              </div>
              {/* <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Building size={14} className="text-blue-400 flex-shrink-0" />
                  <span className="text-sm sm:text-base break-words">{delivery.restaurant}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-blue-400 flex-shrink-0" />
                  <span className="text-sm sm:text-base">{delivery.supplierContact}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={14} className="text-gray-500 flex-shrink-0" />
                  <span className="text-sm sm:text-base break-words">{delivery.customer}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-gray-500 flex-shrink-0" />
                  <span className="text-sm sm:text-base">{delivery.customerContact}</span>
                </div>
              </div>*/}
            </div>
            <div className="w-full sm:w-auto text-left sm:text-right bg-green-50 p-3 sm:p-4 rounded-xl sm:bg-transparent">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 break-words">{delivery.payout}</div>
              <p className="text-gray-500 text-xs sm:text-sm">Payout for this piece</p>
              {delivery.subtotal && (
                <p className="text-xs text-gray-400 mt-1">Subtotal: {delivery.subtotal}</p>
              )}
            </div>
          </div>

          {/* Collapsible Item details */}
          <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
            <button
              onClick={toggleItems}
              className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <h4 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                <Package size={16} />
                {delivery.items} item{delivery.items !== 1 ? "s" : ""}
              </h4>
              <div className="flex items-center gap-3">
                <span className="text-xs sm:text-sm text-gray-500">
                  Total: {formatPeso(delivery.supplierItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0)}
                </span>
                {showItems ? (
                  <ChevronUp size={18} className="text-gray-500" />
                ) : (
                  <ChevronDown size={18} className="text-gray-500" />
                )}
              </div>
            </button>

            {showItems && (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4 border-t border-gray-200 pt-3 sm:pt-4">
                {delivery.supplierItems?.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row gap-3 sm:gap-4 bg-white rounded-xl p-3 sm:p-4 shadow-sm">
                    {item.product[0]?.images && item.product[0].images.length > 0 && (
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 mx-auto sm:mx-0">
                        <img 
                          src={item.product[0].images[0]} 
                          alt={item.product[0].name}
                          className="w-full h-full object-cover rounded-lg border border-gray-200"
                        />
                        {item.product[0].images.length > 1 && (
                          <span className="absolute -top-2 -right-2 bg-gray-800 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                            {item.product[0].images.length}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded text-gray-700">
                              {item.product[0]?.sku}
                            </span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              Qty: {item.quantity}
                            </span>
                          </div>
                          <h4 className="text-sm sm:text-base font-medium text-gray-900 break-words">
                            {item.product[0]?.name}
                          </h4>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="text-base sm:text-lg font-bold text-gray-900 whitespace-nowrap">
                            {formatPeso(item.price * item.quantity)}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            @ {formatPeso(item.price)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-100 rounded-xl p-4 sm:p-5 mt-3 sm:mt-4">
                  <span className="text-sm sm:text-base font-medium text-gray-600">Subtotal</span>
                  <div className="w-full sm:w-auto">
                    <span className="text-xl sm:text-2xl font-bold text-green-600 break-words">
                      {formatPeso(delivery.supplierItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0)}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-500 ml-2">
                      ({delivery.supplierItems?.length} {delivery.supplierItems?.length === 1 ? 'item' : 'items'})
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Route info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-blue-50 p-3 sm:p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-blue-500" />
                  <span className="font-semibold text-xs sm:text-sm">Pickup From</span>
                </div>
                <button
                  onClick={() => setShowMap(true)}
                  className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 bg-blue-100 px-2 py-1.5 rounded-full transition-colors"
                >
                  <Navigation size={12} />
                  <span>Route</span>
                </button>
              </div>
              <p className="text-gray-700 text-xs sm:text-sm break-words">{delivery.pickup}</p>
              {delivery.supplierName && (  
                <div className="mt-2 text-xs text-gray-500 space-y-1">
                  <div className="flex items-center gap-1">
                    <Building size={10} />
                    <span className="truncate">{delivery.supplierName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone size={10} />
                    <span>{delivery.supplierContact}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-center py-2 sm:py-0">
              <div className="w-full border-t-2 border-dashed border-gray-300 relative">
                <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Navigation size={12} />
                    <span className="text-xs font-medium whitespace-nowrap">{delivery.distance}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-3 sm:p-4 rounded-xl">
              <div className="flex items-center gap-1.5 mb-2">
                <MapPin size={16} className="text-green-500" />
                <span className="font-semibold text-xs sm:text-sm">Deliver To</span>
              </div>
              <p className="text-gray-700 text-xs sm:text-sm break-words">{delivery.dropoff}</p>
              {delivery.dropoffAddress && (
                <div className="mt-2 text-xs text-gray-500 space-y-1">
                  <div className="flex items-center gap-1">
                    <User size={10} />
                    <span className="truncate">{delivery.customer}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone size={10} />
                    <span>{delivery.customerContact}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional info */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-lg">
              <Package size={14} className="text-gray-600" />
              <span className="text-xs font-medium whitespace-nowrap">{delivery.items} item{delivery.items !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-lg">
              <Navigation size={14} className="text-gray-600" />
              <span className="text-xs font-medium whitespace-nowrap">{delivery.distance}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-lg">
              <Clock size={14} className="text-gray-600" />
              <span className="text-xs font-medium whitespace-nowrap">~15-20 min</span>
            </div>
          </div>

          {/* Status/Error Messages */}
          {message && (
            <div className={`p-3 sm:p-4 rounded-xl flex items-start gap-3 ${
              message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <p className={`text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-700'} break-words`}>
                {message.text}
              </p>
            </div>
          )}

          {/* Cancel Reason Modal */}
          {showCancelReason && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <h4 className="font-semibold text-sm">Cancel Order</h4>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancellation..."
                className="w-full p-3 border border-gray-300 rounded-lg text-sm min-h-[80px]"
                rows={3}
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleCancel}
                  disabled={isLoading || !cancelReason.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold text-sm disabled:opacity-50"
                >
                  {isLoading && actionType === 'cancel' ? 'Processing...' : 'Confirm Cancel'}
                </button>
                <button
                  onClick={() => {
                    setShowCancelReason(false);
                    setCancelReason('');
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-3 rounded-lg font-semibold text-sm"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Failed Delivery Modal */}
          {showFailedReason && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <h4 className="font-semibold text-sm">Report Failed Delivery</h4>
              <textarea
                value={failedReason}
                onChange={(e) => setFailedReason(e.target.value)}
                placeholder="Please provide a reason for failed delivery..."
                className="w-full p-3 border border-gray-300 rounded-lg text-sm min-h-[80px]"
                rows={3}
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleFailedDelivery}
                  disabled={isLoading || !failedReason.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold text-sm disabled:opacity-50"
                >
                  {isLoading && actionType === 'failed' ? 'Processing...' : 'Confirm Failed Delivery'}
                </button>
                <button
                  onClick={() => {
                    setShowFailedReason(false);
                    setFailedReason('');
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-3 rounded-lg font-semibold text-sm"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentStatus === 'PROCESSING' && (
              <>
                <button
                  onClick={handlePickup}
                  disabled={isLoading || !!message}
                  className={`
                    w-full px-4 py-3 sm:py-4 rounded-xl font-semibold 
                    transition flex items-center justify-center gap-2 
                    text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed
                    ${isLoading && actionType === 'pickup'
                      ? 'bg-yellow-500 text-white cursor-wait' 
                      : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                    }
                  `}
                >
                  <Grab size={18} className={isLoading && actionType === 'pickup' ? 'animate-bounce' : ''} />
                  <span>
                    {isLoading && actionType === 'pickup' ? 'Processing...' : 'Mark as Picked Up'}
                  </span>
                </button>
                <button
                  onClick={() => setShowCancelReason(true)}
                  disabled={isLoading}
                  className="w-full bg-white border border-red-300 text-red-600 px-4 py-3 sm:py-4 rounded-xl font-semibold hover:bg-red-50 transition flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50"
                >
                  <XCircle size={18} />
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
                    w-full px-4 py-3 sm:py-4 rounded-xl font-semibold 
                    transition flex items-center justify-center gap-2 
                    text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed
                    ${isLoading && actionType === 'delivered'
                      ? 'bg-yellow-500 text-white cursor-wait' 
                      : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                    }
                  `}
                >
                  <Home size={18} className={isLoading && actionType === 'delivered' ? 'animate-bounce' : ''} />
                  <span>
                    {isLoading && actionType === 'delivered' ? 'Processing...' : 'Mark as Delivered'}
                  </span>
                </button>
                <button
                  onClick={() => setShowFailedReason(true)}
                  disabled={isLoading}
                  className="w-full bg-white border border-red-300 text-red-600 px-4 py-3 sm:py-4 rounded-xl font-semibold hover:bg-red-50 transition flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50"
                >
                  <AlertTriangle size={18} />
                  <span>Delivery Failed</span>
                </button>
              </>
            )}

            {currentStatus === 'DELIVERED' && (
              <div className="col-span-1 sm:col-span-2 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <CheckCircle size={20} />
                  <span className="font-semibold">Order Delivered Successfully</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map Modal */}
      {showMap && (
        <DeliveryMap
          pickupAddress={delivery.pickup}
          dropoffAddress={delivery.dropoff}
          status={currentStatus as 'PROCESSING' | 'SHIPPED' | 'DELIVERED'}
          isMobile={isMobile}
          onClose={() => setShowMap(false)}
          restaurant={delivery.restaurant}
          customer={delivery.customer}
        />
      )}
    </>
  );
                  }
