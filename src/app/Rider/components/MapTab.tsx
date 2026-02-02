"use client";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Map, MapPin, Navigation } from "lucide-react";
import { icon as leafletIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';

const defaultIcon = leafletIcon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconRetinaUrl: markerIconRetina,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapTabProps {
  isMobile: boolean;
  deliveries: Array<{
    id: string;
    orderId: string;
    restaurant: string;
    customer: string;
    pickup: string;
    dropoff: string;
    pickupAddress?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    dropoffAddress?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    status: 'pending' | 'accepted' | 'in_progress';
  }>;
}

// Function to geocode address to coordinates (mock - in production use real geocoding service)
const geocodeAddress = (address: string, type: 'pickup' | 'dropoff') => {
  // Mock geocoding - generate coordinates based on address hash
  const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Base coordinates for Metro Manila area
  const baseLat = 14.5995;
  const baseLng = 120.9842;
  
  // Add variation based on hash
  const latVariation = ((hash % 1000) / 100000) * (type === 'pickup' ? 1 : -1);
  const lngVariation = ((hash % 10000) / 100000) * (type === 'pickup' ? 0.5 : 1.5);
  
  return {
    lat: baseLat + latVariation,
    lng: baseLng + lngVariation
  };
};

// Component to center map on selected delivery
const MapCenterController = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export default function MapTab({ isMobile, deliveries }: MapTabProps) {
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState(13);
  const [riderLocation, setRiderLocation] = useState<[number, number]>([14.5995, 120.9842]);

  // Process deliveries for map display
  const mapDeliveries = deliveries.map(delivery => {
    const pickupCoords = delivery.pickupAddress 
      ? geocodeAddress(`${delivery.pickupAddress.street}, ${delivery.pickupAddress.city}`, 'pickup')
      : geocodeAddress(delivery.pickup, 'pickup');
    
    const dropoffCoords = delivery.dropoffAddress
      ? geocodeAddress(`${delivery.dropoffAddress.street}, ${delivery.dropoffAddress.city}`, 'dropoff')
      : geocodeAddress(delivery.dropoff, 'dropoff');

    return {
      ...delivery,
      pickupCoords: [pickupCoords.lat, pickupCoords.lng] as [number, number],
      dropoffCoords: [dropoffCoords.lat, dropoffCoords.lng] as [number, number],
      route: [
        [pickupCoords.lat, pickupCoords.lng],
        [dropoffCoords.lat, dropoffCoords.lng]
      ] as [number, number][]
    };
  });

  // Calculate map center
  const mapCenter = selectedDelivery 
    ? mapDeliveries.find(d => d.id === selectedDelivery)?.pickupCoords || [14.5995, 120.9842]
    : [14.5995, 120.9842];

  // Mock rider location updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRiderLocation(prev => [
        prev[0] + (Math.random() - 0.5) * 0.001,
        prev[1] + (Math.random() - 0.5) * 0.001
      ]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleZoomIn = () => setMapZoom(prev => Math.min(prev + 1, 18));
  const handleZoomOut = () => setMapZoom(prev => Math.max(prev - 1, 10));

  // Custom icons
  const pickupIcon = leafletIcon({
    ...defaultIcon.options,
    className: 'pickup-marker'
  });

  const dropoffIcon = leafletIcon({
    ...defaultIcon.options,
    className: 'dropoff-marker'
  });

  const riderIcon = leafletIcon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3B82F6">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    `),
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  // Add CSS for custom markers
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .pickup-marker { filter: hue-rotate(120deg); }
      .dropoff-marker { filter: hue-rotate(300deg); }
      .leaflet-container { font-family: inherit; }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="p-2 lg:p-6">
      <h2 className="text-lg lg:text-2xl font-bold mb-3 lg:mb-6 flex items-center gap-1 lg:gap-2">
        <Map size={isMobile ? 20 : 24} />
        <span className="text-base lg:text-2xl">Live Delivery Map</span>
      </h2>

      {/* Leaflet Map Container */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ height: isMobile ? '400px' : '600px' }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <MapCenterController center={mapCenter} zoom={mapZoom} />
          
          {/* OpenStreetMap Tiles [citation:6][citation:8] */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Rider Location */}
          <Marker position={riderLocation} icon={riderIcon}>
            <Popup>
              <div className="font-semibold">Your Location</div>
              <div className="text-sm text-gray-600">Rider: Michael</div>
              <div className="text-xs text-blue-600 mt-1">Vehicle: HD 4587</div>
            </Popup>
          </Marker>

          {/* Delivery Markers and Routes */}
          {mapDeliveries.map((delivery) => (
            <div key={delivery.id}>
              {/* Route Line */}
              <Polyline
                positions={delivery.route}
                pathOptions={{
                  color: delivery.status === 'pending' ? '#F59E0B' : 
                         delivery.status === 'accepted' ? '#10B981' : '#3B82F6',
                  weight: 3,
                  opacity: 0.7,
                  dashArray: delivery.status === 'pending' ? '5, 10' : undefined
                }}
              />

              {/* Pickup Marker */}
              <Marker 
                position={delivery.pickupCoords} 
                icon={pickupIcon}
                eventHandlers={{
                  click: () => setSelectedDelivery(delivery.id === selectedDelivery ? null : delivery.id)
                }}
              >
                <Popup>
                  <div className="font-semibold">{delivery.restaurant}</div>
                  <div className="text-sm text-gray-600">Order: {delivery.orderId}</div>
                  <div className="text-xs text-orange-600 mt-1">Pickup Location</div>
                  <div className="text-xs mt-1">{delivery.pickup}</div>
                </Popup>
              </Marker>

              {/* Dropoff Marker */}
              <Marker 
                position={delivery.dropoffCoords} 
                icon={dropoffIcon}
                eventHandlers={{
                  click: () => setSelectedDelivery(delivery.id === selectedDelivery ? null : delivery.id)
                }}
              >
                <Popup>
                  <div className="font-semibold">{delivery.customer}</div>
                  <div className="text-sm text-gray-600">Order: {delivery.orderId}</div>
                  <div className="text-xs text-red-600 mt-1">Delivery Location</div>
                  <div className="text-xs mt-1">{delivery.dropoff}</div>
                </Popup>
              </Marker>
            </div>
          ))}
        </MapContainer>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
          <button 
            onClick={handleZoomIn}
            className="bg-white w-10 h-10 rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-100 text-lg font-bold"
          >
            +
          </button>
          <button 
            onClick={handleZoomOut}
            className="bg-white w-10 h-10 rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-100 text-lg font-bold"
          >
            −
          </button>
        </div>

        {/* Legend */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg z-[1000] max-w-xs">
          <h4 className="font-semibold text-sm mb-2">Map Legend</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse"></div>
              <span>Your Location</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>Pickup Location</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Delivery Location</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-yellow-500"></div>
              <span>Pending Route</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-green-500"></div>
              <span>Active Route</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery List */}
      <div className="mt-4 space-y-2">
        <h3 className="font-semibold text-gray-700">Active Deliveries</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {mapDeliveries.map((delivery) => (
            <div 
              key={delivery.id}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedDelivery === delivery.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => {
                setSelectedDelivery(delivery.id === selectedDelivery ? null : delivery.id);
                setMapZoom(15);
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-sm">{delivery.orderId}</h4>
                  <p className="text-xs text-gray-600 mt-1">{delivery.restaurant}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin size={12} className="text-orange-500" />
                    <span className="text-xs">to</span>
                    <MapPin size={12} className="text-red-500" />
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  delivery.status === 'pending' 
                    ? 'bg-yellow-100 text-yellow-800'
                    : delivery.status === 'accepted'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {delivery.status === 'pending' ? 'Pending' : 
                   delivery.status === 'accepted' ? 'Accepted' : 'In Progress'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
                }
