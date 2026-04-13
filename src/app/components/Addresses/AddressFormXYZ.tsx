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
  
  const [hasReadNote, setHasReadNote] = useState(false);
  const [showNotePrompt, setShowNotePrompt] = useState(false);
  const [addressNeedsManualCompletion, setAddressNeedsManualCompletion] = useState(false);
  const [autoFillAttempted, setAutoFillAttempted] = useState(false);
  
  const [createAddress, { loading, error }] = useMutation(CREATE_ADDRESS);

  const fetchIpAddress = async (): Promise<string | null> => {
    setIsFetchingIp(true);
    setLocationStep('fetching-ip');
    try {
      const services = [
        'https://api.ipify.org?format=json',
        'https://api.myip.com',
        'https://ipapi.co/json/'
      ];
      
      for (const service of services) {
        try {
          const response = await fetch(service);
          const data = await response.json();
          
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
        let streetNumber = '';
        let route = '';
        let city = '';
        let state = '';
        let zipCode = '';
        let country = '';
        let subpremise = '';
        let premise = '';

        addressComponents.forEach((component: any) => {
          const types = component.types;
          
          if (types.includes('street_number')) {
            streetNumber = component.long_name;
          }
          if (types.includes('route')) {
            route = component.long_name;
          }
          if (types.includes('subpremise')) {
            subpremise = component.long_name;
          }
          if (types.includes('premise')) {
            premise = component.long_name;
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
        } else if (premise) {
          street = premise;
        }

        const hasDetailedAddress = streetNumber && route;
        const hasBuildingInfo = subpremise || premise;
        
        if (!hasDetailedAddress && hasBuildingInfo) {
          setAddressNeedsManualCompletion(true);
        }

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
        let hasHouseNumber = false;
        
        if (address.road) {
          street = address.road;
          if (address.house_number) {
            street = `${address.house_number} ${street}`;
            hasHouseNumber = true;
          }
        } else if (address.pedestrian) {
          street = address.pedestrian;
        } else if (address.footway) {
          street = address.footway;
        } else if (address.building) {
          street = address.building;
        }

        if (!hasHouseNumber && (address.building || address.apartments)) {
          setAddressNeedsManualCompletion(true);
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
    setAddressNeedsManualCompletion(false);
    
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
    if (!hasReadNote) {
      setShowNotePrompt(true);
      return;
    }

    if (isGeocoding || isFetchingIp) {
      return;
    }

    setAutoFillAttempted(true);
    setIsGeocoding(true);
    setLocationError(null);
    setAddressNeedsManualCompletion(false);
    
    try {
      const ip = await fetchIpAddress();
      
      if (!ip) {
        setLocationError('Warning: Could not verify IP address. Location accuracy may be affected.');
      }

      const location = await getCurrentLocation();
      if (location) {
        setFormData(prev => ({
          ...prev,
          lat: location.lat,
          lng: location.lng
        }));

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

  const handleAcknowledgeNote = () => {
    setHasReadNote(true);
    setShowNotePrompt(false);
    handleGetCurrentLocation();
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

  const getLocationStepMessage = () => {
    switch(locationStep) {
      case 'fetching-ip':
        return 'Detecting IP address...';
      case 'getting-location':
        return 'Getting current location...';
      case 'reverse-geocoding':
        return 'Converting to address...';
      case 'complete':
        return 'Location detected successfully!';
      default:
        return '';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 sm:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Add New Address</h2>
              <p className="text-blue-100 text-sm mt-1">Enter your delivery details below</p>
            </div>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 sm:px-8 sm:py-8">
        {/* Error Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700 text-sm">Error: {error.message}</span>
            </div>
          </div>
        )}

        {locationError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700 text-sm">{locationError}</span>
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="mb-6 bg-blue-50 rounded-xl overflow-hidden border border-blue-200">
          <div className="bg-blue-100 px-4 py-3 border-b border-blue-200">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-blue-900 text-sm">Location Auto-fill Guide</span>
            </div>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {/*<div className="flex items-start">
                <div className="flex-shrink-0 w-7 h-7 bg-blue-200 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-700 font-bold text-xs">1</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">IP Detection</p>
                  <p className="text-xs text-gray-600 mt-0.5">Verify your region</p>
                </div>
              </div>*/}
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-7 h-7 bg-blue-200 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-700 font-bold text-xs">1</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">GPS Location</p>
                  <p className="text-xs text-gray-600 mt-0.5">Get precise coordinates</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-7 h-7 bg-blue-200 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-700 font-bold text-xs">2</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Auto-fill Form</p>
                  <p className="text-xs text-gray-600 mt-0.5">Complete address fields</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-xs text-yellow-800">
                  <p className="font-semibold mb-1">Important Note:</p>
                  <p>For buildings, apartments, or complexes, you may need to manually add unit numbers or specific details after auto-fill.</p>
                </div>
              </div>
            </div>

            {hasReadNote && (
              <div className="mt-3 p-2 bg-green-50 rounded-lg flex items-center">
                <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs text-green-700">Requirements acknowledged</span>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isGeocoding && (
          <div className="mb-6 p-4 bg-blue-50 rounded-xl">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-700 text-sm font-medium">{getLocationStepMessage()}</span>
            </div>
          </div>
        )}

        {/* Address Warning */}
        {addressNeedsManualCompletion && (
          <div className="mb-6 p-4 bg-yellow-50 rounded-xl border-l-4 border-yellow-500">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-semibold text-yellow-800 text-sm">Manual Completion Required</p>
                <p className="text-xs text-yellow-700 mt-1">Please review and complete the street address with building/unit details.</p>
              </div>
            </div>
          </div>
        )}

        {/* Coordinates Display */}
        {formData.lat && formData.lng && (
          <div className="mb-6 p-3 bg-green-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span className="text-xs text-green-700 font-mono">
                {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, lat: null, lng: null }))}
              className="text-green-600 hover:text-green-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGeocodeFromAddress}
              disabled={isGeocoding || !isAddressComplete}
              className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              Get Location from Address
            </button>
            
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isGeocoding || isFetchingIp}
              className={`flex items-center justify-center px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium ${
                !hasReadNote 
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 focus:ring-orange-500 animate-pulse' 
                  : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 focus:ring-purple-500'
              }`}
            >
              {isGeocoding || isFetchingIp ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span>{isFetchingIp ? 'Detecting IP...' : 'Getting Location...'}</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>{!hasReadNote ? 'Read Guide First' : 'Auto-fill Location'}</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            {!hasReadNote ? (
              <p className="text-xs text-orange-600 font-medium">
                ⚠️ Please read the location guide above before using Auto-fill
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Click Auto-fill to detect your location automatically
              </p>
            )}
          </div>

          {/* Form Fields */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Address Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                Receiver Name
              </label>
              <input
                type="text"
                name="receiver"
                value={formData.receiver}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="+63 912 345 6789"
                required
              />
            </div>
          </div>

          <div className={addressNeedsManualCompletion ? 'relative' : ''}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Street Address
              {addressNeedsManualCompletion && (
                <span className="ml-2 text-xs text-yellow-600 font-normal">(Please complete)</span>
              )}
            </label>
            <input
              type="text"
              name="street"
              value={formData.street}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                addressNeedsManualCompletion ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
              }`}
              placeholder={addressNeedsManualCompletion ? "e.g., Unit 123, Building Name, Street..." : "House number and street name"}
              required
            />
            {addressNeedsManualCompletion && (
              <p className="mt-1 text-xs text-yellow-600">
                Please add apartment/unit number or building details
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="City"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                State/Province
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="State"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ZIP Code
              </label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="ZIP code"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Country
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            >
              {loading ? 'Adding Address...' : 'Add Address'}
            </button>
            
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Modal */}
      {showNotePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNotePrompt(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Important Information</h3>
              <p className="text-gray-600 text-sm mb-6">Before using Auto-fill location, please review the following:</p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="text-sm font-semibold text-blue-900 mb-2">📍 Location Process:</p>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li className="flex items-start">• GPS location for precise coordinates</li>
                  <li className="flex items-start">• Automatic address detection</li>
                </ul>
              </div>

              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                <p className="text-sm font-semibold text-yellow-900 mb-2">⚠️ Important Note:</p>
                <p className="text-sm text-yellow-800">
                  For buildings, apartments, or complexes, you may need to manually add unit numbers or specific details after auto-fill.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowNotePrompt(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAcknowledgeNote}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
          }
