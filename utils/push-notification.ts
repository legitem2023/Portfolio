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
    const response = await fetch(`/api/push/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,           // Keep if your API uses this
        interest: "all-users",    // ADD THIS - your API likely needs it
        title: title,
        body: message,
        url: link ? `/${link}` : '/',
        data: {
          type: type,
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
