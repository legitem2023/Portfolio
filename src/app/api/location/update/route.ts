// app/api/location/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Pusher from 'pusher';

const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

const locationStore = new Map<string, LocationData>(); // Same store as above (use database in production)

interface LocationData {
  userID: string;
  latitude: number;
  longitude: number;
  status: 'available' | 'busy' | 'inactive' | 'offline';
  timestamp: string;
  lastUpdated?: string;
}

export async function PUT(request: NextRequest) {
  try {
    const { userID, latitude, longitude, status, lastUpdated } = await request.json();

    // Validate required fields
    if (!userID || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: userID, latitude, longitude' 
      }, { status: 400 });
    }

    // Verify authentication
    const session = await getServerSession();
    // if (session?.user?.id !== userID && !session?.user?.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Check if location exists
    const existingLocation = locationStore.get(userID);
    if (!existingLocation) {
      return NextResponse.json({ 
        error: 'Location not found for this user. Use POST /api/location/add first.' 
      }, { status: 404 });
    }

    const locationData: LocationData = {
      ...existingLocation,
      latitude,
      longitude,
      status: status || existingLocation.status,
      lastUpdated: new Date().toISOString()
    };

    // Update in database
    locationStore.set(userID, locationData);

    // Trigger to user's private channel
    await pusherServer.trigger(
      `private-user-${userID}`,
      'user-location-update',
      locationData
    );

    // Trigger to admin channel
    await pusherServer.trigger(
      'admin-locations',
      'user-location-update',
      locationData
    );

    // Trigger to nearby users (including old and new radius)
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
      message: 'Location updated successfully',
      location: locationData 
    });
  } catch (error) {
    console.error('Update location error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getNearbyUsers(lat: number, lng: number, radiusKm: number = 5): string[] {
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
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
