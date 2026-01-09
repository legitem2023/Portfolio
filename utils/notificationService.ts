// services/notificationService.ts
import { PrismaClient, NotificationType, NotificationStatus } from "@prisma/client";
const prisma = new PrismaClient();

// Types - IMPORTANT: Use the actual enums from your Prisma schema
export interface NotificationInput {
  userId: string;
  type: NotificationType; // Use the enum type instead of string
  title: string;
  message: string;
  link?: string | null;
  status?: NotificationStatus; // Use the enum type instead of string
  metadata?: Record<string, any>;
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

// Use Prisma types directly if possible
export type NotificationWithUser = {
  id: string;
  userId: string;
  type: NotificationType; // Fix: Use enum type
  title: string;
  message: string;
  link: string | null;
  status: NotificationStatus; // Fix: Use enum type
  metadata: Record<string, any>;
  createdAt: Date;
  user?: {
    id: string;
    email: string;
    name: string;
  };
};

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
    status = 'UNREAD' as NotificationStatus, // Cast to the enum type
    metadata = {}
  } = notificationData;

  try {
    // 1. Validate required fields
    if (!skipValidation) {
      if (!userId || !type || !title || !message) {
        throw new Error('Missing required fields: userId, type, title, or message');
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

    // 3. Create notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
        status,
        metadata,
        createdAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
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

// ... rest of your functions remain the same

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
