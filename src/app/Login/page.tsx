// pages/login.tsx
"use client";
import React, { useState, ChangeEvent, FormEvent, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import Link from 'next/link';
import Footer from '../components/Footer';
import { signIn, getSession } from 'next-auth/react';
import Header from '../components/Header';
import { useAuth } from '../components/hooks/useAuth';
import { decryptToken } from '../../../utils/decryptToken';
import { useDispatch } from "react-redux";
import { setActiveIndex } from '../../../Redux/activeIndexSlice';

// Firebase imports
import { auth, googleProvider, signInWithPopup, getIdToken } from '../../../lib/firebase-client';

interface UserData {
  userId: string;
  role: 'ADMINISTRATOR' | 'MANAGER' | 'RIDER' | 'USER';
  name?: string;
  email?: string;
  phone: string;
  image?: string;
  addresses: string[];
}

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface SignInResponse {
  error?: string;
  status?: number;
  statusText?: string;
  ok?: boolean;
  url?: string | null;
}

export default function LuxuryLogin() {
  const { user } = useAuth();
  const router = useRouter();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [firebaseReady, setFirebaseReady] = useState(false);
  
  // Refs to prevent multiple executions
  const hasRedirected = useRef(false);
  const isProcessingGoogleLogin = useRef(false);
  const sessionChecked = useRef(false);
  const initialRedirectDone = useRef(false);

  // Check if Firebase is ready
  useEffect(() => {
    const checkFirebase = () => {
      if (auth && googleProvider) {
        console.log('✅ Firebase is ready');
        setFirebaseReady(true);
      } else {
        console.log('⏳ Waiting for Firebase to initialize...');
        setTimeout(checkFirebase, 500);
      }
    };
    
    checkFirebase();
  }, []);

  // Check session only ONCE when component mounts
  useEffect(() => {
    const checkExistingSession = async () => {
      if (sessionChecked.current || hasRedirected.current || userData) {
        return;
      }
      
      try {
        const session: any = await getSession();
        
        if (session?.serverToken && !userData && !hasRedirected.current) {
          console.log('✅ Existing session found');
          await decryptUserToken(session.serverToken);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        sessionChecked.current = true;
      }
    };

    checkExistingSession();
  }, []);

  const decryptUserToken = async (serverToken: string) => {
    const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz";
    
    try {
      const decrypted = await decryptToken(serverToken, secret);
      
      if (!decrypted || typeof decrypted !== 'object') {
        throw new Error('Invalid decrypted data');
      }
      
      const userDataValid: UserData = {
        userId: decrypted.userId || '',
        role: decrypted.role || 'USER',
        phone: decrypted.phone || '',
        addresses: Array.isArray(decrypted.addresses) ? decrypted.addresses : [],
        name: decrypted.name,
        email: decrypted.email,
        image: decrypted.image
      };
      
      setUserData(userDataValid);
      setError(null);
      
      redirectBasedOnRole(userDataValid.role);    
      
    } catch (error: any) {
      console.error('❌ Failed to decrypt token:', error);
      setError(error.message || 'Failed to decrypt token');
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (userData || hasRedirected.current) return;
    
    if (!formData.email || !formData.password) {
      alert('Please enter email and password.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      }) as SignInResponse;
    
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else if (result?.status === 200) {
        setTimeout(async () => {
          const session = await getSession();
          if (session?.serverToken && !userData && !hasRedirected.current) {
            await decryptUserToken(session.serverToken);
          }
          setIsLoading(false);
        }, 1000);
      } else {
        setError('Login failed');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setIsLoading(false);
    }
  };

  // Fixed Google login handler with better error handling
  const handleFirebaseGoogleSignIn = async () => {
    // Critical checks to prevent multiple calls
    if (userData || hasRedirected.current || isProcessingGoogleLogin.current) {
      console.log('Blocking duplicate Google login attempt');
      return;
    }
    
    if (!firebaseReady || !auth) {
      setError('Firebase is initializing. Please wait a moment and try again.');
      return;
    }
    
    isProcessingGoogleLogin.current = true;
    setIsGoogleLoading(true);
    setError(null);
    
    try {
      console.log('Starting Google login...');
      
      // Create a promise with timeout
      const loginPromise = signInWithPopup(auth, googleProvider);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), 30000);
      });
      
      const result = await Promise.race([loginPromise, timeoutPromise]) as any;
      
      if (!result || !result.user) {
        throw new Error('No user data received');
      }
      
      const firebaseUser = result.user;
      console.log('Firebase user:', firebaseUser.email);
      
      // Get Firebase ID token
      const idToken = await getIdToken(firebaseUser);
      console.log('Got ID token');
      
      // Sign in with NextAuth
      const signInResult = await signIn('google', {
        idToken: idToken,
        redirect: false,
      });
      
      if (signInResult?.error) {
        throw new Error(signInResult.error);
      }
      
      console.log('Google login successful, getting session...');
      
      // Wait a bit for session to be established
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get session and decrypt token
      const session = await getSession();
      
      if (session?.serverToken && !userData && !hasRedirected.current) {
        await decryptUserToken(session.serverToken);
      } else {
        console.error('No serverToken in session');
        setError('No authentication token received');
      }
      
    } catch (error: any) {
      console.error('Google login error:', error);
      
      let errorMessage = 'Google sign-in failed. Please try again.';
      
      if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in cancelled';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup blocked! Please allow popups for this website';
      } else if (error.message === 'timeout') {
        errorMessage = 'Login took too long. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsGoogleLoading(false);
      setTimeout(() => {
        isProcessingGoogleLogin.current = false;
      }, 2000);
    }
  };

  // Redirect only ONCE
  const redirectBasedOnRole = (role: string) => {
    if (hasRedirected.current || initialRedirectDone.current) {
      console.log('Redirect already happened, skipping');
      return;
    }
    
    hasRedirected.current = true;
    initialRedirectDone.current = true;
    
    console.log('Redirecting based on role:', role);
    
    setTimeout(() => {
      switch(role) {
        case 'ADMINISTRATOR':
          dispatch(setActiveIndex(0));
          router.push('/Management');
          break;
        case 'MANAGER':
          dispatch(setActiveIndex(0));
          router.push('/Management');
          break;
        case 'RIDER':
          dispatch(setActiveIndex(0));
          router.push('/Rider');
          break;
        case 'USER':
        default:
          dispatch(setActiveIndex(1));
          router.push('/');
          break;
      }
    }, 100);
  };

  const getRedirectPath = (role: string) => {
    switch(role) {
      case 'ADMINISTRATOR':
      case 'MANAGER':
        return 'Management';
      case 'RIDER':
        return 'Rider';
      default:
        return 'Home';
    }
  };

  // Show loading/redirect screen if logged in
  if (userData || hasRedirected.current) {
    return (
      <>
        <Head>
          <title>Redirecting...</title>
        </Head>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50">
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800">Login Successful!</h2>
            <p className="text-gray-600 mt-2">Redirecting to {userData ? getRedirectPath(userData.role) : 'Dashboard'}...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Login | VendorCity</title>
        <meta name="description" content="Login to VendorCity Account" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50">
        <Header/>
        <div className="flex items-center justify-center py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-2xl space-y-8 bg-white p-6 sm:p-10 rounded-xl shadow-2xl border border-indigo-100">
            <div>
              <div className="flex justify-center">
                <div className="bg-gradient-to-r from-violet-500 to-indigo-600 p-3 rounded-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Welcome back
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Sign in to your account
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            
            {!firebaseReady && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
                Initializing secure login... Please wait.
              </div>
            )}
            
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="rounded-md shadow-sm space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
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
                      className="bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-3"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isLoading || isGoogleLoading}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      className="bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-3"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading || isGoogleLoading}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    disabled={isLoading || isGoogleLoading}
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link href="/ForgotPassword" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link href="/Signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Sign up
                  </Link>
                </p>
              </div>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFirebaseGoogleSignIn}
              disabled={isLoading || isGoogleLoading || !firebaseReady}
              className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>
                {!firebaseReady ? 'Initializing...' : (isGoogleLoading ? "Signing in..." : "Continue with Google")}
              </span>
            </button>
          </div>
        </div>
        
        <Footer />
      </div>
    </>
  );
  }
