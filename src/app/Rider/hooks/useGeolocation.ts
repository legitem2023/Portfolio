import { useState, useEffect } from 'react';

interface LocationState {
  coords: { lat: number; lng: number } | null;
  error: string | null;
  loading: boolean;
}

export default function useGeolocation() {
  const [location, setLocation] = useState<LocationState>({
    coords: null,
    error: null,
    loading: true
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({
        coords: null,
        error: 'Geolocation not supported',
        loading: false
      });
      return;
    }

    const success = (position: GeolocationPosition) => {
      setLocation({
        coords: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        },
        error: null,
        loading: false
      });
    };

    const error = (err: GeolocationPositionError) => {
      setLocation({
        coords: null,
        error: `ERROR(${err.code}): ${err.message}`,
        loading: false
      });
    };

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(success, error, options);
    
    // Optional: watch position for live updates
    const watchId = navigator.geolocation.watchPosition(success, error, options);
    
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return location;
}
