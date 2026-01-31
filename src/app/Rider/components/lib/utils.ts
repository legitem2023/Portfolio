import { Order } from "./types";

// Helper function to format money in Philippine Peso
export const formatPeso = (amount: number): string => {
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// Helper function to calculate distance (simplified - in real app use coordinates)
export const calculateDistance = (address1?: any, address2?: any): string => {
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

// Helper function to get primary pickup address
export const getPickupAddress = (order: Order): { address?: any; supplierName: string; supplier?: any } => {
  // Try to get supplier address from any item
  for (const item of order.items) {
    // Check if supplier exists and is an array with at least one element
    if (item.supplier && Array.isArray(item.supplier) && item.supplier.length > 0) {
      const supplier = item.supplier[0];
      
      // Check if supplier has addresses
      if (supplier.addresses && supplier.addresses.length > 0) {
        const address = supplier.addresses[0];
        const supplierName = supplier.firstName || item.product.name || "Supplier";
        
        return { address, supplierName, supplier };
      }
    }
  }
  
  // If no supplier address found, use product name as fallback
  const productName = order.items[0]?.product?.name || "Restaurant";
  return { address: undefined, supplierName: productName, supplier: undefined };
};

// Map GraphQL orders to delivery format
export const mapOrderToDelivery = (order: Order, index: number) => {
  console.log("Processing order:", order);
  console.log("Order items:", order.items);
  
  const itemsCount = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
  const firstName = order.user?.firstName || "Customer";
  const orderId = order.orderNumber || `ORD-${order.id.slice(-6).toUpperCase()}`;
  
  // Use the actual address from the order for dropoff
  const dropoffAddress = order.address;
  const dropoffFormatted = dropoffAddress?.street 
    ? `${dropoffAddress.street}, ${dropoffAddress.city}, ${dropoffAddress.state} ${dropoffAddress.zipCode}`
    : "Address not available";
  
  // Get pickup address from supplier
  const { address: pickupAddress, supplierName, supplier } = getPickupAddress(order);
  
  console.log("Pickup address found:", pickupAddress);
  console.log("Supplier name:", supplierName);
  
  // Format pickup address
  let pickupFormatted = "Pickup location not available";
  if (pickupAddress?.street) {
    pickupFormatted = `${pickupAddress.street}, ${pickupAddress.city}, ${pickupAddress.state} ${pickupAddress.zipCode}`;
  }
  
  // Calculate distance
  const distance = calculateDistance(pickupAddress, dropoffAddress);
  
  // Calculate payout in Philippine Peso (30% of total as payout)
  const payoutAmount = order.total * 0.3;
  const payout = formatPeso(payoutAmount);
  
  // Calculate expiration time based on order creation
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

  return {
    id: order.id,
    orderId,
    restaurant: supplierName,
    customer: firstName,
    distance,
    pickup: pickupFormatted,
    dropoff: dropoffFormatted,
    payout,
    payoutAmount,
    expiresIn,
    items: itemsCount,
    orderData: order,
    dropoffAddress: order.address,
    pickupAddress,
    supplierName,
    supplier
  };
};
