'use client';

import { useEffect, useState } from 'react';
import { decryptToken } from '../../../utils/decryptToken';

// Declare the Pusher Beams SDK on window object
declare global {
  interface Window {
    PusherPushNotifications: any;
  }
}

export function NotificationManager() {
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    const setupPush = async () => {
      // Load SDK from CDN instead of npm package
      if (!document.querySelector('#pusher-beams-sdk')) {
        const script = document.createElement('script');
        script.id = 'pusher-beams-sdk';
        script.src = 'https://js.pusher.com/beams/1.0/push-notifications-cdn.js';
        script.async = true;
        
        script.onload = async () => {
          console.log('✅ Pusher Beams SDK loaded');
          
          if ('serviceWorker' in navigator && 'PushManager' in window) {
            await registerAndSubscribe();
          }
        };
        
        script.onerror = () => {
          console.error('❌ Failed to load Pusher Beams SDK');
        };
        
        document.head.appendChild(script);
      } else if (window.PusherPushNotifications) {
        await registerAndSubscribe();
      }
    };
    
    setupPush();
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
      
      if (result === 'granted' && window.PusherPushNotifications) {
        console.log('Step 3: Initializing Beams...');
        const beamsClient = new window.PusherPushNotifications.Client({
          instanceId: process.env.NEXT_PUBLIC_BEAMS_INSTANCE_ID!,
          serviceWorkerRegistration: registration,
        });
        
        console.log('Step 4: Starting Beams...');
        await beamsClient.start();
        
        // Get device ID to confirm it's working
        const deviceId = await beamsClient.getDeviceId();
        console.log('📱 Device ID:', deviceId);
        
        // Get encrypted user data from API
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
          console.log('🔐 Auth response:', authData);
          
          if (!authData.token) {
            console.error('❌ No token received from beams-auth endpoint');
            return;
          }
          
          await beamsClient.setUserId(userId, authData.token);
          console.log('✅ Beams user ID set successfully');
          
          // Verify the user ID was actually set
          const verifiedUserId = await beamsClient.getUserId();
          console.log('👤 Verified Beams user ID:', verifiedUserId);
          
          await beamsClient.addDeviceInterest('all-users');
          await beamsClient.addDeviceInterest(`user-${userId}`);
          
          const interests = await beamsClient.getDeviceInterests();
          console.log('🎯 Device interests:', interests);
        } else {
          console.log('⚠️ No user logged in - push will be anonymous');
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
