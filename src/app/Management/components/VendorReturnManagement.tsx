// components/VendorReturnManagement.tsx
"use client";
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { useState, useEffect } from 'react';
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
  Send,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Star,
  TrendingUp,
  Award,
  Zap,
  Shield,
  Phone,
  Mail,
  MapPin,
  Info,
  Image as ImageIcon,
  CreditCard,
  Receipt
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

interface ProductInfo {
  name: string;
  sku: string;
  images: string[];
}

interface OrderItemInfo {
  id: string;
  quantity: number;
  price: number;
  product: ProductInfo;
}

interface ReturnItem {
  id: string;
  quantity: number;
  reason: string;
  condition: string;
  refundAmount?: number;
  orderItem: OrderItemInfo;
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
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  APPROVED: 'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  RETURN_SHIPPED: 'bg-blue-50 text-blue-700 border-blue-200',
  RECEIVED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  INSPECTING: 'bg-purple-50 text-purple-700 border-purple-200',
  REFUND_INITIATED: 'bg-orange-50 text-orange-700 border-orange-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-gray-50 text-gray-700 border-gray-200'
};

const statusOptions = [
  { value: 'ALL', label: 'All Returns', icon: '📋' },
  { value: 'PENDING', label: 'Pending', icon: '⏳' },
  { value: 'APPROVED', label: 'Approved', icon: '✅' },
  { value: 'REJECTED', label: 'Rejected', icon: '❌' },
  { value: 'RETURN_SHIPPED', label: 'Return Shipped', icon: '📦' },
  { value: 'RECEIVED', label: 'Received', icon: '📥' },
  { value: 'INSPECTING', label: 'Inspecting', icon: '🔍' },
  { value: 'REFUND_INITIATED', label: 'Refund Initiated', icon: '💰' },
  { value: 'COMPLETED', label: 'Completed', icon: '✓' },
  { value: 'CANCELLED', label: 'Cancelled', icon: '✗' }
];

