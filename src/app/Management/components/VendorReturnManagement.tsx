// components/VendorReturnManagement.tsx
"use client";
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { useState } from 'react';
import { 
  RotateCcw, 
  Search, 
  Filter, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  Package,
  User,
  Calendar,
  DollarSign,
  MessageCircle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Camera,
  FileText,
  Eye,
  Check,
  X,
  Send
} from "lucide-react";

// GraphQL Queries and Mutations
const GET_SUPPLIER_RETURNS = gql`
  query GetSupplierReturns($supplierId: ID!, $status: ReturnStatus, $limit: Int, $offset: Int) {
    getSupplierReturns(supplierId: $supplierId, status: $status, limit: $limit, offset: $offset) {
      id
      returnNumber
      status
      reason
      description
      vendorNotes
      refundAmount
      createdAt
      updatedAt
      user {
        id
        firstName
        lastName
        email
        phone
      }
      order {
        id
        orderNumber
        total
        createdAt
      }
      items {
        id
        quantity
        reason
        condition
        refundAmount
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
      images {
        id
        imageUrl
        imageType
        createdAt
      }
      tracking {
        id
        trackingNumber
        shippedAt
        deliveredAt
      }
    }
  }
`;

const GET_RETURN_STATS = gql`
  query GetReturnStats($userId: ID) {
    getReturnStats(userId: $userId) {
      totalReturns
      pendingCount
      approvedCount
      rejectedCount
      completedCount
      totalRefundAmount
      averageProcessingTime
      returnsByMonth {
        month
        count
        totalAmount
      }
    }
  }
`;

const GET_RETURN_REASONS = gql`
  query GetReturnReasons {
    getReturnReasons {
      id
      reason
      category
      isActive
      displayOrder
    }
  }
`;

const UPDATE_RETURN_STATUS = gql`
  mutation UpdateReturnStatus($input: UpdateReturnStatusInput!) {
    updateReturnStatus(input: $input) {
      id
      status
      vendorNotes
      updatedAt
    }
  }
`;

const ADD_RETURN_IMAGES = gql`
  mutation AddReturnImages($input: AddReturnImagesInput!) {
    addReturnImages(input: $input) {
      id
      imageUrl
      imageType
    }
  }
`;

const PROCESS_REFUND = gql`
  mutation ProcessRefund($input: ProcessRefundInput!) {
    processRefund(input: $input) {
      id
      status
      refundAmount
    }
  }
`;

// Types
interface ReturnImage {
  id: string;
  imageUrl: string;
  imageType: string;
  createdAt: string;
}

