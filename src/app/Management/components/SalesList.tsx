import React, { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

// VAT Rate from environment variable
const VAT_RATE = Number(process.env.NEXT_PUBLIC_VAT) || 0.12; // Default to 12% if not set

// Website earnings rate (6%)
const WEBSITE_EARNINGS_RATE = 0.06;

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
          lastName
          email
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
          riderId
          quantity
          price
          status
          individualShipping
          individualDistance
          trackingNumber
          product {
            name
            sku
            images
          }
          rider {
            id
            firstName
            lastName
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
          supplier {
            id
            firstName
            lastName
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

// Typescript Interfaces
interface Product {
  name: string;
  sku: string;
  images?: string[];
}

interface Rider {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  addresses?: Address[];
}

interface Supplier {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  addresses?: Address[];
}

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  lat?: number;
  lng?: number;
}

interface OrderItem {
  id: string;
  orderId: string;
  supplierId: string;
  riderId: string;
  quantity: number;
  price: number;
  status: string;
  individualShipping: number;
  individualDistance?: number;
  trackingNumber?: string;
  product: Product;
  rider?: Rider;
  supplier?: Supplier;
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  address: Address;
  items: OrderItem[];
  payments: Payment[];
}

interface Pagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface OrderListData {
  orderlist: {
    orders: Order[];
    pagination: Pagination;
  };
}

interface OrderListVariables {
  filter?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
  };
  pagination?: {
    page: number;
    pageSize: number;
  };
}

type SummaryPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

// Helper function to format currency in Philippine Peso
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Helper function to format date for different periods
const formatPeriodDate = (date: Date, period: SummaryPeriod): string => {
  switch (period) {
    case 'daily':
      return date.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    case 'weekly':
      const weekNumber = getWeekNumber(date);
      return `Week ${weekNumber}, ${date.getFullYear()}`;
    case 'monthly':
      return date.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
      });
    case 'yearly':
      return date.getFullYear().toString();
    default:
      return date.toLocaleDateString();
  }
};

// Helper to get week number
const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

// Helper function to get status badge color
const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'shipped':
      return 'bg-purple-100 text-purple-800';
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Calculate order financials
const calculateOrderFinancials = (order: Order) => {
  const subtotal = order.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const totalShipping = order.items.reduce((sum, item) => sum + (item.individualShipping || 0), 0);
  const vatAmount = subtotal * VAT_RATE;
  const grandTotal = subtotal + vatAmount + totalShipping;
  const websiteEarnings = subtotal * WEBSITE_EARNINGS_RATE;
  const vendorsIncome = subtotal - websiteEarnings;

  return {
    subtotal,
    totalShipping,
    vatAmount,
    grandTotal,
    websiteEarnings,
    vendorsIncome,
  };
};

// Summary Report Component
interface SummaryReportProps {
  orders: Order[];
  period: SummaryPeriod;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onPeriodChange: (period: SummaryPeriod) => void;
}

