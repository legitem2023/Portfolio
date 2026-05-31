// lib/push-notification.ts

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
    // Use absolute URL for server-side fetch
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
        userId: userId,              // ✅ This targets specific user
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
    
    // Check if Pusher Beams is available (browser only)
    if (typeof window === 'undefined') {
      console.log('❌ [PUSH SETUP] Server-side - skipping push setup');
      return;
    }
    
    console.log('✅ [PUSH SETUP] Running in browser');
    
    // ✅ Use type assertion to avoid TypeScript error
    const PusherPushNotifications = (window as any).PusherPushNotifications;
    
    if (!PusherPushNotifications) {
      console.log('❌ [PUSH SETUP] Pusher Beams not loaded yet');
      return;
    }
    
    console.log('✅ [PUSH SETUP] Pusher Beams library loaded');
    
    console.log('📝 [PUSH SETUP] Creating Beams client with instanceId:', process.env.NEXT_PUBLIC_BEAMS_INSTANCE_ID);
    const beams = new PusherPushNotifications.Client({
      instanceId: process.env.NEXT_PUBLIC_BEAMS_INSTANCE_ID!,
    });
    
    console.log('🚀 [PUSH SETUP] Starting Beams...');
    await beams.start();
    console.log('✅ [PUSH SETUP] Beams started successfully');
    
    console.log('🔗 [PUSH SETUP] Setting userId to:', userId);
    await beams.setUserId(userId, {
      url: '/api/push/beams-auth',
    });
    console.log('✅ [PUSH SETUP] userId set successfully');
    
    console.log('📡 [PUSH SETUP] Adding device interest: user-' + userId);
    await beams.addDeviceInterest(`user-${userId}`);
    console.log('✅ [PUSH SETUP] Added interest: user-' + userId);
    
    console.log('📡 [PUSH SETUP] Adding device interest: all-users');
    await beams.addDeviceInterest('all-users');
    console.log('✅ [PUSH SETUP] Added interest: all-users');
    
    // Get and log the device ID
    try {
      const deviceId = await beams.getDeviceId();
      console.log('🆔 [PUSH SETUP] Device ID:', deviceId);
    } catch (err) {
      console.log('⚠️ [PUSH SETUP] Could not get device ID');
    }
    
    console.log('🎉 [PUSH SETUP] SUCCESS! Push notifications enabled for user:', userId);
    console.log('📊 Summary:');
    console.log('   - User ID:', userId);
    console.log('   - Interests: user-' + userId + ', all-users');
    console.log('   - Status: Active');
    
  } catch (error) {
    console.error('❌ [PUSH SETUP] Failed to setup push notifications:', error);
    console.error('Error details:', {
      name: error?.name,
      message: error?.message,
      userId: userId
    });
  }
};
