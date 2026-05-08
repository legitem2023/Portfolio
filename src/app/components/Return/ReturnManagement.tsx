// components/ReturnManagement.tsx

import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { useState } from 'react';
import { RotateCcw, FileText, Package, DollarSign, MessageCircle, AlertCircle, X, ChevronDown, ChevronUp, Loader2, MapPin, Truck } from "lucide-react";

// ==================== GraphQL Queries and Mutations ====================

// Query: Get all returns for a user
const GET_USER_RETURNS = gql`
  query GetUserReturns($userId: ID!) {
    getUserReturns(userId: $userId) {
      id
      returnNumber
      status
      reason
      description
      vendorNotes
      items {
        id
        quantity
        reason
        condition
        orderItem {
          id
          quantity
          price
          product {
            name
            sku
            images
          }
        }
      }
      createdAt
      updatedAt
    }
  }
`;

// Mutation: Add tracking number to a return
const ADD_RETURN_TRACKING_MUTATION = gql`
  mutation AddReturnTracking($input: AddReturnTrackingInput!) {
    addReturnTracking(input: $input) {
      id
      trackingNumber
      shippedAt
    }
  }
`;

// Mutation: Cancel a return request
const CANCEL_RETURN_MUTATION = gql`
  mutation CancelReturn($input: CancelReturnInput!) {
    cancelReturn(input: $input) {
      id
      status
    }
  }
`;

// ==================== Types ====================

interface ReturnItem {
  id: string;
  quantity: number;
  reason: string;
  condition: string;
  orderItem: {
    id: string;
    quantity: number;
    price: number;
    product: Array<{
      name: string;
      sku: string;
      images: string[];
    }>;
  };
}

interface ReturnRequest {
  id: string;
  returnNumber: string;
  status: string;
  reason: string;
  description?: string;
  vendorNotes?: string;
  trackingNumber?: string;
  shippedAt?: string;
  items: ReturnItem[];
  createdAt: string;
  updatedAt?: string;
}

// ==================== Constants ====================

const returnStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  RETURN_SHIPPED: 'bg-blue-100 text-blue-800',
  RECEIVED: 'bg-indigo-100 text-indigo-800',
  INSPECTING: 'bg-purple-100 text-purple-800',
  REFUND_INITIATED: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800'
};

