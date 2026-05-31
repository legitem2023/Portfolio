'use client';

import { useEffect, useState } from 'react';
import * as PusherPushNotifications from '@pusher/push-notifications-web';
import { decryptToken } from '../../../utils/decryptToken'; // Adjust path as needed

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
        
        // DEBUG: Get device ID
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
          // Decrypt the token to get user payload
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
          
          const { token } = await authResponse.json();
          await beamsClient.setUserId(userId, token);
          console.log('✅ Beams user ID set successfully');
          
          // DEBUG: Verify user ID was set
          const currentUserId = await beamsClient.getUserId();
          console.log('👤 Current Beams user ID:', currentUserId);
          
          await beamsClient.addDeviceInterest('all-users');
          await beamsClient.addDeviceInterest(`user-${userId}`);
          console.log(`✅ Subscribed to all-users and user-${userId}`);
          
          // DEBUG: Get all interests to verify subscription
          const interests = await beamsClient.getDeviceInterests();
          console.log('🎯 Device interests after subscription:', interests);
        } else {
          console.log('⚠️ No user logged in - push will be anonymous');
          await beamsClient.addDeviceInterest('all-users');
          console.log('✅ Subscribed to all-users interest');
          
          // DEBUG: Get all interests
          const interests = await beamsClient.getDeviceInterests();
          console.log('🎯 Device interests (anonymous):', interests);
        }
        
        // DEBUG: Test a direct notification from client
        console.log('🧪 Testing notification visibility...');
        registration.showNotification('Debug Test', {
          body: 'If you see this, service worker is working!',
          icon: '/icon.png',
          badge: '/badge.png',
          vibrate: [200, 100, 200]
        });
        
      } else {
        console.log('❌ Notification permission denied. Current status:', result);
      }
    } catch (error) {
      console.error('❌ Push setup error:', error);
    }
  };

  return null;
}
