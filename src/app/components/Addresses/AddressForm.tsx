// components/AddressForm.tsx
import { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_ADDRESS } from '../graphql/mutation';
import { useSession, getSession } from 'next-auth/react';
import { decryptToken } from '../../../../utils/decryptToken';

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

interface GeocodeResult {
  lat: number;
  lng: number;
}

interface ReverseGeocodeResult {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface UserData {
  userId: string;
  role: 'ADMINISTRATOR' | 'MANAGER' | 'RIDER' | 'USER';
  name?: string;
  email?: string;
  phone: string;
  image?: string;
  addresses: string[];
}

export default function AddressForm({ userId, onSuccess, onCancel, onAddressUpdate }: AddressFormProps) {
  const { data: session, update } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isSessionUpdating, setIsSessionUpdating] = useState(false);
  
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
  
  const [createAddress, { loading, error }] = useMutation(CREATE_ADDRESS);

  // Load current user data from session on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentSession = await getSession();
        if (currentSession?.serverToken) {
          await decryptAndUpdateUserData(currentSession.serverToken);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, []);

  // Function to decrypt and update user data (from your login pattern)
  const decryptAndUpdateUserData = async (serverToken: string) => {
    const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz";
    
    try {
      const decrypted = await decryptToken(serverToken, secret);
      
      const updatedUserData: UserData = {
        userId: decrypted.userId || '',
        role: decrypted.role || 'USER',
        phone: decrypted.phone || '',
        addresses: Array.isArray(decrypted.addresses) ? decrypted.addresses : [],
        name: decrypted.name,
        email: decrypted.email,
        image: decrypted.image
      };
      
      setUserData(updatedUserData);
      return updatedUserData;
      
    } catch (error: any) {
      console.error('❌ Failed to decrypt token:', error);
      throw error;
    }
  };

  // Function to refresh session after address creation
  const refreshSessionAfterAddressCreation = async () => {
    setIsSessionUpdating(true);
    try {
      const refreshedSession = await getSession();
      if (refreshedSession?.serverToken) {
        const updatedUser = await decryptAndUpdateUserData(refreshedSession.serverToken);
        
        // Update the NextAuth session with new data
        await update({
          ...session,
          user: updatedUser,
          serverToken: refreshedSession.serverToken,
        });
        
        console.log('✅ Session updated with new address data');
        return true;
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    } finally {
      setIsSessionUpdating(false);
    }
  };

  // Update local user data with new address
  const updateLocalUserDataWithAddress = (newAddressId: string) => {
    if (userData) {
      const updatedAddresses = [...userData.addresses, newAddressId];
      setUserData({
        ...userData,
        addresses: updatedAddresses
      });
    }
  };

  // COMPLETE geocoding functions (same as before)
  const reverseGeocodeWithGoogle = async (lat: number, lng: number): Promise<ReverseGeocodeResult | null> => {
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
  };

  const reverseGeocodeWithOSM = async (lat: number, lng: number): Promise<ReverseGeocodeResult | null> => {
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
  };

  // MAIN FUNCTION: Get current location (REQUIRED)
  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
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
  };

  // Reverse geocode to get address from coordinates
  const reverseGeocode = async (lat: number, lng: number): Promise<ReverseGeocodeResult> => {
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
  };

  // MAIN FUNCTION: Handle getting current location (REQUIRED)
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
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    // PRIMARY VALIDATION: Location is MANDATORY
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
            ...formData,
          },
        },
      });

      // Check if address was created successfully
      if (result.data?.createAddress?.success || result.data?.createAddress?.id) {
        const newAddressId = result.data.createAddress.id;
        
        // UPDATE LOCAL USER DATA with the new address
        updateLocalUserDataWithAddress(newAddressId);
        
        // REFRESH SESSION to get updated user data from server
        const sessionRefreshed = await refreshSessionAfterAddressCreation();
        
        if (sessionRefreshed) {
          console.log('✅ Session and user data updated successfully');
          
          // Show success message based on user role (like your login component)
          const roleMessage = userData?.role 
            ? `Redirecting to ${userData.role === 'ADMINISTRATOR' ? 'Management' : 
               userData.role === 'MANAGER' ? 'Management' : 
               userData.role === 'RIDER' ? 'Rider' : 'Home'}...`
            : 'Address added successfully!';
          
          setLocationError(null); // Clear any errors
          
          // Optional: Show temporary success message
          // You can add a toast notification here
        } else {
          console.warn('Address created but session refresh failed');
        }

        // Trigger callbacks
        onSuccess?.();
        onAddressUpdate?.();
      } else {
        throw new Error('Address creation failed');
      }
      
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
    
    if (locationError && locationError.includes('CURRENT LOCATION')) {
      setLocationError(null);
    }
  };

  // Get role badge color (from your login component)
  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'ADMINISTRATOR':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MANAGER':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'RIDER':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'USER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header - Updated to show role if available */}
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
              <p className="text-blue-100 text-sm mt-1">
                Location verification required for delivery
                {userData && (
                  <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(userData.role)}`}>
                    {userData.role}
                  </span>
                )}
              </p>
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
        {/* Session Update Status */}
        {isSessionUpdating && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-300 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-sm text-blue-700">Updating session with new address...</span>
            </div>
          </div>
        )}

        {/* Address Count Display - Shows how many addresses user has */}
        {userData && userData.addresses.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">📦 Total Addresses:</span>
              <span className="text-sm font-semibold text-gray-900">{userData.addresses.length}</span>
            </div>
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
              disabled={loading || !formData.lat || !formData.lng || isSessionUpdating}
              className={`
                flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200
                ${formData.lat && formData.lng && !loading && !isSessionUpdating
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {!formData.lat || !formData.lng 
                ? '⚠️ GET LOCATION FIRST' 
                : isSessionUpdating
                  ? '🔄 Updating Session...'
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
                🔴 You must click &qoute;<strong>GET MY CURRENT LOCATION</strong>&qoute; before saving this address
              </p>
            </div>
          )}

          {/* Success message after session update */}
          {!isSessionUpdating && userData && userData.addresses.length > 0 && (
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ You have {userData.addresses.length} address{userData.addresses.length !== 1 ? 'es' : ''} saved
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
