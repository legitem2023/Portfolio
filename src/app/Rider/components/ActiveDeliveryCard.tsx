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
  Camera
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
  
  // Proof of delivery states
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const [receivedByName, setReceivedByName] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [updateOrderStatus, { loading: mutationLoading }] = useMutation(UPDATE_ORDER_STATUS, {
    onCompleted: (data) => {
      const successMessage = data.updateOrderStatus?.statusText || 'Status updated successfully!';
      setMessage({ type: 'success', text: successMessage });
      
      setTimeout(() => {
        onReset();
        setMessage(null);
        setActionType(null);
        setShowProofModal(false);
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

  const [uploadProof, { loading: uploadLoading }] = useMutation(UPLOAD);

  const isLoading = mutationLoading || uploadLoading;

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
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      setSignature(canvasRef.current.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  };

  const handleDelivered = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'User not authenticated' });
      return;
    }

    // Validate proof of delivery
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
    setShowProofModal(false);

    try {
      // First upload the proof of delivery
      const proofInput: ProofOfDeliveryInput = {
        id: delivery.orderId,
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

      // Then update order status
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

      // Reset proof states
      setProofPhoto(null);
      setReceivedByName('');
      setSignature(null);
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
        {/* ... existing header and content ... */}
        
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
                onClick={() => setShowProofModal(true)}
                disabled={isLoading || !!message}
                className={`
                  w-full px-4 py-3 sm:py-4 rounded-xl font-semibold 
                  transition flex items-center justify-center gap-2 
                  text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed
                  bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg
                `}
              >
                <Home size={18} />
                <span>Complete Delivery</span>
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

      {/* Proof of Delivery Modal */}
      {showProofModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Proof of Delivery</h2>
                <button
                  onClick={() => setShowProofModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Photo Upload */}
              <div className="mb-6">
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
                      onClick={() => setProofPhoto(null)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-green-500 transition-colors"
                  >
                    <Camera className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">Click to upload delivery photo</p>
                    <p className="text-xs text-gray-500">Take a photo of the delivered items</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* Recipient Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  value={receivedByName}
                  onChange={(e) => setReceivedByName(e.target.value)}
                  placeholder="Enter recipient's full name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Signature Pad */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Signature *
                </label>
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={200}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-48 bg-white cursor-crosshair touch-none"
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
              <div className="flex gap-3">
                <button
                  onClick={handleDelivered}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : 'Confirm Delivery'}
                </button>
                <button
                  onClick={() => setShowProofModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Reason Modal */}
      {showCancelReason && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h4 className="font-semibold text-lg mb-4">Cancel Order</h4>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please provide a reason for cancellation..."
              className="w-full p-3 border border-gray-300 rounded-lg text-sm min-h-[100px] mb-4"
              rows={4}
            />
            <div className="flex gap-3">
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
        </div>
      )}

      {/* Failed Delivery Modal */}
      {showFailedReason && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h4 className="font-semibold text-lg mb-4">Report Failed Delivery</h4>
            <textarea
              value={failedReason}
              onChange={(e) => setFailedReason(e.target.value)}
              placeholder="Please provide a reason for failed delivery..."
              className="w-full p-3 border border-gray-300 rounded-lg text-sm min-h-[100px] mb-4"
              rows={4}
            />
            <div className="flex gap-3">
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
