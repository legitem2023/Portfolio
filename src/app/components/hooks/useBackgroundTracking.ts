// src/app/components/hooks/useBackgroundTracking.ts
import { useEffect, useRef } from 'react';
import { Plugins } from '@capacitor/core';
import { BackgroundGeolocation as BgGeo } from '@capgo/background-geolocation';
import { useRealtimeLocation } from './useRealtimeLocation';

const BackgroundGeolocation = (Plugins as any).BackgroundGeolocation || BgGeo;

export function useBackgroundTracking(
  enabled: boolean = true,
  userId: string | null = null,
  status: 'available' | 'busy' | 'inactive' | 'offline' = 'available'
) {
  const watcherIdRef = useRef<string | null>(null);
  const { updateLocation, addLocation } = useRealtimeLocation(userId || undefined);

  useEffect(() => {
    // Don't run if not enabled or no userId
    if (!enabled || !userId) return;

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
            backgroundMessage: "Tracking your location",
            backgroundTitle: "VendorCity",
            requestPermissions: true,
            stale: false,
            distanceFilter: 10, // Update every 10 meters
          },
          async (location: any, error: any) => {
            if (error) {
              console.error('Location error:', error);
              return;
            }
            
            if (location && userId) {
              try {
                // Try to update existing location first
                await updateLocation(
                  userId,
                  location.latitude,
                  location.longitude,
                  status
                );
                console.log('Location updated:', { userId, lat: location.latitude, lng: location.longitude });
              } catch (error: any) {
                // If update fails (user doesn't exist), add new location
                if (error?.message?.includes('not found') || error?.status === 404) {
                  await addLocation(
                    userId,
                    location.latitude,
                    location.longitude,
                    status
                  );
                  console.log('New location added:', { userId, lat: location.latitude, lng: location.longitude });
                } else {
                  console.error('Error updating location:', error);
                }
              }
            }
          }
        );
        
        watcherIdRef.current = id;
        console.log('Background tracking started for user:', userId);
      } catch (err) {
        console.error('Failed to start background tracking:', err);
      }
    };

    startTracking();

    // Cleanup on unmount or when disabled
    return () => {
      if (watcherIdRef.current) {
        BackgroundGeolocation.removeWatcher({ id: watcherIdRef.current })
          .then(() => console.log('Background tracking stopped'))
          .catch(console.error);
        watcherIdRef.current = null;
      }
    };
  }, [enabled, userId, status, updateLocation, addLocation]);
}
