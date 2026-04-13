import { useState, useEffect } from 'react';
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
  phone: string;
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
    phone: '',
    lat: null,
    lng: null
  });

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationStep, setLocationStep] = useState<'idle' | 'getting-location' | 'reverse-geocoding' | 'complete'>('idle');
  const [locationAttempted, setLocationAttempted] = useState(false);
  const [locationRequired, setLocationRequired] = useState(true);
  
  const [createAddress, { loading, error }] = useMutation(CREATE_ADDRESS);

  // Professional geocoding functions (keep your existing implementations)
  const geocodeWithGoogle = async (address: string) => { /* your existing code */ };
  const geocodeWithOSM = async (address: string) => { /* your existing code */ };
  const reverseGeocodeWithGoogle = async (lat: number, lng: number) => { /* your existing code */ };
  const reverseGeocodeWithOSM = async (lat: number, lng: number) => { /* your existing code */ };

  // Professional location getter with promise and retry logic
  const getCurrentLocation = (retryCount = 0): Promise<{ lat: number; lng: number }> => {
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
              if (retryCount < 2) {
                // Retry up to 2 times on timeout
                setTimeout(() => {
                  getCurrentLocation(retryCount + 1).then(resolve).catch(reject);
                }, 1000);
                return;
              }
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
  };

  // Professional reverse geocoding
  const reverseGeocode = async (lat: number, lng: number) => {
    setLocationStep('reverse-geocoding');
    
    const googleResult = await reverseGeocodeWithGoogle(lat, lng);
    if (googleResult) return googleResult;

    const osmResult = await reverseGeocodeWithOSM(lat, lng);
    if (osmResult) return osmResult;

    throw new Error('Could not get address from coordinates');
  };

  // MAIN FUNCTION: Force user to get current location
  const handleGetCurrentLocation = async () => {
    setIsGeocoding(true);
    setLocationError(null);
    setLocationStep('getting-location');
    
    try {
      // Force location retrieval
      const location = await getCurrentLocation();
      
      // Update coordinates
      setFormData(prev => ({
        ...prev,
        lat: location.lat,
        lng: location.lng
      }));

      // Get address from coordinates
      const address = await reverseGeocode(location.lat, location.lng);
      
      if (address) {
        setFormData(prev => ({
          ...prev,
          street: address.street,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
          country: address.country
        }));
      }
      
      setLocationStep('complete');
      setLocationAttempted(true);
      
    } catch (err) {
      console.error('Location error:', err);
      setLocationError(err instanceof Error ? err.message : 'Failed to get location');
      setLocationAttempted(false);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    // PRIMARY VALIDATION: Location is MANDATORY
    if (!formData.lat || !formData.lng) {
      setLocationError('⚠️ CURRENT LOCATION IS REQUIRED. Please click "Get My Current Location" button above.');
      return false;
    }

    // Other validations
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setLocationError(null);
    
    // Validate including location requirement
    if (!validateForm()) {
      return;
    }
    
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
      setLocationError('Failed to save address. Please try again.');
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
    
    // Clear location error when user starts typing
    if (locationError && locationError.includes('CURRENT LOCATION')) {
      setLocationError(null);
    }
  };

  const isAddressComplete = formData.street && formData.city && formData.state && formData.zipCode && formData.country;

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header with location requirement badge */}
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
              <p className="text-blue-100 text-sm mt-1">All fields marked with * are required</p>
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
        {/* PROFESSIONAL LOCATION REQUIRED SECTION */}
        <div className="mb-8">
          {/* Location Required Banner - Always visible until location is obtained */}
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
                    You must provide your current location to add an address. This helps ensure accurate delivery.
                  </p>
                  <p className="text-xs text-red-600 mt-2 font-mono">
                    ⚠️ Address cannot be saved without location coordinates
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Location Success Message */}
          {formData.lat && formData.lng && (
            <div className="mb-4 p-3 bg-green-50 border border-green-300 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-green-700">
                    ✓ Location obtained successfully
                  </span>
                </div>
                <div className="text-xs text-green-600 font-mono">
                  {formData.lat.toFixed(6)}°, {formData.lng.toFixed(6)}°
                </div>
              </div>
            </div>
          )}

          {/* Professional Location Button */}
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isGeocoding}
            className={`
              w-full py-4 px-6 rounded-xl font-semibold text-white shadow-lg transition-all duration-200
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

          {locationError && !locationError.includes('CURRENT LOCATION') && (
            <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-500 rounded">
              <p className="text-sm text-red-700">{locationError}</p>
            </div>
          )}
        </div>

        {/* Address Form - Disabled until location is obtained */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className={(!formData.lat || !formData.lng) ? 'opacity-50 pointer-events-none' : ''}>
            {/* Form Fields - Your existing form fields here */}
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

          {/* Final warning if trying to submit without location */}
          {(!formData.lat || !formData.lng) && (
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                🔴 You must click <strong>"GET MY CURRENT LOCATION"</strong> before you can save this address
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
