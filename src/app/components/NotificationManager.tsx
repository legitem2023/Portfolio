'use client';

import { useEffect, useState } from 'react';
import * as PusherPushNotifications from '@pusher/push-notifications-web';

export function NotificationManager() {
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    // DEBUG: Check if env var is loaded
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
        
        console.log('Step 5: Adding device interest...');
        await beamsClient.addDeviceInterest('all-users');
        
        // JUST THIS ONE LINE ADDED - shows subscriber confirmed
        console.log('✅ Subscribed to all-users interest - You are now a subscriber!');
      }
    } catch (error) {
      console.error('❌ Push setup error:', error);
    }
  };

  return null;
}
