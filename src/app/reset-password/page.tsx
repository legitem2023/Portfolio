// app/reset-password.tsx
"use client";
import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RESETPASSWORD } from '../components/graphql/mutation';
import { useMutation } from '@apollo/client';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  Lock, 
  CheckCircle, 
  Shield, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [resetPassword, { loading: gqlLoading, error: gqlError }] = useMutation(RESETPASSWORD);
  
  // Handle viewport height for mobile browsers
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVH();
    window.addEventListener('resize', setVH);
    return () => window.removeEventListener('resize', setVH);
  }, []);
  
  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);
  
  const validatePassword = (pass: string) => {
    const errors = [];
    if (pass.length < 8) errors.push('at least 8 characters');
    if (!/[A-Z]/.test(pass)) errors.push('one uppercase letter');
    if (!/[a-z]/.test(pass)) errors.push('one lowercase letter');
    if (!/[0-9]/.test(pass)) errors.push('one number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) errors.push('one special character');
    return errors;
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!token) {
      setError('Invalid reset token. Please request a new password reset link.');
      return;
    }
    
    if (!password) {
      setError('Please enter a new password.');
      return;
    }
    
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(`Password must contain: ${passwordErrors.join(', ')}`);
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    try {
      // Call the GraphQL mutation
      const response = await resetPassword({
        variables: { 
          token: token,
          newPassword: password 
        }
      });
      
     // console.log('Password reset successfully:', response.data?.resetPassword?.statusText);
      if(response.data?.resetPassword?.statusText==='Success'){
        setIsSubmitted(true);
      // Auto redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/Login');
        }, 3000);
      }else{
        setError(response.data?.resetPassword?.statusText);
      }
      
    } catch (err) {
      console.error('Password reset failed:', err);
      setError(gqlError?.message || 'Failed to reset password. Please try again or request a new link.');
    }
  };
  
  const handleBackToLogin = () => {
    router.push('/Login');
  };
  
  const handleRequestNewLink = () => {
    router.push('/forgot-password');
  };
  
  return (
    <>
      <Head>
        <title>Reset Password | ELEGANCE</title>
        <meta name="description" content="Create a new password for your ELEGANCE account" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50">
        <Header />
        <div className="flex items-center justify-center py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-[95%] sm:max-w-md md:max-w-md lg:max-w-md xl:max-w-md bg-white rounded-xl shadow-2xl border border-indigo-100 p-5 sm:p-6 md:p-8 lg:p-10">
            {/* Logo and Header */}
            <div className="text-center">
              <div className="flex justify-center mb-4 sm:mb-5 md:mb-6">
                <div className="bg-gradient-to-r from-violet-500 to-indigo-600 p-2.5 sm:p-3 rounded-xl shadow-lg">
                  <Key className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-white" />
                </div>
              </div>
              <h1 className="text-2xl sm:text-2.5xl md:text-3xl font-bold text-gray-900 mb-1.5 sm:mb-2">
                {isSubmitted ? "Password Reset Success!" : "Create New Password"}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 px-2">
                {isSubmitted 
                  ? "Your password has been successfully updated"
                  : "Enter your new password below"
                }
              </p>
            </div>
            
            {/* Success Message */}
            {isSubmitted ? (
              <div className="space-y-4 sm:space-y-5 md:space-y-6 mt-6 sm:mt-7 md:mt-8">
                <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-5 md:p-6 border border-green-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="flex-shrink-0 self-center sm:self-auto">
                      <div className="bg-green-100 p-2 rounded-full inline-flex">
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-base sm:text-lg font-semibold text-green-800 mb-1.5 sm:mb-2">
                        Password Updated!
                      </h3>
                      <div className="text-green-700 space-y-2">
                        <p className="text-sm sm:text-base">
                          Your password has been successfully reset.
                        </p>
                        <p className="text-xs sm:text-sm mt-2 sm:mt-3">
                          Redirecting you to the login page...
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-3 sm:space-y-4">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="group relative w-full flex justify-center items-center py-3 sm:py-3.5 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-xl active:scale-95"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go to Login
                  </button>
                </div>
              </div>
            ) : (
              /* Reset Password Form */
              <form className="mt-6 sm:mt-7 md:mt-8 space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
                {/* Error Message */}
                {(error || gqlError) && (
                  <div className="rounded-xl bg-red-50 p-3 sm:p-4 border border-red-200">
                    <div className="flex items-start">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-xs sm:text-sm text-red-700 block">
                          {error || gqlError?.message}
                        </span>
                        {(!token || error?.includes('token')) && (
                          <button
                            type="button"
                            onClick={handleRequestNewLink}
                            className="text-xs text-red-600 font-medium mt-1 hover:text-red-700 underline"
                          >
                            Request a new reset link
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* New Password Input */}
                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      className="bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-9 sm:pl-10 md:pl-11 pr-10 p-2.5 sm:p-3 md:p-3.5 text-sm sm:text-base transition-all"
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      disabled={gqlLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Confirm Password Input */}
                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      className="bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-9 sm:pl-10 md:pl-11 pr-10 p-2.5 sm:p-3 md:p-3.5 text-sm sm:text-base transition-all"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError('');
                      }}
                      disabled={gqlLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                {password && (
                  <div className="rounded-xl bg-blue-50 p-3 sm:p-4 border border-blue-100">
                    <div className="flex flex-col sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-3">
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mx-auto sm:mx-0 mt-0.5 flex-shrink-0" />
                      <div className="text-center sm:text-left">
                        <p className="text-xs sm:text-sm text-blue-800 font-medium mb-1.5 sm:mb-2">
                          Password Requirements:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                          <div className={`flex items-center ${password.length >= 8 ? 'text-green-600' : 'text-blue-700'}`}>
                            <CheckCircle className={`w-3 h-3 mr-1 ${password.length >= 8 ? 'opacity-100' : 'opacity-0'}`} />
                            <span>At least 8 characters</span>
                          </div>
                          <div className={`flex items-center ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-blue-700'}`}>
                            <CheckCircle className={`w-3 h-3 mr-1 ${/[A-Z]/.test(password) ? 'opacity-100' : 'opacity-0'}`} />
                            <span>One uppercase letter</span>
                          </div>
                          <div className={`flex items-center ${/[a-z]/.test(password) ? 'text-green-600' : 'text-blue-700'}`}>
                            <CheckCircle className={`w-3 h-3 mr-1 ${/[a-z]/.test(password) ? 'opacity-100' : 'opacity-0'}`} />
                            <span>One lowercase letter</span>
                          </div>
                          <div className={`flex items-center ${/[0-9]/.test(password) ? 'text-green-600' : 'text-blue-700'}`}>
                            <CheckCircle className={`w-3 h-3 mr-1 ${/[0-9]/.test(password) ? 'opacity-100' : 'opacity-0'}`} />
                            <span>One number</span>
                          </div>
                          <div className={`flex items-center ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-600' : 'text-blue-700'}`}>
                            <CheckCircle className={`w-3 h-3 mr-1 ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'opacity-100' : 'opacity-0'}`} />
                            <span>One special character</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Password Match Indicator */}
                {confirmPassword && password !== confirmPassword && (
                  <div className="text-xs text-red-600 flex items-center justify-center sm:justify-start">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Passwords do not match
                  </div>
                )}
                
                {confirmPassword && password === confirmPassword && password.length >= 8 && (
                  <div className="text-xs text-green-600 flex items-center justify-center sm:justify-start">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Passwords match
                  </div>
                )}

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={gqlLoading || !token}
                    className={`group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-xl active:scale-95 ${
                      (gqlLoading || !token) ? 'opacity-90 cursor-not-allowed' : ''
                    }`}
                  >
                    {gqlLoading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="text-sm sm:text-base">Resetting password...</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        <span className="text-sm sm:text-base">Reset Password</span>
                      </>
                    )}
                  </button>
                </div>
                
                {/* Back to Login */}
                <div className="text-center pt-2 sm:pt-3 md:pt-4">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    disabled={gqlLoading}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors flex items-center justify-center mx-auto disabled:opacity-50 active:scale-95"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </button>
                </div>
                
                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-xs sm:text-sm">
                    <span className="px-2 sm:px-3 bg-white text-gray-500">Need help?</span>
                  </div>
                </div>
                
                {/* Help Text */}
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    If you&apos;re having trouble resetting your password,{' '}
                    <a
                      href="mailto:support@elegance.com"
                      className="text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                      contact support
                    </a>
                  </p>
                </div>
              </form>
            )}
            
            {/* Footer Note */}
            <div className="pt-4 sm:pt-5 md:pt-6 mt-4 sm:mt-5 md:mt-6 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center leading-relaxed px-1">
                For security reasons, this password reset link will expire after 30 minutes.
                If you didn&apos;t request this reset, please ignore this email.
              </p>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>

      {/* Add responsive styles */}
      <style jsx global>{`
        @media (max-width: 640px) {
          input, button, a {
            -webkit-tap-highlight-color: transparent;
          }
          
          button:active {
            transform: scale(0.98);
          }
          
          /* Improve touch targets on mobile */
          button, 
          [role="button"],
          a {
            min-height: 44px;
          }
          
          /* Better scrolling on iOS */
          .min-h-screen {
            min-height: calc(var(--vh, 1vh) * 100);
          }
        }

        @media (min-width: 641px) and (max-width: 768px) {
          button:active {
            transform: scale(0.99);
          }
        }

        /* Smooth transitions for all devices */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Prevent zoom on input focus for iOS */
        @media (max-width: 640px) {
          input, select, textarea {
            font-size: 16px !important;
          }
        }
      `}</style>
    </>
  );
}
