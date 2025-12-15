import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, gql } from '@apollo/client';
import { format } from 'date-fns';
import { 
  Search, 
  Filter, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Clock,
  User
} from 'lucide-react';
import Image from 'next/image';
import { SALES_LIST_QUERY } from '../../components/graphql/query';
import Upload3DModel from './Products/Upload3DModel';

// GraphQL Query - Fixed to match resolver types
/*const SALES_LIST_QUERY = gql`
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
          variant {
            id
            name
            sku
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
`;*/

// Updated Type definitions to match resolver
interface DateRangeFilter {
  start: string;
  end: string;
}

interface SalesFilters {
  status?: string;
  userId?: string;
  dateRange?: DateRangeFilter;
  minAmount?: number;
  maxAmount?: number;
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
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  items?: Array<{
    id: string;
    quantity: number;
    price: number;
    variantInfo?: string;
    product?: {
      id: string;
      name: string;
      price: number;
      images: string[];
    };
    variant?: {
      id: string;
      name: string;
      sku: string;
    };
  }>;
}

interface SalesData {
  orders: Order[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    pendingOrders: number;
    completedOrders: number;
  };
}

const SalesList = () => {
  // State - Updated to match resolver expectations
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filters, setFilters] = useState<SalesFilters>({});
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Clean filters for GraphQL - Fixed to match resolver structure
  const getCleanFilters = useCallback((): SalesFilters => {
    const cleanFilters: SalesFilters = {};
    
    if (filters.status) cleanFilters.status = filters.status;
    if (filters.userId) cleanFilters.userId = filters.userId;
    if (filters.dateRange) cleanFilters.dateRange = filters.dateRange;
    if (filters.minAmount !== undefined) cleanFilters.minAmount = filters.minAmount;
    if (filters.maxAmount !== undefined) cleanFilters.maxAmount = filters.maxAmount;
    
    // Handle search term as userId
    if (searchTerm) cleanFilters.userId = searchTerm;
    
    // If dateRange exists but has empty strings, remove it
    if (cleanFilters.dateRange && (!cleanFilters.dateRange.start || !cleanFilters.dateRange.end)) {
      delete cleanFilters.dateRange;
    }
    
    return cleanFilters;
  }, [filters, searchTerm]);

  // GraphQL Query
  const { loading, error, data, refetch } = useQuery(SALES_LIST_QUERY, {
    variables: {
      page,
      limit,
      filters: getCleanFilters(),
      sortBy,
      sortOrder
    },
    fetchPolicy: 'cache-and-network',
    onError: (error) => {
      console.error('GraphQL Error:', {
        message: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError
      });
    }
  });

  // Refetch when filters change
  useEffect(() => {
    refetch({
      page,
      limit,
      filters: getCleanFilters(),
      sortBy,
      sortOrder
    });
  }, [page, limit, sortBy, sortOrder, getCleanFilters, refetch]);

  // Handlers - Updated to handle new filter structure
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || undefined;
    setFilters(prev => ({
      ...prev,
      status: value
    }));
    setPage(1);
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    setFilters(prev => {
      const currentDateRange = prev.dateRange || { start: '', end: '' };
      const newDateRange = {
        ...currentDateRange,
        [type]: value
      };
      
      // If both dates are empty, remove dateRange
      if (!newDateRange.start && !newDateRange.end) {
        const { dateRange, ...rest } = prev;
        return rest;
      }
      
      return {
        ...prev,
        dateRange: newDateRange
      };
    });
    setPage(1);
  };

  const handleAmountChange = (type: 'min' | 'max', value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    setFilters(prev => ({
      ...prev,
      [type === 'min' ? 'minAmount' : 'maxAmount']: numValue
    }));
    setPage(1);
  };

  const handleSearch = () => {
    setPage(1);
    refetch();
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setSortBy('createdAt');
    setSortOrder('DESC');
    setPage(1);
    setShowFilters(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      SHIPPED: 'bg-indigo-100 text-indigo-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Check if any filters are active
  const hasFilters = 
    !!filters.status || 
    !!filters.userId || 
    !!filters.dateRange || 
    filters.minAmount !== undefined || 
    filters.maxAmount !== undefined || 
    !!searchTerm;

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p className="font-semibold">{error.message}</p>
                  {error.graphQLErrors && error.graphQLErrors.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">GraphQL Errors:</p>
                      <ul className="list-disc pl-5 mt-1">
                        {error.graphQLErrors.map((err, index) => (
                          <li key={index}>{err.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => refetch()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const salesData: SalesData = data?.salesList || {
    orders: [],
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    summary: {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      pendingOrders: 0,
      completedOrders: 0
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage and track your sales orders
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  placeholder="Search by user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Upload3DModel/>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasFilters && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Active
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(salesData.summary.totalRevenue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-green-50 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {salesData.summary.totalOrders}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(salesData.summary.averageOrderValue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {salesData.summary.pendingOrders}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Filters</h3>
              <button
                onClick={handleClearFilters}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={handleStatusChange}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
                >
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.dateRange?.start || ''}
                  onChange={(e) => handleDateChange('start', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.dateRange?.end || ''}
                  onChange={(e) => handleDateChange('end', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
                  >
                    <option value="createdAt">Date</option>
                    <option value="total">Total Amount</option>
                    <option value="orderNumber">Order Number</option>
                  </select>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="block w-32 pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
                  >
                    <option value="DESC">Desc</option>
                    <option value="ASC">Asc</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={filters.minAmount || ''}
                  onChange={(e) => handleAmountChange('min', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={filters.maxAmount || ''}
                  onChange={(e) => handleAmountChange('max', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="1000.00"
                />
              </div>
            </div>
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden lg:block">
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Orders</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {salesData.totalCount} orders found
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Show</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="block w-20 pl-3 pr-10 py-1 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
                  >
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>
            </div>

            {salesData.orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salesData.orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium text-gray-900">{order.orderNumber}</div>
                            <div className="text-sm text-gray-500">
                              {order.items?.length || 0} items
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {order.user?.avatar ? (
                                <Image
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 rounded-full"
                                  src={order.user.avatar}
                                  alt={`${order.user.firstName} ${order.user.lastName}`}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User className="h-5 w-5 text-gray-500" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {order.user?.firstName} {order.user?.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {order.user?.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0} units
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(order.total)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.items?.length || 0} items
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400">
                  <ShoppingCart className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new order or adjusting your filters.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden">
          <div className="mb-4">
            <h2 className="text-lg font-medium text-gray-900">Orders</h2>
            <p className="mt-1 text-sm text-gray-600">
              {salesData.totalCount} orders found
            </p>
          </div>

          {salesData.orders.length > 0 ? (
            <div className="space-y-4">
              {salesData.orders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {order.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        {order.user?.avatar ? (
                          <Image
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-full"
                            src={order.user.avatar}
                            alt={`${order.user.firstName} ${order.user.lastName}`}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {order.user?.firstName} {order.user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{order.user?.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500">Items</p>
                        <p className="text-sm font-medium text-gray-900">
                          {order.items?.length || 0} items
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Quantity</p>
                        <p className="text-sm font-medium text-gray-900">
                          {order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0} units
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">Total Amount</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="text-gray-400">
                <ShoppingCart className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filters.
              </p>
              <button
                onClick={handleClearFilters}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {salesData.totalPages > 1 && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= salesData.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(page * limit, salesData.totalCount)}
                    </span>{' '}
                    of <span className="font-medium">{salesData.totalCount}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    
                    {Array.from({ length: Math.min(5, salesData.totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (salesData.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= salesData.totalPages - 2) {
                        pageNum = salesData.totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= salesData.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SalesList;
