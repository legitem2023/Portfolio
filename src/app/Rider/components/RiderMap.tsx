// components/RiderMap.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { gql, useMutation } from '@apollo/client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';

// GraphQL Mutation
const LOCATION_TRACKING_MUTATION = gql`
  mutation LocationTracking($input: LocationInput!) {
    locationTracking(input: $input) {
      userID
      latitude
      longitude
    }
  }
`;

// Types
interface LocationInput {
  userID: string;
  latitude: number;
  longitude: number;
}

interface LocationTrackingResponse {
  userID: string;
  latitude: number;
  longitude: number;
}

interface RiderLocation {
  userID: string;
  latitude: number;
  longitude: number;
  status: 'available' | 'busy' | 'inactive' | 'offline';
  lastUpdated: string;
}

interface Destination {
  latitude: number;
  longitude: number;
  address: string;
}

interface RiderMapProps {
  userID: string;
  destination?: Destination | null;
  onLocationUpdate?: (location: RiderLocation) => void;
  updateInterval?: number; // in milliseconds, default 30000 (30 seconds)
  googleMapsApiKey?: string; // Optional - if not provided, uses Leaflet
}

// Fix for Leaflet marker icons in Next.js
const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

declare global {
  interface Window {
    google: any;
    initGoogleMaps?: () => void;
  }
}

