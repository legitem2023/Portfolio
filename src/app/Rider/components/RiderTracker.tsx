import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Types
interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  timestamp?: string;
}

interface TrackLocationArgs {
  userId: string;
  trackingId?: string;
  location: Location;
}

interface TrackLocationResponse {
  success: boolean;
  message: string;
  trackingId?: string;
  location?: Location;
}

// GraphQL Mutation
const TRACK_LOCATION_MUTATION = `
  mutation TrackLocation($userId: String!, $trackingId: String, $location: LocationInput!) {
    trackLocation(userId: $userId, trackingId: $trackingId, location: $location) {
      success
      message
      trackingId
      location {
        latitude
        longitude
        accuracy
        speed
        timestamp
      }
    }
  }
`;

// Custom hook for geolocation
const useGeolocation = (options?: PositionOptions) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    const successHandler = (position: GeolocationPosition) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed || undefined,
        timestamp: new Date(position.timestamp).toISOString(),
      });
      setError(null);
      setLoading(false);
    };

    const errorHandler = (error: GeolocationPositionError) => {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setError('User denied the request for geolocation');
          break;
        case error.POSITION_UNAVAILABLE:
          setError('Location information is unavailable');
          break;
        case error.TIMEOUT:
          setError('The request to get user location timed out');
          break;
        default:
          setError('An unknown error occurred');
      }
      setLoading(false);
    };

    const watchId = navigator.geolocation.watchPosition(
      successHandler,
      errorHandler,
      options
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [options]);

  return { location, error, loading };
};

// Component to center map on current location
const MapCenter: React.FC<{ position: [number, number] }> = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(position, 15);
  }, [map, position]);
  return null;
};

