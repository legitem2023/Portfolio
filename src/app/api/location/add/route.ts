// app/api/location/add/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth'; // or your auth library
import Pusher from 'pusher';

const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// In-memory storage (replace with actual database)
const locationStore = new Map<string, LocationData>();

interface LocationData {
  userID: string;
  latitude: number;
  longitude: number;
  status: 'available' | 'busy' | 'inactive' | 'offline';
  timestamp: string;
  lastUpdated?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userID, latitude, longitude, status, timestamp } = await request.json();

    // Validate required fields
    if (!userID || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: userID, latitude, longitude' 
      }, { status: 400 });
    }

    // Verify authentication (optional - implement based on your needs)
    const session = await getServerSession();
    // If updating other user's location, check if current user has admin role
    // if (session?.user?.id !== userID && !session?.user?.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Check if location already exists
    if (locationStore.has(userID)) {
      return NextResponse.json({ 
        error: 'Location already exists for this user. Use PUT /api/location/update instead.' 
      }, { status: 409 });
    }

    const locationData: LocationData = {
      userID,
      latitude,
      longitude,
      status: status || 'available',
      timestamp: timestamp || new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    // Store in database
    locationStore.set(userID, locationData);
    
    // Optional: Store in Redis for faster access
    // await redis.set(`location:${userID}`, JSON.stringify(locationData));

    // Trigger to user's private channel (so they get confirmation)
    await pusherServer.trigger(
      `private-user-${userID}`,
      'user-location-update',
      locationData
    );

    // Trigger to admin channel for monitoring
    await pusherServer.trigger(
      'admin-locations',
      'user-location-update',
      locationData
    );

    // Trigger to nearby users (implement geohash/radius logic)
    const nearbyUsers = getNearbyUsers(latitude, longitude);
    for (const nearbyUser of nearbyUsers) {
      if (nearbyUser !== userID) {
        await pusherServer.trigger(
          `private-user-${nearbyUser}`,
          'user-location-update',
          locationData
        );
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Location added successfully',
      location: locationData 
    });
  } catch (error) {
    console.error('Add location error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to find nearby users (implement properly)
function getNearbyUsers(lat: number, lng: number, radiusKm: number = 5): string[] {
  // In production, use geohash or PostGIS to query nearby users
  // This is a simplified example
  const nearby: string[] = [];
  for (const [userId, location] of locationStore.entries()) {
    const distance = calculateDistance(lat, lng, location.latitude, location.longitude);
    if (distance <= radiusKm) {
      nearby.push(userId);
    }
  }
  return nearby;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
