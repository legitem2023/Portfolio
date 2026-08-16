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
  const adminChannelRef = useRef<any>(null);
  const isMountedRef = useRef<boolean>(true);

  // ✅ Set mounted flag
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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

  // ✅ FIXED: Safe Pusher subscription with proper cleanup
  useEffect(() => {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    
    if (!pusherKey || !pusherCluster) {
      console.error('Pusher configuration missing!');
      return;
    }

    let pusherClient: Pusher | null = null;
    let privateChannel: any = null;
    let adminChannel: any = null;

    try {
      pusherClient = new Pusher(pusherKey, {
        cluster: pusherCluster,
        forceTLS: true,
        authEndpoint: '/api/pusher/auth',
      });
      pusherClientRef.current = pusherClient;

      // Handle connection state
      pusherClient.connection.bind('state_change', (states: any) => {
        if (isMountedRef.current) {
          setConnectionStatus(states.current);
        }
      });

      // ✅ Subscribe to private channel for the current user
      if (currentUserId) {
        try {
          privateChannel = pusherClient.subscribe(`private-user-${currentUserId}`);
          privateChannelRef.current = privateChannel;
          
          privateChannel.bind('user-location-update', (data: any) => {
            if (!isMountedRef.current) return;
            
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
          
          console.log(`✅ Subscribed to private-user-${currentUserId}`);
        } catch (error) {
          console.error('Failed to subscribe to private channel:', error);
        }
      }

      // ✅ Subscribe to admin channel for overall updates
      try {
        adminChannel = pusherClient.subscribe('admin-locations');
        adminChannelRef.current = adminChannel;
        
        adminChannel.bind('user-location-update', (data: any) => {
          if (!isMountedRef.current) return;
          
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
        
        console.log('✅ Subscribed to admin-locations');
      } catch (error) {
        console.error('Failed to subscribe to admin channel:', error);
      }

    } catch (error) {
      console.error('Failed to initialize Pusher:', error);
    }

    // ✅ SAFE CLEANUP - This fixes the "Cannot read properties of null" error!
    return () => {
      isMountedRef.current = false;

      // ✅ Clean up private channel
      if (privateChannelRef.current) {
        try {
          privateChannelRef.current.unbind_all();
          console.log('✅ Unbound all private channel events');
        } catch (error) {
          console.debug('Private channel unbind error (can ignore):', error);
        }
        
        try {
          privateChannelRef.current.unsubscribe();
          console.log('✅ Unsubscribed from private channel');
        } catch (error) {
          console.debug('Private channel unsubscribe error (can ignore):', error);
        }
        privateChannelRef.current = null;
      }

      // ✅ Clean up admin channel
      if (adminChannelRef.current) {
        try {
          adminChannelRef.current.unbind_all();
          console.log('✅ Unbound all admin channel events');
        } catch (error) {
          console.debug('Admin channel unbind error (can ignore):', error);
        }
        
        try {
          adminChannelRef.current.unsubscribe();
          console.log('✅ Unsubscribed from admin channel');
        } catch (error) {
          console.debug('Admin channel unsubscribe error (can ignore):', error);
        }
        adminChannelRef.current = null;
      }

      // ✅ Disconnect Pusher client
      if (pusherClientRef.current) {
        try {
          pusherClientRef.current.disconnect();
          console.log('✅ Pusher client disconnected');
        } catch (error) {
          console.debug('Pusher disconnect error (can ignore):', error);
        }
        pusherClientRef.current = null;
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
