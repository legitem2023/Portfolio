// components/RiderPaymentHistory.tsx
import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

// ONLY using your existing query - NO new types
export const ACTIVE_ORDER_LIST = gql`
  query ActiveOrder(
    $filter: OrderFilterInput
    $pagination: OrderPaginationInput
  ) {
    activeorder(filter: $filter, pagination: $pagination) {
      orders {
        id
        orderNumber
        status
        total
        createdAt
        user {
          id
          firstName
          lastName
          email
          phone
        }
        address {
          id
          street
          city
          state
          zipCode
          country
          lat
          lng
        }
        items {
          id
          orderId
          supplierId
          quantity
          price
          status
          product {
            name
            sku
            images
          }
          supplier {
             id
             firstName
             lastName
             email
             phone
            addresses {
              street
              city
              state
              zipCode
              country
              lat
              lng
            }
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

// Types based on your existing data structure
type Payment = {
  id: string;
  amount: number;
  method: string;
  status: string;
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
};

type PaymentSummary = {
  totalEarnings: number;
  pendingPayments: number;
  completedPayments: number;
  thisWeekEarnings: number;
  thisMonthEarnings: number;
};

interface RiderPaymentHistoryProps {
  supplierId?: string; // This filters by supplier (rider)
  showSummary?: boolean;
  className?: string;
}

// Summary Cards Component
const PaymentSummaryCards = ({ summary }: { summary: PaymentSummary }) => {
  const cards = [
    {
      title: 'Total Earnings',
      amount: summary.totalEarnings,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Pending Payments',
      amount: summary.pendingPayments,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Completed Payments',
      amount: summary.completedPayments,
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'This Month',
      amount: summary.thisMonthEarnings,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${card.bgColor} border ${card.borderColor} rounded-lg p-4`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className={`text-2xl font-bold ${card.textColor}`}>
                ${card.amount.toFixed(2)}
              </p>
            </div>
            <div className={card.textColor}>{card.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Main Component
export default function RiderPaymentHistory({
  supplierId,
  showSummary = true,
  className = '',
}: RiderPaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    totalEarnings: 0,
    pendingPayments: 0,
    completedPayments: 0,
    thisWeekEarnings: 0,
    thisMonthEarnings: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  // Build filter for orders based on supplier
  const buildOrderFilter = () => {
    const filter: any = {};
    
    // If supplierId is provided, filter orders by supplier
    // Note: This depends on how your OrderFilterInput works
    // You might need to adjust this based on your actual filter structure
    if (supplierId) {
      // This is an assumption - adjust based on your actual schema
      filter.supplierId = supplierId;
    }

    return filter;
  };

  // Query orders using ONLY your existing query
  const { loading, error, data, refetch } = useQuery(ACTIVE_ORDER_LIST, {
    variables: {
      filter: buildOrderFilter(),
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
      },
    },
    fetchPolicy: 'network-only',
  });

  // Process orders to extract payment data
  useEffect(() => {
    if (data?.activeorder?.orders) {
      const orders = data.activeorder.orders;
      
      // Extract payments from orders
      const extractedPayments: Payment[] = [];
      let totalEarnings = 0;
      let pendingPayments = 0;
      let completedPayments = 0;
      let thisWeekEarnings = 0;
      let thisMonthEarnings = 0;

      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      orders.forEach((order: any) => {
        // Only process orders that have payments
        if (order.payments && order.payments.length > 0) {
          order.payments.forEach((payment: any) => {
            const orderDate = new Date(order.createdAt);
            
            // Apply status filter if set
            if (statusFilter && payment.status !== statusFilter) {
              return;
            }

            // Apply date filter if set
            if (dateFilter !== 'all') {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              if (dateFilter === 'today' && orderDate < today) {
                return;
              }
              if (dateFilter === 'week' && orderDate < startOfWeek) {
                return;
              }
              if (dateFilter === 'month' && orderDate < startOfMonth) {
                return;
              }
            }

            // Create payment object
            extractedPayments.push({
              id: payment.id,
              amount: payment.amount,
              method: payment.method,
              status: payment.status,
              orderId: order.id,
              orderNumber: order.orderNumber,
              orderStatus: order.status,
              createdAt: order.createdAt,
              customerName: order.user ? 
                `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() : undefined,
              customerEmail: order.user?.email,
            });

            // Calculate summaries
            totalEarnings += payment.amount;
            
            if (payment.status === 'PENDING') {
              pendingPayments += payment.amount;
            } else if (payment.status === 'COMPLETED') {
              completedPayments += payment.amount;
            }

            // Check if order is from this week
            if (orderDate >= startOfWeek) {
              thisWeekEarnings += payment.amount;
            }

            // Check if order is from this month
            if (orderDate >= startOfMonth) {
              thisMonthEarnings += payment.amount;
            }
          });
        }
      });

      // Sort payments by date (newest first)
      extractedPayments.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setPayments(extractedPayments);
      setSummary({
        totalEarnings,
        pendingPayments,
        completedPayments,
        thisWeekEarnings,
        thisMonthEarnings,
      });

      // Update pagination
      if (data.activeorder.pagination) {
        setPagination({
          page: data.activeorder.pagination.page || 1,
          pageSize: data.activeorder.pagination.pageSize || 10,
          total: data.activeorder.pagination.total || 0,
          totalPages: data.activeorder.pagination.totalPages || 0,
        });
      }
    }
  }, [data, statusFilter, dateFilter]);

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setPagination({ ...pagination, page: 1 });
  };

  const handleDateFilterChange = (range: 'all' | 'today' | 'week' | 'month') => {
    setDateFilter(range);
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
    refetch();
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-gray-100 text-gray-800',
    };

    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentMethodIcon = (method: string) => {
    const methods: Record<string, string> = {
      CASH: '💵',
      CARD: '💳',
      ONLINE: '🌐',
      BANK_TRANSFER: '🏦',
    };

    return methods[method] || '💰';
  };

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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-800">Payment History</h2>
          
          <div className="flex flex-wrap gap-2">
            {/* Date Range Quick Filters */}
            <button
              onClick={() => handleDateFilterChange('all')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                dateFilter === 'all' 
                  ? 'bg-blue-100 text-blue-700 border-blue-300' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => handleDateFilterChange('today')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                dateFilter === 'today' 
                  ? 'bg-blue-100 text-blue-700 border-blue-300' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handleDateFilterChange('week')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                dateFilter === 'week' 
                  ? 'bg-blue-100 text-blue-700 border-blue-300' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => handleDateFilterChange('month')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                dateFilter === 'month' 
                  ? 'bg-blue-100 text-blue-700 border-blue-300' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Month
            </button>

            {/* Status Filter */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              value={statusFilter}
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {showSummary && <PaymentSummaryCards summary={summary} />}

      {/* Payments Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">
            Error loading payments: {error.message}
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="mt-2 text-sm">No payment records found</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(payment.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{payment.orderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.customerName || 'N/A'}
                    {payment.customerEmail && (
                      <div className="text-xs text-gray-400">{payment.customerEmail}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="flex items-center">
                      <span className="mr-1">{getPaymentMethodIcon(payment.method)}</span>
                      {payment.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {payment.orderStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm font-medium text-gray-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
          }
