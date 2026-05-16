import { NextRequest, NextResponse } from 'next/server';
import { locationStore, pusherServer } from '../../../../../locationTypes';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const location = locationStore.get(userId);
    
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    return NextResponse.json({ location });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    if (!locationStore.has(userId)) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    locationStore.delete(userId);
    
    await pusherServer.trigger('admin-locations', 'user-offline', { userID: userId });

    return NextResponse.json({ success: true, message: 'Location deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
