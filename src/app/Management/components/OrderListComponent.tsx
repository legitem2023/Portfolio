'use client';

import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { 
  Package, 
  MapPin, 
  Building, 
  User, 
  Shield, 
  Clock, 
  Navigation,
  CheckCircle,
  AlertCircle,
  Truck,
  Home,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Bell
} from "lucide-react";

// GraphQL Query
const ORDER_LIST_QUERY = gql`
  query OrderList(
    $filter: OrderFilterInput
    $pagination: OrderPaginationInput
  ) {
    orderlist(filter: $filter, pagination: $pagination) {
      orders {
        id
        orderNumber
        status
        total
        createdAt
        user {
          id
          firstName
          email
        }
        items {
          id
          supplierId
          quantity
          price
          product {
            name
            sku
            images
          }
        }
        payments {
          id
          amount
          method
          status
        }
      }
      pagination {
        total
        page
        pageSize
        totalPages
      }
    }
  }
`;

// Types
type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

interface OrderItem {
  id: string;
  supplierId?: string;
  quantity: number;
  price: number;
  product: Array<{
    name: string;
    sku: string;
    images: string[];
  }>;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    email: string;
  };
  items: OrderItem[];
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    status: string;
  }>;
}

interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface OrderListResponse {
  orders: Order[];
  pagination: PaginationInfo;
}

interface OrderFilterInput {
  supplierId?: string;
  status?: OrderStatus;
}

interface OrderPaginationInput {
  page?: number;
  pageSize?: number;
}

interface OrderListComponentProps {
  initialSupplierId?: string;
  initialStatus?: OrderStatus;
  isMobile?: boolean;
}

// Format currency function for Philippine Peso
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Status color mapping
const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-orange-100 text-orange-700',
  SHIPPED: 'bg-blue-100 text-blue-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-800'
};

