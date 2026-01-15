// utils/notifications.ts

// Type definitions
export interface NotificationOptions {
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    requireInteraction?: boolean;
    silent?: boolean;
    vibrate?: number[];
    data?: any;
    timestamp?: number;
    image?: string;
}

export interface NotificationResult {
    type: 'click' | 'close' | 'timeout' | 'error';
    notification: Notification;
    timestamp: number;
    data?: any;
}

// Main function to trigger browser push notifications
export function showNotification(
    title: string,
    message: string,
    iconUrl: string | null = null,
    customOptions: Partial<NotificationOptions> = {}
): Promise<NotificationResult> {
    // Check if browser supports notifications
    if (!("Notification" in window)) {
        console.error("This browser does not support notifications");
        return Promise.reject(new Error("Notifications not supported"));
    }
    
    // Check if permission is already granted
    if (Notification.permission === "granted") {
        return createNotification(title, message, iconUrl, customOptions);
    } 
    // If permission is not denied, request it
    else if (Notification.permission !== "denied") {
        return Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                return createNotification(title, message, iconUrl, customOptions);
            } else {
                return Promise.reject(new Error("Permission denied by user"));
            }
        });
    } else {
        return Promise.reject(new Error("Notification permission previously denied"));
    }
}

// Helper function to create the notification
function createNotification(
    title: string,
    message: string,
    iconUrl: string | null,
    customOptions: Partial<NotificationOptions>
): Promise<NotificationResult> {
    const defaultOptions: NotificationOptions = {
        body: message,
        icon: iconUrl || "https://cdn-icons-png.flaticon.com/512/1827/1827304.png",
        badge: "https://cdn-icons-png.flaticon.com/512/1827/1827304.png",
        tag: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        requireInteraction: false,
        silent: false,
        vibrate: [200, 100, 200],
        timestamp: Date.now()
    };
    
    // Merge custom options with defaults
    const options: NotificationOptions = { ...defaultOptions, ...customOptions };
    
    // Create and show the notification
    const notification = new Notification(title, options);
    
    // Return a promise that resolves with notification event handlers
    return new Promise<NotificationResult>((resolve) => {
        // Add click handler
        notification.onclick = function(event: Event) {
            event.preventDefault();
            resolve({
                type: "click",
                notification: notification,
                timestamp: Date.now(),
                data: (notification as any).data
            });
            notification.close();
        };
        
        // Add close handler
        notification.onclose = function() {
            resolve({
                type: "close",
                notification: notification,
                timestamp: Date.now(),
                data: (notification as any).data
            });
        };
        
        // Add error handler
        notification.onerror = function(event: Event) {
            resolve({
                type: "error",
                notification: notification,
                timestamp: Date.now()
            });
        };
        
        // Auto-resolve if no interaction after 10 seconds
        setTimeout(() => {
            if (notification) {
                resolve({
                    type: "timeout",
                    notification: notification,
                    timestamp: Date.now()
                });
                notification.close();
            }
        }, 10000);
    });
}

// Default export
export default showNotification;
