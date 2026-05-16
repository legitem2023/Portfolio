import { NextRequest, NextResponse } from 'next/server';
import { LocationData, locationStore, pusherServer, getNearbyUsers } from '../../../../../locationTypes';

export async function POST(request: NextRequest) {
  try {
    const { userID, latitude, longitude, status, timestamp } = await request.json();

    if (!userID || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (locationStore.has(userID)) {
      return NextResponse.json({ error: 'Location already exists. Use PUT instead.' }, { status: 409 });
    }

    const locationData: LocationData = {
      userID,
      latitude,
      longitude,
      status: status || 'available',
      timestamp: timestamp || new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    locationStore.set(userID, locationData);

    // Trigger to user's private channel
    await pusherServer.trigger(`private-user-${userID}`, 'user-location-update', locationData);
    
    // Trigger to admin channel
    await pusherServer.trigger('admin-locations', 'user-location-update', locationData);
    
    // Trigger to nearby users
    const nearbyUsers = getNearbyUsers(latitude, longitude);
    for (const nearbyUser of nearbyUsers) {
      if (nearbyUser !== userID) {
        await pusherServer.trigger(`private-user-${nearbyUser}`, 'user-location-update', locationData);
      }
    }

    return NextResponse.json({ success: true, location: locationData });
  } catch (error) {
    return NextResponse.json({ error: 'Add failed' }, { status: 500 });
  }
}
