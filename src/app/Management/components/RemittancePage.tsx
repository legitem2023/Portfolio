'use client';

import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { 
  Package, 
  AlertCircle, 
  RefreshCw,
  Receipt,
  QrCode,
  Truck,
  Building2,
  Landmark,
  DollarSign,
  Tag
} from "lucide-react";

// GraphQL query (same as before)
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

// Types (unchanged)
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
  lastName?: string;
  email?: string;
  phone?: string;
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
  individualShipping?: number;
  individualDistance?: number;
  trackingNumber?: string;
  product: Array<{
    name: string;
    sku: string;
    images: string[];
  }>;
  rider?: User;
  supplier?: User;
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
    lastName: string;
    email: string;
  };
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

interface OrderFilterInput {
  status?: OrderStatus;
  supplierId?: string;
}

interface OrderPaginationInput {
  page?: number;
  pageSize?: number;
}

interface RemittancePageProps {
  initialSupplierId?: string;
}

// VAT rate (12% in Philippines)
const VAT_RATE = Number(process.env.NEXT_PUBLIC_VAT) || 0.12;

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Helper to safely get user data
const getUserFromItem = (user: User | User[] | undefined): User | undefined => {
  if (!user) return undefined;
  return Array.isArray(user) ? user[0] : user;
};

// Helper to calculate supplier totals
interface SupplierTotal {
  supplierId: string;
  supplierName: string;
  subtotal: number;
  totalShipping: number;
  totalDistance: number;
  vat: number;
  grandTotal: number;
  items: OrderItem[];
  trackingNumbers: string[];
}

const calculateSupplierTotals = (items: OrderItem[]): SupplierTotal[] => {
  const supplierMap = new Map<string, SupplierTotal>();
  
  items.forEach(item => {
    const supplier = getUserFromItem(item.supplier);
    const supplierId = item.supplierId || supplier?.id || 'unknown';
    const supplierName = supplier 
      ? `${supplier.firstName} ${supplier.lastName || ''}`.trim() || 'Unknown Supplier'
      : 'Unknown Supplier';
    
    const itemSubtotal = item.price * item.quantity;
    const itemShipping = item.individualShipping || 0;
    const itemDistance = item.individualDistance || 0;
    
    if (supplierMap.has(supplierId)) {
      const existing = supplierMap.get(supplierId)!;
      existing.subtotal += itemSubtotal;
      existing.totalShipping += itemShipping;
      existing.totalDistance += itemDistance;
      existing.items.push(item);
      if (item.trackingNumber) {
        existing.trackingNumbers.push(item.trackingNumber);
      }
    } else {
      supplierMap.set(supplierId, {
        supplierId,
        supplierName,
        subtotal: itemSubtotal,
        totalShipping: itemShipping,
        totalDistance: itemDistance,
        vat: 0,
        grandTotal: 0,
        items: [item],
        trackingNumbers: item.trackingNumber ? [item.trackingNumber] : []
      });
    }
  });
  
  const suppliers = Array.from(supplierMap.values());
  suppliers.forEach(supplier => {
    const totalBeforeVAT = supplier.subtotal + supplier.totalShipping;
    supplier.vat = supplier.subtotal * VAT_RATE;
    supplier.grandTotal = totalBeforeVAT + supplier.vat;
  });
  
  return suppliers;
};

// Helper to calculate order totals
interface OrderTotals {
  subtotal: number;
  totalShipping: number;
  totalVAT: number;
  grandTotal: number;
  supplierBreakdown: SupplierTotal[];
}

const calculateOrderTotals = (supplierTotals: SupplierTotal[]): OrderTotals => {
  const subtotal = supplierTotals.reduce((sum, s) => sum + s.subtotal, 0);
  const totalShipping = supplierTotals.reduce((sum, s) => sum + s.totalShipping, 0);
  const totalVAT = supplierTotals.reduce((sum, s) => sum + s.vat, 0);
  const grandTotal = supplierTotals.reduce((sum, s) => sum + s.grandTotal, 0);
  
  return {
    subtotal,
    totalShipping,
    totalVAT,
    grandTotal,
    supplierBreakdown: supplierTotals
  };
};

// Helper to get tracking number (first item's tracking)
const getTrackingNumber = (order: Order): string => {
  return order.items[0]?.trackingNumber || 'N/A';
};

