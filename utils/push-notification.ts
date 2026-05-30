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
                    'https://portfolio-xi-eight-92.vercel.app';
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
          timestamp: new Date().toISOString()
        },
        image: image
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Push notification failed:', error);
      return false;
    }

    console.log('Push notification sent successfully for:', type);
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}


// Add this function inside your component (after decryptUserToken or near other functions)
export const setupPushNotifications = async (userId: string) => {
  try {
    // Check if Pusher Beams is available
    if (typeof window === 'undefined' || !window.PusherPushNotifications) {
      console.log('Pusher Beams not loaded yet');
      return;
    }
    
    const beams = new window.PusherPushNotifications.Client({
      instanceId: process.env.NEXT_PUBLIC_BEAMS_INSTANCE_ID!,
    });
    
    await beams.start();
    
    // This will call your /api/push/beams-auth endpoint
    await beams.setUserId(userId, {
      url: '/api/push/beams-auth',
    });
    
    // Add personal interest
    await beams.addDeviceInterest(`user-${userId}`);
    
    console.log('✅ Push notifications enabled for user:', userId);
  } catch (error) {
    console.error('Failed to setup push notifications:', error);
  }
};
