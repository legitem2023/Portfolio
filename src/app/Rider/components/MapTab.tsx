"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline as LeafletPolyline, useMap } from 'react-leaflet';
import { Map, MapPin, Navigation, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { icon as leafletIcon, LatLngExpression, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useGeolocation from '../hooks/useGeolocation';
import { GoogleMap, useJsApiLoader, Marker as GoogleMarker } from '@react-google-maps/api';
import { Libraries } from "@react-google-maps/api";

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
    status: 'PENDING' | 'PROCESSING' | 'in_progress';
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

// Simple Google Maps component
const GoogleMapsView = ({ 
  center, 
  zoom, 
  userLocation, 
  deliveries, 
  selectedDelivery,
  onMarkerClick 
}: { 
  center: { lat: number; lng: number }; 
  zoom: number; 
  userLocation: any; 
  deliveries: any[]; 
  selectedDelivery: string | null;
  onMarkerClick: (id: string) => void;
}) => {
  const mapRef = useRef<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Create icon URLs
  const riderIcon = {
    url: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3B82F6">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="3" fill="white"/>
      </svg>
    `),
    scaledSize: new google.maps.Size(36, 36)
  };

  const pickupIcon = {
    url: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F59E0B">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="3" fill="white"/>
      </svg>
    `),
    scaledSize: new google.maps.Size(36, 36)
  };

  const dropoffIcon = {
    url: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#EF4444">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="3" fill="white"/>
      </svg>
    `),
    scaledSize: new google.maps.Size(36, 36)
  };

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={center}
      zoom={zoom}
      onLoad={onLoad}
      options={{
        zoomControl: false,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        gestureHandling: 'greedy', // Better for mobile touch
      }}
    >
      {userLocation?.coords && (
        <GoogleMarker
          position={{ lat: userLocation.coords.lat, lng: userLocation.coords.lng }}
          icon={riderIcon}
          title="Your Location"
        />
      )}

      {deliveries.map((delivery) => (
        <div key={delivery.id}>
          <GoogleMarker
            position={delivery.pickupLatLng}
            icon={pickupIcon}
            onClick={() => onMarkerClick(delivery.id)}
          />
          <GoogleMarker
            position={delivery.dropoffLatLng}
            icon={dropoffIcon}
            onClick={() => onMarkerClick(delivery.id)}
          />
        </div>
      ))}
    </GoogleMap>
  );
};

export default function MapTab({ isMobile, deliveries }: MapTabProps) {
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState(13);
  const [mapDeliveries, setMapDeliveries] = useState<Array<any>>([]);
  const [hasValidLocations, setHasValidLocations] = useState(false);
  const [showDeliveryList, setShowDeliveryList] = useState(!isMobile); // Auto hide on mobile
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const userLocation = useGeolocation();
  
  // Check if Google Maps API key is available
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const useGoogleMaps = !!googleMapsApiKey;

  const googleMapsLibraries: Libraries = ["geometry", "places"];
  
  // Use the hook to check if Google Maps is loaded
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleMapsApiKey || '',
    libraries: googleMapsLibraries,
  });

  useEffect(() => {
    const processDeliveries = () => {
      const results = deliveries
        .filter(delivery => 
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
            route: [pickupCoords, dropoffCoords] as LatLngTuple[],
            pickupLatLng: { lat: delivery.pickupAddress!.lat!, lng: delivery.pickupAddress!.lng! },
            dropoffLatLng: { lat: delivery.dropoffAddress!.lat!, lng: delivery.dropoffAddress!.lng! }
          };
        });
      
      setMapDeliveries(results);
      setHasValidLocations(results.length > 0);
    };

    processDeliveries();
  }, [deliveries]);

  const getMapCenter = (): LatLngExpression | { lat: number; lng: number } => {
    if (selectedDelivery) {
      const delivery = mapDeliveries.find(d => d.id === selectedDelivery);
      if (delivery) {
        return useGoogleMaps 
          ? { lat: delivery.pickupLatLng.lat, lng: delivery.pickupLatLng.lng }
          : delivery.pickupCoords;
      }
    }
    
    if (mapDeliveries.length > 0) {
      return useGoogleMaps 
        ? { lat: mapDeliveries[0].pickupLatLng.lat, lng: mapDeliveries[0].pickupLatLng.lng }
        : mapDeliveries[0].pickupCoords;
    }
    
    if (userLocation.coords) {
      return useGoogleMaps
        ? { lat: userLocation.coords.lat, lng: userLocation.coords.lng }
        : [userLocation.coords.lat, userLocation.coords.lng];
    }
    
    return useGoogleMaps ? { lat: 14.5995, lng: 120.9842 } : [14.5995, 120.9842];
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
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });

  const handleMarkerClick = (id: string) => {
    setSelectedDelivery(id === selectedDelivery ? null : id);
    // On mobile, auto-show delivery list when marker is clicked
    if (isMobile) {
      setShowDeliveryList(true);
    }
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .pickup-marker { filter: hue-rotate(120deg); }
      .dropoff-marker { filter: hue-rotate(300deg); }
      .leaflet-container { font-family: inherit; }
      .leaflet-control-attribution { font-size: ${isMobile ? '8px' : '10px'}; }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [isMobile]);

  if (!hasValidLocations && !userLocation.coords) {
    return (
      <div className="px-3 py-4 sm:p-6">
        <h2 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-6 flex items-center gap-2">
          <Map size={isMobile ? 20 : 24} />
          <span>Live Delivery Map</span>
        </h2>
        <div className="bg-gray-900 rounded-xl flex items-center justify-center" style={{ height: isMobile ? '70vh' : '600px' }}>
          <div className="text-white text-center px-4 sm:p-6">
            <MapPin size={isMobile ? 40 : 48} className="mx-auto mb-3 sm:mb-4 opacity-50" />
            <p className="text-base sm:text-lg mb-2">No location data available</p>
            <p className="text-xs sm:text-sm opacity-75">
              Deliveries need valid coordinates to display on map
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-0 sm:px-6">
      {/* Header - Mobile Optimized */}
      <div className="sticky top-0 z-20 bg-white px-3 py-3 sm:px-0 sm:py-4 border-b border-gray-200 sm:border-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
            <Map size={isMobile ? 20 : 24} />
            <span>Live Map</span>
          </h2>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs px-2 py-1 bg-gray-100 rounded-full">
              {useGoogleMaps ? '🚀 GMaps' : '🍃 OSM'}
            </span>
            {mapDeliveries.length < deliveries.length && (
              <span className="text-[10px] sm:text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full whitespace-nowrap">
                {mapDeliveries.length}/{deliveries.length} routes
              </span>
            )}
            {isMobile && (
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 bg-gray-100 rounded-lg"
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Map Container - Full height on mobile */}
      <div className={`relative bg-gray-900 overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50' : 'rounded-xl'
      }`} style={{ 
        height: isMobile 
          ? isFullscreen ? '100vh' : '60vh'
          : '600px'
      }}>
        {/* Map Component */}
        {useGoogleMaps ? (
          isLoaded ? (
            <GoogleMapsView
              center={mapCenter as { lat: number; lng: number }}
              zoom={mapZoom}
              userLocation={userLocation}
              deliveries={mapDeliveries}
              selectedDelivery={selectedDelivery}
              onMarkerClick={handleMarkerClick}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <div className="text-white text-center px-4">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-white mx-auto mb-3 sm:mb-4"></div>
                <p className="text-sm sm:text-base">Loading Google Maps...</p>
              </div>
            </div>
          )
        ) : (
          <MapContainer
            center={mapCenter as LatLngExpression}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
            zoomControl={false} // Disable default zoom controls
          >
            <MapCenterController center={mapCenter as LatLngExpression} zoom={mapZoom} />
            
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {userLocation.coords && (
              <Marker 
                position={[userLocation.coords.lat, userLocation.coords.lng]} 
                icon={riderIcon}
              >
                <Popup>
                  <div className="font-semibold text-sm">Your Location</div>
                  <div className="text-xs text-gray-600">Rider: Michael</div>
                </Popup>
              </Marker>
            )}

            {mapDeliveries.map((delivery) => (
              <div key={delivery.id}>
                <LeafletPolyline
                  positions={delivery.route}
                  pathOptions={{
                    color: delivery.status === 'PENDING' ? '#F59E0B' : 
                           delivery.status === 'PROCESSING' ? '#10B981' : '#3B82F6',
                    weight: isMobile ? 3 : 4,
                    opacity: 0.8,
                    dashArray: delivery.status === 'PENDING' ? '5, 10' : undefined,
                  }}
                />

                <Marker 
                  position={delivery.pickupCoords} 
                  icon={pickupIcon}
                  eventHandlers={{
                    click: () => setSelectedDelivery(delivery.id === selectedDelivery ? null : delivery.id)
                  }}
                >
                  <Popup>
                    <div className="font-semibold text-orange-600 text-sm">📍 PICKUP</div>
                    <div className="font-semibold text-sm">{delivery.restaurant}</div>
                    <div className="text-xs text-gray-600">Order: {delivery.orderId}</div>
                    <div className="text-xs mt-1">{delivery.pickup}</div>
                  </Popup>
                </Marker>

                <Marker 
                  position={delivery.dropoffCoords} 
                  icon={dropoffIcon}
                  eventHandlers={{
                    click: () => setSelectedDelivery(delivery.id === selectedDelivery ? null : delivery.id)
                  }}
                >
                  <Popup>
                    <div className="font-semibold text-red-600 text-sm">📦 DROPOFF</div>
                    <div className="font-semibold text-sm">{delivery.customer}</div>
                    <div className="text-xs text-gray-600">Order: {delivery.orderId}</div>
                    <div className="text-xs mt-1">{delivery.dropoff}</div>
                  </Popup>
                </Marker>
              </div>
            ))}
          </MapContainer>
        )}

        {/* Custom Zoom Controls - Mobile Optimized */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[1000]">
          <button 
            onClick={handleZoomIn} 
            className="bg-white w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 text-xl font-bold active:bg-gray-200 transition-colors"
            aria-label="Zoom in"
          >
            +
          </button>
          <button 
            onClick={handleZoomOut} 
            className="bg-white w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 text-xl font-bold active:bg-gray-200 transition-colors"
            aria-label="Zoom out"
          >
            −
          </button>
        </div>

        {/* Location Button */}
        {userLocation.coords && (
          <button 
            onClick={() => {
              if (useGoogleMaps) {
                // Handle Google Maps center
              } else {
                const center = [userLocation.coords.lat, userLocation.coords.lng];
                // Map center update handled by MapCenterController
              }
              setMapZoom(15);
            }}
            className="absolute bottom-4 left-4 bg-white w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors z-[1000]"
            aria-label="Center on my location"
          >
            <Navigation size={isMobile ? 18 : 20} className="text-blue-600" />
          </button>
        )}

        {/* Map Legend - Collapsible on Mobile */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm p-2 sm:p-3 rounded-lg shadow-lg z-[1000] max-w-[180px] sm:max-w-xs">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-xs sm:text-sm mb-1 sm:mb-2">
              {isMobile ? 'Legend' : 'Route Legend'}
            </h4>
            {isMobile && (
              <button className="text-gray-500">
                <ChevronRight size={16} />
              </button>
            )}
          </div>
          <div className="space-y-1 text-[10px] sm:text-xs">
            {userLocation.coords && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-600 animate-pulse"></div>
                <span className="truncate">Your Location</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-orange-500"></div>
              <span>Pickup</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
              <span>Dropoff</span>
            </div>
            <div className="flex items-center gap-2 mt-1 sm:mt-2 pt-1 sm:pt-2 border-t border-gray-200">
              <div className="w-4 sm:w-6 h-0.5 sm:h-1 bg-yellow-500"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 sm:w-6 h-0.5 sm:h-1 bg-green-500"></div>
              <span>Accepted</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 sm:w-6 h-0.5 sm:h-1 bg-blue-500"></div>
              <span>In Progress</span>
            </div>
          </div>
        </div>

        {/* Close Fullscreen Button */}
        {isFullscreen && (
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-lg z-[1000]"
          >
            <Minimize2 size={20} />
          </button>
        )}
      </div>

      {/* Delivery List - Mobile Optimized */}
      {mapDeliveries.length > 0 && (
        <div className="mt-3 sm:mt-4 px-3 sm:px-0">
          {/* Mobile Toggle */}
          {isMobile && (
            <button
              onClick={() => setShowDeliveryList(!showDeliveryList)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2"
            >
              <span className="font-semibold text-sm">Active Deliveries ({mapDeliveries.length})</span>
              <ChevronRight size={18} className={`transform transition-transform ${showDeliveryList ? 'rotate-90' : ''}`} />
            </button>
          )}

          {/* Delivery Cards */}
          <div className={`space-y-2 transition-all ${!showDeliveryList && isMobile ? 'hidden' : 'block'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {mapDeliveries.map((delivery) => (
                <div 
                  key={delivery.id}
                  className={`p-3 sm:p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedDelivery === delivery.id 
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:bg-gray-50 active:bg-gray-100'
                  }`}
                  onClick={() => {
                    setSelectedDelivery(delivery.id === selectedDelivery ? null : delivery.id);
                    setMapZoom(14);
                    if (isMobile) {
                      // Scroll to top to see map
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-sm truncate">{delivery.orderId}</h4>
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap shrink-0 ${
                          delivery.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          delivery.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {delivery.status.replace('_', ' ')}
                        </div>
                      </div>
                      
                      <div className="mt-2 bg-gray-50 p-2 rounded-lg">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1 space-y-1">
                            {/* Pickup */}
                            <div className="flex items-start gap-1">
                              <span className="w-2 h-2 bg-orange-500 rounded-full mt-1 shrink-0"></span>
                              <div className="min-w-0">
                                <span className="font-medium text-xs block truncate">{delivery.restaurant}</span>
                                <span className="text-[10px] text-gray-500 block truncate">{delivery.pickup}</span>
                              </div>
                            </div>
                            
                            {/* Dropoff */}
                            <div className="flex items-start gap-1">
                              <span className="w-2 h-2 bg-red-500 rounded-full mt-1 shrink-0"></span>
                              <div className="min-w-0">
                                <span className="font-medium text-xs block truncate">{delivery.customer}</span>
                                <span className="text-[10px] text-gray-500 block truncate">{delivery.dropoff}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-500">
                        <MapPin size={10} />
                        <span>Straight line route</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
