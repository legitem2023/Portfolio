import React, { useState, useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';
import Image from 'next/image';

// TypeScript interfaces based on your GraphQL schema
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
}

interface Item {
  id: string;
  quantity: number;
  price: number;
  variantInfo: string;
  product: Product;
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  transactionId: string;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  createdAt: string;
  user: User;
  address: Address;
  items: Item[];
  payments: Payment[];
}

interface Summary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  pendingOrders: number;
  completedOrders: number;
}

interface SalesListData {
  salesList: {
    orders: Order[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    summary: Summary;
  };
}

interface SalesFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  userId?: string;
}

interface SalesListVariables {
  page?: number;
  limit?: number;
  filters?: SalesFilters;
  sortBy?: string;
  sortOrder?: string;
}

// GraphQL query (you already have this)
const SALES_LIST_QUERY = gql`
  query SalesList(
    $page: Int
    $limit: Int
    $filters: SalesFilters
    $sortBy: String
    $sortOrder: String
  ) {
    salesList(
      page: $page
      limit: $limit
      filters: $filters
      sortBy: $sortBy
      sortOrder: $sortOrder
    ) {
      orders {
        id
        orderNumber
        status
        total
        subtotal
        tax
        shipping
        discount
        createdAt
        user {
          id
          firstName
          lastName
          email
          avatar
        }
        address {
          id
          street
          city
          state
          zipCode
          country
        }
        items {
          id
          quantity
          price
          variantInfo
          product {
            id
            name
            price
            images
          }
        }
        payments {
          id
          amount
          method
          status
          transactionId
          createdAt
        }
      }
      totalCount
      totalPages
      currentPage
      summary {
        totalRevenue
        totalOrders
        averageOrderValue
        pendingOrders
        completedOrders
      }
    }
  }
`;

// Helper functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getStatusBadgeColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Main Component
const SalesList: React.FC = () => {
  // State for pagination and filtering
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<SalesFilters>({});
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Apollo Client Query
  const { loading, error, data, refetch } = useQuery<SalesListData, SalesListVariables>(
    SALES_LIST_QUERY,
    {
      variables: {
        page,
        limit,
        filters,
        sortBy,
        sortOrder,
      },
      fetchPolicy: 'cache-and-network',
    }
  );

  // Refresh data when variables change
  useEffect(() => {
    refetch({ page, limit, filters, sortBy, sortOrder });
  }, [page, limit, filters, sortBy, sortOrder, refetch]);

  // Loading and error states
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p className="font-bold">Error</p>
        <p>{error.message}</p>
      </div>
    );
  }

  const salesData = data?.salesList;
  if (!salesData) return null;

  const { orders, summary, totalPages, currentPage, totalCount } = salesData;

  // Summary Cards Component
  const SummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-gray-500 text-sm font-medium">Total Revenue</div>
        <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalRevenue)}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-gray-500 text-sm font-medium">Total Orders</div>
        <div className="text-2xl font-bold text-gray-900">{summary.totalOrders}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-gray-500 text-sm font-medium">Avg Order Value</div>
        <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary.averageOrderValue)}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-gray-500 text-sm font-medium">Pending Orders</div>
        <div className="text-2xl font-bold text-yellow-600">{summary.pendingOrders}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-gray-500 text-sm font-medium">Completed Orders</div>
        <div className="text-2xl font-bold text-green-600">{summary.completedOrders}</div>
      </div>
    </div>
  );

  // Filters Component
  const Filters = () => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={filters.startDate || ''}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={filters.endDate || ''}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined })}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Items per page</label>
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>
      
      <div className="flex justify-end mt-4">
        <button
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 mr-2"
          onClick={() => setFilters({})}
        >
          Clear Filters
        </button>
      </div>
    </div>
  );

  // Order Item Component
  const OrderItem = ({ order }: { order: Order }) => (
    <div className="bg-white rounded-lg shadow mb-4 overflow-hidden">
      {/* Order Header */}
      <div 
        className="p-6 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-semibold">#{order.orderNumber}</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(order.status)}`}>
                {order.status.toUpperCase()}
              </span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {formatDate(order.createdAt)}
            </div>
            <div className="mt-2 text-sm">
              <span className="font-medium">Customer: </span>
              {order.user.firstName} {order.user.lastName}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(order.total)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
            </div>
            <div className="mt-2 text-sm">
              <span className="font-medium">Payment: </span>
              {order.payments[0]?.method || 'N/A'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Expanded Details */}
      {expandedOrder === order.id && (
        <div className="border-t border-gray-200 p-6">
          {/* Customer Info */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-3">Customer Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Name</div>
                <div className="font-medium">{order.user.firstName} {order.user.lastName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="font-medium">{order.user.email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Shipping Address</div>
                <div className="font-medium">
                  {order.address.street}, {order.address.city}, {order.address.state} {order.address.zipCode}
                </div>
              </div>
            </div>
          </div>
          
          {/* Order Items */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-3">Order Items</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          {item.product.images && item.product.images[0] && (
                            <div className="h-10 w-10 flex-shrink-0 mr-3">
                              <Image
                                src={item.product.images[0]}
                                alt={item.product.name}
                                width={40}
                                height={40}
                                className="rounded"
                              />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{item.product.name}</div>
                            {item.variantInfo && (
                              <div className="text-sm text-gray-500">{item.variantInfo}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">Order Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>{formatCurrency(order.shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span className="text-red-600">-{formatCurrency(order.discount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-medium text-gray-900">Total</span>
                  <span className="font-bold text-gray-900">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
            
            {/* Payment Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">Payment Information</h4>
              {order.payments.length > 0 ? (
                order.payments.map((payment) => (
                  <div key={payment.id} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Method</span>
                      <span className="font-medium">{payment.method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(payment.status)}`}>
                        {payment.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction ID</span>
                      <span className="font-mono text-sm">{payment.transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Paid On</span>
                      <span>{formatDate(payment.createdAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500">No payment information available</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Pagination Component
  const Pagination = () => (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-medium">{Math.min(page * limit, totalCount)}</span> of{' '}
            <span className="font-medium">{totalCount}</span> results
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    page === pageNum
                      ? 'bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sales Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage and monitor your sales orders</p>
        </header>
        
        <SummaryCards />
        <Filters />
        
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
            <div className="flex space-x-2">
              <select
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="createdAt">Order Date</option>
                <option value="total">Order Total</option>
                <option value="orderNumber">Order Number</option>
              </select>
              <button
                className="px-3 py-2 text-sm border border-gray-300 rounded-md"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">Try adjusting your filters to find what youre looking for.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderItem key={order.id} order={order} />
              ))}
            </div>
            <Pagination />
          </>
        )}
      </div>
    </div>
  );
};

export default SalesList;
