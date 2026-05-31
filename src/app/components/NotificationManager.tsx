'use client';

import { useEffect, useState } from 'react';
import { decryptToken } from '../../../utils/decryptToken';

declare global {
  interface Window {
    PusherPushNotifications: any;
  }
}

export function NotificationManager() {
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    const setupPush = async () => {
      try {
        const PusherPushNotifications = await import('@pusher/push-notifications-web');
        // ✅ FIX: Rename 'module' to 'pusherModule' or any other name
        const pusherModule = PusherPushNotifications.default || PusherPushNotifications;
        
        console.log('✅ Pusher Beams module loaded');
        
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          await registerAndSubscribe(pusherModule);
        }
      } catch (error) {
        console.error('Failed to load Pusher Beams:', error);
      }
    };
    
    setupPush();
  }, []);

  const registerAndSubscribe = async (PusherPushNotifications: any) => {
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
        
        const deviceId = await beamsClient.getDeviceId();
        console.log('📱 Device ID:', deviceId);
        
        const response = await fetch('/api/protected', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        const data = await response.json();
        const encryptedToken = data?.user;
        const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz";
        
        let userId = null;
        
        if (encryptedToken) {
          const payload = await decryptToken(encryptedToken, secret);
          userId = payload?.userId;
          console.log('🔑 Decrypted user ID:', userId);
        }
        
        if (userId) {
          console.log('📝 Setting Beams user ID to:', userId);
          
          const authResponse = await fetch('/api/push/beams-auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
          });
          
          const authData = await authResponse.json();
          
          if (!authData.token) {
            console.error('❌ No token received');
            return;
          }
          
          console.log('🔐 Token received, length:', authData.token.length);
          
          // This should now work with the npm package
          await beamsClient.setUserId(userId, authData.token);
          console.log('✅ Beams user ID set successfully');
          
          await beamsClient.addDeviceInterest('all-users');
          await beamsClient.addDeviceInterest(`user-${userId}`);
          
          const interests = await beamsClient.getDeviceInterests();
          console.log('🎯 Device interests:', interests);
          
          console.log('✅ Ready to receive user-specific notifications!');
        } else {
          await beamsClient.addDeviceInterest('all-users');
          console.log('✅ Subscribed to all-users interest');
        }
      }
    } catch (error) {
      console.error('❌ Push setup error:', error);
    }
  };

  return null;
}
