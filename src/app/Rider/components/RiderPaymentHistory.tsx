// components/RiderPaymentHistory.tsx
import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { 
  Clock, 
  DollarSign, 
  Package, 
  ShoppingBag, 
  ChevronLeft, 
  ChevronRight,
  CreditCard,
  Wallet,
  Landmark,
  CircleDollarSign,
  Mail,
  User
} from 'lucide-react';

// Updated query - removed order status from being relied upon
export const ACTIVE_ORDER_LIST_PAYMENTS = gql`
  query ActiveOrder(
    $filter: OrderFilterInput
    $pagination: OrderPaginationInput
  ) {
    riderPayments(filter: $filter, pagination: $pagination) {
      orders {
        id
        orderNumber
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

// Item status enum - exactly as provided
enum ItemStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
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
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
  deliveredItemsTotal: number;
  pendingItemsTotal: number;
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

// Summary Cards Component
const PaymentSummaryCards = ({ summary }: { summary: PaymentSummary }) => {
  const cards = [
    {
      title: "Today's Earnings",
      amount: summary.todayEarnings,
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      icon: <Clock className="w-5 h-5 sm:w-6 sm:h-6" />,
    },
    {
      title: 'Total Earnings',
      amount: summary.totalEarnings,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      icon: <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />,
    },
    {
      title: 'Pending Amount',
      amount: summary.pendingPayments,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
      icon: <Clock className="w-5 h-5 sm:w-6 sm:h-6" />,
    },
    {
      title: 'Delivered Orders',
      amount: summary.deliveredOrders,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
      isCount: true,
      subtitle: `Total Orders: ${summary.totalOrders}`,
      icon: <Package className="w-5 h-5 sm:w-6 sm:h-6" />,
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
const MobilePaymentCard = ({ payment, formatCurrency, formatDate, getPaymentMethodIcon }: any) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm">
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="text-sm font-semibold text-gray-900">
            #{payment.orderNumber}
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
        <span className="text-xs text-gray-500">Delivered:</span>
        <span className="text-sm font-semibold text-green-600">{formatCurrency(payment.deliveredItemsTotal)}</span>
      </div>
      {payment.pendingItemsTotal > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Pending:</span>
          <span className="text-sm font-semibold text-yellow-600">{formatCurrency(payment.pendingItemsTotal)}</span>
        </div>
      )}
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Customer:</span>
        <span className="text-sm text-gray-900 text-right flex-1 ml-2 flex items-center justify-end gap-1">
          <User className="w-3 h-3" />
          {payment.customerName || 'N/A'}
        </span>
      </div>
      {payment.customerEmail && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Email:</span>
          <span className="text-xs text-gray-600 text-right flex-1 ml-2 break-words flex items-center justify-end gap-1">
            <Mail className="w-3 h-3" />
            {payment.customerEmail}
          </span>
        </div>
      )}
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Payment Method:</span>
        <span className="text-sm text-gray-900 flex items-center gap-1">
          {getPaymentMethodIcon(payment.method)}
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
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  // Build filter for orders
  const buildOrderFilter = () => {
    const filter: any = {};
    
    if (riderId) {
      filter.supplierId = riderId;
    }

    return filter;
  };

  // Query orders
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

  // Process orders based ONLY on item statuses
  useEffect(() => {
    if (data?.riderPayments?.orders) {
      const orders = data.riderPayments.orders;
      
      const extractedPayments: Payment[] = [];
      let totalEarnings = 0;
      let todayEarnings = 0;
      let totalPendingAmount = 0;
      let deliveredOrdersCount = 0;
      
      const uniqueOrders = new Set();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      orders.forEach((order: any) => {
        uniqueOrders.add(order.id);
        
        // Calculate item totals based on status
        let deliveredItemsTotal = 0;
        let pendingItemsTotal = 0;
        let hasDeliveredItems = false;
        
        if (order.items && order.items.length > 0) {
          order.items.forEach((item: any) => {
            const itemTotal = item.price * item.quantity;
            
            if (item.status === ItemStatus.DELIVERED) {
              deliveredItemsTotal += itemTotal;
              hasDeliveredItems = true;
            } else if (item.status === ItemStatus.PENDING || item.status === ItemStatus.PROCESSING) {
              pendingItemsTotal += itemTotal;
            }
          });
        }
        
        // Count as delivered order if has at least one delivered item
        if (hasDeliveredItems) {
          deliveredOrdersCount++;
        }
        
        // Process payments
        if (order.payments && order.payments.length > 0) {
          order.payments.forEach((payment: any) => {
            extractedPayments.push({
              id: payment.id,
              amount: payment.amount,
              method: payment.method,
              orderId: order.id,
              orderNumber: order.orderNumber,
              createdAt: order.createdAt,
              customerName: order.user ? 
                `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() : undefined,
              customerEmail: order.user?.email,
              deliveredItemsTotal,
              pendingItemsTotal,
            });
            
            // Calculate earnings based ONLY on delivered items
            if (deliveredItemsTotal > 0) {
              totalEarnings += deliveredItemsTotal;
              
              const orderDate = new Date(order.createdAt);
              if (orderDate >= today) {
                todayEarnings += deliveredItemsTotal;
              }
            }
            
            // Calculate pending amounts based ONLY on pending items
            if (pendingItemsTotal > 0) {
              totalPendingAmount += pendingItemsTotal;
            }
          });
        } else if (order.total) {
          extractedPayments.push({
            id: order.id,
            amount: order.total,
            method: 'UNKNOWN',
            orderId: order.id,
            orderNumber: order.orderNumber,
            createdAt: order.createdAt,
            customerName: order.user ? 
              `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() : undefined,
            customerEmail: order.user?.email,
            deliveredItemsTotal,
            pendingItemsTotal,
          });
          
          if (deliveredItemsTotal > 0) {
            totalEarnings += deliveredItemsTotal;
            
            const orderDate = new Date(order.createdAt);
            if (orderDate >= today) {
              todayEarnings += deliveredItemsTotal;
            }
          }
          
          if (pendingItemsTotal > 0) {
            totalPendingAmount += pendingItemsTotal;
          }
        }
      });

      // Sort by date (newest first)
      extractedPayments.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setPayments(extractedPayments);
      setSummary({
        totalEarnings,
        todayEarnings,
        pendingPayments: totalPendingAmount,
        completedPayments: totalEarnings,
        deliveredOrders: deliveredOrdersCount,
        totalOrders: uniqueOrders.size,
      });

      if (data.riderPayments.pagination) {
        setPagination({
          page: data.riderPayments.pagination.page || 1,
          pageSize: data.riderPayments.pagination.pageSize || 10,
          total: data.riderPayments.pagination.total || 0,
          totalPages: data.riderPayments.pagination.totalPages || 0,
        });
      }
    }
  }, [data]);

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
    refetch();
  };

  const getPaymentMethodIcon = (method: string) => {
    const methodLower = method?.toLowerCase() || '';
    
    if (methodLower.includes('card') || methodLower === 'card') {
      return <CreditCard className="w-4 h-4" />;
    } else if (methodLower.includes('cash')) {
      return <Wallet className="w-4 h-4" />;
    } else if (methodLower.includes('bank')) {
      return <Landmark className="w-4 h-4" />;
    } else if (methodLower.includes('online')) {
      return <CircleDollarSign className="w-4 h-4" />;
    }
    
    return <CreditCard className="w-4 h-4" />;
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

  if(error) return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-center py-12 text-red-600 px-4">
        Error loading payments: {error.message}
      </div>
    </div>
  );

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Rider Payment History</h2>
        </div>
        {riderId && (
          <p className="text-xs sm:text-sm text-gray-500 mt-2">Rider ID: {riderId}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">Based on delivered items only</p>
      </div>

      {/* Summary Cards */}
      {showSummary && <PaymentSummaryCards summary={summary} />}

      {/* Payments List */}
      {payments.length === 0 ? (
        <div className="text-center py-12 text-gray-500 px-4">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm">No payment records found for this rider</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivered</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
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
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {payment.customerName || 'N/A'}
                      </div>
                      {payment.customerEmail && (
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <Mail className="w-3 h-3" />
                          {payment.customerEmail}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      {formatCurrency(payment.deliveredItemsTotal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-yellow-600">
                      {payment.pendingItemsTotal > 0 ? formatCurrency(payment.pendingItemsTotal) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        {getPaymentMethodIcon(payment.method)}
                        {payment.method}
                      </span>
                    </td>
                  </td>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden px-4 py-2">
            {payments.map((payment) => (
              <MobilePaymentCard
                key={payment.id}
                payment={payment}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                getPaymentMethodIcon={getPaymentMethodIcon}
              />
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
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
                className="px-2 sm:px-3 py-1 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-gray-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-2 sm:px-3 py-1 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
               }
