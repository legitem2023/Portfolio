// lib/locationTypes.ts
import Pusher from 'pusher';

// ============ TYPES ============
export interface LocationData {
  userID: string;
  latitude: number;
  longitude: number;
  status: 'available' | 'busy' | 'inactive' | 'offline';
  timestamp: string;
  lastUpdated?: string;
}

// ============ GLOBAL STORAGE ============
// In-memory storage (replace with database in production)
export const locationStore = new Map<string, LocationData>();

// ============ PUSHER SERVER INSTANCE ============
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// ============ HELPER FUNCTIONS ============
export function getNearbyUsers(lat: number, lng: number, radiusKm: number = 5): string[] {
  const nearby: string[] = [];
  // Convert Map to array first to avoid iteration issue
  const locationsArray = Array.from(locationStore.entries());
  for (const [userId, location] of locationsArray) {
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
