// components/DeliveryMap.tsx
'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Navigation, MapPin, Loader2, X, Minimize2, Maximize2, Play, Pause } from 'lucide-react';

// Google Maps script loader
let googleMapsScriptPromise: Promise<void> | null = null;

const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  if (googleMapsScriptPromise) return googleMapsScriptPromise;
  
  googleMapsScriptPromise = new Promise((resolve, reject) => {
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
  
  return googleMapsScriptPromise;
};

// Leaflet CSS and JS loader
let leafletLoaded = false;
let leafletPromise: Promise<any> | null = null;

const loadLeaflet = (): Promise<any> => {
  if (leafletPromise) return leafletPromise;
  
  leafletPromise = new Promise(async (resolve, reject) => {
    try {
      // Load CSS
      if (!document.querySelector('#leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      
      // Load Leaflet JS
      const L = await import('leaflet');
      
      // Fix Leaflet icon issue
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
      
      leafletLoaded = true;
      resolve(L);
    } catch (err) {
      reject(err);
    }
  });
  
  return leafletPromise;
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

type MapType = 'google' | 'leaflet' | null;

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
  const mapInstanceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const isMapInitialized = useRef(false);
  const googleMapsFailed = useRef(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<{
    pickup?: { lat: number; lng: number };
    dropoff?: { lat: number; lng: number };
    current?: { lat: number; lng: number };
  }>({});
  const [mapType, setMapType] = useState<MapType>(null);
  const [geocodingComplete, setGeocodingComplete] = useState(false);
  const [distance, setDistance] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRouteInfo, setShowRouteInfo] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationStep, setNavigationStep] = useState<string>('');
  const [leafletReady, setLeafletReady] = useState(false);

  // Memoized values
  const destination = useMemo(() => status === 'PROCESSING' ? pickupAddress : dropoffAddress, [status, pickupAddress, dropoffAddress]);
  const destinationLabel = useMemo(() => status === 'PROCESSING' ? 'Pickup Location' : 'Delivery Location', [status]);
  const destinationName = useMemo(() => status === 'PROCESSING' ? restaurant : customer, [status, restaurant, customer]);
  const routeColor = useMemo(() => status === 'PROCESSING' ? '#EF4444' : '#F59E0B', [status]);
  const markerColor = useMemo(() => status === 'PROCESSING' ? '#3B82F6' : '#10B981', [status]);

  // Try to load Google Maps first, fallback to Leaflet on failure
  useEffect(() => {
    const initMap = async () => {
      // Pre-load Leaflet as backup
      loadLeaflet().then(() => setLeafletReady(true)).catch(console.error);
      
      if (googleMapsApiKey && googleMapsApiKey.trim() !== '' && !googleMapsFailed.current) {
        try {
          await loadGoogleMapsScript(googleMapsApiKey);
          // Test if Google Maps is working by checking if it loaded correctly
          if (window.google && window.google.maps) {
            setMapType('google');
            return;
          } else {
            throw new Error('Google Maps not available');
          }
        } catch (err) {
          console.warn('Google Maps failed to load, falling back to Leaflet:', err);
          googleMapsFailed.current = true;
          setMapType('leaflet');
          setError('Google Maps quota exceeded. Using OpenStreetMap instead.');
          // Clear error after 5 seconds
          setTimeout(() => setError(null), 5000);
        }
      } else if (leafletReady) {
        setMapType('leaflet');
      }
    };
    
    initMap();
  }, [googleMapsApiKey, leafletReady]);

  // Get current location
  useEffect(() => {
    if (initialLocation) {
      setLocations(prev => ({ ...prev, current: initialLocation }));
      return;
    }
    
    if (!navigator.geolocation) {
      setLocations(prev => ({ ...prev, current: { lat: 40.7128, lng: -74.0060 } }));
      return;
    }
    
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
        setLocations(prev => ({ ...prev, current: { lat: 40.7128, lng: -74.0060 } }));
      }
    );
  }, [initialLocation]);

  // Geocode addresses (supports both Google and Leaflet fallback)
  useEffect(() => {
    if (!mapType || !locations.current) return;
    
    if ((initialPickupLocation && initialDropoffLocation) || (locations.pickup && locations.dropoff)) {
      if (!geocodingComplete && initialPickupLocation && initialDropoffLocation) {
        setLocations(prev => ({
          ...prev,
          pickup: initialPickupLocation,
          dropoff: initialDropoffLocation
        }));
        setGeocodingComplete(true);
        setLoading(false);
      }
      return;
    }

    const geocodeWithNominatim = async (address: string) => {
      if (geocodeCache.has(address)) {
        return geocodeCache.get(address)!;
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
        {
          headers: { 'User-Agent': 'VendorCity/1.0' }
        }
      );
      const data = await response.json();
      
      if (data && data[0]) {
        const location = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
        geocodeCache.set(address, location);
        return location;
      }
      throw new Error(`Could not geocode: ${address}`);
    };

    // FIXED: Removed type annotations to fix build error
    const geocodeWithGoogle = async (address: string) => {
      if (geocodeCache.has(address)) {
        return geocodeCache.get(address)!;
      }

      return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
        const geocoder = new window.google.maps.Geocoder();
        // REMOVED THE TYPE ANNOTATIONS ON results AND status - THIS FIXES THE BUILD ERROR
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const location = {
              lat: results[0].geometry.location.lat(),
              lng: results[0].geometry.location.lng()
            };
            geocodeCache.set(address, location);
            resolve(location);
          } else {
            reject(new Error(`Geocoding failed: ${address}`));
          }
        });
      });
    };

    const geocodeAddress = mapType === 'google' ? geocodeWithGoogle : geocodeWithNominatim;

    const geocodeAll = async () => {
      try {
        setLoading(true);
        const promises = [];
        if (!initialPickupLocation && pickupAddress && !locations.pickup) {
          promises.push(geocodeAddress(pickupAddress));
        } else if (initialPickupLocation && !locations.pickup) {
          promises.push(Promise.resolve(initialPickupLocation));
        }

        if (!initialDropoffLocation && dropoffAddress && !locations.dropoff) {
          promises.push(geocodeAddress(dropoffAddress));
        } else if (initialDropoffLocation && !locations.dropoff) {
          promises.push(Promise.resolve(initialDropoffLocation));
        }

        if (promises.length === 0) {
          setGeocodingComplete(true);
          setLoading(false);
          return;
        }

        const results = await Promise.all(promises);
        
        setLocations(prev => ({
          ...prev,
          pickup: results[0] || prev.pickup,
          dropoff: results[1] || prev.dropoff
        }));
        setGeocodingComplete(true);
      } catch (err) {
        setError('Failed to load locations. Please check the addresses.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    geocodeAll();
  }, [mapType, pickupAddress, dropoffAddress, initialPickupLocation, initialDropoffLocation, locations.current, locations.pickup, locations.dropoff, geocodingComplete]);

  // Initialize Google Map
  useEffect(() => {
    if (mapType !== 'google' || !mapRef.current || !locations.current || !locations.pickup || !locations.dropoff || !geocodingComplete) {
      return;
    }
    
    if (isMapInitialized.current) return;
    
    const targetLocation = status === 'PROCESSING' ? locations.pickup : locations.dropoff;
    const otherLocation = status === 'PROCESSING' ? locations.dropoff : locations.pickup;

    if (!targetLocation) return;
    
    isMapInitialized.current = true;

    try {
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
      new window.google.maps.Marker({
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
        content: `<div style="padding: 8px;"><strong>${destinationLabel}</strong><br>${destinationName || ''}<br>${destination}</div>`
      });
      destinationMarker.addListener('click', () => infoWindow.open(map, destinationMarker));
      infoWindow.open(map, destinationMarker);

      // Draw route
      const directionsService = new window.google.maps.DirectionsService();
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: routeColor,
          strokeWeight: 6,
          strokeOpacity: 0.9,
        },
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
            const route = result.routes[0];
            if (route && route.legs[0]) {
              setDistance(route.legs[0].distance?.text || '');
              setDuration(route.legs[0].duration?.text || '');
            }
          }
        }
      );

      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend({ lat: locations.current.lat, lng: locations.current.lng });
      bounds.extend({ lat: targetLocation.lat, lng: targetLocation.lng });
      if (otherLocation) bounds.extend({ lat: otherLocation.lat, lng: otherLocation.lng });
      map.fitBounds(bounds);
    } catch (err) {
      console.error('Google Maps initialization error:', err);
      // Fall back to Leaflet
      setMapType('leaflet');
      isMapInitialized.current = false;
    }

    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
      isMapInitialized.current = false;
    };
  }, [mapType, locations.pickup, locations.dropoff, locations.current, geocodingComplete, status, destinationLabel, destination, destinationName, markerColor, routeColor]);

  // Initialize Leaflet Map (Fallback)
  useEffect(() => {
    if (mapType !== 'leaflet' || !leafletReady || !mapRef.current || !locations.current || !locations.pickup || !locations.dropoff || !geocodingComplete) {
      return;
    }
    
    if (isMapInitialized.current) return;
    
    const initLeafletMap = async () => {
      try {
        const L = await loadLeaflet();
        
        if (!mapRef.current) return;
        
        const targetLocation = status === 'PROCESSING' ? locations.pickup : locations.dropoff;
        const otherLocation = status === 'PROCESSING' ? locations.dropoff : locations.pickup;

        if (!targetLocation) return;
        
        isMapInitialized.current = true;

        // Clear any existing content in map container
        mapRef.current.innerHTML = '';
        
        const map = L.map(mapRef.current).setView([locations.current!.lat, locations.current!.lng], 14);
        
        // Use OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);
        
        mapInstanceRef.current = map;

        // Current location marker
        L.marker([locations.current!.lat, locations.current!.lng], {
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: '<div style="background-color: #4285F4; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>',
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          })
        }).addTo(map).bindTooltip('Your Location');

        // Destination marker
        const destMarker = L.marker([targetLocation.lat, targetLocation.lng], {
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
            iconSize: [26, 26],
            iconAnchor: [13, 13]
          })
        }).addTo(map);
        
        destMarker.bindPopup(`
          <strong>${destinationLabel}</strong><br>
          ${destinationName || ''}<br>
          ${destination}
        `).openPopup();

        // Draw route
        const points: [number, number][] = [
          [locations.current!.lat, locations.current!.lng],
          [targetLocation.lat, targetLocation.lng]
        ];
        
        const routeLine = L.polyline(points, {
          color: routeColor,
          weight: 6,
          opacity: 0.8,
          dashArray: '10, 10'
        }).addTo(map);
        
        routeLayerRef.current = routeLine;

        // Calculate distance
        const R = 6371;
        const dLat = (targetLocation.lat - locations.current!.lat) * Math.PI / 180;
        const dLon = (targetLocation.lng - locations.current!.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(locations.current!.lat * Math.PI / 180) * Math.cos(targetLocation.lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distKm = R * c;
        
        setDistance(`${distKm.toFixed(1)} km`);
        setDuration(`${Math.round(distKm * 2)} min`);

        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [50, 50] });
        
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
        
      } catch (err) {
        console.error('Leaflet initialization error:', err);
        setError('Failed to initialize map');
      }
    };

    initLeafletMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      isMapInitialized.current = false;
    };
  }, [mapType, leafletReady, locations.pickup, locations.dropoff, locations.current, geocodingComplete, status, destinationLabel, destination, destinationName, markerColor, routeColor]);

  // Location tracking for navigation
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
        
        if (isNavigating && mapInstanceRef.current && locations.current) {
          if (mapType === 'google') {
            mapInstanceRef.current.setCenter({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          } else if (mapType === 'leaflet') {
            mapInstanceRef.current.setView([position.coords.latitude, position.coords.longitude]);
          }
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
  }, [isNavigating, mapType, locations.current]);

  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Update route during navigation
  useEffect(() => {
    if (!isNavigating || !mapInstanceRef.current || !locations.current || !locations.pickup || !locations.dropoff) {
      return;
    }

    const targetLocation = status === 'PROCESSING' ? locations.pickup : locations.dropoff;
    if (!targetLocation) return;

    if (mapType === 'google' && directionsRendererRef.current) {
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
    } else if (mapType === 'leaflet' && routeLayerRef.current) {
      const newPoints: [number, number][] = [
        [locations.current.lat, locations.current.lng],
        [targetLocation.lat, targetLocation.lng]
      ];
      routeLayerRef.current.setLatLngs(newPoints);
      
      const R = 6371;
      const dLat = (targetLocation.lat - locations.current.lat) * Math.PI / 180;
      const dLon = (targetLocation.lng - locations.current.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(locations.current.lat * Math.PI / 180) * Math.cos(targetLocation.lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distKm = R * c;
      setDistance(`${distKm.toFixed(1)} km`);
      setDuration(`${Math.round(distKm * 2)} min`);
    }
  }, [locations.current, isNavigating, locations.pickup, locations.dropoff, status, mapType]);

  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, [stopLocationTracking]);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
    startLocationTracking();
    setNavigationStep('Navigation started. Following your location...');
    
    if (mapInstanceRef.current && locations.current) {
      if (mapType === 'google') {
        mapInstanceRef.current.setCenter(locations.current);
        mapInstanceRef.current.setZoom(15);
      } else if (mapType === 'leaflet') {
        mapInstanceRef.current.setView([locations.current.lat, locations.current.lng], 15);
      }
    }
    
    setTimeout(() => setNavigationStep(''), 3000);
  }, [startLocationTracking, locations.current, mapType]);

  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    stopLocationTracking();
    setNavigationStep('');
  }, [stopLocationTracking]);

  const toggleFullscreen = useCallback(() => {
    const container = document.getElementById('delivery-map-container');
    if (!container) return;
    
    if (!isFullscreen) {
      container.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, [isFullscreen]);

  const handleCenterLocation = useCallback(() => {
    if (mapInstanceRef.current && locations.current) {
      if (mapType === 'google') {
        mapInstanceRef.current.setCenter(locations.current);
        mapInstanceRef.current.setZoom(15);
      } else if (mapType === 'leaflet') {
        mapInstanceRef.current.setView([locations.current.lat, locations.current.lng], 15);
      }
    }
  }, [locations.current, mapType]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const isRouteReady = !!distance && !!duration;

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
                {isNavigating ? 'Navigation active - Following your location' : `Using ${mapType === 'google' ? 'Google Maps' : 'OpenStreetMap'}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleFullscreen} className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition">
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button onClick={onClose} className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition">
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
            <button onClick={() => setShowRouteInfo(false)} className="text-gray-400 hover:text-gray-600">
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
          </div>
        </div>
      )}

      {/* Show Route Info Button */}
      {!showRouteInfo && distance && duration && !isNavigating && (
        <button onClick={() => setShowRouteInfo(true)} className="absolute top-20 left-4 z-20 bg-white rounded-lg shadow-lg p-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
          <MapPin size={16} />
          Show Route Info
        </button>
      )}

      {/* Loading State */}
      {(loading || !geocodingComplete || !mapType) && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-30">
          <div className="text-center bg-white rounded-xl p-6">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-gray-600">Loading map...</p>
            <p className="text-xs text-gray-400 mt-1">{mapType === null ? 'Initializing...' : 'Getting route...'}</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-30">
          <div className="text-center bg-white rounded-xl p-6 max-w-sm">
            <p className="text-red-600 mb-3">{error}</p>
            <button onClick={onClose} className="px-4 py-2 bg-red-600 text-white rounded-lg">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Bottom Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 shadow-lg">
        <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
          <div className="flex-1">
            <p className="text-xs text-gray-500">Destination</p>
            <p className="text-sm font-medium text-gray-800 truncate">
              {destinationName || destination}
            </p>
            {duration && <p className="text-xs text-green-600 mt-0.5">{duration} away</p>}
          </div>
          
          {!isNavigating ? (
            <button
              onClick={startNavigation}
              disabled={!isRouteReady}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
          
          <button
            onClick={handleCenterLocation}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-md"
          >
            <Navigation size={16} />
            <span className="hidden sm:inline">Center</span>
          </button>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="absolute bottom-20 right-4 z-20 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isNavigating ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></div>
        {mapType === 'google' ? 'Google Maps' : 'OpenStreetMap'} {isNavigating ? '• Active' : ''}
      </div>
    </div>
  );
          }
