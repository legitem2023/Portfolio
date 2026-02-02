"use client";
import { useState, useEffect } from "react";
import { Map, MapPin, Navigation, Package } from "lucide-react";
import { Delivery } from '@/lib/types';
import { getCoordinatesFromAddress, generateRoutePoints } from '@/lib/mapUtils';

interface MapTabProps {
  isMobile: boolean;
}

interface DeliveryLocation {
  id: string;
  orderId: string;
  restaurant: string;
  customer: string;
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };
  route: Array<{ lat: number; lng: number }>;
  status: 'pickup' | 'enroute' | 'delivered';
}

export default function MapTab({ isMobile }: MapTabProps) {
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);
  const [deliveryLocations, setDeliveryLocations] = useState<DeliveryLocation[]>([
    {
      id: "1",
      orderId: "ORD-78941",
      restaurant: "Jollibee - Makati",
      customer: "Juan Dela Cruz",
      pickup: { lat: 14.5547, lng: 121.0244 },
      dropoff: { lat: 14.5560, lng: 121.0260 },
      route: [],
      status: 'pickup'
    },
    {
      id: "2",
      orderId: "ORD-78942",
      restaurant: "McDonald's - BGC",
      customer: "Maria Santos",
      pickup: { lat: 14.5530, lng: 121.0250 },
      dropoff: { lat: 14.5580, lng: 121.0270 },
      route: [],
      status: 'enroute'
    }
  ]);

  const [riderLocation, setRiderLocation] = useState({ lat: 14.5550, lng: 121.0245 });
  const [mapZoom, setMapZoom] = useState(15);

  useEffect(() => {
    // Generate routes for all deliveries
    const updatedLocations = deliveryLocations.map(location => ({
      ...location,
      route: generateRoutePoints(
        { street: "", city: "", state: "", zipCode: "1000", country: "" },
        { street: "", city: "", state: "", zipCode: "1000", country: "" }
      )
    }));
    setDeliveryLocations(updatedLocations);

    // Simulate rider movement
    const interval = setInterval(() => {
      setRiderLocation(prev => ({
        lat: prev.lat + (Math.random() - 0.5) * 0.0005,
        lng: prev.lng + (Math.random() - 0.5) * 0.0005
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleZoomIn = () => setMapZoom(prev => Math.min(prev + 1, 20));
  const handleZoomOut = () => setMapZoom(prev => Math.max(prev - 1, 10));

  const mapCenter = selectedDelivery 
    ? deliveryLocations.find(d => d.id === selectedDelivery)?.pickup || { lat: 14.5550, lng: 121.0245 }
    : { lat: 14.5550, lng: 121.0245 };

  return (
    <div className="p-2 lg:p-6">
      <h2 className="text-lg lg:text-2xl font-bold mb-3 lg:mb-6 flex items-center gap-1 lg:gap-2">
        <Map size={isMobile ? 20 : 24} />
        <span className="text-base lg:text-2xl">Navigation Map</span>
      </h2>

      <div className="bg-gray-900 h-48 lg:h-96 rounded-lg relative overflow-hidden">
        {/* Mock Map Visualization */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-green-900">
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}></div>

          {/* Roads */}
          <div className="absolute left-1/4 top-1/2 w-1/2 h-1 bg-yellow-500 transform -translate-y-1/2"></div>
          <div className="absolute left-1/2 top-1/4 h-1/2 w-1 bg-yellow-500 transform -translate-x-1/2"></div>

          {/* Delivery Locations */}
          {deliveryLocations.map((location) => (
            <div key={location.id}>
              {/* Route Line */}
              <div className="absolute" style={{
                left: `${((location.pickup.lng - 121.0200) / 0.01) * 100}%`,
                top: `${((14.5600 - location.pickup.lat) / 0.01) * 100}%`,
                width: `${Math.abs(location.dropoff.lng - location.pickup.lng) * 10000}px`,
                height: '2px',
                backgroundColor: location.status === 'enroute' ? '#3B82F6' : '#6B7280',
                transform: `rotate(${Math.atan2(
                  location.dropoff.lat - location.pickup.lat,
                  location.dropoff.lng - location.pickup.lng
                ) * 180 / Math.PI}deg)`,
                transformOrigin: 'left center'
              }}></div>

              {/* Pickup Marker */}
              <div 
                className={`absolute w-4 h-4 rounded-full border-2 border-white cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${
                  selectedDelivery === location.id ? 'ring-2 ring-blue-400' : ''
                }`}
                style={{
                  left: `${((location.pickup.lng - 121.0200) / 0.01) * 100}%`,
                  top: `${((14.5600 - location.pickup.lat) / 0.01) * 100}%`,
                  backgroundColor: location.status === 'pickup' ? '#F59E0B' : '#10B981'
                }}
                onClick={() => setSelectedDelivery(location.id === selectedDelivery ? null : location.id)}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={8} className="text-white" />
                </div>
              </div>

              {/* Dropoff Marker */}
              <div 
                className={`absolute w-4 h-4 rounded-full border-2 border-white cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${
                  selectedDelivery === location.id ? 'ring-2 ring-blue-400' : ''
                }`}
                style={{
                  left: `${((location.dropoff.lng - 121.0200) / 0.01) * 100}%`,
                  top: `${((14.5600 - location.dropoff.lat) / 0.01) * 100}%`,
                  backgroundColor: '#EF4444'
                }}
                onClick={() => setSelectedDelivery(location.id === selectedDelivery ? null : location.id)}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <MapPin size={8} className="text-white" />
                </div>
              </div>
            </div>
          ))}

          {/* Rider Marker */}
          <div 
            className="absolute w-6 h-6 rounded-full border-2 border-white bg-blue-600 animate-pulse transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${((riderLocation.lng - 121.0200) / 0.01) * 100}%`,
              top: `${((14.5600 - riderLocation.lat) / 0.01) * 100}%`
            }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <Navigation size={12} className="text-white" />
            </div>
          </div>

          {/* Map Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <button 
              onClick={handleZoomIn}
              className="bg-white w-8 h-8 rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-100"
            >
              <span className="font-bold text-gray-700">+</span>
            </button>
            <button 
              onClick={handleZoomOut}
              className="bg-white w-8 h-8 rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-100"
            >
              <span className="font-bold text-gray-700">-</span>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute top-4 left-4 bg-black/70 text-white p-2 rounded-lg text-xs">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Pickup</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Picked Up</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Dropoff</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse"></div>
            <span>Your Location</span>
          </div>
        </div>

        {/* Selected Delivery Info */}
        {selectedDelivery && (
          <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg max-w-xs">
            {(() => {
              const delivery = deliveryLocations.find(d => d.id === selectedDelivery);
              if (!delivery) return null;
              
              return (
                <>
                  <h3 className="font-bold text-sm mb-2">{delivery.orderId}</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="text-orange-500" />
                      <span>From: {delivery.restaurant}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="text-red-500" />
                      <span>To: {delivery.customer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Navigation size={12} className="text-blue-500" />
                      <span>Status: {delivery.status === 'pickup' ? 'Ready for Pickup' : 'En Route'}</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Delivery List */}
      <div className="mt-4 space-y-2">
        <h3 className="font-semibold text-gray-700">Active Deliveries on Map</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {deliveryLocations.map((delivery) => (
            <div 
              key={delivery.id}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedDelivery === delivery.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedDelivery(delivery.id === selectedDelivery ? null : delivery.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-sm">{delivery.orderId}</h4>
                  <p className="text-xs text-gray-600 mt-1">{delivery.restaurant}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  delivery.status === 'pickup' 
                    ? 'bg-yellow-100 text-yellow-800'
                    : delivery.status === 'enroute'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {delivery.status === 'pickup' ? 'Pickup' : 'En Route'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
      }
