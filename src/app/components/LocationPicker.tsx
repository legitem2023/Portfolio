// src/app/components/LocationPicker.tsx
'use client';

import React, { useRef, useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Interface for address components
export interface AddressComponents {
  street: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
  fullAddress: string;
}

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string, addressComponents: AddressComponents) => void;
}

export default function LocationPicker({ onLocationSelect }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [marker, setMarker] = useState<L.Marker | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    if (mapRef.current && !map) {
      const initialMap = L.map(mapRef.current).setView([40.7128, -74.0060], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(initialMap);
      
      initialMap.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        await reverseGeocode(lat, lng);
      });
      
      setMap(initialMap);
    }
  }, [map]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      
      // Extract address components
      const address = data.address || {};
      const roadNumber = address.house_number ? `${address.house_number} ` : '';
      const road = address.road || address.pedestrian || address.street || '';
      const street = `${roadNumber}${road}`.trim();
      
      const addressComponents: AddressComponents = {
        street: street || '',
        city: address.city || address.town || address.village || address.hamlet || '',
        state: address.state || address.province || '',
        country: address.country || '',
        zipcode: address.postcode || '',
        fullAddress: data.display_name || `${lat}, ${lng}`
      };
      
      if (marker) {
        marker.setLatLng([lat, lng]);
      } else if (map) {
        const newMarker = L.marker([lat, lng]).addTo(map);
        setMarker(newMarker);
      }
      
      // Pass all components to parent
      onLocationSelect(lat, lng, addressComponents.fullAddress, addressComponents);
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      const fallbackComponents: AddressComponents = {
        street: '',
        city: '',
        state: '',
        country: '',
        zipcode: '',
        fullAddress: `${lat}, ${lng}`
      };
      onLocationSelect(lat, lng, `${lat}, ${lng}`, fallbackComponents);
    }
  };

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          if (map) {
            map.setView([latitude, longitude], 15);
          }
          await reverseGeocode(latitude, longitude);
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please click on the map to select your address.');
          setIsLoadingLocation(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
      setIsLoadingLocation(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={isLoadingLocation}
          className="px-4 py-2 bg-gradient-to-r from-[#b79ad4] to-[#d0b0e8] text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 text-sm"
        >
          <i className={`fas ${isLoadingLocation ? 'fa-spinner fa-spin' : 'fa-location-dot'} mr-2`}></i>
          Use Current Location
        </button>
        <p className="text-xs text-[#6b5b7c] self-center">
          Or click on map to select location
        </p>
      </div>
      <div 
        ref={mapRef} 
        style={{ height: '300px', width: '100%' }}
        className="rounded-xl border border-[#d9c0e8] overflow-hidden"
      />
    </div>
  );
}
