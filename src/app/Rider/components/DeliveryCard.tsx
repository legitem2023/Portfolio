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
  X
} from "lucide-react";
import { Delivery } from '../lib/types';
import { formatPeso } from '../lib/utils';
import { useMutation } from '@apollo/client';
import { ACCEPT_BY_RIDER } from '../lib/types';
import { useAuth } from '../hooks/useAuth';

interface DeliveryCardProps {
  delivery: Delivery;
  isMobile: boolean;
  onAccept: (deliveryId: string) => void;
  onReject: (deliveryId: string) => void;
}

export default function DeliveryCard({ delivery, isMobile, onAccept, onReject }: DeliveryCardProps) {
  const { user } = useAuth();
  
  const [acceptDelivery, { loading: acceptLoading, error: acceptError }] = useMutation(ACCEPT_BY_RIDER);

  const handleAccept = async () => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    // Get itemId and supplierId from parent data
    // Since it's an array from parent, we need to extract them from delivery
    const itemId = delivery.supplierItems?.[0]?.id // Assuming delivery.id is the itemId
    const supplierId = delivery.supplierItems?.[0]?.supplierId; // Get supplierId from first supplier item
    const riderId = user.userId;
    const userId = delivery.customerId;
    console.log(delivery);
    
    if (!itemId || !supplierId) {
      console.error('Missing itemId or supplierId', { itemId, supplierId });
      return;
    }

    try {
     /* const { data } = await acceptDelivery({
        variables: {
          itemId: itemId,
          riderId: riderId,
          supplierId: supplierId,
          userId: userId,
        }
      });

      if (data?.acceptByRider?.statusText === 'Successfully Accepted!') {
        onAccept(delivery.id);
      }*/
    } catch (error) {
      console.error('Error accepting delivery:', error);
    }
  };

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

        {/* Item details for this supplier */}
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

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 lg:gap-4">
          <button
            onClick={() => onReject(delivery.id)}
            className="bg-white border border-gray-300 text-gray-700 px-3 lg:px-4 py-2 lg:py-3 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-1 lg:gap-2 text-sm lg:text-base"
          >
            <X size={isMobile ? 18 : 20} />
            <span>Reject</span>
          </button>
          <button
            onClick={handleAccept}
            className="bg-green-500 text-white px-3 lg:px-4 py-2 lg:py-3 rounded-lg font-semibold hover:bg-green-600 transition flex items-center justify-center gap-1 lg:gap-2 text-sm lg:text-base"
          >
            <ThumbsUp size={isMobile ? 18 : 20} />
            <span>Accept Delivery</span>
          </button>
        </div>
      </div>
    </div>
  );
}
