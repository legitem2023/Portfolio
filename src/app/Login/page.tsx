// pages/login.tsx
"use client";
import { useState, ChangeEvent, FormEvent, useEffect, useRef } from 'react';
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

export default function LuxuryLogin() {
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
  
  const hasRedirected = useRef(false);

  useEffect(() => {
    const checkSession = async () => {
      const session: any = await getSession();
      if (session?.serverToken && !userData && !hasRedirected.current) {
        await decryptUserToken(session.serverToken);
      }
    };
    checkSession();
  }, []);

  const decryptUserToken = async (serverToken: string) => {
    const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz";
    
    try {
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
      redirectBasedOnRole(userDataValid.role);
    } catch (error: any) {
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
    
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        setTimeout(async () => {
          const session = await getSession();
          if (session?.serverToken) {
            await decryptUserToken(session.serverToken);
          }
          setIsLoading(false);
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setIsLoading(false);
    }
  };

  // SIMPLE GOOGLE LOGIN - Just NextAuth, no Firebase
  const handleGoogleSignIn = async () => {
    if (isGoogleLoading || hasRedirected.current) return;
    
    setIsGoogleLoading(true);
    setError(null);
    
    try {
      const result = await signIn('google', { 
        callbackUrl: '/',
        redirect: false 
      });
      
      if (result?.error) {
        throw new Error(result.error);
      }
      
      // Wait for session
      setTimeout(async () => {
        const session = await getSession();
        if (session?.serverToken) {
          await decryptUserToken(session.serverToken);
        }
        setIsGoogleLoading(false);
      }, 1500);
      
    } catch (error: any) {
      setError(error.message || 'Google sign-in failed');
      setIsGoogleLoading(false);
    }
  };

  const redirectBasedOnRole = (role: string) => {
    if (hasRedirected.current) return;
    hasRedirected.current = true;
    
    switch(role) {
      case 'ADMINISTRATOR':
      case 'MANAGER':
        dispatch(setActiveIndex(0));
        router.push('/Management');
        break;
      case 'RIDER':
        dispatch(setActiveIndex(0));
        router.push('/Rider');
        break;
      default:
        dispatch(setActiveIndex(1));
        router.push('/');
        break;
    }
  };

  if (userData || hasRedirected.current) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Login Successful!</h2>
          <p className="text-gray-600 mt-2">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Login | VendorCity</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50">
        <Header/>
        <div className="flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-2xl space-y-8 bg-white p-10 rounded-xl shadow-2xl">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900">Welcome back</h2>
              <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <input
                  type="email"
                  name="email"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading || isGoogleLoading}
                />
              </div>
              
              <div>
                <input
                  type="password"
                  name="password"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading || isGoogleLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
              
              <div className="text-center">
                <Link href="/Signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Don&apos;t have an account? Sign up
                </Link>
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
              onClick={handleGoogleSignIn}
              disabled={isLoading || isGoogleLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
            </button>
          </div>
        </div>
        
        <Footer />
      </div>
    </>
  );
}
