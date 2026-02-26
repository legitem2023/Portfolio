import { ShoppingCart } from 'lucide-react';
import { CartItem, Address } from '../../../../types';
import { useState, useEffect } from 'react';

interface CartStageProps {
  cartItems: CartItem[];
  addresses: Address[];
  subtotal: number;
  tax: number;
  total: number;
  onQuantityChange: (id: string | number, quantity: number) => void;
  onCheckout: () => void;
}

type Coordinate = {
  lat: number;
  lng: number;
};

// Helper function to format price as peso
const formatPesoPrice = (price: number): string => {
  return `₱${price.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// Function to get distance from OSRM API
async function getDistanceInKm(
  pickup: Coordinate,
  dropoff: Coordinate
): Promise<number> {
  const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?overview=false`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.code !== 'Ok') {
    throw new Error('Route not found');
  }

  const route = data.routes[0];
  return route.distance / 1000; // distance in kilometers
}

const OrderSummary = ({ 
  cartItems, 
  addresses,
  subtotal, 
  tax, 
  total, 
  onCheckout 
}: CartStageProps) => {
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState<boolean>(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  
  // Static rates (you can modify these values)
  const BASE_RATE = 50; // Base rate in pesos
  const RATE_PER_KM = 15; // Rate per kilometer in pesos

  useEffect(() => {
    const calculateShipping = async () => {
      if (cartItems.length === 0 || addresses.length === 0) {
        setShippingCost(0);
        setTotalDistance(0);
        return;
      }

      // Get default address for dropoff
      const defaultAddress = addresses.find((item: Address) => item.isDefault === true);
      
      if (!defaultAddress) {
        console.log("No default address found");
        setShippingError("No default delivery address found");
        setShippingCost(0);
        setTotalDistance(0);
        return;
      }

      setIsCalculatingShipping(true);
      setShippingError(null);

      try {
        // Calculate shipping cost
        let accumulatedDistance = 0;
        let itemsWithLocation = 0;

        // Process items sequentially to avoid overwhelming the API
        for (const item of cartItems) {
          // Get pickup location from cart item
          const pickupLat = item.lat;
          const pickupLng = item.lng;
          
          // Get dropoff location from default address
          // Assuming your Address type has lat and lng properties
          const dropoffLat = defaultAddress.lat;
          const dropoffLng = defaultAddress.lng;
          
          if (pickupLat && pickupLng && dropoffLat && dropoffLng) {
            try {
              const distance = await getDistanceInKm(
                { lat: pickupLat, lng: pickupLng },
                { lat: dropoffLat, lng: dropoffLng }
              );
              accumulatedDistance += distance;
              itemsWithLocation++;
              
              console.log(`Item ${item.name}: Distance = ${distance.toFixed(2)} km`);
            } catch (error) {
              console.error(`Error calculating distance for item ${item.name}:`, error);
              // Use Haversine formula as fallback
              const fallbackDistance = calculateHaversineDistance(
                pickupLat, pickupLng,
                dropoffLat, dropoffLng
              );
              accumulatedDistance += fallbackDistance;
              itemsWithLocation++;
              console.log(`Item ${item.name}: Using fallback distance = ${fallbackDistance.toFixed(2)} km`);
            }
          } else {
            console.log(`Item ${item.name} missing location data:`, { pickupLat, pickupLng, dropoffLat, dropoffLng });
          }
        }

        if (itemsWithLocation > 0) {
          setTotalDistance(accumulatedDistance);
          
          // Calculate total shipping cost: Base rate + (total distance * rate per km)
          const totalShippingCost = BASE_RATE + (accumulatedDistance * RATE_PER_KM);
          
          // Divide shipping cost by number of cart items
          const shippingPerItem = totalShippingCost / cartItems.length;
          setShippingCost(shippingPerItem);
          
          console.log("Shipping Calculation Summary:");
          console.log("Total distance:", accumulatedDistance.toFixed(2), "km");
          console.log("Base rate:", BASE_RATE);
          console.log("Rate per km:", RATE_PER_KM);
          console.log("Total shipping cost:", totalShippingCost.toFixed(2));
          console.log("Shipping cost per item:", shippingPerItem.toFixed(2));
        } else {
          setShippingCost(0);
          setTotalDistance(0);
          setShippingError("No items with valid location data found");
          console.log("No items with valid location data found");
        }
      } catch (error) {
        console.error("Error calculating shipping:", error);
        setShippingError("Error calculating shipping cost");
        setShippingCost(0);
        setTotalDistance(0);
      } finally {
        setIsCalculatingShipping(false);
      }
    };

    calculateShipping();
  }, [cartItems, addresses]);

  // Fallback Haversine formula in case OSRM API fails
  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round((R * c) * 100) / 100; // Round to 2 decimal places
  };

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-8 md:py-12 px-4">
        <div className="text-indigo-500 mb-4 flex justify-center">
          <ShoppingCart size={48} className="w-8 h-8 md:w-12 md:h-12" />
        </div>
        <h2 className="text-xl md:text-2xl font-serif font-bold text-indigo-900 mb-2">Your cart is empty</h2>
        <p className="text-indigo-700 text-sm md:text-base">Add some items to your cart to continue shopping</p>
      </div>
    );
  }

  // Calculate new total including shipping
  const totalWithShipping = total + shippingCost;

  return (
    <div className="bg-white rounded">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <h2 className="text-xl md:text-2xl font-serif font-bold text-indigo-900 mb-6 md:mb-8">Order Summary</h2>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items List */}
          <div className="flex-1">
            <h3 className="text-lg font-serif font-bold text-indigo-900 mb-4">Items ({cartItems.length})</h3>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-start gap-4 p-4 bg-indigo-50 rounded-lg">
                  {item.images && item.images[0] && (
                    <img 
                      src={item.images[0]} 
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-indigo-900">{item.name}</h4>
                    <p className="text-sm text-indigo-700">SKU: {item.sku}</p>
                    {item.color && <p className="text-sm text-indigo-600">Color: {item.color}</p>}
                    {item.size && <p className="text-sm text-indigo-600">Size: {item.size}</p>}
                    <p className="text-sm font-medium text-indigo-900 mt-1">
                      {formatPesoPrice(item.price || 0)} x {item.quantity || 1}
                    </p>
                    {item.lat && item.lng ? (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Pickup location available
                      </p>
                    ) : (
                      <p className="text-xs text-red-500 mt-1">
                        ⚠ No pickup location set
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary Section */}
          <div className="lg:w-96">
            <div className="bg-indigo-50 rounded-lg p-6">
              <h3 className="text-lg font-serif font-bold text-indigo-900 mb-4">Order Total</h3>
              
              {isCalculatingShipping && (
                <div className="mb-4 text-sm text-indigo-600 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  Calculating shipping...
                </div>
              )}
              
              {shippingError && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">
                  ⚠ {shippingError}
                </div>
              )}
              
              <div className="flow-root">
                <dl className="-my-4 text-sm divide-y divide-indigo-200">
                  <div className="py-4 flex items-center justify-between">
                    <dt className="text-indigo-700">Subtotal</dt>
                    <dd className="font-medium text-indigo-900">{formatPesoPrice(subtotal)}</dd>
                  </div>
                  
                  <div className="py-4 flex items-center justify-between">
                    <dt className="text-indigo-700">Shipping</dt>
                    <dd className="font-medium text-indigo-900 text-right">
                      <div>{formatPesoPrice(shippingCost)}</div>
                      {totalDistance > 0 && (
                        <div className="text-xs text-indigo-500 mt-1">
                          <div>Total road distance: {totalDistance.toFixed(2)} km</div>
                          <div>₱{BASE_RATE} base + ₱{RATE_PER_KM}/km</div>
                          <div>÷ {cartItems.length} item{cartItems.length > 1 ? 's' : ''}</div>
                        </div>
                      )}
                    </dd>
                  </div>
                  
                  <div className="py-4 flex items-center justify-between">
                    <dt className="text-indigo-700">Tax</dt>
                    <dd className="font-medium text-indigo-900">{formatPesoPrice(tax)}</dd>
                  </div>
                  
                  <div className="py-4 flex items-center justify-between">
                    <dt className="text-base font-bold text-indigo-900">Total</dt>
                    <dd className="text-base font-bold text-indigo-900">{formatPesoPrice(totalWithShipping)}</dd>
                  </div>
                </dl>
              </div>

              {/* Checkout Button */}
              <button
                onClick={onCheckout}
                disabled={isCalculatingShipping || !!shippingError}
                className={`mt-6 w-full border border-transparent rounded-md py-3 px-4 text-base font-medium text-white transition-colors ${
                  isCalculatingShipping || shippingError
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
              >
                {isCalculatingShipping ? 'Calculating Shipping...' : 'Proceed to Checkout'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
