// components/FirebaseGoogleButton.tsx
"use client";
import { useState } from 'react';
import { auth, googleProvider, signInWithPopup } from '@/lib/firebase-client';

interface FirebaseGoogleButtonProps {
  onSuccess?: (token: string) => void;
  onError?: (error: string) => void;
}

export default function FirebaseGoogleButton({ onSuccess, onError }: FirebaseGoogleButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      // Open popup - PWA stays in standalone mode!
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Create a credential object that matches your existing Google login mutation
      const credential = {
        googleId: user.uid,
        email: user.email,
        name: user.displayName,
        image: user.photoURL,
      };
      
      // Call your existing GraphQL mutation
      // You'll need to implement this mutation call based on your GraphQL client setup
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation GoogleLogin($input: GoogleLoginInput!) {
              googleLogin(input: $input) {
                token
                user {
                  id
                  email
                  name
                  role
                }
              }
            }
          `,
          variables: {
            input: credential
          }
        }),
      });
      
      const data = await response.json();
      
      if (data.data?.googleLogin?.token) {
        // Return the token to your Login component
        onSuccess?.(data.data.googleLogin.token);
      } else {
        throw new Error(data.errors?.[0]?.message || 'Google login failed');
      }
      
    } catch (error: any) {
      console.error('Google popup error:', error);
      
      let errorMessage = 'Google sign-in failed. Please try again.';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in cancelled - popup was closed';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup blocked! Please allow popups for this website';
      }
      
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className={`w-full inline-flex justify-center items-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium transition-colors ${
        isLoading
          ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      <span>{isLoading ? "Signing in..." : "Sign in with Google"}</span>
    </button>
  );
}
