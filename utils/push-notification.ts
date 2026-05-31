// lib/push-notification.ts
import * as PusherPushNotifications from '@pusher/push-notifications-web';

interface PushNotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  orderId?: string;
  orderNumber?: string;
  image?: string;
}

export async function sendPushNotification({
  userId,
  type,
  title,
  message,
  link,
  orderId,
  orderNumber,
  image
}: PushNotificationData) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    (process.env.NODE_ENV === 'development' 
                      ? 'http://localhost:3000' 
                      : 'https://portfolio-xi-eight-92.vercel.app');
    const url = `${baseUrl}/api/push/send`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        title: title,
        body: message,
        url: link ? `/${link}` : '/',
        data: {
          type: type,
          userId: userId,
          orderId: orderId,
          orderNumber: orderNumber,
          image: image,
          timestamp: new Date().toISOString()
        }
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('Push notification failed:', result);
      return false;
    }

    console.log(`✅ Push sent to user ${userId} for:`, type);
    return true;
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    return false;
  }
}



export const setupPushNotifications = async (userId: string) => {
  try {
    console.log('🔵 [PUSH SETUP] Starting setup for userId:', userId);
    
    if (typeof window === 'undefined') {
      console.log('❌ [PUSH SETUP] Server-side - skipping push setup');
      return;
    }
    
    console.log('✅ [PUSH SETUP] Running in browser');
    
    // Request notification permission first
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('❌ [PUSH SETUP] Notification permission denied');
      return;
    }
    console.log('✅ [PUSH SETUP] Notification permission granted');
    
    console.log('📝 [PUSH SETUP] Creating Beams client');
    const beams = new PusherPushNotifications.Client({
      instanceId: process.env.NEXT_PUBLIC_BEAMS_INSTANCE_ID!,
    });
    
    console.log('🚀 [PUSH SETUP] Starting Beams...');
    await beams.start();
    
    // ✅ FIX: Use tokenProvider object with fetchToken method
    console.log('🔑 [PUSH SETUP] Setting up token provider...');
    
    await beams.setUserId(userId, {
      tokenProvider: {
        fetchToken: async () => {
          console.log('🔄 [PUSH SETUP] fetchToken called - getting fresh token...');
          const authResponse = await fetch('/api/push/beams-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          });
          
          const { token } = await authResponse.json();
          
          if (!token) {
            throw new Error('No token received from auth endpoint');
          }
          
          console.log('✅ [PUSH SETUP] Token provided, length:', token.length);
          return token;
        }
      }
    });
    
    console.log('✅ [PUSH SETUP] User authenticated with token provider');
    
    // Wait a moment for authentication to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Subscribe to user-specific interest
    console.log(`📡 [PUSH SETUP] Subscribing to user-${userId}...`);
    await beams.addDeviceInterest(`user-${userId}`);
    console.log(`✅ [PUSH SETUP] Subscribed to user-${userId}`);
    
    const interests = await beams.getDeviceInterests();
    console.log('🎯 [PUSH SETUP] Interests:', interests);
    
    console.log('🎉 [PUSH SETUP] SUCCESS! Push notifications ready');
    
  } catch (error) {
    console.error('❌ [PUSH SETUP] Failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  }
};
