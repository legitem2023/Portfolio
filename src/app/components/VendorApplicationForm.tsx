// src/app/components/VendorApplicationForm.tsx
'use client';

import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import Header from './Header';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { GETCATEGORY } from './graphql/query'; // Import your existing query
import { AddressComponents } from './LocationPicker';
import { showToast } from '../../../utils/toastify';
// Dynamically import Leaflet with no SSR
const LocationPicker = dynamic(
  () => import('./LocationPicker'),
  { ssr: false, loading: () => <div className="h-[300px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">Loading map...</div> }
);

// GraphQL Mutation for Vendor Signup
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
        avatar
        emailVerified
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
  image: string;
  isActive: boolean;
  createdAt: string;
  variantCount: number;
}

interface SignupFormData {
  // Account Information
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  
  // Business Information
  businessName: string;
  businessType: string;
  productCategory: string;
  businessDescription: string;
  website: string;
  
  // Location - Full fields
  businessAddress: string;
  businessStreet: string;
  businessCity: string;
  businessState: string;
  businessCountry: string;
  businessZipcode: string;
  addressInstruction: string;
  currentLatitude: number | null;
  currentLongitude: number | null;
  
  // Tax Information
  taxId: string;
  
  // Agreement
  agreeTerms: boolean;
}

export default function VendorApplicationForm() {
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    businessName: '',
    businessType: '',
    productCategory: '',
    businessDescription: '',
    website: '',
    businessAddress: '',
    businessStreet: '',
    businessCity: '',
    businessState: '',
    businessCountry: '',
    businessZipcode: '',
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
  const [isMounted, setIsMounted] = useState(false);

  // GraphQL hooks
  const [vendorSignup, { loading: isSubmitting }] = useMutation(VENDOR_SIGNUP);
  const { loading: categoriesLoading, error: categoriesError, data: categoriesData } = useQuery(GETCATEGORY);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    if (name === 'password' || name === 'confirmPassword') {
      setPasswordError('');
    }
    
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleLocationSelect = (
    lat: number, 
    lng: number, 
    fullAddress: string, 
    addressComponents: AddressComponents
  ) => {
    setFormData(prev => ({
      ...prev,
      currentLatitude: lat,
      currentLongitude: lng,
      businessAddress: fullAddress,
      businessStreet: addressComponents.street,
      businessCity: addressComponents.city,
      businessState: addressComponents.state,
      businessCountry: addressComponents.country,
      businessZipcode: addressComponents.zipcode
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
            // Account Information
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            
            // Business Information
            businessName: formData.businessName,
            businessType: formData.businessType,
            productCategory: formData.productCategory,
            businessDescription: formData.businessDescription,
            website: formData.website || null,
            
            // Location Information - Send ALL address fields individually
            businessAddress: formData.businessAddress,
            businessStreet: formData.businessStreet,
            businessCity: formData.businessCity,
            businessState: formData.businessState,
            businessCountry: formData.businessCountry,
            businessZipcode: formData.businessZipcode,
            addressInstruction: formData.addressInstruction || null,
            currentLatitude: formData.currentLatitude,
            currentLongitude: formData.currentLongitude,
            
            // Tax Information
            taxId: formData.taxId,
          }
        }
      });
      
      if (data.vendorSignup.success) {
         
        showToast(data.vendorSignup.message,'success');
        setTimeout(() => {
          window.location.href = '/Login';
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
    if (currentStep === 1) {
      if (!formData.email || !formData.password || !formData.confirmPassword || !formData.firstName || !formData.lastName || !formData.phone) {
        alert('Please fill in all account information fields');
        return;
      }
      if (!validatePasswords()) return;
    }
    
    if (currentStep === 2) {
      if (!formData.businessName || !formData.businessType || !formData.productCategory || !formData.businessDescription) {
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

  // Filter active categories
  const activeCategories = categoriesData?.categories?.filter((cat: Category) => cat.isActive) || [];

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white/80 backdrop-blur-sm shadow-2xl border border-white/40 overflow-hidden rounded-2xl">
            <div className="bg-gradient-to-r from-[#b79ad4] to-[#dac0f0] px-8 py-6">
              <div className="flex items-center gap-3">
                <i className="fas fa-store text-white text-3xl"></i>
                <div>
                  <h1 className="text-3xl font-bold text-white">Vendor Registration</h1>
                  <p className="text-[#f8f0ff] text-sm mt-1 opacity-90">Loading...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                      {categoriesLoading ? (
                        <div className="w-full px-4 py-3 rounded-xl border border-[#d9c0e8] bg-gray-50 text-[#6b5b7c]">
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Loading categories...
                        </div>
                      ) : categoriesError ? (
                        <div className="w-full px-4 py-3 rounded-xl border border-red-300 bg-red-50 text-red-600">
                          Error loading categories
                        </div>
                      ) : (
                        <select
                          name="productCategory"
                          value={formData.productCategory}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-[#d9c0e8] bg-white/60 focus:bg-white focus:ring-2 focus:ring-[#b38fd9] focus:border-transparent outline-none transition-all"
                        >
                          <option value="">Select category</option>
                          {activeCategories.map((category: Category) => (
                            <option key={category.id} value={category.name}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      )}
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
                    <>
                      <div>
                        <label className="block text-sm font-medium text-[#4a3f5c] mb-2">
                          Full Address
                        </label>
                        <input
                          type="text"
                          value={formData.businessAddress}
                          readOnly
                          className="w-full px-4 py-3 rounded-xl border border-[#d9c0e8] bg-gray-50 text-gray-700"
                        />
                      </div>
                      
                      {/* Display parsed address components */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#4a3f5c] mb-1">
                            Street
                          </label>
                          <input
                            type="text"
                            value={formData.businessStreet}
                            readOnly
                            className="w-full px-3 py-2 rounded-lg border border-[#d9c0e8] bg-gray-50 text-gray-700 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#4a3f5c] mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            value={formData.businessCity}
                            readOnly
                            className="w-full px-3 py-2 rounded-lg border border-[#d9c0e8] bg-gray-50 text-gray-700 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#4a3f5c] mb-1">
                            State
                          </label>
                          <input
                            type="text"
                            value={formData.businessState}
                            readOnly
                            className="w-full px-3 py-2 rounded-lg border border-[#d9c0e8] bg-gray-50 text-gray-700 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#4a3f5c] mb-1">
                            ZIP Code
                          </label>
                          <input
                            type="text"
                            value={formData.businessZipcode}
                            readOnly
                            className="w-full px-3 py-2 rounded-lg border border-[#d9c0e8] bg-gray-50 text-gray-700 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#4a3f5c] mb-1">
                            Country
                          </label>
                          <input
                            type="text"
                            value={formData.businessCountry}
                            readOnly
                            className="w-full px-3 py-2 rounded-lg border border-[#d9c0e8] bg-gray-50 text-gray-700 text-sm"
                          />
                        </div>
                      </div>
                    </>
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
                    <p><strong>Phone:</strong> {formData.phone}</p>
                    <p><strong>Business:</strong> {formData.businessName}</p>
                    <p><strong>Business Type:</strong> {formData.businessType}</p>
                    <p><strong>Product Category:</strong> {
                      activeCategories.find((c:any) => c.id === formData.productCategory)?.name || formData.productCategory
                    }</p>
                    {formData.website && <p><strong>Website:</strong> {formData.website}</p>}
                    <p><strong>Street:</strong> {formData.businessStreet || 'Not set'}</p>
                    <p><strong>City:</strong> {formData.businessCity || 'Not set'}</p>
                    <p><strong>State:</strong> {formData.businessState || 'Not set'}</p>
                    <p><strong>Country:</strong> {formData.businessCountry || 'Not set'}</p>
                    <p><strong>ZIP Code:</strong> {formData.businessZipcode || 'Not set'}</p>
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
                Already have an account? <a href="/Login" className="text-[#9b6fc7] hover:underline">Sign in</a>
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
