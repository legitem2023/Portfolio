// pages/login.tsx
"use client";
import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import Link from 'next/link';
import Footer from '../components/Footer';
import { signIn, getSession } from 'next-auth/react';
import Header from '../components/Header';
import { useAuth } from '../components/hooks/useAuth';
import { decryptToken } from '../../../utils/decryptToken';
import { useDispatch, useSelector } from "react-redux";
import { setActiveIndex } from '../../../Redux/activeIndexSlice';

// Your user interface from decrypted token
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
  const [sessionChecked, setSessionChecked] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Check session after login
  useEffect(() => {
    const checkSession = async () => {
      // Only run on client side
      if (typeof window === 'undefined') return;
      
      try {
        const session: any = await getSession();
        const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz";
      
        if (session?.serverToken) {
          console.log('✅ Session found with token');
          await decryptUserToken(session?.serverToken);
        } else {
          console.log('No session token found');
          setSessionChecked(true);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setSessionChecked(true);
      }
    };

    checkSession();
  }, []);

  const decryptUserToken = async (serverToken: string) => {
    // Decrypt the token
    const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz";
    
    try {
      // Check if decryptToken is available
      if (typeof decryptToken !== 'function') {
        throw new Error('decryptToken function not found');
      }
      
      // Await the decryptToken function since it returns a Promise
      const decrypted = await decryptToken(serverToken, secret);
      
      // Validate the decrypted data matches UserData interface
      if (!decrypted || typeof decrypted !== 'object') {
        throw new Error('Invalid decrypted data');
      }
      
      // Ensure required fields exist
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
      setSessionChecked(true);
      
      // Redirect based on role
      redirectBasedOnRole(userDataValid.role);    
      
    } catch (error: any) {
      console.error('❌ Failed to decrypt token:', error);
      setError(error.message || 'Failed to decrypt token');
      setSessionChecked(true);
      // Still proceed but with default role
      redirectBasedOnRole("USER");    
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
    
      // Check if login was successful - must have statusText === 'success' AND no error

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else if (result?.status === 200) {
        // Only proceed if statusText is exactly 'success'
        console.log('✅ Login successful with statusText: success');
        
        // Wait a moment for session to be established
        setTimeout(async () => {
          try {
            const session = await getSession();
            if (session?.serverToken) {
              await decryptUserToken(session.serverToken);
            } else {
              setError('Session established but no token found');
              setIsLoading(false);
              setSessionChecked(true);
            }
          } catch (sessionError) {
            console.error('Session error:', sessionError);
            setError('Failed to establish session');
            setIsLoading(false);
            setSessionChecked(true);
          }
        }, 1000);
      } else {
        // Handle case where there's no error but statusText isn't 'success'
        console.error('Login failed: statusText is', result?.statusText);
        setError('Login failed: Unexpected response from server');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setShowGoogleModal(false);
    setIsGoogleLoading(true);
    setError(null);
    
    try {
      const result = await signIn('google', {
        redirect: false,
        callbackUrl: '/Login'
      });
      
      if (result?.error) {
        setError('Google sign-in failed. Please try again.');
        console.error('Google sign-in error:', result.error);
        setIsGoogleLoading(false);
      } else if (result?.ok && result?.url) {
        // Successful sign-in, wait for session
        setTimeout(async () => {
          try {
            const session = await getSession();
            if (session?.serverToken) {
              await decryptUserToken(session.serverToken);
            } else {
              setError('Session established but no token found');
              setIsGoogleLoading(false);
            }
          } catch (sessionError) {
            console.error('Session error:', sessionError);
            setError('Failed to establish session');
            setIsGoogleLoading(false);
          }
        }, 1000);
      }
    } catch (err: any) {
      console.error('Google sign-in failed:', err);
      setError(err.message || 'Google sign-in failed. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  const redirectBasedOnRole = (role: string) => {
    // Redirect based on user role
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
  };

  const handleContinue = () => {
    if (userData) {
      redirectBasedOnRole(userData.role);
    } else {
      router.push('/');
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'ADMINISTRATOR':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MANAGER':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'RIDER':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'USER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get redirect path display
  const getRedirectPath = (role: string) => {
    switch(role) {
      case 'ADMINISTRATOR':
        return 'Management';
      case 'MANAGER':
        return 'Management';
      case 'RIDER':
        return 'Rider';
      case 'USER':
        return 'Home';
      default:
        return '';
    }
  };

  return (
    <>
      <Head>
        <title>Login | VendorCity</title>
        <meta name="description" content="Login to VendorCity Account" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 p-0">
        <Header/>
        
        {/* Main Container with Floating Glass Card */}
        <div className="flex items-center justify-center py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8">
          <div className="relative max-w-md w-full">
            {/* Decorative Background Elements */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
            
            {/* Glassmorphic Card */}
            <div className="relative backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl border border-white/20 p-8 transition-all duration-300 hover:shadow-3xl">
              {/* Logo and Header */}
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="bg-gradient-to-r from-pink-500 to-indigo-600 p-4 rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-4xl font-extrabold text-white mb-2 tracking-tight">
                  Welcome back
                </h2>
                <p className="text-indigo-200 text-sm">
                  Sign in to continue your journey
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mt-6 bg-red-500/20 backdrop-blur-sm border border-red-400/50 text-red-100 px-4 py-3 rounded-xl animate-shake">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}
              
              {/* Success Message when logged in */}
              {userData && (
                <div className="mt-6 bg-green-500/20 backdrop-blur-sm border border-green-400/50 text-green-100 px-4 py-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    ✅ Login successful! Redirecting to {getRedirectPath(userData.role)}...
                  </div>
                </div>
              )}
              
              {/* Login Form */}
              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Email Input */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-indigo-200 mb-2">
                      Email address
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-indigo-300 group-focus-within:text-pink-400 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
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
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent block w-full pl-10 p-3 placeholder-white/40 transition-all duration-300"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={isLoading || !!userData || isGoogleLoading}
                      />
                    </div>
                  </div>
                  
                  {/* Password Input */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-indigo-200 mb-2">
                      Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-indigo-300 group-focus-within:text-pink-400 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent block w-full pl-10 p-3 placeholder-white/40 transition-all duration-300"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isLoading || !!userData || isGoogleLoading}
                      />
                    </div>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="rememberMe"
                      name="rememberMe"
                      type="checkbox"
                      className="h-4 w-4 text-pink-500 focus:ring-pink-500 border-white/30 rounded bg-white/10"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      disabled={isLoading || !!userData || isGoogleLoading}
                    />
                    <label htmlFor="rememberMe" className="ml-2 block text-sm text-indigo-200">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <Link href="/ForgotPassword" className="font-medium text-pink-300 hover:text-pink-200 transition-colors">
                      Forgot Password?
                    </Link>
                  </div>
                </div>

                {/* Sign In Button */}
                <div>
                  <button
                    type="submit"
                    disabled={isLoading || !!userData || isGoogleLoading}
                    className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-pink-500/30 ${(isLoading || !!userData || isGoogleLoading) ? 'opacity-70 cursor-not-allowed hover:scale-100' : ''}`}
                  >
                    {isLoading ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (userData ? 'Logged In' : 'Sign in')}
                  </button>
                </div>
                
                {/* Sign Up Link */}
                <div className="text-center">
                  <p className="text-sm text-indigo-200">
                    Don&apos;t have an account?{' '}
                    <Link href="/Signup" className="font-medium text-pink-300 hover:text-pink-200 transition-colors">
                      Sign up
                    </Link>
                  </p>
                </div>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-transparent text-indigo-200 backdrop-blur-sm">Or continue with</span>
                </div>
              </div>

              {/* Social Login - Google Button with Slide Up Modal */}
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(true)}
                  disabled={isLoading || !!userData || isGoogleLoading}
                  className={`w-full inline-flex justify-center items-center gap-3 py-3 px-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-95 ${
                    isLoading || !!userData || isGoogleLoading
                      ? "bg-white/5 border border-white/10 text-gray-400 cursor-not-allowed"
                      : "bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 hover:shadow-lg"
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill={isLoading || !!userData || isGoogleLoading ? "#9CA3AF" : "#4285F4"}
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill={isLoading || !!userData || isGoogleLoading ? "#9CA3AF" : "#34A853"}
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill={isLoading || !!userData || isGoogleLoading ? "#9CA3AF" : "#FBBC05"}
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill={isLoading || !!userData || isGoogleLoading ? "#9CA3AF" : "#EA4335"}
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="ml-2">
                    {isGoogleLoading ? "Signing in..." : "Continue with Google"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Google Login Slide-Up Modal */}
        <div 
          className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-500 ease-out ${
            showGoogleModal ? 'visible' : 'invisible'
          }`}
          onClick={() => setShowGoogleModal(false)}
        >
          {/* Backdrop overlay */}
          <div 
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${
              showGoogleModal ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => setShowGoogleModal(false)}
          />
          
          {/* Slide-up panel */}
          <div 
            className={`relative w-full max-w-md bg-gradient-to-br from-white to-gray-50 rounded-t-3xl shadow-2xl transform transition-all duration-500 ease-out ${
              showGoogleModal ? 'translate-y-0' : 'translate-y-full'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 pb-8">
              {/* Google Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" viewBox="0 0 24 24">
                    <path
                      fill="#ffffff"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#ffffff"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#ffffff"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#ffffff"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-center text-gray-800 mb-2">
                Continue with Google
              </h3>
              <p className="text-center text-gray-500 text-sm mb-6">
                Sign in securely using your Google account
              </p>
              
              {/* Benefits list */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>No password needed</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>One-click access to your account</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Secure & encrypted sign-in</span>
                </div>
              </div>
              
              {/* Google Sign In Button inside modal */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-3 hover:from-blue-700 hover:to-indigo-700 transition-all transform active:scale-95 shadow-lg mb-3"
              >
                {isGoogleLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                <span>{isGoogleLoading ? "Signing in..." : "Sign in with Google"}</span>
              </button>
              
              {/* Cancel button */}
              <button
                onClick={() => setShowGoogleModal(false)}
                className="w-full text-gray-500 py-2 text-sm font-medium hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
        .animate-pulse {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </>
  );
}
