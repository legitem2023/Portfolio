// components/NotificationList.tsx
import React, { useMemo } from 'react';
import { 
  Bell, 
  MessageCircle, 
  ShoppingBag, 
  AlertCircle,
  CheckCircle,
  Info,
  Clock
} from 'lucide-react';
import { NotificationType } from '../types/notification';

interface NotificationUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
  user?: NotificationUser;
}

interface NotificationListProps {
  notifications: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  loading?: boolean;
  error?: Error | null;
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onNotificationClick,
  onMarkAsRead,
  onDelete,
  loading = false,
  error = null
}) => {
  
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.NEW_MESSAGE:
        return <MessageCircle className="w-5 h-5" />;
      case NotificationType.ORDER_CREATED:
      case NotificationType.ORDER_UPDATED:
      case NotificationType.ORDER_DELIVERED:
        return <ShoppingBag className="w-5 h-5" />;
      case NotificationType.PROMOTIONAL:
        return <AlertCircle className="w-5 h-5" />;
      case NotificationType.ACCOUNT_VERIFIED:
      case NotificationType.PASSWORD_CHANGED:
      case NotificationType.SYSTEM_ALERT:
        return <Info className="w-5 h-5" />;
      case NotificationType.PAYMENT_RECEIVED:
        return <CheckCircle className="w-5 h-5" />;
      case NotificationType.PAYMENT_FAILED:
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.NEW_MESSAGE:
        return 'bg-blue-100 text-blue-600';
      case NotificationType.ORDER_CREATED:
      case NotificationType.ORDER_UPDATED:
      case NotificationType.ORDER_DELIVERED:
        return 'bg-green-100 text-green-600';
      case NotificationType.PROMOTIONAL:
        return 'bg-purple-100 text-purple-600';
      case NotificationType.ACCOUNT_VERIFIED:
      case NotificationType.PASSWORD_CHANGED:
        return 'bg-yellow-100 text-yellow-600';
      case NotificationType.SYSTEM_ALERT:
        return 'bg-red-100 text-red-600';
      case NotificationType.PAYMENT_RECEIVED:
        return 'bg-emerald-100 text-emerald-600';
      case NotificationType.PAYMENT_FAILED:
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      return 'Recently';
    }
  };

  const getNotificationTypeLabel = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.NEW_MESSAGE:
        return 'New Message';
      case NotificationType.ORDER_CREATED:
        return 'Order Created';
      case NotificationType.ORDER_UPDATED:
        return 'Order Updated';
      case NotificationType.ORDER_DELIVERED:
        return 'Order Delivered';
      case NotificationType.PROMOTIONAL:
        return 'Promotional';
      case NotificationType.ACCOUNT_VERIFIED:
        return 'Account Verified';
      case NotificationType.PASSWORD_CHANGED:
        return 'Password Changed';
      case NotificationType.SYSTEM_ALERT:
        return 'System Alert';
      case NotificationType.PAYMENT_RECEIVED:
        return 'Payment Received';
      case NotificationType.PAYMENT_FAILED:
        return 'Payment Failed';
      default:
        return 'Notification';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
        <p className="text-gray-600">Loading notifications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-gray-600">Failed to load notifications</p>
        <p className="text-sm text-gray-400 mt-1">{error.message}</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Bell className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500 font-medium">No notifications</p>
        <p className="text-gray-400 text-sm mt-1">You're all caught up!</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {/* Header with stats */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              All Notifications
            </h3>
            <span className="px-2 py-1 text-xs font-bold text-white bg-purple-600 rounded-full">
              {notifications.length}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {notifications.filter(n => !n.isRead).length} unread
          </div>
        </div>
      </div>

      {/* Notification list */}
      <div className="divide-y divide-gray-100">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            className={`
              p-4 hover:bg-gray-50 transition-all duration-200 cursor-pointer
              ${!notification.isRead ? 'bg-blue-50 bg-opacity-30' : ''}
            `}
            onClick={() => onNotificationClick?.(notification)}
          >
            <div className="flex items-start space-x-3">
              {/* Icon */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                getNotificationColor(notification.type)
              }`}>
                {getNotificationIcon(notification.type)}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <p className={`text-sm font-medium ${
                      !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {notification.title}
                    </p>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                      {getNotificationTypeLabel(notification.type)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 flex items-center whitespace-nowrap">
                      <Clock className="w-3 h-3 mr-1" />
                      {getTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                </div>
                
                <p className="mt-1 text-sm text-gray-600">
                  {notification.message}
                </p>
                
                {/* User info if available */}
                {notification.user && (
                  <div className="mt-2 flex items-center space-x-2">
                    {notification.user.avatar ? (
                      <img 
                        src={notification.user.avatar} 
                        alt={`${notification.user.firstName} ${notification.user.lastName}`}
                        className="w-5 h-5 rounded-full"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-xs text-gray-600">
                          {notification.user.firstName?.[0]}{notification.user.lastName?.[0]}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-gray-500">
                      {notification.user.firstName} {notification.user.lastName}
                    </span>
                  </div>
                )}
                
                {/* Action buttons */}
                <div className="mt-3 flex space-x-3">
                  {!notification.isRead && onMarkAsRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead(notification.id);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors duration-200"
                    >
                      Mark as read
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(notification.id);
                      }}
                      className="text-xs text-red-600 hover:text-red-800 transition-colors duration-200"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationList;
