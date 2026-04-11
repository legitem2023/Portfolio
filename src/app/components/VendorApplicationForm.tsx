import React from 'react';
import { useState, useRef } from 'react';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import Header from './Header';
import Head from 'next/head';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// GraphQL Mutation
const VENDOR_SIGNUP = gql`
  mutation VendorSignup($input: VendorSignupInput!) {
    vendorSignup(input: $input) {
      success
      message
      token
      user {
        id
        email
        firstName
        lastName
        phone
        role
        isVendor
        vendorApplicationStatus
        businessName
        businessType
        productCategory
        businessDescription
        website
        businessAddress
        addressInstruction
        currentLatitude
        currentLongitude
        taxId
        createdAt
        updatedAt
      }
    }
  }
`;

interface Category {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  variantCount: number;
}

// Complete Signup + Vendor Application Data
interface SignupFormData {
  // Account Information
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  
  // Business Information
  businessName: string;
  phone: string;
  businessType: string;
  productCategory: string;
  businessDescription: string;
  website: string;
  
  // Location
  businessAddress: string;
  addressInstruction: string;
  currentLatitude: number | null;
  currentLongitude: number | null;
  
  // Tax Information
  taxId: string;
  
  // Agreement
  agreeTerms: boolean;
}

// Location Picker Component
const LocationPicker: React.FC<{
  onLocationSelect: (lat: number, lng: number, address: string) => void;
}> = ({ onLocationSelect }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [marker, setMarker] = useState<L.Marker | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  React.useEffect(() => {
    if (mapRef.current && !map) {
      const initialMap = L.map(mapRef.current).setView([40.7128, -74.0060], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(initialMap);
      
      initialMap.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        await reverseGeocode(lat, lng);
      });
      
      setMap(initialMap);
    }
  }, [map]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      const address = data.display_name || `${lat}, ${lng}`;
      
      if (marker) {
        marker.setLatLng([lat, lng]);
      } else if (map) {
        const newMarker = L.marker([lat, lng]).addTo(map);
        setMarker(newMarker);
      }
      
      onLocationSelect(lat, lng, address);
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      onLocationSelect(lat, lng, `${lat}, ${lng}`);
    }
  };

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          if (map) {
            map.setView([latitude, longitude], 15);
          }
          await reverseGeocode(latitude, longitude);
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please click on the map to select your address.');
          setIsLoadingLocation(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
      setIsLoadingLocation(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={isLoadingLocation}
          className="px-4 py-2 bg-gradient-to-r from-[#b79ad4] to-[#d0b0e8] text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 text-sm"
        >
          <i className={`fas ${isLoadingLocation ? 'fa-spinner fa-spin' : 'fa-location-dot'} mr-2`}></i>
          Use Current Location
        </button>
        <p className="text-xs text-[#6b5b7c] self-center">
          Or click on map to select location
        </p>
      </div>
      <div 
        ref={mapRef} 
        style={{ height: '300px', width: '100%' }}
        className="rounded-xl border border-[#d9c0e8] overflow-hidden"
      />
    </div>
  );
};

