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
  const [individualDistances, setIndividualDistances] = useState<number[]>([]);
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
        setIndividualDistances([]);
        return;
      }

      // Get default address for dropoff
      const defaultAddress = addresses.find((item: Address) => item.isDefault === true);
      
      if (!defaultAddress) {
        console.log("No default address found");
        setShippingError("No default delivery address found");
        setShippingCost(0);
        setTotalDistance(0);
        setIndividualDistances([]);
        return;
      }

      setIsCalculatingShipping(true);
      setShippingError(null);

      try {
        // Calculate distances for each item individually
        const distances: number[] = [];
        let accumulatedDistance = 0;
        let itemsWithLocation = 0;

        // Process items sequentially to avoid overwhelming the API
        for (const item of cartItems) {
          // Get pickup location from cart item
          const pickupLat = item.lat;
          const pickupLng = item.lng;
          
          // Get dropoff location from default address
          const dropoffLat = defaultAddress.lat;
          const dropoffLng = defaultAddress.lng;
          
          if (pickupLat && pickupLng && dropoffLat && dropoffLng) {
            try {
              const distance = await getDistanceInKm(
                { lat: pickupLat, lng: pickupLng },
                { lat: dropoffLat, lng: dropoffLng }
              );
              distances.push(distance);
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
              distances.push(fallbackDistance);
              accumulatedDistance += fallbackDistance;
              itemsWithLocation++;
              console.log(`Item ${item.name}: Using fallback distance = ${fallbackDistance.toFixed(2)} km`);
            }
          } else {
            console.log(`Item ${item.name} missing location data:`, { pickupLat, pickupLng, dropoffLat, dropoffLng });
            distances.push(0);
          }
        }

        if (itemsWithLocation > 0) {
          setIndividualDistances(distances);
          setTotalDistance(accumulatedDistance);
          
          // CORRECTED CALCULATION:
          // 1. First, calculate rate per item based on its distance
          // 2. Sum up all item shipping costs
          // 3. Add base rate
          
          let totalShippingCost = 0;
          
          // Calculate shipping for each item individually
          distances.forEach((distance) => {
            // Only charge for items with valid distance
            if (distance > 0) {
              const itemShippingCost = distance * RATE_PER_KM;
              totalShippingCost += itemShippingCost;
            }
          });
          
          // Add base rate to total
          totalShippingCost += BASE_RATE;
          
          setShippingCost(totalShippingCost);
          
          console.log("Shipping Calculation Summary:");
          console.log("Individual distances:", distances.map(d => d.toFixed(2)).join(', '), "km");
          console.log("Total distance:", accumulatedDistance.toFixed(2), "km");
          console.log("Base rate:", BASE_RATE);
          console.log("Rate per km:", RATE_PER_KM);
          console.log("Item shipping costs:", distances.map(d => (d * RATE_PER_KM).toFixed(2)).join(', '));
          console.log("Total shipping cost:", totalShippingCost.toFixed(2));
        } else {
          setShippingCost(0);
          setTotalDistance(0);
          setIndividualDistances([]);
          setShippingError("No items with valid location data found");
          console.log("No items with valid location data found");
        }
      } catch (error) {
        console.error("Error calculating shipping:", error);
        setShippingError("Error calculating shipping cost");
        setShippingCost(0);
        setTotalDistance(0);
        setIndividualDistances([]);
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
      <div className="text-center py-6 md:py-8 px-3 md:px-4">
        <div className="text-indigo-500 mb-3 md:mb-4 flex justify-center">
          <ShoppingCart size={32} className="w-6 h-6 md:w-8 md:h-8 lg:w-12 lg:h-12" />
        </div>
        <h2 className="text-lg md:text-xl lg:text-2xl font-serif font-bold text-indigo-900 mb-1 md:mb-2">Your cart is empty</h2>
        <p className="text-indigo-700 text-xs md:text-sm lg:text-base">Add some items to your cart to continue shopping</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg md:rounded-xl w-full">
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8">
        <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-indigo-900 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
          Order Summary
        </h2>
        
        <div className="flex flex-col w-full">
          {/* Order Summary Section */}
          <div className="w-full">
            <div className="bg-indigo-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 lg:p-6">
              <h3 className="text-base sm:text-lg font-serif font-bold text-indigo-900 mb-2 sm:mb-3 md:mb-4">
                Order Total
              </h3>
              
              {isCalculatingShipping && (
                <div className="mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm text-indigo-600 flex items-center gap-1 sm:gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-indigo-600"></div>
                  <span className="text-xs sm:text-sm">Calculating shipping...</span>
                </div>
              )}
              
              {shippingError && (
                <div className="mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm text-red-600 bg-red-50 p-2 sm:p-3 rounded">
                  ⚠ {shippingError}
                </div>
              )}
              
              <div className="flow-root">
                <dl className="-my-2 sm:-my-3 md:-my-4 text-xs sm:text-sm divide-y divide-indigo-200">
                  <div className="py-2 sm:py-3 md:py-4 flex items-center justify-between">
                    <dt className="text-indigo-700 text-xs sm:text-sm">Subtotal</dt>
                    <dd className="font-medium text-indigo-900 text-xs sm:text-sm">{formatPesoPrice(subtotal)}</dd>
                  </div>
                  
                  <div className="py-2 sm:py-3 md:py-4 flex items-center justify-between">
                    <dt className="text-indigo-700 text-xs sm:text-sm">Shipping</dt>
                    <dd className="font-medium text-indigo-900 text-right">
                      <div className="text-xs sm:text-sm">{formatPesoPrice(shippingCost)}</div>
                      {totalDistance > 0 && individualDistances.length > 0 && (
                        <div className="text-[10px] sm:text-xs text-indigo-500 mt-0.5 sm:mt-1 space-y-0.5 text-right">
                          <div className="whitespace-nowrap">Base rate: ₱{BASE_RATE}</div>
                          {individualDistances.map((dist, index) => (
                            dist > 0 && (
                              <div key={index} className="whitespace-nowrap">
                                Item {index + 1}: {dist.toFixed(2)}km × ₱{RATE_PER_KM} = ₱{(dist * RATE_PER_KM).toFixed(2)}
                              </div>
                            )
                          ))}
                          <div className="whitespace-nowrap font-medium border-t border-indigo-200 pt-0.5 mt-0.5">
                            Total: ₱{BASE_RATE} + ₱{individualDistances.reduce((sum, d) => sum + (d * RATE_PER_KM), 0).toFixed(2)} = ₱{shippingCost.toFixed(2)}
                          </div>
                        </div>
                      )}
                    </dd>
                  </div>
                  
                  <div className="py-2 sm:py-3 md:py-4 flex items-center justify-between">
                    <dt className="text-indigo-700 text-xs sm:text-sm">Tax</dt>
                    <dd className="font-medium text-indigo-900 text-xs sm:text-sm">{formatPesoPrice(tax)}</dd>
                  </div>
                  
                  <div className="py-2 sm:py-3 md:py-4 flex items-center justify-between">
                    <dt className="text-xs sm:text-sm md:text-base font-bold text-indigo-900">Total</dt>
                    <dd className="text-xs sm:text-sm md:text-base font-bold text-indigo-900">{formatPesoPrice(total + shippingCost)}</dd>
                  </div>
                </dl>
              </div>

              {/* Checkout Button */}
              <button
                onClick={onCheckout}
                disabled={isCalculatingShipping || !!shippingError}
                className={`mt-3 sm:mt-4 md:mt-5 lg:mt-6 w-full border border-transparent rounded-md sm:rounded-lg py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 text-xs sm:text-sm md:text-base font-medium text-white transition-all duration-200 ${
                  isCalculatingShipping || shippingError
                    ? 'bg-gray-400 cursor-not-allowed opacity-50'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform active:scale-[0.98]'
                }`}
              >
                {isCalculatingShipping ? 'Calculating...' : 'Proceed to Checkout'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
