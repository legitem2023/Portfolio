import { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_ADDRESS } from '../graphql/mutation';
import { useSession } from "next-auth/react";
import { 
  MapPin, X, AlertTriangle, CheckCircle, Loader2, 
  Home, Briefcase, CreditCard, Package, Navigation,
  User, Phone, Map, Building, Globe, CheckSquare, Info
} from 'lucide-react';

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
      <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-3 text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  const getAddressTypeIcon = (type: string) => {
    switch(type) {
      case 'HOME': return <Home className="w-4 h-4" />;
      case 'WORK': return <Briefcase className="w-4 h-4" />;
      case 'BILLING': return <CreditCard className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header - Reduced padding for mobile */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white/10 rounded-lg">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Add New Address</h2>
              <p className="text-blue-100 text-xs sm:text-sm mt-0.5">Location verification required</p>
            </div>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-1.5 sm:p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Form Content - Reduced padding for mobile */}
      <div className="px-4 py-4 sm:px-6 sm:py-6">
        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && session?.serverToken && (
          <div className="mb-3 p-2 bg-gray-100 rounded text-xs text-gray-600 truncate">
            Token: {session.serverToken.substring(0, 50)}...
          </div>
        )}

        {/* Location Required Banner - Compact for mobile */}
        {(!formData.lat || !formData.lng) && (
          <div className="mb-3 p-3 bg-red-50 border-2 border-red-400 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-bold text-red-800">Location Required</h3>
                <p className="text-xs text-red-700 mt-0.5">
                  You must provide your current location to add an address.
                </p>
              </div>
            </div>
          </div>
        )}

{(formData.lat || formData.lng) && (
  <div className="mb-3 p-3 bg-blue-50 border-2 border-blue-400 rounded-lg">
    <div className="flex items-start gap-2">
      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="text-sm font-bold text-blue-800">Complete Your Address</h3>
        <p className="text-xs text-blue-700 mt-0.5">
          If you reside in an apartment, condominium, or multi-unit building, please edit and provide your full address including unit, suite, or house number.
        </p>
      </div>
    </div>
  </div>
)}

        
        {/* Location Success - Compact */}
        {formData.lat && formData.lng && (
          <div className="mb-3 p-2 bg-green-50 border border-green-300 rounded-lg">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xs sm:text-sm text-green-700">✓ Location verified</span>
              </div>
              <div className="text-xs text-green-600 font-mono">
                {formData.lat.toFixed(4)}°, {formData.lng.toFixed(4)}°
              </div>
            </div>
          </div>
        )}

        {/* Location Button - Responsive padding */}
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isGeocoding}
          className={`
            w-full py-3 px-4 rounded-lg font-semibold text-white shadow-md transition-all mb-4
            ${!formData.lat || !formData.lng 
              ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 animate-pulse' 
              : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
            }
            ${isGeocoding ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          `}
        >
          {isGeocoding ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">
                {locationStep === 'getting-location' && 'Getting your location...'}
                {locationStep === 'reverse-geocoding' && 'Converting to address...'}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Navigation className="w-4 h-4" />
              <span className="text-sm">
                {!formData.lat || !formData.lng 
                  ? '🔴 GET MY CURRENT LOCATION (REQUIRED)' 
                  : '✅ UPDATE MY LOCATION'}
              </span>
            </div>
          )}
        </button>

        {/* Error Messages - Compact */}
        {locationError && (
          <div className="mb-3 p-2 bg-red-50 border-l-4 border-red-500 rounded text-xs text-red-700">
            {locationError}
          </div>
        )}

        {error && (
          <div className="mb-3 p-2 bg-red-50 border-l-4 border-red-500 rounded text-xs text-red-700">
            Error: {error.message}
          </div>
        )}

        {/* Form - Compact spacing for mobile */}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className={(!formData.lat || !formData.lng) ? 'opacity-50 pointer-events-none' : ''}>
            {/* Address Type */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                Address Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="HOME">🏠 Home</option>
                <option value="WORK">💼 Work</option>
                <option value="BILLING">💰 Billing</option>
                <option value="SHIPPING">📦 Shipping</option>
              </select>
            </div>

            {/* Two Column Layout - Stack on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                  Receiver Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="receiver"
                    value={formData.receiver}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Full name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+63 912 345 6789"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Street Address */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                Street Address *
              </label>
              <div className="relative">
                <Map className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="House number and street name"
                  required
                />
              </div>
            </div>

            {/* City, State, ZIP - Responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                  City *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="City"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                  State/Province *
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="State"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ZIP code"
                  required
                />
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                Country *
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Country"
                  required
                />
              </div>
            </div>

            {/* Default Address Checkbox */}
            <div className="flex items-center gap-3 pt-2 mb-4">
              <input
                type="checkbox"
                id="isDefault"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="isDefault" className="text-xs sm:text-sm text-gray-700 flex items-center gap-1">
                <CheckSquare className="w-3.5 h-3.5" />
                Set as default address
              </label>
            </div>
          </div>

          {/* Submit Buttons - Stack on mobile */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3">
            <button
              type="submit"
              disabled={loading || !formData.lat || !formData.lng}
              className={`
                flex-1 py-2.5 px-4 rounded-lg font-medium transition-all text-sm
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
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-all font-medium text-sm"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Warning Message - Compact */}
          {(!formData.lat || !formData.lng) && (
            <div className="text-center p-2 bg-yellow-50 rounded-lg">
              <p className="text-xs text-yellow-800">
                🔴 You must click <strong>GET MY CURRENT LOCATION</strong> before saving this address
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
            }
