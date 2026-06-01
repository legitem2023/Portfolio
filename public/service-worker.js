// Import Pusher Beams service worker
importScripts('https://js.pusher.com/beams/service-worker.js');

// Handle push notifications
self.addEventListener('push', function(event) {
  // ✅ THIS PREVENTS THE DUPLICATE NOTIFICATION FROM BEAMS
  event.stopImmediatePropagation();
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'You have a new notification',
      icon: data.icon || '/icon-192.png',
      badge: 'https://portfolio-xi-eight-92.vercel.app/VendorCity.webp',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/',
        id: data.notificationId || Date.now(),
        // Store the full payload for later use
        title: data.title || 'VendorCity',
        body: data.body || 'You have a new notification'
      },
      actions: [
        {
          action: 'open',
          title: 'Open'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'VendorCity', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Handle dismiss button
  if (event.action === 'dismiss') {
    console.log('Notification dismissed by user');
    return;
  }
  
  // Handle open button (or clicking the notification body)
  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(function(clientList) {
          // Check if there's already a window/tab open with this URL
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          // If no window is open, open a new one
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});
