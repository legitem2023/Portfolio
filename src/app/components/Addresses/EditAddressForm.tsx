// components/Addresses/EditAddressForm.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { useSession } from 'next-auth/react';
import { UPDATE_ADDRESS } from '../graphql/mutation';
import { showToast } from '../../../../utils/toastify';
import { 
  MapPin, X, AlertTriangle, CheckCircle, Loader2, 
  Home, Briefcase, CreditCard, Package, Navigation,
  User, Phone, Map, Building, Globe, CheckSquare,
  LocateFixed
} from 'lucide-react';

interface Address {
  id: string;
  userId: string;
  type: string;
  receiver?: string;
  phone?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  lat?: number;
  lng?: number;
  createdAt: string;
}

interface EditAddressFormProps {
  userId: string;
  address: Address;
  onSuccess?: (result: any) => void;
  onCancel: () => void;
  onAddressUpdate?: () => void;
}

interface ReverseGeocodeResult {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const EditAddressForm: React.FC<EditAddressFormProps> = ({
  userId,
  address,
  onSuccess,
  onCancel,
  onAddressUpdate
}) => {
  const { update: updateSession } = useSession();
  const [updateAddress, { loading, error }] = useMutation(UPDATE_ADDRESS);
  
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationStep, setLocationStep] = useState<'idle' | 'getting-location' | 'reverse-geocoding' | 'complete'>('idle');
  
