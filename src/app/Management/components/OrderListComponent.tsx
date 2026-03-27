'use client';

import { useState, useMemo, useRef } from 'react';
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
  ShoppingBag,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Bike,
  TrendingUp,
  Receipt,
  QrCode,
  Printer
} from "lucide-react";

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

interface OrderListComponentProps {
  initialSupplierId?: string;
  initialStatus?: OrderStatus;
  isMobile?: boolean;
}

// VAT rate (12% in Philippines)
const VAT_RATE = Number(process.env.NEXT_PUBLIC_VAT);

// Format currency
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

// Status icons mapping for tabs
const statusIcons = {
  ALL: ShoppingBag,
  PENDING: Clock,
  PROCESSING: Loader2,
  SHIPPED: Package,
  DELIVERED: CheckCircle,
  CANCELLED: XCircle
};

// Format address
const formatAddress = (address?: Address): string => {
  if (!address) return 'No address provided';
  return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`;
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
  // State for status filter (sent to GraphQL)
  const [activeTab, setActiveTab] = useState<OrderStatus | 'ALL'>(initialStatus || 'ALL');
  
  // State for pagination
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10
  });

  // Ref for print container
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Fetch orders
  const { loading, error, data, refetch } = useQuery(ORDER_LIST_QUERY, {
    variables: {
      filter: {
        status: activeTab === 'ALL' ? undefined : activeTab
      },
      pagination
    },
    fetchPolicy: 'network-only'
  });

  // Get orders
  const orderData = data?.orderlist as OrderListResponse | undefined;
  const allOrders: Order[] = orderData?.orders || [];
  
  // Filter orders and items based on initialSupplierId
  const filteredOrders = useMemo(() => {
    if (!initialSupplierId) {
      // No filter: return orders that have at least one item
      return allOrders.filter(order => order.items.length > 0);
    }

    return allOrders
      .map(order => ({
        ...order,
        items: order.items.filter(item => item.supplierId === initialSupplierId)
      }))
      .filter(order => order.items.length > 0);
  }, [allOrders, initialSupplierId]);
  
  const paginationInfo = orderData?.pagination;

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

  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Handle page size change
  const handlePageSizeChange = (pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, page: 1 }));
  };

  // Aggregate riders
  const getOrderRiders = (items: OrderItem[]): User[] => {
    const ridersMap = new Map<string, User>();
    items.forEach(item => {
      const rider = getUserFromItem(item.rider);
      if (rider && !ridersMap.has(rider.id)) {
        ridersMap.set(rider.id, rider);
      }
    });
    return Array.from(ridersMap.values());
  };

  // Generate HTML for printing
  const generateOrderPrintHTML = (order: Order): string => {
    const supplierTotals = calculateSupplierTotals(order.items);
    const orderTotals = calculateOrderTotals(supplierTotals);
    const orderRiders = getOrderRiders(order.items);

    const trackingNumber = order.items[0]?.trackingNumber || 'N/A';

    const formatDateForPrint = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order #${order.orderNumber}</title>
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: Arial, sans-serif;
            padding: 0.3cm;
            color: #333;
            line-height: 1.3;
          }
          @media print {
            @page {
              size: A6;
              margin: 0.4cm;
            }
            body {
              margin: 0;
              padding: 0.2cm;
              font-size: 9pt;
            }
            .print-header {
              display: flex;
              align-items: center;
              gap: 0.3cm;
              margin-bottom: 0.4cm;
              padding-bottom: 0.2cm;
              border-bottom: 1px solid #ccc;
              text-align: left;
            }
            .qr-code img {
              width: 0.8cm;
              height: 0.8cm;
              display: block;
            }
            .header-text {
              flex: 1;
            }
            .header-text h1 {
              margin: 0;
              font-size: 12pt;
              color: #444;
            }
            .header-text p {
              margin: 0.1cm 0 0;
              color: #666;
              font-size: 9pt;
            }
            .section-title {
              font-size: 10pt;
              margin-bottom: 0.2cm;
              padding-bottom: 0.1cm;
            }
            .info-grid {
              margin-bottom: 0.2cm;
            }
            .info-item {
              margin-bottom: 0.1cm;
            }
            .info-label {
              font-weight: bold;
              margin-bottom: 0.05cm;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 0.3cm;
              font-size: 8pt;
            }
            th, td {
              border: 1px solid #ccc;
              padding: 0.1cm 0.15cm;
            }
            th {
              background-color: #f0f0f0;
            }
            .totals-table {
              width: 100%;
              margin-top: 0.2cm;
            }
            .totals-table td {
              border: none;
              padding: 0.05cm 0;
            }
            .address-block {
              padding: 0.1cm;
              margin-top: 0.1cm;
              font-size: 8pt;
            }
            .supplier-block, .rider-block {
              margin-top: 0.2cm;
              padding-left: 0.2cm;
              border-left: 2px solid #007bff;
            }
            .footer {
              font-size: 7pt;
              margin-top: 0.3cm;
              padding-top: 0.1cm;
            }
          }
          .print-header {
            display: flex;
            align-items: center;
            gap: 0.3cm;
            margin-bottom: 0.4cm;
            padding-bottom: 0.2cm;
            border-bottom: 1px solid #ccc;
            text-align: left;
          }
          .qr-code img {
            width: 0.8cm;
            height: 0.8cm;
            display: block;
          }
          .header-text {
            flex: 1;
          }
          .header-text h1 {
            margin: 0;
            font-size: 12pt;
            color: #444;
          }
          .header-text p {
            margin: 0.1cm 0 0;
            color: #666;
            font-size: 9pt;
          }
          .order-section {
            margin-bottom: 0.3cm;
            page-break-inside: avoid;
          }
          .section-title {
            font-size: 11pt;
            font-weight: bold;
            margin-bottom: 0.2cm;
            padding-bottom: 0.1cm;
            border-bottom: 1px solid #ddd;
            color: #555;
          }
          .info-grid {
            display: flex;
            flex-wrap: wrap;
            margin-bottom: 0.2cm;
          }
          .info-item {
            flex: 1;
            min-width: 150px;
            margin-bottom: 0.15cm;
          }
          .info-label {
            font-weight: bold;
            color: #666;
            margin-bottom: 0.1cm;
            font-size: 8.5pt;
          }
          .info-value {
            color: #333;
            font-size: 9pt;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0.4cm;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 0.15cm;
            text-align: left;
            font-size: 8.5pt;
          }
          th {
            background-color: #f5f5f5;
          }
          .totals-table {
            width: 100%;
            margin-left: 0;
            margin-top: 0.2cm;
          }
          .totals-table td {
            border: none;
            padding: 0.1cm 0;
            font-size: 8.5pt;
          }
          .address-block {
            background-color: #f9f9f9;
            padding: 0.15cm;
            border-radius: 2px;
            margin-top: 0.15cm;
            font-size: 8.5pt;
          }
          .supplier-block, .rider-block {
            margin-top: 0.2cm;
            padding-left: 0.2cm;
            border-left: 2px solid #007bff;
          }
          .footer {
            margin-top: 0.3cm;
            text-align: center;
            font-size: 7.5pt;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 0.2cm;
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <div class="qr-code">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(trackingNumber)}" alt="QR Code" />
          </div>
          <div class="header-text">
            <h1>Order Details</h1>
            <p>Tracking #${trackingNumber}</p>
          </div>
        </div>

        <div class="order-section">
          <div class="section-title">Order Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Order Date:</div>
              <div class="info-value">${formatDateForPrint(order.createdAt)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Customer:</div>
              <div class="info-value">${order.user.firstName} ${order.user.lastName || ''}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Email:</div>
              <div class="info-value">${order.user.email || 'N/A'}</div>
            </div>
          </div>
        </div>

        <div class="order-section">
          <div class="section-title">Delivery Address</div>
          <div class="address-block">
            ${order.address ? `
              ${order.address.street}<br>
              ${order.address.city}, ${order.address.state} ${order.address.zipCode}<br>
              ${order.address.country}
              ${order.address.lat && order.address.lng ? `<br>Coordinates: ${order.address.lat}, ${order.address.lng}` : ''}
            ` : 'No address provided'}
          </div>
        </div>

        <div class="order-section">
          <div class="section-title">Items</div>
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.product[0]?.sku || 'N/A'}</td>
                  <td>${item.product[0]?.name || 'Unknown Product'}</td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrency(item.price)}</td>
                  <td>${formatCurrency(item.price * item.quantity)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        ${orderRiders.length > 0 ? `
          <div class="order-section">
            <div class="section-title">Rider Information</div>
            ${orderRiders.map(rider => `
              <div class="rider-block">
                <div><strong>Name:</strong> ${rider.firstName} ${rider.lastName || ''}</div>
                <div><strong>Phone:</strong> ${rider.phone || 'N/A'}</div>
                ${rider.addresses && rider.addresses[0] ? `
                  <div><strong>Address:</strong> ${rider.addresses[0].street}, ${rider.addresses[0].city}</div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="order-section">
          <div class="section-title">Order Summary</div>
          <table class="totals-table">
            <tr><td>Subtotal (Items):</td><td>${formatCurrency(orderTotals.subtotal)}</td></tr>
            <tr><td>Total Shipping:</td><td>${formatCurrency(orderTotals.totalShipping)}</td></tr>
            <tr><td>VAT (12%):</td><td>${formatCurrency(orderTotals.totalVAT)}</td></tr>
            <tr><td><strong>GRAND TOTAL:</strong></td><td><strong>${formatCurrency(orderTotals.grandTotal)}</strong></td></tr>
          </table>
        </div>

        <div class="footer">
          Generated on ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `;
  };

  const handlePrintOrder = (order: Order) => {
    const printHtml = generateOrderPrintHTML(order);
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();
      printWindow.print();
    } else {
      alert('Please allow pop-ups to print orders.');
    }
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
              <h3 className="text-base sm:text-lg font-medium text-red-800">Failed to load orders</h3>
              <p className="text-sm sm:text-base text-red-700 mt-1">{error.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasNoData = !loading && filteredOrders.length === 0;

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
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

      <div className="flex justify-between items-center mb-4 sm:mb-6 lg:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 flex items-center gap-2">
            <Bell size={isMobile ? 20 : 24} className="text-orange-500" />
            <span>Orders</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Manage and track all orders</p>
        </div>
        <button 
          onClick={handleRefresh}
          className="p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Status Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide" aria-label="Tabs">
          {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => {
            const Icon = statusIcons[status as keyof typeof statusIcons] || ShoppingBag;
            return (
              <button
                key={status}
                onClick={() => setActiveTab(status as OrderStatus | 'ALL')}
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

      {loading && (
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3].map((i) => (
            <OrderCardShimmer key={i} />
          ))}
        </div>
      )}

      {!loading && hasNoData && (
        <div className="bg-gray-50 rounded-lg p-8 lg:p-12 text-center border border-gray-200">
          <Package size={isMobile ? 48 : 64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg lg:text-xl font-semibold text-gray-500 mb-2">
            {initialSupplierId ? 'No Orders for this Supplier' : 'No Orders with Items'}
          </h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            {initialSupplierId
              ? `There are no orders containing items from the selected supplier.`
              : 'There are no orders with items to display at this moment.'}
          </p>
        </div>
      )}

      {!loading && !hasNoData && (
        <>
          <div className="space-y-3 sm:space-y-4">
            {filteredOrders.map((order) => {
              const supplierTotals = calculateSupplierTotals(order.items);
              const orderTotals = calculateOrderTotals(supplierTotals);
              const orderRiders = getOrderRiders(order.items);
              
              return (
                <div key={order.id} className="bg-white rounded-lg shadow border border-indigo-200 overflow-hidden">
                  <div className="bg-indigo-50 px-3 lg:px-4 py-2 lg:py-3 border-b border-orange-100">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 lg:gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <span className="font-bold text-indigo-700 text-xs lg:text-sm">
                          Order #{order.orderNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePrintOrder(order)}
                          className="text-gray-600 hover:text-indigo-700 transition-colors"
                          title="Print Order"
                        >
                          <Printer size={16} />
                        </button>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[order.status]}`}>
                          {order.items[0]?.status || order.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 lg:p-6">
                    <div className="flex flex-col justify-between items-start mb-3 lg:mb-4">
                      <div>
                        <div className="flex items-start gap-2">
                          <QrCode size={isMobile ? 16 : 18} className="text-blue-500" />
                          <h3 className="font-bold text-base break-words">{order.items[0]?.trackingNumber}</h3> 
                        </div>      
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
                    </div>

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

                    {supplierTotals.length > 0 && (
                      <div className="bg-blue-50 p-3 lg:p-4 rounded-lg mb-4 lg:mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Building size={isMobile ? 16 : 18} className="text-blue-600" />
                          <h4 className="font-semibold text-sm lg:text-base text-blue-700">
                            Suppliers Breakdown ({supplierTotals.length})
                          </h4>
                        </div>
                        <div className="space-y-4">
                          {supplierTotals.map((supplier) => (
                            <div key={supplier.supplierId} className="border-l-2 border-blue-200 pl-3">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-800">
                                    {supplier.supplierName}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Supplier ID: {supplier.supplierId}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Items: {supplier.items.length}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t-2 border-blue-300">
                          <div className="bg-white rounded-lg p-3">
                            <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                              <Receipt size={16} className="text-green-600" />
                              Order Summary
                            </h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal (Items):</span>
                                <span className="font-medium">{formatCurrency(orderTotals.subtotal)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Total Shipping:</span>
                                <span className="font-medium text-blue-600">{formatCurrency(orderTotals.totalShipping)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">VAT (12%):</span>
                                <span className="font-medium text-orange-600">{formatCurrency(orderTotals.totalVAT)}</span>
                              </div>
                              <div className="border-t border-gray-200 pt-2 mt-2">
                                <div className="flex justify-between font-bold">
                                  <span className="text-gray-900">GRAND TOTAL:</span>
                                  <span className="text-green-700 text-lg">{formatCurrency(orderTotals.grandTotal)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {orderRiders.length > 0 && (
                      <div className="bg-orange-50 p-3 lg:p-4 rounded-lg mb-4 lg:mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Bike size={isMobile ? 16 : 18} className="text-orange-600" />
                          <h4 className="font-semibold text-sm lg:text-base text-orange-700">Rider</h4>
                        </div>
                        <div className="space-y-3">
                          {orderRiders.map((rider) => (
                            <div key={rider.id} className="border-l-2 border-orange-200 pl-3">
                              <p className="text-sm font-medium text-gray-800">
                                {rider.firstName} {rider.lastName || ''}
                              </p>
                              <p className="text-sm font-medium text-gray-800">
                                {rider.phone}
                              </p>
                              {rider.addresses && rider.addresses.length > 0 && (
                                <div className="flex items-start gap-1 mt-1">
                                  <MapPin size={10} className="text-gray-400 mt-0.5" />
                                  <span className="text-xs text-gray-500">
                                    {rider.addresses[0].street}, {rider.addresses[0].city}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-gray-200 pt-3 sm:pt-4">
                      <h4 className="font-medium text-gray-700 text-sm sm:text-base mb-2 sm:mb-3 flex items-center gap-2">
                        <Package size={isMobile ? 16 : 18} className="text-blue-500" />
                        Items ({order.items.length})
                      </h4>
                      
                      <div className="space-y-2 sm:space-y-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex flex-col xs:flex-row gap-2 sm:gap-3 bg-gray-50 rounded-lg p-2 sm:p-3">
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

                                  {(item.individualShipping || item.trackingNumber) && (
                                    <div className="mt-1 space-y-1">
                                      {item.individualDistance !== undefined && item.individualDistance > 0 && (
                                        <div className="flex items-center gap-1">
                                          <TrendingUp size={10} className="text-gray-500" />
                                          <span className="text-xs text-gray-600">
                                            Distance: {item.individualDistance.toFixed(2)} km
                                          </span>
                                        </div>
                                      )}
                                      {item.trackingNumber && (
                                        <div className="flex items-center gap-1">
                                          <Receipt size={10} className="text-gray-500" />
                                          <span className="text-xs text-gray-600">
                                            Tracking: {item.trackingNumber}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {item.supplierId && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <Building size={10} className="text-gray-400" />
                                      <span className="text-xs text-gray-500">
                                        Supplier: {getUserFromItem(item.supplier)?.firstName || item.supplierId}
                                      </span>
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
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-3 sm:pt-4 mt-3 sm:mt-4">
                      <div className="flex justify-between items-center text-xs sm:text-sm text-gray-600">
                        <p>Items: {order.items.length}</p>
                        <p>Payments: {order.payments.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

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
      )}

      <div ref={printContainerRef} style={{ display: 'none' }}></div>
    </div>
  );
}
