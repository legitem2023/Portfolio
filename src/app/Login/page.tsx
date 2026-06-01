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
import { useDispatch } from "react-redux";
import { setActiveIndex } from '../../../Redux/activeIndexSlice';

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

  useEffect(() => {
    const checkSession = async () => {
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
    const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz";
    
    try {
      if (typeof decryptToken !== 'function') {
        throw new Error('decryptToken function not found');
      }
      
      const decrypted = await decryptToken(serverToken, secret);
      
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
      redirectBasedOnRole(userDataValid.role);    
      
    } catch (error: any) {
      console.error('❌ Failed to decrypt token:', error);
      setError(error.message || 'Failed to decrypt token');
      setSessionChecked(true);
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
    
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else if (result?.status === 200) {
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
        setError('Login failed: Unexpected response from server');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  // This triggers Google OAuth - redirects in the SAME tab (not new tab)
  const handleGoogleSignIn = async () => {
    setShowGoogleModal(false);
    setIsGoogleLoading(true);
    setError(null);
    
    // Use redirect: true with callbackUrl - this will redirect in the same tab
    // Google's OAuth page will open in the same window, user selects account,
    // then gets redirected back to your app
    await signIn('google', { 
      callbackUrl: '/Login',
      redirect: true
    });
  };

  const redirectBasedOnRole = (role: string) => {
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
      
      <div className="bg-gradient-to-b from-indigo-50 to-violet-50 p-0">
        <Header/>
        <div className="flex items-center justify-center py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl border border-indigo-100">
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
            
            {userData && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                ✅ Login successful! Redirecting to {getRedirectPath(userData.role)}...
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
                      disabled={isLoading || !!userData || isGoogleLoading}
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
                      disabled={isLoading || !!userData || isGoogleLoading}
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
                    disabled={isLoading || !!userData || isGoogleLoading}
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link href="/ForgotPassword" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                    Forgot Password
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading || !!userData || isGoogleLoading}
                  className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-500/20 ${(isLoading || !!userData || isGoogleLoading) ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? 'Signing in...' : (userData ? 'Logged In' : 'Sign in')}
                </button>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link href="/Signup" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
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

            {/* Google Sign In Button */}
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                disabled={isLoading || !!userData || isGoogleLoading}
                className={`w-full inline-flex justify-center items-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium transition-colors ${
                  isLoading || !!userData || isGoogleLoading
                    ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
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
                  {isGoogleLoading ? "Signing in..." : (userData ? "Signed in" : "Sign in with Google")}
                </span>
              </button>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>

      {/* Google Login Slide Up Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowGoogleModal(false)}
          />
          
          {/* Slide up panel */}
          <div 
            className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-hidden"
            style={{ 
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              maxHeight: '85vh'
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
            </div>
            
            {/* Google Logo */}
            <div className="text-center pt-2 pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
                  <svg className="w-10 h-10 text-white" viewBox="0 0 24 24">
                    <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Sign in with Google</h3>
              <p className="text-sm text-gray-500 mt-1">Continue to VendorCity</p>
            </div>
            
            {/* Info Box - explains what will happen */}
            <div className="mx-6 mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Youll be redirected to Google to choose your account</span>
              </div>
            </div>
            
            {/* Sign in button */}
            <div className="px-6 pb-3">
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all transform active:scale-[0.98] shadow-md"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
            
            {/* Cancel button */}
            <div className="p-6 pt-4">
              <button
                onClick={() => setShowGoogleModal(false)}
                className="w-full py-3 rounded-xl text-gray-500 font-medium hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
            
            {/* Footer note */}
            <div className="text-center pb-6">
              <p className="text-xs text-gray-400">
                This will redirect you to Googles sign-in page
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
          }
