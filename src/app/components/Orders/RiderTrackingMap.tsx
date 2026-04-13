// components/RiderTrackingMap.tsx
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RiderTrackingMapProps {
  riderLocation?: { latitude: number; longitude: number };
  deliveryLocation: { lat: number; lng: number; address: string };
}

export default function RiderTrackingMap({ riderLocation, deliveryLocation }: RiderTrackingMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);
  const deliveryMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current).setView([deliveryLocation.lat, deliveryLocation.lng], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(mapRef.current);

    // Add delivery marker
    const deliveryIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: #ef4444; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [14, 14],
      popupAnchor: [0, -7],
    });

    deliveryMarkerRef.current = L.marker([deliveryLocation.lat, deliveryLocation.lng], { icon: deliveryIcon })
      .addTo(mapRef.current)
      .bindPopup(`<b>Delivery Location</b><br/>${deliveryLocation.address}`);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [deliveryLocation]);

  // Update rider location
  useEffect(() => {
    if (!mapRef.current) return;

    if (riderLocation) {
      const riderLatLng = [riderLocation.latitude, riderLocation.longitude] as L.LatLngExpression;

      // Create or update rider marker
      const riderIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #8b5cf6; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3); animation: pulse 1.5s infinite;"></div>`,
        iconSize: [16, 16],
        popupAnchor: [0, -8],
      });

      if (riderMarkerRef.current) {
        riderMarkerRef.current.setLatLng(riderLatLng);
      } else {
        riderMarkerRef.current = L.marker(riderLatLng, { icon: riderIcon })
          .addTo(mapRef.current)
          .bindPopup('<b>Rider Location</b><br/>Rider is on the way!');
      }

      // Draw route between rider and delivery
      if (routeLayerRef.current) {
        routeLayerRef.current.remove();
      }

      routeLayerRef.current = L.polyline([riderLatLng, [deliveryLocation.lat, deliveryLocation.lng]], {
        color: '#8b5cf6',
        weight: 3,
        opacity: 0.7,
        dashArray: '5, 10',
      }).addTo(mapRef.current);

      // Fit bounds to show both points
      const bounds = L.latLngBounds([riderLatLng, [deliveryLocation.lat, deliveryLocation.lng]]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    } else if (deliveryMarkerRef.current) {
      // If no rider location, just center on delivery
      mapRef.current.setView([deliveryLocation.lat, deliveryLocation.lng], 13);
    }
  }, [riderLocation, deliveryLocation]);

  return (
    <div>
      <div 
        ref={mapContainerRef} 
        style={{ height: '300px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}
      />
      <style jsx global>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
