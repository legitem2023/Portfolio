// services/notificationService.js
import prisma from '../lib/prisma.js'; // Your Prisma instance

/**
 * Create a notification with validation
 * @param {Object} notificationData - Notification data
 * @param {string} notificationData.userId - User ID
 * @param {string} notificationData.type - Notification type
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.message - Notification message
 * @param {string} [notificationData.link] - Optional link
 * @param {string} [notificationData.status] - Status (default: 'UNREAD')
 * @param {Object} [notificationData.metadata] - Additional metadata
 * @param {Object} options - Additional options
 * @param {boolean} [options.requireUserExists=true] - Validate user exists
 * @param {boolean} [options.skipValidation=false] - Skip validation
 * @returns {Promise<Object>} Created notification
 * @throws {Error} If validation fails or creation fails
 */
export const createNotification = async (notificationData, options = {}) => {
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
    status = 'UNREAD',
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

    // 4. Optional: Trigger events or side effects
    // await triggerNotificationEvents(notification);

    return notification;
  } catch (error) {
    console.error('Notification creation error:', error);
    throw new Error(`Failed to create notification: ${error.message}`);
  }
};

/**
 * Helper: Create multiple notifications at once
 */
export const createMultipleNotifications = async (notificationsArray, options = {}) => {
  const results = [];
  
  for (const notificationData of notificationsArray) {
    try {
      const notification = await createNotification(notificationData, options);
      results.push({ success: true, notification });
    } catch (error) {
      results.push({ success: false, error: error.message, data: notificationData });
    }
  }
  
  return results;
};

/**
 * Helper: Validate notification data
 */
export const validateNotificationData = (data) => {
  const errors = [];
  
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
export const createValidatedNotification = async (notificationData) => {
  const validation = validateNotificationData(notificationData);
  
  if (!validation.isValid) {
    throw new Error(`Invalid notification data: ${validation.errors.join(', ')}`);
  }
  
  return createNotification(notificationData);
};
