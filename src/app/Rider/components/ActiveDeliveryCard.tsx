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
  Phone,
  Camera,
  Image,
  QrCode
} from "lucide-react";
import { Delivery } from '../lib/types';
import { formatPeso } from '../lib/utils';
import { useMutation } from '@apollo/client';
import { UPDATE_ORDER_STATUS } from '../lib/types';
import { useAuth } from '../hooks/useAuth';
import { useState, useRef } from 'react';
import DeliveryMap from './DeliveryMap';
import { gql } from '@apollo/client';

export const UPLOAD = gql`
mutation UploadDeliveryProof($file: ProofOfDeliveryInput) {
  uploadDeliveryProof(file: $file) {
    statusText
  }
}
`

export const FINISH_ORDER_MUTATION = gql`
  mutation FinishOrder($id: ID!) {
    finishorder(id: $id) {
      statusText
    }
  }
`;

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

interface ProofOfDeliveryInput {
  id: string;
  receivedBy: string;
  receivedAt: string;
  photoUrl: string;
  signatureData: string;
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
  const [showProofSection, setShowProofSection] = useState(false);
  
  // Proof of delivery states
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const [receivedByName, setReceivedByName] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasProofUploaded, setHasProofUploaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // VAT rate from environment (default 0.12 if not set)
  const VAT_RATE = Number(process.env.NEXT_PUBLIC_VAT) || 0.12;

  // Calculate total payout as sum of individualShipping for all items
  const calculatePayout = () => {
    if (!delivery.supplierItems) return 0;
    return delivery.supplierItems.reduce((sum, item) => {
      return sum + (item.individualShipping || 0);
    }, 0);
  };
  
  const payout = calculatePayout();

  // Calculate subtotal as sum of item price × quantity
  const calculateSubtotal = () => {
    if (!delivery.supplierItems) return 0;
    return delivery.supplierItems.reduce((sum, item) => {
      const price = item.price || 0;
      const qty = item.quantity || 0;
      return sum + (price * qty);
    }, 0);
  };
  
  const subtotal = calculateSubtotal();
  const shipping = payout; // same as payout

  // CORRECT VAT calculation (matches original DeliveryCard)
  const VAT = VAT_RATE * subtotal;
  const grandTotal = subtotal + shipping + VAT;

  const [updateOrderStatus, { loading: mutationLoading }] = useMutation(UPDATE_ORDER_STATUS, {
    onCompleted: (data) => {
      const successMessage = data.updateOrderStatus?.statusText || 'Status updated successfully!';
      setMessage({ type: 'success', text: successMessage });
      
      setTimeout(() => {
        onReset();
        setMessage(null);
        setActionType(null);
        setShowProofModal(false);
        // Reset proof states after successful delivery
        setProofPhoto(null);
        setReceivedByName('');
        setSignature(null);
        setHasProofUploaded(false);
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

  const [uploadProof, { loading: uploadLoading }] = useMutation(UPLOAD, {
    onCompleted: () => {
      setMessage({ type: 'success', text: 'Proof of delivery uploaded successfully!' });
      setHasProofUploaded(true);
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message || 'Failed to upload proof' });
      setTimeout(() => {
        setMessage(null);
      }, 5000);
    }
  });

  const [finishOrder, { loading: finishLoading }] = useMutation(FINISH_ORDER_MUTATION, {
    onCompleted: (data) => {
      const successMessage = data.finishorder?.statusText || 'Order finished successfully!';
      setMessage({ type: 'success', text: successMessage });
      
      setTimeout(() => {
        onReset();
        setMessage(null);
        setActionType(null);
      }, 2000);
    },
    onError: (error) => {
      const errorMessage = error.message || 'Failed to finish order';
      setMessage({ type: 'error', text: errorMessage });
      setTimeout(() => {
        setMessage(null);
        setActionType(null);
      }, 5000);
    }
  });

  const isLoading = mutationLoading || uploadLoading || finishLoading;

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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    const relativeX = (clientX - rect.left) / rect.width;
    const relativeY = (clientY - rect.top) / rect.height;
    const clampedX = Math.max(0, Math.min(1, relativeX));
    const clampedY = Math.max(0, Math.min(1, relativeY));
    const canvasX = clampedX * canvas.width;
    const canvasY = clampedY * canvas.height;
    
    ctx.moveTo(canvasX, canvasY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    const relativeX = (clientX - rect.left) / rect.width;
    const relativeY = (clientY - rect.top) / rect.height;
    const clampedX = Math.max(0, Math.min(1, relativeX));
    const clampedY = Math.max(0, Math.min(1, relativeY));
    const canvasX = clampedX * canvas.width;
    const canvasY = clampedY * canvas.height;
    
    ctx.lineTo(canvasX, canvasY);
    ctx.stroke();
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    draw(e);
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(false);
    if (canvasRef.current) {
      setSignature(canvasRef.current.toDataURL());
    }
  };

  const clearSignature = (e: React.MouseEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  };

  const handleUploadProofOnly = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'User not authenticated' });
      return;
    }

