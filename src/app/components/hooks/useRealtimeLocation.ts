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
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');

  useEffect(() => {
    console.log('🔵 useRealtimeLocation hook initialized with userId:', userId);
    
    // Log environment variables (without exposing full keys)
    console.log('📋 Pusher Config:', {
      hasKey: !!process.env.NEXT_PUBLIC_PUSHER_KEY,
      keyPrefix: process.env.NEXT_PUBLIC_PUSHER_KEY?.substring(0, 8),
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      hasAuthEndpoint: !!process.env.NEXT_PUBLIC_PUSHER_AUTH_ENDPOINT
    });

    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
    });

    setPusher(pusherClient);

    // Monitor connection state
    pusherClient.connection.bind('state_change', (states: any) => {
      console.log(`📡 Pusher connection state changed: ${states.previous} -> ${states.current}`);
      setConnectionStatus(states.current);
    });

    pusherClient.connection.bind('connected', () => {
      console.log('✅ Pusher connected successfully!');
      console.log('📡 Connection ID:', pusherClient.connection.socket_id);
    });

    pusherClient.connection.bind('error', (error: any) => {
      console.error('❌ Pusher connection error:', error);
    });

    // Subscribe to admin channel for all location updates
    console.log('📡 Subscribing to admin-locations channel...');
    const adminChannel = pusherClient.subscribe('admin-locations');
    
    // Log admin channel subscription status
    adminChannel.bind('pusher:subscription_succeeded', () => {
      console.log('✅ Successfully subscribed to admin-locations channel');
      console.log('📊 Channel name:', adminChannel.name);
      console.log('👂 Listening for event: user-location-update');
    });

    adminChannel.bind('pusher:subscription_error', (error: any) => {
      console.error('❌ Failed to subscribe to admin-locations channel:', error);
    });

    // Bind to the location update event
    adminChannel.bind('user-location-update', (data: LocationData) => {
      console.log('📍📍📍 ADMIN LOCATION UPDATE RECEIVED! 📍📍📍');
      console.log('📦 Full data received:', data);
      console.log('👤 User ID:', data.userID);
      console.log('📍 Coordinates:', data.latitude, data.longitude);
      console.log('💚 Status:', data.status);
      console.log('⏰ Timestamp:', data.timestamp);
      
      setLocations(prev => {
        console.log('🔄 Updating locations map, current size:', prev.size);
        const newMap = new Map(prev);
        newMap.set(data.userID, data);
        console.log('📊 New map size:', newMap.size);
        console.log('🗺️ All locations:', Array.from(newMap.values()));
        return newMap;
      });
    });

    // Listen for ANY event on admin channel (for debugging)
    adminChannel.bind_global((eventName, data) => {
      console.log(`🌍 Global event on admin-locations: "${eventName}"`, data);
    });

    // If specific user, also subscribe to their private channel
    if (userId) {
      console.log(`📡 Subscribing to user-${userId} channel...`);
      const userChannel = pusherClient.subscribe(`user-${userId}`);
      console.log(userChannel, "channel object");
      
      userChannel.bind('pusher:subscription_succeeded', () => {
        console.log(`✅ Successfully subscribed to user-${userId} channel`);
        console.log(`👂 Listening for event: location-updated`);
      });

      userChannel.bind('pusher:subscription_error', (error: any) => {
        console.error(`❌ Failed to subscribe to user-${userId} channel:`, error);
      });

      userChannel.bind('location-updated', (data: LocationData) => {
        console.log(`🎯🎯🎯 USER LOCATION UPDATE RECEIVED for ${userId}! 🎯🎯🎯`);
        console.log('📦 Full data received:', data);
        console.log('👤 User ID:', data.userID);
        console.log('📍 Coordinates:', data.latitude, data.longitude);
        console.log('💚 Status:', data.status);
        console.log('⏰ Timestamp:', data.timestamp);
        
        setLocations(prev => {
          console.log('🔄 Updating locations map, current size:', prev.size);
          const newMap = new Map(prev);
          newMap.set(data.userID, data);
          console.log('📊 New map size:', newMap.size);
          return newMap;
        });
      });

      // Listen for ANY event on user channel
      userChannel.bind_global((eventName, data) => {
        console.log(`🌍 Global event on user-${userId}: "${eventName}"`, data);
      });

      return () => {
        console.log(`🧹 Cleaning up user-${userId} channel...`);
        userChannel.unbind_all();
        userChannel.unsubscribe();
        adminChannel.unbind_all();
        adminChannel.unsubscribe();
        pusherClient.disconnect();
        console.log('✅ Cleanup complete');
      };
    }

    return () => {
      console.log('🧹 Cleaning up admin-locations channel...');
      adminChannel.unbind_all();
      adminChannel.unsubscribe();
      pusherClient.disconnect();
      console.log('✅ Cleanup complete');
    };
  }, [userId]);

  const getLocation = useCallback((userId: string) => {
    const location = locations.get(userId);
    console.log(`🔍 Getting location for ${userId}:`, location);
    return location;
  }, [locations]);

  const getAllLocations = useCallback(() => {
    const allLocations = Array.from(locations.values());
    console.log(`📊 Getting all locations (${allLocations.length}):`, allLocations);
    return allLocations;
  }, [locations]);

  // Log whenever locations change
  useEffect(() => {
    console.log(`📍 Locations state updated! Total locations: ${locations.size}`);
    if (locations.size > 0) {
      console.log('Current locations:', Array.from(locations.entries()));
    }
  }, [locations]);

  console.log('🔄 useRealtimeLocation returning with:', {
    locationsSize: locations.size,
    connectionStatus,
    hasGetLocation: !!getLocation,
    hasGetAllLocations: !!getAllLocations
  });

  return { locations, getLocation, getAllLocations, connectionStatus };
};
