// services/notificationService.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Define NotificationType - UPDATED to match frontend types
export enum NotificationType {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_UPDATED = 'ORDER_UPDATED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_CONFIRMATION = 'PAYMENT_CONFIRMATION',
  SHIPMENT = 'SHIPMENT',
  ACCOUNT_VERIFIED = 'ACCOUNT_VERIFIED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  NEW_MESSAGE = 'NEW_MESSAGE',
  SUPPORT = 'SUPPORT',
  PROMOTIONAL = 'PROMOTIONAL',
  SOCIAL = 'SOCIAL',
  SYSTEM_ALERT = 'SYSTEM_ALERT'
}

// Types based on your actual Notification schema
export interface NotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead?: boolean;
  link?: string | null;
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
  isRead: boolean;
  link: string | null;
  createdAt: Date;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

// Return-based result types
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

// Helper functions for creating specific notification types
export const createOrderNotification = async (
  userId: string,
  orderId: string,
  status: 'CREATED' | 'UPDATED' | 'DELIVERED'
): Promise<ServiceResult<NotificationWithUser>> => {
  let type: NotificationType;
  let title: string;
  let message: string;
  let link: string;

  switch (status) {
    case 'CREATED':
      type = NotificationType.ORDER_CREATED;
      title = 'Order Created';
      message = `Your order #${orderId} has been successfully created.`;
      break;
    case 'UPDATED':
      type = NotificationType.ORDER_UPDATED;
      title = 'Order Updated';
      message = `Your order #${orderId} has been updated.`;
      break;
    case 'DELIVERED':
      type = NotificationType.ORDER_DELIVERED;
      title = 'Order Delivered';
      message = `Your order #${orderId} has been delivered. Thank you for shopping with us!`;
      break;
    default:
      type = NotificationType.ORDER_UPDATED;
      title = 'Order Update';
      message = `Your order #${orderId} has been updated.`;
  }

  link = `/Orders/${orderId}`;

  return createNotification({
    userId,
    type,
    title,
    message,
    link
  });
};

export const createPaymentNotification = async (
  userId: string,
  paymentId: string,
  amount: number,
  status: 'RECEIVED' | 'FAILED'
): Promise<ServiceResult<NotificationWithUser>> => {
  const type = status === 'RECEIVED' 
    ? NotificationType.PAYMENT_RECEIVED 
    : NotificationType.PAYMENT_FAILED;
  
  const title = status === 'RECEIVED' ? 'Payment Received' : 'Payment Failed';
  const message = status === 'RECEIVED'
    ? `Payment of $${amount} has been successfully received.`
    : `Payment of $${amount} failed. Please check your payment method and try again.`;
  
  const link = `/Payments/${paymentId}`;

  return createNotification({
    userId,
    type,
    title,
    message,
    link
  });
};

export const createMessageNotification = async (
  userId: string,
  senderName: string,
  messagePreview: string
): Promise<ServiceResult<NotificationWithUser>> => {
  return createNotification({
    userId,
    type: NotificationType.NEW_MESSAGE,
    title: `New message from ${senderName}`,
    message: messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview,
    link: '/Messaging'
  });
};

export const createAccountNotification = async (
  userId: string,
  type: 'VERIFIED' | 'PASSWORD_CHANGED'
): Promise<ServiceResult<NotificationWithUser>> => {
  const notificationType = type === 'VERIFIED' 
    ? NotificationType.ACCOUNT_VERIFIED 
    : NotificationType.PASSWORD_CHANGED;
  
  const title = type === 'VERIFIED' ? 'Account Verified' : 'Password Changed';
  const message = type === 'VERIFIED'
    ? 'Your account has been successfully verified! You now have full access to all features.'
    : 'Your password has been successfully changed. If this wasn\'t you, please contact support immediately.';

  return createNotification({
    userId,
    type: notificationType,
    title,
    message,
    link: '/Profile'
  });
};

export const createSystemAlert = async (
  userId: string,
  alertTitle: string,
  alertMessage: string,
  link?: string
): Promise<ServiceResult<NotificationWithUser>> => {
  return createNotification({
    userId,
    type: NotificationType.SYSTEM_ALERT,
    title: alertTitle,
    message: alertMessage,
    link: link || '/Support'
  });
};

export const createPromotionalNotification = async (
  userId: string,
  offerTitle: string,
  offerDescription: string,
  link?: string
): Promise<ServiceResult<NotificationWithUser>> => {
  return createNotification({
    userId,
    type: NotificationType.PROMOTIONAL,
    title: offerTitle,
    message: offerDescription,
    link: link || '/Promotions'
  });
};

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

    // 3. Create notification
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
 * Create multiple notifications at once
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
 * Validate notification data
 */
export const validateNotificationData = (data: NotificationInput): ValidationResult => {
  const errors: string[] = [];
  
  if (!data.userId) errors.push('userId is required');
  if (!data.type) errors.push('type is required');
  if (!data.title) errors.push('title is required');
  if (!data.message) errors.push('message is required');
  
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
 * Mark notification as read
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
 * Get notifications for a user
 */
export const getUserNotifications = async (
  userId: string,
  options: { unreadOnly?: boolean; limit?: number; types?: NotificationType[] } = {}
): Promise<ServiceResult<NotificationWithUser[]>> => {
  const { unreadOnly = false, limit = 50, types } = options;
  
  try {
    const whereClause: any = { userId };
    if (unreadOnly) {
      whereClause.isRead = false;
    }
    if (types && types.length > 0) {
      whereClause.type = { in: types };
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
 * Get unread count for a user
 */
export const getUnreadCount = async (userId: string): Promise<ServiceResult<number>> => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });
    
    return {
      success: true,
      data: count
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: `Failed to get unread count: ${error.message}`,
        details: { userId }
      }
    };
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId: string): Promise<ServiceResult<{ count: number }>> => {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });
    
    return {
      success: true,
      data: { count: result.count }
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: `Failed to mark all as read: ${error.message}`,
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
      errorCode = 'NOTIFICATION_FOUND';
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
 * Delete all notifications for a user
 */
export const deleteAllUserNotifications = async (userId: string): Promise<ServiceResult<{ count: number }>> => {
  try {
    const result = await prisma.notification.deleteMany({
      where: { userId }
    });
    
    return {
      success: true,
      data: { count: result.count }
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: `Failed to delete notifications: ${error.message}`,
        details: { userId }
      }
    };
  }
};

/**
 * Compatibility function for backward compatibility (throws errors)
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
 * Type guard to check if a result is successful
 */
export const isSuccess = <T>(result: ServiceResult<T>): result is ServiceResult<T> & { success: true; data: T } => {
  return result.success === true && result.data !== undefined;
};

/**
 * Type guard to check if a result is an error
 */
export const isError = <T>(result: ServiceResult<T>): result is ServiceResult<T> & { success: false; error: { code: string; message: string } } => {
  return result.success === false && result.error !== undefined;
};
