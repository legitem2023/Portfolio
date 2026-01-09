// services/notificationService.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Define NotificationType manually based on your schema
export enum NotificationType {
  ORDER_UPDATE = 'ORDER_UPDATE',
  PAYMENT_CONFIRMATION = 'PAYMENT_CONFIRMATION',
  SHIPMENT = 'SHIPMENT',
  PROMOTIONAL = 'PROMOTIONAL',
  SUPPORT = 'SUPPORT'
}

// Types based on your actual Notification schema - NO metadata
export interface NotificationInput {
  userId: string; // From relation to User
  type: NotificationType;
  title: string;
  message: string;
  isRead?: boolean; // Boolean field
  link?: string; // String field (not nullable in schema)
}

export interface CreateNotificationOptions {
  requireUserExists?: boolean;
  skipValidation?: boolean;
}

export interface NotificationResult {
  success: boolean;
  notification?: any;
  error?: string;
  data?: NotificationInput;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface NotificationWithUser {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean; // Boolean, not string
  link: string | null; // In DB it might allow null
  createdAt: Date;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Create a notification with validation
 */
export const createNotification = async (
  notificationData: NotificationInput,
  options: CreateNotificationOptions = {}
): Promise<NotificationWithUser> => {
  const {
    requireUserExists = true,
    skipValidation = false
  } = options;

  const {
    userId,
    type,
    title,
    message,
    link = null,
    isRead = false, // Default to false (unread)
  } = notificationData;

  try {
    // 1. Validate required fields
    if (!skipValidation) {
      if (!userId || !type || !title || !message) {
        throw new Error('Missing required fields: userId, type, title, or message');
      }

      // Validate the type is a valid NotificationType
      if (!Object.values(NotificationType).includes(type as NotificationType)) {
        throw new Error(`Invalid notification type: ${type}`);
      }

      // 2. Validate user exists if required
      if (requireUserExists) {
        const userExists = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true }
        });

        if (!userExists) {
          throw new Error('User not found');
        }
      }
    }

    // 3. Create notification - NO metadata
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
        isRead,
        createdAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName:true
          }
        }
      }
    });

    return notification as NotificationWithUser;
  } catch (error: any) {
    console.error('Notification creation error:', error);
    throw new Error(`Failed to create notification: ${error.message}`);
  }
};

/**
 * Helper: Create multiple notifications at once
 */
export const createMultipleNotifications = async (
  notificationsArray: NotificationInput[],
  options: CreateNotificationOptions = {}
): Promise<NotificationResult[]> => {
  const results: NotificationResult[] = [];
  
  for (const notificationData of notificationsArray) {
    try {
      const notification = await createNotification(notificationData, options);
      results.push({ success: true, notification });
    } catch (error: any) {
      results.push({ 
        success: false, 
        error: error.message, 
        data: notificationData 
      });
    }
  }
  
  return results;
};

/**
 * Helper: Validate notification data
 */
export const validateNotificationData = (data: NotificationInput): ValidationResult => {
  const errors: string[] = [];
  
  if (!data.userId) errors.push('userId is required');
  if (!data.type) errors.push('type is required');
  if (!data.title) errors.push('title is required');
  if (!data.message) errors.push('message is required');
  
  // Validate type is valid
  if (data.type && !Object.values(NotificationType).includes(data.type as NotificationType)) {
    errors.push(`Invalid notification type. Must be one of: ${Object.values(NotificationType).join(', ')}`);
  }
  
  if (data.title && data.title.length > 255) {
    errors.push('title must be less than 255 characters');
  }
  
  if (data.message && data.message.length > 2000) {
    errors.push('message must be less than 2000 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Create notification with pre-validation
 */
export const createValidatedNotification = async (
  notificationData: NotificationInput
): Promise<NotificationWithUser> => {
  const validation = validateNotificationData(notificationData);
  
  if (!validation.isValid) {
    throw new Error(`Invalid notification data: ${validation.errors.join(', ')}`);
  }
  
  return createNotification(notificationData);
};

/**
 * Helper: Mark notification as read
 */
export const markAsRead = async (notificationId: string): Promise<NotificationWithUser> => {
  try {
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName:true
          }
        }
      }
    });
    
    return notification as NotificationWithUser;
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    throw new Error(`Failed to mark notification as read: ${error.message}`);
  }
};