// Custom mutation hook with actual GraphQL implementation
const useTrackLocationMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackLocation = useCallback(async (args: TrackLocationArgs): Promise<TrackLocationResponse | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Option 1: Using fetch with GraphQL
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`, // Add your auth token
        },
        body: JSON.stringify({
          query: TRACK_LOCATION_MUTATION,
          variables: {
            userId: args.userId,
            trackingId: args.trackingId,
            location: {
              latitude: args.location.latitude,
              longitude: args.location.longitude,
              accuracy: args.location.accuracy,
              speed: args.location.speed,
              timestamp: args.location.timestamp || new Date().toISOString(),
            },
          },
        }),
      });

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      return result.data.trackLocation;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to track location';
      setError(errorMessage);
      console.error('Track location error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { trackLocation, loading, error };
};

// Alternative: Using Apollo Client
/*
import { useMutation, gql } from '@apollo/client';

const TRACK_LOCATION_MUTATION = gql`
  mutation TrackLocation($userId: String!, $trackingId: String, $location: LocationInput!) {
    trackLocation(userId: $userId, trackingId: $trackingId, location: $location) {
      success
      message
      trackingId
      location {
        latitude
        longitude
        accuracy
        speed
        timestamp
      }
    }
  }
`;

const useTrackLocationMutation = () => {
  const [trackLocationMutation, { loading, error }] = useMutation(TRACK_LOCATION_MUTATION);
  
  const trackLocation = useCallback(async (args: TrackLocationArgs) => {
    try {
      const result = await trackLocationMutation({
        variables: {
          userId: args.userId,
          trackingId: args.trackingId,
          location: {
            latitude: args.location.latitude,
            longitude: args.location.longitude,
            accuracy: args.location.accuracy,
            speed: args.location.speed,
            timestamp: args.location.timestamp,
          },
        },
      });
      
      return result.data.trackLocation;
    } catch (err) {
      console.error('Track location error:', err);
      return null;
    }
  }, [trackLocationMutation]);
  
  return { trackLocation, loading, error };
};
*/

// Main Rider Component
interface RiderTrackerProps {
  userId: string;
  trackingId?: string;
  updateInterval?: number; // in milliseconds
  mapHeight?: string | number;
  mapWidth?: string | number;
  showAccuracy?: boolean;
  tileLayerUrl?: string; // Optional: custom tile layer URL
  tileLayerAttribution?: string; // Optional: custom attribution
}

const RiderTracker: React.FC<RiderTrackerProps> = ({
  userId,
  trackingId: initialTrackingId,
  updateInterval = 10000,
  mapHeight = '500px',
  mapWidth = '100%',
  showAccuracy = true,
  tileLayerUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  tileLayerAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}) => {
  const [trackingId, setTrackingId] = useState<string | null>(initialTrackingId || null);
  const [locationHistory, setLocationHistory] = useState<Location[]>([]);
  const [lastUpdateStatus, setLastUpdateStatus] = useState<string>('');
  const [isTracking, setIsTracking] = useState<boolean>(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { location, error: geoError, loading: geoLoading } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
  });
  
  const { trackLocation, loading: mutationLoading, error: mutationError } = useTrackLocationMutation();

  // Send location update
  const sendLocationUpdate = useCallback(async (currentLocation: Location) => {
    if (!userId) {
      console.error('User ID is required');
      return;
    }

    try {
      const response = await trackLocation({
        userId,
        trackingId: trackingId || undefined,
        location: currentLocation,
      });

      if (response?.success) {
        if (response.trackingId && !trackingId) {
          setTrackingId(response.trackingId);
        }
        setLastUpdateStatus(`✅ Last update: ${new Date().toLocaleTimeString()} - Success`);
        
        // Add to history
        setLocationHistory(prev => [...prev, currentLocation].slice(-50));
      } else {
        setLastUpdateStatus(`❌ Last update: ${new Date().toLocaleTimeString()} - Failed: ${response?.message}`);
      }
    } catch (error) {
      setLastUpdateStatus(`❌ Last update: ${new Date().toLocaleTimeString()} - Error`);
    }
  }, [userId, trackingId, trackLocation]);

  // Start periodic location updates
  useEffect(() => {
    if (location && isTracking && updateInterval > 0) {
      // Send immediately on first location
      sendLocationUpdate(location);
      
      // Then set interval
      intervalRef.current = setInterval(() => {
        if (location) {
          sendLocationUpdate(location);
        }
      }, updateInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [location, sendLocationUpdate, updateInterval, isTracking]);

  // Manual update trigger
  const handleManualUpdate = () => {
    if (location) {
      sendLocationUpdate(location);
    }
  };

  const toggleTracking = () => {
    setIsTracking(!isTracking);
    if (!isTracking && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  // Calculate current position for map
  const currentPosition: [number, number] | null = location 
    ? [location.latitude, location.longitude] 
    : null;

  // Create path from location history
  const pathPositions: [number, number][] = locationHistory
    .map(loc => [loc.latitude, loc.longitude] as [number, number]);

  // Accuracy circle radius in meters (approximate conversion for leaflet)
  const getAccuracyRadius = () => {
    if (showAccuracy && location?.accuracy) {
      return location.accuracy;
    }
    return 0;
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Rider Location Tracker</h2>
      
      {/* Controls */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div>
          <strong>User ID:</strong> {userId}
        </div>
        {trackingId && (
          <div>
            <strong>Tracking ID:</strong> {trackingId}
          </div>
        )}
        <div>
          <strong>Update Interval:</strong> {updateInterval / 1000} seconds
        </div>
        <div>
          <button 
            onClick={toggleTracking}
            style={{
              padding: '8px 16px',
              backgroundColor: isTracking ? '#dc3545' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </button>
        </div>
        <div>
          <button 
            onClick={handleManualUpdate}
            disabled={!location || mutationLoading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: location && !mutationLoading ? 'pointer' : 'not-allowed'
            }}
          >
            {mutationLoading ? 'Sending...' : 'Manual Update'}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      <div style={{ marginBottom: '10px' }}>
        {geoLoading && <div style={{ color: '#ffc107' }}>📍 Getting your location...</div>}
        {geoError && <div style={{ color: '#dc3545' }}>⚠️ Geolocation Error: {geoError}</div>}
        {mutationError && <div style={{ color: '#dc3545' }}>⚠️ Mutation Error: {mutationError}</div>}
        {lastUpdateStatus && (
          <div style={{ 
            color: lastUpdateStatus.includes('Success') ? '#28a745' : '#dc3545',
            fontWeight: 'bold'
          }}>
            {lastUpdateStatus}
          </div>
        )}
        {isTracking && location && (
          <div style={{ color: '#28a745' }}>
            🟢 Auto-updating every {updateInterval / 1000} seconds...
          </div>
        )}
        {!isTracking && (
          <div style={{ color: '#dc3545' }}>
            🔴 Tracking stopped
          </div>
        )}
      </div>

      {/* Location Info */}
      {location && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '10px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          <strong>Current Location:</strong><br />
          Latitude: {location.latitude.toFixed(6)}<br />
          Longitude: {location.longitude.toFixed(6)}<br />
          {location.accuracy && <span>Accuracy: ±{location.accuracy.toFixed(2)}m<br /></span>}
          {location.speed !== undefined && <span>Speed: {(location.speed * 3.6).toFixed(2)} km/h<br /></span>}
          Timestamp: {new Date(location.timestamp || '').toLocaleString()}<br />
          {locationHistory.length > 0 && <span>History Points: {locationHistory.length}</span>}
        </div>
      )}

      {/* Map */}
      <div style={{ height: mapHeight, width: mapWidth, position: 'relative' }}>
        {currentPosition ? (
          <MapContainer
            center={currentPosition}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url={tileLayerUrl}
              attribution={tileLayerAttribution}
            />
            
            <MapCenter position={currentPosition} />
            
            {/* Current location marker */}
            <Marker position={currentPosition}>
              <Popup>
                <div>
                  <strong>Current Location</strong><br />
                  Lat: {location.latitude.toFixed(6)}<br />
                  Lng: {location.longitude.toFixed(6)}<br />
                  {location.speed !== undefined && (
                    <>Speed: {(location.speed * 3.6).toFixed(2)} km/h<br />
                  </>)}
                  Time: {new Date(location.timestamp || '').toLocaleTimeString()}
                </div>
              </Popup>
            </Marker>
            
            {/* Accuracy circle */}
            {showAccuracy && location.accuracy && (
              <Circle
                center={currentPosition}
                radius={location.accuracy}
                pathOptions={{
                  color: '#007bff',
                  fillColor: '#007bff',
                  fillOpacity: 0.1,
                  weight: 1
                }}
              />
            )}
            
            {/* Path history */}
            {pathPositions.length > 1 && (
              <Polyline
                positions={pathPositions}
                pathOptions={{
                  color: '#28a745',
                  weight: 3,
                  opacity: 0.7
                }}
              />
            )}
            
            {/* History markers (only show some of them to avoid clutter) */}
            {locationHistory.slice(-10).map((loc, idx) => (
              <Marker
                key={idx}
                position={[loc.latitude, loc.longitude]}
                icon={L.divIcon({
                  className: 'history-marker',
                  html: '•',
                  iconSize: [8, 8],
                  popupAnchor: [0, 0]
                })}
              >
                <Popup>
                  <div>
                    <strong>History Point</strong><br />
                    Time: {new Date(loc.timestamp || '').toLocaleTimeString()}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <div style={{ 
            height: '100%', 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px'
          }}>
            {geoLoading ? 'Loading map...' : 'Waiting for location access...'}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ 
        marginTop: '10px', 
        padding: '10px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '4px',
        fontSize: '12px',
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        <div>📍 <span style={{ color: '#dc3545' }}>Red Marker:</span> Current location</div>
        <div>🟢 <span style={{ color: '#28a745' }}>Green Line:</span> Path traveled</div>
        <div>🔵 <span style={{ color: '#007bff' }}>Blue Circle:</span> GPS accuracy</div>
        <div>• <span style={{ color: '#6c757d' }}>Dots:</span> History points</div>
      </div>
    </div>
  );
};

// Circle component for accuracy visualization
const Circle: React.FC<{
  center: [number, number];
  radius: number;
  pathOptions?: L.PathOptions;
}> = ({ center, radius, pathOptions }) => {
  const map = useMap();
  
  useEffect(() => {
    const circle = L.circle(center, {
      radius: radius,
      ...pathOptions
    }).addTo(map);
    
    return () => {
      map.removeLayer(circle);
    };
  }, [map, center, radius, pathOptions]);
  
  return null;
};

export default RiderTracker;
