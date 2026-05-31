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
  const [sdkReady, setSdkReady] = useState(false);

  // Load CDN script once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if already loaded
    if (window.PusherPushNotifications) {
      setSdkReady(true);
      return;
    }
    
    // Check if script already exists
    if (document.querySelector('#pusher-beams-sdk')) {
      const checkInterval = setInterval(() => {
        if (window.PusherPushNotifications) {
          setSdkReady(true);
          clearInterval(checkInterval);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
    
    // Load the CDN script
    const script = document.createElement('script');
    script.id = 'pusher-beams-sdk';
    script.src = 'https://js.pusher.com/beams/1.0/push-notifications-cdn.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ Pusher Beams CDN loaded');
      setSdkReady(true);
    };
    script.onerror = () => {
      console.error('❌ Failed to load Pusher Beams CDN');
    };
    document.head.appendChild(script);
    
    return () => {
      // Cleanup
      const existingScript = document.querySelector('#pusher-beams-sdk');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (sdkReady && 'serviceWorker' in navigator && 'PushManager' in window) {
      registerAndSubscribe();
    }
  }, [sdkReady]);

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
          
          // For CDN version, the token might be in authData.token or authData itself
          const token = authData.token || authData;
          console.log('🔐 Token received, type:', typeof token);
          
          // CDN version uses this method
          await beamsClient.setUserId(userId, token);
          console.log('✅ Beams user ID set successfully');
          
          await beamsClient.addDeviceInterest('all-users');
          await beamsClient.addDeviceInterest(`user-${userId}`);
          
          const interests = await beamsClient.getDeviceInterests();
          console.log('🎯 Device interests:', interests);
          
          console.log('✅✅✅ Push notifications fully working!');
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