export default function OrderListComponent({ 
  initialSupplierId, 
  initialStatus,
  isMobile = false
}: OrderListComponentProps) {
  // State for filters
  const [filters, setFilters] = useState<OrderFilterInput>({
    supplierId: initialSupplierId,
    status: initialStatus
  });
  
  // State for pagination
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10
  });

  // State for supplier input
  const [supplierIdInput, setSupplierIdInput] = useState(initialSupplierId || '');
  
  // State for expanded items
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // Fetch orders
  const { loading, error, data, refetch } = useQuery(ORDER_LIST_QUERY, {
    variables: {
      filter: {
        status: filters.status,
        supplierId: filters.supplierId
      },
      pagination
    },
    fetchPolicy: 'network-only'
  });

  // Status options
  const statusOptions: OrderStatus[] = [
    'PENDING',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
  ];

  // Handle filter changes
  const handleStatusChange = (status: OrderStatus | '') => {
    const newFilters = {
      ...filters,
      status: status || undefined
    };
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSupplierIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSupplierIdInput(e.target.value);
  };

  const applySupplierFilter = () => {
    const newFilters = {
      ...filters,
      supplierId: supplierIdInput.trim() || undefined
    };
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    const newFilters = {};
    setFilters(newFilters);
    setSupplierIdInput('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Handle page size change
  const handlePageSizeChange = (pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, page: 1 }));
  };

  // Toggle order items expansion
  const toggleOrderItems = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRefresh = () => {
    refetch();
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row justify-center items-center h-48 sm:h-64">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-orange-500"></div>
          <span className="ml-3 sm:ml-4 text-sm sm:text-base text-gray-600 mt-3 sm:mt-0">Loading orders...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center">
            <div className="text-red-500 mr-0 sm:mr-3 mb-2 sm:mb-0">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-medium text-red-800">Failed to load orders</h3>
              <p className="text-sm sm:text-base text-red-700 mt-1">{error.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const orderData = data?.orderlist as OrderListResponse;
  const orders = orderData?.orders || [];
  const paginationInfo = orderData?.pagination;

  // Check if there's no data
  const hasNoData = orders.length === 0;

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 sm:mb-6 lg:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 flex items-center gap-2">
            <Bell size={isMobile ? 20 : 24} className="text-orange-500" />
            <span>Orders</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Manage and track all orders</p>
        </div>
        
        {/* Quick stats */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex gap-2 text-sm">
            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
              <Package size={14} />
              {orders.length}
            </span>
          </div>
          <button 
            onClick={handleRefresh}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
            title="Refresh"
          >
            <Package size={18} />
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200 mb-4 sm:mb-6">
        <div className="flex flex-col gap-4">
          {/* Supplier ID Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Filter by Supplier ID
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={supplierIdInput}
                onChange={handleSupplierIdChange}
                placeholder="Enter supplier ID..."
                className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <button
                onClick={applySupplierFilter}
                className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Status Filter and Clear Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Filter by Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleStatusChange(e.target.value as OrderStatus | '')}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Status</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="self-end sm:self-auto">
              <button
                onClick={clearFilters}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.supplierId || filters.status) && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs sm:text-sm">
              <span className="text-gray-600 whitespace-nowrap">Active filters:</span>
              <div className="flex flex-wrap gap-2">
                {filters.supplierId && (
                  <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs sm:text-sm">
                    Supplier: {filters.supplierId}
                    <button
                      onClick={() => {
                        const newFilters = { ...filters, supplierId: undefined };
                        setFilters(newFilters);
                        setSupplierIdInput('');
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                      className="text-orange-600 hover:text-orange-800 text-sm"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.status && (
                  <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm">
                    Status: {filters.status}
                    <button
                      onClick={() => {
                        const newFilters = { ...filters, status: undefined };
                        setFilters(newFilters);
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count - Only show if there's data */}
      {paginationInfo && !hasNoData && (
        <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">
          Showing {orders.length} of {paginationInfo.total} orders
          {filters.supplierId && (
            <span> for supplier: <strong>{filters.supplierId}</strong></span>
          )}
          {filters.status && (
            <span> with status: <strong>{filters.status}</strong></span>
          )}
        </div>
      )}

      {/* No Data State - Show when orders array is empty */}
      {hasNoData ? (
        <div className="bg-gray-50 rounded-lg p-8 lg:p-12 text-center border border-gray-200">
          <Package size={isMobile ? 48 : 64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg lg:text-xl font-semibold text-gray-500 mb-2">No Data Available</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            {filters.supplierId || filters.status 
              ? 'No orders match your current filters. Try adjusting your search criteria.'
              : 'There are no orders to display at this moment.'}
          </p>
          {(filters.supplierId || filters.status) && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Orders Grid - Only render when there's data */}
          <div className="space-y-3 sm:space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow border border-indigo-200 overflow-hidden">
                {/* Header */}
                <div className="bg-indigo-50 px-3 lg:px-4 py-2 lg:py-3 border-b border-orange-100">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 lg:gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                      <span className="font-bold text-indigo-700 text-xs lg:text-sm">
                        Order #{order.orderNumber}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[order.status]}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="p-2 lg:p-6">
                  {/* Order info */}
                  <div className="flex justify-between items-start mb-3 lg:mb-4">
                    <div>
                      <div className="flex items-center gap-1 lg:gap-2 mb-1 lg:mb-2">
                        <Shield size={isMobile ? 16 : 18} className="text-blue-500" />
                        <h3 className="font-bold text-base lg:text-xl">Order #{order.orderNumber}</h3>
                      </div>
                      <div className="flex items-center gap-1 lg:gap-2 text-gray-600 mb-0.5 lg:mb-1">
                        <User size={isMobile ? 14 : 16} />
                        <span className="text-sm lg:text-base">{order.user.firstName}</span>
                      </div>
                      <div className="flex items-center gap-1 lg:gap-2 text-gray-600">
                        <Clock size={isMobile ? 14 : 16} />
                        <span className="text-sm lg:text-base">{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl lg:text-3xl font-bold text-green-600">
                        {formatCurrency(order.total)}
                      </div>
                      <p className="text-gray-500 text-xs lg:text-sm">Total amount</p>
                    </div>
                  </div>

                  {/* Items Section */}
                  <div className="border-t border-gray-200 pt-3 sm:pt-4">
                    <h4 className="font-medium text-gray-700 text-sm sm:text-base mb-2 sm:mb-3 flex items-center gap-2">
                      <Package size={isMobile ? 16 : 18} className="text-blue-500" />
                      Items ({order.items.length})
                    </h4>
                    
                    {/* Show message if order has no items */}
                    {order.items.length === 0 ? (
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-500">No items in this order</p>
                      </div>
                    ) : (
                      <div className="space-y-2 sm:space-y-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex flex-col xs:flex-row gap-2 sm:gap-3 bg-gray-50 rounded-lg p-2 sm:p-3">
                            {/* Item content - same as before */}
                            <div className="flex xs:hidden items-center gap-2">
                              {item.product[0]?.images && item.product[0].images.length > 0 && (
                                <div className="relative w-10 h-10 flex-shrink-0">
                                  <img 
                                    src={item.product[0].images[0]} 
                                    alt={item.product[0].name}
                                    className="w-full h-full object-cover rounded-lg border border-gray-200"
                                  />
                                </div>
                              )}
                              <div className="flex-1 text-right">
                                <div className="text-sm font-bold text-gray-900">
                                  {formatCurrency(item.price * item.quantity)}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-1 flex-col xs:flex-row gap-2 sm:gap-3">
                              {item.product[0]?.images && item.product[0].images.length > 0 && (
                                <div className="hidden xs:block relative w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 flex-shrink-0">
                                  <img 
                                    src={item.product[0].images[0]} 
                                    alt={item.product[0].name}
                                    className="w-full h-full object-cover rounded-lg border border-gray-200"
                                  />
                                </div>
                              )}
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col gap-0.5 sm:gap-1">
                                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                    <span className="text-[10px] sm:text-xs font-mono bg-gray-200 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-gray-700">
                                      {item.product[0]?.sku || 'N/A'}
                                    </span>
                                    <span className="text-[10px] sm:text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                      Qty: {item.quantity}
                                    </span>
                                  </div>
                                  
                                  <h4 className="text-xs sm:text-sm lg:text-base font-medium text-gray-900 truncate">
                                    {item.product[0]?.name || 'Unknown Product'}
                                  </h4>
                                </div>
                              </div>
                              
                              <div className="hidden sm:flex flex-col items-end justify-center flex-shrink-0 min-w-[80px] lg:min-w-[100px]">
                                <div className="text-sm lg:text-base font-bold text-gray-900 whitespace-nowrap">
                                  {formatCurrency(item.price * item.quantity)}
                                </div>
                                <div className="text-xs lg:text-sm text-gray-500 whitespace-nowrap">
                                  @ {formatCurrency(item.price)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Order Footer */}
                  <div className="border-t border-gray-200 pt-3 sm:pt-4 mt-3 sm:mt-4">
                    <div className="flex justify-between items-center text-xs sm:text-sm text-gray-600">
                      <p>Items: {order.items.length}</p>
                      <p>Payments: {order.payments.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {paginationInfo && paginationInfo.totalPages > 1 && (
            <div className="mt-6 sm:mt-8">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 order-2 sm:order-1">
                  <span className="text-xs sm:text-sm text-gray-600">Show:</span>
                  <select
                    value={pagination.pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="5">5 per page</option>
                    <option value="10">10 per page</option>
                    <option value="20">20 per page</option>
                    <option value="50">50 per page</option>
                  </select>
                </div>

                <div className="text-xs sm:text-sm text-gray-600 order-1 sm:order-2">
                  Page {paginationInfo.page} of {paginationInfo.totalPages}
                </div>

                <div className="flex gap-2 order-3">
                  <button
                    onClick={() => handlePageChange(paginationInfo.page - 1)}         
                    disabled={paginationInfo.page === 1}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded border ${
                      paginationInfo.page === 1 
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  
                  <button
                    onClick={() => handlePageChange(paginationInfo.page + 1)}
                    disabled={paginationInfo.page === paginationInfo.totalPages}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded border ${
                      paginationInfo.page === paginationInfo.totalPages 
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
