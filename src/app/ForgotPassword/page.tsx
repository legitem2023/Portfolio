// pages/forgot-password.tsx
"use client";
import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  Mail, 
  Lock, 
  CheckCircle, 
  Shield, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  Key,
  MessageSquare
} from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate API call with realistic delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, you would call your password reset API here
      console.log('Password reset requested for:', email);
      
      // showToast('Password reset email sent!', 'success')
      setIsSubmitted(true);
      
    } catch (err) {
      console.error('Password reset failed:', err);
      setError('Failed to send reset email. Please try again.');
      // showToast('Password reset failed', 'error')
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/Login');
  };

  const handleResendEmail = () => {
    setIsSubmitted(false);
    setIsLoading(true);
    
    setTimeout(() => {
      setIsSubmitted(true);
      setIsLoading(false);
      // showToast('Reset email resent successfully!', 'success')
    }, 1000);
  };

  return (
    <>
      <Head>
        <title>Forgot Password | ELEGANCE</title>
        <meta name="description" content="Reset your ELEGANCE account password" />
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
                Forgot Password?
              </h1>
              <p className="text-sm sm:text-base text-gray-600 px-2">
                {isSubmitted 
                  ? "Check your email for reset instructions"
                  : "Enter your email to receive a password reset link"
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
                        Reset Email Sent!
                      </h3>
                      <div className="text-green-700 space-y-2">
                        <p className="text-sm sm:text-base">
                          We have sent password reset instructions to:
                        </p>
                        <p className="font-mono bg-green-100 px-2 sm:px-3 py-1 rounded-lg text-sm sm:text-base break-all inline-block">
                          {email}
                        </p>
                        <p className="text-xs sm:text-sm mt-2 sm:mt-3">
                          Please check your inbox and spam folder. The link will expire in 30 minutes.
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
                    Back to Login
                  </button>
                  
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendEmail}
                      disabled={isLoading}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors flex items-center justify-center mx-auto disabled:opacity-50 active:scale-95"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4 mr-2" />
                      )}
                      Didn't receive the email? Send again
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Reset Password Form */
              <form className="mt-6 sm:mt-7 md:mt-8 space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
                {/* Error Message */}
                {error && (
                  <div className="rounded-xl bg-red-50 p-3 sm:p-4 border border-red-200">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-red-700">{error}</span>
                    </div>
                  </div>
                )}
                
                {/* Email Input */}
                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-9 sm:pl-10 md:pl-11 p-2.5 sm:p-3 md:p-3.5 text-sm sm:text-base transition-all"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      disabled={isLoading}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Enter the email address associated with your ELEGANCE account
                  </p>
                </div>

                {/* Security Info */}
                <div className="rounded-xl bg-blue-50 p-3 sm:p-4 border border-blue-100">
                  <div className="flex flex-col sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-3">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mx-auto sm:mx-0 mt-0.5 flex-shrink-0" />
                    <div className="text-center sm:text-left">
                      <p className="text-xs sm:text-sm text-blue-800 font-medium mb-0.5 sm:mb-1">
                        Security Information
                      </p>
                      <p className="text-xs text-blue-700">
                        The password reset link will be valid for 30 minutes. For security reasons, please check your spam folder if you don't see the email.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-xl active:scale-95 ${
                      isLoading ? 'opacity-90 cursor-not-allowed' : ''
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="text-sm sm:text-base">Sending reset link...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        <span className="text-sm sm:text-base">Send Reset Link</span>
                      </>
                    )}
                  </button>
                </div>
                
                {/* Back to Login */}
                <div className="text-center pt-2 sm:pt-3 md:pt-4">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    disabled={isLoading}
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
                    <span className="px-2 sm:px-3 bg-white text-gray-500">Need more help?</span>
                  </div>
                </div>
                
                {/* Support Contact */}
                <div className="text-center">
                  <a
                    href="mailto:support@elegance.com"
                    className="inline-flex items-center text-xs sm:text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors active:scale-95"
                  >
                    <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Contact Support
                  </a>
                </div>
              </form>
            )}
            
            {/* Footer Note */}
            <div className="pt-4 sm:pt-5 md:pt-6 mt-4 sm:mt-5 md:mt-6 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center leading-relaxed px-1">
                For security reasons, password reset emails are only sent to registered email addresses.
                If you no longer have access to this email, please contact our support team.
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
