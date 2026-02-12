"use client";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Map, MapPin } from "lucide-react";
import { icon as leafletIcon, LatLngExpression, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useGeolocation from '../hooks/useGeolocation';

const markerIcon = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const markerShadow = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
const markerIconRetina = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';

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
      lat: number | null;
      lng: number | null;
    };
    dropoffAddress?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      lat: number | null;
      lng: number | null;
    };
    status: 'pending' | 'accepted' | 'in_progress';
  }>;
}

const MapCenterController = ({ center, zoom }: { center: LatLngExpression; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

export default function MapTab({ isMobile, deliveries }: MapTabProps) {
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState(13);
  const [mapDeliveries, setMapDeliveries] = useState<Array<any>>([]);
  const [hasValidLocations, setHasValidLocations] = useState(false);
  
  const userLocation = useGeolocation();

  useEffect(() => {
    const processDeliveries = () => {
      const results = deliveries
        .filter(delivery => 
          // Only include deliveries with valid coordinates for both pickup and dropoff
          delivery.pickupAddress?.lat && 
          delivery.pickupAddress?.lng && 
          delivery.dropoffAddress?.lat && 
          delivery.dropoffAddress?.lng
        )
        .map((delivery) => {
          const pickupCoords: LatLngTuple = [
            delivery.pickupAddress!.lat!, 
            delivery.pickupAddress!.lng!
          ];
          const dropoffCoords: LatLngTuple = [
            delivery.dropoffAddress!.lat!, 
            delivery.dropoffAddress!.lng!
          ];

          return {
            ...delivery,
            pickupCoords,
            dropoffCoords,
            route: [pickupCoords, dropoffCoords] as LatLngTuple[]
          };
        });
      
      setMapDeliveries(results);
      setHasValidLocations(results.length > 0);
    };

    processDeliveries();
  }, [deliveries]);

  // Determine map center based on available data
  const getMapCenter = (): LatLngExpression => {
    if (selectedDelivery) {
      const delivery = mapDeliveries.find(d => d.id === selectedDelivery);
      if (delivery) return delivery.pickupCoords;
    }
    
    if (mapDeliveries.length > 0) {
      // Center on the first delivery's pickup location
      return mapDeliveries[0].pickupCoords;
    }
    
    // Fallback to user location if no deliveries have coordinates
    if (userLocation.coords) {
      return [userLocation.coords.lat, userLocation.coords.lng];
    }
    
    // Return null if no location available - map will use default view
    return [0, 0];
  };

  const mapCenter = getMapCenter();

  const handleZoomIn = () => setMapZoom(prev => Math.min(prev + 1, 18));
  const handleZoomOut = () => setMapZoom(prev => Math.max(prev - 1, 10));

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

  // If no valid locations, show message
  if (!hasValidLocations && !userLocation.coords) {
    return (
      <div className="p-2 lg:p-6">
        <h2 className="text-lg lg:text-2xl font-bold mb-3 lg:mb-6 flex items-center gap-1 lg:gap-2">
          <Map size={isMobile ? 20 : 24} />
          <span className="text-base lg:text-2xl">Live Delivery Map</span>
        </h2>
        <div className="bg-gray-900 rounded-lg flex items-center justify-center" style={{ height: isMobile ? '400px' : '600px' }}>
          <div className="text-white text-center p-6">
            <MapPin size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No location data available</p>
            <p className="text-sm opacity-75">
              Deliveries need valid coordinates to display on map
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 lg:p-6">
      <h2 className="text-lg lg:text-2xl font-bold mb-3 lg:mb-6 flex items-center gap-1 lg:gap-2">
        <Map size={isMobile ? 20 : 24} />
        <span className="text-base lg:text-2xl">Live Delivery Map</span>
        {mapDeliveries.length < deliveries.length && (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full ml-2">
            {mapDeliveries.length} of {deliveries.length} with coordinates
          </span>
        )}
      </h2>

      <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ height: isMobile ? '400px' : '600px' }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <MapCenterController center={mapCenter} zoom={mapZoom} />
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Show rider location only if available */}
          {userLocation.coords && (
            <Marker 
              position={[userLocation.coords.lat, userLocation.coords.lng]} 
              icon={riderIcon}
            >
              <Popup>
                <div className="font-semibold">Your Location</div>
                <div className="text-sm text-gray-600">Rider: Michael</div>
                <div className="text-xs text-blue-600 mt-1">Vehicle: HD 4587</div>
              </Popup>
            </Marker>
          )}

          {mapDeliveries.map((delivery) => (
            <div key={delivery.id}>
              {/* Draw route from pickup to dropoff */}
              <Polyline
                positions={delivery.route}
                pathOptions={{
                  color: delivery.status === 'pending' ? '#F59E0B' : 
                         delivery.status === 'accepted' ? '#10B981' : '#3B82F6',
                  weight: 4,
                  opacity: 0.8,
                  dashArray: delivery.status === 'pending' ? '5, 10' : undefined,
                  lineCap: 'round',
                  lineJoin: 'round'
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
                  <div className="font-semibold text-orange-600">📍 PICKUP</div>
                  <div className="font-semibold">{delivery.restaurant}</div>
                  <div className="text-sm text-gray-600">Order: {delivery.orderId}</div>
                  <div className="text-xs mt-2 font-medium">Address:</div>
                  <div className="text-xs">{delivery.pickup}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    📍 {delivery.pickupCoords[0].toFixed(6)}, {delivery.pickupCoords[1].toFixed(6)}
                  </div>
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
                  <div className="font-semibold text-red-600">📦 DROPOFF</div>
                  <div className="font-semibold">{delivery.customer}</div>
                  <div className="text-sm text-gray-600">Order: {delivery.orderId}</div>
                  <div className="text-xs mt-2 font-medium">Address:</div>
                  <div className="text-xs">{delivery.dropoff}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    📍 {delivery.dropoffCoords[0].toFixed(6)}, {delivery.dropoffCoords[1].toFixed(6)}
                  </div>
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
            aria-label="Zoom in"
          >
            +
          </button>
          <button 
            onClick={handleZoomOut} 
            className="bg-white w-10 h-10 rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-100 text-lg font-bold"
            aria-label="Zoom out"
          >
            −
          </button>
        </div>

        {/* Legend */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg z-[1000] max-w-xs">
          <h4 className="font-semibold text-sm mb-2">📍 Route Legend</h4>
          <div className="space-y-1 text-xs">
            {userLocation.coords && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse"></div>
                <span>Your Location</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>Pickup Point</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Dropoff Point</span>
            </div>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
              <div className="w-6 h-1 bg-yellow-500"></div>
              <span>Pending Route</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-green-500"></div>
              <span>Accepted Route</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-blue-500"></div>
              <span>In Progress Route</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery List */}
      {mapDeliveries.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="font-semibold text-gray-700">Active Deliveries with Routes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {mapDeliveries.map((delivery) => (
              <div 
                key={delivery.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedDelivery === delivery.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => {
                  setSelectedDelivery(delivery.id === selectedDelivery ? null : delivery.id);
                  setMapZoom(14);
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">{delivery.orderId}</h4>
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        delivery.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        delivery.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {delivery.status.replace('_', ' ')}
                      </div>
                    </div>
                    
                    {/* Route Summary */}
                    <div className="mt-2 bg-gray-50 p-2 rounded">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 text-xs">
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                            <span className="font-medium truncate">{delivery.restaurant}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 ml-3">
                            <span>↓</span>
                            <span className="truncate">{delivery.pickup}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs mt-1">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            <span className="font-medium truncate">{delivery.customer}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 ml-3">
                            <span>📍</span>
                            <span className="truncate">{delivery.dropoff}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Distance indicator */}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <MapPin size={12} />
                      <span>Route ready for navigation</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
                         }