const formatPrice = (amount: number): string => {
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function VendorReturnManagement({ supplierId }: { supplierId: string }) {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [vendorNotes, setVendorNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMethod, setRefundMethod] = useState('ORIGINAL_PAYMENT');
  const [transactionId, setTransactionId] = useState('');
  const [selectedAction, setSelectedAction] = useState<'APPROVED' | 'REJECTED' | 'RECEIVED' | 'INSPECTING' | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Close modals on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowApprovalModal(false);
        setShowRefundModal(false);
        setShowDetailsModal(false);
        setIsFilterOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Prevent body scroll when modals are open
  useEffect(() => {
    if (showApprovalModal || showRefundModal || showDetailsModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showApprovalModal, showRefundModal, showDetailsModal]);

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

  const [updateReturnStatus] = useMutation(UPDATE_RETURN_STATUS);
  const [processRefund] = useMutation(PROCESS_REFUND);

  const returns: ReturnRequest[] = data?.getSupplierReturns || [];
  const stats: ReturnStats | undefined = statsData?.getReturnStats;

  const filteredReturns = returns.filter(returnReq => 
    returnReq.returnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    returnReq.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    returnReq.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    returnReq.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredReturns.length / itemsPerPage);
  const paginatedReturns = filteredReturns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
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

    if (!transactionId.trim()) {
      alert('Please enter a transaction ID');
      return;
    }

    try {
      await processRefund({
        variables: {
          input: {
            returnId: selectedReturn.id,
            refundAmount: amount,
            refundMethod: refundMethod,
            resolvedBy: supplierId,
            transactionId: transactionId
          }
        }
      });
      
      alert('Refund processed successfully!');
      setShowRefundModal(false);
      setRefundAmount('');
      setTransactionId('');
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
      refetch();
      refetchStats();
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert(`Failed to update: ${err.message}`);
    }
  };

  const getProductInfo = (product: any): ProductInfo => {
    if (!product) {
      return { name: 'Product Unavailable', sku: 'N/A', images: [] };
    }
    return {
      name: product.name || 'Product Unavailable',
      sku: product.sku || 'N/A',
      images: product.images || []
    };
  };

  if (loading && returns.length === 0) {
    return <VendorReturnShimmer />;
  }
console.log(data);
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full text-center transform transition-all">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={40} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Failed to Load Returns</h2>
          <p className="text-sm text-gray-500 mb-6">{error.message}</p>
          <button 
            onClick={() => refetch()}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transform transition-all active:scale-95"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 md:py-8">
        {/* Header - Responsive */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <RotateCcw size={18} className="text-white" />
                </div>
                Return Management
              </h1>
              <p className="text-sm text-gray-500">Manage customer return requests and process refunds</p>
            </div>
            
            {/* View Toggle for Mobile */}
            <div className="flex gap-2 sm:hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'list' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                <List size={16} className="inline mr-1" /> List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                <Grid size={16} className="inline mr-1" /> Grid
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards - Horizontal Scroll on Mobile */}
        {stats && (
          <div className="mb-6 md:mb-8 overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex gap-3 min-w-min md:grid md:grid-cols-3 lg:grid-cols-6 md:gap-4">
              <StatCard title="Total Returns" value={stats.totalReturns} icon="📊" color="from-blue-500 to-blue-600" />
              <StatCard title="Pending" value={stats.pendingCount} icon="⏳" color="from-yellow-500 to-yellow-600" />
              <StatCard title="Approved" value={stats.approvedCount} icon="✅" color="from-green-500 to-green-600" />
              <StatCard title="Rejected" value={stats.rejectedCount} icon="❌" color="from-red-500 to-red-600" />
              <StatCard title="Completed" value={stats.completedCount} icon="✓" color="from-purple-500 to-purple-600" />
              <StatCard title="Refunded" value={formatPrice(stats.totalRefundAmount)} icon="💰" color="from-indigo-500 to-indigo-600" isCurrency />
            </div>
          </div>
        )}

        {/* Filters - Responsive */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col gap-3">
            {/* Search Bar */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by return #, customer, or reason..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Filter Row */}
            <div className="flex gap-2">
              {/* Status Filter Button for Mobile */}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="md:hidden flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-700 text-sm font-medium"
              >
                <Filter size={16} />
                {selectedStatus === 'ALL' ? 'All Status' : statusOptions.find(s => s.value === selectedStatus)?.label}
                <ChevronDown size={14} className={`transform transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Desktop Status Select */}
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="hidden md:block px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white text-gray-700 text-sm font-medium cursor-pointer"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  refetch();
                  refetchStats();
                }}
                className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 text-gray-700 text-sm font-medium active:scale-95"
              >
                <RefreshCw size={16} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            {/* Mobile Status Filter Dropdown */}
            {isFilterOpen && (
              <div className="md:hidden bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {statusOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedStatus(option.value);
                      setIsFilterOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                      selectedStatus === option.value
                        ? 'bg-purple-50 text-purple-700 font-medium'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-2">{option.icon}</span>
                    {option.label}
                    {selectedStatus === option.value && (
                      <Check size={16} className="float-right text-purple-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Returns List/Grid */}
        {paginatedReturns.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RotateCcw size={40} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-500 mb-2">No Return Requests</h3>
            <p className="text-sm text-gray-400">No return requests match your filters.</p>
          </div>
        ) : (
          <>
            <div className={viewMode === 'grid' && typeof window !== 'undefined' && window.innerWidth < 768 ? 'grid grid-cols-1 gap-4' : 'space-y-4'}>
              {paginatedReturns.map((returnReq) => (
                viewMode === 'grid' && typeof window !== 'undefined' && window.innerWidth < 768 ? (
                  <ReturnRequestGridCard
                    key={returnReq.id}
                    returnReq={returnReq}
                    getProductInfo={getProductInfo}
                    onViewDetails={() => {
                      setSelectedReturn(returnReq);
                      setShowDetailsModal(true);
                    }}
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
                ) : (
                  <ReturnRequestCard
                    key={returnReq.id}
                    returnReq={returnReq}
                    getProductInfo={getProductInfo}
                    onViewDetails={() => {
                      setSelectedReturn(returnReq);
                      setShowDetailsModal(true);
                    }}
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
                )
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                          currentPage === pageNum
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showDetailsModal && selectedReturn && (
        <ReturnDetailsModal
          returnReq={selectedReturn}
          getProductInfo={getProductInfo}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedReturn(null);
          }}
        />
      )}

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

      {showRefundModal && selectedReturn && (
        <RefundModal
          returnReq={selectedReturn}
          refundAmount={refundAmount}
          refundMethod={refundMethod}
          transactionId={transactionId}
          onAmountChange={setRefundAmount}
          onMethodChange={setRefundMethod}
          onTransactionIdChange={setTransactionId}
          onConfirm={handleProcessRefund}
          onClose={() => {
            setShowRefundModal(false);
            setRefundAmount('');
            setTransactionId('');
          }}
        />
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon, color, isCurrency = false }: { title: string; value: number | string; icon: string; color: string; isCurrency?: boolean }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 min-w-[140px] md:min-w-0 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${color} opacity-50`}></div>
      </div>
      <p className="text-xs text-gray-500 mb-1">{title}</p>
      <p className={`text-xl font-bold ${isCurrency ? 'text-green-600' : 'text-gray-900'}`}>
        {isCurrency && typeof value === 'number' ? formatPrice(value) : value}
      </p>
      <div className={`w-full h-1 bg-gradient-to-r ${color} rounded-full mt-2`}></div>
    </div>
  );
}

// Grid Card for Mobile
function ReturnRequestGridCard({ 
  returnReq, 
  getProductInfo,
  onViewDetails, 
  onApprove, 
  onReject, 
  onMarkReceived,
  onStartInspection,
  onProcessRefund
}: { 
  returnReq: ReturnRequest;
  getProductInfo: (product: any) => ProductInfo;
  onViewDetails: () => void;
  onApprove: () => void;
  onReject: () => void;
  onMarkReceived: () => void;
  onStartInspection: () => void;
  onProcessRefund: () => void;
}) {
  const totalRefund = returnReq.items.reduce((sum, item) => sum + (item.orderItem.price * item.quantity), 0);
  const productInfo = getProductInfo(returnReq.items[0]?.orderItem.product);

  const getActionButtons = () => {
    switch (returnReq.status) {
      case 'PENDING':
        return (
          <div className="flex gap-2">
            <button onClick={onApprove} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 active:scale-95 transition-all">
              Approve
            </button>
            <button onClick={onReject} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 active:scale-95 transition-all">
              Reject
            </button>
          </div>
        );
      case 'RETURN_SHIPPED':
        return (
          <button onClick={onMarkReceived} className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 active:scale-95 transition-all">
            Mark Received
          </button>
        );
      case 'RECEIVED':
        return (
          <button onClick={onStartInspection} className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 active:scale-95 transition-all">
            Start Inspection
          </button>
        );
      case 'INSPECTING':
        return (
          <button onClick={onProcessRefund} className="w-full bg-orange-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-orange-700 active:scale-95 transition-all">
            Process Refund
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
      <div className="relative">
        {/* Status Badge */}
        <div className={`absolute top-3 right-3 z-10 px-2 py-1 rounded-full text-xs font-medium ${statusColors[returnReq.status]} border`}>
          {returnReq.status.replace('_', ' ')}
        </div>
        
        {/* Product Image */}
        {productInfo.images?.[0] ? (
          <img 
            src={productInfo.images[0]}
            alt={productInfo.name}
            className="w-full h-40 object-cover"
          />
        ) : (
          <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
            <Package size={40} className="text-gray-300" />
          </div>
        )}
        
        {/* Content */}
        <div className="p-4">
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Return #{returnReq.returnNumber}</p>
            <p className="font-semibold text-gray-800 text-sm line-clamp-2">{returnReq.reason}</p>
          </div>

          <div className="flex justify-between items-center mb-3 text-sm">
            <div className="flex items-center gap-1 text-gray-500">
              <User size={12} />
              <span className="text-xs">{returnReq.user.firstName} {returnReq.user.lastName}</span>
            </div>
            <div className="text-green-600 font-bold">{formatPrice(totalRefund)}</div>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={onViewDetails}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 active:scale-95 transition-all"
            >
              Details
            </button>
            {getActionButtons()}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Return Request Card Component (Desktop)
function ReturnRequestCard({ 
  returnReq, 
  getProductInfo,
  onViewDetails, 
  onApprove, 
  onReject, 
  onMarkReceived,
  onStartInspection,
  onProcessRefund
}: { 
  returnReq: ReturnRequest;
  getProductInfo: (product: any) => ProductInfo;
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
            <button onClick={onApprove} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-all flex items-center justify-center gap-1">
              <Check size={16} /> Approve
            </button>
            <button onClick={onReject} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-all flex items-center justify-center gap-1">
              <X size={16} /> Reject
            </button>
          </div>
        );
      case 'RETURN_SHIPPED':
        return (
          <button onClick={onMarkReceived} className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all flex items-center justify-center gap-1">
            <Package size={16} /> Mark as Received
          </button>
        );
      case 'RECEIVED':
        return (
          <button onClick={onStartInspection} className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-all flex items-center justify-center gap-1">
            <Camera size={16} /> Start Inspection
          </button>
        );
      case 'INSPECTING':
        return (
          <button onClick={onProcessRefund} className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-all flex items-center justify-center gap-1">
            <DollarSign size={16} /> Process Refund
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                <RotateCcw size={16} className="text-orange-500" />
                <span className="font-semibold text-gray-900 text-sm">#{returnReq.returnNumber}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[returnReq.status]} border`}>
                {returnReq.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
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
          <div className="text-left sm:text-right">
            <div className="text-xs text-gray-500">Total Refund</div>
            <div className="text-lg font-bold text-green-600">{formatPrice(totalRefund)}</div>
          </div>
        </div>

        {/* Reason */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={14} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Return Reason:</span>
          </div>
          <p className="text-sm text-gray-600 ml-6">{returnReq.reason}</p>
        </div>

        {/* Expand/Collapse */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-gray-600 hover:text-gray-800 py-2 border-t border-gray-100 mt-2"
        >
          <span className="text-sm font-medium">Items ({returnReq.items.length})</span>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {expanded && (
          <div className="mt-3 space-y-3">
            {returnReq.items.map((item) => {
              const productInfo = getProductInfo(item.orderItem.product);
              return (
                <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex gap-3">
                    {productInfo.images?.[0] && (
                      <img 
                        src={productInfo.images[0]}
                        alt={productInfo.name}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 text-sm line-clamp-2">
                        {productInfo.name}
                      </h4>
                      <p className="text-xs text-gray-500">SKU: {productInfo.sku}</p>
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
              );
            })}

            {/* Return Images */}
            {returnReq.images.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Customer Uploaded Images:</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {returnReq.images.map((img) => (
                    <img
                      key={img.id}
                      src={img.imageUrl}
                      alt="Return evidence"
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
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
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={onViewDetails}
              className="sm:flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-1"
            >
              <Eye size={16} /> View Details
            </button>
            <div className="sm:flex-1">
              {getActionButtons()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Return Details Modal Component
function ReturnDetailsModal({ 
  returnReq, 
  getProductInfo,
  onClose 
}: { 
  returnReq: ReturnRequest;
  getProductInfo: (product: any) => ProductInfo;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'images'>('details');
  const totalRefund = returnReq.items.reduce((sum, item) => sum + (item.orderItem.price * item.quantity), 0);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Return Details</h2>
            <p className="text-xs text-gray-500 mt-1">#{returnReq.returnNumber}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Status Bar */}
        <div className={`px-5 py-3 border-b ${statusColors[returnReq.status]?.replace('text-', 'bg-').replace('800', '50') || 'bg-gray-50'}`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[returnReq.status]} border`}>
              {returnReq.status.replace('_', ' ')}
            </span>
            <span className="text-xs text-gray-500">
              Created: {formatDate(returnReq.createdAt)}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-5 overflow-x-auto">
          {[
            { id: 'details', label: 'Details', icon: <FileText size={16} /> },
            { id: 'items', label: 'Items', icon: <Package size={16} />, count: returnReq.items.length },
            { id: 'images', label: 'Images', icon: <Camera size={16} />, count: returnReq.images.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5">
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Customer Information */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <User size={16} className="text-blue-600" />
                  Customer Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Name:</span>
                    <span className="text-gray-700 font-medium">
                      {returnReq.user.firstName} {returnReq.user.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Email:</span>
                    <span className="text-gray-700">{returnReq.user.email}</span>
                  </div>
                  {returnReq.user.phone && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Phone:</span>
                      <span className="text-gray-700">{returnReq.user.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Information */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Package size={16} className="text-green-600" />
                  Order Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Order Number:</span>
                    <span className="text-gray-700 font-medium">#{returnReq.order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Order Date:</span>
                    <span className="text-gray-700">{formatDate(returnReq.order.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Order Total:</span>
                    <span className="text-gray-700">{formatPrice(returnReq.order.total)}</span>
                  </div>
                </div>
              </div>

              {/* Return Details */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <RotateCcw size={16} className="text-purple-600" />
                  Return Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500 block mb-1">Return Reason:</span>
                    <p className="text-gray-700 bg-white/50 p-2 rounded-lg">{returnReq.reason}</p>
                  </div>
                  {returnReq.description && (
                    <div>
                      <span className="text-gray-500 block mb-1">Additional Details:</span>
                      <p className="text-gray-700 bg-white/50 p-2 rounded-lg">{returnReq.description}</p>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-white/50">
                    <span className="text-gray-500 font-medium">Total Refund Amount:</span>
                    <span className="text-green-600 font-bold text-lg">{formatPrice(totalRefund)}</span>
                  </div>
                  {returnReq.vendorNotes && (
                    <div>
                      <span className="text-gray-500 block mb-1">Vendor Notes:</span>
                      <p className="text-gray-700 bg-white/50 p-2 rounded-lg">{returnReq.vendorNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tracking Information */}
              {returnReq.tracking && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Truck size={16} className="text-orange-600" />
                    Tracking Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    {returnReq.tracking.trackingNumber && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Tracking Number:</span>
                        <span className="text-gray-700 font-mono">{returnReq.tracking.trackingNumber}</span>
                      </div>
                    )}
                    {returnReq.tracking.shippedAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Shipped Date:</span>
                        <span className="text-gray-700">{formatDate(returnReq.tracking.shippedAt)}</span>
                      </div>
                    )}
                    {returnReq.tracking.deliveredAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Delivered Date:</span>
                        <span className="text-gray-700">{formatDate(returnReq.tracking.deliveredAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'items' && (
            <div className="space-y-3">
              {returnReq.items.map((item) => {
                const productInfo = getProductInfo(item.orderItem.product);
                return (
                  <div key={item.id} className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex gap-3">
                      {productInfo.images?.[0] ? (
                        <img 
                          src={productInfo.images[0]}
                          alt={productInfo.name}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Package size={24} className="text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 text-sm mb-1">
                          {productInfo.name}
                        </h4>
                        <p className="text-xs text-gray-500 mb-2">SKU: {productInfo.sku}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-xs text-gray-500">Quantity:</span>
                            <p className="font-medium">{item.quantity}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Price:</span>
                            <p>{formatPrice(item.orderItem.price)}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Condition:</span>
                            <p className="capitalize">{item.condition.toLowerCase()}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Subtotal:</span>
                            <p className="text-green-600 font-medium">
                              {formatPrice(item.orderItem.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <span className="text-xs text-gray-500">Return Reason:</span>
                          <p className="text-sm mt-1">{item.reason}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Total Summary */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 sticky bottom-0">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Refund Amount:</span>
                  <span className="text-xl font-bold text-green-600">{formatPrice(totalRefund)}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'images' && (
            <div>
              {returnReq.images.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon size={32} className="text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500">No images uploaded by customer</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {returnReq.images.map((img) => (
                    <div
                      key={img.id}
                      className="relative group cursor-pointer overflow-hidden rounded-xl"
                      onClick={() => window.open(img.imageUrl, '_blank')}
                    >
                      <img
                        src={img.imageUrl}
                        alt={`Return evidence ${img.imageType}`}
                        className="w-full h-40 object-cover rounded-xl border border-gray-200 group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                        <Eye size={24} className="text-white" />
                      </div>
                      {img.imageType && (
                        <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                          {img.imageType.replace('_', ' ')}
                        </span>
                      )}
                      <span className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                        {formatDate(img.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Approval Modal Component (Touch Optimized)
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
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">
            {action === 'APPROVED' ? 'Approve Return' : 
             action === 'REJECTED' ? 'Reject Return' : 
             action === 'INSPECTING' ? 'Start Inspection' : 'Update Status'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-5">
            <p className="text-sm text-gray-600 mb-1">
              <strong>Return #{returnReq.returnNumber}</strong>
            </p>
            <p className="text-sm text-gray-600">
              Customer: {returnReq.user.firstName} {returnReq.user.lastName}
            </p>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor Notes (Optional)
            </label>
            <textarea
              value={vendorNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              placeholder={action === 'APPROVED' ? 
                "Add instructions for customer to ship items back..." : 
                action === 'REJECTED' ? 
                "Explain why the return is being rejected..." :
                "Add inspection notes..."}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className={`flex-1 py-3 rounded-xl font-medium text-white transition-all active:scale-95 ${
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
              className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all active:scale-95"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Refund Modal Component with Transaction ID (Touch Optimized)
function RefundModal({ 
  returnReq, 
  refundAmount, 
  refundMethod,
  transactionId,
  onAmountChange, 
  onMethodChange,
  onTransactionIdChange,
  onConfirm, 
  onClose 
}: { 
  returnReq: ReturnRequest;
  refundAmount: string;
  refundMethod: string;
  transactionId: string;
  onAmountChange: (amount: string) => void;
  onMethodChange: (method: string) => void;
  onTransactionIdChange: (id: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const totalRefund = returnReq.items.reduce((sum, item) => sum + (item.orderItem.price * item.quantity), 0);
  const maxRefund = Math.min(totalRefund, returnReq.refundAmount || totalRefund);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Process Refund</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-5">
            <p className="text-sm text-gray-600 mb-1">
              <strong>Return #{returnReq.returnNumber}</strong>
            </p>
            <p className="text-sm text-gray-600 mb-3">
              Customer: {returnReq.user.firstName} {returnReq.user.lastName}
            </p>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Maximum Refund Amount:</span>
                <span className="text-lg font-bold text-green-600">{formatPrice(maxRefund)}</span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Refund Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
              <input
                type="number"
                step="0.01"
                value={refundAmount}
                onChange={(e) => onAmountChange(e.target.value)}
                placeholder="0.00"
                max={maxRefund}
                className="w-full pl-8 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>
            {parseFloat(refundAmount) > maxRefund && (
              <p className="text-xs text-red-500 mt-1">Amount exceeds maximum refund value</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction ID *
            </label>
            <div className="relative">
              <CreditCard size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={transactionId}
                onChange={(e) => onTransactionIdChange(e.target.value)}
                placeholder="Enter transaction ID (e.g., TXN-123456789)"
                className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This is the reference ID from your payment gateway (PayPal, Stripe, GCash, etc.)
            </p>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Refund Method *
            </label>
            <select
              value={refundMethod}
              onChange={(e) => onMethodChange(e.target.value)}
              className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white"
            >
              <option value="ORIGINAL_PAYMENT">💳 Original Payment Method</option>
              <option value="STORE_CREDIT">🎁 Store Credit</option>
              <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
              <option value="GCASH">📱 GCash</option>
              <option value="PAYMAYA">📱 PayMaya</option>
            </select>
          </div>

          {/* Summary Card */}
          <div className="mb-5 p-3 bg-gray-50 rounded-xl">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Receipt size={14} />
              Refund Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Return Number:</span>
                <span className="font-mono text-gray-700">{returnReq.returnNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Order Number:</span>
                <span className="font-mono text-gray-700">{returnReq.order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="text-gray-700">{returnReq.user.firstName} {returnReq.user.lastName}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="font-medium text-gray-700">Refund Amount:</span>
                <span className="font-bold text-green-600">
                  {refundAmount ? formatPrice(parseFloat(refundAmount)) : formatPrice(0)}
                </span>
              </div>
              {transactionId && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Transaction ID:</span>
                  <span className="font-mono text-purple-600 text-xs">{transactionId}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              disabled={!refundAmount || parseFloat(refundAmount) <= 0 || parseFloat(refundAmount) > maxRefund || !transactionId.trim()}
              className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-xl font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              Process Refund
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all active:scale-95"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Header Shimmer */}
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded-lg shimmer mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded-lg shimmer"></div>
        </div>

        {/* Stats Shimmer */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="h-3 w-16 bg-gray-200 rounded shimmer mb-2"></div>
              <div className="h-7 w-20 bg-gray-200 rounded shimmer"></div>
            </div>
          ))}
        </div>

        {/* Filter Shimmer */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex gap-3">
            <div className="flex-1 h-11 bg-gray-200 rounded-xl shimmer"></div>
            <div className="w-32 h-11 bg-gray-200 rounded-xl shimmer"></div>
            <div className="w-24 h-11 bg-gray-200 rounded-xl shimmer"></div>
          </div>
        </div>

        {/* Cards Shimmer */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between mb-3">
                <div className="space-y-2 flex-1">
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
