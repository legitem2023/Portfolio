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

// New return-based result types
export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Old interface for backward compatibility (if needed)
export interface NotificationResult {
  success: boolean;
  notification?: any;
  error?: string;
  data?: NotificationInput;
}

/**
 * Create a notification with validation - return-based error handling
 */
export const createNotification = async (
  notificationData: NotificationInput,
  options: CreateNotificationOptions = {}
): Promise<ServiceResult<NotificationWithUser>> => {
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
    isRead = false,
  } = notificationData;

  try {
    // 1. Validate required fields
    if (!skipValidation) {
      if (!userId || !type || !title || !message) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: userId, type, title, or message',
            details: { missingFields: { userId: !userId, type: !type, title: !title, message: !message } }
          }
        };
      }

      // Validate the type is a valid NotificationType
      if (!Object.values(NotificationType).includes(type as NotificationType)) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid notification type: ${type}`,
            details: { validTypes: Object.values(NotificationType) }
          }
        };
      }

      // 2. Validate user exists if required
      if (requireUserExists) {
        const userExists = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true }
        });

        if (!userExists) {
          return {
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User not found',
              details: { userId }
            }
          };
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
            lastName: true
          }
        }
      }
    });

    return {
      success: true,
      data: notification as NotificationWithUser
    };
  } catch (error: any) {
    console.error('Notification creation error:', error);
    
    // Handle Prisma specific errors
    let errorCode = 'DATABASE_ERROR';
    let errorMessage = error.message;
    
    if (error.code) {
      errorCode = error.code;
      if (error.code === 'P2003') {
        errorMessage = 'Foreign key constraint failed - referenced user may not exist';
      }
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: `Failed to create notification: ${errorMessage}`,
        details: error
      }
    };
  }
};

/**
 * Helper: Create multiple notifications at once - updated for return-based approach
 */
export const createMultipleNotifications = async (
  notificationsArray: NotificationInput[],
  options: CreateNotificationOptions = {}
): Promise<ServiceResult<NotificationWithUser>[]> => {
  const results: ServiceResult<NotificationWithUser>[] = [];
  
  for (const notificationData of notificationsArray) {
    const result = await createNotification(notificationData, options);
    results.push(result);
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
 * Create notification with pre-validation - updated for return-based approach
 */
export const createValidatedNotification = async (
  notificationData: NotificationInput
): Promise<ServiceResult<NotificationWithUser>> => {
  const validation = validateNotificationData(notificationData);
  
  if (!validation.isValid) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Invalid notification data: ${validation.errors.join(', ')}`,
        details: { errors: validation.errors }
      }
    };
  }
  
  return createNotification(notificationData);
};

/**
 * Helper: Mark notification as read - updated for return-based approach
 */
export const markAsRead = async (notificationId: string): Promise<ServiceResult<NotificationWithUser>> => {
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
            lastName: true
          }
        }
      }
    });
    
    return {
      success: true,
      data: notification as NotificationWithUser
    };
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    
    let errorCode = 'DATABASE_ERROR';
    let errorMessage = error.message;
    
    if (error.code === 'P2025') {
      errorCode = 'NOTIFICATION_NOT_FOUND';
      errorMessage = 'Notification not found';
    }
    
    return {
      success: false,
      error: {
        code: errorCode,
        message: `Failed to mark notification as read: ${errorMessage}`,
        details: { notificationId }
      }
    };
  }
};

/**
 * Additional helper functions that maintain the return-based pattern
 */

/**
 * Get notifications for a user
 */
export const getUserNotifications = async (
  userId: string,
  options: { unreadOnly?: boolean; limit?: number } = {}
): Promise<ServiceResult<NotificationWithUser[]>> => {
  const { unreadOnly = false, limit = 50 } = options;
  
  try {
    const whereClause: any = { userId };
    if (unreadOnly) {
      whereClause.isRead = false;
    }
    
    const notifications = await prisma.notification.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    
    return {
      success: true,
      data: notifications as NotificationWithUser[]
    };
  } catch (error: any) {
    console.error('Error getting user notifications:', error);
    
    return {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: `Failed to get notifications: ${error.message}`,
        details: { userId }
      }
    };
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId: string): Promise<ServiceResult<{ deleted: boolean }>> => {
  try {
    await prisma.notification.delete({
      where: { id: notificationId }
    });
    
    return {
      success: true,
      data: { deleted: true }
    };
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    
    let errorCode = 'DATABASE_ERROR';
    let errorMessage = error.message;
    
    if (error.code === 'P2025') {
      errorCode = 'NOTIFICATION_NOT_FOUND';
      errorMessage = 'Notification not found';
    }
    
    return {
      success: false,
      error: {
        code: errorCode,
        message: `Failed to delete notification: ${errorMessage}`,
        details: { notificationId }
      }
    };
  }
};

/**
 * Compatibility function for backward compatibility (if you need to maintain the old throwing interface)
 * This can be used temporarily while migrating existing code
 */
export const createNotificationLegacy = async (
  notificationData: NotificationInput,
  options: CreateNotificationOptions = {}
): Promise<NotificationWithUser> => {
  const result = await createNotification(notificationData, options);
  
  if (!result.success) {
    throw new Error(result.error?.message || 'Unknown error creating notification');
  }
  
  return result.data!;
};

/**
 * Helper to check if a result is successful (type guard)
 */
export const isSuccess = <T>(result: ServiceResult<T>): result is ServiceResult<T> & { success: true; data: T } => {
  return result.success === true && result.data !== undefined;
};

/**
 * Helper to check if a result is an error (type guard)
 */
export const isError = <T>(result: ServiceResult<T>): result is ServiceResult<T> & { success: false; error: { code: string; message: string } } => {
  return result.success === false && result.error !== undefined;
};
