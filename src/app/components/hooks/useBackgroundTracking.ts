// src/app/components/hooks/useBackgroundTracking.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { BackgroundGeolocation } from '@capacitor-community/background-geolocation';
import { useRealtimeLocation } from './useRealtimeLocation';

interface TrackingConfig {
  enabled: boolean;
  userId: string | null;
  status: 'available' | 'busy' | 'inactive' | 'offline';
  distanceFilter?: number; // meters between updates
  interval?: number; // milliseconds between updates
  fastestInterval?: number;
  accuracy?: number; // desired accuracy in meters
  batteryOptimized?: boolean;
  syncOnNetworkChange?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

interface LocationQueueItem {
  latitude: number;
  longitude: number;
  timestamp: number;
  retries: number;
}

export function useBackgroundTracking({
  enabled = true,
  userId = null,
  status = 'available',
  distanceFilter = 10,
  interval = 10000,
  fastestInterval = 5000,
  accuracy = 10,
  batteryOptimized = true,
  syncOnNetworkChange = true,
  retryCount = 3,
  retryDelay = 5000,
}: TrackingConfig) {
  const [isTracking, setIsTracking] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [lastLocation, setLastLocation] = useState<{ lat: number; lng: number; time: number } | null>(null);
  
  const watcherIdRef = useRef<string | null>(null);
  const locationQueueRef = useRef<LocationQueueItem[]>([]);
  const isSyncingRef = useRef<boolean>(false);
  const networkListenerRef = useRef<any>(null);
  const retryTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  
  const { updateLocation, addLocation, connectionStatus } = useRealtimeLocation(userId || undefined);

  // Process queued locations when network is available
  const processQueue = useCallback(async () => {
    if (isSyncingRef.current || locationQueueRef.current.length === 0 || !userId) return;
    
    isSyncingRef.current = true;
    const queueCopy = [...locationQueueRef.current];
    locationQueueRef.current = [];
    
    try {
      for (const item of queueCopy) {
        let success = false;
        let attempts = 0;
        
        while (!success && attempts < (item.retries || retryCount)) {
          try {
            await updateLocation(
              userId,
              item.latitude,
              item.longitude,
              status
            );
            success = true;
            console.log(`Queue item sent successfully (${attempts + 1} attempts)`);
          } catch (error) {
            attempts++;
            console.error(`Failed to send queued location (attempt ${attempts}/${retryCount}):`, error);
            
            if (attempts >= (item.retries || retryCount)) {
              // Add back to queue with incremented retries
              locationQueueRef.current.push({
                ...item,
                retries: (item.retries || 0) + 1
              });
            } else {
              await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
          }
        }
      }
    } finally {
      isSyncingRef.current = false;
    }
  }, [userId, status, updateLocation, retryCount, retryDelay]);

  // Queue location when offline
  const queueLocation = useCallback((latitude: number, longitude: number) => {
    locationQueueRef.current.push({
      latitude,
      longitude,
      timestamp: Date.now(),
      retries: 0,
    });
    
    // Limit queue size to prevent memory issues
    if (locationQueueRef.current.length > 100) {
      locationQueueRef.current = locationQueueRef.current.slice(-100);
    }
    
    console.log(`Location queued. Queue size: ${locationQueueRef.current.length}`);
  }, []);

  // Send location with retry logic
  const sendLocation = useCallback(async (latitude: number, longitude: number) => {
    if (!userId) return false;
    
    // Check if online
    if (!navigator.onLine) {
      queueLocation(latitude, longitude);
      return false;
    }
    
    try {
      // Try to update first
      await updateLocation(userId, latitude, longitude, status);
      setLastLocation({ lat: latitude, lng: longitude, time: Date.now() });
      return true;
    } catch (error: any) {
      // If user doesn't exist, add new
      if (error?.message?.includes('not found') || error?.status === 404) {
        try {
          await addLocation(userId, latitude, longitude, status);
          setLastLocation({ lat: latitude, lng: longitude, time: Date.now() });
          return true;
        } catch (addError) {
          console.error('Failed to add location:', addError);
          queueLocation(latitude, longitude);
          return false;
        }
      } else {
        console.error('Failed to update location:', error);
        queueLocation(latitude, longitude);
        return false;
      }
    }
  }, [userId, status, updateLocation, addLocation, queueLocation]);

  // Battery-optimized location handler
  const handleLocationUpdate = useCallback(async (location: any) => {
    if (!location?.latitude || !location?.longitude) return;
    
    // Skip if location hasn't changed enough (for battery saving)
    if (batteryOptimized && lastLocation) {
      const distance = calculateDistance(
        lastLocation.lat,
        lastLocation.lng,
        location.latitude,
        location.longitude
      );
      
      if (distance < distanceFilter) {
        return; // Skip this update
      }
    }
    
    // Send location
    await sendLocation(location.latitude, location.longitude);
  }, [batteryOptimized, lastLocation, distanceFilter, sendLocation]);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  };

  // Setup network listener
  const setupNetworkListener = useCallback(() => {
    if (!syncOnNetworkChange) return;
    
    const handleOnline = () => {
      console.log('Network online, processing queued locations');
      processQueue();
    };
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncOnNetworkChange, processQueue]);

  // Start background tracking
  const startTracking = useCallback(async () => {
    if (!userId || !enabled) return;
    
    try {
      setTrackingError(null);
      
      // Check Capacitor environment
      if (typeof window === 'undefined' || !(window as any).Capacitor) {
        console.log('Not in Capacitor environment');
        return;
      }
      
      // Request permissions
      const permStatus = await BackgroundGeolocation.requestPermissions();
      if (permStatus.location !== 'granted') {
        throw new Error('Location permission not granted');
      }
      
      // Configure with advanced options
      await BackgroundGeolocation.configure({
        desiredAccuracy: accuracy,
        distanceFilter: batteryOptimized ? distanceFilter : 0,
        stationaryRadius: batteryOptimized ? 25 : 0,
        debug: false,
        startOnBoot: true,
        stopOnTerminate: false,
        locationProvider: batteryOptimized 
          ? BackgroundGeolocation.LocationProvider.DISTANCE_FILTER_PROVIDER
          : BackgroundGeolocation.LocationProvider.GOOGLE_PLAY_SERVICES_LOCATION_PROVIDER,
        interval: batteryOptimized ? interval : 5000,
        fastestInterval: batteryOptimized ? fastestInterval : 2000,
        activitiesInterval: batteryOptimized ? interval : 5000,
        notificationTitle: 'VendorCity Tracking',
        notificationText: status === 'busy' 
          ? 'Actively tracking your delivery route' 
          : 'Tracking your location for deliveries',
        notificationIconColor: '#84cc16',
        notificationLargeIcon: 'ic_launcher',
        notificationSmallIcon: 'ic_stat_icon',
        // Advanced options
        stopOnStillActivity: batteryOptimized,
        url: undefined, // Don't send directly, we handle it
        syncUrl: undefined,
        syncThreshold: 100,
        httpHeaders: {},
        maxLocations: 1000,
        autoSync: true,
        syncInterval: 15,
      });
      
      // Add watcher
      const watcherId = await BackgroundGeolocation.watchPosition(
        handleLocationUpdate,
        (error) => {
          console.error('Watch position error:', error);
          setTrackingError(error.message || 'Location tracking error');
        }
      );
      
      watcherIdRef.current = watcherId;
      
      // Start the service
      await BackgroundGeolocation.start();
      setIsTracking(true);
      console.log('Background tracking started successfully');
      
      // Process any queued locations
      await processQueue();
      
    } catch (error: any) {
      console.error('Failed to start background tracking:', error);
      setTrackingError(error.message || 'Failed to start tracking');
      setIsTracking(false);
    }
  }, [userId, enabled, accuracy, batteryOptimized, distanceFilter, interval, fastestInterval, status, handleLocationUpdate, processQueue]);

  // Stop background tracking
  const stopTracking = useCallback(async () => {
    try {
      if (watcherIdRef.current) {
        await BackgroundGeolocation.removeWatcher({ id: watcherIdRef.current });
        watcherIdRef.current = null;
      }
      
      await BackgroundGeolocation.stop();
      setIsTracking(false);
      console.log('Background tracking stopped');
      
      // Clear all retry timeouts
      retryTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      retryTimeoutsRef.current = [];
      
      // Final queue flush attempt
      if (locationQueueRef.current.length > 0) {
        console.log(`Flushing ${locationQueueRef.current.length} queued locations before stop`);
        await processQueue();
      }
      
    } catch (error) {
      console.error('Failed to stop background tracking:', error);
    }
  }, [processQueue]);

  // Get current tracking status
  const getTrackingStatus = useCallback(() => ({
    isTracking,
    hasError: !!trackingError,
    error: trackingError,
    queueSize: locationQueueRef.current.length,
    lastLocation,
    connectionStatus,
  }), [isTracking, trackingError, lastLocation, connectionStatus]);

  // Manual sync queue
  const syncNow = useCallback(async () => {
    if (locationQueueRef.current.length === 0) return;
    console.log('Manual sync requested');
    await processQueue();
  }, [processQueue]);

  // Clear queue
  const clearQueue = useCallback(() => {
    locationQueueRef.current = [];
    console.log('Location queue cleared');
  }, []);

  // Update rider status
  const updateRiderStatus = useCallback(async (newStatus: typeof status) => {
    if (!userId) return;
    
    // Update notification text based on status
    if (isTracking) {
      await BackgroundGeolocation.configure({
        notificationText: newStatus === 'busy' 
          ? 'Actively tracking your delivery route' 
          : 'Tracking your location for deliveries',
      });
    }
    
    // Send status update with last known location
    if (lastLocation) {
      await sendLocation(lastLocation.lat, lastLocation.lng);
    }
  }, [userId, isTracking, lastLocation, sendLocation]);

  // Start/stop based on enabled prop
  useEffect(() => {
    if (enabled && userId && !isTracking) {
      startTracking();
    } else if (!enabled && isTracking) {
      stopTracking();
    }
    
    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, [enabled, userId, startTracking, stopTracking, isTracking]);

  // Setup network listener
  useEffect(() => {
    const cleanup = setupNetworkListener();
    return cleanup;
  }, [setupNetworkListener]);

  // Periodic queue processing (every 30 seconds if online)
  useEffect(() => {
    if (!syncOnNetworkChange) return;
    
    const intervalId = setInterval(() => {
      if (navigator.onLine && locationQueueRef.current.length > 0) {
        processQueue();
      }
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [syncOnNetworkChange, processQueue]);

  // Log tracking stats periodically
  useEffect(() => {
    if (!isTracking) return;
    
    const statsInterval = setInterval(() => {
      console.log('Tracking stats:', {
        queueSize: locationQueueRef.current.length,
        lastLocation: lastLocation ? new Date(lastLocation.time).toISOString() : null,
        connectionStatus,
      });
    }, 60000); // Every minute
    
    return () => clearInterval(statsInterval);
  }, [isTracking, lastLocation, connectionStatus]);

  return {
    isTracking,
    trackingError,
    lastLocation,
    queueSize: locationQueueRef.current.length,
    connectionStatus,
    syncNow,
    clearQueue,
    updateRiderStatus,
    getTrackingStatus,
  };
        }
