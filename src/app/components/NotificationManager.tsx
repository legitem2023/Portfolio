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
    // Load CDN script
    if (!document.querySelector('#pusher-beams-sdk')) {
      const script = document.createElement('script');
      script.id = 'pusher-beams-sdk';
      script.src = 'https://js.pusher.com/beams/1.0/push-notifications-cdn.js';
      script.async = true;
      script.onload = () => {
        console.log('✅ Pusher Beams CDN loaded');
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          registerAndSubscribe();
        }
      };
      script.onerror = () => {
        console.error('❌ Failed to load Pusher Beams CDN');
      };
      document.head.appendChild(script);
    } else if (window.PusherPushNotifications) {
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
      
      if (result === 'granted' && window.PusherPushNotifications) {
        console.log('Step 3: Initializing Beams...');
        const beamsClient = new window.PusherPushNotifications.Client({
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
          
          // CDN version expects the token to be passed differently
          // Try both formats
          let token = authData.token || authData;
          console.log('🔐 Token type:', typeof token);
          
          // METHOD 1: Try setUserId with token as second parameter
          try {
            await beamsClient.setUserId(userId, token);
            console.log('✅ setUserId worked with (userId, token)');
          } catch (error1) {
            console.log('Method 1 failed, trying Method 2...');
            
            // METHOD 2: Try setUserId with token in an object
            try {
              await beamsClient.setUserId(userId, { authToken: token });
              console.log('✅ setUserId worked with (userId, { authToken: token })');
            } catch (error2) {
              console.log('Method 2 failed, trying Method 3...');
              
              // METHOD 3: Try authenticate method (older versions)
              try {
                await beamsClient.authenticate(userId, token);
                console.log('✅ authenticate worked');
              } catch (error3) {
                console.error('❌ All methods failed');
                console.error('Error details:', error3);
              }
            }
          }
          
          // Add interests after successful authentication
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
