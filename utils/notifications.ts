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
    actions?: NotificationAction[];
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

// Notification utility class
export class NotificationService {
    private defaultIcon: string;
    private defaultOptions: Partial<NotificationOptions>;
    
    constructor(defaultIcon?: string, defaultOptions: Partial<NotificationOptions> = {}) {
        this.defaultIcon = defaultIcon || "https://cdn-icons-png.flaticon.com/512/1827/1827304.png";
        this.defaultOptions = defaultOptions;
    }
    
    // Show notification with instance defaults
    public async show(
        title: string,
        message: string,
        iconUrl?: string,
        customOptions: Partial<NotificationOptions> = {}
    ): Promise<NotificationResult> {
        const finalIcon = iconUrl || this.defaultIcon;
        const finalOptions = { ...this.defaultOptions, ...customOptions };
        
        return showNotification(title, message, finalIcon, finalOptions);
    }
    
    // Check if notifications are supported
    public static isSupported(): boolean {
        return "Notification" in window;
    }
    
    // Get current permission status
    public static getPermissionStatus(): NotificationPermission {
        return Notification.permission;
    }
    
    // Request permission explicitly
    public static async requestPermission(): Promise<NotificationPermission> {
        return Notification.requestPermission();
    }
    
    // Create notification with actions (if supported)
    public static async showWithActions(
        title: string,
        message: string,
        actions: NotificationAction[],
        iconUrl?: string
    ): Promise<NotificationResult> {
        const options: Partial<NotificationOptions> = {
            actions: actions,
            requireInteraction: true
        };
        
        return showNotification(title, message, iconUrl || null, options);
    }
}

// Pre-defined notification types
export const notificationPresets = {
    success: (title: string, message: string) => 
        showNotification(title, message, "https://cdn-icons-png.flaticon.com/512/190/190411.png"),
    
    error: (title: string, message: string) => 
        showNotification(title, message, "https://cdn-icons-png.flaticon.com/512/1828/1828843.png", {
            requireInteraction: true
        }),
    
    warning: (title: string, message: string) => 
        showNotification(title, message, "https://cdn-icons-png.flaticon.com/512/1828/1828640.png"),
    
    info: (title: string, message: string) => 
        showNotification(title, message, "https://cdn-icons-png.flaticon.com/512/1828/1828795.png")
};

// Default export
export default showNotification;
