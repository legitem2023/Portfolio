// components/RiderPaymentHistory.tsx
import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

// Using your existing query
export const ACTIVE_ORDER_LIST_PAYMENTS = gql`
  query ActiveOrder(
    $filter: OrderFilterInput
    $pagination: OrderPaginationInput
  ) {
    riderPayments(filter: $filter, pagination: $pagination) {
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

// OrderStatus enum as provided - EXACTLY as given
enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

// Types
type Payment = {
  id: string;
  amount: number;
  method: string;
  orderId: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
};

type PaymentSummary = {
  totalEarnings: number;
  todayEarnings: number;
  pendingPayments: number;
  completedPayments: number;
  deliveredOrders: number;
  totalOrders: number;
};

interface RiderPaymentHistoryProps {
  riderId?: string;
  showSummary?: boolean;
  className?: string;
}

// Summary Cards Component - Responsive with Today's Earnings
const PaymentSummaryCards = ({ summary }: { summary: PaymentSummary }) => {
  const cards = [
    {
      title: "Today's Earnings",
      amount: summary.todayEarnings,
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Total Earnings',
      amount: summary.totalEarnings,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Pending Orders',
      amount: summary.pendingPayments,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Delivered Orders',
      amount: summary.deliveredOrders,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
      isCount: true,
      subtitle: `Total Orders: ${summary.totalOrders}`,
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 px-4 sm:px-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${card.bgColor} border ${card.borderColor} rounded-lg p-3 sm:p-4 transition-all hover:shadow-md`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{card.title}</p>
              <p className={`text-lg sm:text-2xl font-bold ${card.textColor} break-words`}>
                {card.isCount ? card.amount : `₱${card.amount.toFixed(2)}`}
              </p>
              {card.subtitle && (
                <p className="text-xs text-gray-500 mt-1 truncate">{card.subtitle}</p>
              )}
            </div>
            <div className={`${card.textColor} flex-shrink-0 ml-2`}>{card.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Mobile Card View Component
const MobilePaymentCard = ({ payment, formatCurrency, formatDate, getOrderStatusBadge, getPaymentMethodIcon }: any) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm">
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="text-sm font-semibold text-gray-900">
            #{payment.orderNumber}
          </span>
          <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getOrderStatusBadge(payment.orderStatus)}`}>
            {payment.orderStatus}
          </span>
        </div>
        <p className="text-xs text-gray-500">{formatDate(payment.createdAt)}</p>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
      </div>
    </div>
    
    <div className="border-t border-gray-100 pt-3 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Customer:</span>
        <span className="text-sm text-gray-900 text-right flex-1 ml-2">
          {payment.customerName || 'N/A'}
        </span>
      </div>
      {payment.customerEmail && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Email:</span>
          <span className="text-xs text-gray-600 text-right flex-1 ml-2 break-words">
            {payment.customerEmail}
          </span>
        </div>
      )}
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Payment Method:</span>
        <span className="text-sm text-gray-900 flex items-center gap-1">
          <span>{getPaymentMethodIcon(payment.method)}</span>
          <span>{payment.method}</span>
        </span>
      </div>
    </div>
  </div>
);

// Main Component
export default function RiderPaymentHistory({
  riderId,
  showSummary = true,
  className = '',
}: RiderPaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    totalEarnings: 0,
    todayEarnings: 0,
    pendingPayments: 0,
    completedPayments: 0,
    deliveredOrders: 0,
    totalOrders: 0,
  });
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  // Build filter for orders
  const buildOrderFilter = () => {
    const filter: any = {};
    
    // If riderId is provided, filter by supplier/rider
    if (riderId) {
      filter.supplierId = riderId;
    }

    // Add order status filter if selected
    if (orderStatusFilter) {
      filter.status = orderStatusFilter;
    }

    return filter;
  };

  // Query orders using your existing query
  const { loading, error, data, refetch } = useQuery(ACTIVE_ORDER_LIST_PAYMENTS, {
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
    if (data?.riderPayments?.orders) {
      const orders = data.riderPayments.orders;
      
      // Extract payments from orders
      const extractedPayments: Payment[] = [];
      let totalEarnings = 0;
      let todayEarnings = 0;
      let pendingOrderAmounts = 0;
      let deliveredOrders = 0;
      
      // Track unique orders for count
      const uniqueOrders = new Set();
      
      // Get today's date (start of day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      orders.forEach((order: any) => {
        uniqueOrders.add(order.id);
        
        // Count delivered orders
        if (order.status === OrderStatus.DELIVERED) {
          deliveredOrders++;
        }

        // Process order payments
        if (order.payments && order.payments.length > 0) {
          order.payments.forEach((payment: any) => {
            // Create payment object
            extractedPayments.push({
              id: payment.id,
              amount: payment.amount,
              method: payment.method,
              orderId: order.id,
              orderNumber: order.orderNumber,
              orderStatus: order.status as OrderStatus,
              createdAt: order.createdAt,
              customerName: order.user ? 
                `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() : undefined,
              customerEmail: order.user?.email,
            });

            // Calculate total earnings (all completed/delivered orders)
            if (order.status === OrderStatus.DELIVERED) {
              totalEarnings += payment.amount;
            }
            
            // Calculate today's earnings
            const orderDate = new Date(order.createdAt);
            if (orderDate >= today && (order.status === OrderStatus.DELIVERED)) {
              todayEarnings += payment.amount;
            }
            
            // Calculate pending orders (PENDING or PROCESSING status)
            if (order.status === OrderStatus.PENDING || order.status === OrderStatus.PROCESSING) {
              pendingOrderAmounts += payment.amount;
            }
          });
        } else if (order.total) {
          // If no payments array but has total, use that
          extractedPayments.push({
            id: order.id,
            amount: order.total,
            method: 'UNKNOWN',
            orderId: order.id,
            orderNumber: order.orderNumber,
            orderStatus: order.status as OrderStatus,
            createdAt: order.createdAt,
            customerName: order.user ? 
              `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() : undefined,
            customerEmail: order.user?.email,
          });
          
          // Calculate based on order total
          if (order.status === OrderStatus.DELIVERED) {
            totalEarnings += order.total;
            
            const orderDate = new Date(order.createdAt);
            if (orderDate >= today) {
              todayEarnings += order.total;
            }
          }
          
          if (order.status === OrderStatus.PENDING || order.status === OrderStatus.PROCESSING) {
            pendingOrderAmounts += order.total;
          }
        }
      });

      // Sort payments by date (newest first)
      extractedPayments.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setPayments(extractedPayments);
      setSummary({
        totalEarnings,
        todayEarnings,
        pendingPayments: pendingOrderAmounts,
        completedPayments: totalEarnings, // For completed payments
        deliveredOrders,
        totalOrders: uniqueOrders.size,
      });

      // Update pagination
      if (data.riderPayments.pagination) {
        setPagination({
          page: data.riderPayments.pagination.page || 1,
          pageSize: data.riderPayments.pagination.pageSize || 10,
          total: data.riderPayments.pagination.total || 0,
          totalPages: data.riderPayments.pagination.totalPages || 0,
        });
      }
    }
  }, [data, orderStatusFilter]);

  const handleOrderStatusFilterChange = (status: string) => {
    setOrderStatusFilter(status);
    setPagination({ ...pagination, page: 1 });
    // Refetch with new order status filter
    setTimeout(() => refetch(), 0);
  };

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
    refetch();
  };

  const getOrderStatusBadge = (status: OrderStatus) => {
    const statusColors: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [OrderStatus.PROCESSING]: 'bg-blue-100 text-blue-800',
      [OrderStatus.SHIPPED]: 'bg-purple-100 text-purple-800',
      [OrderStatus.DELIVERED]: 'bg-green-100 text-green-800',
      [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
      [OrderStatus.REFUNDED]: 'bg-gray-100 text-gray-800',
    };

    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentMethodIcon = (method: string) => {
    const methods: Record<string, string> = {
      CASH: '💵',
      CARD: '💳',
      ONLINE: '🌐',
      BANK_TRANSFER: '🏦',
      UNKNOWN: '💰',
    };

    return methods[method] || '💰';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  if(loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header - Responsive */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Rider Payment History</h2>
          
          {/* Order Status Filter Only */}
          <div className="w-full sm:w-auto">
            <select
              className="w-full sm:w-auto px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              onChange={(e) => handleOrderStatusFilterChange(e.target.value)}
              value={orderStatusFilter}
            >
              <option value="">All Order Status</option>
              {Object.values(OrderStatus).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
        {riderId && (
          <p className="text-xs sm:text-sm text-gray-500 mt-2">Rider ID: {riderId}</p>
        )}
      </div>

      {/* Summary Cards */}
      {showSummary && <PaymentSummaryCards summary={summary} />}

      {/* Payments - Responsive Table/Card View */}
      {error ? (
        <div className="text-center py-12 text-red-600 px-4">
          Error loading payments: {error.message}
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12 text-gray-500 px-4">
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
          <p className="mt-2 text-sm">No payment records found for this rider</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View - Hidden on mobile */}
          <div className="hidden md:block overflow-x-auto">
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
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getOrderStatusBadge(payment.orderStatus)}`}>
                        {payment.orderStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
             </table>
          </div>

          {/* Mobile Card View - Visible only on mobile */}
          <div className="md:hidden px-4 py-2">
            {payments.map((payment) => (
              <MobilePaymentCard
                key={payment.id}
                payment={payment}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                getOrderStatusBadge={getOrderStatusBadge}
                getPaymentMethodIcon={getPaymentMethodIcon}
              />
            ))}
          </div>
        </>
      )}

      {/* Pagination - Responsive */}
      {pagination.totalPages > 1 && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
            <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-2 sm:px-3 py-1 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-gray-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-2 sm:px-3 py-1 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
