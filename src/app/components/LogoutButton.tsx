// components/LogoutButton.tsx
'use client';
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch } from "react-redux"
import { setActiveIndex } from '../../../Redux/activeIndexSlice'
import { persistor } from '../../../Redux/store'
import { ChevronRight, LogOut, Loader2, CheckCircle } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useAuth } from './hooks/useAuth';
import * as PusherPushNotifications from '@pusher/push-notifications-web';

export default function LogoutButton() {
  const router = useRouter()
  const { user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [animationState, setAnimationState] = useState<'idle' | 'loading' | 'success'>('idle')

  const clearPushNotifications = async (userId: string) => {
    try {
      console.log('🔵 [LOGOUT] Clearing push notification data for user:', userId);
      
      const beamsClient = new PusherPushNotifications.Client({
        instanceId: process.env.NEXT_PUBLIC_BEAMS_INSTANCE_ID!,
      });
      
      await beamsClient.start();
      
      // Get current interests before removal (for debugging)
      const currentInterests = await beamsClient.getDeviceInterests();
      console.log('🎯 [LOGOUT] Current interests:', currentInterests);
      
      // Method 1: Remove specific interests
      if (currentInterests.includes(`user-${userId}`)) {
        await beamsClient.removeDeviceInterest(`user-${userId}`);
        console.log(`✅ [LOGOUT] Removed user-${userId} interest`);
      }
      
      if (currentInterests.includes('all-users')) {
        await beamsClient.removeDeviceInterest('all-users');
        console.log('✅ [LOGOUT] Removed all-users interest');
      }
      
      // Method 2: Or clear ALL interests (uncomment if you prefer)
      // await beamsClient.clearDeviceInterests();
      
      // Verify removal
      const interestsAfter = await beamsClient.getDeviceInterests();
      console.log('🎯 [LOGOUT] Interests after removal:', interestsAfter);
      
      // Stop the client (optional but good practice)
      await beamsClient.stop();
      
      console.log('✅ [LOGOUT] Push notifications cleared successfully');
      
    } catch (error) {
      console.error('❌ [LOGOUT] Failed to clear push notifications:', error);
      // Don't block logout if push notification cleanup fails
    }
  };

  const handleLogout = async () => {
    const confirmLogout = confirm('Are you sure you want to logout?')
    if (!confirmLogout) return;
    
    setIsLoggingOut(true);
    setAnimationState('loading');
    
    // Show loading animation
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      // Clear Beams data if user exists and we're in browser
      if (typeof window !== 'undefined' && user?.userId) {
        await clearPushNotifications(user.userId);
      }
      
      // Sign out from NextAuth
      await signOut({ redirect: false });
      
      // Clear Redux persist store
      await persistor.purge();
      
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
      className="w-full flex items-center px-4 py-3 text-left text-gray-700 rounded-lg transition-all duration-300 ease-out hover:pl-5 hover:shadow-sm relative bg-white"
      disabled={isLoggingOut}
      onClick={handleLogout}
    >
      {animationState === 'loading' && (
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 h-0.5 bg-blue-500 animate-[loadingBar_1s_ease-in-out_infinite]" />
        </div>
      )}
      
      <div className="relative z-10">
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
      
      <span className="flex-1 transition-all duration-300 relative z-10 font-medium">
        {animationState === 'idle' && 'Logout'}
        {animationState === 'loading' && (
          <span className="flex items-center gap-2">
            Logging out
            <span className="inline-flex gap-1">
              <span className="animate-bounce" style={{ animationDelay: '0s' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>.</span>
            </span>
          </span>
        )}
        {animationState === 'success' && (
          <span className="text-green-600">Logged out!</span>
        )}
      </span>
      
      <ChevronRight className={`text-gray-400 w-4 h-4 transform transition-all duration-300 group-hover:translate-x-1 relative z-10 ${
        animationState !== 'idle' ? 'opacity-0' : ''
      }`} />
    </button>
  );
}
