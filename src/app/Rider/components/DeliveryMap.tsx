// components/DeliveryMap.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Navigation, MapPin, Loader2, X } from 'lucide-react';

// Google Maps script loader
const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector('#google-maps-script')) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
};

// Cache for geocoding results
const geocodeCache = new Map<string, { lat: number; lng: number }>();

interface DeliveryMapProps {
  pickupAddress: string;
  dropoffAddress: string;
  pickupLocation?: { lat: number; lng: number } | null;
  dropoffLocation?: { lat: number; lng: number } | null;
  currentLocation?: { lat: number; lng: number };
  status: 'PROCESSING' | 'SHIPPED' | 'DELIVERED';
  isMobile: boolean;
  onClose: () => void;
  restaurant?: string;
  customer?: string;
  googleMapsApiKey?: string;
}

export default function DeliveryMap({ 
  pickupAddress, 
  dropoffAddress, 
  pickupLocation: initialPickupLocation,
  dropoffLocation: initialDropoffLocation,
  currentLocation: initialLocation,
  status,
  isMobile,
  onClose,
  restaurant,
  customer,
  googleMapsApiKey
}: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<{
    pickup?: { lat: number; lng: number };
    dropoff?: { lat: number; lng: number };
    current?: { lat: number; lng: number };
  }>({});
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [geocodingComplete, setGeocodingComplete] = useState(false);

  // Determine destination based on status
  const destination = status === 'PROCESSING' ? pickupAddress : dropoffAddress;
  const destinationLabel = status === 'PROCESSING' ? 'Pickup Location' : 'Delivery Location';
  const destinationName = status === 'PROCESSING' ? restaurant : customer;

  // Load Google Maps if API key is provided
  useEffect(() => {
    if (!googleMapsApiKey || googleMapsApiKey.trim() === '') {
      setError('Google Maps API key is required. Please check your configuration.');
      setLoading(false);
      return;
    }

    loadGoogleMapsScript(googleMapsApiKey)
      .then(() => {
        setGoogleMapsLoaded(true);
      })
      .catch((err) => {
        setError('Failed to load Google Maps. Please try again later.');
        console.error(err);
      });
  }, [googleMapsApiKey]);

  // Get current location
  useEffect(() => {
    if (initialLocation) {
      setLocations(prev => ({ ...prev, current: initialLocation }));
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocations(prev => ({ 
            ...prev, 
            current: { 
              lat: position.coords.latitude, 
              lng: position.coords.longitude 
            } 
          }));
        },
        (err) => {
          console.warn('Geolocation error:', err);
          // Default to a reasonable fallback location
          setLocations(prev => ({ 
            ...prev, 
            current: { lat: 40.7128, lng: -74.0060 } // New York as default
          }));
        }
      );
    } else {
      setLocations(prev => ({ 
        ...prev, 
        current: { lat: 40.7128, lng: -74.0060 }
      }));
    }
  }, [initialLocation]);

  // Geocode addresses using Google Maps Geocoding API
  useEffect(() => {
    if (!googleMapsLoaded || !window.google || !locations.current) return;

    // If coordinates are provided directly, use them immediately
    if (initialPickupLocation && initialDropoffLocation) {
      setLocations(prev => ({
        ...prev,
        pickup: initialPickupLocation,
        dropoff: initialDropoffLocation
      }));
      setGeocodingComplete(true);
      setLoading(false);
      return;
    }

    const geocodeWithGoogle = async () => {
      try {
        const geocoder = new window.google.maps.Geocoder();

        const geocodeAddress = (address: string): Promise<{ lat: number; lng: number }> => {
          return new Promise((resolve, reject) => {
            if (geocodeCache.has(address)) {
              resolve(geocodeCache.get(address)!);
              return;
            }

            geocoder.geocode({ address }, (results, status) => {
              if (status === 'OK' && results && results[0]) {
                const location = {
                  lat: results[0].geometry.location.lat(),
                  lng: results[0].geometry.location.lng()
                };
                geocodeCache.set(address, location);
                resolve(location);
              } else {
                reject(new Error(`Geocoding failed for: ${address}`));
              }
            });
          });
        };

        const promises = [];
        if (!initialPickupLocation && pickupAddress) {
          promises.push(geocodeAddress(pickupAddress));
        } else if (initialPickupLocation) {
          promises.push(Promise.resolve(initialPickupLocation));
        }

        if (!initialDropoffLocation && dropoffAddress) {
          promises.push(geocodeAddress(dropoffAddress));
        } else if (initialDropoffLocation) {
          promises.push(Promise.resolve(initialDropoffLocation));
        }

        const results = await Promise.all(promises);
        
        setLocations(prev => ({
          ...prev,
          pickup: results[0],
          dropoff: results[1]
        }));
        setGeocodingComplete(true);
      } catch (err) {
        setError('Failed to load locations. Please check the addresses.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    geocodeWithGoogle();
  }, [googleMapsLoaded, pickupAddress, dropoffAddress, initialPickupLocation, initialDropoffLocation, locations.current]);

  // Initialize Google Map
  useEffect(() => {
    if (!googleMapsLoaded || !mapRef.current || !locations.current || !locations.pickup || !locations.dropoff || !geocodingComplete) {
      return;
    }

    const targetLocation = status === 'PROCESSING' ? locations.pickup : locations.dropoff;
    const otherLocation = status === 'PROCESSING' ? locations.dropoff : locations.pickup;

    if (!targetLocation) return;

    // Clear existing map if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current = null;
    }
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
    }

    // Create new map
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: locations.current.lat, lng: locations.current.lng },
      zoom: 14,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
    });

    // Current location marker
    const currentLocationMarker = new window.google.maps.Marker({
      position: { lat: locations.current.lat, lng: locations.current.lng },
      map: map,
      title: 'Your Location',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3,
      },
    });

    // Add label for current location
    const currentInfoWindow = new window.google.maps.InfoWindow({
      content: '<div style="padding: 4px 8px;"><strong>Your Location</strong></div>'
    });
    currentLocationMarker.addListener('click', () => {
      currentInfoWindow.open(map, currentLocationMarker);
    });

    // Destination marker
    const markerColor = status === 'PROCESSING' ? '#3B82F6' : '#10B981';
    const destinationMarker = new window.google.maps.Marker({
      position: { lat: targetLocation.lat, lng: targetLocation.lng },
      map: map,
      title: destinationLabel,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: markerColor,
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3,
      },
    });

    // Info window for destination
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 8px; max-width: 250px;">
          <strong>${destinationLabel}</strong><br>
          ${destinationName ? `<strong>${destinationName}</strong><br>` : ''}
          ${destination}
        </div>
      `
    });
    destinationMarker.addListener('click', () => {
      infoWindow.open(map, destinationMarker);
    });
    infoWindow.open(map, destinationMarker);

    // Other location marker (grayed out)
    if (otherLocation) {
      const otherMarker = new window.google.maps.Marker({
        position: { lat: otherLocation.lat, lng: otherLocation.lng },
        map: map,
        title: status === 'PROCESSING' ? 'Dropoff Location' : 'Pickup Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#9CA3AF',
          fillOpacity: 0.7,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
      });

      const otherInfoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 250px;">
            <strong>${status === 'PROCESSING' ? 'Dropoff Location' : 'Pickup Location'}</strong><br>
            ${status === 'PROCESSING' ? customer : restaurant}<br>
            ${status === 'PROCESSING' ? dropoffAddress : pickupAddress}
          </div>
        `
      });
      otherMarker.addListener('click', () => {
        otherInfoWindow.open(map, otherMarker);
      });
    }

    // Draw route
    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: markerColor,
        strokeWeight: 4,
        strokeOpacity: 0.8,
      }
    });
    directionsRendererRef.current = directionsRenderer;

    directionsService.route(
      {
        origin: { lat: locations.current.lat, lng: locations.current.lng },
        destination: { lat: targetLocation.lat, lng: targetLocation.lng },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);
          
          // Calculate and display distance/duration
          const route = result.routes[0];
          if (route && route.legs[0]) {
            const distance = route.legs[0].distance?.text;
            const duration = route.legs[0].duration?.text;
            
            // You could add this info to a sidebar or tooltip
            console.log(`Distance: ${distance}, Duration: ${duration}`);
          }
        } else {
          console.error('Directions request failed:', status);
        }
      }
    );

    // Fit bounds to show all relevant points
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend({ lat: locations.current.lat, lng: locations.current.lng });
    bounds.extend({ lat: targetLocation.lat, lng: targetLocation.lng });
    if (otherLocation) {
      bounds.extend({ lat: otherLocation.lat, lng: otherLocation.lng });
    }
    map.fitBounds(bounds);

    // Add padding to bounds
    const listener = window.google.maps.event.addListener(map, 'bounds_changed', () => {
      const currentBounds = map.getBounds();
      if (currentBounds && currentBounds.equals(bounds)) {
        // Add some padding by zooming out slightly
        map.setZoom(map.getZoom() - 0.5);
        window.google.maps.event.removeListener(listener);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [googleMapsLoaded, locations, status, geocodingComplete, destinationLabel, destination, destinationName, pickupAddress, dropoffAddress, customer, restaurant]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-2">
            <Navigation size={isMobile ? 20 : 24} />
            <div>
              <h3 className="font-bold text-lg">
                {status === 'PROCESSING' ? 'Route to Pickup' : 'Route to Delivery'}
              </h3>
              <p className="text-xs opacity-90">
                {status === 'PROCESSING' ? 'Head to pickup location' : 'Deliver to customer'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative min-h-[400px]">
          {(loading || !geocodingComplete) && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-600">Loading map...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
              <div className="text-center text-red-600 p-4">
                <p className="mb-2">{error}</p>
                <button 
                  onClick={onClose}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          <div ref={mapRef} className="w-full h-full min-h-[400px]" />
        </div>

        {/* Bottom Info */}
        <div className="p-4 border-t bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                <Navigation size={16} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Your Location</p>
                <p className="text-sm font-medium">Current Position</p>
                {locations.current && (
                  <p className="text-xs text-gray-600 mt-1">
                    {locations.current.lat.toFixed(4)}, {locations.current.lng.toFixed(4)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className={`p-2 rounded-lg flex-shrink-0 ${
                status === 'PROCESSING' ? 'bg-blue-100' : 'bg-green-100'
              }`}>
                <MapPin size={16} className={
                  status === 'PROCESSING' ? 'text-blue-600' : 'text-green-600'
                } />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">{destinationLabel}</p>
                <p className="text-sm font-medium">{destinationName}</p>
                <p className="text-xs text-gray-600 mt-1">{destination}</p>
              </div>
            </div>
          </div>

          {/* Map Status Indicator */}
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Using Google Maps API (in-app)</span>
          </div>

          {/* Action Buttons - NO EXTERNAL LINK */}
          <div className="mt-4 flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                // Option to center on current location
                if (mapInstanceRef.current && locations.current) {
                  mapInstanceRef.current.setCenter(locations.current);
                  mapInstanceRef.current.setZoom(15);
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
            >
              <Navigation size={14} />
              Center on My Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
