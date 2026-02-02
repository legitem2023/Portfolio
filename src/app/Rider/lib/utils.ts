import { Address, OrderItem, Supplier, Order } from './types';

// Helper function to calculate distance (simplified - in real app use coordinates)
export const calculateDistance = (address1?: Address, address2?: Address): string => {
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
export const formatPeso = (amount: number): string => {
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// Helper function to get supplier info from an item
export const getSupplierInfo = (item: OrderItem): { address?: Address; supplierName: string; supplier?: Supplier } => {
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
export const mapOrdersToDeliveriesBySupplier = (order: Order) => {
  const firstName = order.user?.firstName || "Customer";
  const userId = order.userId;
  const orderId = order.orderNumber || `ORD-${order.id.slice(-6).toUpperCase()}`;
  const dropoffAddress = order.address;
  
  // Group items by supplier
  const itemsBySupplier: Record<string, {
    supplierId: string;
    items: OrderItem[];
    supplierInfo?: { address?: Address; supplierName: string; supplier?: Supplier };
  }> = {};
  
  order.items.forEach(item => {
    const supplierId = item.supplierId || "unknown";
    const supplierInfo = getSupplierInfo(item);
    
    if (!itemsBySupplier[supplierId]) {
      itemsBySupplier[supplierId] = {
        supplierId,
        items: [item],
        supplierInfo
      };
    } else {
      itemsBySupplier[supplierId].items.push(item);
    }
  });
  
  // Create a separate delivery for each supplier
  const deliveries: Array<{
    id: string;
    originalOrderId: string;
    orderId: string;
    restaurant: string;
    customer: string;
    customerId: string;
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
  Object.values(itemsBySupplier).forEach((supplierGroup) => {
    const { supplierInfo, items } = supplierGroup;
    const pickupAddress = supplierInfo?.address;
    const supplierName = supplierInfo?.supplierName || "Restaurant";
    const supplier = supplierInfo?.supplier;
    const supplierId = supplierGroup.supplierId;
    
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
      id: `${order.id}-${supplierId}`,
      originalOrderId: order.id,
      orderId,
      restaurant: supplierName,
      customer: firstName,
      customerId: userId,
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
      supplierItems: items,
      isPartialDelivery: Object.keys(itemsBySupplier).length > 1,
      totalSuppliersInOrder: Object.keys(itemsBySupplier).length,
      supplierIndex: index + 1
    });
    
    index++;
  });
  
  return deliveries;
};

// Helper function to format address for display
export const formatAddress = (address: Address | undefined) => {
  if (!address) return "Address not available";
  
  const parts = [];
  if (address.street) parts.push(address.street);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.zipCode) parts.push(address.zipCode);
  
  return parts.join(", ");
};

// Format today's earnings in Peso
export const formatTodayEarnings = (amount: number) => {
  return formatPeso(amount);
};

// Format average payout in Peso
export const formatAveragePayout = (amount: number) => {
  return formatPeso(amount);
};
