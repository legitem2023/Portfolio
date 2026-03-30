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

// Types
interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string };
  address: any;
  items: any[];
  payments: any[];
}

interface OrderListData {
  orderlist: { orders: Order[]; pagination: any };
}

type SummaryPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
type TabType = 'summary' | 'charts' | 'export' | 'compare';

// Helper functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatPeriodDate = (date: Date, period: SummaryPeriod): string => {
  switch (period) {
    case 'daily':
      return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    case 'weekly':
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${formatDate(startOfWeek.toISOString())} - ${formatDate(endOfWeek.toISOString())}`;
    case 'monthly':
      return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'long' });
    case 'yearly':
      return date.getFullYear().toString();
  }
};

const calculateOrderFinancials = (order: Order) => {
  const subtotal = order.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const totalShipping = order.items.reduce((sum, item) => sum + (item.individualShipping || 0), 0);
  const vatAmount = subtotal * VAT_RATE;
  const grandTotal = subtotal + vatAmount + totalShipping;
  const websiteEarnings = subtotal * WEBSITE_EARNINGS_RATE;
  const vendorsIncome = subtotal - websiteEarnings;
  return { subtotal, totalShipping, vatAmount, grandTotal, websiteEarnings, vendorsIncome };
};

// Tab Components
const SummaryTab: React.FC<{
  orders: Order[];
  period: SummaryPeriod;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onPeriodChange: (period: SummaryPeriod) => void;
}> = ({ orders, period, selectedDate, onDateChange, onPeriodChange }) => {
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      switch (period) {
        case 'daily':
          return orderDate.toDateString() === selectedDate.toDateString();
        case 'weekly':
          const startOfWeek = new Date(selectedDate);
          startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
          return orderDate >= startOfWeek && orderDate <= endOfWeek;
        case 'monthly':
          return orderDate.getMonth() === selectedDate.getMonth() && 
                 orderDate.getFullYear() === selectedDate.getFullYear();
        case 'yearly':
          return orderDate.getFullYear() === selectedDate.getFullYear();
        default:
          return true;
      }
    });
  }, [orders, period, selectedDate]);

  const summary = useMemo(() => {
    const totals = filteredOrders.reduce((acc, order) => {
      const f = calculateOrderFinancials(order);
      return {
        orderCount: acc.orderCount + 1,
        subtotal: acc.subtotal + f.subtotal,
        totalShipping: acc.totalShipping + f.totalShipping,
        vatAmount: acc.vatAmount + f.vatAmount,
        grandTotal: acc.grandTotal + f.grandTotal,
        websiteEarnings: acc.websiteEarnings + f.websiteEarnings,
        vendorsIncome: acc.vendorsIncome + f.vendorsIncome,
        itemCount: acc.itemCount + order.items.length,
      };
    }, {
      orderCount: 0,
      subtotal: 0,
      totalShipping: 0,
      vatAmount: 0,
      grandTotal: 0,
      websiteEarnings: 0,
      vendorsIncome: 0,
      itemCount: 0,
    });
    return { ...totals, averageOrderValue: totals.orderCount ? totals.grandTotal / totals.orderCount : 0 };
  }, [filteredOrders]);

  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    switch (period) {
      case 'daily': newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1)); break;
      case 'weekly': newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7)); break;
      case 'monthly': newDate.setMonth(selectedDate.getMonth() + (direction === 'next' ? 1 : -1)); break;
      case 'yearly': newDate.setFullYear(selectedDate.getFullYear() + (direction === 'next' ? 1 : -1)); break;
    }
    onDateChange(newDate);
  };

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex flex-wrap gap-2">
        {(['daily', 'weekly', 'monthly', 'yearly'] as SummaryPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => onPeriodChange(p)}
            className={`px-4 py-2 rounded-lg font-medium text-sm capitalize transition-all ${
              period === p
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
        <button onClick={() => navigate('prev')} className="p-2 hover:bg-gray-100 rounded-lg">
          ←
        </button>
        <div className="text-center">
          <p className="font-semibold text-gray-900">{formatPeriodDate(selectedDate, period)}</p>
          <button onClick={() => onDateChange(new Date())} className="text-xs text-blue-600">
            Today
          </button>
        </div>
        <button onClick={() => navigate('next')} className="p-2 hover:bg-gray-100 rounded-lg">
          →
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <p className="text-xs text-gray-500">Orders</p>
          <p className="text-xl font-bold">{summary.orderCount}</p>
          <p className="text-xs text-gray-400">{summary.itemCount} items</p>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <p className="text-xs text-gray-500">Revenue</p>
          <p className="text-xl font-bold text-green-600 truncate">{formatCurrency(summary.grandTotal)}</p>
          <p className="text-xs text-gray-400">Avg {formatCurrency(summary.averageOrderValue)}</p>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <p className="text-xs text-gray-500">Commission</p>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(summary.websiteEarnings)}</p>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <p className="text-xs text-gray-500">Vendors</p>
          <p className="text-xl font-bold text-purple-600">{formatCurrency(summary.vendorsIncome)}</p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs font-semibold text-gray-700 mb-2">Breakdown</p>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div><p className="text-gray-500">Subtotal</p><p className="font-semibold">{formatCurrency(summary.subtotal)}</p></div>
          <div><p className="text-gray-500">VAT</p><p className="font-semibold text-orange-600">{formatCurrency(summary.vatAmount)}</p></div>
          <div><p className="text-gray-500">Shipping</p><p className="font-semibold">{formatCurrency(summary.totalShipping)}</p></div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="flex justify-between text-xs mb-1">
            <span>Commission Rate</span>
            <span>{Math.round((summary.websiteEarnings / summary.grandTotal) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className="bg-blue-600 rounded-full h-1.5 transition-all" style={{ width: `${(summary.websiteEarnings / summary.grandTotal) * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple Chart Component (using CSS only, can be replaced with recharts or chart.js)
const ChartTab: React.FC<{ orders: Order[] }> = ({ orders }) => {
  const [chartType, setChartType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  const chartData = useMemo(() => {
    const data = new Map<string, number>();
    const now = new Date();
    
    orders.forEach(order => {
      const date = new Date(order.createdAt);
      let key: string;
      
      switch (chartType) {
        case 'daily':
          key = date.toLocaleDateString();
          break;
        case 'weekly':
          const weekNum = Math.ceil((date.getDate() - date.getDay()) / 7);
          key = `Week ${weekNum}`;
          break;
        case 'monthly':
          key = date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
          break;
      }
      
      const financials = calculateOrderFinancials(order);
      data.set(key, (data.get(key) || 0) + financials.grandTotal);
    });
    
    return Array.from(data.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7);
  }, [orders, chartType]);
  
  const maxValue = Math.max(...chartData.map(d => d[1]), 1);
  
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['daily', 'weekly', 'monthly'] as const).map(type => (
          <button
            key={type}
            onClick={() => setChartType(type)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize ${
              chartType === type ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {type}
          </button>
        ))}
      </div>
      
      {chartData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No data available</div>
      ) : (
        <div className="space-y-2">
          {chartData.map(([label, value]) => (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium truncate">{label}</span>
                <span className="text-gray-600">{formatCurrency(value)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full flex items-center justify-end px-2 text-xs text-white font-medium transition-all"
                  style={{ width: `${(value / maxValue) * 100}%` }}
                >
                  {value / maxValue > 0.15 && `${Math.round((value / maxValue) * 100)}%`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="bg-blue-50 rounded-lg p-3 text-center">
        <p className="text-xs text-blue-800">📊 Total Revenue: {formatCurrency(chartData.reduce((sum, [, val]) => sum + val, 0))}</p>
      </div>
    </div>
  );
};

// Export Tab
const ExportTab: React.FC<{ orders: Order[] }> = ({ orders }) => {
  const [exportType, setExportType] = useState<'csv' | 'json'>('csv');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = order.createdAt.split('T')[0];
      return orderDate >= dateRange.start && orderDate <= dateRange.end;
    });
  }, [orders, dateRange]);
  
  const exportData = useCallback(() => {
    const data = filteredOrders.map(order => {
      const financials = calculateOrderFinancials(order);
      return {
        orderNumber: order.orderNumber,
        date: order.createdAt,
        customer: `${order.user.firstName} ${order.user.lastName}`,
        subtotal: financials.subtotal,
        vat: financials.vatAmount,
        shipping: financials.totalShipping,
        commission: financials.websiteEarnings,
        vendorsIncome: financials.vendorsIncome,
        total: financials.grandTotal,
        items: order.items.length,
      };
    });
    
    if (exportType === 'csv') {
      const headers = ['Order #', 'Date', 'Customer', 'Subtotal', 'VAT', 'Shipping', 'Commission', 'Vendors', 'Total', 'Items'];
      const csv = [headers, ...data.map(row => Object.values(row))].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `earnings_report_${dateRange.start}_to_${dateRange.end}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `earnings_report_${dateRange.start}_to_${dateRange.end}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [filteredOrders, exportType, dateRange]);
  
  const summary = useMemo(() => {
    return filteredOrders.reduce((acc, order) => {
      const f = calculateOrderFinancials(order);
      return {
        orders: acc.orders + 1,
        revenue: acc.revenue + f.grandTotal,
        commission: acc.commission + f.websiteEarnings,
      };
    }, { orders: 0, revenue: 0, commission: 0 });
  }, [filteredOrders]);
  
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-3 shadow-sm">
        <p className="text-sm font-semibold mb-2">Date Range</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-2 py-1.5 border rounded-lg text-sm"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-2 py-1.5 border rounded-lg text-sm"
          />
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-3 shadow-sm">
        <p className="text-sm font-semibold mb-2">Export Format</p>
        <div className="flex gap-2">
          <button
            onClick={() => setExportType('csv')}
            className={`flex-1 py-2 rounded-lg text-sm ${exportType === 'csv' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            CSV
          </button>
          <button
            onClick={() => setExportType('json')}
            className={`flex-1 py-2 rounded-lg text-sm ${exportType === 'json' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            JSON
          </button>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs text-gray-600 mb-2">Export Summary</p>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div><p className="text-gray-500">Orders</p><p className="font-semibold">{summary.orders}</p></div>
          <div><p className="text-gray-500">Revenue</p><p className="font-semibold text-green-600">{formatCurrency(summary.revenue)}</p></div>
          <div><p className="text-gray-500">Commission</p><p className="font-semibold text-blue-600">{formatCurrency(summary.commission)}</p></div>
        </div>
      </div>
      
      <button
        onClick={exportData}
        disabled={filteredOrders.length === 0}
        className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        📥 Download {exportType.toUpperCase()} ({filteredOrders.length} orders)
      </button>
    </div>
  );
};

// Compare Tab
const CompareTab: React.FC<{ orders: Order[] }> = ({ orders }) => {
  const [compareType, setCompareType] = useState<'week' | 'month'>('week');
  
  const comparisons = useMemo(() => {
    const now = new Date();
    const current: { label: string; data: any } = { label: '', data: null };
    const previous: { label: string; data: any } = { label: '', data: null };
    
    if (compareType === 'week') {
      const currentWeek = new Date(now);
      currentWeek.setDate(now.getDate() - now.getDay());
      const previousWeek = new Date(currentWeek);
      previousWeek.setDate(currentWeek.getDate() - 7);
      
      current.label = formatPeriodDate(currentWeek, 'weekly');
      previous.label = formatPeriodDate(previousWeek, 'weekly');
      
      const filterByWeek = (date: Date) => {
        const start = new Date(date);
        start.setDate(date.getDate() - date.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return (order: Order) => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= start && orderDate <= end;
        };
      };
      
      current.data = orders.filter(filterByWeek(currentWeek));
      previous.data = orders.filter(filterByWeek(previousWeek));
    } else {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      
      current.label = new Date(currentYear, currentMonth).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      previous.label = new Date(previousYear, previousMonth).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      
      current.data = orders.filter(order => {
        const d = new Date(order.createdAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
      previous.data = orders.filter(order => {
        const d = new Date(order.createdAt);
        return d.getMonth() === previousMonth && d.getFullYear() === previousYear;
      });
    }
    
    const calculateStats = (ordersList: Order[]) => {
      return ordersList.reduce((acc, order) => {
        const f = calculateOrderFinancials(order);
        return {
          orders: acc.orders + 1,
          revenue: acc.revenue + f.grandTotal,
          commission: acc.commission + f.websiteEarnings,
          items: acc.items + order.items.length,
        };
      }, { orders: 0, revenue: 0, commission: 0, items: 0 });
    };
    
    const currentStats = calculateStats(current.data);
    const previousStats = calculateStats(previous.data);
    
    const percentChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };
    
    return {
      current: { label: current.label, stats: currentStats },
      previous: { label: previous.label, stats: previousStats },
      changes: {
        orders: percentChange(currentStats.orders, previousStats.orders),
        revenue: percentChange(currentStats.revenue, previousStats.revenue),
        commission: percentChange(currentStats.commission, previousStats.commission),
      },
    };
  }, [orders, compareType]);
  
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setCompareType('week')}
          className={`flex-1 py-2 rounded-lg text-sm ${compareType === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
        >
          Week over Week
        </button>
        <button
          onClick={() => setCompareType('month')}
          className={`flex-1 py-2 rounded-lg text-sm ${compareType === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
        >
          Month over Month
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Current {compareType === 'week' ? 'Week' : 'Month'}</p>
          <p className="text-xs text-gray-500 mb-2">{comparisons.current.label}</p>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(comparisons.current.stats.revenue)}</p>
          <p className="text-xs text-gray-500">{comparisons.current.stats.orders} orders</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Previous {compareType === 'week' ? 'Week' : 'Month'}</p>
          <p className="text-xs text-gray-500 mb-2">{comparisons.previous.label}</p>
          <p className="text-xl font-bold text-gray-600">{formatCurrency(comparisons.previous.stats.revenue)}</p>
          <p className="text-xs text-gray-500">{comparisons.previous.stats.orders} orders</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-3 shadow-sm space-y-2">
        <p className="text-sm font-semibold">Performance Changes</p>
        {[
          { label: 'Orders', value: comparisons.changes.orders, icon: '📦' },
          { label: 'Revenue', value: comparisons.changes.revenue, icon: '💰' },
          { label: 'Commission', value: comparisons.changes.commission, icon: '💸' },
        ].map(item => (
          <div key={item.label} className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{item.icon} {item.label}</span>
            <span className={`font-semibold ${item.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {item.value >= 0 ? '↑' : '↓'} {Math.abs(item.value).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Component
const SalesList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [summaryPeriod, setSummaryPeriod] = useState<SummaryPeriod>('daily');
  const [summaryDate, setSummaryDate] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  
  const { loading, error, data } = useQuery<OrderListData>(ORDER_LIST_QUERY, {
    variables: {
      pagination: { page: currentPage, pageSize: 10 },
    },
    fetchPolicy: 'network-only',
  });
  
  if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (error) return <div className="text-center text-red-600 p-4">Error: {error.message}</div>;
  
  const orders = data?.orderlist.orders || [];
  const pagination = data?.orderlist.pagination;
  
  const tabs = [
    { id: 'summary' as TabType, label: '📊 Summary', icon: '📊' },
    { id: 'charts' as TabType, label: '📈 Charts', icon: '📈' },
    { id: 'export' as TabType, label: '📥 Export', icon: '📥' },
    { id: 'compare' as TabType, label: '🔄 Compare', icon: '🔄' },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">Earnings Reports</h1>
          <p className="text-xs text-gray-500 mt-1">{pagination?.total || 0} total orders</p>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 mb-4 shadow-sm overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm p-4">
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
        
        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg border disabled:opacity-50"
            >
              ←
            </button>
            <span className="px-3 py-1 text-sm">Page {currentPage} of {pagination.totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage === pagination.totalPages}
              className="px-3 py-1 rounded-lg border disabled:opacity-50"
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesList;