const returnStatusLabels: Record<string, string> = {
  PENDING: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  RETURN_SHIPPED: 'Shipped Back',
  RECEIVED: 'Received at Warehouse',
  INSPECTING: 'Under Inspection',
  REFUND_INITIATED: 'Refund Initiated',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

// ==================== Helper Functions ====================

const formatPrice = (amount: number): string => {
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// ==================== Main Component ====================

interface ReturnManagementProps {
  userId: string;
  onRefresh?: () => void;
}

export default function ReturnManagement({ userId, onRefresh }: ReturnManagementProps) {
  const [expandedReturn, setExpandedReturn] = useState<string | null>(null);
  const [showTrackingInput, setShowTrackingInput] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  
  // Loading states
  const [refetchLoading, setRefetchLoading] = useState(false);
  const [addTrackingLoading, setAddTrackingLoading] = useState(false);
  const [cancelReturnLoading, setCancelReturnLoading] = useState<string | null>(null);
  
  // Queries
  const { data: returnsData, loading, error, refetch: refetchReturns } = useQuery<{ getUserReturns: ReturnRequest[] }>(
    GET_USER_RETURNS,
    { variables: { userId }, skip: !userId }
  );
  
  // Mutations
  const [addReturnTracking] = useMutation(ADD_RETURN_TRACKING_MUTATION);
  const [cancelReturn] = useMutation(CANCEL_RETURN_MUTATION);
  
  // Handlers
  const handleRefreshReturns = async () => {
    setRefetchLoading(true);
    try {
      await refetchReturns();
      onRefresh?.();
    } finally {
      setRefetchLoading(false);
    }
  };
  
  const handleAddTracking = async (returnId: string, trackingNumberValue: string) => {
    setAddTrackingLoading(true);
    try {
      await addReturnTracking({
        variables: {
          input: {
            returnId,
            trackingNumber: trackingNumberValue
          }
        }
      });
      alert('Tracking number added successfully!');
      setShowTrackingInput(null);
      setTrackingNumber('');
      await refetchReturns();
      onRefresh?.();
    } catch (err: any) {
      console.error('Error adding tracking:', err);
      alert(`Failed to add tracking: ${err.message}`);
    } finally {
      setAddTrackingLoading(false);
    }
  };
  
  const handleCancelReturn = async (returnId: string) => {
    if (confirm('Are you sure you want to cancel this return request?')) {
      setCancelReturnLoading(returnId);
      try {
        await cancelReturn({
          variables: {
            input: {
              returnId,
              reason: `Cancelled by user ${userId}`
            }
          }
        });
        alert('Return request cancelled successfully!');
        await refetchReturns();
        onRefresh?.();
      } catch (err: any) {
        console.error('Error cancelling return:', err);
        alert(`Failed to cancel return: ${err.message}`);
      } finally {
        setCancelReturnLoading(null);
      }
    }
  };
  
  const handleSubmitTracking = (returnId: string) => {
    if (trackingNumber.trim()) {
      handleAddTracking(returnId, trackingNumber);
    }
  };
  
  // Helper functions
  const getTotalRefund = (returnReq: ReturnRequest) => {
    return returnReq.items.reduce((sum, item) => sum + (item.orderItem.price * item.quantity), 0);
  };
  
  const canAddTracking = (status: string) => {
    return status === 'APPROVED';
  };
  
  const canCancel = (status: string) => {
    return status === 'PENDING' || status === 'APPROVED';
  };
  
  // Loading state
  if (loading) {
    return <ReturnShimmerLoading />;
  }
  
  // Error state
  if (error) {
    return <ReturnErrorMessage error={error} onRetry={handleRefreshReturns} />;
  }
  
  const returns = returnsData?.getUserReturns || [];
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
    <div className="return-management-container">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Return Requests</h2>
          <p className="text-sm text-gray-500">Track and manage your return requests</p>
        </div>
        <button
          onClick={handleRefreshReturns}
          disabled={refetchLoading}
          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
        >
          {refetchLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <RotateCcw size={20} />
          )}
        </button>
      </div>
      
      {/* Return List */}
      {returns.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
          <RotateCcw size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-500 mb-2">No Return Requests</h3>
          <p className="text-sm text-gray-400">You haven&apos;t submitted any return requests yet.</p>
          <p className="text-xs text-gray-400 mt-2">Go to your orders to request a return.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map((returnReq) => (
            <ReturnCard
              key={returnReq.id}
              returnReq={returnReq}
              expanded={expandedReturn === returnReq.id}
              onToggleExpand={() => setExpandedReturn(expandedReturn === returnReq.id ? null : returnReq.id)}
              showTrackingInput={showTrackingInput === returnReq.id}
              trackingNumber={trackingNumber}
              onTrackingNumberChange={setTrackingNumber}
              onSubmitTracking={() => handleSubmitTracking(returnReq.id)}
              onCancelTracking={() => {
                setShowTrackingInput(null);
                setTrackingNumber('');
              }}
              onAddTrackingClick={() => setShowTrackingInput(returnReq.id)}
              onCancelReturn={() => handleCancelReturn(returnReq.id)}
              addTrackingLoading={addTrackingLoading}
              cancelReturnLoading={cancelReturnLoading === returnReq.id}
              canAddTracking={canAddTracking(returnReq.status)}
              canCancel={canCancel(returnReq.status)}
              getTotalRefund={getTotalRefund}
            />
          ))}
        </div>
      )}
    </div>
      </div>
    </div>
  );
}

// ==================== Return Card Component ====================

interface ReturnCardProps {
  returnReq: ReturnRequest;
  expanded: boolean;
  onToggleExpand: () => void;
  showTrackingInput: boolean;
  trackingNumber: string;
  onTrackingNumberChange: (value: string) => void;
  onSubmitTracking: () => void;
  onCancelTracking: () => void;
  onAddTrackingClick: () => void;
  onCancelReturn: () => void;
  addTrackingLoading: boolean;
  cancelReturnLoading: boolean;
  canAddTracking: boolean;
  canCancel: boolean;
  getTotalRefund: (returnReq: ReturnRequest) => number;
}

