// pages/signup.tsx
"use client";
import { useState, ChangeEvent, FormEvent } from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  subscribe: boolean;
}

export default function LuxurySignup() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    subscribe: true
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle signup logic here
    console.log('Signing up with:', formData);
  };

  return (
    <>
      <Head>
        <title>Create Account | ELEGANCE</title>
        <meta name="description" content="Create your ELEGANCE account" />
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-gray-800 p-10 rounded-xl shadow-2xl border border-gray-700">
          {/* Logo and Header */}
          <div>
            <div className="flex justify-center">
              <div className="bg-gradient-to-r from-amber-400 to-amber-600 p-3 rounded-lg">
                <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-amber-50">
              Join ELEGANCE
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Create your account for exclusive access
            </p>
          </div>
          
          {/* Signup Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    className="bg-gray-700 border border-gray-600 text-amber-50 rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full p-3"
                    placeholder="First"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    className="bg-gray-700 border border-gray-600 text-amber-50 rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full p-3"
                    placeholder="Last"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="bg-gray-700 border border-gray-600 text-amber-50 rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full pl-10 p-3"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="bg-gray-700 border border-gray-600 text-amber-50 rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full pl-10 p-3"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
              </div>
              
              {/* Confirm Password Input */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="bg-gray-700 border border-gray-600 text-amber-50 rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full pl-10 p-3"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="agreeToTerms"
                  name="agreeToTerms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-gray-600 rounded bg-gray-700"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                />
                <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-300">
                  I agree to the{' '}
                  <a href="#" className="text-amber-400 hover:text-amber-300 transition-colors">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-amber-400 hover:text-amber-300 transition-colors">
                    Privacy Policy
                  </a>
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="subscribe"
                  name="subscribe"
                  type="checkbox"
                  className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-gray-600 rounded bg-gray-700"
                  checked={formData.subscribe}
                  onChange={handleChange}
                />
                <label htmlFor="subscribe" className="ml-2 block text-sm text-gray-300">
                  Subscribe to our newsletter for exclusive offers and updates
                </label>
              </div>
            </div>

            {/* Sign Up Button */}
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-black bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all shadow-lg shadow-amber-500/20"
              >
                Create Account
              </button>
            </div>
            
            {/* Sign In Link */}
            <div className="text-center">
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-amber-400 hover:text-amber-300 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
            </div>
          </div>

          {/* Social Signup */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm.91 15.58c-2.06 0-3.13-.93-3.32-2.43h.08c.22.84 1.08 1.28 2.16 1.28 1.17 0 2.05-.52 2.05-1.43 0-.83-.59-1.27-1.91-1.27H9.17V9.75h1.12c1.25 0 1.87-.44 1.87-1.26 0-.76-.65-1.18-1.77-1.18-1.06 0-1.88.47-1.98 1.26H7.32c.1-1.67 1.47-2.58 3.22-2.58 1.9 0 3.13.91 3.13 2.23 0 .85-.42 1.48-1.17 1.79v.09c.88.16 1.42.87 1.42 1.87 0 1.57-1.36 2.47-3.01 2.47z" clipRule="evenodd" />
              </svg>
              <span className="ml-2">Google</span>
            </button>
            <button
              type="button"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
              </svg>
              <span className="ml-2">Twitter</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
