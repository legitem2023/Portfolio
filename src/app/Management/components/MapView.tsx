// components/MapView.tsx
'use client';

import { useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '500px'
};

export function MapView({ riders, center }: { riders: any[]; center: { lat: number; lng: number } }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!
  });

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={12}
    >
      {riders.map((rider) => (
        <Marker
          key={rider.userID}
          position={{ lat: rider.latitude, lng: rider.longitude }}
          icon={{
            url: `/markers/${rider.status}.png`,
            scaledSize: new google.maps.Size(32, 32)
          }}
        />
      ))}
    </GoogleMap>
  );
}
