import { useEffect, useState, useCallback, useRef } from 'react';
import Pusher from 'pusher-js';

interface LocationData {
  userID: string;
  latitude: number;
  longitude: number;
  status: 'available' | 'busy' | 'inactive' | 'offline';
  timestamp: string;
  lastUpdated?: string;
}

interface PusherConnectionState {
  previous: string;
  current: string;
}

interface PusherError {
  message?: string;
  error?: unknown;
}

interface UseRealtimeLocationReturn {
  locations: Map<string, LocationData>;
  getLocation: (userId: string) => LocationData | undefined;
  getAllLocations: () => LocationData[];
  connectionStatus: string;
  lastError: string | null;
}

export const useRealtimeLocation = (userId?: string): UseRealtimeLocationReturn => {
  const [locations, setLocations] = useState<Map<string, LocationData>>(new Map());
  const [pusher, setPusher] = useState<Pusher | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [lastError, setLastError] = useState<string | null>(null);
  const eventCountRef = useRef<number>(0);

  useEffect(() => {
    console.log('🔵 useRealtimeLocation hook initialized with userId:', userId);
    
    // Log environment variables
    console.log('📋 Pusher Config:', {
      hasKey: !!process.env.NEXT_PUBLIC_PUSHER_KEY,
      keyPrefix: process.env.NEXT_PUBLIC_PUSHER_KEY?.substring(0, 8),
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      hasAuthEndpoint: !!process.env.NEXT_PUBLIC_PUSHER_AUTH_ENDPOINT,
      nodeEnv: process.env.NODE_ENV
    });

    // Check if Pusher key is available
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    
    if (!pusherKey || !pusherCluster) {
      const errorMsg = '❌ Pusher configuration missing! Please check your environment variables.';
      console.error(errorMsg);
      setLastError(errorMsg);
      return;
    }

    const pusherClient = new Pusher(pusherKey, {
      cluster: pusherCluster,
      authEndpoint: '/api/pusher/auth',
      enableStats: true,
      forceTLS: true,
    });

    setPusher(pusherClient);

    // Monitor connection state
    pusherClient.connection.bind('state_change', (states: PusherConnectionState) => {
      console.log(`📡 Pusher connection state changed: ${states.previous} -> ${states.current}`);
      setConnectionStatus(states.current);
    });

    pusherClient.connection.bind('connected', () => {
      console.log('✅ Pusher connected successfully!');
      console.log('📡 Connection ID:', pusherClient.connection.socket_id);
      setLastError(null);
    });

    pusherClient.connection.bind('error', (error: PusherError) => {
      console.error('❌ Pusher connection error:', error);
      setLastError(error.message || 'Unknown connection error');
    });

    // Subscribe to admin channel for all location updates
    console.log('📡 Subscribing to admin-locations channel...');
    const adminChannel = pusherClient.subscribe('admin-locations');
    
    adminChannel.bind('pusher:subscription_succeeded', () => {
      console.log('✅ Successfully subscribed to admin-locations channel');
      console.log('📊 Channel name:', adminChannel.name);
      console.log('👂 Listening for event: user-location-update');
    });

    adminChannel.bind('pusher:subscription_error', (error: PusherError) => {
      console.error('❌ Failed to subscribe to admin-locations channel:', error);
      setLastError(`Failed to subscribe to admin channel: ${error.message || 'Unknown error'}`);
    });

    // Bind to the location update event from admin channel
    // Your backend sends: user-location-update with data containing lastUpdated field
    adminChannel.bind('user-location-update', (data: any) => {
      eventCountRef.current++;
      console.log(`📍📍📍 ADMIN LOCATION UPDATE #${eventCountRef.current} RECEIVED! 📍📍📍`);
      console.log('📦 Full data received:', data);
      
      // Transform the data to match LocationData interface
      const locationData: LocationData = {
        userID: data.userID,
        latitude: data.latitude,
        longitude: data.longitude,
        status: data.status || 'available',
        timestamp: data.lastUpdated || data.timestamp || new Date().toISOString(),
        lastUpdated: data.lastUpdated
      };
      
      console.log('👤 User ID:', locationData.userID);
      console.log('📍 Coordinates:', locationData.latitude, locationData.longitude);
      console.log('💚 Status:', locationData.status);
      console.log('⏰ Timestamp:', locationData.timestamp);
      
      setLocations(prev => {
        console.log('🔄 Updating locations map, current size:', prev.size);
        const newMap = new Map(prev);
        newMap.set(data.userID, locationData);
        console.log('📊 New map size:', newMap.size);
        console.log('🗺️ All locations:', Array.from(newMap.values()));
        return newMap;
      });
    });

    // Log all events for debugging
    adminChannel.bind_global((eventName: string, data: unknown) => {
      if (eventName !== 'pusher:subscription_succeeded' && eventName !== 'pusher:subscription_count') {
        console.log(`🌍 Admin channel event: "${eventName}"`, data);
      }
    });

    // Subscribe to user-specific channel if userId provided
    // Your backend uses: user-${userID} (not private- prefix)
    let userChannel: any = null;
    
    if (userId) {
      const userChannelName = `user-${userId}`;
      console.log(`📡 Subscribing to ${userChannelName}...`);
      userChannel = pusherClient.subscribe(userChannelName);
      
      userChannel.bind('pusher:subscription_succeeded', () => {
        console.log(`✅ Successfully subscribed to ${userChannelName}`);
        console.log(`👂 Listening for event: location-updated`);
      });

      userChannel.bind('pusher:subscription_error', (error: PusherError) => {
        console.error(`❌ Failed to subscribe to ${userChannelName}:`, error);
        setLastError(`Failed to subscribe to user channel: ${error.message || 'Unknown error'}`);
      });

      // Bind to location-updated event from user channel
      userChannel.bind('location-updated', (data: any) => {
        eventCountRef.current++;
        console.log(`🎯🎯🎯 USER LOCATION UPDATE #${eventCountRef.current} for ${userId}! 🎯🎯🎯`);
        console.log('📦 Full data received:', data);
        
        // Transform the data to match LocationData interface
        const locationData: LocationData = {
          userID: data.userID,
          latitude: data.latitude,
          longitude: data.longitude,
          status: data.status || 'available',
          timestamp: data.timestamp || new Date().toISOString(),
          lastUpdated: data.lastUpdated
        };
        
        console.log('📍 Location data:', locationData);
        
        setLocations(prev => {
          console.log('🔄 Updating locations map, current size:', prev.size);
          const newMap = new Map(prev);
          newMap.set(data.userID, locationData);
          console.log('📊 New map size:', newMap.size);
          return newMap;
        });
      });

      // Log all events on user channel
      userChannel.bind_global((eventName: string, data: unknown) => {
        if (eventName !== 'pusher:subscription_succeeded' && eventName !== 'pusher:subscription_count') {
          console.log(`🌍 User channel event: "${eventName}"`, data);
        }
      });
    }

    // Periodic status check
    const interval = setInterval(() => {
      if (connectionStatus === 'connected') {
        console.log('📊 Status check:', {
          connectionStatus,
          locationsCount: locations.size,
          eventsReceived: eventCountRef.current,
        });
      }
    }, 30000);

    // Cleanup
    return () => {
      clearInterval(interval);
      console.log('🧹 Cleaning up...');
      console.log(`📊 Final stats - Events received: ${eventCountRef.current}`);
      
      if (userChannel) {
        console.log(`Cleaning up user channel...`);
        userChannel.unbind_all();
        userChannel.unsubscribe();
      }
      
      adminChannel.unbind_all();
      adminChannel.unsubscribe();
      pusherClient.disconnect();
      console.log('✅ Cleanup complete');
    };
  }, [userId]); // Remove locations from dependencies to avoid re-subscriptions

  const getLocation = useCallback((userIdToGet: string): LocationData | undefined => {
    const location = locations.get(userIdToGet);
    if (location) {
      console.log(`🔍 Getting location for ${userIdToGet}:`, location);
    }
    return location;
  }, [locations]);

  const getAllLocations = useCallback((): LocationData[] => {
    const allLocations = Array.from(locations.values());
    console.log(`📊 Getting all locations (${allLocations.length}):`, allLocations);
    return allLocations;
  }, [locations]);

  // Log when locations change
  useEffect(() => {
    if (locations.size > 0) {
      console.log(`📍 Locations updated! Total: ${locations.size}`);
      locations.forEach((location, userId) => {
        console.log(`  - ${userId}: (${location.latitude}, ${location.longitude}) [${location.status}]`);
      });
    }
  }, [locations]);

  return { 
    locations, 
    getLocation, 
    getAllLocations, 
    connectionStatus,
    lastError
  };
};