const SummaryReport: React.FC<SummaryReportProps> = ({
  orders,
  period,
  selectedDate,
  onDateChange,
  onPeriodChange,
}) => {
  // Filter orders based on selected period and date
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      
      switch (period) {
        case 'daily':
          return (
            orderDate.getDate() === selectedDate.getDate() &&
            orderDate.getMonth() === selectedDate.getMonth() &&
            orderDate.getFullYear() === selectedDate.getFullYear()
          );
        
        case 'weekly':
          const startOfWeek = new Date(selectedDate);
          startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
          
          return orderDate >= startOfWeek && orderDate <= endOfWeek;
        
        case 'monthly':
          return (
            orderDate.getMonth() === selectedDate.getMonth() &&
            orderDate.getFullYear() === selectedDate.getFullYear()
          );
        
        case 'yearly':
          return orderDate.getFullYear() === selectedDate.getFullYear();
        
        default:
          return true;
      }
    });
  }, [orders, period, selectedDate]);

  // Calculate summaries
  const summary = useMemo(() => {
    const totals = filteredOrders.reduce(
      (acc, order) => {
        const financials = calculateOrderFinancials(order);
        return {
          orderCount: acc.orderCount + 1,
          subtotal: acc.subtotal + financials.subtotal,
          totalShipping: acc.totalShipping + financials.totalShipping,
          vatAmount: acc.vatAmount + financials.vatAmount,
          grandTotal: acc.grandTotal + financials.grandTotal,
          websiteEarnings: acc.websiteEarnings + financials.websiteEarnings,
          vendorsIncome: acc.vendorsIncome + financials.vendorsIncome,
          itemCount: acc.itemCount + order.items.length,
        };
      },
      {
        orderCount: 0,
        subtotal: 0,
        totalShipping: 0,
        vatAmount: 0,
        grandTotal: 0,
        websiteEarnings: 0,
        vendorsIncome: 0,
        itemCount: 0,
      }
    );

    const averageOrderValue = totals.orderCount > 0 ? totals.grandTotal / totals.orderCount : 0;
    
    return { ...totals, averageOrderValue };
  }, [filteredOrders]);

  // Navigation functions
  const goToPrevious = () => {
    const newDate = new Date(selectedDate);
    switch (period) {
      case 'daily':
        newDate.setDate(selectedDate.getDate() - 1);
        break;
      case 'weekly':
        newDate.setDate(selectedDate.getDate() - 7);
        break;
      case 'monthly':
        newDate.setMonth(selectedDate.getMonth() - 1);
        break;
      case 'yearly':
        newDate.setFullYear(selectedDate.getFullYear() - 1);
        break;
    }
    onDateChange(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(selectedDate);
    switch (period) {
      case 'daily':
        newDate.setDate(selectedDate.getDate() + 1);
        break;
      case 'weekly':
        newDate.setDate(selectedDate.getDate() + 7);
        break;
      case 'monthly':
        newDate.setMonth(selectedDate.getMonth() + 1);
        break;
      case 'yearly':
        newDate.setFullYear(selectedDate.getFullYear() + 1);
        break;
    }
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const periodOptions: { value: SummaryPeriod; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 mb-8">
      {/* Header with Period Selection */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex gap-2">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onPeriodChange(option.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === option.value
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={goToPrevious}
            className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-800">
              {formatPeriodDate(selectedDate, period)}
            </h3>
            <button
              onClick={goToToday}
              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
            >
              Today
            </button>
          </div>
          
          <button
            onClick={goToNext}
            className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{summary.orderCount}</p>
          <p className="text-xs text-gray-400 mt-1">{summary.itemCount} items sold</p>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.grandTotal)}</p>
          <p className="text-xs text-gray-400 mt-1">Avg order: {formatCurrency(summary.averageOrderValue)}</p>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Website Earnings</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.websiteEarnings)}</p>
          <p className="text-xs text-gray-400 mt-1">{Math.round(WEBSITE_EARNINGS_RATE * 100)}% commission</p>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Vendors Payout</p>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.vendorsIncome)}</p>
          <p className="text-xs text-gray-400 mt-1">After commission</p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h4 className="font-semibold text-gray-700 mb-3">Financial Breakdown</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-gray-500">Subtotal</p>
            <p className="text-sm font-semibold">{formatCurrency(summary.subtotal)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">VAT ({Math.round(VAT_RATE * 100)}%)</p>
            <p className="text-sm font-semibold text-orange-600">{formatCurrency(summary.vatAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Shipping</p>
            <p className="text-sm font-semibold">{formatCurrency(summary.totalShipping)}</p>
          </div>
        </div>
        
        {/* Progress Bar for Commission */}
        {summary.grandTotal > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Website Commission</span>
              <span>{Math.round((summary.websiteEarnings / summary.grandTotal) * 100)}% of revenue</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 rounded-full h-2 transition-all duration-300"
                style={{ width: `${(summary.websiteEarnings / summary.grandTotal) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Collapsible Items Component
const CollapsibleItems: React.FC<{ items: OrderItem[] }> = ({ items }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!items || items.length === 0) {
    return <p className="text-gray-500 text-sm">No items</p>;
  }

  return (
    <div className="mt-3 border-t border-gray-200 pt-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
      >
        <span>
          {items.length} {items.length === 1 ? 'Item' : 'Items'}
        </span>
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-2 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {item.product.images && item.product.images[0] && (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{item.product.name}</p>
                      <p className="text-xs text-gray-500">SKU: {item.product.sku}</p>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <p>
                      <span className="text-gray-500">Quantity:</span> {item.quantity}
                    </p>
                    <p>
                      <span className="text-gray-500">Price:</span> {formatCurrency(item.price)}
                    </p>
                    <p>
                      <span className="text-gray-500">Subtotal:</span>{' '}
                      {formatCurrency(item.quantity * item.price)}
                    </p>
                    <p>
                      <span className="text-gray-500">Shipping:</span>{' '}
                      {formatCurrency(item.individualShipping)}
                    </p>
                    <p>
                      <span className="text-gray-500">Tracking:</span>{' '}
                      {item.trackingNumber || 'Not assigned'}
                    </p>
                    <p>
                      <span className="text-gray-500">Item Status:</span>{' '}
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </p>
                  </div>
                  {item.rider && (
                    <p className="mt-1 text-xs text-gray-500">
                      <span className="font-medium">Rider:</span> {item.rider.firstName}{' '}
                      {item.rider.lastName} ({item.rider.phone})
                    </p>
                  )}
                  {item.supplier && (
                    <p className="mt-1 text-xs text-gray-500">
                      <span className="font-medium">Supplier:</span> {item.supplier.firstName}{' '}
                      {item.supplier.lastName} ({item.supplier.phone})
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Order Card Component
const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
  const financials = calculateOrderFinancials(order);

  // Get tracking info from items that have tracking number
  const hasTracking = order.items.some((item) => item.trackingNumber);
  const trackingNumbers = order.items
    .filter((item) => item.trackingNumber)
    .map((item) => item.trackingNumber);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 mb-4">
      {/* Order Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Order #{order.orderNumber}
            </h3>
            <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                order.status
              )}`}
            >
              {order.status}
            </span>*/}
          </div>
        </div>
      </div>

      {/* Order Body */}
      <div className="p-4">
        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Customer</p>
            <p className="text-sm text-gray-900">
              {order.user.firstName} {order.user.lastName}
            </p>
            <p className="text-sm text-gray-500">{order.user.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Shipping Address</p>
            <p className="text-sm text-gray-900">
              {order.address.street}, {order.address.city}, {order.address.state}{' '}
              {order.address.zipCode}
            </p>
            <p className="text-sm text-gray-500">{order.address.country}</p>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <p className="text-xs text-gray-500">Subtotal</p>
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(financials.subtotal)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">VAT ({Math.round(VAT_RATE * 100)}%)</p>
              <p className="text-sm font-semibold text-orange-600">{formatCurrency(financials.vatAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Shipping</p>
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(financials.totalShipping)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Website Earnings ({Math.round(WEBSITE_EARNINGS_RATE * 100)}%)</p>
              <p className="text-sm font-semibold text-green-600">{formatCurrency(financials.websiteEarnings)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Vendors Income</p>
              <p className="text-sm font-semibold text-blue-600">{formatCurrency(financials.vendorsIncome)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Grand Total</p>
              <p className="text-sm font-semibold text-purple-600">{formatCurrency(financials.grandTotal)}</p>
            </div>
          </div>
        </div>

        {/* Tracking Information */}
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700 mb-1">Tracking Information</p>
          {hasTracking ? (
            <div className="space-y-1">
              {trackingNumbers.map((tracking, idx) => (
                <p key={idx} className="text-sm text-blue-600">
                  Tracking #{tracking}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No tracking information available</p>
          )}
        </div>

        {/* Collapsible Items */}
        <CollapsibleItems items={order.items} />

        {/* Payment Info */}
        {order.payments && order.payments.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">Payment</p>
            {order.payments.map((payment) => (
              <div key={payment.id} className="flex items-center gap-2 text-sm">
                <span className="font-medium">{formatCurrency(payment.amount)}</span>
                <span className="text-gray-500">via {payment.method}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    payment.status
                  )}`}
                >
                  {payment.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Main SalesList Component
interface SalesListProps {
  filter?: OrderListVariables['filter'];
  pageSize?: number;
}

const SalesList: React.FC<SalesListProps> = ({ filter, pageSize = 10 }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showSummary, setShowSummary] = useState(true);
  const [summaryPeriod, setSummaryPeriod] = useState<SummaryPeriod>('daily');
  const [summaryDate, setSummaryDate] = useState(new Date());

  const { loading, error, data, refetch } = useQuery<OrderListData, OrderListVariables>(
    ORDER_LIST_QUERY,
    {
      variables: {
        filter,
        pagination: {
          page: currentPage,
          pageSize,
        },
      },
      fetchPolicy: 'network-only',
    }
  );

  // Get all orders from all pages (for summary calculation)
  // Note: In a real app, you might want to fetch all orders or use a separate query
  const allOrders = data?.orderlist.orders || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600">Error loading orders: {error.message}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const orders = data?.orderlist.orders || [];
  const pagination = data?.orderlist.pagination;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header with Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Orders</h2>
          {pagination && (
            <p className="text-sm text-gray-500 mt-1">
              Total {pagination.total} orders • Page {pagination.page} of {pagination.totalPages}
            </p>
          )}
          <div className="flex gap-4 text-xs text-gray-400 mt-1">
            <span>VAT Rate: {Math.round(VAT_RATE * 100)}%</span>
            <span>Website Commission: {Math.round(WEBSITE_EARNINGS_RATE * 100)}%</span>
          </div>
        </div>
        <button
          onClick={() => setShowSummary(!showSummary)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {showSummary ? 'Hide Summary' : 'Show Summary'}
        </button>
      </div>

      {/* Summary Report */}
      {showSummary && allOrders.length > 0 && (
        <SummaryReport
          orders={allOrders}
          period={summaryPeriod}
          selectedDate={summaryDate}
          onDateChange={setSummaryDate}
          onPeriodChange={setSummaryPeriod}
        />
      )}

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
            disabled={currentPage === pagination.totalPages}
            className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SalesList;
