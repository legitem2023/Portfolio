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
          name
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
        hasNextPage
        hasPreviousPage
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
  product: {
    name: string;
    sku: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  user: {
    id: string;
    fistName: string;
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
  hasNextPage: boolean;
  hasPreviousPage: boolean;
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

export default function OrderListComponent({ 
  initialSupplierId, 
  initialStatus 
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

  // Fetch orders
  const { loading, error, data, refetch } = useQuery(ORDER_LIST_QUERY, {
    variables: {
      filter: filters.supplierId || filters.status ? filters : undefined,
      pagination
    },
    fetchPolicy: 'cache-and-network'
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Loading orders...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-red-500 mr-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-red-800">Failed to load orders</h3>
              <p className="text-red-700 mt-1">{error.message}</p>
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders</h1>
        <p className="text-gray-600">Manage and track all orders</p>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          {/* Supplier ID Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Supplier ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={supplierIdInput}
                onChange={handleSupplierIdChange}
                placeholder="Enter supplier ID..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={applySupplierFilter}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleStatusChange(e.target.value as OrderStatus | '')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <div>
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.supplierId || filters.status) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Active filters:</span>
              {filters.supplierId && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                  Supplier: {filters.supplierId}
                  <button
                    onClick={() => {
                      const newFilters = { ...filters, supplierId: undefined };
                      setFilters(newFilters);
                      setSupplierIdInput('');
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.status && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full">
                  Status: {filters.status}
                  <button
                    onClick={() => {
                      const newFilters = { ...filters, status: undefined };
                      setFilters(newFilters);
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      {paginationInfo && (
        <div className="mb-4 text-sm text-gray-600">
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
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500">
            {filters.supplierId || filters.status 
              ? 'Try changing your filters' 
              : 'Orders will appear here once created'}
          </p>
        </div>
      ) : (
        <>
          {/* Orders Grid */}
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Order Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.orderNumber}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Placed on {formatDate(order.createdAt)} by {order.user.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        ${order.total.toFixed(2)}
                      </div>
                      <p className="text-sm text-gray-500">Total amount</p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-700 mb-3">Items</h4>
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium text-gray-900">{item.product.name}</p>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                              <span>SKU: {item.product.sku}</span>
                              <span>Qty: {item.quantity}</span>
                              {item.supplierId && (
                                <span className="bg-gray-200 px-2 py-1 rounded">
                                  Supplier: {item.supplierId}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              ${item.price.toFixed(2)} × {item.quantity}
                            </p>
                            <p className="text-sm text-gray-500">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Footer */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <div>
                        <p>Customer: {order.user.email}</p>
                        {order.payments.length > 0 && (
                          <p className="mt-1">
                            Payment: {order.payments[0].status} via {order.payments[0].method}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p>Items: {order.items.length}</p>
                        <p className="mt-1">Payments: {order.payments.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {paginationInfo && paginationInfo.totalPages > 1 && (
            <div className="mt-8">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                {/* Page Size Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Show:</span>
                  <select
                    value={pagination.pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="5">5 per page</option>
                    <option value="10">10 per page</option>
                    <option value="20">20 per page</option>
                    <option value="50">50 per page</option>
                  </select>
                </div>

                {/* Page Info */}
                <div className="text-sm text-gray-600">
                  Page {paginationInfo.page} of {paginationInfo.totalPages}
                </div>

                {/* Page Navigation */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(paginationInfo.page - 1)}
                    disabled={!paginationInfo.hasPreviousPage}
                    className={`px-4 py-2 rounded border ${
                      paginationInfo.hasPreviousPage
                        ? 'border-gray-300 hover:bg-gray-50 text-gray-700'
                        : 'border-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Previous
                  </button>
                  
                  <button
                    onClick={() => handlePageChange(paginationInfo.page + 1)}
                    disabled={!paginationInfo.hasNextPage}
                    className={`px-4 py-2 rounded border ${
                      paginationInfo.hasNextPage
                        ? 'border-gray-300 hover:bg-gray-50 text-gray-700'
                        : 'border-gray-200 text-gray-400 cursor-not-allowed'
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
