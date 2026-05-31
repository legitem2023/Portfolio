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




export const setupPushNotifications = async (userId?: string) => {
  try {
    console.log('🔵 [PUSH SETUP] Starting setup...');
    
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
    const beamsClient = new PusherPushNotifications.Client({
      instanceId: process.env.NEXT_PUBLIC_BEAMS_INSTANCE_ID!,
    });
    
    console.log('🚀 [PUSH SETUP] Starting Beams...');
    await beamsClient.start();
    
    // Get device ID (no userId needed!)
    const deviceId = await beamsClient.getDeviceId();
    console.log('✅ [PUSH SETUP] Successfully registered with Beams. Device ID:', deviceId);
    
    // Subscribe to an interest (like "all-users" or specific)
    //await beamsClient.addDeviceInterest("all-users");
    //console.log('✅ [PUSH SETUP] Subscribed to all-users');
    
    // If you have a userId and want user-specific notifications
    if (userId) {
      await beamsClient.addDeviceInterest(`user-${userId}`);
      console.log(`✅ [PUSH SETUP] Also subscribed to user-${userId}`);
    }
    
    const interests = await beamsClient.getDeviceInterests();
    console.log('🎯 [PUSH SETUP] Current interests:', interests);
    
    console.log('🎉 [PUSH SETUP] SUCCESS! Push notifications ready');
    
  } catch (error) {
    console.error('❌ [PUSH SETUP] Failed:', error);
  }
};
