'use client';

import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { 
  Package, 
  AlertCircle, 
  RefreshCw,
  TrendingUp,
  Receipt,
  QrCode,
  Printer
} from "lucide-react";

// Reuse the same GraphQL query (but filter by status DELIVERED)
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

// Types (reused from the original component)
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
}

interface OrderPaginationInput {
  page?: number;
  pageSize?: number;
}

interface RemittancePageProps {
  initialSupplierId: string;
  isMobile?: boolean;
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

// Helper to calculate supplier totals (reused)
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

// Shimmer loading component for the table
const RemittanceTableShimmer = () => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking #</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grand Total</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rider Earnings</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VendorCity Earnings (5%)</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TAX (12%)</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remittance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {[1, 2, 3, 4, 5].map((i) => (
            <tr key={i} className="animate-pulse">
              <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
              <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
              <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
              <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
              <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
              <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function RemittancePage({
  initialSupplierId,
  isMobile=false
}:RemittancePageProps) {
  // State for pagination
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10
  });

  // Fetch delivered orders only
  const { loading, error, data, refetch } = useQuery(ORDER_LIST_QUERY, {
    variables: {
      filter: { status: 'DELIVERED', supplierId:initialSupplierId},
      pagination
    },
    fetchPolicy: 'network-only'
  });

  const orderData = data?.orderlist as OrderListResponse | undefined;
  const orders: Order[] = orderData?.orders || [];
  const paginationInfo = orderData?.pagination;

  // Filter orders that have items (should all have items, but safe)
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

  if (error) {
    return (
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center">
            <div className="text-red-500 mr-0 sm:mr-3 mb-2 sm:mb-0">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-medium text-red-800">Failed to load remittance data</h3>
              <p className="text-sm sm:text-base text-red-700 mt-1">{error.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasNoData = !loading && validOrders.length === 0;

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Receipt size={isMobile ? 20 : 24} className="text-green-600" />
            <span>Remittances</span>
          </h1>
          <p className="text-sm text-gray-600">Financial summary for delivered orders – rider earnings, vendor city fees, and remittance amounts</p>
        </div>
        <button 
          onClick={handleRefresh}
          className="p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Loading state */}
      {loading && <RemittanceTableShimmer />}

      {/* No data state */}
      {!loading && hasNoData && (
        <div className="bg-gray-50 rounded-lg p-8 lg:p-12 text-center border border-gray-200">
          <Package size={isMobile ? 48 : 64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg lg:text-xl font-semibold text-gray-500 mb-2">No Delivered Orders</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            There are no delivered orders to process remittances at this moment.
          </p>
        </div>
      )}

      {/* Data table */}
      {!loading && !hasNoData && (
        <>
          <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tracking #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grand Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rider Earnings
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    VendorCity Earnings (5%)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TAX (12%)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remittance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {validOrders.map((order) => {
                  const supplierTotals = calculateSupplierTotals(order.items);
                  const totals = calculateOrderTotals(supplierTotals);
                  const trackingNumber = getTrackingNumber(order);
                  
                  // Calculations
                  const subtotal = totals.subtotal;
                  const riderEarnings = totals.totalShipping;
                  const vendorCityEarnings = subtotal * 0.05; // 5% of subtotal
                  const taxAmount = totals.totalVAT; // VAT (12% of subtotal)
                  const remittance = subtotal - vendorCityEarnings + taxAmount;
                  
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <QrCode size={16} className="text-gray-400" />
                          <span className="text-sm font-mono text-gray-900">{trackingNumber}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(totals.grandTotal)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-green-600">{formatCurrency(riderEarnings)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-blue-600">{formatCurrency(vendorCityEarnings)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-orange-600">{formatCurrency(taxAmount)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-bold text-purple-700">{formatCurrency(remittance)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {paginationInfo && paginationInfo.totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
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
          )}
        </>
      )}
    </div>
  );
}
