"use client";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Map, MapPin } from "lucide-react";
import { icon as leafletIcon, LatLngExpression, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useGeolocation from '../hooks/useGeolocation';
import { getZipCodeFromAddress } from '@jeardev/ph-address'; // PH-smart geocoder

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

// ==============================================
// ✅ SMART PHILIPPINES GEOCODER (REPLACES NOMINATIM)
// ==============================================
const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
// OR use LocationIQ (free 5000/day) - uncomment if no Google key
// const LOCATIONIQ_KEY = process.env.NEXT_PUBLIC_LOCATIONIQ_KEY;

const geocodeAddress = async (address: string): Promise<{lat: number; lng: number} | null> => {
  try {
    // Clean address specifically for PH formats
    let cleanAddress = address
      .replace(/#/g, 'Unit ')
      .replace(/D4/g, 'District 4')
      .replace(/D\d/g, match => `District ${match.replace('D', '')}`)
      .replace(/St\./g, 'Street')
      .replace(/Brgy\.?/g, 'Barangay')
      .trim();

    // Ensure Philippines is in address
    if (!cleanAddress.toLowerCase().includes('philippines')) {
      cleanAddress += ', Philippines';
    }

    // ========== OPTION 1: GOOGLE MAPS (MOST ACCURATE) ==========
    if (GOOGLE_MAPS_KEY) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cleanAddress)}&key=${GOOGLE_MAPS_KEY}&region=ph&components=country:PH`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.results?.[0]) {
        const { lat, lng } = data.results[0].geometry.location;
        console.log(`✅ Geocoded: ${address} -> ${lat}, ${lng}`);
        return { lat, lng };
      }
      
      // Try with ZIP lookup via @jeardev/ph-address as fallback
      try {
        const zip = await getZipCodeFromAddress(address, GOOGLE_MAPS_KEY);
        if (zip) {
          const zipResponse = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${zip},+Philippines&key=${GOOGLE_MAPS_KEY}&components=country:PH`
          );
          const zipData = await zipResponse.json();
          if (zipData.status === 'OK' && zipData.results?.[0]) {
            const { lat, lng } = zipData.results[0].geometry.location;
            return { lat, lng };
          }
        }
      } catch (zipError) {
        console.warn('ZIP lookup failed, continuing...');
      }
    }

    // ========== OPTION 2: LOCATIONIQ (FREE FALLBACK) ==========
    const LOCATIONIQ_KEY = process.env.NEXT_PUBLIC_LOCATIONIQ_KEY;
    if (LOCATIONIQ_KEY) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit safety
      const response = await fetch(
        `https://us1.locationiq.com/v1/search.php?key=${LOCATIONIQ_KEY}&q=${encodeURIComponent(cleanAddress)}&format=json&countrycodes=ph&limit=1`
      );
      const data = await response.json();
      if (data && !data.error && data[0]) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
    }

    // ========== OPTION 3: MAPBOX (SECONDARY FALLBACK) ==========
    const MAPBOX_KEY = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (MAPBOX_KEY) {
      const response = await fetch(
        `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(cleanAddress)}&country=ph&limit=1&access_token=${MAPBOX_KEY}`
      );
      const data = await response.json();
      if (data.features?.[0]) {
        const [lng, lat] = data.features[0].geometry.coordinates;
        return { lat, lng };
      }
    }

    console.warn('❌ All geocoders failed for:', address);
    return null;
  } catch (error) {
    console.error('Geocoding error:', address, error);
    return null;
  }
};

// PH city fallback coordinates (NAMRIA-sourced via @jeardev/ph-address standards)
const PH_FALLBACK_COORDS: { [key: string]: LatLngTuple } = {
  'TAYTAY': [14.5692, 121.1323],
  'RIZAL': [14.5833, 121.1167],
  'MANILA': [14.5995, 120.9842],
  'QUEZON CITY': [14.6760, 121.0437],
  'MAKATI': [14.5547, 121.0244],
  'PASIG': [14.5606, 121.0769],
  'ANTIPOLO': [14.5864, 121.1769],
  'CAINTA': [14.5786, 121.1227],
  'BINANGONAN': [14.4656, 121.1922],
  'ANGONO': [14.5267, 121.1537],
  'TERESA': [14.5614, 121.2189],
  'MORONG': [14.5119, 121.2394],
  'BARAS': [14.5167, 121.2667],
  'CARDONA': [14.4864, 121.2289],
  'JALA-JALA': [14.3531, 121.3225],
  'PILILLA': [14.4856, 121.3064]
};

