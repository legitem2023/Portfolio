import { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_ADDRESS } from '../graphql/mutation';
import { useSession } from "next-auth/react";

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
  phone: string;
  lat: number | null;
  lng: number | null;
}

interface ReverseGeocodeResult {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export default function AddressForm({ userId, onSuccess, onCancel, onAddressUpdate }: AddressFormProps) {
  const { data: session, update } = useSession();
  const [formData, setFormData] = useState<FormData>({
    type: 'HOME',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    isDefault: false,
    receiver: '',
    phone: '',
    lat: null,
    lng: null
  });

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationStep, setLocationStep] = useState<'idle' | 'getting-location' | 'reverse-geocoding' | 'complete'>('idle');
  
  const [createAddress, { loading, error }] = useMutation(CREATE_ADDRESS, {
    onError: (error) => {
      console.error('Mutation error:', error);
      setLocationError(error.message || 'Failed to save address. Please try again.');
    }
  });

  const reverseGeocodeWithGoogle = useCallback(async (lat: number, lng: number): Promise<ReverseGeocodeResult | null> => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return null;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const addressComponents = result.address_components;
        
        let street = '';
        let streetNumber = '';
        let route = '';
        let city = '';
        let state = '';
        let zipCode = '';
        let country = '';

        addressComponents.forEach((component: any) => {
          const types = component.types;
          
          if (types.includes('street_number')) {
            streetNumber = component.long_name;
          }
          if (types.includes('route')) {
            route = component.long_name;
          }
          if (types.includes('locality')) {
            city = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            state = component.short_name;
          }
          if (types.includes('postal_code')) {
            zipCode = component.long_name;
          }
          if (types.includes('country')) {
            country = component.long_name;
          }
        });

        if (streetNumber && route) {
          street = `${streetNumber} ${route}`;
        } else if (route) {
          street = route;
        }

        return {
          street: street || result.formatted_address.split(',')[0],
          city,
          state,
          zipCode,
          country
        };
      }
      return null;
    } catch (error) {
      console.error('Google reverse geocoding error:', error);
      return null;
    }
  }, []);

  const reverseGeocodeWithOSM = useCallback(async (lat: number, lng: number): Promise<ReverseGeocodeResult | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'VendorCity/1.0'
          }
        }
      );
      const data = await response.json();

      if (data && data.address) {
        const address = data.address;
        
        let street = '';
        
        if (address.road) {
          street = address.road;
          if (address.house_number) {
            street = `${address.house_number} ${street}`;
          }
        } else if (address.pedestrian) {
          street = address.pedestrian;
        } else if (address.footway) {
          street = address.footway;
        }

        return {
          street: street || data.display_name.split(',')[0],
          city: address.city || address.town || address.village || address.municipality || '',
          state: address.state || '',
          zipCode: address.postcode || '',
          country: address.country || ''
        };
      }
      return null;
    } catch (error) {
      console.error('OSM reverse geocoding error:', error);
      return null;
    }
  }, []);

  const getCurrentLocation = useCallback((): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
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
          let errorMessage = '';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access to add an address.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location unavailable. Please check your GPS or WiFi.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage = 'Failed to get your location. Please try again.';
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<ReverseGeocodeResult> => {
    setLocationStep('reverse-geocoding');
    
    const googleResult = await reverseGeocodeWithGoogle(lat, lng);
    if (googleResult) {
      return googleResult;
    }

    const osmResult = await reverseGeocodeWithOSM(lat, lng);
    if (osmResult) {
      return osmResult;
    }

    throw new Error('Could not get address from coordinates');
  }, [reverseGeocodeWithGoogle, reverseGeocodeWithOSM]);

  const handleGetCurrentLocation = useCallback(async () => {
    setIsGeocoding(true);
    setLocationError(null);
    setLocationStep('getting-location');
    
    try {
      const location = await getCurrentLocation();
      
      setFormData(prev => ({
        ...prev,
        lat: location.lat,
        lng: location.lng
      }));

      const address = await reverseGeocode(location.lat, location.lng);
      
      setFormData(prev => ({
        ...prev,
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country
      }));
      
      setLocationStep('complete');
      
    } catch (err) {
      console.error('Location error:', err);
      setLocationError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setIsGeocoding(false);
    }
  }, [getCurrentLocation, reverseGeocode]);

  const validateForm = useCallback((): boolean => {
    if (!formData.lat || !formData.lng) {
      setLocationError('⚠️ CURRENT LOCATION IS REQUIRED. Please click "Get My Current Location" button above.');
      return false;
    }

    if (!formData.receiver.trim()) {
      setLocationError('Please enter receiver name');
      return false;
    }
    
    if (!formData.phone.trim()) {
      setLocationError('Please enter phone number');
      return false;
    }
    
    if (!formData.street.trim()) {
      setLocationError('Please enter street address');
      return false;
    }
    
    if (!formData.city.trim()) {
      setLocationError('Please enter city');
      return false;
    }
    
    if (!formData.state.trim()) {
      setLocationError('Please enter state/province');
      return false;
    }
    
    if (!formData.zipCode.trim()) {
      setLocationError('Please enter ZIP code');
      return false;
    }
    
    if (!formData.country.trim()) {
      setLocationError('Please enter country');
      return false;
    }
    
    return true;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLocationError(null);
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const result = await createAddress({
        variables: {
          input: {
            userId,
            type: formData.type,
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country,
            isDefault: formData.isDefault,
            receiver: formData.receiver,
            phone: formData.phone,
            lat: formData.lat,
            lng: formData.lng
          },
        },
        context: {
          headers: {
            Authorization: `Bearer ${session?.serverToken}`,
          },
        },
      });

      if (result.data?.createAddress?.token) {
        const newToken = result.data.createAddress.token;
        
        console.log("New token received from address creation, updating session...");
        
        try {
          await update({
            ...session,
            serverToken: newToken,
          });
          
          console.log("Session successfully updated with new token");
        } catch (sessionError) {
          console.error("Failed to update session:", sessionError);
        }
      }

      onSuccess?.();
      onAddressUpdate?.();
      
    } catch (err: any) {
      console.error('Error creating address:', err);
      
      if (err.message?.includes("token") || err.message?.includes("unauthorized")) {
        setLocationError('Session expired. Please refresh the page and login again.');
      } else {
        setLocationError(err.message || 'Failed to save address. Please try again.');
      }
    }
  }, [createAddress, formData, onSuccess, onAddressUpdate, session, update, userId, validateForm]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (locationError && locationError.includes('CURRENT LOCATION')) {
      setLocationError(null);
    }
  }, [locationError]);

  if (!session) {
    return (
      <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 sm:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Add New Address</h2>
              <p className="text-blue-100 text-sm mt-1">Location verification required for delivery</p>
            </div>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="px-6 py-6 sm:px-8 sm:py-8">
        {/* Session Info (Debug - remove in production) */}
        {process.env.NODE_ENV === 'development' && session?.serverToken && (
          <div className="mb-4 p-2 bg-gray-100 rounded text-xs text-gray-600 truncate">
            Token: {session.serverToken.substring(0, 50)}...
          </div>
        )}

        {/* Location Required Banner */}
        {(!formData.lat || !formData.lng) && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-400 rounded-xl">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-bold text-red-800">Location Required</h3>
                <p className="text-sm text-red-700 mt-1">
                  You must provide your current location to add an address.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Location Success */}
        {formData.lat && formData.lng && (
          <div className="mb-4 p-3 bg-green-50 border border-green-300 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-green-700">✓ Location verified</span>
              </div>
              <div className="text-xs text-green-600">
                {formData.lat.toFixed(6)}°, {formData.lng.toFixed(6)}°
              </div>
            </div>
          </div>
        )}

        {/* Location Button */}
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isGeocoding}
          className={`
            w-full py-4 px-6 rounded-xl font-semibold text-white shadow-lg transition-all duration-200 mb-6
            ${!formData.lat || !formData.lng 
              ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 animate-pulse' 
              : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
            }
            ${isGeocoding ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          `}
        >
          {isGeocoding ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              <span>
                {locationStep === 'getting-location' && 'Getting your location...'}
                {locationStep === 'reverse-geocoding' && 'Converting to address...'}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span>
                {!formData.lat || !formData.lng 
                  ? '🔴 GET MY CURRENT LOCATION (REQUIRED)' 
                  : '✅ UPDATE MY LOCATION'}
              </span>
            </div>
          )}
        </button>

        {locationError && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
            <p className="text-sm text-red-700">{locationError}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
            <p className="text-sm text-red-700">Error: {error.message}</p>
          </div>
        )}

        {/* Form - Disabled until location is obtained */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className={(!formData.lat || !formData.lng) ? 'opacity-50 pointer-events-none' : ''}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Address Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="HOME">🏠 Home</option>
                <option value="WORK">💼 Work</option>
                <option value="BILLING">💰 Billing</option>
                <option value="SHIPPING">📦 Shipping</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Receiver Name *
                </label>
                <input
                  type="text"
                  name="receiver"
                  value={formData.receiver}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+63 912 345 6789"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Street Address *
              </label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="House number and street name"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="City"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  State/Province *
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="State"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ZIP code"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Country *
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Country"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDefault"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                Set as default address
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || !formData.lat || !formData.lng}
              className={`
                flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200
                ${formData.lat && formData.lng && !loading
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {!formData.lat || !formData.lng 
                ? '⚠️ GET LOCATION FIRST' 
                : loading 
                  ? 'Adding Address...' 
                  : '✓ Add Address'}
            </button>
            
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
            )}
          </div>

          {(!formData.lat || !formData.lng) && (
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                🔴 You must click <strong>GET MY CURRENT LOCATION</strong> before saving this address
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
        }