  const [formData, setFormData] = useState({
    type: address.type || 'home',
    receiver: address.receiver || '',
    phone: address.phone || '',
    street: address.street || '',
    city: address.city || '',
    state: address.state || '',
    zipCode: address.zipCode || '',
    country: address.country || 'Philippines',
    isDefault: address.isDefault || false,
    lat: address.lat || null,
    lng: address.lng || null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Address types for dropdown with icons
  const addressTypes = [
    { value: 'home', label: 'Home', icon: Home },
    { value: 'work', label: 'Work', icon: Briefcase },
    { value: 'shipping', label: 'Shipping', icon: Package },
    { value: 'billing', label: 'Billing', icon: CreditCard },
    { value: 'other', label: 'Other', icon: MapPin }
  ];

  // Countries list with Philippines included
  const countries = [
    { code: 'PH', name: 'Philippines' },
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'JP', name: 'Japan' },
    { code: 'CN', name: 'China' },
    { code: 'IN', name: 'India' },
    { code: 'BR', name: 'Brazil' },
    { code: 'MX', name: 'Mexico' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'KR', name: 'South Korea' },
    { code: 'SG', name: 'Singapore' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'TH', name: 'Thailand' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'ID', name: 'Indonesia' },
  ];

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
              errorMessage = 'Location permission denied. Please enable location access to update address.';
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
    setLocationStep('getting-location');
    setErrors(prev => ({ ...prev, location: '' }));
    
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
        country: address.country || prev.country
      }));
      
      setLocationStep('complete');
      
      // Clear any location errors
      setErrors(prev => ({ ...prev, location: '' }));
      
    } catch (err) {
      console.error('Location error:', err);
      setErrors({ location: err instanceof Error ? err.message : 'Failed to get location' });
    } finally {
      setIsGeocoding(false);
    }
  }, [getCurrentLocation, reverseGeocode]);

  // Helper function to handle update address response
  const handleUpdateResponse = (result: any) => {
    if (!result) {
      return { success: false, message: 'No response from server' };
    }

    const { statusText, token } = result;
    
    // Check if statusText is exactly "success"
    if (statusText === "success") {
      if (token) {
        return { 
          success: true, 
          message: 'Address updated and session synced successfully',
          hasToken: true,
          token: token
        };
      }
      return { 
        success: true, 
        message: 'Address updated successfully',
        hasToken: false 
      };
    }
    
    // If statusText is not "success", it's an error message
    // This could be things like "Cannot update address while there's an active transaction" etc.
    if (statusText && statusText !== "success") {
      return { 
        success: false, 
        message: statusText, // Show the actual error message from the server
        hasToken: false 
      };
    }
    
    // Fallback for any other case
    return { 
      success: false, 
      message: 'Failed to update address',
      hasToken: false 
    };
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.street.trim()) {
      newErrors.street = 'Street address is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    }
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }
    if (formData.phone && !/^[\d\s+()-]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checkbox.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const response = await updateAddress({
        variables: {
          input: {
            id: address.id,
            userId: userId,
            type: formData.type,
            receiver: formData.receiver,
            phone: formData.phone,
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country,
            isDefault: formData.isDefault,
            lat: formData.lat,
            lng: formData.lng,
          }
        }
      });

      const result = response.data?.updateAddress;
      
      // Process the response based on statusText
      const { success, message, hasToken, token } = handleUpdateResponse(result);
      
      if (success) {
        console.log("✅ Address updated successfully:", message);
        
        // If a new token was returned, update the session
        if (hasToken && token) {
          console.log("🔄 New token received, updating session...");
          await updateSession({
            serverToken: token
          });
          
          // Dispatch event for useAuth hook to refresh
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth-token-updated', {
              detail: { token: token }
            }));
          }
        }
        
        // Show success toast
        showToast(message, 'success');
        
        // Refresh addresses
        if (onAddressUpdate) {
          onAddressUpdate();
        }
        
        // Call success callback
        if (onSuccess) {
          onSuccess(result);
        }
        
        // Close form after short delay to show success message
        setTimeout(() => {
          onCancel();
        }, 1000);
      } else {
        // Show error toast with the actual error message from the server
        showToast(message, 'error');
        setErrors({ submit: message });
      }
      
    } catch (err: any) {
      console.error("❌ Failed to update address:", err);
      const errorMessage = err.message || 'Failed to update address';
      showToast(errorMessage, 'error');
      setErrors({ submit: errorMessage });
    }
  };

  const currentTypeIcon = addressTypes.find(t => t.value === formData.type)?.icon || MapPin;
  const TypeIcon = currentTypeIcon;

  // Check if location is provided
  const hasLocation = formData.lat && formData.lng;

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header - Matching AddressForm styling */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white/10 rounded-lg">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Edit Address</h2>
              <p className="text-blue-100 text-xs sm:text-sm mt-0.5">Update your address information</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 sm:p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Form Content - Matching AddressForm padding */}
      <div className="px-4 py-4 sm:px-6 sm:py-6">
        {/* Location Required Banner - Matching AddressForm style */}
        {!hasLocation && (
          <div className="mb-3 p-3 bg-red-50 border-2 border-red-400 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-bold text-red-800">Location Required</h3>
                <p className="text-xs text-red-700 mt-0.5">
                  You must provide your current location to update an address.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Location Success - Matching AddressForm style */}
        {hasLocation && (
          <div className="mb-3 p-2 bg-green-50 border border-green-300 rounded-lg">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xs sm:text-sm text-green-700">✓ Location verified</span>
              </div>
              <div className="text-xs text-green-600 font-mono">
                {formData.lat?.toFixed(6)}°, {formData.lng?.toFixed(6)}°
              </div>
            </div>
          </div>
        )}

        {/* Get Location Button - Matching AddressForm style */}
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isGeocoding}
          className={`
            w-full py-2.5 px-4 rounded-lg font-medium text-white shadow-sm transition-all
            ${!hasLocation && !isGeocoding
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-gray-600 hover:bg-gray-700'
            }
            ${isGeocoding ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            flex items-center justify-center gap-2
            mb-4
          `}
        >
          {isGeocoding ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                {locationStep === 'getting-location' && 'Getting your location...'}
                {locationStep === 'reverse-geocoding' && 'Converting to address...'}
              </span>
            </>
          ) : (
            <>
              <LocateFixed className="w-4 h-4" />
              <span>
                {!hasLocation 
                  ? '📍 Get Current Location' 
                  : '🔄 Update Location'}
              </span>
            </>
          )}
        </button>

        {/* Location Error - Matching AddressForm style */}
        {errors.location && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-600 text-sm flex-1">{errors.location}</p>
          </div>
        )}

        {/* Address Type - Matching AddressForm input styling */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address Type *
          </label>
          <div className="relative">
            <TypeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              {addressTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Receiver Name - Matching AddressForm input styling */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Receiver Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="receiver"
              value={formData.receiver}
              onChange={handleChange}
              placeholder="Full name of receiver"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Phone Number - Matching AddressForm input styling */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+63 912 345 6789"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
          )}
        </div>

        {/* Street Address - Matching AddressForm input styling */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Street Address *
          </label>
          <div className="relative">
            <Map className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="street"
              value={formData.street}
              onChange={handleChange}
              placeholder="123 Main Street"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {errors.street && (
            <p className="text-red-500 text-xs mt-1">{errors.street}</p>
          )}
        </div>

        {/* City and State Row - Matching AddressForm grid layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Makati City"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {errors.city && (
              <p className="text-red-500 text-xs mt-1">{errors.city}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State/Province *
            </label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="Metro Manila"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.state && (
              <p className="text-red-500 text-xs mt-1">{errors.state}</p>
            )}
          </div>
        </div>

        {/* ZIP Code and Country Row - Matching AddressForm grid layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ZIP Code *
            </label>
            <input
              type="text"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              placeholder="1200"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.zipCode && (
              <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country *
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">Select Country</option>
                {countries.map(country => (
                  <option key={country.code} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.country && (
              <p className="text-red-500 text-xs mt-1">{errors.country}</p>
            )}
          </div>
        </div>

        {/* Set as Default - Matching AddressForm checkbox styling */}
        <div className="flex items-center gap-3 pt-2 mb-4">
          <input
            type="checkbox"
            name="isDefault"
            id="isDefault"
            checked={formData.isDefault}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isDefault" className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <CheckSquare className="w-4 h-4" />
            Set as default address
          </label>
        </div>

        {/* Submit Error - Matching AddressForm style */}
        {errors.submit && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-600 text-sm flex-1">{errors.submit}</p>
          </div>
        )}

        {/* Mutation Error - Matching AddressForm style */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-600 text-sm flex-1">{error.message}</p>
          </div>
        )}

        {/* Form Actions - Matching AddressForm button styling */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Address'
            )}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditAddressForm;
