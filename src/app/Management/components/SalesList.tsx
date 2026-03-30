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
        month: 'long',
        day: 'numeric',
      });
    case 'weekly':
      const weekNumber = getWeekNumber(date);
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${formatDate(startOfWeek.toISOString())} - ${formatDate(endOfWeek.toISOString())}`;
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

// Mobile Bottom Sheet Component for Detailed Summary
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  summary: any;
  period: SummaryPeriod;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, summary, period }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl z-50 transform transition-transform animate-slide-up max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Breakdown</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Period</p>
            <p className="text-base font-semibold text-gray-900">{formatPeriodDate(summary.date, period)}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Subtotal</p>
              <p className="text-base font-semibold">{formatCurrency(summary.subtotal)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">VAT</p>
              <p className="text-base font-semibold text-orange-600">{formatCurrency(summary.vatAmount)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Shipping</p>
              <p className="text-base font-semibold">{formatCurrency(summary.totalShipping)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Commission</p>
              <p className="text-base font-semibold text-blue-600">{formatCurrency(summary.websiteEarnings)}</p>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-gray-600">Commission Rate</p>
              <p className="text-sm font-semibold text-blue-600">{Math.round(WEBSITE_EARNINGS_RATE * 100)}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 rounded-full h-2 transition-all duration-300"
                style={{ width: `${(summary.websiteEarnings / summary.grandTotal) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

// Summary Report Component - Fully Responsive
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
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  
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
    
    return { ...totals, averageOrderValue, date: selectedDate };
  }, [filteredOrders, selectedDate]);

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

  const periodOptions: { value: SummaryPeriod; label: string; icon: string }[] = [
    { value: 'daily', label: 'Day', icon: '📅' },
    { value: 'weekly', label: 'Week', icon: '📆' },
    { value: 'monthly', label: 'Month', icon: '📊' },
    { value: 'yearly', label: 'Year', icon: '📈' },
  ];

  return (
    <>
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg overflow-hidden mb-6">
        {/* Period Selector - Horizontal Scroll on Mobile */}
        <div className="px-4 pt-4 pb-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onPeriodChange(option.value)}
                className={`px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap ${
                  period === option.value
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <span className="mr-1">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Navigation */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-white/20">
          <button
            onClick={goToPrevious}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors active:scale-95 touch-manipulation"
            aria-label="Previous"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="text-center flex-1">
            <h3 className="text-base sm:text-lg font-bold text-white px-2">
              {formatPeriodDate(selectedDate, period)}
            </h3>
            <button
              onClick={goToToday}
              className="text-xs text-white/80 hover:text-white mt-1 active:scale-95 transition"
            >
              Today
            </button>
          </div>
          
          <button
            onClick={goToNext}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors active:scale-95 touch-manipulation"
            aria-label="Next"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Summary Statistics - Responsive Grid */}
        <div className="p-4 bg-white/10 backdrop-blur-sm">
          {/* Main Stats - 2x2 Grid on Mobile, 4 columns on Desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Orders</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{summary.orderCount}</p>
              <p className="text-xs text-gray-400 mt-1">{summary.itemCount} items</p>
            </div>
            
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Revenue</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 truncate">
                {formatCurrency(summary.grandTotal)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Avg {formatCurrency(summary.averageOrderValue)}</p>
            </div>
            
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Commission</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600 truncate">
                {formatCurrency(summary.websiteEarnings)}
              </p>
              <p className="text-xs text-gray-400 mt-1">{Math.round(WEBSITE_EARNINGS_RATE * 100)}%</p>
            </div>
            
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Vendors</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-600 truncate">
                {formatCurrency(summary.vendorsIncome)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Net payout</p>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/90 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">Subtotal</p>
              <p className="text-sm font-semibold">{formatCurrency(summary.subtotal)}</p>
            </div>
            <div className="bg-white/90 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">VAT</p>
              <p className="text-sm font-semibold text-orange-600">{formatCurrency(summary.vatAmount)}</p>
            </div>
            <div className="bg-white/90 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">Shipping</p>
              <p className="text-sm font-semibold">{formatCurrency(summary.totalShipping)}</p>
            </div>
          </div>

          {/* Mobile: View Details Button */}
          <button
            onClick={() => setShowBottomSheet(true)}
            className="mt-3 w-full bg-white text-blue-600 py-2 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors active:scale-95 touch-manipulation lg:hidden"
          >
            View Full Breakdown
          </button>
        </div>
      </div>

      {/* Bottom Sheet for Mobile */}
      <BottomSheet
        isOpen={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        summary={summary}
        period={period}
      />
    </>
  );
};

// Collapsible Items Component - Mobile Optimized
const CollapsibleItems: React.FC<{ items: OrderItem[] }> = ({ items }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!items || items.length === 0) {
    return <p className="text-gray-500 text-sm">No items</p>;
  }

  return (
    <div className="mt-3 border-t border-gray-200 pt-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none active:bg-gray-50 p-2 -m-2 rounded-lg touch-manipulation"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
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
              <div className="flex gap-3">
                {item.product.images && item.product.images[0] && (
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.product.name}</p>
                  <p className="text-xs text-gray-500">SKU: {item.product.sku}</p>
                  <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                    <p>
                      <span className="text-gray-500">Qty:</span> {item.quantity}
                    </p>
                    <p>
                      <span className="text-gray-500">Price:</span> {formatCurrency(item.price)}
                    </p>
                    <p className="col-span-2">
                      <span className="text-gray-500">Subtotal:</span>{' '}
                      {formatCurrency(item.quantity * item.price)}
                    </p>
                  </div>
                  {item.rider && (
                    <p className="mt-1 text-xs text-gray-500 truncate">
                      🛵 {item.rider.firstName} {item.rider.lastName}
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

// Order Card Component - Mobile Optimized
const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
  const financials = calculateOrderFinancials(order);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 mb-3">
      {/* Order Header - Always Visible */}
      <div 
        className="px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer active:bg-gray-100 transition-colors touch-manipulation"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                #{order.orderNumber}
              </h3>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {formatDate(order.createdAt)}
              </span>
            </div>
            <p className="text-sm text-gray-600 truncate mt-1">
              {order.user.firstName} {order.user.lastName}
            </p>
          </div>
          <div className="text-right">
            <p className="text-base font-bold text-green-600">
              {formatCurrency(financials.grandTotal)}
            </p>
            <p className="text-xs text-gray-500">
              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        {/* Expand/Collapse Indicator */}
        <div className="flex justify-center mt-2">
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-4 space-y-3">
          {/* Customer & Address - Scrollable on Mobile */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">Customer</p>
                <p className="text-sm text-gray-900 break-words">
                  {order.user.firstName} {order.user.lastName}
                </p>
                <p className="text-xs text-gray-500 break-all">{order.user.email}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">Shipping Address</p>
                <p className="text-sm text-gray-900 break-words">
                  {order.address.street}, {order.address.city}, {order.address.state}
                </p>
              </div>
            </div>
          </div>

          {/* Financial Summary - Horizontal Scroll on Mobile */}
          <div className="bg-gray-50 rounded-lg p-3 overflow-x-auto">
            <div className="flex gap-4 min-w-max">
              <div>
                <p className="text-xs text-gray-500 whitespace-nowrap">Subtotal</p>
                <p className="text-sm font-semibold whitespace-nowrap">{formatCurrency(financials.subtotal)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 whitespace-nowrap">VAT</p>
                <p className="text-sm font-semibold text-orange-600 whitespace-nowrap">{formatCurrency(financials.vatAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 whitespace-nowrap">Shipping</p>
                <p className="text-sm font-semibold whitespace-nowrap">{formatCurrency(financials.totalShipping)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 whitespace-nowrap">Commission</p>
                <p className="text-sm font-semibold text-green-600 whitespace-nowrap">{formatCurrency(financials.websiteEarnings)}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          <CollapsibleItems items={order.items} />

          {/* Payment Info */}
          {order.payments && order.payments.length > 0 && (
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="font-medium">{formatCurrency(order.payments[0].amount)}</span>
                <span className="text-gray-500">via {order.payments[0].method}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.payments[0].status)}`}>
                  {order.payments[0].status}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main SalesList Component - Fully Responsive
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

  const allOrders = data?.orderlist.orders || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center mx-4">
        <p className="text-red-600 mb-3">Error loading orders: {error.message}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors active:scale-95 touch-manipulation"
        >
          Retry
        </button>
      </div>
    );
  }

  const orders = data?.orderlist.orders || [];
  const pagination = data?.orderlist.pagination;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header - Responsive */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Sales Orders</h1>
            {pagination && (
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {pagination.total} orders • Page {pagination.page} of {pagination.totalPages}
              </p>
            )}
            <div className="flex flex-wrap gap-2 text-xs text-gray-400 mt-1">
              <span>VAT: {Math.round(VAT_RATE * 100)}%</span>
              <span>Commission: {Math.round(WEBSITE_EARNINGS_RATE * 100)}%</span>
            </div>
          </div>
          
          <button
            onClick={() => setShowSummary(!showSummary)}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors active:scale-95 touch-manipulation flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}

        {/* Pagination - Responsive */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-6">
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 active:scale-95 touch-manipulation"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 active:scale-95 touch-manipulation"
              >
                Next
              </button>
            </div>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
          </div>
        )}
      </div>

      {/* Add viewport meta tag for responsive scaling */}
      <style jsx global>{`
        @media (max-width: 640px) {
          html {
            font-size: 14px;
          }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .touch-manipulation {
          touch-action: manipulation;
        }
      `}</style>
    </div>
  );
};

export default SalesList;
