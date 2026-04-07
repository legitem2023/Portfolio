// components/DeliveryMap.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Navigation, MapPin, Loader2, X } from 'lucide-react';

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
  pickupAddress: string;  // Used ONLY for text/label display
  dropoffAddress: string; // Used ONLY for text/label display
  pickupLocation: { lat: number; lng: number }; // REQUIRED - used for map
  dropoffLocation: { lat: number; lng: number }; // REQUIRED - used for map
  currentLocation?: { lat: number; lng: number };
  status: 'PROCESSING' | 'SHIPPED' | 'DELIVERED';
  isMobile: boolean;
  onClose: () => void;
  restaurant?: string;
  customer?: string;
  googleMapsApiKey?: string;
}

// Google Maps script loader
const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector('#google-maps-script')) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
};

export default function DeliveryMap({ 
  pickupAddress, 
  dropoffAddress, 
  pickupLocation,
  dropoffLocation,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState(initialLocation);
  const [mapType, setMapType] = useState<'google' | 'leaflet' | null>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  // Determine destination based on status
  const destinationAddress = status === 'PROCESSING' ? pickupAddress : dropoffAddress;
  const destinationLabel = status === 'PROCESSING' ? 'Pickup Location' : 'Delivery Location';
  const destinationName = status === 'PROCESSING' ? restaurant : customer;
  const destinationCoordinates = status === 'PROCESSING' ? pickupLocation : dropoffLocation;
  const otherCoordinates = status === 'PROCESSING' ? dropoffLocation : pickupLocation;
  const otherAddress = status === 'PROCESSING' ? dropoffAddress : pickupAddress;
  const otherName = status === 'PROCESSING' ? customer : restaurant;

  // Try to load Google Maps if API key is provided
  useEffect(() => {
    if (googleMapsApiKey && googleMapsApiKey.trim() !== '') {
      loadGoogleMapsScript(googleMapsApiKey)
        .then(() => {
          setGoogleMapsLoaded(true);
          setMapType('google');
        })
        .catch((err) => {
          console.warn('Google Maps failed to load, falling back to Leaflet:', err);
          setMapType('leaflet');
          loadLeaflet().catch(err => {
            setError('Failed to load map library');
            console.error(err);
          });
        });
    } else {
      setMapType('leaflet');
      loadLeaflet().catch(err => {
        setError('Failed to load map library');
        console.error(err);
      });
    }
  }, [googleMapsApiKey]);

  // Get current location
  useEffect(() => {
    if (initialLocation) {
      setCurrentLocation(initialLocation);
      setLoading(false);
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCurrentLocation({ 
              lat: position.coords.latitude, 
              lng: position.coords.longitude 
            });
            setLoading(false);
          },
          (err) => {
            console.warn('Geolocation error:', err);
            setCurrentLocation({ lat: 14.5995, lng: 120.9842 }); // Default to Manila
            setLoading(false);
          }
        );
      } else {
        setCurrentLocation({ lat: 14.5995, lng: 120.9842 });
        setLoading(false);
      }
    }
  }, [initialLocation]);

  // Initialize Google Map
  useEffect(() => {
    if (mapType !== 'google' || !googleMapsLoaded || !mapRef.current || loading || !currentLocation || !destinationCoordinates) {
      return;
    }

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: currentLocation.lat, lng: currentLocation.lng },
      zoom: 14,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    // Current location marker
    new window.google.maps.Marker({
      position: { lat: currentLocation.lat, lng: currentLocation.lng },
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
      label: {
        text: 'You',
        color: '#4285F4',
        fontSize: '12px',
        fontWeight: 'bold',
      }
    });

    // Destination marker
    const markerColor = status === 'PROCESSING' ? '#3B82F6' : '#10B981';
    
    // Info window for destination (using address text)
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 8px;">
          <strong>${destinationLabel}</strong><br>
          ${destinationName ? `<strong>${destinationName}</strong><br>` : ''}
          ${destinationAddress}
        </div>
      `
    });
    
    const destinationMarker = new window.google.maps.Marker({
      position: { lat: destinationCoordinates.lat, lng: destinationCoordinates.lng },
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
      label: {
        text: status === 'PROCESSING' ? 'Pickup' : 'Delivery',
        color: markerColor,
        fontSize: '12px',
        fontWeight: 'bold',
      }
    });
    infoWindow.open(map, destinationMarker);

    // Other location marker (grayed out) - using other coordinates
    if (otherCoordinates) {
      const otherInfoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <strong>${status === 'PROCESSING' ? 'Dropoff Location' : 'Pickup Location'}</strong><br>
            ${otherName ? `<strong>${otherName}</strong><br>` : ''}
            ${otherAddress}
          </div>
        `
      });
      
      const otherMarker = new window.google.maps.Marker({
        position: { lat: otherCoordinates.lat, lng: otherCoordinates.lng },
        map: map,
        title: status === 'PROCESSING' ? 'Dropoff' : 'Pickup',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#9CA3AF',
          fillOpacity: 0.7,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
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
        strokeOpacity: 0.7,
      }
    });

    directionsService.route(
      {
        origin: { lat: currentLocation.lat, lng: currentLocation.lng },
        destination: { lat: destinationCoordinates.lat, lng: destinationCoordinates.lng },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);
        }
      }
    );

    // Fit bounds
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend({ lat: currentLocation.lat, lng: currentLocation.lng });
    bounds.extend({ lat: destinationCoordinates.lat, lng: destinationCoordinates.lng });
    if (otherCoordinates) {
      bounds.extend({ lat: otherCoordinates.lat, lng: otherCoordinates.lng });
    }
    map.fitBounds(bounds);

    mapInstanceRef.current = { map, directionsRenderer };

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.directionsRenderer?.setMap(null);
      }
    };
  }, [mapType, googleMapsLoaded, currentLocation, destinationCoordinates, otherCoordinates, status, loading, destinationLabel, destinationAddress, destinationName, otherAddress, otherName]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (mapType !== 'leaflet' || !mapRef.current || loading || !currentLocation || !destinationCoordinates) {
      return;
    }

    const initLeafletMap = async () => {
      try {
        const L = await loadLeaflet();
        
        if (!mapRef.current) return;
        
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }
        
        const map = L.map(mapRef.current).setView(
          [currentLocation.lat, currentLocation.lng], 
          14
        );

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        // Current location marker
        L.marker([currentLocation.lat, currentLocation.lng], {
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: '<div style="background-color: #4285F4; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white;"></div>',
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          })
        })
        .addTo(map)
        .bindTooltip('Your Location');

        const markerColor = status === 'PROCESSING' ? '#3B82F6' : '#10B981';
        
        // Destination marker with popup showing address text
        L.marker([destinationCoordinates.lat, destinationCoordinates.lng], {
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
            iconSize: [26, 26],
            iconAnchor: [13, 13]
          })
        })
        .addTo(map)
        .bindPopup(`
          <strong>${destinationLabel}</strong><br>
          ${destinationName ? `<strong>${destinationName}</strong><br>` : ''}
          ${destinationAddress}
        `)
        .openPopup();

        // Other location marker (grayed out) with popup showing address text
        if (otherCoordinates) {
          L.marker([otherCoordinates.lat, otherCoordinates.lng], {
            icon: L.divIcon({
              className: 'custom-div-icon',
              html: '<div style="background-color: #9CA3AF; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; opacity: 0.7;"></div>',
              iconSize: [22, 22],
              iconAnchor: [11, 11]
            })
          })
          .addTo(map)
          .bindPopup(`
            <strong>${status === 'PROCESSING' ? 'Dropoff Location' : 'Pickup Location'}</strong><br>
            ${otherName ? `<strong>${otherName}</strong><br>` : ''}
            ${otherAddress}
          `);
        }

        // Draw route line
        const points: [number, number][] = [
          [currentLocation.lat, currentLocation.lng],
          [destinationCoordinates.lat, destinationCoordinates.lng]
        ];
        
        L.polyline(points, {
          color: markerColor,
          weight: 4,
          opacity: 0.7,
          dashArray: '10, 10'
        }).addTo(map);

        const bounds = L.latLngBounds(points);
        if (otherCoordinates) {
          bounds.extend([otherCoordinates.lat, otherCoordinates.lng]);
        }
        map.fitBounds(bounds, { padding: [50, 50] });

        mapInstanceRef.current = map;
      } catch (err) {
        setError('Failed to initialize map');
        console.error(err);
      }
    };

    initLeafletMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, [mapType, currentLocation, destinationCoordinates, otherCoordinates, status, loading, destinationLabel, destinationAddress, destinationName, otherAddress, otherName]);

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

        {/* Bottom Info - Using address text here */}
        <div className="p-4 border-t bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <MapPin size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Your Location</p>
                <p className="text-sm font-medium">Current Position</p>
                {currentLocation && (
                  <p className="text-xs text-gray-400 mt-1">
                    {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                  </p>
                )}
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
                <p className="text-sm font-medium">{destinationName}</p>
                <p className="text-xs text-gray-600 mt-1">{destinationAddress}</p>
                {destinationCoordinates && (
                  <p className="text-xs text-gray-400 mt-1">
                    {destinationCoordinates.lat.toFixed(6)}, {destinationCoordinates.lng.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Map Type Indicator */}
          <div className="mt-2 text-xs text-gray-400">
            Using: {mapType === 'google' ? 'Google Maps' : 'OpenStreetMap (Leaflet)'}
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
              href={`https://www.google.com/maps/dir/?api=1&destination=${destinationCoordinates.lat},${destinationCoordinates.lng}`}
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
