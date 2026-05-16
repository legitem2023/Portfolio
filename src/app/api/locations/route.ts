import { NextRequest, NextResponse } from 'next/server';
import { locationStore } from '../../../../types/locationTypes';

export async function GET(request: NextRequest) {
  try {
    const allLocations = Array.from(locationStore.values());
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    let filteredLocations = allLocations;
    if (status) {
      filteredLocations = allLocations.filter(loc => loc.status === status);
    }

    return NextResponse.json({ 
      success: true, 
      count: filteredLocations.length,
      locations: filteredLocations 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