export default function VendorSignupForm() {
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    businessName: '',
    phone: '',
    businessType: '',
    productCategory: '',
    businessDescription: '',
    website: '',
    businessAddress: '',
    addressInstruction: '',
    currentLatitude: null,
    currentLongitude: null,
    taxId: '',
    agreeTerms: false,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [passwordError, setPasswordError] = useState('');
  const [submitError, setSubmitError] = useState('');

  // GraphQL Mutation hook
  const [vendorSignup, { loading: isSubmitting }] = useMutation(VENDOR_SIGNUP);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Clear password error when typing
    if (name === 'password' || name === 'confirmPassword') {
      setPasswordError('');
    }
    
    // Clear submit error when user makes changes
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setFormData(prev => ({
      ...prev,
      currentLatitude: lat,
      currentLongitude: lng,
      businessAddress: address
    }));
  };

  const validatePasswords = () => {
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswords()) {
      return;
    }
    
    try {
      const { data } = await vendorSignup({
        variables: {
          input: {
            // Account info
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            
            // Business info
            businessName: formData.businessName,
            phone: formData.phone,
            businessType: formData.businessType,
            productCategory: formData.productCategory,
            businessDescription: formData.businessDescription,
            website: formData.website || null,
            
            // Location info
            businessAddress: formData.businessAddress,
            addressInstruction: formData.addressInstruction || null,
            currentLatitude: formData.currentLatitude,
            currentLongitude: formData.currentLongitude,
            
            // Tax info
            taxId: formData.taxId,
          }
        }
      });
      
      if (data.vendorSignup.success) {
        // Store token if needed
        if (data.vendorSignup.token) {
          localStorage.setItem('token', data.vendorSignup.token);
          localStorage.setItem('user', JSON.stringify(data.vendorSignup.user));
        }
        
        // Show success message and redirect
        alert(data.vendorSignup.message);
        
        // Redirect to login or dashboard
        setTimeout(() => {
          window.location.href = '/login?registered=true';
        }, 2000);
      } else {
        setSubmitError(data.vendorSignup.message);
      }
      
    } catch (error: any) {
      console.error('Signup error:', error);
      setSubmitError(error.message || 'Registration failed. Please try again.');
    }
  };

  const nextStep = () => {
    // Validate current step before proceeding
    if (currentStep === 1) {
      if (!formData.email || !formData.password || !formData.confirmPassword || !formData.firstName || !formData.lastName) {
        alert('Please fill in all account information fields');
        return;
      }
      if (!validatePasswords()) return;
    }
    
    if (currentStep === 2) {
      if (!formData.businessName || !formData.phone || !formData.businessType || !formData.productCategory || !formData.businessDescription) {
        alert('Please fill in all business information fields');
        return;
      }
    }
    
    if (currentStep === 3) {
      if (!formData.businessAddress || !formData.taxId) {
        alert('Please fill in location and tax information');
        return;
      }
    }
    
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Head>
        <title>Vendor Signup | VendorCity</title>
        <meta name="description" content="Create your vendor account on VendorCity" />
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white/80 backdrop-blur-sm shadow-2xl border border-white/40 overflow-hidden rounded-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#b79ad4] to-[#dac0f0] px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <i className="fas fa-store text-white text-3xl"></i>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Vendor Registration</h1>
                    <p className="text-[#f8f0ff] text-sm mt-1 opacity-90">Create your vendor account</p>
                  </div>
                </div>
                <div className="text-white font-semibold">
                  Step {currentStep} of {totalSteps}
                </div>
              </div>
              {/* Progress Bar */}
              <div className="mt-4 bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
              {/* Step 1: Account Information */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  <h2 className="text-2xl font-semibold text-[#4a3f5c]">Account Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#4a3f5c] mb-2">
                        First Name <span className="text-[#b279d6]">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-[#d9c0e8] bg-white/60 focus:bg-white focus:ring-2 focus:ring-[#b38fd9] focus:border-transparent outline-none transition-all"
                        placeholder="John"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#4a3f5c] mb-2">
                        Last Name <span className="text-[#b279d6]">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-[#d9c0e8] bg-white/60 focus:bg-white focus:ring-2 focus:ring-[#b38fd9] focus:border-transparent outline-none transition-all"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#4a3f5c] mb-2">
                      Email Address <span className="text-[#b279d6]">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-[#d9c0e8] bg-white/60 focus:bg-white focus:ring-2 focus:ring-[#b38fd9] focus:border-transparent outline-none transition-all"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#4a3f5c] mb-2">
                        Password <span className="text-[#b279d6]">*</span>
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-[#d9c0e8] bg-white/60 focus:bg-white focus:ring-2 focus:ring-[#b38fd9] focus:border-transparent outline-none transition-all"
                        placeholder="Minimum 6 characters"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#4a3f5c] mb-2">
                        Confirm Password <span className="text-[#b279d6]">*</span>
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-[#d9c0e8] bg-white/60 focus:bg-white focus:ring-2 focus:ring-[#b38fd9] focus:border-transparent outline-none transition-all"
                        placeholder="Confirm your password"
                      />
                    </div>
                  </div>
                  
                  {passwordError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm">
                      <i className="fas fa-exclamation-circle mr-2"></i>
                      {passwordError}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Business Information */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-fadeIn">
                  <h2 className="text-2xl font-semibold text-[#4a3f5c]">Business Information</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#4a3f5c] mb-2">
                      Business Name <span className="text-[#b279d6]">*</span>
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-[#d9c0e8] bg-white/60 focus:bg-white focus:ring-2 focus:ring-[#b38fd9] focus:border-transparent outline-none transition-all"
                      placeholder="e.g., Lavender Dreams Boutique"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#4a3f5c] mb-2">
                      Phone Number <span className="text-[#b279d6]">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-[#d9c0e8] bg-white/60 focus:bg-white focus:ring-2 focus:ring-[#b38fd9] focus:border-transparent outline-none transition-all"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#4a3f5c] mb-2">
                        Business Type <span className="text-[#b279d6]">*</span>
                      </label>
                      <select
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-[#d9c0e8] bg-white/60 focus:bg-white focus:ring-2 focus:ring-[#b38fd9] focus:border-transparent outline-none transition-all"
                      >
                        <option value="">Select type</option>
                        <option value="retail">Retail / E-commerce</option>
                        <option value="handmade">Handmade / Crafts</option>
                        <option value="food">Food & Beverage</option>
                        <option value="service">Service Provider</option>
                        <option value="art">Art / Photography</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#4a3f5c] mb-2">
                        Product Category <span className="text-[#b279d6]">*</span>
                      </label>
                      <input
                        type="text"
                        name="productCategory"
                        value={formData.productCategory}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-[#d9c0e8] bg-white/60 focus:bg-white focus:ring-2 focus:ring-[#b38fd9] focus:border-transparent outline-none transition-all"
                        placeholder="e.g., Jewelry, Home Decor, Bakery"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#4a3f5c] mb-2">
                      Business Description <span className="text-[#b279d6]">*</span>
                    </label>
                    <textarea
                      name="businessDescription"
                      value={formData.businessDescription}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-[#d9c0e8] bg-white/60 focus:bg-white focus:ring-2 focus:ring-[#b38fd9] focus:border-transparent outline-none transition-all resize-none"
                      placeholder="Tell us about your products, story, and what makes you unique..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#4a3f5c] mb-2">
                      Website / Social Media
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-[#d9c0e8] bg-white/60 focus:bg-white focus:ring-2 focus:ring-[#b38fd9] focus:border-transparent outline-none transition-all"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Location & Tax Information */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <h2 className="text-2xl font-semibold text-[#4a3f5c]">Location & Tax Information</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#4a3f5c] mb-2">
                      Business Location <span className="text-[#b279d6]">*</span>
                    </label>
                    <LocationPicker onLocationSelect={handleLocationSelect} />
                  </div>

                  {formData.businessAddress && (
                    <div>
                      <label className="block text-sm font-medium text-[#4a3f5c] mb-2">
                        Detected Address
                      </label>
                      <input
                        type="text"
                        value={formData.businessAddress}
                        readOnly
                        className="w-full px-4 py-3 rounded-xl border border-[#d9c0e8] bg-gray-50 text-gray-700"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-[#4a3f5c] mb-2">
                      Address Instructions (Optional)
                    </label>
                    <textarea
                      name="addressInstruction"
                      value={formData.addressInstruction}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-[#d9c0e8] bg-white/60 focus:bg-white focus:ring-2 focus:ring-[#b38fd9] focus:border-transparent outline-none transition-all"
                      placeholder="e.g., Building number, floor, apartment, suite, landmark, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#4a3f5c] mb-2">
                      Tax ID / EIN <span className="text-[#b279d6]">*</span>
                    </label>
                    <input
                      type="text"
                      name="taxId"
                      value={formData.taxId}
                      onChange={handleChange}
                      required
                      placeholder="XX-XXXXXXX"
                      className="w-full px-4 py-3 rounded-xl border border-[#d9c0e8] bg-white/60 focus:bg-white focus:ring-2 focus:ring-[#b38fd9] focus:border-transparent outline-none transition-all"
                    />
                    <p className="text-xs text-[#6b5b7c] mt-1">
                      For sole proprietors, you can use your SSN
                    </p>
                  </div>

                  {formData.currentLatitude && formData.currentLongitude && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                      <p className="text-sm text-green-700">
                        <i className="fas fa-map-marker-alt mr-2"></i>
                        Coordinates captured: {formData.currentLatitude.toFixed(6)}, {formData.currentLongitude.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Agreement & Submit */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-fadeIn">
                  <h2 className="text-2xl font-semibold text-[#4a3f5c]">Review & Agree</h2>
                  
                  <div className="bg-gray-50 rounded-xl p-6 space-y-3">
                    <h3 className="font-semibold text-[#4a3f5c]">Account Summary</h3>
                    <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                    <p><strong>Email:</strong> {formData.email}</p>
                    <p><strong>Business:</strong> {formData.businessName}</p>
                    <p><strong>Business Type:</strong> {formData.businessType}</p>
                    <p><strong>Phone:</strong> {formData.phone}</p>
                    {formData.website && <p><strong>Website:</strong> {formData.website}</p>}
                    <p><strong>Location:</strong> {formData.businessAddress || 'Not set'}</p>
                    <p><strong>Tax ID:</strong> {formData.taxId}</p>
                  </div>
                  
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      required
                      className="mt-1 w-5 h-5 rounded border-[#d9c0e8] text-[#b38fd9] focus:ring-[#b38fd9]"
                    />
                    <span className="text-sm text-[#4a3f5c]">
                      I confirm that all information provided is accurate and I agree to the 
                      <a href="#" className="text-[#9b6fc7] hover:text-[#7b4fa3] underline mx-1">Vendor Terms & Conditions</a>
                      <span className="text-[#b279d6]">*</span>
                    </span>
                  </label>

                  {submitError && (
                    <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                      <i className="fas fa-exclamation-circle text-red-600"></i>
                      <span>{submitError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4 pt-6">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                  >
                    <i className="fas fa-arrow-left mr-2"></i>
                    Previous
                  </button>
                )}
                
                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 bg-gradient-to-r from-[#b79ad4] to-[#d0b0e8] hover:from-[#a987c4] hover:to-[#c29fdb] text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    Next
                    <i className="fas fa-arrow-right ml-2"></i>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.agreeTerms}
                    className="flex-1 bg-gradient-to-r from-[#b79ad4] to-[#d0b0e8] hover:from-[#a987c4] hover:to-[#c29fdb] text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-user-plus mr-2"></i>
                        Register as Vendor
                      </>
                    )}
                  </button>
                )}
              </div>
              
              <p className="text-center text-xs text-[#6b5b7c]">
                Already have an account? <a href="/login" className="text-[#9b6fc7] hover:underline">Sign in</a>
              </p>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
