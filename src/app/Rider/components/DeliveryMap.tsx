// components/DeliveryMap.tsx
'use client';

import { useState, useEffect } from 'react';
import { Navigation, MapPin, Loader2, X } from 'lucide-react';

interface DeliveryMapProps {
  pickupAddress: string;
  dropoffAddress: string;
  status: 'PROCESSING' | 'SHIPPED' | 'DELIVERED';
  isMobile: boolean;
  onClose: () => void;
  restaurant?: string;
  customer?: string;
}

export default function DeliveryMap({ 
  pickupAddress, 
  dropoffAddress, 
  status,
  isMobile,
  onClose,
  restaurant,
  customer 
}: DeliveryMapProps) {
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(false);

  // Determine destination based on status
  const destination = status === 'PROCESSING' ? pickupAddress : dropoffAddress;
  const origin = 'Current+Location'; // Google Maps will use browser's current location
  const destinationLabel = status === 'PROCESSING' ? 'Pickup Location' : 'Delivery Location';
  const destinationName = status === 'PROCESSING' ? restaurant : customer;

  // Create Google Maps embed URL
  const mapSrc = `https://www.google.com/maps/embed/v1/directions?key=YOUR_API_KEY&origin=${origin}&destination=${encodeURIComponent(destination)}&maptype=roadmap`;

  // Fallback to directions URL if iframe fails
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-2">
            <Navigation size={isMobile ? 20 : 24} />
            <div>
              <h3 className="font-bold text-lg">
                {status === 'PROCESSING' ? 'Route to Pickup' : 'Route to Delivery'}
              </h3>
              <p className="text-xs opacity-90">
                {status === 'PROCESSING' ? 'Head to pickup location' : 'Deliver to customer'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative min-h-[400px] bg-gray-100">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-100">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-600">Loading map...</p>
              </div>
            </div>
          )}

          {mapError ? (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-100">
              <div className="text-center p-6">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">Unable to load map</p>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Navigation size={16} />
                  Open in Google Maps
                </a>
              </div>
            </div>
          ) : (
            <iframe
              title="Google Maps"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={mapSrc}
              onLoad={() => setLoading(false)}
              onError={() => {
                setMapError(true);
                setLoading(false);
              }}
            />
          )}
        </div>

        {/* Bottom Info */}
        <div className="p-4 border-t bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <MapPin size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Your Location</p>
                <p className="text-sm font-medium">Current Position</p>
                <p className="text-xs text-gray-400 mt-1">(Using browser location)</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className={`p-2 rounded-lg ${
                status === 'PROCESSING' ? 'bg-blue-100' : 'bg-green-100'
              }`}>
                <MapPin size={16} className={
                  status === 'PROCESSING' ? 'text-blue-600' : 'text-green-600'
                } />
              </div>
              <div>
                <p className="text-xs text-gray-500">{destinationLabel}</p>
                <p className="text-sm font-medium">{destinationName}</p>
                <p className="text-xs text-gray-600 mt-1">{destination}</p>
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <p className="font-medium text-gray-700">Full Addresses:</p>
            <p>📍 Pickup: {pickupAddress}</p>
            <p>📦 Dropoff: {dropoffAddress}</p>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium"
            >
              Close
            </button>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-1"
            >
              <Navigation size={14} />
              Open in Google Maps App
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
