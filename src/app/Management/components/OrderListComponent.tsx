'use client';

import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { 
  Package, 
  MapPin, 
  Building, 
  User, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Truck,
  Home,
  XCircle,
  ChevronDown,
  ChevronUp,
  Bell,
  Shield,
  CreditCard,
  DollarSign
} from "lucide-react";

// GraphQL Query - EXISTING ONLY
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
          email
        }
        items {
          id
          supplierId
          quantity
          price
          product {
            name
            sku
            images
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

// Types - EXISTING ONLY
type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

interface OrderItem {
  id: string;
  supplierId?: string;
  quantity: number;
  price: number;
  product: Array<{
    name: string;
    sku: string;
    images: string[];
  }>;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    email: string;
  };
  items: OrderItem[];
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    status: string;
  }>;
}

interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface OrderListResponse {
  orders: Order[];
  pagination: PaginationInfo;
}

interface OrderFilterInput {
  supplierId?: string;
  status?: OrderStatus;
}

interface OrderPaginationInput {
  page?: number;
  pageSize?: number;
}

interface OrderListComponentProps {
  initialSupplierId?: string;
  initialStatus?: OrderStatus;
  isMobile?: boolean;
}

// Format currency function for Philippine Peso
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Status color mapping
const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-orange-100 text-orange-700',
  SHIPPED: 'bg-blue-100 text-blue-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-800'
};

// Payment method icons
const getPaymentIcon = (method: string) => {
  switch(method?.toLowerCase()) {
    case 'cash':
      return <DollarSign size={16} className="text-green-600" />;
    case 'card':
    case 'credit card':
    case 'debit card':
      return <CreditCard size={16} className="text-blue-600" />;
    default:
      return <CreditCard size={16} className="text-gray-600" />;
  }
};

