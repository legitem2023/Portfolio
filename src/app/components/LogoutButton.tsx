// components/LogoutButton.tsx
'use client';
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch } from "react-redux"
import { setActiveIndex } from '../../../Redux/activeIndexSlice'
import { persistor } from '../../../Redux/store'
import { ChevronRight, LogOut, Loader2, CheckCircle } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [animationState, setAnimationState] = useState<'idle' | 'loading' | 'success'>('idle')

  const handleLogout = async () => {
    const confirmLogout = confirm('Are you sure you want to logout?')
    if (!confirmLogout) {
      return
    }
    
    setIsLoggingOut(true);
    setAnimationState('loading');
    
    // Simulate a short delay to show the loading animation
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      await signOut({
        redirect: true,
        callbackUrl: '/Login',
      });
      setAnimationState('success');
      
      // Brief success state before redirect
      setTimeout(() => {
        router.push('/Login');
      }, 300);
    } catch (error) {
      console.error('Logout failed:', error);
      setAnimationState('idle');
      setIsLoggingOut(false);
    }
  };
  
  return (  
    <button
      className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-300 ease-out hover:pl-5 hover:shadow-sm relative overflow-hidden"
      disabled={isLoggingOut}
      onClick={handleLogout}
    >
      {/* Loading overlay with animation */}
      {animationState === 'loading' && (
        <div className="absolute inset-0 bg-blue-50 animate-pulse" />
      )}
      
      {/* Animated Icon */}
      <div className="relative">
        {animationState === 'idle' && (
          <LogOut className="mr-3 text-gray-400 w-5 h-5 transition-all duration-300" />
        )}
        {animationState === 'loading' && (
          <Loader2 className="mr-3 text-blue-500 w-5 h-5 animate-spin transition-all duration-300" />
        )}
        {animationState === 'success' && (
          <CheckCircle className="mr-3 text-green-500 w-5 h-5 transition-all duration-300 transform scale-0 animate-[scaleIn_0.3s_ease-out_forwards]" />
        )}
      </div>
      
      <span className="flex-1 transition-all duration-300">
        {animationState === 'idle' && 'Logout'}
        {animationState === 'loading' && 'Logging out...'}
        {animationState === 'success' && 'Exiting..!'}
      </span>
      
      <ChevronRight className={`text-gray-400 w-4 h-4 transform transition-all duration-300 group-hover:translate-x-1 ${
        animationState !== 'idle' ? 'opacity-0' : ''
      }`} />
    </button>
  );
}
