// components/RiderPaymentHistory.tsx
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';

// GraphQL Queries and Mutations
export const RIDER_PAYMENTS_QUERY = gql`
  query RiderPayments(
    $riderId: ID
    $filter: PaymentFilterInput
    $pagination: PaginationInput
  ) {
    riderPayments(riderId: $riderId, filter: $filter, pagination: $pagination) {
      payments {
        id
        amount
        status
        type
        createdAt
        paidAt
        delivery {
          id
          status
          completedAt
          order {
            id
            orderNumber
            total
          }
        }
      }
      summary {
        totalEarnings
        pendingAmount
        paidAmount
        upcomingPayout
        nextPayoutDate
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

export const REQUEST_PAYOUT_MUTATION = gql`
  mutation RequestPayout($riderId: ID!) {
    requestPayout(riderId: $riderId) {
      success
      message
      requestedAmount
      estimatedPaymentDate
    }
  }
`;

// Types
export type RiderPayment = {
  id: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED';
  type: 'DELIVERY_FEE' | 'BONUS' | 'TIP' | 'ADJUSTMENT';
  createdAt: string;
  paidAt?: string;
  delivery?: {
    id: string;
    status: string;
    completedAt: string;
    order: {
      id: string;
      orderNumber: string;
      total: number;
    };
  };
};

export type PaymentSummary = {
  totalEarnings: number;
  pendingAmount: number;
  paidAmount: number;
  upcomingPayout: number;
  nextPayoutDate: string;
};

export type PaymentFilters = {
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
};

export type PaginationState = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

interface RiderPaymentHistoryProps {
  riderId?: string;
  showSummary?: boolean;
  allowPayoutRequest?: boolean;
  onPayoutRequested?: (data: any) => void;
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
      title: 'Pending Amount',
      amount: summary.pendingAmount,
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
      title: 'Paid Amount',
      amount: summary.paidAmount,
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
      title: 'Upcoming Payout',
      amount: summary.upcomingPayout,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
      subtitle: `Est. ${new Date(summary.nextPayoutDate).toLocaleDateString()}`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              {card.subtitle && (
                <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
              )}
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
  riderId,
  showSummary = true,
  allowPayoutRequest = false,
  onPayoutRequested,
  className = '',
}: RiderPaymentHistoryProps) {
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  // Query payments
  const { loading, error, data, refetch } = useQuery(RIDER_PAYMENTS_QUERY, {
    variables: {
      riderId,
      filter: filters,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
      },
    },
    fetchPolicy: 'network-only',
  });

  // Request payout mutation
  const [requestPayout, { loading: payoutLoading }] = useMutation(REQUEST_PAYOUT_MUTATION, {
    onCompleted: (data) => {
      if (onPayoutRequested) {
        onPayoutRequested(data.requestPayout);
      }
      alert('Payout request submitted successfully!');
    },
    onError: (error) => {
      alert(`Failed to request payout: ${error.message}`);
    },
  });

  const handleFilterChange = (newFilters: Partial<PaymentFilters>) => {
    setFilters({ ...filters, ...newFilters });
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleRequestPayout = async () => {
    if (!riderId) return;
    
    if (window.confirm('Are you sure you want to request payout for your available earnings?')) {
      await requestPayout({
        variables: { riderId },
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };

    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeBadge = (type: string) => {
    const typeColors = {
      DELIVERY_FEE: 'bg-indigo-100 text-indigo-800',
      BONUS: 'bg-purple-100 text-purple-800',
      TIP: 'bg-pink-100 text-pink-800',
      ADJUSTMENT: 'bg-orange-100 text-orange-800',
    };

    return typeColors[type as keyof typeof typeColors] || 'bg-gray-100 text-gray-800';
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

  const payments = data?.riderPayments?.payments || [];
  const summary = data?.riderPayments?.summary;
  const paginationInfo = data?.riderPayments?.pagination;

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-800">Rider Earnings & Payments</h2>
          
          <div className="flex flex-wrap gap-2">
            {/* Filter by Status */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              onChange={(e) => handleFilterChange({ status: e.target.value || undefined })}
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="PAID">Paid</option>
              <option value="FAILED">Failed</option>
            </select>

            {/* Filter by Type */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              onChange={(e) => handleFilterChange({ type: e.target.value || undefined })}
            >
              <option value="">All Types</option>
              <option value="DELIVERY_FEE">Delivery Fee</option>
              <option value="BONUS">Bonus</option>
              <option value="TIP">Tip</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </select>

            {/* Date Range */}
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              onChange={(e) => handleFilterChange({ startDate: e.target.value })}
              placeholder="Start Date"
            />
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              onChange={(e) => handleFilterChange({ endDate: e.target.value })}
              placeholder="End Date"
            />

            {/* Request Payout Button */}
            {allowPayoutRequest && summary?.pendingAmount > 0 && (
              <button
                onClick={handleRequestPayout}
                disabled={payoutLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 text-sm font-medium"
              >
                {payoutLoading ? 'Requesting...' : 'Request Payout'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {showSummary && summary && <PaymentSummaryCards summary={summary} />}

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
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment: RiderPayment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(payment.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.delivery ? (
                      <span className="font-medium">
                        #{payment.delivery.order.orderNumber}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadge(payment.type)}`}>
                      {payment.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.paidAt ? formatDate(payment.paidAt) : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.delivery ? (
                      <span className="capitalize">{payment.delivery.status}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {paginationInfo && paginationInfo.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, paginationInfo.total)} of{' '}
              {paginationInfo.total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === paginationInfo.totalPages}
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
