// types/notification.ts
export enum NotificationType {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_UPDATED = 'ORDER_UPDATED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  ACCOUNT_VERIFIED = 'ACCOUNT_VERIFIED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  NEW_MESSAGE = 'NEW_MESSAGE',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  PROMOTIONAL = 'PROMOTIONAL',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
  user: User;
}

export interface NotificationEdge {
  node: Notification;
  cursor: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean; // Added based on your schema
  startCursor: string | null;
  endCursor: string | null;
}

export interface NotificationConnection {
  edges: NotificationEdge[]; // Changed from Notification[] to NotificationEdge[]
  pageInfo: PageInfo;
  totalCount: number;
  unreadCount: number;
}

export interface NotificationFilters {
  isRead?: boolean;
  type?: NotificationType;
  limit?: number;
  cursor?: string;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

// Query Response Types
export interface GetNotificationsResponse {
  notifications: NotificationConnection;
}

export interface GetNotificationResponse {
  notification: Notification;
}

export interface GetUnreadCountResponse {
  unreadNotificationCount: number;
}

// Helper type for extracting just the notifications array (for convenience)
export type NotificationsArray = Notification[];

// Helper function to extract notifications from connection
export const extractNotifications = (connection: NotificationConnection): Notification[] => {
  return connection.edges.map(edge => edge.node);
};

// Helper function to extract notifications with cursor
export const extractNotificationsWithCursor = (
  connection: NotificationConnection
): Array<Notification & { cursor: string }> => {
  return connection.edges.map(edge => ({
    ...edge.node,
    cursor: edge.cursor
  }));
};

// Mutation Input Types
export interface CreateNotificationVariables {
  input: CreateNotificationInput;
}

export interface MarkAsReadVariables {
  id: string;
}

export interface MarkAllAsReadVariables {
  userId: string;
}

export interface DeleteNotificationVariables {
  id: string;
}

export interface DeleteAllReadVariables {
  userId: string;
}

// Response types for mutations
export interface MarkAsReadResponse {
  markNotificationAsRead: {
    id: string;
    isRead: boolean;
  };
}

export interface MarkAllAsReadResponse {
  markAllNotificationsAsRead: boolean;
}

export interface DeleteNotificationResponse {
  deleteNotification: boolean;
}

export interface CreateNotificationResponse {
  createNotification: Notification;
}