// Card Shimmer Loading
const CardShimmer = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between"><div className="h-4 bg-gray-200 rounded w-20"></div><div className="h-4 bg-gray-200 rounded w-16"></div></div>
            <div className="flex justify-between"><div className="h-4 bg-gray-200 rounded w-20"></div><div className="h-4 bg-gray-200 rounded w-16"></div></div>
            <div className="flex justify-between"><div className="h-4 bg-gray-200 rounded w-20"></div><div className="h-4 bg-gray-200 rounded w-16"></div></div>
            <div className="flex justify-between"><div className="h-4 bg-gray-200 rounded w-20"></div><div className="h-4 bg-gray-200 rounded w-16"></div></div>
            <div className="flex justify-between"><div className="h-4 bg-gray-200 rounded w-20"></div><div className="h-4 bg-gray-200 rounded w-16"></div></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function RemittancePage({ initialSupplierId }: RemittancePageProps) {
  // State for pagination
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10
  });

  // Build filter object with supplierId if provided
  const filter: OrderFilterInput = { status: 'DELIVERED' };
  if (initialSupplierId) {
    filter.supplierId = initialSupplierId;
  }

  // Fetch delivered orders, optionally filtered by supplier
  const { loading, error, data, refetch } = useQuery(ORDER_LIST_QUERY, {
    variables: {
      filter,
      pagination
    },
    fetchPolicy: 'network-only'
  });

  const orderData = data?.orderlist as OrderListResponse | undefined;
  const orders: Order[] = orderData?.orders || [];
  const paginationInfo = orderData?.pagination;

  // Filter orders that have items
  const validOrders = orders.filter(order => order.items.length > 0);

  const handleRefresh = () => {
    refetch();
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, page: 1 }));
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      {/* Card wrapper */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header section */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 flex flex-wrap justify-between items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              <span>Remittances</span>
            </h1>
            <p className="text-sm text-gray-600">
              Financial summary for delivered orders – rider earnings, vendor city fees, and remittance amounts
              {initialSupplierId && ' (filtered by supplier)'}
            </p>
          </div>
          <button 
            onClick={handleRefresh}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Content area with padding */}
        <div className="p-4 sm:p-6">
          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                <div>
                  <h3 className="text-base sm:text-lg font-medium text-red-800">Failed to load remittance data</h3>
                  <p className="text-sm sm:text-base text-red-700 mt-1">{error.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && !error && <CardShimmer />}

          {/* No data state */}
          {!loading && !error && validOrders.length === 0 && (
            <div className="bg-gray-50 rounded-lg p-6 sm:p-8 lg:p-12 text-center border border-gray-200">
              <Package className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-500 mb-2">No Delivered Orders</h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                There are no delivered orders to process remittances at this moment.
              </p>
            </div>
          )}

          {/* Data cards grid */}
          {!loading && !error && validOrders.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {validOrders.map((order) => {
                  const supplierTotals = calculateSupplierTotals(order.items);
                  const totals = calculateOrderTotals(supplierTotals);
                  const trackingNumber = getTrackingNumber(order);
                  
                  // Calculations
                  const subtotal = totals.subtotal;
                  const riderEarnings = totals.totalShipping;
                  const vendorCityEarnings = subtotal * 0.05; // 5% of subtotal
                  const taxAmount = totals.totalVAT;
                  const remittance = subtotal - vendorCityEarnings;
                  const grandtotal = subtotal + riderEarnings + taxAmount;
                  
                  return (
                    <div key={order.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                      {/* Card Header with tracking */}
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <QrCode className="w-4 h-4 text-gray-500" />
                            <span className="text-xs font-mono font-medium text-gray-700">
                              {trackingNumber}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Order #{order.orderNumber}
                          </div>
                        </div>
                      </div>
                      
                      {/* Card Body */}
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                          <span className="text-sm font-medium text-gray-500">Grand Total</span>
                          <span className="text-lg font-bold text-gray-900">{formatCurrency(grandtotal)}</span>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Tag className="w-4 h-4" />
                              <span>Products</span>
                            </div>
                            <span className="text-sm font-semibold text-green-600">{formatCurrency(subtotal)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Truck className="w-4 h-4" />
                              <span>Rider Earnings</span>
                            </div>
                            <span className="text-sm font-semibold text-green-600">{formatCurrency(riderEarnings)}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Building2 className="w-4 h-4" />
                              <span>VendorCity Earnings (5%)</span>
                            </div>
                            <span className="text-sm font-semibold text-blue-600">{formatCurrency(vendorCityEarnings)}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Landmark className="w-4 h-4" />
                              <span>TAX (12%)</span>
                            </div>
                            <span className="text-sm font-semibold text-orange-600">{formatCurrency(taxAmount)}</span>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <DollarSign className="w-4 h-4" />
                            <span>Remittance</span>
                          </div>
                          <span className="text-base font-bold text-purple-700">{formatCurrency(remittance)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {paginationInfo && paginationInfo.totalPages > 1 && (
                <div className="mt-6 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-2">
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

                  <div className="text-xs sm:text-sm text-gray-600">
                    Page {paginationInfo.page} of {paginationInfo.totalPages}
                  </div>

                  <div className="flex gap-2">
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
                    }
