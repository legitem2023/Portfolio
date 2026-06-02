// src/app/components/hooks/useBackgroundTracking.ts
import { useEffect, useRef } from 'react';
import { Plugins } from '@capacitor/core';

// Correct way to import the plugin
import { BackgroundGeolocation as BgGeo } from '@capgo/background-geolocation';

// Or use Capacitor's plugin registration
const BackgroundGeolocation = (Plugins as any).BackgroundGeolocation || BgGeo;

export function useBackgroundTracking(enabled: boolean = true) {
  const watcherIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const startTracking = async () => {
      try {
        // Check if we're in Capacitor environment
        if (typeof window === 'undefined' || !(window as any).Capacitor) {
          console.log('Not in Capacitor environment, skipping background tracking');
          return;
        }

        // Start background watcher
        const id = await BackgroundGeolocation.addWatcher(
          {
            backgroundMessage: "Tracking your location while you navigate",
            backgroundTitle: "VendorCity",
            requestPermissions: true,
            stale: false,
            distanceFilter: 10,
          },
          (location: any, error: any) => {
            if (error) {
              console.error('Location error:', error);
              return;
            }
            
            if (location) {
              console.log('Background location:', {
                lat: location.latitude,
                lng: location.longitude,
                timestamp: location.time
              });
              
              // Send to your API
              fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rider/location`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  latitude: location.latitude,
                  longitude: location.longitude,
                  accuracy: location.accuracy,
                  timestamp: location.time
                }),
              }).catch(console.error);
            }
          }
        );
        
        watcherIdRef.current = id;
      } catch (err) {
        console.error('Failed to start background tracking:', err);
      }
    };

    startTracking();

    return () => {
      if (watcherIdRef.current) {
        BackgroundGeolocation.removeWatcher({ id: watcherIdRef.current })
          .catch(console.error);
      }
    };
  }, [enabled]);
}