    if (!proofPhoto) {
      setMessage({ type: 'error', text: 'Please take a photo of the delivered items' });
      return;
    }

    if (!receivedByName.trim()) {
      setMessage({ type: 'error', text: 'Please enter the recipient\'s name' });
      return;
    }

    if (!signature) {
      setMessage({ type: 'error', text: 'Please capture the recipient\'s signature' });
      return;
    }

    setActionType('delivered');

    try {
      const proofInput: ProofOfDeliveryInput = {
        id: delivery.originalOrderId,
        receivedBy: receivedByName,
        receivedAt: new Date().toISOString(),
        photoUrl: proofPhoto,
        signatureData: signature
      };

      await uploadProof({
        variables: {
          file: proofInput
        }
      });

      setShowProofModal(false);
    } catch (error) {
      console.error('Error uploading proof:', error);
      setActionType(null);
    }
  };

  const handleCompleteDelivery = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'User not authenticated' });
      return;
    }

    if (!hasProofUploaded) {
      setMessage({ type: 'error', text: 'Please upload proof of delivery first' });
      return;
    }

    setActionType('delivered');

    try {
      const supplierItems = delivery.supplierItems || [];
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

  const handleFinishOrder = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'User not authenticated' });
      return;
    }

    setActionType('delivered');

    try {
    const supplierItems = delivery.supplierItems || []
      for (const item of supplierItems) {
        await finishOrder({
        variables: {
          id: item.id
        }
      });
      }
      
    } catch (error) {
      console.error('Error finishing order:', error);
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

  const toggleProofSection = () => {
    setShowProofSection(!showProofSection);
  };

  const openCamera = (e: React.MouseEvent) => {
    e.preventDefault();
    cameraInputRef.current?.click();
  };

  const openGallery = (e: React.MouseEvent) => {
    e.preventDefault();
    galleryInputRef.current?.click();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-indigo-200 overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-50 px-4 py-3 border-b border-orange-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse flex-shrink-0"></div>
              <span className="font-bold text-indigo-700 text-sm">Active Order</span>
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

        <div className="p-4 space-y-4">
          {/* Order info */}
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <Shield size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base break-words">{delivery.orderId}</h3>
                {delivery.isPartialDelivery && (
                  <p className="text-xs text-gray-500 mt-1">
                    Partial delivery - Items from {delivery.totalSuppliersInOrder} suppliers
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <QrCode size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base break-words">{delivery.trackingNumber}</h3>
              </div>
            </div>
            
            {/* Payout section with correct VAT calculation */}
            <div className="bg-green-50 p-3 rounded-xl space-y-1">
              <div className="text-xl font-bold text-green-600">{formatPeso(payout)}</div>
              <p className="text-gray-500 text-xs">Total shipping payout</p>
              <div className="border-t border-green-100 pt-2 mt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatPeso(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-medium">{formatPeso(shipping)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">VAT ({VAT_RATE * 100}%):</span>
                  <span className="font-medium">{formatPeso(VAT)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold mt-1">
                  <span className="text-gray-800">Grand Total (incl. VAT):</span>
                  <span className="text-green-700">{formatPeso(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible Item details */}
          <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
            <button
              onClick={toggleItems}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Package size={16} />
                {delivery.items} item{delivery.items !== 1 ? "s" : ""}
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  Total: {formatPeso(delivery.supplierItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0)}
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
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="flex flex-col gap-2 bg-gray-100 rounded-xl p-4 mt-3">
                  <span className="text-sm font-medium text-gray-600">Subtotal</span>
                  <div>
                    <span className="text-xl font-bold text-green-600 break-words">
                      {formatPeso(delivery.supplierItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0)}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({delivery.supplierItems?.length} {delivery.supplierItems?.length === 1 ? 'item' : 'items'})
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Route info */}
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-blue-500" />
                  <span className="font-semibold text-xs">Pickup From</span>
                </div>
                <button
                  onClick={() => setShowMap(true)}
                  className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 bg-blue-100 px-2 py-1.5 rounded-full transition-colors"
                >
                  <Navigation size={12} />
                  <span>Route</span>
                </button>
              </div>
              <p className="text-gray-700 text-xs break-words">{delivery.pickup}</p>
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

          {/* Proof Upload Status Indicator */}
          {hasProofUploaded && currentStatus === 'SHIPPED' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
              <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
              <span className="text-sm text-green-700">Proof of delivery uploaded. Ready to complete delivery.</span>
            </div>
          )}

          {/* Status/Error Messages */}
          {message && (
            <div className={`p-3 rounded-xl flex items-start gap-3 ${
              message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <p className={`text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-700'} break-words flex-1`}>
                {message.text}
              </p>
            </div>
          )}

          {/* Collapsible Proof of Delivery Section */}
          {delivery.proofOfDelivery && delivery.proofOfDelivery.length > 0 && (
            <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
              <button
                onClick={toggleProofSection}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Camera size={16} className="text-blue-500" />
                  Proof of Delivery ({delivery.proofOfDelivery.length})
                </h4>
                {showProofSection ? (
                  <ChevronUp size={18} className="text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown size={18} className="text-gray-500 flex-shrink-0" />
                )}
              </button>

              {showProofSection && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-200 pt-3">
                  {delivery.proofOfDelivery.map((proof, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 space-y-3 shadow-sm">
                      {/* Photo */}
                      {proof.photoUrl && (
                        <div>
                          <p className="text-xs text-gray-500 mb-2">Delivery Photo</p>
                          <div className="relative rounded-lg overflow-hidden border border-gray-200">
                            <img 
                              src={proof.photoUrl} 
                              alt="Delivery proof" 
                              className="w-full h-48 object-cover"
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Recipient Info */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500">Received By</p>
                          <p className="text-sm font-medium break-words">{proof.receivedBy}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Received At</p>
                          <p className="text-sm font-medium break-words">
                            {formatDate(proof.receivedAt)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Signature */}
                      {proof.signatureData && (
                        <div>
                          <p className="text-xs text-gray-500 mb-2">Signature</p>
                          <div className="bg-white rounded-lg border border-gray-200 p-2">
                            <img 
                              src={proof.signatureData} 
                              alt="Signature" 
                              className="max-h-16 w-full object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-1 gap-3">
            
            {currentStatus === 'PROCESSING' && (
              <>
                <button
                  onClick={handlePickup}
                  disabled={isLoading || !!message}
                  className={`
                    w-full px-4 py-4 rounded-xl font-semibold 
                    transition flex items-center justify-center gap-2 
                    text-sm disabled:opacity-50 disabled:cursor-not-allowed
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
                  className="w-full bg-white border border-red-300 text-red-600 px-4 py-4 rounded-xl font-semibold hover:bg-red-50 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  <XCircle size={18} />
                  <span>Cancel Order</span>
                </button>
              </>
            )}

            {currentStatus === 'SHIPPED' && (
              <>
                {/* Upload Proof Button */}
                <button
                  onClick={() => setShowProofModal(true)}
                  disabled={isLoading || !!message}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-4 rounded-xl font-semibold transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  <Camera size={18} />
                  <span>Upload Proof of Delivery</span>
                </button>
                
                {/* Complete Delivery Button - only enabled if proof exists */}
                <button
                  onClick={handleCompleteDelivery}
                  disabled={isLoading || !!message || !hasProofUploaded}
                  className={`
                    w-full px-4 py-4 rounded-xl font-semibold 
                    transition flex items-center justify-center gap-2 
                    text-sm disabled:opacity-50 disabled:cursor-not-allowed
                    ${hasProofUploaded 
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  <Home size={18} />
                  <span>Complete Delivery</span>
                </button>
                
                <button
                  onClick={() => setShowFailedReason(true)}
                  disabled={isLoading}
                  className="w-full bg-white border border-red-300 text-red-600 px-4 py-4 rounded-xl font-semibold hover:bg-red-50 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  <AlertTriangle size={18} />
                  <span>Delivery Failed</span>
                </button>
              </>
            )}

            {currentStatus === 'DELIVERED' && (
              <button
                onClick={handleFinishOrder}
                disabled={isLoading || !!message}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-4 rounded-xl font-semibold transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                <CheckCircle size={18} />
                <span>
                  {isLoading && actionType === 'delivered' ? 'Processing...' : 'Finish Order'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Proof of Delivery Modal */}
      {showProofModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-xl sm:rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 sm:p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold">Upload Proof of Delivery</h2>
                <button
                  onClick={() => {
                    setShowProofModal(false);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  ✕
                </button>
              </div>

              {/* Photo Upload */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Photo *
                </label>
                {proofPhoto ? (
                  <div className="relative">
                    <img
                      src={proofPhoto}
                      alt="Delivery proof"
                      className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                    />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setProofPhoto(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={openCamera}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition-colors flex flex-col items-center gap-2"
                    >
                      <Camera className="h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-600">Take Photo</p>
                      <p className="text-xs text-gray-500">Use camera</p>
                    </button>
                    <button
                      onClick={openGallery}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition-colors flex flex-col items-center gap-2"
                    >
                      <Image className="h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-600">Choose from Gallery</p>
                      <p className="text-xs text-gray-500">Select existing photo</p>
                    </button>
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      onClick={(e) => e.stopPropagation()}
                      className="hidden"
                    />
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      onClick={(e) => e.stopPropagation()}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* Recipient Name */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  value={receivedByName}
                  onChange={(e) => setReceivedByName(e.target.value)}
                  placeholder="Enter recipient's full name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Signature Pad */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Signature *
                </label>
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={200}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={stopDrawing}
                    onTouchCancel={stopDrawing}
                    className="w-full h-auto bg-white cursor-crosshair touch-none"
                    style={{ 
                      display: 'block',
                      width: '100%',
                      height: 'auto',
                      aspectRatio: '500/200',
                      maxWidth: '100%'
                    }}
                  />
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    onClick={clearSignature}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Clear Signature
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-2">
                <button
                  onClick={() => setShowProofModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadProofOnly}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Uploading...' : 'Upload Proof Only'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Reason Modal */}
      {showCancelReason && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-xl sm:rounded-xl max-w-md w-full">
            <div className="p-5">
              <h4 className="font-semibold text-lg mb-4">Cancel Order</h4>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancellation..."
                className="w-full p-3 border border-gray-300 rounded-lg text-sm min-h-[100px] mb-4"
                rows={4}
              />
              <div className="flex flex-col-reverse sm:flex-row gap-2">
                <button
                  onClick={() => {
                    setShowCancelReason(false);
                    setCancelReason('');
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-3 rounded-lg font-semibold text-sm"
                >
                  Back
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isLoading || !cancelReason.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold text-sm disabled:opacity-50"
                >
                  {isLoading && actionType === 'cancel' ? 'Processing...' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Failed Delivery Modal */}
      {showFailedReason && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-xl sm:rounded-xl max-w-md w-full">
            <div className="p-5">
              <h4 className="font-semibold text-lg mb-4">Report Failed Delivery</h4>
              <textarea
                value={failedReason}
                onChange={(e) => setFailedReason(e.target.value)}
                placeholder="Please provide a reason for failed delivery..."
                className="w-full p-3 border border-gray-300 rounded-lg text-sm min-h-[100px] mb-4"
                rows={4}
              />
              <div className="flex flex-col-reverse sm:flex-row gap-2">
                <button
                  onClick={() => {
                    setShowFailedReason(false);
                    setFailedReason('');
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-3 rounded-lg font-semibold text-sm"
                >
                  Back
                </button>
                <button
                  onClick={handleFailedDelivery}
                  disabled={isLoading || !failedReason.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold text-sm disabled:opacity-50"
                >
                  {isLoading && actionType === 'failed' ? 'Processing...' : 'Confirm Failed Delivery'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
