// components/DeliveryMap.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Navigation, MapPin, Loader2, X } from 'lucide-react';
import { useLoadScript } from '@react-google-maps/api';

// Dynamic imports for Leaflet (to avoid SSR issues)
const loadLeaflet = () => import('leaflet').then(mod => {
  // Fix for Leaflet marker icons
  delete (mod.Icon.Default.prototype as any)._getIconUrl;
  mod.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
  return mod;
});

interface DeliveryMapProps {
  pickupAddress: string;
  dropoffAddress: string;
  currentLocation?: { lat: number; lng: number };
  status: 'PROCESSING' | 'SHIPPED' | 'DELIVERED';
  isMobile: boolean;
  onClose: () => void;
  restaurant?: string;
  customer?: string;
}

// Cache for geocoding results
const geocodeCache = new Map<string, { lat: number; lng: number }>();

// Google Maps libraries
const libraries: ("places")[] = ['places'];

export default function DeliveryMap({ 
  pickupAddress, 
  dropoffAddress, 
  currentLocation: initialLocation,
  status,
  isMobile,
  onClose,
  restaurant,
  customer 
}: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useGoogle, setUseGoogle] = useState(true);
  const [locations, setLocations] = useState<{
    pickup?: { lat: number; lng: number };
    dropoff?: { lat: number; lng: number };
    current?: { lat: number; lng: number };
  }>({});
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Google Maps script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  // Load Leaflet dynamically
  useEffect(() => {
    if (!useGoogle) {
      loadLeaflet().then(() => {
        setLeafletLoaded(true);
      });
    }
  }, [useGoogle]);

  // Determine destination based on status
  const destination = status === 'PROCESSING' ? pickupAddress : dropoffAddress;
  const destinationLabel = status === 'PROCESSING' ? 'Pickup Location' : 'Delivery Location';
  const destinationIcon = status === 'PROCESSING' ? '🏪' : '🏠';

  // Get current location
  useEffect(() => {
    if (initialLocation) {
      setLocations(prev => ({ ...prev, current: initialLocation }));
    } else {
      // Try to get user's current location
      if (navigator.geolocation) {
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
            // Default to a reasonable location if geolocation fails
            setLocations(prev => ({ 
              ...prev, 
              current: { lat: 14.5995, lng: 120.9842 } // Manila as fallback
            }));
          }
        );
      }
    }
  }, [initialLocation]);

  // Geocode addresses with Google
  useEffect(() => {
    if (!isLoaded || !locations.current) return;

    const geocodeAddresses = async () => {
      try {
        setLoading(true);
        
        const geocoder = new window.google.maps.Geocoder();
        
        const geocodePromise = (address: string) => {
          return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
            // Check cache first
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

        try {
          const [pickupLoc, dropoffLoc] = await Promise.all([
            geocodePromise(pickupAddress),
            geocodePromise(dropoffAddress)
          ]);

          setLocations(prev => ({
            ...prev,
            pickup: pickupLoc,
            dropoff: dropoffLoc
          }));
        } catch (err) {
          console.warn('Google geocoding failed, falling back to Leaflet', err);
          setUseGoogle(false);
        }
      } catch (err) {
        setError('Failed to load map locations');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    geocodeAddresses();
  }, [isLoaded, pickupAddress, dropoffAddress, locations.current]);

  // Geocode with Leaflet (Nominatim)
  useEffect(() => {
    if (!useGoogle || !leafletLoaded) return;

    const geocodeWithLeaflet = async () => {
      if (!locations.current) return;

      try {
        setLoading(true);

        const geocodeAddress = async (address: string) => {
          // Check cache first
          if (geocodeCache.has(address)) {
            return geocodeCache.get(address)!;
          }

          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
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

        const [pickupLoc, dropoffLoc] = await Promise.all([
          geocodeAddress(pickupAddress),
          geocodeAddress(dropoffAddress)
        ]);

        setLocations(prev => ({
          ...prev,
          pickup: pickupLoc,
          dropoff: dropoffLoc
        }));
      } catch (err) {
        setError('Failed to load map locations');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    geocodeWithLeaflet();
  }, [useGoogle, leafletLoaded, pickupAddress, dropoffAddress, locations.current]);

  // Initialize Google Map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || loading || !locations.current || !locations.pickup || !locations.dropoff || !useGoogle) return;

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        center: locations.current,
        zoom: 14,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      // Add current location marker
      new window.google.maps.Marker({
        position: locations.current,
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#4285F4",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
        title: "Your Location"
      });

      // Add destination marker
      const destLocation = status === 'PROCESSING' ? locations.pickup : locations.dropoff;
      if (destLocation) {
        const marker = new window.google.maps.Marker({
          position: destLocation,
          map: map,
          icon: {
            url: status === 'PROCESSING' 
              ? 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
              : 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
          },
          title: destinationLabel
        });

        // Add info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <strong>${destinationLabel}</strong><br>
              ${status === 'PROCESSING' ? restaurant : customer}<br>
              ${destination}
            </div>
          `
        });
        
        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
      }

      // Draw route
      const directionsService = new window.google.maps.DirectionsService();
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: status === 'PROCESSING' ? '#3B82F6' : '#10B981',
          strokeWeight: 5
        }
      });

      directionsService.route(
        {
          origin: locations.current,
          destination: destLocation!,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK') {
            directionsRenderer.setDirections(result);
          }
        }
      );

      // Fit bounds to show both points
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(locations.current);
      if (destLocation) bounds.extend(destLocation);
      map.fitBounds(bounds);

      setMapInstance(map);
    } catch (err) {
      console.error('Error initializing Google Map:', err);
      setUseGoogle(false);
    }
  }, [isLoaded, locations, status, useGoogle, loading, destinationLabel, destination, restaurant, customer]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || loading || !locations.current || !locations.pickup || !locations.dropoff || useGoogle) return;

    const initLeafletMap = async () => {
      try {
        const L = await loadLeaflet();
        
        const map = L.map(mapRef.current).setView(
          [locations.current!.lat, locations.current!.lng], 
          14
        );

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        // Add current location marker
        L.marker([locations.current!.lat, locations.current!.lng], {
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: '<div style="background-color: #4285F4; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white;"></div>',
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          })
        })
        .addTo(map)
        .bindTooltip('Your Location');

        // Add destination marker
        const destLocation = status === 'PROCESSING' ? locations.pickup : locations.dropoff;
        if (destLocation) {
          const markerColor = status === 'PROCESSING' ? '#3B82F6' : '#10B981';
          
          L.marker([destLocation.lat, destLocation.lng], {
            icon: L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="background-color: ${markerColor}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white;"></div>`,
              iconSize: [22, 22],
              iconAnchor: [11, 11]
            })
          })
          .addTo(map)
          .bindPopup(`
            <strong>${destinationLabel}</strong><br>
            ${status === 'PROCESSING' ? restaurant : customer}<br>
            ${destination}
          `);

          // Draw route (simplified - just a straight line for Leaflet)
          const points: [number, number][] = [
            [locations.current!.lat, locations.current!.lng],
            [destLocation.lat, destLocation.lng]
          ];
          
          L.polyline(points, {
            color: markerColor,
            weight: 4,
            opacity: 0.7,
            dashArray: '10, 10'
          }).addTo(map);

          // Fit bounds
          const bounds = L.latLngBounds(points);
          map.fitBounds(bounds);
        }

        setMapInstance(map);
      } catch (err) {
        setError('Failed to initialize map');
        console.error(err);
      }
    };

    initLeafletMap();

    return () => {
      if (mapInstance && mapInstance.remove) {
        mapInstance.remove();
      }
    };
  }, [leafletLoaded, locations, status, useGoogle, loading, destinationLabel, destination, restaurant, customer]);

  if (loadError) {
    setUseGoogle(false);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-2">
            <Navigation size={isMobile ? 20 : 24} />
            <div>
              <h3 className="font-bold text-lg">Delivery Route</h3>
              <p className="text-xs opacity-90">
                {status === 'PROCESSING' ? 'Head to pickup location' : 'Deliver to customer'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-600">Loading map...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
              <div className="text-center text-red-600">
                <p>{error}</p>
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
              <div className="bg-blue-100 p-2 rounded-lg">
                <MapPin size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Your Location</p>
                <p className="text-sm font-medium">Current Position</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className={`p-2 rounded-lg ${
                status === 'PROCESSING' ? 'bg-blue-100' : 'bg-green-100'
              }`}>
                <MapPin size={16} className={
                  status === 'PROCESSING' ? 'text-blue-600' : 'text-green-600'
                } />
              </div>
              <div>
                <p className="text-xs text-gray-500">{destinationLabel}</p>
                <p className="text-sm font-medium">
                  {status === 'PROCESSING' ? restaurant : customer}
                </p>
                <p className="text-xs text-gray-600 mt-1">{destination}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium"
            >
              Close
            </button>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-1"
            >
              <Navigation size={14} />
              Open in Google Maps
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
