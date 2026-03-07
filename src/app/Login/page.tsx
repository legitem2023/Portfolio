// pages/login.tsx
"use client";
import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '../components/Footer';
import { signIn, getSession } from 'next-auth/react'; // Changed: use getSession instead of useSession
import Header from '../components/Header';
import { useAuth } from '../components/hooks/useAuth';
import { decryptToken } from '../../../utils/decryptToken';

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

export default function LuxuryLogin() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Check session after login
  useEffect(() => {
    const checkSession = async () => {
      // Only run on client side
      if (typeof window === 'undefined') return;
      
      try {
        const session:any = await getSession();
        const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz";
    
        //console.log('Session from getSession():', session);
        //const decrypted = await decryptToken(session?.serverToken, secret);
        //console.log('Decrypted result:', decrypted);
      
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
  }, []); // Run once when component mounts

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
      console.log('Decrypted result:', decrypted);
      
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
     // setShowTokenModal(true);
      /*
      console.log('✅ Token decrypted successfully:', userDataValid);
      console.log('👤 User Role:', userDataValid.role);
      
      // Store user data in localStorage if needed
      try {
        localStorage.setItem('userData', JSON.stringify(userDataValid));
        localStorage.setItem('userRole', userDataValid.role);
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }
      
      // Show modal with user info
      setShowTokenModal(true);
      
      // Redirect based on role after 3 seconds
      setTimeout(() => {
        redirectBasedOnRole(userDataValid.role);
      }, 3000);
      */
    } catch (error: any) {
      console.error('❌ Failed to decrypt token:', error);
      setError(error.message || 'Failed to decrypt token');
      setSessionChecked(true);
      
      // Still proceed but with default role
      setTimeout(() => {
        redirectBasedOnRole('USER');
      }, 3000);
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
      });
     
      console.log('SignIn result:', result);
      
      if (result?.error) {
        console.error('Login error:', result.error);
        setError('Login failed: ' + result.error);
        setIsLoading(false);
      } else {
        console.log('✅ Login successful, checking session...');
        
        // Wait a moment for session to be established
        setTimeout(async () => {
          const session = await getSession();
          console.log('Session after login:', session);
          
          if (session?.serverToken) {
            await decryptUserToken(session.serverToken);
          } else {
            setError('Session established but no token found');
            setIsLoading(false);
            setSessionChecked(true);
          }
        }, 1000);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const redirectBasedOnRole = (role: string) => {
   // setShowTokenModal(false);
    
    // Redirect based on user role
    switch(role) {
      case 'ADMINISTRATOR':
        router.push('/Management');
        break;
      case 'MANAGER':
        router.push('/Management');
        break;
      case 'RIDER':
        router.push('/Rider');
        break;
      case 'USER':
      default:
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

  const handleCloseModal = () => {
    setShowTokenModal(false);
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
        return '';
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
      
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50 p-0">
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
            
            {/* Login Form - Hide when showing token modal */}
            {!showTokenModal && (
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
                        disabled={isLoading}
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
                        disabled={isLoading}
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
                      disabled={isLoading}
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
                    disabled={isLoading}
                    className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-500/20 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </button>
                </div>
                
                {/* Sign Up Link */}
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Dont have an account?{' '}
                    <Link href="/Signup" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                      Sign up
                    </Link>
                  </p>
                </div>
              </form>
            )}

            {/* Divider - Hide when showing token modal */}
            {!showTokenModal && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
            )}

            {/* Social Login - Hide when showing token modal */}
            {!showTokenModal && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isLoading}
                  className={`w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm.91 15.58c-2.06 0-3.13-.93-3.32-2.43h.08c.22.84 1.08 1.28 2.16 1.28 1.17 0 2.05-.52 2.05-1.43 0-.83-.59-1.27-1.91-1.27H9.17V9.75h1.12c1.25 0 1.87-.44 1.87-1.26 0-.76-.65-1.18-1.77-1.18-1.06 0-1.88.47-1.98 1.26H7.32c.1-1.67 1.47-2.58 3.22-2.58 1.9 0 3.13.91 3.13 2.23 0 .85-.42 1.48-1.17 1.79v.09c.88.16 1.42.87 1.42 1.87 0 1.57-1.36 2.47-3.01 2.47z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-2">Google</span>
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  className={`w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                  <span className="ml-2">Twitter</span>
                </button>
              </div>
            )}
          </div>
        </div>
        
        <Footer />
      </div>

      {/* Token Modal - Shows decrypted user info */}
      {showTokenModal && userData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white">
              <h3 className="text-xl font-semibold text-gray-900">
                🔐 Login Successful
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              {/* User Role - Highlighted with badge */}
              <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">👤 User Role:</p>
                <div className="flex items-center space-x-3">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getRoleBadgeColor(userData.role)}`}>
                    {userData.role}
                  </span>
                  <span className="text-sm text-gray-500">
                    Redirecting to {getRedirectPath(userData.role)}...
                  </span>
                </div>
              </div>
              
              {/* User Information Card */}
              <div className="mb-4 bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <h4 className="font-medium text-indigo-800 mb-3">👤 User Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-indigo-600">User ID</p>
                    <p className="text-sm font-mono bg-white p-1 rounded">{userData.userId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-indigo-600">Name</p>
                    <p className="text-sm font-medium">{userData.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-indigo-600">Email</p>
                    <p className="text-sm">{userData.email || formData.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-indigo-600">Phone</p>
                    <p className="text-sm">{userData.phone}</p>
                  </div>
                </div>
              </div>
              
              {/* Addresses */}
              {userData.addresses && userData.addresses.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">📍 Saved Addresses:</p>
                  <div className="space-y-2">
                    {userData.addresses.map((address, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded border border-gray-200 text-sm">
                        {address}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Full Decrypted Token Data */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">🔑 Full Decrypted Token Data:</p>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {JSON.stringify(userData, null, 2)}
                  </pre>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleContinue}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Continue to {getRedirectPath(userData.role)} →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
                }
