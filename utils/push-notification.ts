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
