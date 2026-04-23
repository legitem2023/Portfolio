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
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

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
      console.log(result);
      if (result?.error) {
        setError('Login failed: ' + result.error);
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
      
      <div className="bg-gradient-to-b from-indigo-50 to-violet-50 p-0">
        <Header/>
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl border border-indigo-100">
            {/* Logo and Header */}
            <div>
              <div className="flex justify-center">
                <div className="bg-gradient-to-r from-violet-500 to-indigo-600 p-3 rounded-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            
            {/* Success Message when logged in */}
            {userData && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                ✅ Login successful! Redirecting to {getRedirectPath(userData.role)}...
              </div>
            )}
            
            {/* Login Form */}
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="rounded-md shadow-sm space-y-4">
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
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
                      disabled={isLoading || !!userData}
                    />
                  </div>
                </div>
                
                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
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
                      disabled={isLoading || !!userData}
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
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    disabled={isLoading || !!userData}
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

              {/* Sign In Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading || !!userData}
                  className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-500/20 ${(isLoading || !!userData) ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? 'Signing in...' : (userData ? 'Logged In' : 'Sign in')}
                </button>
              </div>
              
              {/* Sign Up Link */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link href="/Signup" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                    Sign up
                  </Link>
                </p>
              </div>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isLoading || !!userData}
                className={`w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors ${(isLoading || !!userData) ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm.91 15.58c-2.06 0-3.13-.93-3.32-2.43h.08c.22.84 1.08 1.28 2.16 1.28 1.17 0 2.05-.52 2.05-1.43 0-.83-.59-1.27-1.91-1.27H9.17V9.75h1.12c1.25 0 1.87-.44 1.87-1.26 0-.76-.65-1.18-1.77-1.18-1.06 0-1.88.47-1.98 1.26H7.32c.1-1.67 1.47-2.58 3.22-2.58 1.9 0 3.13.91 3.13 2.23 0 .85-.42 1.48-1.17 1.79v.09c.88.16 1.42.87 1.42 1.87 0 1.57-1.36 2.47-3.01 2.47z" clipRule="evenodd" />
                </svg>
                <span className="ml-2">Google</span>
              </button>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    </>
  );
}
