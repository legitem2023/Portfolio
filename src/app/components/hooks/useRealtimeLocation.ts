import { useEffect, useState, useCallback } from 'react';
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
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    
    if (!pusherKey || !pusherCluster) {
      const errorMsg = 'Pusher configuration missing!';
      console.error(errorMsg);
      setLastError(errorMsg);
      return;
    }

    const pusherClient = new Pusher(pusherKey, {
      cluster: pusherCluster,
      authEndpoint: '/api/pusher/auth',
      forceTLS: true,
    });

    pusherClient.connection.bind('state_change', (states: PusherConnectionState) => {
      console.log(`Pusher state: ${states.current}`);
      setConnectionStatus(states.current);
    });

    pusherClient.connection.bind('connected', () => {
      console.log('✅ Pusher connected successfully!');
    });

    pusherClient.connection.bind('error', (error: PusherError) => {
      console.error('Pusher error:', error);
      setLastError(error.message || 'Unknown connection error');
    });

    // Subscribe to admin channel
    const adminChannel = pusherClient.subscribe('admin-locations');
    
    adminChannel.bind('pusher:subscription_succeeded', () => {
      console.log('✅ Subscribed to admin-locations channel');
    });

    adminChannel.bind('pusher:subscription_error', (error: PusherError) => {
      console.error('Failed to subscribe to admin-locations:', error);
      setLastError(`Failed to subscribe: ${error.message || 'Unknown error'}`);
    });

    // Handle location updates
    adminChannel.bind('user-location-update', (data: any) => {
      console.log('📍 Received location update:', data);
      
      const locationData: LocationData = {
        userID: data.userID,
        latitude: data.latitude,
        longitude: data.longitude,
        status: data.status || 'available',
        timestamp: data.lastUpdated || data.timestamp || new Date().toISOString(),
        lastUpdated: data.lastUpdated
      };
      
      setLocations(prev => {
        const newMap = new Map(prev);
        newMap.set(data.userID, locationData);
        console.log(`📍 Locations updated: ${newMap.size} total riders`);
        return newMap;
      });
    });

    // Subscribe to user channel if userId provided
    let userChannel: any = null;
    
    if (userId) {
      const userChannelName = `private-user-${userId}`;
      console.log(`Subscribing to ${userChannelName}...`);
      userChannel = pusherClient.subscribe(userChannelName);
      
      userChannel.bind('pusher:subscription_succeeded', () => {
        console.log(`✅ Subscribed to ${userChannelName}`);
      });

      userChannel.bind('pusher:subscription_error', (error: PusherError) => {
        console.error(`Failed to subscribe to ${userChannelName}:`, error);
        setLastError(`Failed to subscribe: ${error.message || 'Unknown error'}`);
      });

      userChannel.bind('location-updated', (data: any) => {
        console.log(`📍 Received personal location update:`, data);
        
        const locationData: LocationData = {
          userID: data.userID,
          latitude: data.latitude,
          longitude: data.longitude,
          status: data.status || 'available',
          timestamp: data.timestamp || new Date().toISOString(),
          lastUpdated: data.lastUpdated
        };
        
        setLocations(prev => {
          const newMap = new Map(prev);
          newMap.set(data.userID, locationData);
          return newMap;
        });
      });
    }

    // Debug: Log all events on admin channel
    adminChannel.bind_global((eventName: string, data: unknown) => {
      if (eventName !== 'pusher:subscription_succeeded' && eventName !== 'pusher:subscription_count') {
        console.log(`Admin channel event: "${eventName}"`, data);
      }
    });

    return () => {
      if (userChannel) {
        userChannel.unbind_all();
        userChannel.unsubscribe();
      }
      
      adminChannel.unbind_all();
      adminChannel.unsubscribe();
      pusherClient.disconnect();
    };
  }, [userId]);

  const getLocation = useCallback((userIdToGet: string): LocationData | undefined => {
    return locations.get(userIdToGet);
  }, [locations]);

  const getAllLocations = useCallback((): LocationData[] => {
    return Array.from(locations.values());
  }, [locations]);

  return { 
    locations, 
    getLocation, 
    getAllLocations, 
    connectionStatus,
    lastError
  };
};
