'use client';

import { useEffect, useState } from 'react';
import * as PusherPushNotifications from '@pusher/push-notifications-web';

export function NotificationManager() {
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    console.log('Beams Instance ID:', process.env.NEXT_PUBLIC_BEAMS_INSTANCE_ID);
    
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      registerAndSubscribe();
    }
  }, []);

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
        
        // Get the user ID from your API
        const userResponse = await fetch('/api/protected');
        const userData = await userResponse.json();
        const userId = userData?.user?.userId;
        
        console.log('🔑 Current user ID:', userId);
        
        if (userId) {
          console.log('📝 Setting Beams user ID to:', userId);
          const authResponse = await fetch('/api/push/beams-auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
          });
          
          const { token } = await authResponse.json();
          await beamsClient.setUserId(userId, token);
          console.log('✅ Beams user ID set successfully');
        } else {
          console.log('⚠️ No user logged in - push will be anonymous');
        }
        
        console.log('Step 5: Adding device interest...');
        await beamsClient.addDeviceInterest('all-users');
        
        if (userId) {
          await beamsClient.addDeviceInterest(`user-${userId}`);
          console.log(`✅ Subscribed to user-${userId}`);
        }
        
        console.log('✅ Subscribed to all-users interest');
      }
    } catch (error) {
      console.error('❌ Push setup error:', error);
    }
  };

  return null;
}
