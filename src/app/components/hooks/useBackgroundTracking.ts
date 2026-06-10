// src/app/components/hooks/useBackgroundTracking.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRealtimeLocation } from './useRealtimeLocation';

// Dynamic import for Capacitor plugin
let BackgroundGeolocation: any = null;
let isCapacitor = false;
let isWebEnvironment = false;

// Only load Capacitor plugin on client side and in Capacitor environment
if (typeof window !== 'undefined') {
  // Check for Capacitor
  if ((window as any).Capacitor) {
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
  
  // Check for web geolocation
  if ('geolocation' in navigator) {
    isWebEnvironment = true;
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
  maxQueueSize?: number;
}

interface LocationQueueItem {
  latitude: number;
  longitude: number;
  timestamp: number;
  retries: number;
}

interface CapacitorLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

interface TrackingStatus {
  isTracking: boolean;
  hasError: boolean;
  error: string | null;
  queueSize: number;
  lastLocation: { lat: number; lng: number; time: number } | null;
  connectionStatus: string;
  isCapacitor: boolean;
  isWeb: boolean;
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
  maxQueueSize = 100,
}: TrackingConfig) {
  const [isTracking, setIsTracking] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [lastLocation, setLastLocation] = useState<{ lat: number; lng: number; time: number } | null>(null);
  
  const watcherIdRef = useRef<string | number | null>(null);
  const locationQueueRef = useRef<LocationQueueItem[]>([]);
  const isSyncingRef = useRef<boolean>(false);
  const retryTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const lastWebUpdateRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  
  const { updateLocation, addLocation, connectionStatus } = useRealtimeLocation(userId || undefined);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
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
  }, []);

  // Process queued locations when network is available
  const processQueue = useCallback(async () => {
    // Prevent concurrent processing
    if (isSyncingRef.current || locationQueueRef.current.length === 0 || !userId) {
      return;
    }
    
    if (!isMountedRef.current) return;
    
    isSyncingRef.current = true;
    
    try {
      // Take a snapshot of the queue
      const queueCopy = [...locationQueueRef.current];
      locationQueueRef.current = [];
      
      // Process sequentially to avoid overwhelming the server
      for (const item of queueCopy) {
        if (!isMountedRef.current) break;
        
        let success = false;
        
        for (let attempt = 0; attempt < retryCount; attempt++) {
          try {
            await updateLocation(userId, item.latitude, item.longitude, status);
            success = true;
            console.log(`✅ LOCATION UPDATE (from queue): User ${userId} at [${item.latitude}, ${item.longitude}] - Status: ${status}`);
            console.log(`Queue item sent successfully (attempt ${attempt + 1})`);
            break;
          } catch (error: any) {
            console.error(`Queue attempt ${attempt + 1} failed:`, error);
            
            // If location doesn't exist, try to add it
            if (error?.message?.includes('not found') || error?.status === 404) {
              try {
                await addLocation(userId, item.latitude, item.longitude, status);
                console.log(`➕ LOCATION ADD (from queue): User ${userId} at [${item.latitude}, ${item.longitude}] - Status: ${status}`);
                success = true;
                break;
              } catch (addError) {
                console.error('Failed to add location during queue processing:', addError);
              }
            }
            
            // Wait before retry
            if (attempt < retryCount - 1) {
              await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
          }
        }
        
        // Re-queue if still failed
        if (!success && isMountedRef.current) {
          if (item.retries < 5) { // Max 5 retries total
            locationQueueRef.current.push({
              ...item,
              retries: (item.retries || 0) + 1
            });
            console.log(`Item re-queued (retry ${item.retries + 1}/5)`);
          } else {
            console.error('Queue item dropped after max retries');
          }
        }
      }
      
      // Update queue size in UI if needed
      if (isMountedRef.current && locationQueueRef.current.length > 0) {
        console.log(`Remaining queue size: ${locationQueueRef.current.length}`);
      }
    } finally {
      isSyncingRef.current = false;
    }
  }, [userId, status, updateLocation, addLocation, retryCount, retryDelay]);

  // Queue location when offline
  const queueLocation = useCallback((latitude: number, longitude: number) => {
    if (!isMountedRef.current) return;
    
    locationQueueRef.current.push({
      latitude,
      longitude,
      timestamp: Date.now(),
      retries: 0,
    });
    
    // Limit queue size
    if (locationQueueRef.current.length > maxQueueSize) {
      const removed = locationQueueRef.current.splice(0, locationQueueRef.current.length - maxQueueSize);
      console.log(`Removed ${removed.length} old queue items to maintain limit`);
    }
    
    console.log(`Location queued. Queue size: ${locationQueueRef.current.length}`);
  }, [maxQueueSize]);

  // Send location with retry logic
  const sendLocation = useCallback(async (latitude: number, longitude: number): Promise<boolean> => {
    if (!userId || !isMountedRef.current) return false;
    
    // Check if we're offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      queueLocation(latitude, longitude);
      return false;
    }
    
    try {
      await updateLocation(userId, latitude, longitude, status);
      console.log(`🟢 LOCATION UPDATE: User ${userId} at [${latitude}, ${longitude}] - Status: ${status} - Time: ${new Date().toISOString()}`);
      if (isMountedRef.current) {
        setLastLocation({ lat: latitude, lng: longitude, time: Date.now() });
      }
      return true;
    } catch (error: any) {
      // If location doesn't exist, try to add it
      if (error?.message?.includes('not found') || error?.status === 404) {
        try {
          await addLocation(userId, latitude, longitude, status);
          console.log(`🔵 LOCATION ADD: User ${userId} at [${latitude}, ${longitude}] - Status: ${status} - Time: ${new Date().toISOString()}`);
          if (isMountedRef.current) {
            setLastLocation({ lat: latitude, lng: longitude, time: Date.now() });
          }
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

  // Handle location updates with battery optimization
  const handleLocationUpdate = useCallback(async (location: CapacitorLocation) => {
    if (!location?.latitude || !location?.longitude) return;
    if (!isMountedRef.current) return;
    
    // Battery optimization - check distance from last location
    if (batteryOptimized && lastLocation) {
      const distance = calculateDistance(
        lastLocation.lat,
        lastLocation.lng,
        location.latitude,
        location.longitude
      );
      
      if (distance < distanceFilter) {
        console.log(`⚠️ Location update skipped - movement insufficient: ${distance.toFixed(2)}m < ${distanceFilter}m threshold`);
        return; // Not enough movement, skip update
      }
    }
    
    await sendLocation(location.latitude, location.longitude);
  }, [batteryOptimized, lastLocation, distanceFilter, sendLocation, calculateDistance]);

  // Start web tracking (browser fallback)
  const startWebTracking = useCallback(async () => {
    if (!isWebEnvironment || !userId || !enabled) {
      console.log('Web tracking not available');
      return;
    }
    
    try {
      setTrackingError(null);
      
      // Check if we already have permission
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      if (permission.state === 'denied') {
        throw new Error('Geolocation permission denied');
      }
      
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          if (!isMountedRef.current) return;
          
          const now = Date.now();
          
          // Throttle updates based on interval
          if (batteryOptimized && lastWebUpdateRef.current) {
            const timeDiff = now - lastWebUpdateRef.current;
            if (timeDiff < interval) return;
            
            // Check distance if we have last location
            if (lastLocation && batteryOptimized) {
              const distance = calculateDistance(
                lastLocation.lat,
                lastLocation.lng,
                position.coords.latitude,
                position.coords.longitude
              );
              if (distance < distanceFilter) return;
            }
          }
          
          lastWebUpdateRef.current = now;
          
          await handleLocationUpdate({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
        },
        (error) => {
          console.error('Web geolocation error:', error);
          if (isMountedRef.current) {
            let errorMessage = 'Location tracking error: ';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage += 'Permission denied';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage += 'Position unavailable';
                break;
              case error.TIMEOUT:
                errorMessage += 'Timeout';
                break;
              default:
                errorMessage += error.message;
            }
            setTrackingError(errorMessage);
          }
        },
        {
          enableHighAccuracy: accuracy > 5,
          maximumAge: interval,
          timeout: 30000
        }
      );
      
      watcherIdRef.current = watchId;
      setIsTracking(true);
      console.log('Web tracking started successfully');
      
      // Process any queued locations
      await processQueue();
      
    } catch (error: any) {
      console.error('Failed to start web tracking:', error);
      if (isMountedRef.current) {
        setTrackingError(error.message || 'Failed to start tracking');
        setIsTracking(false);
      }
    }
  }, [userId, enabled, accuracy, batteryOptimized, interval, distanceFilter, lastLocation, handleLocationUpdate, processQueue, calculateDistance]);

  // Start Capacitor background tracking
  const startCapacitorTracking = useCallback(async () => {
    if (!userId || !enabled || !isCapacitor || !BackgroundGeolocation) {
      console.log('Capacitor background tracking not available');
      return;
    }
    
    try {
      setTrackingError(null);
      
      // Request permissions
      const permStatus = await BackgroundGeolocation.requestPermissions();
      if (permStatus.location !== 'granted') {
        throw new Error('Location permission not granted');
      }
      
      // Configure the plugin
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
      
      // Start watching position
      const watcherId = await BackgroundGeolocation.watchPosition(
        (location: CapacitorLocation) => {
          if (isMountedRef.current) {
            handleLocationUpdate(location);
          }
        },
        (error: any) => {
          console.error('Watch position error:', error);
          if (isMountedRef.current) {
            setTrackingError(error.message || 'Location tracking error');
          }
        }
      );
      
      watcherIdRef.current = watcherId;
      await BackgroundGeolocation.start();
      setIsTracking(true);
      console.log('Capacitor background tracking started successfully');
      
      // Process any queued locations
      await processQueue();
      
    } catch (error: any) {
      console.error('Failed to start Capacitor tracking:', error);
      if (isMountedRef.current) {
        setTrackingError(error.message || 'Failed to start tracking');
        setIsTracking(false);
      }
    }
  }, [userId, enabled, accuracy, batteryOptimized, distanceFilter, interval, fastestInterval, status, handleLocationUpdate, processQueue]);

  // Start tracking (environment-aware)
  const startTracking = useCallback(async () => {
    if (!userId || !enabled) {
      console.log('Tracking not started: missing userId or disabled');
      return;
    }
    
    if (isCapacitor && BackgroundGeolocation) {
      await startCapacitorTracking();
    } else if (isWebEnvironment) {
      await startWebTracking();
    } else {
      setTrackingError('Geolocation not supported in this environment');
    }
  }, [userId, enabled, startCapacitorTracking, startWebTracking]);

  // Stop tracking
  const stopTracking = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      // Stop Capacitor tracking
      if (isCapacitor && BackgroundGeolocation && watcherIdRef.current) {
        if (typeof watcherIdRef.current === 'string') {
          await BackgroundGeolocation.removeWatcher({ id: watcherIdRef.current });
        }
        await BackgroundGeolocation.stop();
      }
      
      // Stop web tracking
      if (isWebEnvironment && watcherIdRef.current !== null) {
        navigator.geolocation.clearWatch(watcherIdRef.current as number);
      }
      
      watcherIdRef.current = null;
      setIsTracking(false);
      console.log('Tracking stopped');
      
      // Clear all pending retry timeouts
      retryTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      retryTimeoutsRef.current = [];
      
      // Flush queue before stopping
      if (locationQueueRef.current.length > 0) {
        console.log(`Flushing ${locationQueueRef.current.length} queued locations before stop`);
        await processQueue();
      }
      
    } catch (error) {
      console.error('Failed to stop tracking:', error);
    }
  }, [processQueue]);

  // Get current tracking status
  const getTrackingStatus = useCallback((): TrackingStatus => ({
    isTracking,
    hasError: !!trackingError,
    error: trackingError,
    queueSize: locationQueueRef.current.length,
    lastLocation,
    connectionStatus,
    isCapacitor,
    isWeb: isWebEnvironment && !isCapacitor,
  }), [isTracking, trackingError, lastLocation, connectionStatus]);

  // Manually sync queued locations
  const syncNow = useCallback(async () => {
    if (locationQueueRef.current.length === 0) {
      console.log('No queued locations to sync');
      return;
    }
    console.log('Manual sync requested');
    await processQueue();
  }, [processQueue]);

  // Clear the queue
  const clearQueue = useCallback(() => {
    locationQueueRef.current = [];
    console.log('Location queue cleared');
  }, []);

  // Update rider status
  const updateRiderStatus = useCallback(async (newStatus: typeof status) => {
    if (!userId || !isMountedRef.current) return;
    
    // Update Capacitor notification if tracking
    if (isTracking && isCapacitor && BackgroundGeolocation) {
      try {
        await BackgroundGeolocation.configure({
          notificationText: newStatus === 'busy' 
            ? 'Actively tracking your delivery route' 
            : 'Tracking your location for deliveries',
        });
      } catch (error) {
        console.error('Failed to update notification:', error);
      }
    }
    
    // Send current location with new status
    if (lastLocation) {
      await sendLocation(lastLocation.lat, lastLocation.lng);
    }
  }, [userId, isTracking, lastLocation, sendLocation]);

  // Auto-start/stop tracking based on enabled and userId
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

  // Network change listener
  useEffect(() => {
    if (!syncOnNetworkChange) return;
    
    const handleOnline = () => {
      console.log('Network online, processing queued locations');
      if (isMountedRef.current) {
        processQueue();
      }
    };
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncOnNetworkChange, processQueue]);

  // Periodic queue processing (every 30 seconds)
  useEffect(() => {
    if (!syncOnNetworkChange) return;
    
    const intervalId = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine && locationQueueRef.current.length > 0) {
        if (isMountedRef.current) {
          processQueue();
        }
      }
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [syncOnNetworkChange, processQueue]);

  // Status change listener
  useEffect(() => {
    if (isTracking && userId && lastLocation) {
      // Send location update with new status
      sendLocation(lastLocation.lat, lastLocation.lng);
    }
  }, [status]); // Re-run when status changes

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      // Clear all timeouts
      retryTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      retryTimeoutsRef.current = [];
    };
  }, []);

  // Return the public API
  return {
    isTracking,
    trackingError,
    lastLocation,
    queueSize: locationQueueRef.current.length,
    connectionStatus,
    isCapacitor,
    isWeb: isWebEnvironment && !isCapacitor,
    syncNow,
    clearQueue,
    updateRiderStatus,
    getTrackingStatus,
    startTracking, // Manual start
    stopTracking,  // Manual stop
  };
      }
