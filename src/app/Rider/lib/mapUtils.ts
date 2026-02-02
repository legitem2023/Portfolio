import { Address } from './types';

// Convert address to coordinates (mock function - in real app use geocoding API)
export const getCoordinatesFromAddress = (address: Address): { lat: number; lng: number } => {
  // Mock coordinates based on zip code
  const zip = parseInt(address.zipCode) || 0;
  
  // Generate coordinates within Metro Manila area
  const baseLat = 14.5995; // Manila latitude
  const baseLng = 120.9842; // Manila longitude
  
  // Add some variation based on zip code
  const latVariation = (zip % 1000) / 100000;
  const lngVariation = (zip % 10000) / 100000;
  
  return {
    lat: baseLat + latVariation,
    lng: baseLng + lngVariation
  };
};

// Calculate route distance (mock function - in real app use Google Maps API)
export const calculateRouteDistance = (pickup: Address, dropoff: Address): number => {
  // Simple distance calculation based on zip codes
  const zip1 = parseInt(pickup.zipCode) || 0;
  const zip2 = parseInt(dropoff.zipCode) || 0;
  const diff = Math.abs(zip1 - zip2);
  
  // Convert to kilometers (mock)
  return Math.max(0.5, diff / 5000) * 1.5;
};

// Calculate ETA (mock function)
export const calculateETA = (pickup: Address, dropoff: Address): string => {
  const distance = calculateRouteDistance(pickup, dropoff);
  const avgSpeed = 30; // km/h
  const timeInMinutes = Math.ceil((distance / avgSpeed) * 60);
  return `${timeInMinutes} min`;
};

// Generate mock route points for visualization
export const generateRoutePoints = (pickup: Address, dropoff: Address): Array<{ lat: number; lng: number }> => {
  const start = getCoordinatesFromAddress(pickup);
  const end = getCoordinatesFromAddress(dropoff);
  
  const points = [start];
  
  // Generate intermediate points for a curved route
  const numPoints = 5;
  for (let i = 1; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const lat = start.lat + (end.lat - start.lat) * t + Math.sin(t * Math.PI) * 0.005;
    const lng = start.lng + (end.lng - start.lng) * t + Math.cos(t * Math.PI) * 0.005;
    points.push({ lat, lng });
  }
  
  points.push(end);
  return points;
};
