'use client';

import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';

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
  product: Array<{  // Change this to an array
    name: string;
    sku: string;
    images: string[]
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

export default function OrderListComponent({ 
  initialSupplierId, 
  initialStatus 
}: OrderListComponentProps) {
  // State for filters
  const [filters, setFilters] = useState<OrderFilterInput>({
    supplierId: initialSupplierId,
    status: initialStatus
  });
  console.log(filters);
  // State for pagination
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10
  });

  // State for supplier input
  const [supplierIdInput, setSupplierIdInput] = useState(initialSupplierId || '');

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

  // Status color mapping
  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    SHIPPED: 'bg-indigo-100 text-indigo-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800'
  };

  // Handle filter changes
  const handleStatusChange = (status: OrderStatus | '') => {
    const newFilters = {
      ...filters,
      status: status || undefined
    };
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
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
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const clearFilters = () => {
    const newFilters = {};
    setFilters(newFilters);
    setSupplierIdInput('');
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Handle page size change
  const handlePageSizeChange = (pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, page: 1 }));
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row justify-center items-center h-48 sm:h-64">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
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
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Orders</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage and track all orders</p>
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
                className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={applySupplierFilter}
                className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
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
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm">
                    Supplier: {filters.supplierId}
                    <button
                      onClick={() => {
                        const newFilters = { ...filters, supplierId: undefined };
                        setFilters(newFilters);
                        setSupplierIdInput('');
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
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

      {/* Results Count */}
      {paginationInfo && (
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

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="text-gray-400 mb-3 sm:mb-4">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">No orders found</h3>
          <p className="text-sm text-gray-500 px-4">
            {filters.supplierId || filters.status 
              ? 'Try changing your filters' 
              : 'Orders will appear here once created'}
          </p>
        </div>
      ) : (
        <>
          {/* Orders Grid */}
          <div className="space-y-3 sm:space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-4 sm:p-6">
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                          Order #{order.orderNumber}
                        </h3>
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]} self-start sm:self-auto`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">
                        Placed on {formatDate(order.createdAt)} by {order.user.firstName}
                      </p>
                    </div>
                    
                  </div>

                  {/* Order Items */}
                  <div className="border-t border-gray-200 pt-3 sm:pt-4">
                    <h4 className="font-medium text-gray-700 text-sm sm:text-base mb-2 sm:mb-3">Items</h4>
                    <div className="space-y-2 sm:space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex flex-col justify-between gap-2 sm:gap-4 p-2 sm:p-3 bg-gray-50 rounded">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.product[0].name}</p>
                            <div className="flex flex-col flex-wrap  gap-2 mt-1 text-xs sm:text-sm text-gray-600">
                              <span className="truncate">SKU: {item.product[0].sku}</span>
                              <span className="hidden sm:inline">•</span>
                              <span>Qty: {item.quantity}</span>
                              {item.supplierId && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <span className="bg-gray-200 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded truncate max-w-[150px]">
                                    Supplier: {item.supplierId}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right sm:text-left">
                            <p className="font-medium text-gray-900 text-sm sm:text-base">
                              {formatCurrency(item.price)} × {item.quantity}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500">
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Footer */}
                  <div className="border-t border-gray-200 pt-3 sm:pt-4 mt-3 sm:mt-4">
                    <div className="flex flex-col sm:flex-col justify-between gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                      <div className="text-right w-full sm:w-auto">
                      <div className="text-xl sm:text-2xl font-bold text-gray-900">
                        {formatCurrency(order.total)}
                      </div>
                        <p className="text-xs sm:text-sm text-gray-500">Total amount</p>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-3 flex-1 min-w-0">
                        <p className="truncate">Customer: {order.user.email}</p>
                        {order.payments.length > 0 && (
                          <p className="mt-1 truncate">
                            Payment: {order.payments[0].status} via {order.payments[0].method}
                          </p>
                        )}
                      </div>
                      <div className="flex sm:block justify-between sm:text-right">
                        <p>Items: {order.items.length}</p>
                        <p>Payments: {order.payments.length}</p>
                      </div>
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
                {/* Page Size Selector */}
                <div className="flex items-center gap-2 order-2 sm:order-1">
                  <span className="text-xs sm:text-sm text-gray-600">Show:</span>
                  <select
                    value={pagination.pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded"
                  >
                    <option value="5">5 per page</option>
                    <option value="10">10 per page</option>
                    <option value="20">20 per page</option>
                    <option value="50">50 per page</option>
                  </select>
                </div>

                {/* Page Info */}
                <div className="text-xs sm:text-sm text-gray-600 order-1 sm:order-2">
                  Page {paginationInfo.page} of {paginationInfo.totalPages}
                </div>

                {/* Page Navigation */}
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