interface ReturnTracking {
  id: string;
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

interface ReturnItem {
  id: string;
  quantity: number;
  reason: string;
  condition: string;
  refundAmount?: number;
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
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  order: {
    id: string;
    orderNumber: string;
    total: number;
    createdAt: string;
  };
  items: ReturnItem[];
  images: ReturnImage[];
  tracking?: ReturnTracking;
}

interface ReturnStats {
  totalReturns: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  completedCount: number;
  totalRefundAmount: number;
  averageProcessingTime: number;
  returnsByMonth: Array<{
    month: string;
    count: number;
    totalAmount: number;
  }>;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  APPROVED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  RETURN_SHIPPED: 'bg-blue-100 text-blue-800 border-blue-200',
  RECEIVED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  INSPECTING: 'bg-purple-100 text-purple-800 border-purple-200',
  REFUND_INITIATED: 'bg-orange-100 text-orange-800 border-orange-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200'
};

const statusOptions = [
  { value: 'ALL', label: 'All Returns' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'RETURN_SHIPPED', label: 'Return Shipped' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'INSPECTING', label: 'Inspecting' },
  { value: 'REFUND_INITIATED', label: 'Refund Initiated' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' }
];

const formatPrice = (amount: number): string => {
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function VendorReturnManagement({ supplierId }: { supplierId: string }) {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [vendorNotes, setVendorNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMethod, setRefundMethod] = useState('ORIGINAL_PAYMENT');
  const [selectedAction, setSelectedAction] = useState<'APPROVED' | 'REJECTED' | 'RECEIVED' | 'INSPECTING' | null>(null);

  const { loading, error, data, refetch } = useQuery(GET_SUPPLIER_RETURNS, {
    variables: { 
      supplierId,
      status: selectedStatus === 'ALL' ? undefined : selectedStatus,
      limit: 100,
      offset: 0
    },
    fetchPolicy: 'network-only'
  });

  const { data: statsData, refetch: refetchStats } = useQuery(GET_RETURN_STATS, {
    variables: { userId: supplierId }
  });

  const { data: reasonsData } = useQuery(GET_RETURN_REASONS);

  const [updateReturnStatus] = useMutation(UPDATE_RETURN_STATUS);
  const [addReturnImages] = useMutation(ADD_RETURN_IMAGES);
  const [processRefund] = useMutation(PROCESS_REFUND);

  const returns: ReturnRequest[] = data?.getSupplierReturns || [];
  const stats: ReturnStats | undefined = statsData?.getReturnStats;

  const filteredReturns = returns.filter(returnReq => 
    returnReq.returnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    returnReq.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    returnReq.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    returnReq.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusUpdate = async () => {
    if (!selectedReturn || !selectedAction) return;

    try {
      await updateReturnStatus({
        variables: {
          input: {
            returnId: selectedReturn.id,
            status: selectedAction,
            vendorNotes: vendorNotes || undefined
          }
        }
      });
      
      alert(`Return request ${selectedAction.toLowerCase()} successfully!`);
      setShowApprovalModal(false);
      setSelectedAction(null);
      setVendorNotes('');
      refetch();
      refetchStats();
    } catch (err: any) {
      console.error('Error updating return status:', err);
      alert(`Failed to update: ${err.message}`);
    }
  };

  const handleProcessRefund = async () => {
    if (!selectedReturn) return;

    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid refund amount');
      return;
    }

    try {
      await processRefund({
        variables: {
          input: {
            returnId: selectedReturn.id,
            refundAmount: amount,
            refundMethod: refundMethod,
            resolvedBy: supplierId
          }
        }
      });
      
      alert('Refund processed successfully!');
      setShowRefundModal(false);
      setRefundAmount('');
      refetch();
      refetchStats();
    } catch (err: any) {
      console.error('Error processing refund:', err);
      alert(`Failed to process refund: ${err.message}`);
    }
  };

  const handleMarkAsReceived = async (returnReq: ReturnRequest) => {
    if (!confirm('Mark this return as received? The items will be inspected.')) return;

    try {
      await updateReturnStatus({
        variables: {
          input: {
            returnId: returnReq.id,
            status: 'RECEIVED',
            vendorNotes: 'Return items received by warehouse'
          }
        }
      });
      alert('Return marked as received!');
      refetch();
      refetchStats();
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert(`Failed to update: ${err.message}`);
    }
  };

  const getTotalRefund = (returnReq: ReturnRequest) => {
    return returnReq.items.reduce((sum, item) => sum + (item.orderItem.price * item.quantity), 0);
  };

  if (loading && returns.length === 0) {
    return <VendorReturnShimmer />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-red-600 mb-2">Failed to Load Returns</h2>
          <p className="text-sm text-gray-500 mb-4">{error.message}</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <RotateCcw className="text-orange-500" />
            Return Management
          </h1>
          <p className="text-sm text-gray-500">Manage customer return requests and process refunds</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <StatCard title="Total Returns" value={stats.totalReturns} color="bg-blue-500" />
            <StatCard title="Pending" value={stats.pendingCount} color="bg-yellow-500" />
            <StatCard title="Approved" value={stats.approvedCount} color="bg-green-500" />
            <StatCard title="Rejected" value={stats.rejectedCount} color="bg-red-500" />
            <StatCard title="Completed" value={stats.completedCount} color="bg-purple-500" />
            <StatCard title="Refunded" value={formatPrice(stats.totalRefundAmount)} color="bg-indigo-500" isCurrency />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by return #, customer name, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button
              onClick={() => {
                refetch();
                refetchStats();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        {/* Returns List */}
        {filteredReturns.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
            <RotateCcw size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-500 mb-2">No Return Requests</h3>
            <p className="text-sm text-gray-400">No return requests match your filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReturns.map((returnReq) => (
              <ReturnRequestCard
                key={returnReq.id}
                returnReq={returnReq}
                onViewDetails={() => setSelectedReturn(returnReq)}
                onApprove={() => {
                  setSelectedReturn(returnReq);
                  setSelectedAction('APPROVED');
                  setShowApprovalModal(true);
                }}
                onReject={() => {
                  setSelectedReturn(returnReq);
                  setSelectedAction('REJECTED');
                  setShowApprovalModal(true);
                }}
                onMarkReceived={() => handleMarkAsReceived(returnReq)}
                onStartInspection={() => {
                  setSelectedReturn(returnReq);
                  setSelectedAction('INSPECTING');
                  setShowApprovalModal(true);
                }}
                onProcessRefund={() => {
                  setSelectedReturn(returnReq);
                  setShowRefundModal(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Approval/Rejection Modal */}
      {showApprovalModal && selectedReturn && selectedAction && (
        <ApprovalModal
          returnReq={selectedReturn}
          action={selectedAction}
          vendorNotes={vendorNotes}
          onNotesChange={setVendorNotes}
          onConfirm={handleStatusUpdate}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedAction(null);
            setVendorNotes('');
          }}
        />
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedReturn && (
        <RefundModal
          returnReq={selectedReturn}
          refundAmount={refundAmount}
          refundMethod={refundMethod}
          onAmountChange={setRefundAmount}
          onMethodChange={setRefundMethod}
          onConfirm={handleProcessRefund}
          onClose={() => {
            setShowRefundModal(false);
            setRefundAmount('');
          }}
        />
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, color, isCurrency = false }: { title: string; value: number | string; color: string; isCurrency?: boolean }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <p className="text-xs text-gray-500 mb-1">{title}</p>
      <p className={`text-xl font-bold ${isCurrency ? 'text-green-600' : 'text-gray-900'}`}>
        {isCurrency && typeof value === 'number' ? formatPrice(value) : value}
      </p>
      <div className={`w-full h-1 bg-${color} rounded-full mt-2 opacity-50`}></div>
    </div>
  );
}

// Return Request Card Component
function ReturnRequestCard({ 
  returnReq, 
  onViewDetails, 
  onApprove, 
  onReject, 
  onMarkReceived,
  onStartInspection,
  onProcessRefund
}: { 
  returnReq: ReturnRequest;
  onViewDetails: () => void;
  onApprove: () => void;
  onReject: () => void;
  onMarkReceived: () => void;
  onStartInspection: () => void;
  onProcessRefund: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const totalRefund = returnReq.items.reduce((sum, item) => sum + (item.orderItem.price * item.quantity), 0);

  const getActionButtons = () => {
    switch (returnReq.status) {
      case 'PENDING':
        return (
          <div className="flex gap-2">
            <button onClick={onApprove} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-1">
              <Check size={16} /> Approve
            </button>
            <button onClick={onReject} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-1">
              <X size={16} /> Reject
            </button>
          </div>
        );
      case 'RETURN_SHIPPED':
        return (
          <button onClick={onMarkReceived} className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1">
            <Package size={16} /> Mark as Received
          </button>
        );
      case 'RECEIVED':
        return (
          <button onClick={onStartInspection} className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-1">
            <Camera size={16} /> Start Inspection
          </button>
        );
      case 'INSPECTING':
        return (
          <button onClick={onProcessRefund} className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors flex items-center justify-center gap-1">
            <DollarSign size={16} /> Process Refund
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className={`p-4 border-b ${statusColors[returnReq.status]?.replace('text-', 'bg-').replace('800', '50') || 'bg-gray-50'}`}>
        <div className="flex justify-between items-start flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <RotateCcw size={18} className="text-orange-500" />
              <span className="font-bold text-gray-900">Return #{returnReq.returnNumber}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[returnReq.status]}`}>
                {returnReq.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar size={12} /> {formatDate(returnReq.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <User size={12} /> {returnReq.user.firstName} {returnReq.user.lastName}
              </span>
              <span className="flex items-center gap-1">
                <Package size={12} /> Order #{returnReq.order.orderNumber}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total Refund</div>
            <div className="text-lg font-bold text-green-600">{formatPrice(totalRefund)}</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={14} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Return Reason:</span>
          </div>
          <p className="text-sm text-gray-600 ml-6">{returnReq.reason}</p>
        </div>

        {returnReq.description && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle size={14} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Additional Details:</span>
            </div>
            <p className="text-sm text-gray-600 ml-6">{returnReq.description}</p>
          </div>
        )}

        {returnReq.tracking?.trackingNumber && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Truck size={14} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Return Tracking:</span>
            </div>
            <p className="text-sm text-gray-600 ml-6">{returnReq.tracking.trackingNumber}</p>
          </div>
        )}

        {/* Items Summary */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-gray-600 hover:text-gray-800 py-2 border-t border-gray-100 mt-2"
        >
          <span className="text-sm font-medium">Items ({returnReq.items.length})</span>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {expanded && (
          <div className="mt-3 space-y-3">
            {returnReq.items.map((item) => (
              <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex gap-3">
                  {item.orderItem.product[0]?.images?.[0] && (
                    <img 
                      src={item.orderItem.product[0].images[0]}
                      alt={item.orderItem.product[0].name}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">
                      {item.orderItem.product[0]?.name}
                    </h4>
                    <p className="text-xs text-gray-500">SKU: {item.orderItem.product[0]?.sku}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <span className="text-xs text-gray-500">Quantity:</span>
                        <p className="text-sm font-medium">{item.quantity}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Condition:</span>
                        <p className="text-sm">{item.condition}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">Return Reason:</span>
                      <p className="text-sm">{item.reason}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Return Images */}
            {returnReq.images.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Customer Uploaded Images:</p>
                <div className="flex gap-2 overflow-x-auto">
                  {returnReq.images.map((img) => (
                    <img
                      key={img.id}
                      src={img.imageUrl}
                      alt="Return evidence"
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80"
                      onClick={() => window.open(img.imageUrl, '_blank')}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex gap-2">
            <button
              onClick={onViewDetails}
              className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
            >
              <Eye size={16} /> View Details
            </button>
            {getActionButtons()}
          </div>
        </div>
      </div>
    </div>
  );
}

// Approval Modal Component
function ApprovalModal({ 
  returnReq, 
  action, 
  vendorNotes, 
  onNotesChange, 
  onConfirm, 
  onClose 
}: { 
  returnReq: ReturnRequest;
  action: string;
  vendorNotes: string;
  onNotesChange: (notes: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {action === 'APPROVED' ? 'Approve Return' : 
               action === 'REJECTED' ? 'Reject Return' : 
               action === 'INSPECTING' ? 'Start Inspection' : 'Update Status'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Return #{returnReq.returnNumber}</strong>
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Customer: {returnReq.user.firstName} {returnReq.user.lastName}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor Notes (Optional)
            </label>
            <textarea
              value={vendorNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder={action === 'APPROVED' ? 
                "Add instructions for customer to ship items back..." : 
                action === 'REJECTED' ? 
                "Explain why the return is being rejected..." :
                "Add inspection notes..."}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={onConfirm}
              className={`flex-1 py-2 rounded-lg font-medium text-white transition-colors ${
                action === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' :
                action === 'REJECTED' ? 'bg-red-600 hover:bg-red-700' :
                'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {action === 'APPROVED' ? 'Approve Return' : 
               action === 'REJECTED' ? 'Reject Return' : 
               'Start Inspection'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Refund Modal Component
function RefundModal({ 
  returnReq, 
  refundAmount, 
  refundMethod, 
  onAmountChange, 
  onMethodChange, 
  onConfirm, 
  onClose 
}: { 
  returnReq: ReturnRequest;
  refundAmount: string;
  refundMethod: string;
  onAmountChange: (amount: string) => void;
  onMethodChange: (method: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const totalRefund = returnReq.items.reduce((sum, item) => sum + (item.orderItem.price * item.quantity), 0);

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Process Refund</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Return #{returnReq.returnNumber}</strong>
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Customer: {returnReq.user.firstName} {returnReq.user.lastName}
            </p>
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Total Refund Amount:</span>
                <span className="text-sm font-bold text-green-600">{formatPrice(totalRefund)}</span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Refund Amount *
            </label>
            <input
              type="number"
              step="0.01"
              value={refundAmount}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder={`Enter amount (max ${totalRefund})`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Refund Method *
            </label>
            <select
              value={refundMethod}
              onChange={(e) => onMethodChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="ORIGINAL_PAYMENT">Original Payment Method</option>
              <option value="STORE_CREDIT">Store Credit</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="GCASH">GCash</option>
              <option value="PAYMAYA">PayMaya</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onConfirm}
              disabled={!refundAmount || parseFloat(refundAmount) <= 0}
              className="flex-1 bg-orange-600 text-white py-2 rounded-lg font-medium hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Process Refund
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Shimmer Loading Component
function VendorReturnShimmer() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded shimmer mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded shimmer"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="h-3 w-16 bg-gray-200 rounded shimmer mb-2"></div>
              <div className="h-6 w-20 bg-gray-200 rounded shimmer"></div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 h-10 bg-gray-200 rounded shimmer"></div>
            <div className="w-32 h-10 bg-gray-200 rounded shimmer"></div>
            <div className="w-24 h-10 bg-gray-200 rounded shimmer"></div>
          </div>
        </div>

        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex justify-between mb-3">
                <div className="space-y-2">
                  <div className="h-5 w-40 bg-gray-200 rounded shimmer"></div>
                  <div className="h-3 w-60 bg-gray-200 rounded shimmer"></div>
                </div>
                <div className="h-8 w-24 bg-gray-200 rounded shimmer"></div>
              </div>
              <div className="h-4 w-full bg-gray-200 rounded shimmer mb-2"></div>
              <div className="h-4 w-3/4 bg-gray-200 rounded shimmer"></div>
            </div>
          ))}
        </div>
      </div>

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
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
}
