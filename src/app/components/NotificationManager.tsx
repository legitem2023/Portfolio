'use client';

import { useEffect, useState } from 'react';
import * as PusherPushNotifications from '@pusher/push-notifications-web';
import { useSession } from 'next-auth/react'; // Add this

export function NotificationManager() {
  const { data: session } = useSession(); // Add this
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    console.log('Beams Instance ID:', process.env.NEXT_PUBLIC_BEAMS_INSTANCE_ID);
    
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      registerAndSubscribe();
    }
  }, [session]); // Add session to dependencies

  const registerAndSubscribe = async () => {
    try {
      console.log('Step 1: Registering service worker...');
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered');
      
      console.log('Step 2: Requesting permission...');
      const result = await Notification.requestPermission();
      setPermission(result);
      console.log('Permission result:', result);
      
      if (result === 'granted') {
        console.log('Step 3: Initializing Beams...');
        const beamsClient = new PusherPushNotifications.Client({
          instanceId: process.env.NEXT_PUBLIC_BEAMS_INSTANCE_ID!,
          serviceWorkerRegistration: registration,
        });
        
        console.log('Step 4: Starting Beams...');
        await beamsClient.start();
        
        // LOG THE USER ID FROM SESSION
        console.log('🔑 Current session user ID:', session?.user?.id);
        
        if (session?.user?.id) {
          // Set the user ID in Beams
          console.log('📝 Setting Beams user ID to:', session.user.id);
          await beamsClient.setUserId(session.user.id, {
            url: '/api/push/beams-auth',
          });
          console.log('✅ Beams user ID set successfully');
        } else {
          console.log('⚠️ No user logged in - push will be anonymous');
        }
        
        console.log('Step 5: Adding device interest...');
        await beamsClient.addDeviceInterest('all-users');
        
        if (session?.user?.id) {
          await beamsClient.addDeviceInterest(`user-${session.user.id}`);
          console.log(`✅ Subscribed to user-${session.user.id}`);
        }
        
        console.log('✅ Subscribed to all-users interest');
      }
    } catch (error) {
      console.error('❌ Push setup error:', error);
    }
  };

  return null;
}
