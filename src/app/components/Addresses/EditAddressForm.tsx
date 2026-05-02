// components/Addresses/EditAddressForm.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { useSession } from 'next-auth/react';
import { UPDATE_ADDRESS } from '../graphql/mutation';
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
  address,
  onSuccess,
  onCancel,
  onAddressUpdate
}) => {
  const { update: updateSession } = useSession();
  const [updateAddress, { loading, error }] = useMutation(UPDATE_ADDRESS);
  
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationStep, setLocationStep] = useState<'idle' | 'getting-location' | 'reverse-geocoding' | 'complete'>('idle');
  console.log(address);
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
            userId: address.userId,
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
      
      if (result?.statusText === "success") {
        console.log("✅ Address updated successfully");
        
        // If a new token was returned, update the session
        if (result?.token) {
          console.log("🔄 New token received, updating session...");
          await updateSession({
            serverToken: result.token
          });
          
          // Dispatch event for useAuth hook to refresh
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth-token-updated', {
              detail: { token: result.token }
            }));
          }
        }
        
        // Refresh addresses
        if (onAddressUpdate) {
          onAddressUpdate();
        }
        
        // Call success callback
        if (onSuccess) {
          onSuccess(result);
        }
        
        // Close form
        onCancel();
      }
      
    } catch (err: any) {
      console.error("❌ Failed to update address:", err);
      setErrors({ submit: err.message || 'Failed to update address' });
    }
  };

  const currentTypeIcon = addressTypes.find(t => t.value === formData.type)?.icon || MapPin;
  const TypeIcon = currentTypeIcon;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Edit Address</h3>
            <p className="text-sm text-gray-500 mt-1">Update your address information</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-4">
          {/* Location Section */}
          <div className="space-y-3">
            {/* Location Status */}
            {formData.lat && formData.lng && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-700">✓ Location verified</span>
                  </div>
                  <div className="text-xs text-green-600 font-mono">
                    {formData.lat?.toFixed(6)}°, {formData.lng?.toFixed(6)}°
                  </div>
                </div>
              </div>
            )}

            {/* Get Location Button */}
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isGeocoding}
              className={`
                w-full py-2.5 px-4 rounded-lg font-medium text-white shadow-sm transition-all
                ${(!formData.lat || !formData.lng) && !isGeocoding
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-600 hover:bg-gray-700'
                }
                ${isGeocoding ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                flex items-center justify-center gap-2
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
                    {!formData.lat || !formData.lng 
                      ? '📍 Get Current Location' 
                      : '🔄 Update Location'}
                  </span>
                </>
              )}
            </button>

            {/* Location Error */}
            {errors.location && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 text-sm flex-1">{errors.location}</p>
              </div>
            )}
          </div>

          {/* Address Type */}
          <div>
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

          {/* Receiver Name */}
          <div>
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

          {/* Phone Number */}
          <div>
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

          {/* Street Address */}
          <div>
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

          {/* City and State Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          {/* ZIP Code and Country Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          {/* Set as Default */}
          <div className="flex items-center gap-3 pt-2">
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

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm flex-1">{errors.submit}</p>
            </div>
          )}

          {/* Mutation Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm flex-1">{error.message}</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
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
      </form>
    </div>
  );
};

export default EditAddressForm;
