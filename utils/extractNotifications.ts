// utils/extractNotifications.ts
import { Notification } from '../types/notification';

interface GraphQLNotificationEdge {
  node: Notification;
  cursor?: string;
}

interface GraphQLNotificationsResponse {
  notifications: {
    edges: GraphQLNotificationEdge[];
    unreadCount?: number;
    totalCount?: number;
    pageInfo?: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor?: string;
      endCursor?: string;
    };
  };
}

export const extractNotifications = (data: GraphQLNotificationsResponse | null | undefined): Notification[] => {
  try {
    if (!data?.notifications?.edges) return [];
    return data.notifications.edges.map((edge: GraphQLNotificationEdge) => edge.node);
  } catch (error) {
    console.error('Error extracting notifications:', error);
    return [];
  }
};

export const getUnreadCount = (data: GraphQLNotificationsResponse | null | undefined): number => {
  try {
    return data?.notifications?.unreadCount || 0;
  } catch (error) {
    return 0;
  }
};

export const getTotalCount = (data: GraphQLNotificationsResponse | null | undefined): number => {
  try {
    return data?.notifications?.totalCount || 0;
  } catch (error) {
    return 0;
  }
};
