'use client';

import { useEffect, useState } from 'react';
import { decryptToken } from '../../../utils/decryptToken';

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
        // Dynamically import the SDK
        const PusherPushNotifications = await import('@pusher/push-notifications-web');
        const beamsClient = PusherPushNotifications.default || PusherPushNotifications;
        
        console.log('Step 3: Initializing Beams...');
        const client = new beamsClient.Client({
          instanceId: process.env.NEXT_PUBLIC_BEAMS_INSTANCE_ID!,
          serviceWorkerRegistration: registration,
        });
        
        console.log('Step 4: Starting Beams...');
        await client.start();
        
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
          // Decrypt the token to get user payload
          const payload = await decryptToken(encryptedToken, secret);
          userId = payload?.userId;
          console.log('🔑 Decrypted user ID:', userId);
        }
        
        if (userId) {
          console.log('📝 Setting Beams user ID to:', userId);
          
          // Get auth token from your backend
          const authResponse = await fetch('/api/push/beams-auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
          });
          
          const { token } = await authResponse.json();
          
          // For version 1.1.0, setUserId might be called differently
          if (client.setUserId) {
            await client.setUserId(userId, token);
            console.log('✅ Beams user ID set successfully');
          } else if (client.authenticate) {
            // Alternative method for older versions
            await client.authenticate(userId, token);
            console.log('✅ Beams authenticated successfully');
          }
          
          // Add interests
          if (client.addDeviceInterest) {
            await client.addDeviceInterest('all-users');
            await client.addDeviceInterest(`user-${userId}`);
            console.log(`✅ Subscribed to all-users and user-${userId}`);
          }
          
          // Get device ID if available
          if (client.getDeviceId) {
            const deviceId = await client.getDeviceId();
            console.log('📱 Device ID:', deviceId);
          }
        } else {
          console.log('⚠️ No user logged in - push will be anonymous');
          if (client.addDeviceInterest) {
            await client.addDeviceInterest('all-users');
            console.log('✅ Subscribed to all-users interest');
          }
        }
        
        // Test notification
        registration.showNotification('Setup Complete', {
          body: 'Push notifications are ready!',
          icon: '/icon.png',
        });
      }
    } catch (error) {
      console.error('❌ Push setup error:', error);
    }
  };

  return null;
}
