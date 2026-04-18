// components/DeliveryMap.tsx
'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Navigation, MapPin, Loader2, X, Minimize2, Maximize2, Play, Pause } from 'lucide-react';

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
  const [distance, setDistance] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRouteInfo, setShowRouteInfo] = useState(true);
  const [routeDrawn, setRouteDrawn] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationStep, setNavigationStep] = useState<string>('');
  const watchIdRef = useRef<number | null>(null);

  // Memoized values to prevent re-renders
  const destination = useMemo(() => status === 'PROCESSING' ? pickupAddress : dropoffAddress, [status, pickupAddress, dropoffAddress]);
  const destinationLabel = useMemo(() => status === 'PROCESSING' ? 'Pickup Location' : 'Delivery Location', [status]);
  const destinationName = useMemo(() => status === 'PROCESSING' ? restaurant : customer, [status, restaurant, customer]);
  const routeColor = useMemo(() => status === 'PROCESSING' ? '#EF4444' : '#F59E0B', [status]);
  const markerColor = useMemo(() => status === 'PROCESSING' ? '#3B82F6' : '#10B981', [status]);

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

  // Get current location with continuous updates
  useEffect(() => {
    if (initialLocation) {
      setLocations(prev => ({ ...prev, current: initialLocation }));
    } else if (navigator.geolocation) {
      const getLocation = () => {
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
            setLocations(prev => ({ 
              ...prev, 
              current: { lat: 40.7128, lng: -74.0060 }
            }));
          }
        );
      };
      getLocation();
    } else {
      setLocations(prev => ({ 
        ...prev, 
        current: { lat: 40.7128, lng: -74.0060 }
      }));
    }
  }, [initialLocation]);

  // Start continuous location tracking when navigating
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) return;
    
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setLocations(prev => ({
          ...prev,
          current: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }));
        
        // Update map center if navigating
        if (isNavigating && mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        }
      },
      (err) => {
        console.warn('Location tracking error:', err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 27000,
      }
    );
  }, [isNavigating]);

  // Stop location tracking
  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Clean up tracking on unmount
  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, [stopLocationTracking]);

  // Start navigation
  const startNavigation = useCallback(() => {
    setIsNavigating(true);
    startLocationTracking();
    setNavigationStep('Navigation started. Follow the route on map.');
    
    // Re-center map and start following user
    if (mapInstanceRef.current && locations.current) {
      mapInstanceRef.current.setCenter(locations.current);
      mapInstanceRef.current.setZoom(15);
    }
    
    // Auto-hide route info after 3 seconds
    setTimeout(() => {
      setShowRouteInfo(false);
    }, 3000);
  }, [startLocationTracking, locations.current]);

  // Stop navigation
  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    stopLocationTracking();
    setNavigationStep('');
  }, [stopLocationTracking]);

  // Geocode addresses using Google Maps Geocoding API
  useEffect(() => {
    if (!googleMapsLoaded || !window.google || !locations.current) return;

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

  // Update route when location changes (only if navigating)
  useEffect(() => {
    if (!isNavigating || !googleMapsLoaded || !mapInstanceRef.current || !locations.current || !locations.pickup || !locations.dropoff) {
      return;
    }

    const targetLocation = status === 'PROCESSING' ? locations.pickup : locations.dropoff;
    if (!targetLocation) return;

    // Update directions with new location
    const directionsService = new window.google.maps.DirectionsService();
    
    directionsService.route(
      {
        origin: { lat: locations.current.lat, lng: locations.current.lng },
        destination: { lat: targetLocation.lat, lng: targetLocation.lng },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result && directionsRendererRef.current) {
          directionsRendererRef.current.setDirections(result);
          
          const route = result.routes[0];
          if (route && route.legs[0]) {
            setDistance(route.legs[0].distance?.text || '');
            setDuration(route.legs[0].duration?.text || '');
          }
        }
      }
    );
  }, [locations.current, isNavigating, googleMapsLoaded, locations.pickup, locations.dropoff, status]);

  // Initialize Google Map
  useEffect(() => {
    if (!googleMapsLoaded || !mapRef.current || !locations.current || !locations.pickup || !locations.dropoff || !geocodingComplete) {
      return;
    }

    const targetLocation = status === 'PROCESSING' ? locations.pickup : locations.dropoff;
    const otherLocation = status === 'PROCESSING' ? locations.dropoff : locations.pickup;

    if (!targetLocation) return;

    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
    }

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: locations.current.lat, lng: locations.current.lng },
      zoom: 14,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    // Current location marker
    const currentLocationMarker = new window.google.maps.Marker({
      position: { lat: locations.current.lat, lng: locations.current.lng },
      map: map,
      title: 'Your Location',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3,
      },
      zIndex: 100,
    });

    const currentInfoWindow = new window.google.maps.InfoWindow({
      content: '<div style="padding: 4px 8px;"><strong>📍 Your Location</strong></div>'
    });
    currentLocationMarker.addListener('click', () => {
      currentInfoWindow.open(map, currentLocationMarker);
    });

    // Destination marker
    const destinationMarker = new window.google.maps.Marker({
      position: { lat: targetLocation.lat, lng: targetLocation.lng },
      map: map,
      title: destinationLabel,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: markerColor,
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3,
      },
      zIndex: 90,
    });

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

    // Other location marker
    if (otherLocation) {
      const otherMarker = new window.google.maps.Marker({
        position: { lat: otherLocation.lat, lng: otherLocation.lng },
        map: map,
        title: status === 'PROCESSING' ? 'Dropoff Location' : 'Pickup Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#9CA3AF',
          fillOpacity: 0.7,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
        zIndex: 80,
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
        strokeColor: routeColor,
        strokeWeight: 6,
        strokeOpacity: 0.9,
        icons: [{
          icon: {
            path: 'M 0,-1 0,1',
            strokeOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
          offset: '0',
          repeat: '20px'
        }]
      },
    });
    directionsRendererRef.current = directionsRenderer;

    directionsService.route(
      {
        origin: { lat: locations.current.lat, lng: locations.current.lng },
        destination: { lat: targetLocation.lat, lng: targetLocation.lng },
        travelMode: window.google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);
          setRouteDrawn(true);
          
          const route = result.routes[0];
          if (route && route.legs[0]) {
            setDistance(route.legs[0].distance?.text || '');
            setDuration(route.legs[0].duration?.text || '');
          }
        } else {
          console.error('Directions request failed:', status);
          if (locations.current && targetLocation) {
            const straightLine = new window.google.maps.Polyline({
              path: [
                { lat: locations.current.lat, lng: locations.current.lng },
                { lat: targetLocation.lat, lng: targetLocation.lng }
              ],
              geodesic: true,
              strokeColor: routeColor,
              strokeOpacity: 0.8,
              strokeWeight: 6,
            });
            straightLine.setMap(map);
            setRouteDrawn(true);
          }
        }
      }
    );

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend({ lat: locations.current.lat, lng: locations.current.lng });
    bounds.extend({ lat: targetLocation.lat, lng: targetLocation.lng });
    if (otherLocation) {
      bounds.extend({ lat: otherLocation.lat, lng: otherLocation.lng });
    }
    map.fitBounds(bounds);

    setTimeout(() => {
      const currentZoom = map.getZoom();
      if (currentZoom) {
        map.setZoom(currentZoom - 0.5);
      }
    }, 100);

    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
    };
  }, [googleMapsLoaded, locations, status, geocodingComplete, destinationLabel, destination, destinationName, pickupAddress, dropoffAddress, customer, restaurant, markerColor, routeColor]);

  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    const container = document.getElementById('delivery-map-container');
    if (!container) return;
    
    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [isFullscreen]);

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Memoized center on location handler
  const handleCenterLocation = useCallback(() => {
    if (mapInstanceRef.current && locations.current) {
      mapInstanceRef.current.setCenter(locations.current);
      mapInstanceRef.current.setZoom(15);
    }
  }, [locations.current]);

  return (
    <div 
      id="delivery-map-container"
      className="fixed inset-0 bg-black z-50 flex flex-col"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Navigation size={24} />
            <div>
              <h3 className="font-bold text-lg">
                {status === 'PROCESSING' ? '🚚 Route to Pickup' : '📦 Route to Delivery'}
              </h3>
              <p className="text-xs opacity-90">
                {isNavigating ? 'Navigation active - Following your location' : (status === 'PROCESSING' ? 'Follow the red path to pickup location' : 'Follow the orange path to delivery location')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition"
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Step Indicator */}
      {navigationStep && (
        <div className="absolute top-20 left-4 right-4 z-20 bg-green-500 text-white rounded-xl shadow-xl p-3 animate-pulse">
          <div className="flex items-center gap-2">
            <Navigation size={18} />
            <p className="text-sm font-medium">{navigationStep}</p>
          </div>
        </div>
      )}

      {/* Route Info Card */}
      {showRouteInfo && distance && duration && !isNavigating && (
        <div className="absolute top-20 left-4 right-4 z-20 bg-white rounded-xl shadow-xl p-4 max-w-md">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-gray-800">Route Information</h4>
            <button
              onClick={() => setShowRouteInfo(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Distance</p>
              <p className="text-lg font-bold text-blue-600">{distance}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Est. Time</p>
              <p className="text-lg font-bold text-green-600">{duration}</p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>From: Your Location</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
              <div className={`w-3 h-3 ${status === 'PROCESSING' ? 'bg-red-500' : 'bg-orange-500'} rounded-full`}></div>
              <span>To: {destinationLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
              <div className="w-3 h-0.5 bg-red-500"></div>
              <span>Route path (follow the colored line)</span>
            </div>
          </div>
        </div>
      )}

      {/* Show Route Info Button */}
      {!showRouteInfo && distance && duration && !isNavigating && (
        <button
          onClick={() => setShowRouteInfo(true)}
          className="absolute top-20 left-4 z-20 bg-white rounded-lg shadow-lg p-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <MapPin size={16} />
          Show Route Info
        </button>
      )}

      {/* Loading State */}
      {(loading || !geocodingComplete) && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-30">
          <div className="text-center bg-white rounded-xl p-6">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-gray-600">Loading map...</p>
            <p className="text-xs text-gray-400 mt-1">Getting your route</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-30">
          <div className="text-center bg-white rounded-xl p-6 max-w-sm">
            <p className="text-red-600 mb-3">{error}</p>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-red-600 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" style={{ flex: 1, minHeight: 0 }} />

      {/* Bottom Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 shadow-lg">
        <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
          <div className="flex-1">
            <p className="text-xs text-gray-500">Destination</p>
            <p className="text-sm font-medium text-gray-800 truncate">
              {destinationName || destination}
            </p>
            {duration && (
              <p className="text-xs text-green-600 mt-0.5">{duration} away</p>
            )}
          </div>
          
          {/* Start/Stop Navigation Button */}
          {!isNavigating ? (
            <button
              onClick={startNavigation}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-md"
            >
              <Play size={16} />
              <span>Start Navigation</span>
            </button>
          ) : (
            <button
              onClick={stopNavigation}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-md"
            >
              <Pause size={16} />
              <span>Stop Navigation</span>
            </button>
          )}
          
          {/* Center Button */}
          <button
            onClick={handleCenterLocation}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-md"
          >
            <Navigation size={16} />
            <span className="hidden sm:inline">Center</span>
          </button>
        </div>
      </div>

      {/* Map Type & Navigation Status */}
      <div className="absolute bottom-20 right-4 z-20 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${routeDrawn ? 'bg-green-500' : 'bg-yellow-500'} ${isNavigating ? 'animate-pulse' : ''}`}></div>
        {isNavigating ? 'Navigation Active' : (routeDrawn ? 'Route loaded' : 'Loading route...')}
      </div>
    </div>
  );
          }
