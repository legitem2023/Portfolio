import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

// VAT Rate from environment variable
const VAT_RATE = Number(process.env.NEXT_PUBLIC_VAT) || 0.12;
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

// TypeScript Interfaces
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
type TabType = 'summary' | 'charts' | 'export' | 'compare';

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
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

// Helper function to format period date
const formatPeriodDate = (date: Date, period: SummaryPeriod): string => {
  switch (period) {
    case 'daily':
      return date.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'weekly':
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

// Export Data Type
interface ExportData {
  orderNumber: string;
  date: string;
  customer: string;
  customerEmail: string;
  subtotal: number;
  vat: number;
  shipping: number;
  commission: number;
  vendorsIncome: number;
  total: number;
  items: number;
  itemsList: string;
}

// ==================== SUMMARY TAB COMPONENT ====================
const SummaryTab: React.FC<{
  orders: Order[];
  period: SummaryPeriod;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onPeriodChange: (period: SummaryPeriod) => void;
}> = ({ orders, period, selectedDate, onDateChange, onPeriodChange }) => {
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  
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
    { value: 'daily', label: 'Daily', icon: '📅' },
    { value: 'weekly', label: 'Weekly', icon: '📆' },
    { value: 'monthly', label: 'Monthly', icon: '📊' },
    { value: 'yearly', label: 'Yearly', icon: '📈' },
  ];

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex flex-wrap gap-2">
        {periodOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onPeriodChange(option.value)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              period === option.value
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-1">{option.icon}</span>
            {option.label}
          </button>
        ))}
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm border border-gray-200">
        <button
          onClick={goToPrevious}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ←
        </button>
        <div className="text-center">
          <p className="font-semibold text-gray-900 text-sm sm:text-base">
            {formatPeriodDate(selectedDate, period)}
          </p>
          <button
            onClick={goToToday}
            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
          >
            Today
          </button>
        </div>
        <button
          onClick={goToNext}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          →
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-blue-700">{summary.orderCount}</p>
          <p className="text-xs text-gray-500 mt-1">{summary.itemCount} items sold</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-green-700 truncate">{formatCurrency(summary.grandTotal)}</p>
          <p className="text-xs text-gray-500 mt-1">Avg {formatCurrency(summary.averageOrderValue)}</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Website Earnings</p>
          <p className="text-2xl font-bold text-purple-700 truncate">{formatCurrency(summary.websiteEarnings)}</p>
          <p className="text-xs text-gray-500 mt-1">{Math.round(WEBSITE_EARNINGS_RATE * 100)}% commission</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Vendors Payout</p>
          <p className="text-2xl font-bold text-orange-700 truncate">{formatCurrency(summary.vendorsIncome)}</p>
          <p className="text-xs text-gray-500 mt-1">After commission</p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">Financial Breakdown</p>
        <div className="grid grid-cols-3 gap-3 text-center">
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
        
        {summary.grandTotal > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Commission Rate</span>
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

      {/* Mobile View Details Button */}
      <button
        onClick={() => setShowBottomSheet(true)}
        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors lg:hidden"
      >
        View Full Details
      </button>

      {/* Bottom Sheet for Mobile */}
      {showBottomSheet && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
            onClick={() => setShowBottomSheet(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl z-50 transform transition-transform animate-slide-up max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Detailed Breakdown</h3>
              <button
                onClick={() => setShowBottomSheet(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Period</p>
                <p className="text-base font-semibold text-gray-900">{formatPeriodDate(selectedDate, period)}</p>
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
            </div>
          </div>
          <style>{`
            @keyframes slide-up {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
            .animate-slide-up {
              animation: slide-up 0.3s ease-out;
            }
          `}</style>
        </>
      )}
    </div>
  );
};

// ==================== CHARTS TAB COMPONENT ====================
const ChartTab: React.FC<{ orders: Order[] }> = ({ orders }) => {
  const [chartType, setChartType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  const chartData = useMemo(() => {
    const data = new Map<string, { revenue: number; orders: number }>();
    const now = new Date();
    const last30Days = new Date();
    last30Days.setDate(now.getDate() - 30);
    
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      if (orderDate < last30Days && chartType !== 'monthly') return;
      
      let key: string;
      switch (chartType) {
        case 'daily':
          key = orderDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          break;
        case 'weekly':
          const weekNum = getWeekNumber(orderDate);
          key = `Week ${weekNum}`;
          break;
        case 'monthly':
          key = orderDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
          break;
      }
      
      const financials = calculateOrderFinancials(order);
      const existing = data.get(key) || { revenue: 0, orders: 0 };
      data.set(key, {
        revenue: existing.revenue + financials.grandTotal,
        orders: existing.orders + 1,
      });
    });
    
    return Array.from(data.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12);
  }, [orders, chartType]);
  
  const maxRevenue = Math.max(...chartData.map(d => d[1].revenue), 1);
  
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['daily', 'weekly', 'monthly'] as const).map(type => (
          <button
            key={type}
            onClick={() => setChartType(type)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              chartType === type
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type}
          </button>
        ))}
      </div>
      
      {chartData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">📊 No data available</p>
          <p className="text-sm">Try selecting a different time period</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {chartData.map(([label, { revenue, orders }]) => (
              <div key={label} className="group">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700">{label}</span>
                  <span className="text-gray-600">{formatCurrency(revenue)}</span>
                </div>
                <div className="relative w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-end px-2 text-xs text-white font-medium transition-all duration-500"
                    style={{ width: `${(revenue / maxRevenue) * 100}%` }}
                  >
                    {(revenue / maxRevenue) * 100 > 15 && `${Math.round((revenue / maxRevenue) * 100)}%`}
                  </div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-500">{orders} order{orders !== 1 ? 's' : ''}</span>
                  <span className="text-gray-500">Avg {formatCurrency(revenue / orders)}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 mt-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-xs text-blue-800 mb-1">Total Revenue</p>
                <p className="text-xl font-bold text-blue-900">
                  {formatCurrency(chartData.reduce((sum, [, val]) => sum + val.revenue, 0))}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-800 mb-1">Total Orders</p>
                <p className="text-xl font-bold text-blue-900">
                  {chartData.reduce((sum, [, val]) => sum + val.orders, 0)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ==================== EXPORT TAB COMPONENT ====================
const ExportTab: React.FC<{ orders: Order[] }> = ({ orders }) => {
  const [exportType, setExportType] = useState<'csv' | 'json'>('csv');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
    const firstDay = new Date();
    firstDay.setDate(1);
    return {
      start: firstDay.toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    };
  });
  const [isExporting, setIsExporting] = useState(false);
  
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = order.createdAt.split('T')[0];
      return orderDate >= dateRange.start && orderDate <= dateRange.end;
    });
  }, [orders, dateRange]);
  
  const exportData = useCallback(async () => {
    setIsExporting(true);
    try {
      const exportDataList: ExportData[] = filteredOrders.map(order => {
        const financials = calculateOrderFinancials(order);
        return {
          orderNumber: order.orderNumber,
          date: order.createdAt,
          customer: `${order.user.firstName} ${order.user.lastName}`,
          customerEmail: order.user.email,
          subtotal: financials.subtotal,
          vat: financials.vatAmount,
          shipping: financials.totalShipping,
          commission: financials.websiteEarnings,
          vendorsIncome: financials.vendorsIncome,
          total: financials.grandTotal,
          items: order.items.length,
          itemsList: order.items.map(i => `${i.quantity}x ${i.product.name}`).join('; '),
        };
      });
      
      let blob: Blob;
      let filename: string;
      
      if (exportType === 'csv') {
        const headers = [
          'Order #', 'Date', 'Customer', 'Email', 'Subtotal', 'VAT', 
          'Shipping', 'Commission', 'Vendors Income', 'Total', 'Items', 'Products'
        ];
        const csvRows: string[] = [headers.join(',')];
        
        exportDataList.forEach(row => {
          const values = [
            row.orderNumber,
            row.date,
            `"${row.customer}"`,
            row.customerEmail,
            row.subtotal.toString(),
            row.vat.toString(),
            row.shipping.toString(),
            row.commission.toString(),
            row.vendorsIncome.toString(),
            row.total.toString(),
            row.items.toString(),
            `"${row.itemsList.replace(/"/g, '""')}"`,
          ];
          csvRows.push(values.join(','));
        });
        
        blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        filename = `earnings_report_${dateRange.start}_to_${dateRange.end}.csv`;
      } else {
        blob = new Blob([JSON.stringify(exportDataList, null, 2)], { type: 'application/json' });
        filename = `earnings_report_${dateRange.start}_to_${dateRange.end}.json`;
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [filteredOrders, exportType, dateRange]);
  
  const summary = useMemo(() => {
    return filteredOrders.reduce((acc, order) => {
      const f = calculateOrderFinancials(order);
      return {
        orders: acc.orders + 1,
        revenue: acc.revenue + f.grandTotal,
        commission: acc.commission + f.websiteEarnings,
        items: acc.items + order.items.length,
      };
    }, { orders: 0, revenue: 0, commission: 0, items: 0 });
  }, [filteredOrders]);
  
  const setQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    });
  };
  
  return (
    <div className="space-y-4">
      {/* Quick Date Ranges */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Today', days: 0 },
          { label: 'Last 7 Days', days: 7 },
          { label: 'Last 30 Days', days: 30 },
          { label: 'This Month', isMonth: true },
        ].map((range, idx) => (
          <button
            key={idx}
            onClick={() => {
              if ('isMonth' in range && range.isMonth) {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                setDateRange({
                  start: start.toISOString().split('T')[0],
                  end: now.toISOString().split('T')[0],
                });
              } else if (range.days === 0) {
                const today = new Date().toISOString().split('T')[0];
                setDateRange({ start: today, end: today });
              } else {
                setQuickRange(range.days as number);
              }
            }}
            className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {range.label}
          </button>
        ))}
      </div>
      
      {/* Date Range Picker */}
      <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
        <p className="text-sm font-semibold mb-2">Custom Range</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-2 py-1.5 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-2 py-1.5 border rounded-lg text-sm"
            />
          </div>
        </div>
      </div>
      
      {/* Export Format */}
      <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
        <p className="text-sm font-semibold mb-2">Export Format</p>
        <div className="flex gap-2">
          <button
            onClick={() => setExportType('csv')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              exportType === 'csv'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📄 CSV
          </button>
          <button
            onClick={() => setExportType('json')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              exportType === 'json'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🔧 JSON
          </button>
        </div>
      </div>
      
      {/* Export Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3">
        <p className="text-xs text-gray-600 mb-2">Export Summary</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-gray-500">Orders</p>
            <p className="text-lg font-bold text-gray-900">{summary.orders}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Items</p>
            <p className="text-lg font-bold text-gray-900">{summary.items}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Revenue</p>
            <p className="text-lg font-bold text-green-600 truncate">{formatCurrency(summary.revenue)}</p>
          </div>
        </div>
      </div>
      
      {/* Export Button */}
      <button
        onClick={exportData}
        disabled={filteredOrders.length === 0 || isExporting}
        className={`w-full py-2.5 rounded-lg font-medium transition-all ${
          filteredOrders.length === 0 || isExporting
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {isExporting ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Exporting...
          </span>
        ) : (
          `📥 Download ${exportType.toUpperCase()} (${filteredOrders.length} orders)`
        )}
      </button>
    </div>
  );
};

// ==================== COMPARE TAB COMPONENT ====================
const CompareTab: React.FC<{ orders: Order[] }> = ({ orders }) => {
  const [compareType, setCompareType] = useState<'week' | 'month'>('week');
  
  const comparisons = useMemo(() => {
    const now = new Date();
    let currentPeriod: { start: Date; end: Date };
    let previousPeriod: { start: Date; end: Date };
    
    if (compareType === 'week') {
      const currentStart = new Date(now);
      currentStart.setDate(now.getDate() - now.getDay());
      currentStart.setHours(0, 0, 0, 0);
      const currentEnd = new Date(currentStart);
      currentEnd.setDate(currentStart.getDate() + 6);
      currentEnd.setHours(23, 59, 59, 999);
      
      const previousStart = new Date(currentStart);
      previousStart.setDate(currentStart.getDate() - 7);
      const previousEnd = new Date(previousStart);
      previousEnd.setDate(previousStart.getDate() + 6);
      previousEnd.setHours(23, 59, 59, 999);
      
      currentPeriod = { start: currentStart, end: currentEnd };
      previousPeriod = { start: previousStart, end: previousEnd };
    } else {
      const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      
      currentPeriod = { start: currentStart, end: currentEnd };
      previousPeriod = { start: previousStart, end: previousEnd };
    }
    
    const filterByDateRange = (start: Date, end: Date) => (order: Order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= start && orderDate <= end;
    };
    
    const currentOrders = orders.filter(filterByDateRange(currentPeriod.start, currentPeriod.end));
    const previousOrders = orders.filter(filterByDateRange(previousPeriod.start, previousPeriod.end));
    
    const calculateStats = (ordersList: Order[]) => {
      return ordersList.reduce((acc, order) => {
        const f = calculateOrderFinancials(order);
        return {
          orders: acc.orders + 1,
          revenue: acc.revenue + f.grandTotal,
          commission: acc.commission + f.websiteEarnings,
          vendorsIncome: acc.vendorsIncome + f.vendorsIncome,
          items: acc.items + order.items.length,
          avgOrderValue: acc.orders > 0 ? (acc.revenue + f.grandTotal) / (acc.orders + 1) : f.grandTotal,
        };
      }, { orders: 0, revenue: 0, commission: 0, vendorsIncome: 0, items: 0, avgOrderValue: 0 });
    };
    
    const currentStats = calculateStats(currentOrders);
    const previousStats = calculateStats(previousOrders);
    
    const percentChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };
    
    const formatPeriodLabel = (start: Date, end: Date, type: 'week' | 'month') => {
      if (type === 'week') {
        return `${formatDate(start.toISOString())} - ${formatDate(end.toISOString())}`;
      }
      return start.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
    };
    
    return {
      current: {
        label: formatPeriodLabel(currentPeriod.start, currentPeriod.end, compareType),
        stats: currentStats,
      },
      previous: {
        label: formatPeriodLabel(previousPeriod.start, previousPeriod.end, compareType),
        stats: previousStats,
      },
      changes: {
        orders: percentChange(currentStats.orders, previousStats.orders),
        revenue: percentChange(currentStats.revenue, previousStats.revenue),
        commission: percentChange(currentStats.commission, previousStats.commission),
        vendorsIncome: percentChange(currentStats.vendorsIncome, previousStats.vendorsIncome),
        avgOrderValue: percentChange(currentStats.avgOrderValue, previousStats.avgOrderValue),
      },
    };
  }, [orders, compareType]);
  
  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setCompareType('week')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            compareType === 'week'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Week over Week
        </button>
        <button
          onClick={() => setCompareType('month')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            compareType === 'month'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Month over Month
        </button>
      </div>
      
      {/* Comparison Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Current Period</p>
          <p className="text-xs text-gray-500 mb-2">{comparisons.current.label}</p>
          <p className="text-lg font-bold text-blue-700 truncate">{formatCurrency(comparisons.current.stats.revenue)}</p>
          <p className="text-xs text-gray-500 mt-1">{comparisons.current.stats.orders} orders</p>
          <p className="text-xs text-gray-500">{comparisons.current.stats.items} items</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Previous Period</p>
          <p className="text-xs text-gray-500 mb-2">{comparisons.previous.label}</p>
          <p className="text-lg font-bold text-gray-700 truncate">{formatCurrency(comparisons.previous.stats.revenue)}</p>
          <p className="text-xs text-gray-500 mt-1">{comparisons.previous.stats.orders} orders</p>
          <p className="text-xs text-gray-500">{comparisons.previous.stats.items} items</p>
        </div>
      </div>
      
      {/* Performance Changes */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <p className="text-sm font-semibold text-gray-900 mb-3">Performance Changes</p>
        <div className="space-y-3">
          {[
            { label: 'Total Orders', value: comparisons.changes.orders, icon: '📦', color: 'blue' },
            { label: 'Total Revenue', value: comparisons.changes.revenue, icon: '💰', color: 'green' },
            { label: 'Avg Order Value', value: comparisons.changes.avgOrderValue, icon: '📊', color: 'purple' },
            { label: 'Commission', value: comparisons.changes.commission, icon: '💸', color: 'orange' },
            { label: 'Vendors Payout', value: comparisons.changes.vendorsIncome, icon: '🏪', color: 'red' },
          ].map(item => (
            <div key={item.label} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm text-gray-700">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${item.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.value >= 0 ? '↑' : '↓'} {Math.abs(item.value).toFixed(1)}%
                </span>
                <div className="w-16 h-1.5 rounded-full overflow-hidden bg-gray-200">
                  <div
                    className={`h-full rounded-full transition-all ${item.value >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(Math.abs(item.value), 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Insight Message */}
      {comparisons.changes.revenue !== 0 && (
        <div className={`rounded-lg p-3 ${
          comparisons.changes.revenue > 0 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <p className="text-xs font-medium">
            {comparisons.changes.revenue > 0
              ? `🎉 Great! Revenue increased by ${comparisons.changes.revenue.toFixed(1)}% compared to previous ${compareType === 'week' ? 'week' : 'month'}.`
              : `📉 Revenue decreased by ${Math.abs(comparisons.changes.revenue).toFixed(1)}% compared to previous ${compareType === 'week' ? 'week' : 'month'}.`}
          </p>
        </div>
      )}
    </div>
  );
};

// Order Card Component
const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
  const [expanded, setExpanded] = useState(false);
  const financials = calculateOrderFinancials(order);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div
        className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900">#{order.orderNumber}</span>
              <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{order.user.firstName} {order.user.lastName}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-green-600">{formatCurrency(financials.grandTotal)}</p>
            <p className="text-xs text-gray-500">{order.items.length} items</p>
          </div>
        </div>
        <div className="flex justify-center mt-1">
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {expanded && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
            <div><span className="text-gray-500">Subtotal:</span> {formatCurrency(financials.subtotal)}</div>
            <div><span className="text-gray-500">VAT:</span> {formatCurrency(financials.vatAmount)}</div>
            <div><span className="text-gray-500">Shipping:</span> {formatCurrency(financials.totalShipping)}</div>
            <div><span className="text-gray-500">Commission:</span> {formatCurrency(financials.websiteEarnings)}</div>
          </div>
          {order.items.slice(0, 3).map(item => (
            <div key={item.id} className="text-xs text-gray-600 py-1 border-t border-gray-200">
              {item.quantity}x {item.product.name}
            </div>
          ))}
          {order.items.length > 3 && (
            <p className="text-xs text-gray-500 mt-1">+{order.items.length - 3} more items</p>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== MAIN SALES LIST COMPONENT ====================
interface SalesListProps {
  filter?: OrderListVariables['filter'];
  pageSize?: number;
}

const SalesList: React.FC<SalesListProps> = ({ filter, pageSize = 10 }) => {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [summaryPeriod, setSummaryPeriod] = useState<SummaryPeriod>('daily');
  const [summaryDate, setSummaryDate] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const [showOrders, setShowOrders] = useState(true);

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
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const orders = data?.orderlist.orders || [];
  const pagination = data?.orderlist.pagination;

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'summary', label: 'Summary', icon: '📊' },
    { id: 'charts', label: 'Charts', icon: '📈' },
    { id: 'export', label: 'Export', icon: '📥' },
    { id: 'compare', label: 'Compare', icon: '🔄' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Earnings Reports</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {pagination?.total || 0} total orders • Page {currentPage} of {pagination?.totalPages || 1}
            </p>
            <div className="flex gap-3 text-xs text-gray-400 mt-1">
              <span>VAT: {Math.round(VAT_RATE * 100)}%</span>
              <span>Commission: {Math.round(WEBSITE_EARNINGS_RATE * 100)}%</span>
            </div>
          </div>
          <button
            onClick={() => setShowOrders(!showOrders)}
            className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm flex items-center justify-center gap-2"
          >
            {showOrders ? '📋 Hide Orders' : '📋 Show Orders'}
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-4 overflow-x-auto">
          <div className="flex min-w-max">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-all relative ${
                  activeTab === tab.id
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">{tab.icon}</span>
                  {tab.label}
                </span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          {activeTab === 'summary' && (
            <SummaryTab
              orders={orders}
              period={summaryPeriod}
              selectedDate={summaryDate}
              onDateChange={setSummaryDate}
              onPeriodChange={setSummaryPeriod}
            />
          )}
          {activeTab === 'charts' && <ChartTab orders={orders} />}
          {activeTab === 'export' && <ExportTab orders={orders} />}
          {activeTab === 'compare' && <CompareTab orders={orders} />}
        </div>

        {/* Orders List (Collapsible) */}
        {showOrders && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 px-1">Recent Orders</h2>
            {orders.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <p className="text-gray-500">No orders found</p>
              </div>
            ) : (
              orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              ← Previous
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-600">
              Page {currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage === pagination.totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesList;
