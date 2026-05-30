'use client';

import { useEffect, useState } from 'react';
import * as PusherPushNotifications from '@pusher/push-notifications-web';

export function NotificationManager() {
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      registerAndSubscribe();
    }
  }, []);

  const registerAndSubscribe = async () => {
    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered');
      
      // Request permission
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        // Initialize Beams
        const beamsClient = new PusherPushNotifications.Client({
          instanceId: process.env.NEXT_PUBLIC_BEAMS_INSTANCE_ID!,
          serviceWorkerRegistration: registration,
        });
        
        await beamsClient.start();
        await beamsClient.addDeviceInterest('all-users');
        console.log('Subscribed to all-users interest');
      }
    } catch (error) {
      console.error('Push setup error:', error);
    }
  };

  return null;
}
