// hooks/useBackgroundTracking.js
import { useEffect, useRef } from 'react';
import { registerPlugin } from '@capacitor/core';

// Register the plugin (works in Capacitor environment only)
const BackgroundGeolocation = registerPlugin('BackgroundGeolocation');

export function useBackgroundTracking(enabled = true) {
  const watcherIdRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const startTracking = async () => {
      try {
        // Start background watcher
        const id = await BackgroundGeolocation.addWatcher(
          {
            // ⚠️ CRITICAL: Without backgroundMessage, tracking stops when app is backgrounded[citation:2][citation:10]
            backgroundMessage: "Tracking your location while you navigate",
            backgroundTitle: "VendorCity",
            requestPermissions: true,
            stale: false,
            distanceFilter: 10,        // Update every 10 meters
          },
          (location, error) => {
            if (error) {
              console.error('Location error:', error);
              return;
            }
            
            if (location) {
              // Send to your server or store locally
              console.log('Background location:', {
                lat: location.latitude,
                lng: location.longitude,
                timestamp: location.time
              });
              
              // Example: POST to your API
              fetch('https://your-api.com/track', {
                method: 'POST',
                body: JSON.stringify({
                  latitude: location.latitude,
                  longitude: location.longitude,
                  accuracy: location.accuracy,
                  timestamp: location.time
                }),
                headers: { 'Content-Type': 'application/json' }
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

    // Cleanup: remove watcher when component unmounts
    return () => {
      if (watcherIdRef.current) {
        BackgroundGeolocation.removeWatcher({ id: watcherIdRef.current });
      }
    };
  }, [enabled]);
}
