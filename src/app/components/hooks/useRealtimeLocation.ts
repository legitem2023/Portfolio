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

interface UseRealtimeLocationReturn {
  locations: Map<string, LocationData>;
  getLocation: (userId: string) => LocationData | undefined;
  getAllLocations: () => LocationData[];
  getCurrentUserLocation: () => LocationData | undefined;
  getOtherRidersLocations: () => LocationData[];
  connectionStatus: string;
  addLocation: (userId: string, latitude: number, longitude: number, status?: LocationData['status']) => Promise<void>;
  updateLocation: (userId: string, latitude: number, longitude: number, status?: LocationData['status']) => Promise<void>;
}

export const useRealtimeLocation = (currentUserId?: string): UseRealtimeLocationReturn => {
  const [locations, setLocations] = useState<Map<string, LocationData>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const pusherClientRef = useRef<Pusher | null>(null);
  const privateChannelRef = useRef<any>(null);

  // Function to ADD a new location - userId passed as parameter
  const addLocation = useCallback(async (
    userId: string,
    latitude: number, 
    longitude: number, 
    status: LocationData['status'] = 'available'
  ) => {
    if (!userId) {
      console.error('userId is required for addLocation');
      return;
    }

    try {
      const response = await fetch('/api/location/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userID: userId,
          latitude,
          longitude,
          status,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add location');
      }

      const data = await response.json();
      console.log('Location added successfully for user:', userId, data);
    } catch (error) {
      console.error('Error adding location:', error);
    }
  }, []);

  // Function to UPDATE an existing location - userId passed as parameter
  const updateLocation = useCallback(async (
    userId: string,
    latitude: number, 
    longitude: number, 
    status: LocationData['status'] = 'available'
  ) => {
    if (!userId) {
      console.error('userId is required for updateLocation');
      return;
    }

    try {
      const response = await fetch('/api/location/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userID: userId,
          latitude,
          longitude,
          status,
          lastUpdated: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update location');
      }

      const data = await response.json();
      console.log('Location updated successfully for user:', userId, data);
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }, []);

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
      authEndpoint: '/api/pusher/auth',
    });
    pusherClientRef.current = pusherClient;

    pusherClient.connection.bind('state_change', (states: any) => {
      setConnectionStatus(states.current);
    });

    // Subscribe to private channel for the current user
    if (currentUserId) {
      const privateChannel = pusherClient.subscribe(`private-user-${currentUserId}`);
      privateChannelRef.current = privateChannel;
      
      privateChannel.bind('user-location-update', (data: any) => {
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
    }

    // Subscribe to admin channel for overall updates
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
      if (privateChannelRef.current) {
        privateChannelRef.current.unbind_all();
        privateChannelRef.current.unsubscribe();
      }
      adminChannel.unbind_all();
      adminChannel.unsubscribe();
      if (pusherClientRef.current) {
        pusherClientRef.current.disconnect();
      }
    };
  }, [currentUserId]);

  const getLocation = useCallback((userIdToGet: string): LocationData | undefined => {
    return locations.get(userIdToGet);
  }, [locations]);

  const getAllLocations = useCallback((): LocationData[] => {
    return Array.from(locations.values());
  }, [locations]);

  const getCurrentUserLocation = useCallback((): LocationData | undefined => {
    if (!currentUserId) return undefined;
    return locations.get(currentUserId);
  }, [locations, currentUserId]);

  const getOtherRidersLocations = useCallback((): LocationData[] => {
    if (!currentUserId) return getAllLocations();
    return Array.from(locations.values()).filter(loc => loc.userID !== currentUserId);
  }, [locations, currentUserId, getAllLocations]);

  return { 
    locations, 
    getLocation, 
    getAllLocations, 
    getCurrentUserLocation,
    getOtherRidersLocations,
    connectionStatus,
    addLocation,
    updateLocation
  };
};