export default function OrderListComponent({ 
  initialSupplierId, 
  initialStatus,
  isMobile = false
}: OrderListComponentProps) {
  // State for filters
  const [filters, setFilters] = useState<OrderFilterInput>({
    supplierId: initialSupplierId,
    status: initialStatus
  });
  
  // State for pagination
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10
  });

  // State for supplier input
  const [supplierIdInput, setSupplierIdInput] = useState(initialSupplierId || '');
  
  // State for expanded items
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // Fetch orders
  const { loading, error, data, refetch } = useQuery(ORDER_LIST_QUERY, {
    variables: {
      filter: {
        status: filters.status,
        supplierId: filters.supplierId
      },
      pagination
    },
    fetchPolicy: 'network-only'
  });

  // Status options
  const statusOptions: OrderStatus[] = [
    'PENDING',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
  ];

  // Handle filter changes
  const handleStatusChange = (status: OrderStatus | '') => {
    const newFilters = {
      ...filters,
      status: status || undefined
    };
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSupplierIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSupplierIdInput(e.target.value);
  };

  const applySupplierFilter = () => {
    const newFilters = {
      ...filters,
      supplierId: supplierIdInput.trim() || undefined
    };
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    const newFilters = {};
    setFilters(newFilters);
    setSupplierIdInput('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Handle page size change
  const handlePageSizeChange = (pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, page: 1 }));
  };

  // Toggle order items expansion
  const toggleOrderItems = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRefresh = () => {
    refetch();
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row justify-center items-center h-48 sm:h-64">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-orange-500"></div>
          <span className="ml-3 sm:ml-4 text-sm sm:text-base text-gray-600 mt-3 sm:mt-0">Loading orders...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center">
            <div className="text-red-500 mr-0 sm:mr-3 mb-2 sm:mb-0">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-medium text-red-800">Failed to load orders</h3>
              <p className="text-sm sm:text-base text-red-700 mt-1">{error.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const orderData = data?.orderlist as OrderListResponse;
  const orders = orderData?.orders || [];
  const paginationInfo = orderData?.pagination;

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 sm:mb-6 lg:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 flex items-center gap-2">
            <Bell size={isMobile ? 20 : 24} className="text-orange-500" />
            <span>Orders</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Manage and track all orders</p>
        </div>
        
        {/* Quick stats */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex gap-2 text-sm">
            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
              <Package size={14} />
              {orders.length}
            </span>
          </div>
          <button 
            onClick={handleRefresh}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
            title="Refresh"
          >
            <Package size={18} />
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200 mb-4 sm:mb-6">
        <div className="flex flex-col gap-4">
          {/* Supplier ID Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Filter by Supplier ID
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={supplierIdInput}
                onChange={handleSupplierIdChange}
                placeholder="Enter supplier ID..."
                className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <button
                onClick={applySupplierFilter}
                className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Status Filter and Clear Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Filter by Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleStatusChange(e.target.value as OrderStatus | '')}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Status</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="self-end sm:self-auto">
              <button
                onClick={clearFilters}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.supplierId || filters.status) && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs sm:text-sm">
              <span className="text-gray-600 whitespace-nowrap">Active filters:</span>
              <div className="flex flex-wrap gap-2">
                {filters.supplierId && (
                  <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs sm:text-sm">
                    Supplier: {filters.supplierId}
                    <button
                      onClick={() => {
                        const newFilters = { ...filters, supplierId: undefined };
                        setFilters(newFilters);
                        setSupplierIdInput('');
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                      className="text-orange-600 hover:text-orange-800 text-sm"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.status && (
                  <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm">
                    Status: {filters.status}
                    <button
                      onClick={() => {
                        const newFilters = { ...filters, status: undefined };
                        setFilters(newFilters);
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      {paginationInfo && (
        <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">
          Showing {orders.length} of {paginationInfo.total} orders
          {filters.supplierId && (
            <span> for supplier: <strong>{filters.supplierId}</strong></span>
          )}
          {filters.status && (
            <span> with status: <strong>{filters.status}</strong></span>
          )}
        </div>
      )}

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-4 lg:p-8 text-center">
          <Bell size={isMobile ? 32 : 48} className="mx-auto text-gray-400 mb-3 lg:mb-4" />
          <h3 className="text-base lg:text-lg font-semibold text-gray-600">No orders found</h3>
          <p className="text-gray-500 text-sm lg:text-base mt-1 lg:mt-2">
            {filters.supplierId || filters.status 
              ? 'Try changing your filters' 
              : 'Orders will appear here once created'}
          </p>
        </div>
      ) : (
        <>
          {/* Orders Grid */}
          <div className="space-y-3 sm:space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow border border-indigo-200 overflow-hidden">
                {/* Header */}
                <div className="bg-indigo-50 px-3 lg:px-4 py-2 lg:py-3 border-b border-orange-100">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 lg:gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                      <span className="font-bold text-indigo-700 text-xs lg:text-sm">
                        Order #{order.orderNumber}
                      </span>
                    </div>
                    {/* Status Badge */}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[order.status]}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="p-2 lg:p-6">
                  {/* Order info */}
                  <div className="flex justify-between items-start mb-3 lg:mb-4">
                    <div>
                      <div className="flex items-center gap-1 lg:gap-2 mb-1 lg:mb-2">
                        <Shield size={isMobile ? 16 : 18} className="text-blue-500" />
                        <h3 className="font-bold text-base lg:text-xl">Order #{order.orderNumber}</h3>
                      </div>
                      <div className="flex items-center gap-1 lg:gap-2 text-gray-600 mb-0.5 lg:mb-1">
                        <User size={isMobile ? 14 : 16} />
                        <span className="text-sm lg:text-base">{order.user.firstName}</span>
                      </div>
                      <div className="flex items-center gap-1 lg:gap-2 text-gray-600">
                        <Clock size={isMobile ? 14 : 16} />
                        <span className="text-sm lg:text-base">{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl lg:text-3xl font-bold text-green-600">
                        {formatCurrency(order.total)}
                      </div>
                      <p className="text-gray-500 text-xs lg:text-sm">Total amount</p>
                    </div>
                  </div>

                  {/* Pickup and Dropoff Section - Using existing data */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-4 mb-4 lg:mb-6">
                    {/* Pickup From - Using supplierId from first item */}
                    <div className="bg-blue-50 p-2 lg:p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1 lg:mb-2">
                        <div className="flex items-center gap-1 lg:gap-2">
                          <MapPin size={isMobile ? 14 : 16} className="text-blue-500" />
                          <span className="font-semibold text-xs lg:text-sm">Pickup From</span>
                        </div>
                      </div>
                      <p className="text-gray-700 text-xs lg:text-sm font-medium">
                        {order.items[0]?.supplierId ? `Supplier ${order.items[0].supplierId.substring(0, 8)}...` : 'Supplier'}
                      </p>
                      {order.items.some(item => item.supplierId) && (
                        <div className="mt-1 lg:mt-2 text-xs text-gray-500">
                          <div className="flex items-center gap-0.5 lg:gap-1">
                            <Building size={isMobile ? 8 : 10} />
                            <span className="text-xs">ID: {order.items[0]?.supplierId}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Distance Indicator */}
                    <div className="flex items-center justify-center">
                      <div className="w-full border-t-2 border-dashed border-gray-300 relative">
                        <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-1 lg:px-2">
                          <div className="flex items-center gap-0.5 lg:gap-1 text-gray-500">
                            <Truck size={isMobile ? 12 : 14} />
                            <span className="text-xs lg:text-sm font-medium">→</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Deliver To - Customer */}
                    <div className="bg-green-50 p-2 lg:p-3 rounded-lg">
                      <div className="flex items-center gap-1 lg:gap-2 mb-1 lg:mb-2">
                        <MapPin size={isMobile ? 14 : 16} className="text-green-500" />
                        <span className="font-semibold text-xs lg:text-sm">Deliver To</span>
                      </div>
                      <p className="text-gray-700 text-xs lg:text-sm font-medium">
                        {order.user.firstName}
                      </p>
                      <div className="mt-1 lg:mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-0.5 lg:gap-1">
                          <User size={isMobile ? 8 : 10} />
                          <span className="text-xs">{order.user.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Item details */}
                  <div className="mb-3 lg:mb-4 bg-gray-50 rounded-lg overflow-hidden">
                    {/* Header - always visible */}
                    <button
                      onClick={() => toggleOrderItems(order.id)}
                      className="w-full px-3 lg:px-4 py-2 lg:py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <h4 className="font-semibold text-sm lg:text-base flex items-center gap-1 lg:gap-2">
                        <Package size={isMobile ? 14 : 16} />
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          Total: {formatCurrency(order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                        </span>
                        {expandedOrders.has(order.id) ? (
                          <ChevronUp size={isMobile ? 16 : 20} className="text-gray-500" />
                        ) : (
                          <ChevronDown size={isMobile ? 16 : 20} className="text-gray-500" />
                        )}
                      </div>
                    </button>

                    {/* Collapsible content */}
                    {expandedOrders.has(order.id) && (
                      <div className="px-2 sm:px-3 lg:px-4 pb-2 sm:pb-3 lg:pb-4 space-y-2 sm:space-y-3 border-t border-gray-200 pt-2 sm:pt-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex flex-col xs:flex-row gap-2 sm:gap-3 bg-white rounded-lg p-2 sm:p-3">
                            {/* Top row for mobile: Image and price side by side */}
                            <div className="flex xs:hidden items-center gap-2">
                              {/* Image section */}
                              {item.product[0]?.images && item.product[0].images.length > 0 && (
                                <div className="relative w-10 h-10 flex-shrink-0">
                                  <img 
                                    src={item.product[0].images[0]} 
                                    alt={item.product[0].name}
                                    className="w-full h-full object-cover rounded-lg border border-gray-200"
                                  />
                                  {item.product[0].images.length > 1 && (
                                    <span className="absolute -top-1 -right-1 bg-gray-800 text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full">
                                      {item.product[0].images.length}
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {/* Mobile price */}
                              <div className="flex-1 text-right">
                                <div className="text-sm font-bold text-gray-900">
                                  {formatCurrency(item.price * item.quantity)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatCurrency(item.price)} each
                                </div>
                              </div>
                            </div>

                            {/* Main content - responsive layout */}
                            <div className="flex flex-1 flex-col xs:flex-row gap-2 sm:gap-3">
                              {/* Image - hidden on mobile (shown in top row), visible on xs and up */}
                              {item.product[0]?.images && item.product[0].images.length > 0 && (
                                <div className="hidden xs:block relative w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 flex-shrink-0">
                                  <img 
                                    src={item.product[0].images[0]} 
                                    alt={item.product[0].name}
                                    className="w-full h-full object-cover rounded-lg border border-gray-200"
                                  />
                                  {item.product[0].images.length > 1 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-gray-800 text-white text-[10px] sm:text-xs w-4 sm:w-5 h-4 sm:h-5 flex items-center justify-center rounded-full">
                                      {item.product[0].images.length}
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {/* Product details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col gap-0.5 sm:gap-1">
                                  {/* SKU and quantity */}
                                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                    <span className="text-[10px] sm:text-xs font-mono bg-gray-200 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-gray-700">
                                      {item.product[0]?.sku || 'N/A'}
                                    </span>
                                    <span className="text-[10px] sm:text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                      Qty: {item.quantity}
                                    </span>
                                    {item.supplierId && (
                                      <span className="text-[10px] sm:text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded truncate max-w-[100px]">
                                        ID: {item.supplierId.substring(0, 8)}...
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Product name */}
                                  <h4 className="text-xs sm:text-sm lg:text-base font-medium text-gray-900 truncate">
                                    {item.product[0]?.name || 'Unknown Product'}
                                  </h4>
                                  
                                  {/* Price for tablet/desktop (hidden on mobile) */}
                                  <div className="hidden sm:flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-gray-500">Unit price:</span>
                                    <span className="text-xs font-semibold text-gray-700">{formatCurrency(item.price)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Price - visible on tablet/desktop (hidden on mobile) */}
                              <div className="hidden sm:flex flex-col items-end justify-center flex-shrink-0 min-w-[80px] lg:min-w-[100px]">
                                <div className="text-sm lg:text-base font-bold text-gray-900 whitespace-nowrap">
                                  {formatCurrency(item.price * item.quantity)}
                                </div>
                                <div className="text-xs lg:text-sm text-gray-500 whitespace-nowrap">
                                  @ {formatCurrency(item.price)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Subtotal - responsive */}
                        <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 bg-gray-100 rounded-lg p-3 sm:p-4 mt-2 sm:mt-3">
                          <span className="text-sm sm:text-base font-medium text-gray-600">Subtotal</span>
                          <div className="flex flex-col xs:items-end w-full xs:w-auto">
                            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                              {formatCurrency(order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                            </span>
                            <span className="text-xs sm:text-sm text-gray-500">
                              ({order.items.length} {order.items.length === 1 ? 'item' : 'items'})
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payments Section - EXISTING ONLY */}
                  {order.payments && order.payments.length > 0 && (
                    <div className="border-t border-gray-200 pt-3 sm:pt-4 mt-3 sm:mt-4">
                      <h4 className="font-medium text-gray-700 text-sm sm:text-base mb-2 sm:mb-3 flex items-center gap-2">
                        <CreditCard size={isMobile ? 16 : 18} className="text-blue-500" />
                        Payment Information
                      </h4>
                      <div className="space-y-2">
                        {order.payments.map((payment) => (
                          <div key={payment.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-2 sm:p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              {getPaymentIcon(payment.method)}
                              <div>
                                <span className="text-sm font-medium text-gray-900">
                                  {payment.method}
                                </span>
                                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                  payment.status === 'COMPLETED' || payment.status === 'PAID' 
                                    ? 'bg-green-100 text-green-700' 
                                    : payment.status === 'PENDING'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {payment.status}
                                </span>
                              </div>
                            </div>
                            <div className="text-right w-full sm:w-auto">
                              <div className="text-sm font-bold text-gray-900">
                                {formatCurrency(payment.amount)}
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Total */}
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg mt-2">
                          <span className="font-semibold text-gray-700">Total Paid</span>
                          <span className="text-lg font-bold text-blue-600">
                            {formatCurrency(order.payments.reduce((sum, p) => sum + p.amount, 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Customer info footer */}
                  <div className="border-t border-gray-200 pt-3 sm:pt-4 mt-3 sm:mt-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                      <div className="flex-1 min-w-0">
                        <p className="truncate">
                          <span className="font-medium">Customer:</span> {order.user.email}
                        </p>
                      </div>
                      <div className="flex sm:block justify-between sm:text-right">
                        <p><span className="font-medium">Items:</span> {order.items.length}</p>
                        <p><span className="font-medium">Payments:</span> {order.payments.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {paginationInfo && paginationInfo.totalPages > 1 && (
            <div className="mt-6 sm:mt-8">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                {/* Page Size Selector */}
                <div className="flex items-center gap-2 order-2 sm:order-1">
                  <span className="text-xs sm:text-sm text-gray-600">Show:</span>
                  <select
                    value={pagination.pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="5">5 per page</option>
                    <option value="10">10 per page</option>
                    <option value="20">20 per page</option>
                    <option value="50">50 per page</option>
                  </select>
                </div>

                {/* Page Info */}
                <div className="text-xs sm:text-sm text-gray-600 order-1 sm:order-2">
                  Page {paginationInfo.page} of {paginationInfo.totalPages}
                </div>

                {/* Page Navigation */}
                <div className="flex gap-2 order-3">
                  <button
                    onClick={() => handlePageChange(paginationInfo.page - 1)}         
                    disabled={paginationInfo.page === 1}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded border ${
                      paginationInfo.page === 1 
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  
                  <button
                    onClick={() => handlePageChange(paginationInfo.page + 1)}
                    disabled={paginationInfo.page === paginationInfo.totalPages}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded border ${
                      paginationInfo.page === paginationInfo.totalPages 
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
                          }