function ReturnCard({
  returnReq,
  expanded,
  onToggleExpand,
  showTrackingInput,
  trackingNumber,
  onTrackingNumberChange,
  onSubmitTracking,
  onCancelTracking,
  onAddTrackingClick,
  onCancelReturn,
  addTrackingLoading,
  cancelReturnLoading,
  canAddTracking,
  canCancel,
  getTotalRefund
}: ReturnCardProps) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className={`px-4 py-3 border-b ${
        returnReq.status === 'PENDING' ? 'bg-yellow-50 border-yellow-100' :
        returnReq.status === 'APPROVED' ? 'bg-green-50 border-green-100' :
        returnReq.status === 'REJECTED' ? 'bg-red-50 border-red-100' :
        returnReq.status === 'COMPLETED' ? 'bg-green-50 border-green-100' :
        'bg-orange-50 border-orange-100'
      }`}>
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <RotateCcw size={18} className={
              returnReq.status === 'PENDING' ? 'text-yellow-600' :
              returnReq.status === 'APPROVED' ? 'text-green-600' :
              returnReq.status === 'REJECTED' ? 'text-red-600' :
              'text-orange-600'
            } />
            <span className="font-bold text-gray-900">
              Return #{returnReq.returnNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${returnStatusColors[returnReq.status] || 'bg-gray-100 text-gray-800'}`}>
              {returnStatusLabels[returnReq.status] || returnReq.status}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <CalendarIcon size={14} />
              <span className="text-xs">Requested:</span>
              <span className="text-sm">{new Date(returnReq.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <FileText size={14} />
              <span className="text-xs">Reason:</span>
              <span className="text-sm font-medium">{returnReq.reason}</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Package size={14} />
              <span className="text-xs">Items:</span>
              <span className="text-sm">{returnReq.items.length}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <DollarSign size={14} />
              <span className="text-xs">Total Refund:</span>
              <span className="text-sm font-bold text-green-600">
                {formatPrice(getTotalRefund(returnReq))}
              </span>
            </div>
          </div>
        </div>

        {/* Tracking Info if available */}
        {returnReq.trackingNumber && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Tracking Number:</span>
              <span className="text-sm text-gray-700 font-mono">{returnReq.trackingNumber}</span>
            </div>
            {returnReq.shippedAt && (
              <div className="flex items-center gap-2 mt-1 ml-6">
                <span className="text-xs text-blue-600">Shipped on:</span>
                <span className="text-xs text-gray-600">{new Date(returnReq.shippedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {returnReq.description && (
          <div className="bg-gray-50 p-3 rounded-lg mb-4">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle size={14} className="text-gray-600" />
              <span className="text-xs font-medium text-gray-700">Additional Details:</span>
            </div>
            <p className="text-sm text-gray-600">{returnReq.description}</p>
          </div>
        )}

        {/* Vendor Notes */}
        {returnReq.vendorNotes && (
          <div className="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle size={14} className="text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Vendor Response:</span>
            </div>
            <p className="text-sm text-gray-700">{returnReq.vendorNotes}</p>
          </div>
        )}

        {/* Expand/Collapse Items Button */}
        <button
          onClick={onToggleExpand}
          className="w-full flex items-center justify-between text-gray-600 hover:text-gray-800 py-2 border-t border-gray-100 mt-2"
        >
          <span className="text-sm font-medium">
            Return Items ({returnReq.items.length})
          </span>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {/* Items List (Expanded) */}
        {expanded && (
          <div className="mt-3 space-y-3">
            {returnReq.items.map((returnItem) => {
              const product = returnItem.orderItem.product[0];
              return (
                <div key={returnItem.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex gap-3">
                    {product?.images?.[0] && (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">
                        {product?.name || 'Unknown Product'}
                      </h4>
                      <p className="text-xs text-gray-500">SKU: {product?.sku || 'N/A'}</p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <span className="text-xs text-gray-500">Quantity:</span>
                          <p className="text-sm font-medium">{returnItem.quantity}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Price:</span>
                          <p className="text-sm font-medium text-green-600">
                            {formatPrice(returnItem.orderItem.price)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">Condition:</span>
                        <p className="text-sm">{returnItem.condition}</p>
                      </div>
                      <div className="mt-1">
                        <span className="text-xs text-gray-500">Return Reason:</span>
                        <p className="text-sm">{returnItem.reason}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 space-y-2">
          {/* Add Tracking Button/Input */}
          {canAddTracking && !returnReq.trackingNumber && (
            <div>
              {showTrackingInput ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter tracking number..."
                    value={trackingNumber}
                    onChange={(e) => onTrackingNumberChange(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={onSubmitTracking}
                    disabled={addTrackingLoading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  >
                    {addTrackingLoading && <Loader2 size={14} className="animate-spin" />}
                    Submit
                  </button>
                  <button
                    onClick={onCancelTracking}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={onAddTrackingClick}
                  className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Truck size={16} />
                  Add Tracking Number
                </button>
              )}
            </div>
          )}

          {/* Cancel Button */}
          {canCancel && (
            <button
              onClick={onCancelReturn}
              disabled={cancelReturnLoading}
              className="w-full py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {cancelReturnLoading && <Loader2 size={14} className="animate-spin" />}
              Cancel Return Request
            </button>
          )}
        </div>

        {/* Status Messages */}
        {returnReq.status === 'APPROVED' && !returnReq.trackingNumber && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-green-600" />
              <span className="text-sm text-green-700">
                Your return has been approved. Please ship the items back and add the tracking number.
              </span>
            </div>
          </div>
        )}

        {returnReq.status === 'RETURN_SHIPPED' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-blue-600" />
              <span className="text-sm text-blue-700">
                Your return is on its way back to the warehouse.
              </span>
            </div>
          </div>
        )}

        {returnReq.status === 'RECEIVED' && (
          <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-indigo-600" />
              <span className="text-sm text-indigo-700">
                Your returned items have been received and are being inspected.
              </span>
            </div>
          </div>
        )}

        {returnReq.status === 'REFUND_INITIATED' && (
          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-orange-600" />
              <span className="text-sm text-orange-700">
                Refund has been initiated. Please allow 5-7 business days for the refund to reflect.
              </span>
            </div>
          </div>
        )}

        {returnReq.status === 'REJECTED' && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600" />
              <span className="text-sm text-red-700">
                Your return request was rejected. Please contact support for more information.
              </span>
            </div>
          </div>
        )}

        {returnReq.status === 'COMPLETED' && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-green-600" />
              <span className="text-sm text-green-700">
                Return completed. Refund has been processed.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Loading Component ====================

function ReturnShimmerLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-7 w-32 bg-gray-200 rounded shimmer mb-2"></div>
          <div className="h-4 w-48 bg-gray-200 rounded shimmer"></div>
        </div>
        <div className="h-9 w-9 bg-gray-200 rounded-lg shimmer"></div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-100 border-b">
            <div className="flex justify-between">
              <div className="h-6 w-40 bg-gray-200 rounded shimmer"></div>
              <div className="h-6 w-24 bg-gray-200 rounded-full shimmer"></div>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded shimmer"></div>
              <div className="h-4 w-3/4 bg-gray-200 rounded shimmer"></div>
              <div className="h-4 w-1/2 bg-gray-200 rounded shimmer"></div>
            </div>
          </div>
        </div>
      
      ))}
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
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
      </div>
    </div>
  );
}

// ==================== Error Component ====================

interface ReturnErrorMessageProps {
  error: any;
  onRetry: () => void;
}

function ReturnErrorMessage({ error, onRetry }: ReturnErrorMessageProps) {
  return (
    <div className="bg-white rounded-lg p-6 text-center border border-gray-200">
      <div className="text-4xl mb-3">⚠️</div>
      <h2 className="text-lg font-semibold text-red-600 mb-2">Failed to Load Returns</h2>
      <p className="text-sm text-gray-500 mb-4">{error?.message || 'Please try again later'}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
      >
        Retry
      </button>
    </div>
  );
}

// ==================== Calendar Icon ====================

function CalendarIcon(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
}

// ==================== Exports ====================

export {
  GET_USER_RETURNS,
  ADD_RETURN_TRACKING_MUTATION,
  CANCEL_RETURN_MUTATION,
  type ReturnRequest
};
