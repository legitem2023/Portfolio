import { NextRequest, NextResponse } from 'next/server';
import { locationStore, pusherServer, getNearbyUsers } from '../../../../../types/locationTypes';

export async function PUT(request: NextRequest) {
  try {
    const { userID, latitude, longitude, status } = await request.json();

    if (!userID || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingLocation = locationStore.get(userID);
    if (!existingLocation) {
      return NextResponse.json({ error: 'Location not found. Use POST first.' }, { status: 404 });
    }

    const locationData = {
      ...existingLocation,
      latitude,
      longitude,
      status: status || existingLocation.status,
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
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
