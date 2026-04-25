// components/RiderPaymentHistory.tsx
import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { 
  Clock, 
  DollarSign, 
  Package, 
  ShoppingBag, 
  ChevronLeft, 
  ChevronRight,
  CreditCard,
  Wallet,
  Landmark,
  CircleDollarSign,
  Mail,
  User,
  Filter,
  CheckCircle,
  XCircle,
  Clock as PendingIcon,
  Truck,
  Ship
} from 'lucide-react';

// Updated query - includes trackingNumber from items
export const ACTIVE_ORDER_LIST_PAYMENTS = gql`
  query ActiveOrder(
    $filter: OrderFilterInput
    $pagination: OrderPaginationInput
  ) {
    riderPayments(filter: $filter, pagination: $pagination) {
      orders {
        id
        orderNumber
        total
        createdAt
        user {
          id
          firstName
          lastName
          email
          phone
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
          quantity
          price
          status
          trackingNumber
          individualShipping
          individualDistance
          product {
            id
            name
            sku
            images
          }
          supplier {
            id
            firstName
            lastName
            email
            phone
            businessName
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

// Item status enum
enum ItemStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

// Filter status type
type FilterStatus = 'ALL' | 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

// Types
type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  status: string;
  earnings: number;
  individualShipping: number;
  trackingNumber: string;
  price: number;
};

type Payment = {
  id: string;
  amount: number;
  method: string;
  orderId: string;
  orderNumber: string;
  trackingNumber: string;
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
  deliveredItemsTotal: number;
  pendingItemsTotal: number;
  processingItemsTotal: number;
  shippedItemsTotal: number;
  cancelledItemsTotal: number;
  refundedItemsTotal: number;
  items: OrderItem[];
};

type PaymentSummary = {
  totalEarnings: number;
  todayEarnings: number;
  pendingPayments: number;
  processingPayments: number;
  shippedPayments: number;
  completedPayments: number;
  cancelledPayments: number;
  refundedPayments: number;
  deliveredOrders: number;
  totalOrders: number;
};

interface RiderPaymentHistoryProps {
  riderId?: string;
  showSummary?: boolean;
  className?: string;
}

// Helper function to group items by tracking number
const groupItemsByTrackingNumber = (items: OrderItem[]) => {
  const grouped = new Map<string, OrderItem[]>();
  
  items.forEach(item => {
    const trackingKey = item.trackingNumber && item.trackingNumber.trim() !== '' 
      ? item.trackingNumber 
      : 'NO_TRACKING';
    
    if (!grouped.has(trackingKey)) {
      grouped.set(trackingKey, []);
    }
    grouped.get(trackingKey)!.push(item);
  });
  
  return grouped;
};

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    DELIVERED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    SHIPPED: { color: 'bg-indigo-100 text-indigo-800', icon: Ship },
    PROCESSING: { color: 'bg-blue-100 text-blue-800', icon: Truck },
    PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: PendingIcon },
    CANCELLED: { color: 'bg-red-100 text-red-800', icon: XCircle },
    REFUNDED: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
};

// Shimmer Component
const Shimmer = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`relative overflow-hidden bg-gray-100 rounded ${className}`}>
      <div 
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
        }}
      />
    </div>
  );
};

// Shimmer Summary Cards
const ShimmerSummaryCards = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 mb-4 sm:mb-6 px-4 sm:px-6">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <Shimmer className="h-4 w-20 mb-2" />
              <Shimmer className="h-7 w-24" />
            </div>
            <div className="ml-2">
              <Shimmer className="h-6 w-6 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Shimmer Filter Bar
const ShimmerFilterBar = () => {
  return (
    <div className="px-4 sm:px-6 pb-4 border-b border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <Shimmer className="h-4 w-4 rounded" />
        <Shimmer className="h-4 w-32" />
      </div>
      <div className="flex flex-wrap gap-2">
        {[...Array(7)].map((_, index) => (
          <Shimmer key={index} className="h-9 w-24 rounded-lg" />
        ))}
      </div>
    </div>
  );
};

// Shimmer Table Row
const ShimmerTableRow = () => {
  return (
    <tr className="border-b border-gray-200">
      <td className="px-6 py-4"><Shimmer className="h-5 w-28" /></td>
      <td className="px-6 py-4"><Shimmer className="h-5 w-32" /></td>
      <td className="px-6 py-4">
        <Shimmer className="h-5 w-24 mb-1" />
        <Shimmer className="h-4 w-32" />
      </td>
      <td className="px-6 py-4">
        <div className="space-y-2">
          <Shimmer className="h-6 w-48" />
          <Shimmer className="h-6 w-40" />
        </div>
      </td>
      <td className="px-6 py-4"><Shimmer className="h-5 w-20" /></td>
      <td className="px-6 py-4"><Shimmer className="h-5 w-24" /></td>
    </tr>
  );
};

// Shimmer Mobile Card
const ShimmerMobileCard = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <Shimmer className="h-5 w-40 mb-2" />
          <Shimmer className="h-4 w-32" />
        </div>
        <Shimmer className="h-6 w-20" />
      </div>
      <div className="border-t border-gray-100 pt-3 space-y-2">
        <Shimmer className="h-16 w-full" />
        <Shimmer className="h-12 w-full" />
      </div>
    </div>
  );
};

// Summary Cards Component
const PaymentSummaryCards = ({ summary }: { summary: PaymentSummary }) => {
  const cards = [
    {
      title: "Today's Earnings",
      amount: summary.todayEarnings,
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      icon: <Clock className="w-5 h-5 sm:w-6 sm:h-6" />,
    },
    {
      title: 'Total Earnings',
      amount: summary.totalEarnings,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      icon: <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />,
    },
    {
      title: 'Pending Amount',
      amount: summary.pendingPayments,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
      icon: <PendingIcon className="w-5 h-5 sm:w-6 sm:h-6" />,
    },
    {
      title: 'Processing Amount',
      amount: summary.processingPayments,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      icon: <Truck className="w-5 h-5 sm:w-6 sm:h-6" />,
    },
    {
      title: 'Shipped Amount',
      amount: summary.shippedPayments,
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      borderColor: 'border-indigo-200',
      icon: <Ship className="w-5 h-5 sm:w-6 sm:h-6" />,
    },
    {
      title: 'Delivered Orders',
      amount: summary.deliveredOrders,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
      isCount: true,
      subtitle: `Total Orders: ${summary.totalOrders}`,
      icon: <Package className="w-5 h-5 sm:w-6 sm:h-6" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 mb-4 sm:mb-6 px-4 sm:px-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${card.bgColor} border ${card.borderColor} rounded-lg p-3 sm:p-4 transition-all hover:shadow-md`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{card.title}</p>
              <p className={`text-lg sm:text-2xl font-bold ${card.textColor} break-words`}>
                {card.isCount ? card.amount : `₱${card.amount.toFixed(2)}`}
              </p>
              {card.subtitle && (
                <p className="text-xs text-gray-500 mt-1 truncate">{card.subtitle}</p>
              )}
            </div>
            <div className={`${card.textColor} flex-shrink-0 ml-2`}>{card.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Filter Bar Component
const FilterBar = ({ 
  activeFilter, 
  onFilterChange, 
  counts 
}: { 
  activeFilter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
  counts: Record<FilterStatus, number>;
}) => {
  const filters: { value: FilterStatus; label: string; color: string }[] = [
    { value: 'ALL', label: 'All Items', color: 'gray' },
    { value: 'DELIVERED', label: 'Delivered', color: 'green' },
    { value: 'SHIPPED', label: 'Shipped', color: 'indigo' },
    { value: 'PROCESSING', label: 'Processing', color: 'blue' },
    { value: 'PENDING', label: 'Pending', color: 'yellow' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'red' },
    { value: 'REFUNDED', label: 'Refunded', color: 'gray' },
  ];

  const getButtonClasses = (filter: typeof filters[0]) => {
    if (activeFilter === filter.value) {
      const colorMap: Record<string, string> = {
        gray: 'bg-gray-600 text-white',
        green: 'bg-green-600 text-white',
        indigo: 'bg-indigo-600 text-white',
        blue: 'bg-blue-600 text-white',
        yellow: 'bg-yellow-600 text-white',
        red: 'bg-red-600 text-white',
      };
      return colorMap[filter.color] || 'bg-gray-600 text-white';
    }
    
    const colorMap: Record<string, string> = {
      gray: 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200',
      green: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200',
      indigo: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200',
      blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',
      yellow: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200',
      red: 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200',
    };
    return colorMap[filter.color] || 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200';
  };

  return (
    <div className="px-4 sm:px-6 pb-4 border-b border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Filter by Item Status:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${getButtonClasses(filter)}`}
          >
            {filter.label}
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-white bg-opacity-30">
              {counts[filter.value]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Mobile Card View Component - UPDATED with grouping
const MobilePaymentCard = ({ payment, formatCurrency, formatDate, getPaymentMethodIcon, filterStatus }: any) => {
  const filteredItems = filterStatus === 'ALL' 
    ? payment.items 
    : payment.items.filter((item: OrderItem) => item.status === filterStatus);
  
  if (filteredItems.length === 0) return null;
  
  // Group items by tracking number
  const groupedItems = groupItemsByTrackingNumber(filteredItems);
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm">
      {Array.from(groupedItems.entries()).map(([trackingNumber, items]) => {
        const displayTrackingNumber = trackingNumber === 'NO_TRACKING' ? 'No tracking number' : trackingNumber;
        const groupEarnings = items.reduce((sum, item) => sum + item.earnings, 0);
        
        return (
          <div key={`${payment.id}-${trackingNumber}`} className="mb-4 last:mb-0">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="text-sm font-semibold text-gray-900">
                    Tracking #{displayTrackingNumber}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{formatDate(payment.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{formatCurrency(groupEarnings)}</p>
              </div>
            </div>
            
            <div className="border-t border-gray-100 pt-3 space-y-2">
              {items.map((item: OrderItem, idx: number) => (
                <div key={idx} className="flex justify-between items-start py-1">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-gray-900 font-medium">{item.name}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Qty: {item.quantity} × ₱{item.individualShipping.toFixed(2)} shipping
                      {item.price > 0 && <span className="ml-2">(Item price: ₱{item.price.toFixed(2)})</span>}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    {formatCurrency(item.earnings)}
                  </span>
                </div>
              ))}
              
              <div className="border-t border-gray-100 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Customer:</span>
                  <span className="text-sm text-gray-900 text-right flex-1 ml-2 flex items-center justify-end gap-1">
                    <User className="w-3 h-3" />
                    {payment.customerName || 'N/A'}
                  </span>
                </div>
                {payment.customerEmail && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">Email:</span>
                    <span className="text-xs text-gray-600 text-right flex-1 ml-2 break-words flex items-center justify-end gap-1">
                      <Mail className="w-3 h-3" />
                      {payment.customerEmail}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">Payment Method:</span>
                  <span className="text-sm text-gray-900 flex items-center gap-1">
                    {getPaymentMethodIcon(payment.method)}
                    <span>{payment.method}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Main Component
export default function RiderPaymentHistory({
  riderId,
  showSummary = true,
  className = '',
}: RiderPaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('ALL');
  const [filterCounts, setFilterCounts] = useState<Record<FilterStatus, number>>({
    ALL: 0,
    PENDING: 0,
    PROCESSING: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
    REFUNDED: 0,
  });
  const [summary, setSummary] = useState<PaymentSummary>({
    totalEarnings: 0,
    todayEarnings: 0,
    pendingPayments: 0,
    processingPayments: 0,
    shippedPayments: 0,
    completedPayments: 0,
    cancelledPayments: 0,
    refundedPayments: 0,
    deliveredOrders: 0,
    totalOrders: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  const buildOrderFilter = () => {
    const filter: any = {};
    if (riderId) {
      filter.riderId = riderId;
    }
    return filter;
  };

  const { loading, error, data, refetch } = useQuery(ACTIVE_ORDER_LIST_PAYMENTS, {
    variables: {
      filter: buildOrderFilter(),
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
      },
    },
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (data?.riderPayments?.orders) {
      const orders = data.riderPayments.orders;
      
      const extractedPayments: Payment[] = [];
      let totalEarnings = 0;
      let todayEarnings = 0;
      let totalPendingAmount = 0;
      let totalProcessingAmount = 0;
      let totalShippedAmount = 0;
      let totalCancelledAmount = 0;
      let totalRefundedAmount = 0;
      let deliveredOrdersCount = 0;
      
      const uniqueOrders = new Set();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const counts: Record<FilterStatus, number> = {
        ALL: 0,
        PENDING: 0,
        PROCESSING: 0,
        SHIPPED: 0,
        DELIVERED: 0,
        CANCELLED: 0,
        REFUNDED: 0,
      };

      orders.forEach((order: any) => {
        uniqueOrders.add(order.id);
        
        let deliveredItemsTotal = 0;
        let pendingItemsTotal = 0;
        let processingItemsTotal = 0;
        let shippedItemsTotal = 0;
        let cancelledItemsTotal = 0;
        let refundedItemsTotal = 0;
        let hasDeliveredItems = false;
        
        const orderItems: OrderItem[] = [];
        let orderTrackingNumber = '';
        
        if (order.items && order.items.length > 0) {
          order.items.forEach((item: any) => {
            let productName: any;
            if (item.product && item.product[0]) {
              productName = item.product[0].name;
            } else if (item.name) {
              productName = item.name;
            } else if (item.productName) {
              productName = item.productName;
            } else {
              productName = 'Unknown Product';
            }
            
            const itemTrackingNumber = item.trackingNumber || '';
            if (itemTrackingNumber && !orderTrackingNumber) {
              orderTrackingNumber = itemTrackingNumber;
            }
            
            const itemEarnings = item.individualShipping || 0;
            
            orderItems.push({
              id: item.id,
              name: productName,
              quantity: item.quantity,
              status: item.status,
              earnings: itemEarnings,
              individualShipping: item.individualShipping,
              trackingNumber: itemTrackingNumber,
              price: item.price || 0,
            });
            
            const statusKey = item.status as FilterStatus;
            if (counts.hasOwnProperty(statusKey)) {
              counts[statusKey]++;
            }
            counts.ALL++;
            
            if (item.status === ItemStatus.DELIVERED) {
              deliveredItemsTotal += itemEarnings;
              hasDeliveredItems = true;
            } else if (item.status === ItemStatus.SHIPPED) {
              shippedItemsTotal += itemEarnings;
            } else if (item.status === ItemStatus.PENDING) {
              pendingItemsTotal += itemEarnings;
            } else if (item.status === ItemStatus.PROCESSING) {
              processingItemsTotal += itemEarnings;
            } else if (item.status === ItemStatus.CANCELLED) {
              cancelledItemsTotal += itemEarnings;
            } else if (item.status === ItemStatus.REFUNDED) {
              refundedItemsTotal += itemEarnings;
            }
          });
        }
        
        if (hasDeliveredItems) {
          deliveredOrdersCount++;
        }
        
        if (order.payments && order.payments.length > 0) {
          order.payments.forEach((payment: any) => {
            extractedPayments.push({
              id: payment.id,
              amount: payment.amount,
              method: payment.method,
              orderId: order.id,
              orderNumber: order.orderNumber,
              trackingNumber: orderTrackingNumber,
              createdAt: order.createdAt,
              customerName: order.user ? 
                `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() : undefined,
              customerEmail: order.user?.email,
              deliveredItemsTotal,
              pendingItemsTotal,
              processingItemsTotal,
              shippedItemsTotal,
              cancelledItemsTotal,
              refundedItemsTotal,
              items: orderItems,
            });
          });
        } else {
          extractedPayments.push({
            id: order.id,
            amount: order.total || 0,
            method: 'UNKNOWN',
            orderId: order.id,
            orderNumber: order.orderNumber,
            trackingNumber: orderTrackingNumber,
            createdAt: order.createdAt,
            customerName: order.user ? 
              `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() : undefined,
            customerEmail: order.user?.email,
            deliveredItemsTotal,
            pendingItemsTotal,
            processingItemsTotal,
            shippedItemsTotal,
            cancelledItemsTotal,
            refundedItemsTotal,
            items: orderItems,
          });
        }
        
        totalEarnings += deliveredItemsTotal;
        totalPendingAmount += pendingItemsTotal;
        totalProcessingAmount += processingItemsTotal;
        totalShippedAmount += shippedItemsTotal;
        totalCancelledAmount += cancelledItemsTotal;
        totalRefundedAmount += refundedItemsTotal;
        
        const orderDate = new Date(order.createdAt);
        if (orderDate >= today) {
          todayEarnings += deliveredItemsTotal;
        }
      });

      extractedPayments.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setPayments(extractedPayments);
      setFilterCounts(counts);
      
      setSummary({
        totalEarnings,
        todayEarnings,
        pendingPayments: totalPendingAmount,
        processingPayments: totalProcessingAmount,
        shippedPayments: totalShippedAmount,
        completedPayments: totalEarnings,
        cancelledPayments: totalCancelledAmount,
        refundedPayments: totalRefundedAmount,
        deliveredOrders: deliveredOrdersCount,
        totalOrders: uniqueOrders.size,
      });

      if (data.riderPayments.pagination) {
        setPagination({
          page: data.riderPayments.pagination.page || 1,
          pageSize: data.riderPayments.pagination.pageSize || 10,
          total: data.riderPayments.pagination.total || 0,
          totalPages: data.riderPayments.pagination.totalPages || 0,
        });
      }
    }
  }, [data]);

  useEffect(() => {
    if (activeFilter === 'ALL') {
      setFilteredPayments(payments);
    } else {
      const filtered = payments.filter(payment => 
        payment.items.some(item => item.status === activeFilter)
      );
      setFilteredPayments(filtered);
    }
  }, [activeFilter, payments]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination({ ...pagination, page: newPage });
      refetch();
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    const methodLower = method?.toLowerCase() || '';
    
    if (methodLower.includes('card') || methodLower === 'card') {
      return <CreditCard className="w-4 h-4" />;
    } else if (methodLower.includes('cash')) {
      return <Wallet className="w-4 h-4" />;
    } else if (methodLower.includes('bank')) {
      return <Landmark className="w-4 h-4" />;
    } else if (methodLower.includes('online')) {
      return <CircleDollarSign className="w-4 h-4" />;
    }
    
    return <CreditCard className="w-4 h-4" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // Add CSS animation to the document head
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes shimmer {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Shimmer className="h-6 w-6 rounded" />
            <Shimmer className="h-6 w-48" />
          </div>
          {riderId && (
            <Shimmer className="h-4 w-32 mt-2" />
          )}
          <Shimmer className="h-3 w-64 mt-1" />
        </div>

        {showSummary && <ShimmerSummaryCards />}

        <ShimmerFilterBar />

        {/* Desktop Shimmer Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left"><Shimmer className="h-4 w-16" /></th>
                <th className="px-6 py-3 text-left"><Shimmer className="h-4 w-20" /></th>
                <th className="px-6 py-3 text-left"><Shimmer className="h-4 w-20" /></th>
                <th className="px-6 py-3 text-left"><Shimmer className="h-4 w-16" /></th>
                <th className="px-6 py-3 text-left"><Shimmer className="h-4 w-20" /></th>
                <th className="px-6 py-3 text-left"><Shimmer className="h-4 w-16" /></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...Array(5)].map((_, index) => (
                <ShimmerTableRow key={index} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Shimmer Cards */}
        <div className="md:hidden px-4 py-2">
          {[...Array(3)].map((_, index) => (
            <ShimmerMobileCard key={index} />
          ))}
        </div>

        {/* Shimmer Pagination */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <Shimmer className="h-5 w-32" />
            <div className="flex gap-2">
              <Shimmer className="h-8 w-20 rounded" />
              <Shimmer className="h-8 w-20 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('GraphQL Error:', error);
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12 text-red-600 px-4">
          <p className="font-semibold mb-2">Error loading payments:</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Rider Payment History</h2>
        </div>
        {riderId && (
          <p className="text-xs sm:text-sm text-gray-500 mt-2">Rider ID: {riderId}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          Earnings = Sum of individualShipping for delivered items
        </p>
      </div>

      {showSummary && <PaymentSummaryCards summary={summary} />}

      <FilterBar 
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={filterCounts}
      />

      {filteredPayments.length === 0 ? (
        <div className="text-center py-12 text-gray-500 px-4">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm">No payment records found for this filter</p>
          {activeFilter !== 'ALL' && (
            <button
              onClick={() => setActiveFilter('ALL')}
              className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear Filter
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View - UPDATED with grouping */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => {
                  // Filter items based on active filter
                  const filteredItems = activeFilter === 'ALL' 
                    ? payment.items 
                    : payment.items.filter(item => item.status === activeFilter);
                  
                  // Group filtered items by tracking number
                  const groupedItems = groupItemsByTrackingNumber(filteredItems);
                  
                  return Array.from(groupedItems.entries()).map(([trackingNumber, items]) => {
                    const displayTrackingNumber = trackingNumber === 'NO_TRACKING' ? 'No tracking number' : trackingNumber;
                    const groupEarnings = items.reduce((sum, item) => sum + item.earnings, 0);
                    
                    return (
                      <tr key={`${payment.id}-${trackingNumber}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {displayTrackingNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {payment.customerName || 'N/A'}
                          </div>
                          {payment.customerEmail && (
                            <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                              <Mail className="w-3 h-3" />
                              {payment.customerEmail}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="space-y-2">
                            {items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{item.name}</span>
                                <span className="text-xs">(x{item.quantity})</span>
                                <StatusBadge status={item.status} />
                                <span className="text-xs text-gray-400">
                                  ₱{item.individualShipping.toFixed(2)}/item
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(groupEarnings)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            {getPaymentMethodIcon(payment.method)}
                            {payment.method}
                          </span>
                        </td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View - UPDATED with grouping */}
          <div className="md:hidden px-4 py-2">
            {filteredPayments.map((payment) => (
              <MobilePaymentCard
                key={payment.id}
                payment={payment}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                getPaymentMethodIcon={getPaymentMethodIcon}
                filterStatus={activeFilter}
              />
            ))}
          </div>
        </>
      )}

      {pagination.totalPages > 1 && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
            <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-2 sm:px-3 py-1 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-gray-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-2 sm:px-3 py-1 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
    }
