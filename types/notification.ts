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
  endCursor: string | null;
}

export interface NotificationConnection {
  edges: Notification[];
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
