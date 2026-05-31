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
    
    // Load the CDN if not already loaded
    if (!(window as any).PusherPushNotifications) {
      console.log('📦 [PUSH SETUP] Loading Pusher Beams CDN...');
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://js.pusher.com/beams/1.0/push-notifications-cdn.js';
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      console.log('✅ [PUSH SETUP] Pusher Beams loaded');
    }
    
    const PusherPushNotifications = (window as any).PusherPushNotifications;
    
    console.log('📝 [PUSH SETUP] Creating Beams client');
    const beams = new PusherPushNotifications.Client({
      instanceId: process.env.NEXT_PUBLIC_BEAMS_INSTANCE_ID!,
    });
    
    console.log('🚀 [PUSH SETUP] Starting Beams...');
    await beams.start();
    
    // ✅ Get token from backend
    console.log('🔑 [PUSH SETUP] Getting auth token...');
    const authResponse = await fetch('/api/push/beams-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    
    const data = await authResponse.json();
    console.log('📦 [PUSH SETUP] Auth response:', { hasToken: !!data.token });
    
    if (!data.token) {
      throw new Error('No token received from auth endpoint');
    }
    
    console.log('✅ [PUSH SETUP] Token received, length:', data.token.length);
    
    // ✅ Try both methods - Method 1: Direct token (older SDK)
    try {
      console.log('🔄 [PUSH SETUP] Trying direct token method...');
      await beams.setUserId(userId, data.token);
      console.log('✅ [PUSH SETUP] Direct token method succeeded');
    } catch (directError) {
      console.log('⚠️ [PUSH SETUP] Direct token failed, trying tokenProvider method...');
      
      // Method 2: TokenProvider (newer SDK)
      await beams.setUserId(userId, {
        tokenProvider: {
          fetchToken: async () => {
            console.log('🔄 [PUSH SETUP] TokenProvider fetchToken called');
            const response = await fetch('/api/push/beams-auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId }),
            });
            const { token } = await response.json();
            console.log('✅ [PUSH SETUP] TokenProvider got token, length:', token?.length);
            return token;
          }
        }
      });
      console.log('✅ [PUSH SETUP] TokenProvider method succeeded');
    }
    
    console.log('✅ [PUSH SETUP] User authenticated');
    
    // Wait a moment for authentication to fully complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Subscribe to user-specific interest
    console.log(`📡 [PUSH SETUP] Subscribing to user-${userId}...`);
    await beams.addDeviceInterest(`user-${userId}`);
    console.log(`✅ [PUSH SETUP] Subscribed to user-${userId}`);
    
    const interests = await beams.getDeviceInterests();
    console.log('🎯 [PUSH SETUP] Interests:', interests);
    
    console.log('🎉 [PUSH SETUP] SUCCESS! Push notifications ready');
    
  } catch (error) {
    console.error('❌ [PUSH SETUP] Failed at step:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
};
