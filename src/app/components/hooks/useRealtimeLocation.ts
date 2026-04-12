import { useEffect, useState, useCallback } from 'react';
import Pusher from 'pusher-js';

interface LocationData {
  userID: string;
  latitude: number;
  longitude: number;
  status: 'available' | 'busy' | 'inactive' | 'offline';
  timestamp: string;
}

export const useRealtimeLocation = (userId?: string) => {
  const [locations, setLocations] = useState<Map<string, LocationData>>(new Map());
  const [pusher, setPusher] = useState<Pusher | null>(null);

  useEffect(() => {
    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
    });

    setPusher(pusherClient);

    // Subscribe to admin channel for all location updates
    const adminChannel = pusherClient.subscribe('admin-locations');
    
    adminChannel.bind('user-location-update', (data: LocationData) => {
      setLocations(prev => {
        const newMap = new Map(prev);
        newMap.set(data.userID, data);
        return newMap;
      });
    });

    // If specific user, also subscribe to their private channel
    if (userId) {
      const userChannel = pusherClient.subscribe(`user-${userId}`);
     console.log(userChannel,"channel");
      userChannel.bind('location-updated', (data: LocationData) => {
        setLocations(prev => {
          const newMap = new Map(prev);
          newMap.set(data.userID, data);
          return newMap;
        });
      });

      return () => {
        userChannel.unbind_all();
        userChannel.unsubscribe();
        adminChannel.unbind_all();
        adminChannel.unsubscribe();
        pusherClient.disconnect();
      };
    }

    return () => {
      adminChannel.unbind_all();
      adminChannel.unsubscribe();
      pusherClient.disconnect();
    };
  }, [userId]);

  const getLocation = useCallback((userId: string) => {
    return locations.get(userId);
  }, [locations]);

  const getAllLocations = useCallback(() => {
    return Array.from(locations.values());
  }, [locations]);

  return { locations, getLocation, getAllLocations };
};
