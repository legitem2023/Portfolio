'use client';

import { useState, useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
import { 
  Package, 
  MapPin, 
  Building, 
  User, 
  Clock, 
  AlertCircle,
  Bell,
  Shield,
  Truck,
  Home,
  ShoppingBag,
  Clock3,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Calendar,
  Bike
} from "lucide-react";

// GraphQL Query - KEEP EXACTLY AS ORIGINAL
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
        rider
        supplier
        items {
          id
          orderId
          supplierId
          riderId
          quantity
          price
          status
          product {
            name
            sku
            images
          }
          rider {
            id
            firstName
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
type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  lat?: number;
  lng?: number;
}

interface User {
  id: string;
  firstName: string;
  email?: string;
  addresses?: Address[];
}

interface OrderItem {
  id: string;
  orderId?: string;
  supplierId?: string;
  riderId?: string;
  quantity: number;
  price: number;
  status?: OrderStatus;
  product: Array<{
    name: string;
    sku: string;
    images: string[];
  }>;
  rider?: User | User[]; // Can be object or array
  supplier?: User | User[]; // Can be object or array
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
  rider?: any;
  supplier?: any;
  address?: Address;
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

// GraphQL filter input (keep as original)
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

// Date filter presets for client-side filtering
const DATE_PRESETS = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  LAST_7_DAYS: 'last7Days',
  LAST_30_DAYS: 'last30Days',
  THIS_MONTH: 'thisMonth',
  LAST_MONTH: 'lastMonth',
  CUSTOM: 'custom'
} as const;

type DatePreset = typeof DATE_PRESETS[keyof typeof DATE_PRESETS];

// Client-side date filter interface
interface ClientDateFilter {
  from?: string;
  to?: string;
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

// Status icons mapping
const statusIcons = {
  ALL: ShoppingBag,
  PENDING: Clock,
  PROCESSING: Loader2,
  SHIPPED: Truck,
  DELIVERED: CheckCircle,
  CANCELLED: XCircle
};

// Helper function to safely get user from possible array
const getUserFromItem = (item: OrderItem, type: 'rider' | 'supplier'): User | undefined => {
  const user = item[type];
  if (!user) return undefined;
  // If it's an array, get the first element
  return Array.isArray(user) ? user[0] : user;
};

// Format address function
const formatAddress = (address?: Address): string => {
  if (!address) return 'No address provided';
  return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`;
};

// Shimmer loading component
const OrderCardShimmer = () => {
  return (
    <div className="bg-white rounded-lg shadow border border-indigo-200 overflow-hidden">
      <div className="bg-indigo-50 px-3 lg:px-4 py-2 lg:py-3 border-b border-orange-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-300 rounded-full shimmer-animation"></div>
            <div className="h-4 w-24 bg-indigo-200 rounded shimmer-animation"></div>
          </div>
          <div className="h-5 w-16 bg-orange-200 rounded-full shimmer-animation"></div>
        </div>
      </div>

      <div className="p-2 lg:p-6">
        <div className="flex justify-between items-start mb-3 lg:mb-4">
          <div className="space-y-2">
            <div className="h-6 w-32 bg-gray-200 rounded shimmer-animation"></div>
            <div className="h-4 w-28 bg-gray-200 rounded shimmer-animation"></div>
            <div className="h-4 w-36 bg-gray-200 rounded shimmer-animation"></div>
          </div>
          <div className="text-right space-y-2">
            <div className="h-8 w-24 bg-gray-200 rounded shimmer-animation"></div>
            <div className="h-3 w-16 bg-gray-200 rounded ml-auto shimmer-animation"></div>
          </div>
        </div>

        <div className="bg-green-50 p-3 lg:p-4 rounded-lg mb-4 lg:mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-green-200 rounded shimmer-animation"></div>
            <div className="h-4 w-28 bg-green-200 rounded shimmer-animation"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-green-200 rounded shimmer-animation"></div>
            <div className="h-3 w-3/4 bg-green-200 rounded shimmer-animation"></div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-3 sm:pt-4">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <div className="w-4 h-4 bg-blue-200 rounded shimmer-animation"></div>
            <div className="h-4 w-16 bg-gray-200 rounded shimmer-animation"></div>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex flex-col xs:flex-row gap-2 sm:gap-3 bg-gray-50 rounded-lg p-2 sm:p-3">
                <div className="flex xs:hidden items-center gap-2 w-full">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg shimmer-animation"></div>
                  <div className="flex-1">
                    <div className="h-4 w-20 bg-gray-200 rounded ml-auto shimmer-animation"></div>
                  </div>
                </div>
                <div className="flex flex-1 flex-col xs:flex-row gap-2 sm:gap-3">
                  <div className="hidden xs:block w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 bg-gray-200 rounded-lg shimmer-animation"></div>
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <div className="h-4 w-16 bg-gray-200 rounded shimmer-animation"></div>
                      <div className="h-4 w-12 bg-gray-200 rounded shimmer-animation"></div>
                    </div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded shimmer-animation"></div>
                    <div className="h-3 w-1/2 bg-gray-200 rounded shimmer-animation"></div>
                  </div>
                  <div className="hidden sm:flex flex-col items-end justify-center space-y-1">
                    <div className="h-4 w-20 bg-gray-200 rounded shimmer-animation"></div>
                    <div className="h-3 w-16 bg-gray-200 rounded shimmer-animation"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-3 sm:pt-4 mt-3 sm:mt-4">
          <div className="flex justify-between">
            <div className="h-3 w-16 bg-gray-200 rounded shimmer-animation"></div>
            <div className="h-3 w-20 bg-gray-200 rounded shimmer-animation"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function OrderListComponent({ 
  initialSupplierId, 
  initialStatus,
  isMobile = false
}: OrderListComponentProps) {
  // State for GraphQL filters (sent to backend)
  const [graphqlFilters, setGraphqlFilters] = useState<OrderFilterInput>({
    supplierId: initialSupplierId,
    status: initialStatus
  });
  
  // State for client-side date filter (NOT sent to GraphQL)
  const [dateFilter, setDateFilter] = useState<ClientDateFilter>({});
  
  // State for pagination
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10
  });

  // State for supplier input
  const [supplierIdInput, setSupplierIdInput] = useState(initialSupplierId || '');

  // State for active tab
  const [activeTab, setActiveTab] = useState<OrderStatus | 'ALL'>(initialStatus || 'ALL');

  // State for date filter UI
  const [datePreset, setDatePreset] = useState<DatePreset | ''>('');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch orders - ONLY use graphqlFilters here
  const { loading, error, data, refetch } = useQuery(ORDER_LIST_QUERY, {
    variables: {
      filter: {
        status: graphqlFilters.status,
        supplierId: graphqlFilters.supplierId
      },
      pagination
    },
    fetchPolicy: 'network-only'
  });

  // Get all orders from GraphQL with proper typing
  const orderData = data?.orderlist as OrderListResponse | undefined;
  const allOrders: Order[] = orderData?.orders || [];
  
  // APPLY CLIENT-SIDE FILTERING - filter the JSON results by date
  const filteredOrders = useMemo(() => {
    let filtered = allOrders;
    
    // Apply client-side date filtering if date filter is active
    if (dateFilter.from && dateFilter.to) {
      const fromDate = new Date(dateFilter.from);
      const toDate = new Date(dateFilter.to);
      
      filtered = filtered.filter((order: Order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= fromDate && orderDate <= toDate;
      });
    }
    
    return filtered;
  }, [allOrders, dateFilter]);

  // Further filter out orders with 0 items
  const ordersWithItems = useMemo(() => {
    return filteredOrders.filter((order: Order) => order.items.length > 0);
  }, [filteredOrders]);
  
  const paginationInfo = orderData?.pagination;

  // Status options for tabs
  const statusOptions: (OrderStatus | 'ALL')[] = [
    'ALL',
    'PENDING',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
  ];

  // Handle tab change - updates graphqlFilters (sent to backend)
  const handleTabChange = (tab: OrderStatus | 'ALL') => {
    setActiveTab(tab);
    const newFilters = {
      ...graphqlFilters,
      status: tab === 'ALL' ? undefined : tab as OrderStatus
    };
    setGraphqlFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSupplierIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSupplierIdInput(e.target.value);
  };

  const applySupplierFilter = () => {
    const newFilters = {
      ...graphqlFilters,
      supplierId: supplierIdInput.trim() || undefined
    };
    setGraphqlFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Date preset handlers - updates client-side dateFilter only
  const handleDatePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let from: Date | null = null;
    let to: Date | null = new Date();
    to.setHours(23, 59, 59, 999);

    switch (preset) {
      case DATE_PRESETS.TODAY:
        from = new Date(today);
        break;
      case DATE_PRESETS.YESTERDAY:
        from = new Date(today);
        from.setDate(from.getDate() - 1);
        to = new Date(today);
        to.setDate(to.getDate() - 1);
        to.setHours(23, 59, 59, 999);
        break;
      case DATE_PRESETS.LAST_7_DAYS:
        from = new Date(today);
        from.setDate(from.getDate() - 7);
        break;
      case DATE_PRESETS.LAST_30_DAYS:
        from = new Date(today);
        from.setDate(from.getDate() - 30);
        break;
      case DATE_PRESETS.THIS_MONTH:
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case DATE_PRESETS.LAST_MONTH:
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        to = new Date(today.getFullYear(), today.getMonth(), 0);
        to.setHours(23, 59, 59, 999);
        break;
      case DATE_PRESETS.CUSTOM:
        setShowDatePicker(true);
        return;
    }

    setShowDatePicker(false);
    if (from) {
      setDateFilter({
        from: from.toISOString(),
        to: to?.toISOString()
      });
    }
  };

  const applyCustomDateFilter = () => {
    if (customDateFrom && customDateTo) {
      const from = new Date(customDateFrom);
      from.setHours(0, 0, 0, 0);
      
      const to = new Date(customDateTo);
      to.setHours(23, 59, 59, 999);

      setDateFilter({
        from: from.toISOString(),
        to: to.toISOString()
      });
      setShowDatePicker(false);
      setDatePreset(DATE_PRESETS.CUSTOM);
    }
  };

  const clearDateFilter = () => {
    setDatePreset('');
    setCustomDateFrom('');
    setCustomDateTo('');
    setShowDatePicker(false);
    setDateFilter({});
  };

  const clearFilters = () => {
    setGraphqlFilters({});
    setDateFilter({});
    setSupplierIdInput('');
    setActiveTab('ALL');
    setDatePreset('');
    setCustomDateFrom('');
    setCustomDateTo('');
    setShowDatePicker(false);
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

  // Check if there's no data after all filtering
  const hasNoData = !loading && ordersWithItems.length === 0;

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      {/* Add global styles for shimmer animation */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .shimmer-animation {
          position: relative;
          overflow: hidden;
          background: #f0f0f0 !important;
        }
        
        .shimmer-animation::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.6),
            transparent
          );
          animation: shimmer 1.8s infinite;
        }
      `}</style>

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
              {!loading ? ordersWithItems.length : '...'}
            </span>
          </div>
          <button 
            onClick={handleRefresh}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200 mb-4 sm:mb-6">
        {/* Status Tabs with Icons */}
        <div className="mb-4">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide" aria-label="Tabs">
              {statusOptions.map((status) => {
                const Icon = statusIcons[status as keyof typeof statusIcons] || ShoppingBag;
                return (
                  <button
                    key={status}
                    onClick={() => handleTabChange(status)}
                    className={`
                      group inline-flex items-center gap-2 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200
                      ${activeTab === status
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon 
                      size={16} 
                      className={`
                        transition-colors duration-200
                        ${activeTab === status 
                          ? 'text-orange-500' 
                          : 'text-gray-400 group-hover:text-gray-500'
                        }
                      `} 
                    />
                    {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Date Filter - CLIENT SIDE ONLY */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Filter by Date
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <select
                  value={datePreset}
                  onChange={(e) => handleDatePresetChange(e.target.value as DatePreset)}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white"
                >
                  <option value="">Select date range</option>
                  <option value={DATE_PRESETS.TODAY}>Today</option>
                  <option value={DATE_PRESETS.YESTERDAY}>Yesterday</option>
                  <option value={DATE_PRESETS.LAST_7_DAYS}>Last 7 days</option>
                  <option value={DATE_PRESETS.LAST_30_DAYS}>Last 30 days</option>
                  <option value={DATE_PRESETS.THIS_MONTH}>This month</option>
                  <option value={DATE_PRESETS.LAST_MONTH}>Last month</option>
                  <option value={DATE_PRESETS.CUSTOM}>Custom range</option>
                </select>
                <Calendar className="absolute right-3 top-2.5 text-gray-400" size={16} />
              </div>
              {datePreset && (
                <button
                  onClick={clearDateFilter}
                  className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  Clear Date
                </button>
              )}
            </div>

            {/* Custom Date Picker */}
            {showDatePicker && (
              <div className="mt-3 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">From</label>
                    <input
                      type="date"
                      value={customDateFrom}
                      onChange={(e) => setCustomDateFrom(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">To</label>
                    <input
                      type="date"
                      value={customDateTo}
                      onChange={(e) => setCustomDateTo(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={applyCustomDateFilter}
                    disabled={!customDateFrom || !customDateTo}
                    className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Supplier ID Filter - Hidden as in original */}
          <div className="hidden">
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

          {/* Clear Filters Button */}
          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {(graphqlFilters.supplierId || graphqlFilters.status || dateFilter.from) && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs sm:text-sm">
              <span className="text-gray-600 whitespace-nowrap">Active filters:</span>
              <div className="flex flex-wrap gap-2">
                {graphqlFilters.supplierId && (
                  <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs sm:text-sm">
                    Supplier: {graphqlFilters.supplierId}
                    <button
                      onClick={() => {
                        const newFilters = { ...graphqlFilters, supplierId: undefined };
                        setGraphqlFilters(newFilters);
                        setSupplierIdInput('');
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                      className="text-orange-600 hover:text-orange-800 text-sm"
                    >
                      ×
                    </button>
                  </span>
                )}
                {graphqlFilters.status && (
                  <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm">
                    Status: {graphqlFilters.status}
                    <button
                      onClick={() => {
                        const newFilters = { ...graphqlFilters, status: undefined };
                        setGraphqlFilters(newFilters);
                        setActiveTab('ALL');
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      ×
                    </button>
                  </span>
                )}
                {dateFilter.from && dateFilter.to && (
                  <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm">
                    Date: {new Date(dateFilter.from).toLocaleDateString()} - {new Date(dateFilter.to).toLocaleDateString()}
                    <button
                      onClick={clearDateFilter}
                      className="text-blue-600 hover:text-blue-800 text-sm"
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
      {!loading && paginationInfo && !hasNoData && (
        <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">
          Showing {ordersWithItems.length} of {paginationInfo.total} orders with items
          {graphqlFilters.supplierId && (
            <span> for supplier: <strong>{graphqlFilters.supplierId}</strong></span>
          )}
          {graphqlFilters.status && (
            <span> with status: <strong>{graphqlFilters.status}</strong></span>
          )}
          {dateFilter.from && dateFilter.to && (
            <span> from: <strong>{new Date(dateFilter.from).toLocaleDateString()}</strong> to <strong>{new Date(dateFilter.to).toLocaleDateString()}</strong></span>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3].map((i) => (
            <OrderCardShimmer key={i} />
          ))}
        </div>
      )}

      {/* No Data State */}
      {!loading && hasNoData ? (
        <div className="bg-gray-50 rounded-lg p-8 lg:p-12 text-center border border-gray-200">
          <Package size={isMobile ? 48 : 64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg lg:text-xl font-semibold text-gray-500 mb-2">No Orders with Items</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            {(graphqlFilters.supplierId || graphqlFilters.status || dateFilter.from)
              ? 'No orders with items match your current filters. Try adjusting your search criteria.'
              : 'There are no orders with items to display at this moment.'}
          </p>
          {(graphqlFilters.supplierId || graphqlFilters.status || dateFilter.from) && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        !loading && (
          <>
            {/* Orders Grid */}
            <div className="space-y-3 sm:space-y-4">
              {ordersWithItems.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow border border-indigo-200 overflow-hidden">
                  {/* Header */}
                  <div className="bg-indigo-50 px-3 lg:px-4 py-2 lg:py-3 border-b border-orange-100">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 lg:gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <span className="font-bold text-indigo-700 text-xs lg:text-sm">
                          Order #{order.orderNumber}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[order.status]}`}>
                        {order.items[0]?.status || order.status}
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

                    {/* Delivery Address */}
                    {order.address && (
                      <div className="bg-green-50 p-3 lg:p-4 rounded-lg mb-4 lg:mb-6">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin size={isMobile ? 16 : 18} className="text-green-600" />
                          <h4 className="font-semibold text-sm lg:text-base text-green-700">Delivery Address</h4>
                        </div>
                        <p className="text-sm text-gray-700">{formatAddress(order.address)}</p>
                        {order.address.lat && order.address.lng && (
                          <p className="text-xs text-gray-500 mt-1">
                            Coordinates: {order.address.lat}, {order.address.lng}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Items Section */}
                    <div className="border-t border-gray-200 pt-3 sm:pt-4">
                      <h4 className="font-medium text-gray-700 text-sm sm:text-base mb-2 sm:mb-3 flex items-center gap-2">
                        <Package size={isMobile ? 16 : 18} className="text-blue-500" />
                        Items ({order.items.length})
                      </h4>
                      
                      <div className="space-y-2 sm:space-y-3">
                        {order.items.map((item) => {
                          // Safely get rider and supplier from possible arrays
                          const rider = getUserFromItem(item, 'rider');
                          const supplier = getUserFromItem(item, 'supplier');
                          
                          return (
                            <div key={item.id} className="flex flex-col xs:flex-row gap-2 sm:gap-3 bg-gray-50 rounded-lg p-2 sm:p-3">
                              {/* Mobile view */}
                              <div className="flex xs:hidden items-center gap-2">
                                {item.product[0]?.images && item.product[0].images.length > 0 && (
                                  <div className="relative w-10 h-10 flex-shrink-0">
                                    <img 
                                      src={item.product[0].images[0]} 
                                      alt={item.product[0].name}
                                      className="w-full h-full object-cover rounded-lg border border-gray-200"
                                    />
                                  </div>
                                )}
                                <div className="flex-1 text-right">
                                  <div className="text-sm font-bold text-gray-900">
                                    {formatCurrency(item.price * item.quantity)}
                                  </div>
                                  {item.status && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusColors[item.status]}`}>
                                      {item.status}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Desktop/tablet view */}
                              <div className="flex flex-1 flex-col xs:flex-row gap-2 sm:gap-3">
                                {item.product[0]?.images && item.product[0].images.length > 0 && (
                                  <div className="hidden xs:block relative w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 flex-shrink-0">
                                    <img 
                                      src={item.product[0].images[0]} 
                                      alt={item.product[0].name}
                                      className="w-full h-full object-cover rounded-lg border border-gray-200"
                                    />
                                  </div>
                                )}
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col gap-0.5 sm:gap-1">
                                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                      <span className="text-[10px] sm:text-xs font-mono bg-gray-200 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-gray-700">
                                        {item.product[0]?.sku || 'N/A'}
                                      </span>
                                      <span className="text-[10px] sm:text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                        Qty: {item.quantity}
                                      </span>
                                      {item.status && (
                                        <span className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full ${statusColors[item.status]}`}>
                                          {item.status}
                                        </span>
                                      )}
                                    </div>
                                    
                                    <h4 className="text-xs sm:text-sm lg:text-base font-medium text-gray-900 truncate">
                                      {item.product[0]?.name || 'Unknown Product'}
                                    </h4>

                                    {/* Supplier info if available */}
                                    {supplier && (
                                      <div className="flex items-center gap-1 mt-1">
                                        <Building size={10} className="text-gray-400" />
                                        <span className="text-xs text-gray-500">
                                          Supplier: {supplier.firstName}
                                        </span>
                                      </div>
                                    )}

                                    {/* Supplier address if available */}
                                    {supplier?.addresses && supplier.addresses.length > 0 && (
                                      <div className="flex items-start gap-1 mt-0.5">
                                        <MapPin size={10} className="text-gray-400 mt-0.5" />
                                        <span className="text-xs text-gray-400 truncate">
                                          From: {supplier.addresses[0].street}, {supplier.addresses[0].city}
                                        </span>
                                      </div>
                                    )}

                                    {/* Rider info if available */}
                                    {rider && (
                                      <div className="mt-2 pt-1 border-t border-dashed border-gray-200">
                                        <div className="flex items-center gap-1">
                                          <Bike size={12} className="text-orange-500" />
                                          <span className="text-xs font-medium text-orange-600">
                                            Rider: {rider.firstName}
                                          </span>
                                        </div>
                                        
                                        {/* Rider Address */}
                                        {rider.addresses && rider.addresses.length > 0 && (
                                          <div className="flex items-start gap-1 mt-0.5 ml-4">
                                            <MapPin size={10} className="text-gray-400 mt-0.5" />
                                            <span className="text-xs text-gray-400 truncate">
                                              {rider.addresses[0].street}, {rider.addresses[0].city}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
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
                          );
                        })}
                      </div>
                    </div>

                    {/* Order Footer */}
                    <div className="border-t border-gray-200 pt-3 sm:pt-4 mt-3 sm:mt-4">
                      <div className="flex justify-between items-center text-xs sm:text-sm text-gray-600">
                        <p>Items: {order.items.length}</p>
                        <p>Payments: {order.payments.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination - FIXED with proper null checks */}
            {paginationInfo && paginationInfo.totalPages > 1 && (
              <div className="mt-6 sm:mt-8">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
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

                  <div className="text-xs sm:text-sm text-gray-600 order-1 sm:order-2">
                    Page {paginationInfo.page} of {paginationInfo.totalPages}
                  </div>

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
        )
      )}
    </div>
  );
            }
