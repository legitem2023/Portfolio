"use client";
import { useState, useEffect } from "react";
import Head from "next/head";
import { useQuery, gql } from "@apollo/client";
import { 
  Navigation, 
  Package, 
  Map, 
  Calendar,
  BarChart,
  MessageSquare,
  User,
  Bell,
  Shield,
  Battery,
  Wifi,
  Zap,
  Target,
  Star,
  Clock,
  Phone,
  AlertTriangle,
  MapPin,
  CheckCircle,
  Power,
  Truck,
  DollarSign,
  AlertCircle,
  ThumbsUp,
  X,
  Loader2,
  Building
} from "lucide-react";

// GraphQL Query with address field
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
        }
        items {
          id
          supplierId
          quantity
          price
          product {
            name
            sku
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

// TypeScript interfaces for the GraphQL response
interface Address {
  id?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface Supplier {
  id: string;
  firstName: string;
  addresses: Address[];
}

interface OrderItem {
  id: string;
  supplierId: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    sku: string;
  };
  supplier?: Supplier[];
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
}

interface OrderUser {
  id: string;
  firstName: string;
  email: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  user: OrderUser;
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

interface OrderListResponse {
  orderlist: {
    orders: Order[];
    pagination: Pagination;
  };
}

// Define the type for grouped items by supplier
interface SupplierGroup {
  supplierId: string;
  items: OrderItem[];
  supplierInfo?: {
    address?: Address;
    supplierName: string;
    supplier?: Supplier;
  };
}

// Helper function to calculate distance (simplified - in real app use coordinates)
const calculateDistance = (address1?: Address, address2?: Address): string => {
  if (!address1 || !address2) return "Distance not available";
  
  // Simple mock distance calculation based on zip codes
  const zip1 = parseInt(address1.zipCode) || 0;
  const zip2 = parseInt(address2.zipCode) || 0;
  const diff = Math.abs(zip1 - zip2);
  
  if (diff < 1000) return "0.5-1 miles";
  if (diff < 5000) return "1-2 miles";
  if (diff < 10000) return "2-3 miles";
  if (diff < 20000) return "3-5 miles";
  return "5+ miles";
};

// Helper function to format money in Philippine Peso
const formatPeso = (amount: number): string => {
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// Helper function to get supplier info from an item
const getSupplierInfo = (item: OrderItem): { address?: Address; supplierName: string; supplier?: Supplier } => {
  if (item.supplier && Array.isArray(item.supplier) && item.supplier.length > 0) {
    const supplier = item.supplier[0];
    const supplierName = supplier.firstName || item.product.name || "Supplier";
    
    if (supplier.addresses && supplier.addresses.length > 0) {
      const address = supplier.addresses[0];
      return { address, supplierName, supplier };
    }
  }
  
  return { address: undefined, supplierName: item.product.name || "Supplier", supplier: undefined };
};

// Group order items by supplier and map to delivery format
const mapOrdersToDeliveriesBySupplier = (order: Order) => {
  const firstName = order.user?.firstName || "Customer";
  const orderId = order.orderNumber || `ORD-${order.id.slice(-6).toUpperCase()}`;
  const dropoffAddress = order.address;
  
  // Group items by supplier
  const itemsBySupplier = new Map<string, SupplierGroup>();
  
  order.items.forEach(item => {
    const supplierId = item.supplierId || "unknown";
    const supplierInfo = getSupplierInfo(item);
    
    if (!itemsBySupplier.has(supplierId)) {
      itemsBySupplier.set(supplierId, {
        supplierId,
        items: [item],
        supplierInfo
      });
    } else {
      const existing = itemsBySupplier.get(supplierId)!;
      existing.items.push(item);
    }
  });
  
  // Create a separate delivery for each supplier
  const deliveries: Array<{
    id: string;
    originalOrderId: string;
    orderId: string;
    restaurant: string;
    customer: string;
    distance: string;
    pickup: string;
    dropoff: string;
    payout: string;
    payoutAmount: number;
    expiresIn: string;
    items: number;
    orderData: Order;
    dropoffAddress?: Address;
    pickupAddress?: Address;
    supplierName: string;
    supplier?: Supplier;
    subtotal: string;
    supplierItems?: OrderItem[];
    isPartialDelivery: boolean;
    totalSuppliersInOrder: number;
    supplierIndex: number;
  }> = [];
  
  let index = 0;
  
  itemsBySupplier.forEach((supplierGroup, supplierId) => {
    const { supplierInfo, items } = supplierGroup;
    const pickupAddress = supplierInfo?.address;
    const supplierName = supplierInfo?.supplierName || "Restaurant";
    const supplier = supplierInfo?.supplier;
    
    // Calculate total quantity and payout for this supplier's items
    const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const payoutAmount = subtotal * 0.3; // 30% of subtotal
    
    // Format pickup address
    let pickupFormatted = "Pickup location not available";
    if (pickupAddress?.street) {
      pickupFormatted = `${pickupAddress.street}, ${pickupAddress.city}, ${pickupAddress.state} ${pickupAddress.zipCode}`;
    }
    
    // Format dropoff address
    const dropoffFormatted = dropoffAddress?.street 
      ? `${dropoffAddress.street}, ${dropoffAddress.city}, ${dropoffAddress.state} ${dropoffAddress.zipCode}`
      : "Address not available";
    
    // Calculate distance
    const distance = calculateDistance(pickupAddress, dropoffAddress);
    
    // Calculate expiration time
    const createdAt = new Date(order.createdAt);
    const expiresAt = new Date(createdAt.getTime() + 2 * 60 * 1000);
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    
    let expiresIn = "";
    if (diffSec < 60) {
      expiresIn = `${diffSec}s`;
    } else {
      const minutes = Math.floor(diffSec / 60);
      const seconds = diffSec % 60;
      expiresIn = `${minutes}m ${seconds}s`;
    }
    
    deliveries.push({
      id: `${order.id}-${supplierId}`, // Unique ID for each delivery piece
      originalOrderId: order.id,
      orderId,
      restaurant: supplierName,
      customer: firstName,
      distance,
      pickup: pickupFormatted,
      dropoff: dropoffFormatted,
      payout: formatPeso(payoutAmount),
      payoutAmount,
      expiresIn,
      items: itemsCount,
      orderData: order,
      dropoffAddress,
      pickupAddress,
      supplierName,
      supplier,
      subtotal: formatPeso(subtotal),
      supplierItems: items, // Keep track of which items belong to this supplier
      isPartialDelivery: itemsBySupplier.size > 1,
      totalSuppliersInOrder: itemsBySupplier.size,
      supplierIndex: index + 1
    });
    
    index++;
  });
  
  return deliveries;
};

export default function RiderDashboard() {
  // State to manage active tab
  const [activeTab, setActiveTab] = useState("newDeliveries");
  const [isOnline, setIsOnline] = useState(true);
  const [windowWidth, setWindowWidth] = useState(0);
  
  // GraphQL query for orders
  const { data, loading, error, refetch } = useQuery<OrderListResponse>(ORDER_LIST_QUERY, {
    variables: {
      filter: {
        status: "PENDING"
      },
      pagination: {
        page: 1,
        pageSize: 10
      }
    },
    pollInterval: 10000,
    fetchPolicy: "network-only"
  });

  // Transform GraphQL data to delivery format - split by supplier
  const newDeliveries = data?.orderlist?.orders?.flatMap(mapOrdersToDeliveriesBySupplier) || [];
  console.log("New deliveries by supplier:", newDeliveries);
  console.log("Raw order data:", data?.orderlist?.orders);

  // Get window width for responsive behavior
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check if device is mobile/tablet
  const isMobile = windowWidth < 1024;

  // Tabs for rider tracking system - New Deliveries first
  const tabs = [
    { 
      id: "newDeliveries", 
      label: "New", 
      icon: <Bell size={isMobile ? 20 : 24} />,
      desktopLabel: "New Deliveries",
      hasNotification: true 
    },
    { 
      id: "tracking", 
      label: "Tracking", 
      icon: <Navigation size={isMobile ? 20 : 24} />,
      desktopLabel: "Live Tracking" 
    },
    { 
      id: "deliveries", 
      label: "Active", 
      icon: <Package size={isMobile ? 20 : 24} />,
      desktopLabel: "Active Deliveries" 
    },
    { 
      id: "map", 
      label: "Map", 
      icon: <Map size={isMobile ? 20 : 24} />,
      desktopLabel: "Navigation Map" 
    },
    { 
      id: "performance", 
      label: "Stats", 
      icon: <BarChart size={isMobile ? 20 : 24} />,
      desktopLabel: "Performance" 
    }
  ];

  // Handle accepting a delivery
  const handleAcceptDelivery = (deliveryId: string) => {
    const delivery = newDeliveries.find(d => d.id === deliveryId);
    if (delivery) {
      alert(`Accepted delivery piece from ${delivery.restaurant}\nOrder: ${delivery.orderId}\nPayout: ${delivery.payout}\nItems: ${delivery.items}\nFrom: ${delivery.pickup}\nTo: ${delivery.dropoff}`);
      refetch();
    }
  };

  // Handle rejecting a delivery
  const handleRejectDelivery = (deliveryId: string) => {
    const delivery = newDeliveries.find(d => d.id === deliveryId);
    if (delivery) {
      alert(`Rejected delivery piece from ${delivery.restaurant}\nOrder: ${delivery.orderId}\nFrom: ${delivery.restaurant}\nCustomer address: ${delivery.dropoff}`);
      refetch();
    }
  };

  // Format address for display
  const formatAddress = (address: Address | undefined) => {
    if (!address) return "Address not available";
    
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.zipCode) parts.push(address.zipCode);
    
    return parts.join(", ");
  };

  // Format today's earnings in Peso
  const formatTodayEarnings = (amount: number) => {
    return formatPeso(amount);
  };

  // Format average payout in Peso
  const formatAveragePayout = (amount: number) => {
    return formatPeso(amount);
  };

  // Tab content components
  const renderTabContent = () => {
    switch (activeTab) {
      case "newDeliveries":
        if (loading) {
          return (
            <div className="p-2 lg:p-6 flex flex-col items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-600">Loading delivery requests...</p>
            </div>
          );
        }

        if (error) {
          return (
            <div className="p-2 lg:p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 lg:p-4">
                <h3 className="text-red-800 font-semibold flex items-center gap-2 text-sm lg:text-base">
                  <AlertTriangle size={isMobile ? 18 : 20} />
                  Error loading orders
                </h3>
                <p className="text-red-600 mt-2 text-sm lg:text-base">{error.message}</p>
                <button
                  onClick={() => refetch()}
                  className="mt-3 bg-red-100 text-red-700 px-3 lg:px-4 py-1 lg:py-2 rounded-lg font-medium hover:bg-red-200 transition text-sm lg:text-base"
                >
                  Retry
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="p-2 lg:p-6">
            <div className="flex justify-between items-center mb-3 lg:mb-6">
              <div>
                <h2 className="text-lg lg:text-2xl font-bold flex items-center gap-1 lg:gap-2">
                  <Bell size={isMobile ? 20 : 24} className="text-orange-500" />
                  <span className="text-base lg:text-2xl">New Delivery Requests</span>
                </h2>
                <p className="text-gray-600 text-xs lg:text-base mt-1">
                  {newDeliveries.length} delivery piece{newDeliveries.length !== 1 ? "s" : ""} from {data?.orderlist?.orders?.length || 0} order{data?.orderlist?.orders?.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm text-gray-600">
                <AlertCircle size={isMobile ? 14 : 16} />
                <span className="hidden sm:inline">Requests auto-expire in 2 minutes</span>
                <span className="sm:hidden">2 min expiry</span>
                <button
                  onClick={() => refetch()}
                  className="ml-1 lg:ml-2 text-blue-600 hover:text-blue-800 text-xs lg:text-sm"
                >
                  Refresh
                </button>
              </div>
            </div>

            {newDeliveries.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-4 lg:p-8 text-center">
                <Bell size={isMobile ? 32 : 48} className="mx-auto text-gray-400 mb-3 lg:mb-4" />
                <h3 className="text-base lg:text-lg font-semibold text-gray-600">No New Requests</h3>
                <p className="text-gray-500 text-sm lg:text-base mt-1 lg:mt-2">No pending delivery orders at the moment</p>
              </div>
            ) : (
              <div className="space-y-3 lg:space-y-6">
                {newDeliveries.map((delivery) => (
                  <div key={delivery.id} className="bg-white rounded-lg shadow-lg border border-orange-200 overflow-hidden">
                    {/* Header with timer and order info */}
                    <div className="bg-orange-50 px-3 lg:px-4 py-2 lg:py-3 border-b border-orange-100">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1 lg:gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                          <span className="font-bold text-orange-700 text-xs lg:text-sm">NEW REQUEST</span>
                          {delivery.isPartialDelivery && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">
                              Piece {delivery.supplierIndex} of {delivery.totalSuppliersInOrder}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 lg:gap-2 bg-orange-100 px-2 lg:px-3 py-0.5 lg:py-1 rounded-full">
                          <Clock size={isMobile ? 12 : 14} className="text-orange-600" />
                          <span className="font-bold text-orange-700 text-xs lg:text-sm">{delivery.expiresIn}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2 lg:p-6">
                      {/* Order info */}
                      <div className="flex justify-between items-start mb-3 lg:mb-4">
                        <div>
                          <div className="flex items-center gap-1 lg:gap-2 mb-1 lg:mb-2">
                            <Shield size={isMobile ? 16 : 18} className="text-blue-500" />
                            <div>
                              <h3 className="font-bold text-base lg:text-xl">{delivery.orderId}</h3>
                              {delivery.isPartialDelivery && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Partial delivery - This order has items from {delivery.totalSuppliersInOrder} different suppliers
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 lg:gap-2 text-gray-600 mb-0.5 lg:mb-1">
                            <Building size={isMobile ? 14 : 16} className="text-blue-400" />
                            <span className="font-medium text-sm lg:text-base">{delivery.restaurant}</span>
                          </div>
                          <div className="flex items-center gap-1 lg:gap-2 text-gray-600">
                            <User size={isMobile ? 14 : 16} />
                            <span className="text-sm lg:text-base">{delivery.customer}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl lg:text-3xl font-bold text-green-600">{delivery.payout}</div>
                          <p className="text-gray-500 text-xs lg:text-sm">Payout for this piece</p>
                          {delivery.subtotal && (
                            <p className="text-xs text-gray-400 mt-0.5">Subtotal: {delivery.subtotal}</p>
                          )}
                        </div>
                      </div>

                      {/* Item details for this supplier */}
                      <div className="mb-3 lg:mb-4 bg-gray-50 p-2 lg:p-3 rounded-lg">
                        <h4 className="font-semibold text-sm lg:text-base mb-1 lg:mb-2 flex items-center gap-1 lg:gap-2">
                          <Package size={isMobile ? 14 : 16} />
                          Items from this supplier ({delivery.items} item{delivery.items !== 1 ? "s" : ""})
                        </h4>
                        <div className="space-y-1 lg:space-y-2">
                          {delivery.supplierItems?.map((item) => (
                            <div key={item.id} className="flex justify-between text-xs lg:text-sm">
                              <div>
                                <span className="font-medium">{item.product.name}</span>
                                <span className="text-gray-600 ml-1">(Qty: {item.quantity})</span>
                              </div>
                              <div className="text-gray-700">{formatPeso(item.price * item.quantity)}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Route info */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-4 mb-4 lg:mb-6">
                        <div className="bg-blue-50 p-2 lg:p-3 rounded-lg">
                          <div className="flex items-center gap-1 lg:gap-2 mb-1 lg:mb-2">
                            <MapPin size={isMobile ? 14 : 16} className="text-blue-500" />
                            <span className="font-semibold text-xs lg:text-sm">Pickup From</span>
                          </div>
                          <p className="text-gray-700 text-xs lg:text-sm">{delivery.pickup}</p>
                          {delivery.supplierName && (
                            <div className="mt-1 lg:mt-2 text-xs text-gray-500">
                              <div className="flex items-center gap-0.5 lg:gap-1">
                                <Building size={isMobile ? 8 : 10} />
                                <span className="text-xs">{delivery.supplierName}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-center">
                          <div className="w-full border-t-2 border-dashed border-gray-300 relative">
                            <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-1 lg:px-2">
                              <div className="flex items-center gap-0.5 lg:gap-1 text-gray-500">
                                <Navigation size={isMobile ? 12 : 14} />
                                <span className="text-xs lg:text-sm font-medium">{delivery.distance}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-green-50 p-2 lg:p-3 rounded-lg">
                          <div className="flex items-center gap-1 lg:gap-2 mb-1 lg:mb-2">
                            <MapPin size={isMobile ? 14 : 16} className="text-green-500" />
                            <span className="font-semibold text-xs lg:text-sm">Deliver To</span>
                          </div>
                          <p className="text-gray-700 text-xs lg:text-sm">{delivery.dropoff}</p>
                          {delivery.dropoffAddress && (
                            <div className="mt-1 lg:mt-2 text-xs text-gray-500">
                              <div className="flex items-center gap-0.5 lg:gap-1">
                                <User size={isMobile ? 8 : 10} />
                                <span className="text-xs">{delivery.customer}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Additional info */}
                      <div className="flex flex-wrap gap-2 lg:gap-4 mb-4 lg:mb-6">
                        <div className="flex items-center gap-1 lg:gap-2 bg-gray-50 px-2 lg:px-3 py-1 lg:py-2 rounded-lg">
                          <Package size={isMobile ? 14 : 16} className="text-gray-600" />
                          <span className="text-xs lg:text-sm font-medium">{delivery.items} item{delivery.items !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="flex items-center gap-1 lg:gap-2 bg-gray-50 px-2 lg:px-3 py-1 lg:py-2 rounded-lg">
                          <Navigation size={isMobile ? 14 : 16} className="text-gray-600" />
                          <span className="text-xs lg:text-sm font-medium">{delivery.distance}</span>
                        </div>
                        <div className="flex items-center gap-1 lg:gap-2 bg-gray-50 px-2 lg:px-3 py-1 lg:py-2 rounded-lg">
                          <Clock size={isMobile ? 14 : 16} className="text-gray-600" />
                          <span className="text-xs lg:text-sm font-medium">~15-20 min</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-2 lg:gap-4">
                        <button
                          onClick={() => handleRejectDelivery(delivery.id)}
                          className="bg-white border border-gray-300 text-gray-700 px-3 lg:px-4 py-2 lg:py-3 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-1 lg:gap-2 text-sm lg:text-base"
                        >
                          <X size={isMobile ? 18 : 20} />
                          <span>Reject</span>
                        </button>
                        <button
                          onClick={() => handleAcceptDelivery(delivery.id)}
                          className="bg-green-500 text-white px-3 lg:px-4 py-2 lg:py-3 rounded-lg font-semibold hover:bg-green-600 transition flex items-center justify-center gap-1 lg:gap-2 text-sm lg:text-base"
                        >
                          <ThumbsUp size={isMobile ? 18 : 20} />
                          <span>Accept Delivery</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom stats */}
            <div className="mt-4 lg:mt-8 grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
              <div className="bg-blue-50 p-2 lg:p-4 rounded-lg border border-blue-100">
                <p className="text-gray-600 text-xs lg:text-sm">Today&apos;s Earnings</p>
                <p className="font-bold text-lg lg:text-2xl">{formatPeso(86.50)}</p>
              </div>
              <div className="bg-green-50 p-2 lg:p-4 rounded-lg border border-green-100">
                <p className="text-gray-600 text-xs lg:text-sm">Acceptance Rate</p>
                <p className="font-bold text-lg lg:text-2xl">94%</p>
              </div>
              <div className="bg-purple-50 p-2 lg:p-4 rounded-lg border border-purple-100">
                <p className="text-gray-600 text-xs lg:text-sm">Avg. Payout</p>
                <p className="font-bold text-lg lg:text-2xl">{formatPeso(12.15)}</p>
              </div>
              <div className="bg-orange-50 p-2 lg:p-4 rounded-lg border border-orange-100">
                <p className="text-gray-600 text-xs lg:text-sm">Response Time</p>
                <p className="font-bold text-lg lg:text-2xl">8s</p>
              </div>
            </div>
          </div>
        );
      
      case "tracking":
        return (
          <div className="p-2 lg:p-6">
            <div className="flex justify-between items-center mb-3 lg:mb-6">
              <h2 className="text-lg lg:text-2xl font-bold">Live Tracking Dashboard</h2>
              <button
                onClick={() => setIsOnline(!isOnline)}
                className={`flex items-center gap-1 lg:gap-2 px-2 lg:px-4 py-0.5 lg:py-2 rounded-full font-semibold text-xs lg:text-base ${isOnline ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {isOnline ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs lg:text-base">Online</span>
                  </>
                ) : (
                  <>
                    <Power size={isMobile ? 14 : 16} />
                    <span className="text-xs lg:text-base">Offline</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6">
              <div className="lg:col-span-2 bg-gray-100 rounded-lg p-3 lg:p-4 h-40 lg:h-64 flex flex-col items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 lg:w-20 lg:h-20 text-blue-600 mx-auto mb-2 lg:mb-4" />
                  <p className="text-gray-700 font-medium text-sm lg:text-base">Live Map View</p>
                  <p className="text-gray-500 text-xs lg:text-sm mt-0.5 lg:mt-2">GPS Tracking Active</p>
                </div>
              </div>

              <div className="space-y-2 lg:space-y-4">
                <div className="bg-white p-2 lg:p-4 rounded-lg shadow border">
                  <h3 className="font-semibold text-gray-600 text-xs lg:text-base flex items-center gap-1 lg:gap-2">
                    <Package size={isMobile ? 16 : 18} />
                    <span className="text-sm lg:text-base">Active Deliveries</span>
                  </h3>
                  <p className="font-bold text-xl lg:text-3xl mt-1 lg:mt-2">2</p>
                </div>
                <div className="bg-white p-2 lg:p-4 rounded-lg shadow border">
                  <h3 className="font-semibold text-gray-600 text-xs lg:text-base flex items-center gap-1 lg:gap-2">
                    <Zap size={isMobile ? 16 : 18} />
                    <span className="text-sm lg:text-base">Today&apos;s Earnings</span>
                  </h3>
                  <p className="font-bold text-xl lg:text-3xl mt-1 lg:mt-2">{formatPeso(86.50)}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 lg:mt-6 grid grid-cols-2 md:grid-cols-4 gap-2 lg:gap-4">
              <button className="bg-blue-500 text-white p-2 lg:p-3 rounded-lg font-semibold hover:bg-blue-600 transition flex items-center justify-center gap-1 lg:gap-2 text-xs lg:text-sm">
                <MapPin size={isMobile ? 16 : 18} />
                <span className="hidden sm:inline">Set Destination</span>
                <span className="sm:hidden">Destination</span>
              </button>
              <button className="bg-red-500 text-white p-2 lg:p-3 rounded-lg font-semibold hover:bg-red-600 transition flex items-center justify-center gap-1 lg:gap-2 text-xs lg:text-sm">
                <AlertTriangle size={isMobile ? 16 : 18} />
                <span className="hidden sm:inline">Emergency</span>
                <span className="sm:hidden">Emergency</span>
              </button>
              <button className="bg-green-500 text-white p-2 lg:p-3 rounded-lg font-semibold hover:bg-green-600 transition flex items-center justify-center gap-1 lg:gap-2 text-xs lg:text-sm">
                <CheckCircle size={isMobile ? 16 : 18} />
                <span className="hidden sm:inline">Complete</span>
                <span className="sm:hidden">Complete</span>
              </button>
              <button className="bg-purple-500 text-white p-2 lg:p-3 rounded-lg font-semibold hover:bg-purple-600 transition flex items-center justify-center gap-1 lg:gap-2 text-xs lg:text-sm">
                <Phone size={isMobile ? 16 : 18} />
                <span className="hidden sm:inline">Call</span>
                <span className="sm:hidden">Call</span>
              </button>
            </div>
          </div>
        );
      
      case "deliveries":
        return (
          <div className="p-2 lg:p-6">
            <h2 className="text-lg lg:text-2xl font-bold mb-3 lg:mb-6 flex items-center gap-1 lg:gap-2">
              <Package size={isMobile ? 20 : 24} />
              <span className="text-base lg:text-2xl">Active Deliveries</span>
            </h2>
            
            <div className="space-y-2 lg:space-y-4">
              {[1, 2].map((item) => (
                <div key={item} className="bg-white p-2 lg:p-4 rounded-lg shadow border-l-4 border-blue-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1 lg:gap-2">
                        <Shield size={isMobile ? 14 : 16} className="text-blue-500" />
                        <h3 className="font-bold text-base lg:text-lg">ORD-7894{item}</h3>
                      </div>
                      <p className="text-gray-600 text-sm lg:text-base mt-0.5 lg:mt-1">Customer Address #{item}</p>
                      <div className="mt-1 lg:mt-2 flex items-center gap-1 lg:gap-2">
                        <span className={`px-1.5 lg:px-3 py-0.5 lg:py-1 rounded-full text-xs font-semibold flex items-center gap-0.5 lg:gap-1 ${item === 1 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                          {item === 1 ? (
                            <>
                              <Package size={isMobile ? 10 : 12} />
                              <span className="text-xs">Pickup</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle size={isMobile ? 10 : 12} />
                              <span className="text-xs">Delivery</span>
                            </>
                          )}
                        </span>
                        <span className="text-gray-500 text-xs flex items-center gap-0.5 lg:gap-1">
                          <Clock size={isMobile ? 10 : 12} />
                          <span className="text-xs">{item === 1 ? "15 min" : "8 min"} ETA</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg lg:text-2xl">{item === 1 ? formatPeso(8.50) : formatPeso(12.00)}</p>
                      <p className="text-gray-500 text-xs lg:text-sm">Earnings</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case "map":
        return (
          <div className="p-2 lg:p-6">
            <h2 className="text-lg lg:text-2xl font-bold mb-3 lg:mb-6 flex items-center gap-1 lg:gap-2">
              <Map size={isMobile ? 20 : 24} />
              <span className="text-base lg:text-2xl">Navigation Map</span>
            </h2>
            <div className="bg-gray-900 h-48 lg:h-96 rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <Map className="w-12 h-12 lg:w-20 lg:h-20 mx-auto mb-2 lg:mb-4 text-blue-400" />
                <p className="text-base lg:text-xl font-medium">Full Navigation Map</p>
                <p className="text-gray-400 text-sm lg:text-base mt-0.5 lg:mt-2">Interactive GPS View</p>
              </div>
            </div>
          </div>
        );
      
      case "performance":
        return (
          <div className="p-2 lg:p-6">
            <h2 className="text-lg lg:text-2xl font-bold mb-3 lg:mb-6 flex items-center gap-1 lg:gap-2">
              <BarChart size={isMobile ? 20 : 24} />
              <span className="text-base lg:text-2xl">Performance Stats</span>
            </h2>
            <div className="grid grid-cols-2 gap-2 lg:gap-6">
              <div className="bg-white p-3 lg:p-6 rounded-lg shadow border">
                <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg mb-2 lg:mb-4">
                  <Zap size={isMobile ? 20 : 24} className="text-blue-600" />
                </div>
                <h3 className="font-bold text-sm lg:text-lg">Avg. Speed</h3>
                <p className="font-bold text-xl lg:text-3xl mt-1 lg:mt-2">32 km/h</p>
              </div>
              <div className="bg-white p-3 lg:p-6 rounded-lg shadow border">
                <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg mb-2 lg:mb-4">
                  <Target size={isMobile ? 20 : 24} className="text-green-600" />
                </div>
                <h3 className="font-bold text-sm lg:text-lg">On-time Rate</h3>
                <p className="font-bold text-xl lg:text-3xl mt-1 lg:mt-2">98%</p>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>VendorCity Rider Dashboard</title>
        <meta name="description" content="VendorCity Rider Tracking System" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Desktop Header with Top Navigation */}
      <div className="hidden lg:block">
        <header className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  <span className="text-blue-600">VendorCity</span> Rider Portal
                </h1>
                <p className="text-gray-600 text-sm">
                  {loading ? "Loading..." : `${newDeliveries.length} delivery pieces from ${data?.orderlist?.orders?.length || 0} orders available`}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold">Michael Rider</p>
                  <p className="text-sm text-gray-500">Vehicle: HD 4587</p>
                </div>
                <div className="relative">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    MR
                  </div>
                  <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-red-500"}`}></div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Desktop Top Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex-1 px-4 py-3 border-b-2 font-medium text-sm lg:text-base flex items-center justify-center gap-2 transition-all
                      ${activeTab === tab.id
                        ? "border-blue-600 text-blue-600 bg-blue-50"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }
                    `}
                  >
                    {tab.icon}
                    <span>{tab.desktopLabel}</span>
                    {tab.hasNotification && newDeliveries.length > 0 && activeTab !== tab.id && (
                      <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {newDeliveries.length}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Header (without top navigation) */}
      <div className="lg:hidden">
        <header className="bg-white shadow-lg">
          <div className="px-4 py-3">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  <span className="text-blue-600">VC</span> Rider
                </h1>
                <div className="flex items-center mt-0.5">
                  <div className={`w-2 h-2 rounded-full mr-1.5 ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
                  <p className="text-xs text-gray-500">{isOnline ? "Online" : "Offline"}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="font-semibold text-xs">Michael R.</p>
                  <p className="text-gray-500 text-xs">HD 4587</p>
                </div>
                <div className="relative">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    MR
                  </div>
                  {newDeliveries.length > 0 && activeTab !== "newDeliveries" && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {newDeliveries.length}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Main Content Area - Adjusted padding for mobile bottom nav */}
      <main className={`max-w-7xl mx-auto ${isMobile ? "px-2 pb-24" : "px-6"} ${isMobile ? "pt-2" : "pt-0"}`}>
        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {renderTabContent()}
        </div>

        {/* Status Footer for Desktop */}
        <div className="hidden lg:block mt-4 bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
              <span className="font-medium">{isOnline ? "Live GPS Tracking Active" : "Tracking Paused"}</span>
            </div>
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <Bell size={16} />
              {loading ? "Loading..." : `${newDeliveries.length} delivery piece${newDeliveries.length !== 1 ? "s" : ""} available`}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile/Tablet Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex justify-around items-center px-1 py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex flex-col items-center justify-center p-1 rounded-lg transition-all w-14
                ${activeTab === tab.id
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600"
                }
              `}
            >
              <div className="relative">
                {tab.icon}
                {tab.hasNotification && newDeliveries.length > 0 && activeTab !== tab.id && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center">
                    {newDeliveries.length}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium mt-0.5">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
      }
