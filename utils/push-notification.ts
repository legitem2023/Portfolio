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
    // Check if Pusher Beams is available (browser only)
    if (typeof window === 'undefined') {
      console.log('Server-side - skipping push setup');
      return;
    }
    
    // ✅ Use type assertion to avoid TypeScript error
    const PusherPushNotifications = (window as any).PusherPushNotifications;
    
    if (!PusherPushNotifications) {
      console.log('Pusher Beams not loaded yet');
      return;
    }
    
    const beams = new PusherPushNotifications.Client({
      instanceId: process.env.NEXT_PUBLIC_BEAMS_INSTANCE_ID!,
    });
    
    await beams.start();
    
    await beams.setUserId(userId, {
      url: '/api/push/beams-auth',
    });
    
    await beams.addDeviceInterest(`user-${userId}`);
    await beams.addDeviceInterest('all-users');
    
    console.log('✅ Push notifications enabled for user:', userId);
  } catch (error) {
    console.error('Failed to setup push notifications:', error);
  }
};
