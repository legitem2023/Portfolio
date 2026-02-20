"use client";
import { 
  Package, 
  MapPin, 
  Building, 
  User, 
  Shield, 
  Clock, 
  Navigation,
  ThumbsUp,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Delivery } from '../lib/types';
import { formatPeso } from '../lib/utils';
import { useMutation } from '@apollo/client';
import { ACCEPT_BY_RIDER, REJECT_BY_RIDER_MUTATION } from '../lib/types';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';

interface DeliveryCardProps {
  delivery: Delivery;
  isMobile: boolean;
  onAccept: (deliveryId: string) => void;
  onReject: (deliveryId: string) => void;
}

export default function DeliveryCard({ delivery, isMobile, onAccept, onReject }: DeliveryCardProps) {
  const { user } = useAuth();
  const [showItems, setShowItems] = useState(false);
  
  const [acceptDelivery, { loading: acceptLoading, error: acceptError }] = useMutation(ACCEPT_BY_RIDER);
  const [rejectDelivery, { loading: rejectLoading, error: rejectError }] = useMutation(REJECT_BY_RIDER_MUTATION);

  const handleAccept = async () => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    const itemId = delivery.orderParentId;
    const supplierId = delivery.supplierItems?.[0]?.supplierId;
    const riderId = user.userId;
    const userId = delivery.customerId;
    
    if (!itemId || !supplierId) {
      console.error('Missing itemId or supplierId', { itemId, supplierId });
      return;
    }

    try {
      const { data } = await acceptDelivery({
        variables: {
          itemId: itemId,
          riderId: riderId,
          supplierId: supplierId,
          userId: userId,
        }
      });

      if (data?.acceptByRider?.statusText === 'Successfully Accepted!') {
        onAccept(delivery.id);
      }
    } catch (error) {
      console.error('Error accepting delivery:', error);
    }
  };

  const handleReject = async () => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    const supplierItems = delivery.supplierItems || [];
    const riderId = user.userId;
    
    if (!supplierItems.length) {
      console.error('No supplier items found');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to reject this delivery?'
    );
    
    if (!confirmed) return;

    try {
      for (const item of supplierItems) {
        const itemId = item.id;
        
        if (!itemId) {
          console.warn('Skipping item with missing ID');
          continue;
        }

        console.log(`Processing rejection for item: ${itemId}`);
        
        const { data } = await rejectDelivery({
          variables: {
            itemId: itemId,
            riderId: riderId,
          }
        });

        if (data?.rejectByRider?.statusText) {
          console.log(`Rejection status for item ${itemId}:`, data.rejectByRider.statusText);
          
          if (data.rejectByRider.statusText.includes('Error') || 
              data.rejectByRider.statusText.includes('Failed')) {
            console.error(`Failed to reject item ${itemId}`);
          }
        }
      }
      
      onReject(delivery.id);
      alert('All items have been rejected successfully');
      
    } catch (error: any) {
      console.error('Error rejecting delivery:', error);
      alert(`Failed to reject delivery: ${error.message}`);
    }
  };

  const isLoading = acceptLoading || rejectLoading;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-orange-200 overflow-hidden">
      {/* Header with timer and order info */}
      <div className="bg-orange-50 px-3 lg:px-4 py-2 lg:py-3 border-b border-orange-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1 lg:gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="font-bold text-orange-700 text-xs lg:text-sm">NEW REQUEST</span>
            {delivery.isPartialDelivery && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">
                Piece {delivery.supplierIndex} of {delivery.totalSuppliersInOrder}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 lg:gap-2 bg-orange-100 px-2 lg:px-3 py-0.5 lg:py-1 rounded-full">
            <Clock size={isMobile ? 12 : 14} className="text-orange-600" />
            <span className="font-bold text-orange-700 text-xs lg:text-sm">{delivery.expiresIn}</span>
          </div>
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

        {/* Collapsible Items Section */}
        <div className="mb-3 lg:mb-4 bg-gray-50 rounded-lg overflow-hidden">
          {/* Header - Always visible */}
          <button
            onClick={() => setShowItems(!showItems)}
            className="w-full px-3 lg:px-4 py-2 lg:py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Package size={isMobile ? 16 : 18} className="text-gray-600" />
              <span className="font-semibold text-sm lg:text-base">
                Items from this supplier ({delivery.items} item{delivery.items !== 1 ? "s" : ""})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs lg:text-sm text-gray-500">
                {showItems ? 'Hide' : 'Show'} details
              </span>
              {showItems ? (
                <ChevronUp size={isMobile ? 16 : 18} className="text-gray-500" />
              ) : (
                <ChevronDown size={isMobile ? 16 : 18} className="text-gray-500" />
              )}
            </div>
          </button>

          {/* Collapsible content */}
          {showItems && (
            <div className="px-2 sm:px-3 lg:px-4 pb-2 sm:pb-3 lg:pb-4 space-y-2 sm:space-y-3 border-t border-gray-200 pt-2 sm:pt-3">
              {delivery.supplierItems?.map((item) => (
                <div key={item.id} className="flex flex-col xs:flex-row gap-2 sm:gap-3 bg-white rounded-lg p-2 sm:p-3 shadow-sm">
                  {/* Top row for mobile: Image and price side by side */}
                  <div className="flex xs:hidden items-center gap-2">
                    {/* Image section */}
                    {item.product[0]?.images && item.product[0].images.length > 0 && (
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <img 
                          src={item.product[0].images[0]} 
                          alt={item.product[0].name}
                          className="w-full h-full object-cover rounded-lg border border-gray-200"
                        />
                        {item.product[0].images.length > 1 && (
                          <span className="absolute -top-1 -right-1 bg-gray-800 text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full">
                            {item.product[0].images.length}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Mobile price */}
                    <div className="flex-1 text-right">
                      <div className="text-sm font-bold text-gray-900">
                        {formatPeso(item.price * item.quantity)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatPeso(item.price)} each
                      </div>
                    </div>
                  </div>

                  {/* Main content - responsive layout */}
                  <div className="flex flex-1 flex-col xs:flex-row gap-2 sm:gap-3">
                    {/* Image - hidden on mobile (shown in top row), visible on xs and up */}
                    {item.product[0]?.images && item.product[0].images.length > 0 && (
                      <div className="hidden xs:block relative w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 flex-shrink-0">
                        <img 
                          src={item.product[0].images[0]} 
                          alt={item.product[0].name}
                          className="w-full h-full object-cover rounded-lg border border-gray-200"
                        />
                        {item.product[0].images.length > 1 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-gray-800 text-white text-[10px] sm:text-xs w-4 sm:w-5 h-4 sm:h-5 flex items-center justify-center rounded-full">
                            {item.product[0].images.length}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Product details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-0.5 sm:gap-1">
                        {/* SKU and quantity */}
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                          <span className="text-[10px] sm:text-xs font-mono bg-gray-200 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-gray-700">
                            {item.product[0]?.sku}
                          </span>
                          <span className="text-[10px] sm:text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            Qty: {item.quantity}
                          </span>
                        </div>
                        
                        {/* Product name */}
                        <h4 className="text-xs sm:text-sm lg:text-base font-medium text-gray-900 truncate">
                          {item.product[0]?.name}
                        </h4>
                        
                        {/* Price for tablet/desktop (hidden on mobile) */}
                        <div className="hidden sm:flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500">Unit price:</span>
                          <span className="text-xs font-semibold text-gray-700">{formatPeso(item.price)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Price - visible on tablet/desktop (hidden on mobile) */}
                    <div className="hidden sm:flex flex-col items-end justify-center flex-shrink-0 min-w-[80px] lg:min-w-[100px]">
                      <div className="text-sm lg:text-base font-bold text-gray-900 whitespace-nowrap">
                        {formatPeso(item.price * item.quantity)}
                      </div>
                      <div className="text-xs lg:text-sm text-gray-500 whitespace-nowrap">
                        @ {formatPeso(item.price)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Subtotal - responsive */}
              <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 bg-orange-50 rounded-lg p-3 sm:p-4 mt-2 sm:mt-3">
                <span className="text-sm sm:text-base font-medium text-gray-600">Subtotal for this supplier</span>
                <div className="flex flex-col xs:items-end w-full xs:w-auto">
                  <span className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">
                    {formatPeso(delivery.supplierItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0)}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500">
                    ({delivery.supplierItems?.length} {delivery.supplierItems?.length === 1 ? 'item' : 'items'})
                  </span>
                </div>
              </div>
            </div>
          )}
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

        {/* Error messages */}
        {(acceptError || rejectError) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">
              {acceptError?.message || rejectError?.message}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 lg:gap-4">
          <button
            onClick={handleReject}
            disabled={isLoading}
            className={`bg-white border ${rejectLoading ? 'border-yellow-300' : 'border-gray-300'} text-gray-700 px-3 lg:px-4 py-2 lg:py-3 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-1 lg:gap-2 text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <X size={isMobile ? 18 : 20} />
            <span>{rejectLoading ? 'Rejecting...' : 'Reject'}</span>
          </button>
          <button
            onClick={handleAccept}
            disabled={isLoading}
            className={`bg-green-500 text-white px-3 lg:px-4 py-2 lg:py-3 rounded-lg font-semibold hover:bg-green-600 transition flex items-center justify-center gap-1 lg:gap-2 text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ThumbsUp size={isMobile ? 18 : 20} />
            <span>{acceptLoading ? 'Accepting...' : 'Accept Delivery'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