export default function RiderMap({
  userID,
  destination,
  onLocationUpdate,
  updateInterval = 30000,
  googleMapsApiKey,
}: RiderMapProps) {
  const [currentLocation, setCurrentLocation] = useState<RiderLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapType, setMapType] = useState<'google' | 'leaflet'>('leaflet');
  
  const [updateLocationMutation, { loading: mutationLoading }] = useMutation<
    { locationTracking: LocationTrackingResponse },
    { input: LocationInput }
  >(LOCATION_TRACKING_MUTATION);

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  
  // Markers
  const riderMarkerRef = useRef<google.maps.Marker | L.Marker | null>(null);
  const destinationMarkerRef = useRef<google.maps.Marker | L.Marker | null>(null);
  
  // Routing
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | L.Routing.Control | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if Google Maps API is available
  useEffect(() => {
    const hasGoogleMapsApi = !!googleMapsApiKey && googleMapsApiKey.trim() !== '';
    
    if (hasGoogleMapsApi) {
      // Try to load Google Maps
      if (!window.google) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          setMapType('google');
          setMapLoaded(true);
        };
        script.onerror = () => {
          console.warn('Google Maps failed to load, falling back to Leaflet');
          setMapType('leaflet');
          setMapLoaded(true);
          fixLeafletIcons();
        };
        document.head.appendChild(script);
      } else {
        setMapType('google');
        setMapLoaded(true);
      }
    } else {
      // Use Leaflet as default
      setMapType('leaflet');
      setMapLoaded(true);
      fixLeafletIcons();
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Cleanup maps
      if (googleMapRef.current) {
        googleMapRef.current = null;
      }
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [googleMapsApiKey]);

  // Initialize appropriate map
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current) return;

    if (mapType === 'google' && !googleMapRef.current) {
      initializeGoogleMap();
    } else if (mapType === 'leaflet' && !leafletMapRef.current) {
      initializeLeafletMap();
    }
  }, [mapLoaded, mapType]);

  // Initialize Google Map
  const initializeGoogleMap = () => {
    if (!mapContainerRef.current || !window.google) return;

    const defaultCenter = { lat: 40.7128, lng: -74.0060 };
    
    googleMapRef.current = new window.google.maps.Map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 13,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      map: googleMapRef.current,
      suppressMarkers: true,
    });
  };

  // Initialize Leaflet Map
  const initializeLeafletMap = () => {
    if (!mapContainerRef.current) return;

    leafletMapRef.current = L.map(mapContainerRef.current).setView([40.7128, -74.0060], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors',
      maxZoom: 19,
    }).addTo(leafletMapRef.current);
  };

  // Update route based on map type
  const updateRoute = useCallback(() => {
    if (!currentLocation || !destination) return;

    if (mapType === 'google' && googleMapRef.current && window.google) {
      const directionsService = new window.google.maps.DirectionsService();
      
      directionsService.route(
        {
          origin: { lat: currentLocation.latitude, lng: currentLocation.longitude },
          destination: { lat: destination.latitude, lng: destination.longitude },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result: any, status: string) => {
          if (status === 'OK' && directionsRendererRef.current) {
            (directionsRendererRef.current as google.maps.DirectionsRenderer).setDirections(result);
          }
        }
      );
    } 
    else if (mapType === 'leaflet' && leafletMapRef.current && (window as any).L && (window as any).L.Routing) {
      // Remove existing routing control
      if (directionsRendererRef.current) {
        leafletMapRef.current.removeControl(directionsRendererRef.current as L.Routing.Control);
      }
      
      // Create new routing control
      const routingControl = (window as any).L.Routing.control({
        waypoints: [
          (window as any).L.latLng(currentLocation.latitude, currentLocation.longitude),
          (window as any).L.latLng(destination.latitude, destination.longitude)
        ],
        routeWhileDragging: false,
        showAlternatives: false,
        fitSelectedRoutes: true,
        lineOptions: {
          styles: [{ color: '#4285F4', weight: 4 }]
        }
      }).addTo(leafletMapRef.current);
      
      directionsRendererRef.current = routingControl;
    }
  }, [currentLocation, destination, mapType]);

  // Update route when dependencies change
  useEffect(() => {
    if (currentLocation && destination && mapLoaded) {
      updateRoute();
    }
  }, [currentLocation, destination, updateRoute, mapLoaded]);

  // Update rider marker position
  const updateRiderMarker = useCallback((location: RiderLocation) => {
    if (mapType === 'google' && googleMapRef.current && window.google) {
      const position = { lat: location.latitude, lng: location.longitude };
      
      if (!riderMarkerRef.current) {
        riderMarkerRef.current = new window.google.maps.Marker({
          position: position,
          map: googleMapRef.current,
          title: 'Your Location',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
          animation: window.google.maps.Animation.DROP,
        });
      } else {
        (riderMarkerRef.current as google.maps.Marker).setPosition(position);
      }
      
      googleMapRef.current.setCenter(position);
    } 
    else if (mapType === 'leaflet' && leafletMapRef.current) {
      const position = L.latLng(location.latitude, location.longitude);
      
      if (!riderMarkerRef.current) {
        const customIcon = L.divIcon({
          className: 'custom-rider-marker',
          html: '<div style="background-color: #4285F4; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        
        riderMarkerRef.current = L.marker(position, { icon: customIcon })
          .addTo(leafletMapRef.current)
          .bindPopup('Your Location');
      } else {
        (riderMarkerRef.current as L.Marker).setLatLng(position);
      }
      
      leafletMapRef.current.setView(position, leafletMapRef.current.getZoom());
    }
  }, [mapType]);

  // Update destination marker
  useEffect(() => {
    if (!mapLoaded || !destination) return;

    const position = mapType === 'google' 
      ? { lat: destination.latitude, lng: destination.longitude }
      : L.latLng(destination.latitude, destination.longitude);

    if (mapType === 'google' && googleMapRef.current && window.google) {
      if (!destinationMarkerRef.current) {
        destinationMarkerRef.current = new window.google.maps.Marker({
          position: position as google.maps.LatLngLiteral,
          map: googleMapRef.current,
          title: destination.address || 'Destination',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#EA4335',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
          label: {
            text: '📍',
            color: '#EA4335',
            fontSize: '20px',
          },
        });
      } else {
        (destinationMarkerRef.current as google.maps.Marker).setPosition(position as google.maps.LatLngLiteral);
      }
    } 
    else if (mapType === 'leaflet' && leafletMapRef.current) {
      if (!destinationMarkerRef.current) {
        const customIcon = L.divIcon({
          className: 'custom-destination-marker',
          html: '<div style="background-color: #EA4335; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; font-size: 14px;">📍</div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        
        destinationMarkerRef.current = L.marker(position as L.LatLngExpression, { icon: customIcon })
          .addTo(leafletMapRef.current)
          .bindPopup(destination.address || 'Destination');
      } else {
        (destinationMarkerRef.current as L.Marker).setLatLng(position as L.LatLngExpression);
      }
    }

    // Fit bounds to show both markers if current location exists
    if (currentLocation && mapType === 'google' && googleMapRef.current) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(position as google.maps.LatLngLiteral);
      bounds.extend({ lat: currentLocation.latitude, lng: currentLocation.longitude });
      googleMapRef.current.fitBounds(bounds);
    } else if (currentLocation && mapType === 'leaflet' && leafletMapRef.current) {
      const bounds = L.latLngBounds([
        [currentLocation.latitude, currentLocation.longitude],
        [destination.latitude, destination.longitude]
      ]);
      leafletMapRef.current.fitBounds(bounds);
    }
  }, [destination, currentLocation, mapLoaded, mapType]);

  // Send location to backend using GraphQL mutation
  const sendLocationToBackend = useCallback(
    async (latitude: number, longitude: number) => {
      try {
        const { data } = await updateLocationMutation({
          variables: {
            input: {
              userID,
              latitude,
              longitude,
            },
          },
        });

        if (data?.locationTracking) {
          const newLocation: RiderLocation = {
            userID,
            latitude,
            longitude,
            status: 'available',
            lastUpdated: new Date().toISOString(),
          };
          setCurrentLocation(newLocation);
          if (mapLoaded) {
            updateRiderMarker(newLocation);
          }
          onLocationUpdate?.(newLocation);
        }
      } catch (err) {
        console.error('Failed to update location:', err);
        setError('Failed to update location. Please check your connection.');
      }
    },
    [userID, updateLocationMutation, onLocationUpdate, updateRiderMarker, mapLoaded]
  );

  // Start location tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsTracking(true);
    setError(null);

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        sendLocationToBackend(latitude, longitude);
        
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        
        intervalRef.current = setInterval(() => {
          sendLocationToBackend(latitude, longitude);
        }, updateInterval);
      },
      (err) => {
        console.error('Geolocation error:', err);
        let errorMessage = 'Location error: ';
        switch(err.code) {
          case err.PERMISSION_DENIED:
            errorMessage += 'Please enable location permissions.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage += 'Position unavailable. Please check your GPS.';
            break;
          case err.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += err.message;
        }
        setError(errorMessage);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    setWatchId(id);
  }, [sendLocationToBackend, updateInterval]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsTracking(false);
  }, [watchId]);

  // Get current location once
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        sendLocationToBackend(latitude, longitude);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError(`Failed to get location: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  }, [sendLocationToBackend]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full min-h-[500px] rounded-lg shadow-lg"
        style={{ backgroundColor: '#f0f0f0' }}
      />
      
      {/* Loading Overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Map Type Indicator */}
      {mapLoaded && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg shadow-lg px-3 py-1 text-xs">
          <span className="font-medium">Map: </span>
          <span className={mapType === 'google' ? 'text-blue-600' : 'text-green-600'}>
            {mapType === 'google' ? 'Google Maps' : 'OpenStreetMap (Leaflet)'}
          </span>
        </div>
      )}
      
      {/* Controls */}
      <div className="absolute top-4 right-4 flex gap-2">
        {!isTracking ? (
          <button
            onClick={startTracking}
            disabled={!mapLoaded}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Live Tracking
          </button>
        ) : (
          <button
            onClick={stopTracking}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition-colors"
          >
            Stop Tracking
          </button>
        )}
        
        <button
          onClick={getCurrentLocation}
          disabled={!mapLoaded}
          className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          My Location
        </button>
      </div>
      
      {/* Destination Info */}
      {destination && (
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-md">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-lg">📍</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Destination</h3>
              <p className="text-gray-600 text-sm mt-1">{destination.address}</p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs text-gray-500">
                  Lat: {destination.latitude.toFixed(6)}
                </span>
                <span className="text-xs text-gray-500">
                  Lng: {destination.longitude.toFixed(6)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Current Location Info */}
      {currentLocation && (
        <div className="absolute top-20 left-4 bg-white rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">
              Live Tracking Active
            </span>
          </div>
          {mutationLoading && (
            <div className="text-xs text-gray-500 mt-1">
              Syncing...
            </div>
          )}
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="absolute bottom-4 left-4 right-4 max-w-md bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-red-600">⚠️</span>
            <p className="text-sm text-red-800 flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Instructions */}
      {!isTracking && !currentLocation && mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white bg-opacity-95 rounded-lg shadow-xl p-6 max-w-sm text-center pointer-events-auto">
            <div className="text-4xl mb-3">🗺️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Start Location Tracking
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Click "Start Live Tracking" to share your location and see the route to your destination.
            </p>
            {destination && (
              <div className="bg-blue-50 rounded p-3 text-sm text-blue-800">
                📍 Destination set: {destination.address}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
