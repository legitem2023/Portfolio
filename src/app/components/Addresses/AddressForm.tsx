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
  const [activeApi, setActiveApi] = useState<'google' | 'osm'>('google');
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [isFetchingIp, setIsFetchingIp] = useState(false);
  const [locationStep, setLocationStep] = useState<'idle' | 'fetching-ip' | 'getting-location' | 'reverse-geocoding' | 'complete'>('idle');
  const [isExpanded, setIsExpanded] = useState(false);
  const [createAddress, { loading, error }] = useMutation(CREATE_ADDRESS);

  // ============ IP ADDRESS FETCHING ============
  const fetchIpAddress = async (): Promise<string | null> => {
    setIsFetchingIp(true);
    setLocationStep('fetching-ip');
    try {
      // Using multiple IP services for redundancy
      const services = [
        'https://api.ipify.org?format=json',
        'https://api.myip.com',
        'https://ipapi.co/json/'
      ];
      
      for (const service of services) {
        try {
          const response = await fetch(service);
          const data = await response.json();
          
          // Handle different response formats
          if (data.ip) {
            setIpAddress(data.ip);
            return data.ip;
          } else if (data.ip_address) {
            setIpAddress(data.ip_address);
            return data.ip_address;
          }
        } catch (e) {
          console.log(`Failed to fetch from ${service}, trying next...`);
        }
      }
      
      throw new Error('Could not fetch IP address from any service');
    } catch (error) {
      console.error('Error fetching IP address:', error);
      setLocationError('Could not fetch IP address. Please check your network connection or manually enter your address.');
      return null;
    } finally {
      setIsFetchingIp(false);
    }
  };

  // ============ GOOGLE MAPS API METHODS ============
  const geocodeWithGoogle = async (address: string): Promise<GeocodeResult | null> => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.log('Google Maps API key missing, skipping...');
      return null;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        setActiveApi('google');
        return { lat, lng };
      }
      return null;
    } catch (error) {
      console.error('Google geocoding error:', error);
      return null;
    }
  };

  const reverseGeocodeWithGoogle = async (lat: number, lng: number): Promise<ReverseGeocodeResult | null> => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.log('Google Maps API key missing, skipping...');
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
        let city = '';
        let state = '';
        let zipCode = '';
        let country = '';

        addressComponents.forEach((component: any) => {
          const types = component.types;
          
          if (types.includes('street_number')) {
            street = component.long_name + ' ' + street;
          }
          if (types.includes('route')) {
            street += component.long_name;
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

        street = street.trim();
        setActiveApi('google');
        
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

  // ============ OPENSTREETMAP (NOMINATIM) API METHODS ============
  const geocodeWithOSM = async (address: string): Promise<GeocodeResult | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'VendorCity/1.0'
          }
        }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        setActiveApi('osm');
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('OSM geocoding error:', error);
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

        setActiveApi('osm');
        
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

  // ============ WRAPPER METHODS WITH FALLBACK ============
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number; api: string } | null> => {
    const googleResult = await geocodeWithGoogle(address);
    if (googleResult) {
      return { ...googleResult, api: 'google' };
    }

    const osmResult = await geocodeWithOSM(address);
    if (osmResult) {
      return { ...osmResult, api: 'osm' };
    }

    setLocationError('Could not find location for this address with any geocoding service');
    return null;
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<{ address: ReverseGeocodeResult; api: string } | null> => {
    setLocationStep('reverse-geocoding');
    
    const googleResult = await reverseGeocodeWithGoogle(lat, lng);
    if (googleResult) {
      return { address: googleResult, api: 'google' };
    }

    const osmResult = await reverseGeocodeWithOSM(lat, lng);
    if (osmResult) {
      return { address: osmResult, api: 'osm' };
    }

    setLocationError('Could not get address from location with any geocoding service');
    return null;
  };

  // Get current device location
  const getCurrentLocation = async (): Promise<{ lat: number; lng: number } | null> => {
    setLocationStep('getting-location');
    
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
          let errorMessage = 'Could not get your current location. ';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Please enable location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage += 'Please enable location services.';
          }
          
          setLocationError(errorMessage);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  const handleGeocodeFromAddress = async () => {
    const fullAddress = `${formData.street}, ${formData.city}, ${formData.state} ${formData.zipCode}, ${formData.country}`;
    
    setIsGeocoding(true);
    setLocationError(null);
    setLocationStep('getting-location');
    
    try {
      const location = await geocodeAddress(fullAddress);
      if (location) {
        setFormData(prev => ({
          ...prev,
          lat: location.lat,
          lng: location.lng
        }));
        setLocationStep('complete');
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleGetCurrentLocation = async () => {
    setIsGeocoding(true);
    setLocationError(null);
    
    try {
      // Step 1: Fetch IP address (required for location verification)
      const ip = await fetchIpAddress();
      
      if (!ip) {
        // If IP fetch fails, still try to get location but show warning
        setLocationError('Warning: Could not verify IP address. Location accuracy may be affected.');
      }

      // Step 2: Get current coordinates
      const location = await getCurrentLocation();
      if (location) {
        // Set coordinates immediately
        setFormData(prev => ({
          ...prev,
          lat: location.lat,
          lng: location.lng
        }));

        // Step 3: Get address from coordinates
        const result = await reverseGeocode(location.lat, location.lng);
        if (result) {
          setFormData(prev => ({
            ...prev,
            ...result.address,
            lat: location.lat,
            lng: location.lng
          }));
          setLocationStep('complete');
        }
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

  // Get step message based on current location step
  const getLocationStepMessage = () => {
    switch(locationStep) {
      case 'fetching-ip':
        return '🔍 Detecting IP address...';
      case 'getting-location':
        return '📍 Getting current location...';
      case 'reverse-geocoding':
        return '🏠 Converting to address...';
      case 'complete':
        return '✅ Location detected!';
      default:
        return '';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Add New Address</h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Error Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm sm:text-base">
          Error: {error.message}
        </div>
      )}

      {locationError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm sm:text-base">
          {locationError}
        </div>
      )}

      {/* Location Status Indicator - Mobile Optimized */}
      {isGeocoding && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg animate-pulse">
          <div className="flex items-center">
            <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mr-2 sm:mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm sm:text-base text-blue-700 font-medium truncate">{getLocationStepMessage()}</span>
          </div>
        </div>
      )}

      {/* IP Address and Location Notice - Collapsible on Mobile */}
      <div className="mb-4 sm:mb-6">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full lg:hidden flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg"
        >
          <span className="text-sm font-semibold text-blue-800 flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How location detection works
          </span>
          <svg className={`h-5 w-5 text-blue-600 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Expanded content on mobile, always visible on desktop */}
        <div className={`${isExpanded ? 'block' : 'hidden'} lg:block mt-2 lg:mt-0`}>
          <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-start">
              <div className="hidden sm:block flex-shrink-0 sm:mr-3">
                <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm sm:text-base font-semibold text-blue-800 mb-2 sm:mb-3">
                  📍 How to use &quot;Auto-fill from Current Location&quot;
                </h3>
                
                {/* Step indicators - Vertical on mobile, horizontal on desktop */}
                <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-2 text-sm text-blue-700">
                  <div className="flex items-start sm:flex-1">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-800 mr-2">1</span>
                    <div>
                      <p className="font-medium">IP Detection</p>
                      <p className="text-xs text-blue-600 mt-0.5">Verify your region</p>
                    </div>
                  </div>
                  
                  <div className="hidden sm:block text-blue-300">→</div>
                  <div className="sm:hidden border-l-2 border-blue-200 ml-2.5 h-2"></div>
                  
                  <div className="flex items-start sm:flex-1">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-800 mr-2">2</span>
                    <div>
                      <p className="font-medium">GPS Location</p>
                      <p className="text-xs text-blue-600 mt-0.5">Get precise coordinates</p>
                    </div>
                  </div>
                  
                  <div className="hidden sm:block text-blue-300">→</div>
                  <div className="sm:hidden border-l-2 border-blue-200 ml-2.5 h-2"></div>
                  
                  <div className="flex items-start sm:flex-1">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-800 mr-2">3</span>
                    <div>
                      <p className="font-medium">Auto-fill</p>
                      <p className="text-xs text-blue-600 mt-0.5">Complete address</p>
                    </div>
                  </div>
                </div>

                {/* IP Address Display */}
                {ipAddress && (
                  <div className="mt-3 p-2 bg-green-100 rounded-md">
                    <p className="text-xs text-green-800 flex items-center">
                      <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="truncate">IP: <span className="font-mono">{ipAddress}</span></span>
                    </p>
                  </div>
                )}

                {/* Requirements - Mobile optimized */}
                <div className="mt-3 p-2 bg-yellow-50 rounded-md border border-yellow-200">
                  <p className="text-xs font-medium text-yellow-800 mb-1">⚠️ Requirements:</p>
                  <ul className="text-xs text-yellow-700 list-disc list-inside">
                    <li className="truncate">Internet connection</li>
                    <li className="truncate">Location services enabled</li>
                    <li className="truncate">Allow location access</li>
                  </ul>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  🔒 IP used only for verification, not stored
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active API indicator */}
      {formData.lat && formData.lng && activeApi && (
        <div className="mb-4 p-2 bg-blue-50 border border-blue-200 text-blue-700 rounded text-xs">
          🗺️ Location by: {activeApi === 'google' ? 'Google Maps' : 'OpenStreetMap'}
        </div>
      )}

      {/* Display coordinates - Mobile Optimized */}
      {formData.lat && formData.lng && (
        <div className="mb-4 p-2 sm:p-3 bg-green-100 border border-green-400 text-green-700 rounded flex items-center justify-between">
          <span className="text-xs sm:text-sm truncate mr-2">
            <span className="hidden xs:inline">📍</span> {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
          </span>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, lat: null, lng: null }))}
            className="flex-shrink-0 text-green-700 hover:text-green-900 font-bold p-1"
            title="Clear location"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Address Type */}
        <div>
          <label htmlFor="type" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Address Type
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <label htmlFor="receiver" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Receiver Name
          </label>
          <input
            type="text"
            id="receiver"
            name="receiver"
            value={formData.receiver}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter receiver name"
            required
          />
        </div>

        {/* Phone Field */}
        <div>
          <label htmlFor="phone" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="+63 912 345 6789"
            required
          />
          <p className="mt-1 text-xs text-gray-500">Include country code</p>
        </div>

        {/* Street Address */}
        <div>
          <label htmlFor="street" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Street Address
          </label>
          <input
            type="text"
            id="street"
            name="street"
            value={formData.street}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="123 Main St"
            required
          />
        </div>

        {/* City, State, Zip Code - Stack on mobile, grid on tablet/desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label htmlFor="city" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="City"
              required
            />
          </div>

          <div>
            <label htmlFor="state" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="State"
              required
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="zipCode" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              ZIP Code
            </label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="12345"
              required
            />
          </div>
        </div>

        {/* Country */}
        <div>
          <label htmlFor="country" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <input
            type="text"
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Country"
            required
          />
        </div>

        {/* Location Buttons - Stack on mobile, side by side on tablet/desktop */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleGeocodeFromAddress}
            disabled={isGeocoding || !isAddressComplete}
            className="w-full sm:flex-1 bg-green-600 text-white py-3 sm:py-2 px-3 sm:px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
          >
            <span className="flex items-center justify-center">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">Get Location from Address</span>
            </span>
          </button>
          
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isGeocoding || isFetchingIp}
            className="w-full sm:flex-1 bg-purple-600 text-white py-3 sm:py-2 px-3 sm:px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
          >
            {isGeocoding || isFetchingIp ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="truncate">{isFetchingIp ? 'Detecting IP...' : 'Getting Location...'}</span>
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="truncate">Auto-fill Current Location</span>
              </span>
            )}
          </button>
        </div>

        {/* Help Text - Mobile Optimized */}
        <div className="text-xs text-gray-500 text-center px-2">
          <p className="truncate">
            Click &quot;Auto-fill&quot; to detect IP & GPS location
          </p>
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
          <label htmlFor="isDefault" className="ml-2 block text-xs sm:text-sm text-gray-700">
            Set as default address
          </label>
        </div>

        {/* Action Buttons - Stack on mobile, side by side on tablet/desktop */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-2 sm:pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:flex-1 bg-blue-600 text-white py-3 sm:py-2 px-3 sm:px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
          >
            {loading ? 'Adding...' : 'Add Address'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:flex-1 bg-gray-300 text-gray-700 py-3 sm:py-2 px-3 sm:px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
      }
