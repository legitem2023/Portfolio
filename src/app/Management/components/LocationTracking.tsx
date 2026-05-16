// app/Admin/LocationTracking/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRealtimeLocation } from '../../components/hooks/useRealtimeLocation';
import { useAuth } from '../../components/hooks/useAuth';
import { showToast } from '../../../../utils/toastify';
import {
  MapPin,
  Car,
  User,
  Wifi,
  WifiOff,
  RefreshCw,
  Search,
  Filter,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Navigation
} from 'lucide-react';

interface LocationWithDistance extends LocationData {
  distance?: number;
}

export default function AdminLocationTracking() {
  const { user, loading: authLoading } = useAuth();
  const {
    locations,
    getAllLocations,
    getLocation,
    connectionStatus,
    addLocation,
    updateLocation
  } = useRealtimeLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRider, setSelectedRider] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [adminLocation, setAdminLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showDistance, setShowDistance] = useState(true);

  // Get all riders with optional filtering
  const getAllRiders = useCallback((): LocationWithDistance[] => {
    let riders = getAllLocations();
    
    // Apply search filter
    if (searchTerm) {
      riders = riders.filter(rider => 
        rider.userID.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      riders = riders.filter(rider => rider.status === statusFilter);
    }
    
    // Calculate distance from admin if admin location is available
    if (adminLocation && showDistance) {
      riders = riders.map(rider => ({
        ...rider,
        distance: calculateDistance(
          adminLocation.lat,
          adminLocation.lng,
          rider.latitude,
          rider.longitude
        )
      })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    
    return riders;
  }, [getAllLocations, searchTerm, statusFilter, adminLocation, showDistance]);

  // Calculate distance between two coordinates (in km)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get admin's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setAdminLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting admin location:', error);
        }
      );
    }
  }, []);

  // Auto-refresh last update time
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Manual refresh
  const handleRefresh = () => {
    setLastUpdate(new Date());
    showToast('Locations refreshed', 'info');
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Available' };
      case 'busy':
        return { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Busy' };
      case 'inactive':
        return { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Inactive' };
      case 'offline':
        return { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Offline' };
      default:
        return { color: 'bg-blue-100 text-blue-800', icon: User, label: status };
    }
  };

  const riders = getAllRiders();
  const totalRiders = riders.length;
  const availableRiders = riders.filter(r => r.status === 'available').length;
  const busyRiders = riders.filter(r => r.status === 'busy').length;
  const offlineRiders = riders.filter(r => r.status === 'offline').length;

  // Redirect if not admin
  if (!authLoading && user?.role !== 'MANAGER') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Navigation className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Live Rider Tracking</h1>
                <p className="text-sm text-gray-500">Real-time location monitoring</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {connectionStatus === 'connected' ? (
                  <Wifi className="w-5 h-5 text-green-600" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-600" />
                )}
                <span className="text-sm text-gray-600">
                  {connectionStatus === 'connected' ? 'Live' : 'Connecting...'}
                </span>
              </div>
              
              <button
                onClick={handleRefresh}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <RefreshCw className={`w-5 h-5 ${autoRefresh ? 'text-blue-600' : 'text-gray-400'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Riders</p>
                <p className="text-3xl font-bold text-gray-900">{totalRiders}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-3xl font-bold text-green-600">{availableRiders}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-50" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Busy</p>
                <p className="text-3xl font-bold text-yellow-600">{busyRiders}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-500 opacity-50" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Offline</p>
                <p className="text-3xl font-bold text-red-600">{offlineRiders}</p>
              </div>
              <XCircle className="w-12 h-12 text-red-500 opacity-50" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by rider ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="inactive">Inactive</option>
                <option value="offline">Offline</option>
              </select>
              
              <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg">
                <input
                  type="checkbox"
                  checked={showDistance}
                  onChange={(e) => setShowDistance(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Show distance from me</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Riders Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {riders.map((rider) => {
            const StatusIcon = getStatusBadge(rider.status).icon;
            const statusInfo = getStatusBadge(rider.status);
            
            return (
              <div
                key={rider.userID}
                className={`bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer ${
                  selectedRider === rider.userID ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedRider(rider.userID)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Car className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{rider.userID}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://maps.google.com/?q=${rider.latitude},${rider.longitude}`, '_blank');
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <MapPin className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Latitude:</span>
                      <span className="font-mono font-medium">{rider.latitude.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Longitude:</span>
                      <span className="font-mono font-medium">{rider.longitude.toFixed(6)}</span>
                    </div>
                    {rider.distance !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Distance:</span>
                        <span className="font-medium text-blue-600">{rider.distance.toFixed(2)} km</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="text-gray-500 text-xs">
                        {rider.lastUpdated ? new Date(rider.lastUpdated).toLocaleTimeString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`https://maps.google.com/?q=${rider.latitude},${rider.longitude}`, '_blank');
                    }}
                    className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    Navigate to Rider
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        {riders.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No riders found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'No riders are currently sharing their location'}
            </p>
          </div>
        )}
      </div>

      {/* Selected Rider Modal */}
      {selectedRider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Rider Details</h2>
              <button
                onClick={() => setSelectedRider(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {(() => {
                const rider = getLocation(selectedRider);
                if (!rider) return <p>Rider not found</p>;
                const statusInfo = getStatusBadge(rider.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Car className="w-8 h-8 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{rider.userID}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                          <StatusIcon className="w-4 h-4" />
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">Latitude</p>
                        <p className="font-mono font-medium">{rider.latitude.toFixed(6)}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">Longitude</p>
                        <p className="font-mono font-medium">{rider.longitude.toFixed(6)}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">Timestamp</p>
                        <p className="text-sm">{new Date(rider.timestamp).toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">Last Updated</p>
                        <p className="text-sm">{rider.lastUpdated ? new Date(rider.lastUpdated).toLocaleString() : 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          window.open(`https://maps.google.com/?q=${rider.latitude},${rider.longitude}`, '_blank');
                        }}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                      >
                        <Navigation className="w-4 h-4" />
                        Open in Google Maps
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${rider.latitude},${rider.longitude}`);
                          showToast('Coordinates copied!', 'success');
                        }}
                        className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition"
                      >
                        Copy Coordinates
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
