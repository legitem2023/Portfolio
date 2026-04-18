// src/app/components/RiderSignupForm.tsx
'use client';

import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import Header from './Header';
import Head from 'next/head';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet with no SSR
const LocationPicker = dynamic(
  () => import('./LocationPicker'),
  { ssr: false, loading: () => <div className="h-[300px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">Loading map...</div> }
);

// GraphQL Mutation for Rider Signup
const RIDER_SIGNUP = gql`
  mutation RiderSignup($input: RiderSignupInput!) {
    riderSignup(input: $input) {
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
        plateNo
        license
        emailVerified
        createdAt
        updatedAt
      }
    }
  }
`;

interface SignupFormData {
  // Account Information
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  
  // Rider Information (based on User model)
  plateNo: string;      // Vehicle plate number
  license: string;      // Driver's license number
  
  // Location
  currentLatitude: number | null;
  currentLongitude: number | null;
  
  // Agreement
  agreeTerms: boolean;
}

export default function RiderSignupForm() {
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    plateNo: '',
    license: '',
    currentLatitude: null,
    currentLongitude: null,
    agreeTerms: false,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [passwordError, setPasswordError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  // GraphQL hooks
  const [riderSignup, { loading: isSubmitting }] = useMutation(RIDER_SIGNUP);

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

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setFormData(prev => ({
      ...prev,
      currentLatitude: lat,
      currentLongitude: lng,
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
      const { data } = await riderSignup({
        variables: {
          input: {
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            plateNo: formData.plateNo,
            license: formData.license,
            currentLatitude: formData.currentLatitude,
            currentLongitude: formData.currentLongitude,
          }
        }
      });
      
      if (data.riderSignup.success) {
        if (data.riderSignup.token) {
          localStorage.setItem('token', data.riderSignup.token);
          localStorage.setItem('user', JSON.stringify(data.riderSignup.user));
        }
        
        alert(data.riderSignup.message);
        
        setTimeout(() => {
          window.location.href = '/login?registered=true';
        }, 2000);
      } else {
        setSubmitError(data.riderSignup.message);
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
      if (!formData.plateNo || !formData.license) {
        alert('Please fill in all vehicle and license information fields');
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

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white/80 backdrop-blur-sm shadow-2xl border border-white/40 overflow-hidden rounded-2xl">
            <div className="bg-gradient-to-r from-[#b79ad4] to-[#dac0f0] px-8 py-6">
              <div className="flex items-center gap-3">
                <i className="fas fa-motorcycle text-white text-3xl"></i>
                <div>
                  <h1 className="text-3xl font-bold text-white">Rider Registration</h1>
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
        <title>Rider Signup | VendorCity</title>
        <meta name="description" content="Join our delivery team as a rider" />
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white/80 backdrop-blur-sm shadow-2xl border border-white/40 overflow-hidden rounded-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#b79ad4] to-[#dac0f0] px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <i className="fas fa-motorcycle text-white text-3xl"></i>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Rider Registration</h1>
                    <p className="text-[#f8f0ff] text-sm mt-1 opacity-90">Join our delivery team</p>
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
                      placeholder="rider@example.com"
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

              {/* Step 2: Vehicle & License Information */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-fadeIn">
                  <h2 className="text-2xl font-semibold text-[#4a3f5c]">Vehicle & License Information</h2>
                  
                  <div className="bg-purple-50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-purple-700">
                      <i className="fas fa-info-circle mr-2"></i>
                      Please provide your vehicle and license details. This information will be verified by our team.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#4a3f5c] mb-2">
                      Vehicle Plate Number <span className="text-[#b279d6]">*</span>
                    </label>
                    <input
                      type="text"
                      name="plateNo"
                      value={formData.plateNo}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-[#d9c0e8] bg-white/60 focus:bg-white focus:ring-2 focus:ring-[#b38fd9] focus:border-transparent outline-none transition-all"
                      placeholder="e.g., ABC-1234"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#4a3f5c] mb-2">
                      Driver&apos;s License Number <span className="text-[#b279d6]">*</span>
                    </label>
                    <input
                      type="text"
                      name="license"
                      value={formData.license}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-[#d9c0e8] bg-white/60 focus:bg-white focus:ring-2 focus:ring-[#b38fd9] focus:border-transparent outline-none transition-all"
                      placeholder="e.g., DL1234567890"
                    />
                    <p className="text-xs text-[#6b5b7c] mt-1">
                      Your license will be kept secure and only used for verification
                    </p>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-[#4a3f5c] mb-2">
                      Your Current Location (Optional)
                    </label>
                    <LocationPicker onLocationSelect={handleLocationSelect} />
                    <p className="text-xs text-[#6b5b7c] mt-1">
                      This helps us find delivery opportunities near you
                    </p>
                  </div>

                  {formData.currentLatitude && formData.currentLongitude && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                      <p className="text-sm text-green-700">
                        <i className="fas fa-map-marker-alt mr-2"></i>
                        Location captured: {formData.currentLatitude.toFixed(6)}, {formData.currentLongitude.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Agreement & Submit */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <h2 className="text-2xl font-semibold text-[#4a3f5c]">Review & Agree</h2>
                  
                  <div className="bg-gray-50 rounded-xl p-6 space-y-3">
                    <h3 className="font-semibold text-[#4a3f5c]">Account Summary</h3>
                    <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                    <p><strong>Email:</strong> {formData.email}</p>
                    <p><strong>Phone:</strong> {formData.phone}</p>
                    <p><strong>Plate Number:</strong> {formData.plateNo}</p>
                    <p><strong>License Number:</strong> {formData.license}</p>
                    {formData.currentLatitude && formData.currentLongitude && (
                      <p><strong>Location:</strong> {formData.currentLatitude.toFixed(4)}, {formData.currentLongitude.toFixed(4)}</p>
                    )}
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
                      <a href="#" className="text-[#9b6fc7] hover:text-[#7b4fa3] underline mx-1">Rider Terms & Conditions</a>
                      and 
                      <a href="#" className="text-[#9b6fc7] hover:text-[#7b4fa3] underline mx-1">Delivery Policy</a>
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
                        <i className="fas fa-motorcycle mr-2"></i>
                        Register as Rider
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
