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
import { showToast } from '../../../../utils/toastify';
interface DeliveryCardProps {
  delivery: Delivery;
  isMobile: boolean;
  onAccept: (deliveryId: string) => void;
  onReject: (deliveryId: string) => void;
  refetch: any;
}

export default function DeliveryCard({ delivery, isMobile, onAccept, onReject, refetch }: DeliveryCardProps) {
  const { user } = useAuth();
  const [showItems, setShowItems] = useState(false);
  
  const [acceptDelivery, { loading: acceptLoading, error: acceptError }] = useMutation(ACCEPT_BY_RIDER);
  const [rejectDelivery, { loading: rejectLoading, error: rejectError }] = useMutation(REJECT_BY_RIDER_MUTATION);

  // Calculate the payout for this specific supplier (equal split among all suppliers in the order)
  const calculatePayoutForThisSupplier = () => {
    if (!delivery.supplierItems || delivery.supplierItems.length === 0) return 0;
    
    // Get the total number of suppliers in this order
    // This should come from the parent order data
    const totalSuppliersInOrder = delivery.totalSuppliersInOrder || 1;
    
    // Get the total shipping across ALL suppliers in this order
    // This needs to be fetched from the parent order, but since we don't have that data,
    // we need to calculate based on what's available
    // For now, we'll sum the individualShipping of the current supplier items
    // BUT this is incorrect if we only have one supplier's data
    
    // Alternative approach: Use the order's total shipping if available
    // The individualShipping on each item is the TOTAL shipping for the ENTIRE order divided by number of items
    // So if we sum all individualShipping across ALL suppliers, we get the total shipping
    
    // Since we only have current supplier's items in this card,
    // we need to calculate based on the assumption that individualShipping per item
    // is the total order shipping divided by total items
    const currentSupplierShipping = delivery.supplierItems.reduce((sum, item) => {
      return sum + (item.individualShipping || 0);
    }, 0);
    
    // If this is a single supplier order, return the current supplier shipping
    if (totalSuppliersInOrder === 1) {
      return currentSupplierShipping;
    }
    
    // For multi-supplier orders, we need to know the total shipping across all suppliers
    // This requires data from the parent order that we don't have in this card
    // Let's log what data we have
    console.log('Delivery data:', {
      orderParentId: delivery.orderParentId,
      totalSuppliersInOrder: delivery.totalSuppliersInOrder,
      supplierIndex: delivery.supplierIndex,
      currentSupplierShipping: currentSupplierShipping,
      supplierItemsCount: delivery.supplierItems?.length
    });
    
    // For now, we'll calculate by assuming individualShipping for each item is the same across all suppliers
    // This is a temporary solution - you need to fetch the total order shipping from your backend
    const totalShippingAcrossAllSuppliers = currentSupplierShipping * totalSuppliersInOrder;
    const equalShare = totalShippingAcrossAllSuppliers / totalSuppliersInOrder;
    
    return equalShare;
  };
  
  // Calculate the original shipping for this supplier (for display purposes)
  const getCurrentSupplierOriginalShipping = () => {
    if (!delivery.supplierItems) return 0;
    return delivery.supplierItems.reduce((sum, item) => sum + (item.individualShipping || 0), 0);
  };
  
  const payout = calculatePayoutForThisSupplier();
  const originalShipping = getCurrentSupplierOriginalShipping();
  
  // Calculate total items across all suppliers if we had the data
  const getTotalItemsInOrder = () => {
    // This should come from the parent order
    // For now, just return the current supplier's items count
    return delivery.items || delivery.supplierItems?.length || 0;
  };

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
        refetch();
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
      refetch();
    } catch (error: any) {
      console.error('Error rejecting delivery:', error);
      alert(`Failed to reject delivery: ${error.message}`);
    }
  };

  const isLoading = acceptLoading || rejectLoading;
  
  const totalSuppliers = delivery.totalSuppliersInOrder || 1;
  const isMultiSupplier = totalSuppliers > 1;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-indigo-200 overflow-hidden">
      {/* Header with timer and order info */}
      <div className="bg-indigo-50 px-4 py-3 border-b border-orange-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse flex-shrink-0"></div>
            <span className="font-bold text-indigo-700 text-sm">NEW REQUEST</span>
            {delivery.isPartialDelivery && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
                Piece {delivery.supplierIndex} of {delivery.totalSuppliersInOrder}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 bg-orange-100 px-3 py-1.5 rounded-full">
            <Clock size={isMobile ? 12 : 14} className="text-orange-600" />
            <span className="font-bold text-orange-700 text-xs whitespace-nowrap">{delivery.expiresIn}</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Order info */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <Shield size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base break-words">{delivery.orderId}</h3>
              {delivery.isPartialDelivery && (
                <p className="text-xs text-gray-500 mt-1">
                  Partial delivery - This order has items from {delivery.totalSuppliersInOrder} different suppliers
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Building size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="font-medium text-base break-words">{delivery.restaurant}</span>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <User size={18} className="text-gray-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="text-base break-words">{delivery.customer}</span>
            </div>
          </div>
          
          <div className="bg-green-50 p-3 rounded-xl">
            <div className="text-xl font-bold text-green-600 break-words">{formatPeso(payout)}</div>
            <p className="text-gray-500 text-xs">
              Your payout for this delivery
              {isMultiSupplier && (
                <span className="block text-xs text-orange-600 mt-1">
                  ⚠️ Equal split among {totalSuppliers} suppliers
                </span>
              )}
            </p>
            {isMultiSupplier && (
              <p className="text-xs text-gray-400 mt-1">
                Original shipping for this supplier: {formatPeso(originalShipping)}
              </p>
            )}
            {delivery.subtotal && (
              <p className="text-xs text-gray-400 mt-1">Subtotal: {delivery.subtotal}</p>
            )}
          </div>
        </div>

        {/* Collapsible Items Section */}
        <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
          <button
            onClick={() => setShowItems(!showItems)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Package size={16} />
              {delivery.items} item{delivery.items !== 1 ? "s" : ""}
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {showItems ? 'Hide' : 'Show'} details
              </span>
              {showItems ? (
                <ChevronUp size={18} className="text-gray-500 flex-shrink-0" />
              ) : (
                <ChevronDown size={18} className="text-gray-500 flex-shrink-0" />
              )}
            </div>
          </button>

          {showItems && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-200 pt-3">
              {delivery.supplierItems?.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 bg-white rounded-xl p-3 shadow-sm">
                  <div className="flex gap-3">
                    {item.product[0]?.images && item.product[0].images.length > 0 && (
                      <div className="relative w-16 h-16 flex-shrink-0">
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
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded text-gray-700">
                              {item.product[0]?.sku}
                            </span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              Qty: {item.quantity}
                            </span>
                          </div>
                          <h4 className="text-sm font-medium text-gray-900 break-words">
                            {item.product[0]?.name}
                          </h4>
                        </div>
                        <div className="text-left w-full sm:w-auto">
                          <div className="text-base font-bold text-gray-900">
                            {formatPeso(item.price * item.quantity)}
                          </div>
                          <div className="text-xs text-gray-500">
                            @ {formatPeso(item.price)}
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            Shipping: {formatPeso(item.individualShipping || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex flex-col gap-2 bg-orange-50 rounded-xl p-4 mt-3">
                <span className="text-sm font-medium text-gray-600">Shipping Summary</span>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">This suppliers items shipping:</span>
                    <span className="text-lg font-semibold text-orange-600">
                      {formatPeso(originalShipping)}
                    </span>
                  </div>
                  {isMultiSupplier && (
                    <>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-orange-200">
                        <span className="text-sm text-gray-600">Total order shipping (all suppliers):</span>
                        <span className="text-lg font-semibold text-orange-600">
                          {formatPeso(originalShipping * totalSuppliers)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-green-200">
                        <span className="text-sm font-semibold text-green-700">Equal share per supplier:</span>
                        <span className="text-xl font-bold text-green-600">
                          {formatPeso(payout)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Split equally among {totalSuppliers} suppliers regardless of item count
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Route info */}
        <div className="space-y-3">
          <div className="bg-blue-50 p-3 rounded-xl">
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin size={16} className="text-blue-500" />
              <span className="font-semibold text-xs">Pickup From</span>
            </div>
            <p className="text-gray-700 text-xs break-words">{delivery.pickup}</p>
            {delivery.supplierName && (
              <div className="mt-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Building size={10} />
                  <span className="truncate">{delivery.supplierName}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-center py-1">
            <div className="w-full border-t-2 border-dashed border-gray-300 relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                <div className="flex items-center gap-1 text-gray-500">
                  <Navigation size={12} />
                  <span className="text-xs font-medium whitespace-nowrap">{delivery.distance}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-3 rounded-xl">
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin size={16} className="text-green-500" />
              <span className="font-semibold text-xs">Deliver To</span>
            </div>
            <p className="text-gray-700 text-xs break-words">{delivery.dropoff}</p>
            {delivery.dropoffAddress && (
              <div className="mt-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <User size={10} />
                  <span className="truncate">{delivery.customer}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional info */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-lg">
            <Package size={14} className="text-gray-600 flex-shrink-0" />
            <span className="text-xs font-medium whitespace-nowrap">{delivery.items} item{delivery.items !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-lg">
            <Navigation size={14} className="text-gray-600 flex-shrink-0" />
            <span className="text-xs font-medium whitespace-nowrap">{delivery.distance}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-lg">
            <Clock size={14} className="text-gray-600 flex-shrink-0" />
            <span className="text-xs font-medium whitespace-nowrap">~15-20 min</span>
          </div>
        </div>

        {/* Error messages */}
        {(acceptError || rejectError) && (
          <div className="p-3 rounded-xl flex items-start gap-3 bg-red-50 border border-red-200">
            <X className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700 break-words flex-1">
              {acceptError?.message || rejectError?.message}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleReject}
            disabled={isLoading}
            className="bg-white border border-red-300 text-red-600 px-4 py-4 rounded-xl font-semibold hover:bg-red-50 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            <X size={20} />
            <span>{rejectLoading ? 'Rejecting...' : 'Reject'}</span>
          </button>
          <button
            onClick={handleAccept}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-4 rounded-xl font-semibold transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            <ThumbsUp size={20} />
            <span>{acceptLoading ? 'Accepting...' : 'Accept Delivery'}</span>
          </button>
        </div>
      </div>
    </div>
  );
                      }
