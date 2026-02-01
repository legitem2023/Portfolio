// pages/forgot-password.tsx
"use client";
import { useState, ChangeEvent, FormEvent } from 'react';
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
      </Head>
      
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50 p-0">
        <Header />
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl border border-indigo-100">
            {/* Logo and Header */}
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-to-r from-violet-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                  <Key className="w-10 h-10 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Forgot Password?
              </h1>
              <p className="text-gray-600">
                {isSubmitted 
                  ? "Check your email for reset instructions"
                  : "Enter your email to receive a password reset link"
                }
              </p>
            </div>
            
            {/* Success Message */}
            {isSubmitted ? (
              <div className="space-y-6">
                <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 p-6 border border-green-200 shadow-sm">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-green-800 mb-2">
                        Reset Email Sent!
                      </h3>
                      <div className="text-green-700 space-y-2">
                        <p>
                          We have sent password reset instructions to:
                        </p>
                        <p className="font-mono bg-green-100 px-3 py-1 rounded-lg inline-block">
                          {email}
                        </p>
                        <p className="text-sm mt-3">
                          Please check your inbox and spam folder. The link will expire in 30 minutes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="group relative w-full flex justify-center items-center py-3.5 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-xl"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </button>
                  
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendEmail}
                      disabled={isLoading}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors flex items-center justify-center mx-auto disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4 mr-2" />
                      )}
                      Didnt receive the email? Send again
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Reset Password Form */
              <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                {/* Error Message */}
                {error && (
                  <div className="rounded-xl bg-red-50 p-4 border border-red-200">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                      <span className="text-sm text-red-700">{error}</span>
                    </div>
                  </div>
                )}
                
                {/* Email Input */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-11 p-3.5 transition-all"
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
                <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-800 font-medium mb-1">
                        Security Information
                      </p>
                      <p className="text-xs text-blue-700">
                        The password reset link will be valid for 30 minutes. For security reasons, please check your spam folder if you dont see the email.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`group relative w-full flex justify-center items-center py-3.5 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-xl ${isLoading ? 'opacity-90 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                        Sending reset link...
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5 mr-2" />
                        Send Reset Link
                      </>
                    )}
                  </button>
                </div>
                
                {/* Back to Login */}
                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    disabled={isLoading}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors flex items-center justify-center mx-auto disabled:opacity-50"
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
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-gray-500">Need more help?</span>
                  </div>
                </div>
                
                {/* Support Contact */}
                <div className="text-center">
                  <a
                    href="mailto:support@elegance.com"
                    className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contact Support
                  </a>
                </div>
              </form>
            )}
            
            {/* Footer Note */}
            <div className="pt-6 mt-6 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                For security reasons, password reset emails are only sent to registered email addresses.
                If you no longer have access to this email, please contact our support team.
              </p>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    </>
  );
  }
