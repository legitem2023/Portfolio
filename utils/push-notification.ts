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

// ✅ Export the setup function for use in login page
export const setupPushNotifications = async (userId: string) => {
  try {
    // Check if Pusher Beams is available (browser only)
    if (typeof window === 'undefined') {
      console.log('Server-side - skipping push setup');
      return;
    }
    
    // Check if Pusher Beams client is loaded
    if (!window.PusherPushNotifications) {
      console.log('Pusher Beams not loaded yet, waiting...');
      // Wait a bit for the script to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!window.PusherPushNotifications) {
        console.error('Pusher Beams still not loaded');
        return;
      }
    }
    
    const beams = new window.PusherPushNotifications.Client({
      instanceId: process.env.NEXT_PUBLIC_BEAMS_INSTANCE_ID!,
    });
    
    await beams.start();
    
    // This will call your /api/push/beams-auth endpoint
    await beams.setUserId(userId, {
      url: '/api/push/beams-auth',
    });
    
    // Add personal interest for this user
    await beams.addDeviceInterest(`user-${userId}`);
    await beams.addDeviceInterest('all-users'); // Optional: keep for broadcast
    
    console.log('✅ Push notifications enabled for user:', userId);
    return true;
  } catch (error) {
    console.error('Failed to setup push notifications:', error);
    return false;
  }
};
