// src/app/components/hooks/useBackgroundTracking.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRealtimeLocation } from './useRealtimeLocation';

// Dynamic import for Capacitor plugin
let BackgroundGeolocation: any = null;
let isCapacitor = false;

// Only load Capacitor plugin on client side and in Capacitor environment
if (typeof window !== 'undefined' && (window as any).Capacitor) {
  isCapacitor = true;
  try {
    // Dynamic require to avoid build issues on Vercel
    const plugin = require('@capacitor-community/background-geolocation');
    BackgroundGeolocation = plugin.BackgroundGeolocation;
    console.log('BackgroundGeolocation plugin loaded successfully');
  } catch (error) {
    console.error('Failed to load BackgroundGeolocation plugin:', error);
    isCapacitor = false;
  }
}

interface TrackingConfig {
  enabled: boolean;
  userId: string | null;
  status: 'available' | 'busy' | 'inactive' | 'offline';
  distanceFilter?: number;
  interval?: number;
  fastestInterval?: number;
  accuracy?: number;
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
    
    if (locationQueueRef.current.length > 100) {
      locationQueueRef.current = locationQueueRef.current.slice(-100);
    }
    
    console.log(`Location queued. Queue size: ${locationQueueRef.current.length}`);
  }, []);

  // Send location with retry logic
  const sendLocation = useCallback(async (latitude: number, longitude: number) => {
    if (!userId) return false;
    
    if (!navigator.onLine) {
      queueLocation(latitude, longitude);
      return false;
    }
    
    try {
      await updateLocation(userId, latitude, longitude, status);
      setLastLocation({ lat: latitude, lng: longitude, time: Date.now() });
      return true;
    } catch (error: any) {
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

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
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

  const handleLocationUpdate = useCallback(async (location: any) => {
    if (!location?.latitude || !location?.longitude) return;
    
    if (batteryOptimized && lastLocation) {
      const distance = calculateDistance(
        lastLocation.lat,
        lastLocation.lng,
        location.latitude,
        location.longitude
      );
      
      if (distance < distanceFilter) {
        return;
      }
    }
    
    await sendLocation(location.latitude, location.longitude);
  }, [batteryOptimized, lastLocation, distanceFilter, sendLocation]);

  // Start background tracking (only in Capacitor environment)
  const startTracking = useCallback(async () => {
    if (!userId || !enabled || !isCapacitor || !BackgroundGeolocation) {
      console.log('Background tracking not available in this environment');
      return;
    }
    
    try {
      setTrackingError(null);
      
      const permStatus = await BackgroundGeolocation.requestPermissions();
      if (permStatus.location !== 'granted') {
        throw new Error('Location permission not granted');
      }
      
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
        stopOnStillActivity: batteryOptimized,
        maxLocations: 1000,
        autoSync: true,
        syncInterval: 15,
      });
      
      const watcherId = await BackgroundGeolocation.watchPosition(
        handleLocationUpdate,
        (error: any) => {
          console.error('Watch position error:', error);
          setTrackingError(error.message || 'Location tracking error');
        }
      );
      
      watcherIdRef.current = watcherId;
      await BackgroundGeolocation.start();
      setIsTracking(true);
      console.log('Background tracking started successfully');
      
      await processQueue();
      
    } catch (error: any) {
      console.error('Failed to start background tracking:', error);
      setTrackingError(error.message || 'Failed to start tracking');
      setIsTracking(false);
    }
  }, [userId, enabled, accuracy, batteryOptimized, distanceFilter, interval, fastestInterval, status, handleLocationUpdate, processQueue]);

  const stopTracking = useCallback(async () => {
    if (!isCapacitor || !BackgroundGeolocation) return;
    
    try {
      if (watcherIdRef.current) {
        await BackgroundGeolocation.removeWatcher({ id: watcherIdRef.current });
        watcherIdRef.current = null;
      }
      
      await BackgroundGeolocation.stop();
      setIsTracking(false);
      console.log('Background tracking stopped');
      
      retryTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      retryTimeoutsRef.current = [];
      
      if (locationQueueRef.current.length > 0) {
        console.log(`Flushing ${locationQueueRef.current.length} queued locations before stop`);
        await processQueue();
      }
      
    } catch (error) {
      console.error('Failed to stop background tracking:', error);
    }
  }, [processQueue]);

  const getTrackingStatus = useCallback(() => ({
    isTracking,
    hasError: !!trackingError,
    error: trackingError,
    queueSize: locationQueueRef.current.length,
    lastLocation,
    connectionStatus,
    isCapacitor,
  }), [isTracking, trackingError, lastLocation, connectionStatus]);

  const syncNow = useCallback(async () => {
    if (locationQueueRef.current.length === 0) return;
    console.log('Manual sync requested');
    await processQueue();
  }, [processQueue]);

  const clearQueue = useCallback(() => {
    locationQueueRef.current = [];
    console.log('Location queue cleared');
  }, []);

  const updateRiderStatus = useCallback(async (newStatus: typeof status) => {
    if (!userId) return;
    
    if (isTracking && isCapacitor && BackgroundGeolocation) {
      await BackgroundGeolocation.configure({
        notificationText: newStatus === 'busy' 
          ? 'Actively tracking your delivery route' 
          : 'Tracking your location for deliveries',
      });
    }
    
    if (lastLocation) {
      await sendLocation(lastLocation.lat, lastLocation.lng);
    }
  }, [userId, isTracking, lastLocation, sendLocation]);

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

  useEffect(() => {
    if (!syncOnNetworkChange) return;
    
    const handleOnline = () => {
      console.log('Network online, processing queued locations');
      processQueue();
    };
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncOnNetworkChange, processQueue]);

  useEffect(() => {
    if (!syncOnNetworkChange) return;
    
    const intervalId = setInterval(() => {
      if (navigator.onLine && locationQueueRef.current.length > 0) {
        processQueue();
      }
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [syncOnNetworkChange, processQueue]);

  return {
    isTracking,
    trackingError,
    lastLocation,
    queueSize: locationQueueRef.current.length,
    connectionStatus,
    isCapacitor,
    syncNow,
    clearQueue,
    updateRiderStatus,
    getTrackingStatus,
  };
      }
