"use client";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline as LeafletPolyline, useMap } from 'react-leaflet';
import { Map, MapPin } from "lucide-react";
import { icon as leafletIcon, LatLngExpression, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useGeolocation from '../hooks/useGeolocation';
import { GoogleMap, LoadScript, DirectionsRenderer, Marker as GoogleMarker, Polyline } from '@react-google-maps/api';
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
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  
  const userLocation = useGeolocation();
  
  // Check if Google Maps API key is available
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const useGoogleMaps = !!googleMapsApiKey;

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
      
      // Get directions for selected delivery if using Google Maps
      if (useGoogleMaps && results.length > 0 && selectedDelivery) {
        const delivery = results.find(d => d.id === selectedDelivery);
        if (delivery) {
          getDirections(delivery.pickupLatLng, delivery.dropoffLatLng);
        }
      }
    };

    processDeliveries();
  }, [deliveries, selectedDelivery, useGoogleMaps]);

  const getDirections = (origin: {lat: number, lng: number}, destination: {lat: number, lng: number}) => {
    if (!useGoogleMaps) return;
    
    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          setDirections(result);
        }
      }
    );
  };

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
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  const googleMapsLibraries: Libraries = ["geometry", "places", "directions"];
  
  // Google Maps Marker Icons
  const googlePickupIcon = {
    url: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F59E0B">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="3" fill="white"/>
      </svg>
    `),
    scaledSize: new google.maps.Size(40, 40)
  };

  const googleDropoffIcon = {
    url: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#EF4444">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="3" fill="white"/>
      </svg>
    `),
    scaledSize: new google.maps.Size(40, 40)
  };

  const googleRiderIcon = {
    url: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3B82F6">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="3" fill="white"/>
      </svg>
    `),
    scaledSize: new google.maps.Size(40, 40)
  };

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
      <div className="flex items-center justify-between mb-3 lg:mb-6">
        <h2 className="text-lg lg:text-2xl font-bold flex items-center gap-1 lg:gap-2">
          <Map size={isMobile ? 20 : 24} />
          <span className="text-base lg:text-2xl">Live Delivery Map</span>
        </h2>
        
        {/* Map Provider Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
            {useGoogleMaps ? '🚀 Google Maps' : '🍃 OpenStreetMap'}
          </span>
          {mapDeliveries.length < deliveries.length && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
              {mapDeliveries.length} of {deliveries.length} with coordinates
            </span>
          )}
        </div>
      </div>

      <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ height: isMobile ? '400px' : '600px' }}>
        {/* Google Maps */}
        {useGoogleMaps ? (
          <LoadScript
            googleMapsApiKey={googleMapsApiKey!}
            libraries={googleMapsLibraries}
          >
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={mapCenter as google.maps.LatLngLiteral}
              zoom={mapZoom}
              options={{
                zoomControl: false,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
              }}
            >
              {/* Rider Location */}
              {userLocation.coords && (
                <GoogleMarker
                  position={{ lat: userLocation.coords.lat, lng: userLocation.coords.lng }}
                  icon={googleRiderIcon}
                  title="Your Location"
                />
              )}

              {/* Delivery Routes */}
              {mapDeliveries.map((delivery) => (
                <div key={delivery.id}>
                  {/* Show directions for selected delivery */}
                  {selectedDelivery === delivery.id && directions ? (
                    <DirectionsRenderer
                      directions={directions}
                      options={{
                        polylineOptions: {
                          strokeColor: delivery.status === 'pending' ? '#F59E0B' : 
                                     delivery.status === 'accepted' ? '#10B981' : '#3B82F6',
                          strokeWeight: 5,
                          strokeOpacity: 0.8,
                        },
                        suppressMarkers: true,
                      }}
                    />
                  ) : (
                    /* Show straight line for non-selected deliveries */
                    <Polyline
                      path={[
                        { lat: delivery.pickupLatLng.lat, lng: delivery.pickupLatLng.lng },
                        { lat: delivery.dropoffLatLng.lat, lng: delivery.dropoffLatLng.lng }
                      ]}
                      options={{
                        strokeColor: delivery.status === 'pending' ? '#F59E0B' : 
                                   delivery.status === 'accepted' ? '#10B981' : '#3B82F6',
                        strokeWeight: 3,
                        strokeOpacity: 0.6,
                        strokeDashArray: delivery.status === 'pending' ? '5 10' : undefined,
                        geodesic: false,
                        zIndex: 1,
                      }}
                    />
                  )}

                  {/* Pickup Marker */}
                  <GoogleMarker
                    position={delivery.pickupLatLng}
                    icon={googlePickupIcon}
                    onClick={() => setSelectedDelivery(delivery.id === selectedDelivery ? null : delivery.id)}
                  />

                  {/* Dropoff Marker */}
                  <GoogleMarker
                    position={delivery.dropoffLatLng}
                    icon={googleDropoffIcon}
                    onClick={() => setSelectedDelivery(delivery.id === selectedDelivery ? null : delivery.id)}
                  />
                </div>
              ))}
            </GoogleMap>
          </LoadScript>
        ) : (
          /* Leaflet/OpenStreetMap Fallback */
          <MapContainer
            center={mapCenter as LatLngExpression}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <MapCenterController center={mapCenter as LatLngExpression} zoom={mapZoom} />
            
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Rider Location */}
            {userLocation.coords && (
              <Marker 
                position={[userLocation.coords.lat, userLocation.coords.lng]} 
                icon={riderIcon}
              >
                <Popup>
                  <div className="font-semibold">Your Location</div>
                  <div className="text-sm text-gray-600">Rider: Michael</div>
                </Popup>
              </Marker>
            )}

            {/* Delivery Routes */}
            {mapDeliveries.map((delivery) => (
              <div key={delivery.id}>
                <LeafletPolyline
                  positions={delivery.route}
                  pathOptions={{
                    color: delivery.status === 'pending' ? '#F59E0B' : 
                           delivery.status === 'accepted' ? '#10B981' : '#3B82F6',
                    weight: 4,
                    opacity: 0.8,
                    dashArray: delivery.status === 'pending' ? '5, 10' : undefined,
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
                    <div className="font-semibold text-orange-600">📍 PICKUP</div>
                    <div className="font-semibold">{delivery.restaurant}</div>
                    <div className="text-sm text-gray-600">Order: {delivery.orderId}</div>
                    <div className="text-xs mt-2">{delivery.pickup}</div>
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
                    <div className="font-semibold text-red-600">📦 DROPOFF</div>
                    <div className="font-semibold">{delivery.customer}</div>
                    <div className="text-sm text-gray-600">Order: {delivery.orderId}</div>
                    <div className="text-xs mt-2">{delivery.dropoff}</div>
                  </Popup>
                </Marker>
              </div>
            ))}
          </MapContainer>
        )}

        {/* Map Controls - Shared for both map types */}
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
          <h4 className="font-semibold text-sm mb-2">
            {useGoogleMaps ? '🚀 Google Maps' : '🍃 OpenStreetMap'} Route Legend
          </h4>
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
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-green-500"></div>
              <span>Accepted</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-blue-500"></div>
              <span>In Progress</span>
            </div>
            {useGoogleMaps && selectedDelivery && (
              <div className="flex items-center gap-2 mt-2 text-green-600">
                <span>🛣️</span>
                <span>Optimized route</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delivery List - Same for both map types */}
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
                  if (useGoogleMaps) {
                    getDirections(delivery.pickupLatLng, delivery.dropoffLatLng);
                  }
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

                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <MapPin size={12} />
                      <span>
                        {useGoogleMaps && selectedDelivery === delivery.id 
                          ? '🛣️ Following road network' 
                          : '📍 Straight line route'}
                      </span>
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
