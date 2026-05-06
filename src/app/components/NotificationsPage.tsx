// Example usage in a page or parent component
import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_NOTIFICATIONS } from './graphql/query';
import NotificationList from './NotificationList';
import { extractNotifications } from '../../../utils/extractNotifications';

interface NotificationsPageProps {
  userId: string;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ userId }) => {
  const { data, loading, error, refetch } = useQuery(GET_NOTIFICATIONS, {
    variables: { 
      userId: userId,
      limit: 50 // Get more notifications
    },
    fetchPolicy: 'cache-and-network',
  });

  const notifications = extractNotifications(data);
  const unreadCount = data?.notifications?.unreadCount || 0;

  const handleMarkAsRead = async (id: string) => {
    // Implement mark as read logic
    console.log('Mark as read:', id);
  };

  const handleDelete = async (id: string) => {
    // Implement delete logic
    console.log('Delete:', id);
  };

  const handleNotificationClick = (notification: any) => {
    console.log('Notification clicked:', notification);
    // Navigate based on notification.link or type
  };

  return (
    <div className="container mx-auto max-w-2xl py-6">
      <NotificationList
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDelete}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default NotificationsPage;