const MapCenterController = ({ center, zoom }: { center: LatLngExpression; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export default function MapTab({ isMobile, deliveries }: MapTabProps) {
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState(13);
  const [mapDeliveries, setMapDeliveries] = useState<Array<any>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [geocodingProgress, setGeocodingProgress] = useState({ current: 0, total: 0 });
  
  const userLocation = useGeolocation();
  const defaultCenter: LatLngTuple = userLocation.coords 
    ? [userLocation.coords.lat, userLocation.coords.lng]
    : [14.5995, 120.9842];
  
  const riderLocation: LatLngTuple = userLocation.coords 
    ? [userLocation.coords.lat, userLocation.coords.lng]
    : [14.5995, 120.9842];

  useEffect(() => {
    const geocodeAllAddresses = async () => {
      setIsLoading(true);
      setGeocodingProgress({ current: 0, total: deliveries.length * 2 });
      
      const results = [];
      
      for (let i = 0; i < deliveries.length; i++) {
        const delivery = deliveries[i];
        
        const pickupAddress = delivery.pickupAddress 
          ? `${delivery.pickupAddress.street}, ${delivery.pickupAddress.city}, ${delivery.pickupAddress.state} ${delivery.pickupAddress.zipCode}, ${delivery.pickupAddress.country}`
          : delivery.pickup;
        
        const dropoffAddress = delivery.dropoffAddress
          ? `${delivery.dropoffAddress.street}, ${delivery.dropoffAddress.city}, ${delivery.dropoffAddress.state} ${delivery.dropoffAddress.zipCode}, ${delivery.dropoffAddress.country}`
          : delivery.dropoff;

        setGeocodingProgress(prev => ({ ...prev, current: prev.current + 1 }));
        let pickupCoords = await geocodeAddress(pickupAddress);
        
        // Fallback to city-level coordinates if geocoding failed
        if (!pickupCoords) {
          const cityKey = Object.keys(PH_FALLBACK_COORDS).find(key => 
            pickupAddress.toUpperCase().includes(key)
          );
          if (cityKey) {
            const [lat, lng] = PH_FALLBACK_COORDS[cityKey];
            pickupCoords = { lat, lng };
            console.log(`📍 Fallback ${cityKey}: ${lat}, ${lng}`);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        setGeocodingProgress(prev => ({ ...prev, current: prev.current + 1 }));
        let dropoffCoords = await geocodeAddress(dropoffAddress);
        
        if (!dropoffCoords) {
          const cityKey = Object.keys(PH_FALLBACK_COORDS).find(key => 
            dropoffAddress.toUpperCase().includes(key)
          );
          if (cityKey) {
            const [lat, lng] = PH_FALLBACK_COORDS[cityKey];
            dropoffCoords = { lat, lng };
          }
        }

        results.push({
          ...delivery,
          pickupCoords: pickupCoords ? [pickupCoords.lat, pickupCoords.lng] as LatLngTuple : defaultCenter,
          dropoffCoords: dropoffCoords ? [dropoffCoords.lat, dropoffCoords.lng] as LatLngTuple : defaultCenter,
          route: [
            pickupCoords ? [pickupCoords.lat, pickupCoords.lng] : defaultCenter,
            dropoffCoords ? [dropoffCoords.lat, dropoffCoords.lng] : defaultCenter
          ] as LatLngTuple[]
        });
      }
      
      setMapDeliveries(results);
      setIsLoading(false);
    };

    if (deliveries.length > 0) {
      geocodeAllAddresses();
    }
  }, [deliveries, defaultCenter]);

  const mapCenter: LatLngExpression = selectedDelivery && mapDeliveries.length > 0
    ? mapDeliveries.find(d => d.id === selectedDelivery)?.pickupCoords || defaultCenter
    : defaultCenter;

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

  // ========== RENDER ==========
  if (userLocation.loading || isLoading) {
    return (
      <div className="p-2 lg:p-6">
        <h2 className="text-lg lg:text-2xl font-bold mb-3 lg:mb-6 flex items-center gap-1 lg:gap-2">
          <Map size={isMobile ? 20 : 24} />
          <span className="text-base lg:text-2xl">Live Delivery Map</span>
        </h2>
        <div className="bg-gray-900 rounded-lg flex items-center justify-center" style={{ height: isMobile ? '400px' : '600px' }}>
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg mb-2">
              {userLocation.loading ? 'Getting your location...' : 'Geocoding PH addresses...'}
            </p>
            {geocodingProgress.total > 0 && (
              <div className="w-64 mx-auto">
                <div className="flex justify-between text-sm mb-1">
                  <span>📍 Smart PH Geocoder</span>
                  <span>{geocodingProgress.current} / {geocodingProgress.total}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${(geocodingProgress.current / geocodingProgress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
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

          <Marker position={riderLocation} icon={riderIcon}>
            <Popup>
              <div className="font-semibold">Your Location</div>
              <div className="text-sm text-gray-600">Rider: Michael</div>
              <div className="text-xs text-blue-600 mt-1">Vehicle: HD 4587</div>
            </Popup>
          </Marker>

          {mapDeliveries.map((delivery) => (
            <div key={delivery.id}>
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

        <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
          <button onClick={handleZoomIn} className="bg-white w-10 h-10 rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-100 text-lg font-bold">+</button>
          <button onClick={handleZoomOut} className="bg-white w-10 h-10 rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-100 text-lg font-bold">−</button>
        </div>

        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg z-[1000] max-w-xs">
          <h4 className="font-semibold text-sm mb-2">📍 Smart PH Tracking</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse"></div><span>Your Location</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div><span>Pickup</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span>Dropoff</span></div>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <h3 className="font-semibold text-gray-700">Active Deliveries</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {mapDeliveries.map((delivery) => (
            <div 
              key={delivery.id}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedDelivery === delivery.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
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
                  delivery.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  delivery.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
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
