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

interface UseRealtimeLocationReturn {
  locations: Map<string, LocationData>;
  getLocation: (userId: string) => LocationData | undefined;
  getAllLocations: () => LocationData[];
  getCurrentUserLocation: () => LocationData | undefined;
  getOtherRidersLocations: () => LocationData[];
  connectionStatus: string;
}

export const useRealtimeLocation = (userId?: string): UseRealtimeLocationReturn => {
  const [locations, setLocations] = useState<Map<string, LocationData>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');

  useEffect(() => {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    
    if (!pusherKey || !pusherCluster) {
      console.error('Pusher configuration missing!');
      return;
    }

    const pusherClient = new Pusher(pusherKey, {
      cluster: pusherCluster,
      forceTLS: true,
    });

    pusherClient.connection.bind('state_change', (states: any) => {
      setConnectionStatus(states.current);
    });

    const adminChannel = pusherClient.subscribe('admin-locations');
    
    adminChannel.bind('user-location-update', (data: any) => {
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
        return newMap;
      });
    });

    return () => {
      adminChannel.unbind_all();
      adminChannel.unsubscribe();
      pusherClient.disconnect();
    };
  }, []);

  const getLocation = useCallback((userIdToGet: string): LocationData | undefined => {
    return locations.get(userIdToGet);
  }, [locations]);

  const getAllLocations = useCallback((): LocationData[] => {
    return Array.from(locations.values());
  }, [locations]);

  const getCurrentUserLocation = useCallback((): LocationData | undefined => {
    if (!userId) return undefined;
    return locations.get(userId);
  }, [locations, userId]);

  const getOtherRidersLocations = useCallback((): LocationData[] => {
    if (!userId) return getAllLocations();
    return Array.from(locations.values()).filter(loc => loc.userID !== userId);
  }, [locations, userId, getAllLocations]);

  return { 
    locations, 
    getLocation, 
    getAllLocations, 
    getCurrentUserLocation,
    getOtherRidersLocations,
    connectionStatus
  };
};
