import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_ADDRESS } from '../graphql/mutation';

interface AddressFormProps {
  userId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  onAddressUpdate?: () => void;
}

interface FormData {
  type: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  receiver: string;
  lat: number | null;
  lng: number | null;
}

export default function AddressForm({ userId, onSuccess, onCancel, onAddressUpdate }: AddressFormProps) {
  const [formData, setFormData] = useState<FormData>({
    type: 'HOME',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    isDefault: false,
    receiver: '',
    lat: null,
    lng: null
  });

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [createAddress, { loading, error }] = useMutation(CREATE_ADDRESS);

  // Geocode address using Google Maps API
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setLocationError('Google Maps API key is missing');
      return null;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        return { lat, lng };
      } else {
        setLocationError('Could not find location for this address');
        return null;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setLocationError('Error geocoding address');
      return null;
    }
  };

  // Get current device location
  const getCurrentLocation = async (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by this browser');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Could not get your current location');
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });
  };

  const handleGeocodeFromAddress = async () => {
    const fullAddress = `${formData.street}, ${formData.city}, ${formData.state} ${formData.zipCode}, ${formData.country}`;
    
    setIsGeocoding(true);
    setLocationError(null);
    
    try {
      const location = await geocodeAddress(fullAddress);
      if (location) {
        setFormData(prev => ({
          ...prev,
          lat: location.lat,
          lng: location.lng
        }));
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleGetCurrentLocation = async () => {
    setIsGeocoding(true);
    setLocationError(null);
    
    try {
      const location = await getCurrentLocation();
      if (location) {
        setFormData(prev => ({
          ...prev,
          lat: location.lat,
          lng: location.lng
        }));
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createAddress({
        variables: {
          input: {
            userId,
            ...formData,
          },
        },
      });

      onSuccess?.();
      onAddressUpdate?.();
    } catch (err) {
      console.error('Error creating address:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const isAddressComplete = formData.street && formData.city && formData.state && formData.zipCode && formData.country;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Address</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error.message}
        </div>
      )}

      {locationError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {locationError}
        </div>
      )}

      {/* Display coordinates if available */}
      {formData.lat && formData.lng && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded flex justify-between items-center">
          <span>
            📍 Location set: {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
          </span>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, lat: null, lng: null }))}
            className="text-green-700 hover:text-green-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Address Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Address Type
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="HOME">Home</option>
            <option value="WORK">Work</option>
            <option value="BILLING">Billing</option>
            <option value="SHIPPING">Shipping</option>
          </select>
        </div>

        {/* Receiver Field */}
        <div>
          <label htmlFor="receiver" className="block text-sm font-medium text-gray-700 mb-1">
            Receiver
          </label>
          <input
            type="text"
            id="receiver"
            name="receiver"
            value={formData.receiver}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter receiver name"
          />
        </div>

        {/* Street Address */}
        <div>
          <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
            Street Address
          </label>
          <input
            type="text"
            id="street"
            name="street"
            value={formData.street}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="123 Main St"
            required
          />
        </div>

        {/* City, State, Zip Code Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="City"
              required
            />
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="State"
              required
            />
          </div>

          <div>
            <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
              ZIP Code
            </label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="12345"
              required
            />
          </div>
        </div>

        {/* Country */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <input
            type="text"
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Country"
            required
          />
        </div>

        {/* Location Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleGeocodeFromAddress}
            disabled={isGeocoding || !isAddressComplete}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGeocoding ? 'Finding Location...' : '📍 Get Location from Address'}
          </button>
          
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isGeocoding}
            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGeocoding ? 'Getting Location...' : '📱 Use My Current Location'}
          </button>
        </div>

        {/* Default Address Checkbox */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isDefault"
            name="isDefault"
            checked={formData.isDefault}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
            Set as default address
          </label>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Adding Address...' : 'Add Address'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
