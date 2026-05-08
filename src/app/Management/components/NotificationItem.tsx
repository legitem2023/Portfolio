'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bell, 
  X, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  ShoppingBag, 
  MessageCircle, 
  Trash2, 
  Loader2, 
  RefreshCw, 
  XCircle, 
  Gift, 
  Headphones, 
  Heart,
  Mail,
  Package,
  Truck,
  DollarSign,
  UserCheck,
  Settings,
  Star
} from 'lucide-react';

// ==================== Types ====================

export enum NotificationType {
  // Messages
  NEW_MESSAGE = 'NEW_MESSAGE',
  
  // Orders
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_UPDATED = 'ORDER_UPDATED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  SHIPMENT = 'SHIPMENT',
  
  // Returns
  RETURN_REQUEST_CREATED = 'RETURN_REQUEST_CREATED',
  RETURN_STATUS_UPDATED = 'RETURN_STATUS_UPDATED',
  RETURN_SHIPPED = 'RETURN_SHIPPED',
  RETURN_RECEIVED = 'RETURN_RECEIVED',
  RETURN_APPROVED = 'RETURN_APPROVED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',
  RETURN_COMPLETED = 'RETURN_COMPLETED',
  RETURN_REJECTED = 'RETURN_REJECTED',
  
  // Payments
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_CONFIRMATION = 'PAYMENT_CONFIRMATION',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  
  // Other
  PROMOTIONAL = 'PROMOTIONAL',
  SOCIAL = 'SOCIAL',
  SUPPORT = 'SUPPORT',
  ACCOUNT_VERIFIED = 'ACCOUNT_VERIFIED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  SYSTEM_ALERT = 'SYSTEM_ALERT'
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

interface NotificationCenterProps {
  userId?: string;
  onNotificationClick?: (notification: Notification) => void;
  onMarkAsRead?: (id: string) => Promise<void>;
  onMarkAllAsRead?: (userId: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onViewAll?: () => void;
  fetchNotifications?: (userId: string, limit?: number) => Promise<Notification[]>;
  fetchUnreadCount?: (userId: string) => Promise<number>;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxHeight?: string;
  width?: string;
  showFooter?: boolean;
  itemsPerPage?: number;
  enableRealtime?: boolean;
  pollingInterval?: number;
}

// ==================== Helper Functions ====================

const getTimeAgo = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  } catch (error) {
    return 'Recently';
  }
};

const getNotificationIcon = (type: NotificationType, className = "w-4 h-4 sm:w-5 sm:h-5") => {
  const icons = {
    [NotificationType.NEW_MESSAGE]: <MessageCircle className={className} />,
    [NotificationType.ORDER_CREATED]: <Package className={className} />,
    [NotificationType.ORDER_UPDATED]: <Package className={className} />,
    [NotificationType.ORDER_DELIVERED]: <Truck className={className} />,
    [NotificationType.SHIPMENT]: <Truck className={className} />,
    [NotificationType.RETURN_REQUEST_CREATED]: <RefreshCw className={className} />,
    [NotificationType.RETURN_STATUS_UPDATED]: <RefreshCw className={className} />,
    [NotificationType.RETURN_SHIPPED]: <Truck className={className} />,
    [NotificationType.RETURN_RECEIVED]: <CheckCircle className={className} />,
    [NotificationType.RETURN_APPROVED]: <CheckCircle className={className} />,
    [NotificationType.REFUND_PROCESSED]: <DollarSign className={className} />,
    [NotificationType.RETURN_COMPLETED]: <CheckCircle className={className} />,
    [NotificationType.RETURN_REJECTED]: <XCircle className={className} />,
    [NotificationType.PAYMENT_RECEIVED]: <DollarSign className={className} />,
    [NotificationType.PAYMENT_CONFIRMATION]: <CheckCircle className={className} />,
    [NotificationType.PAYMENT_FAILED]: <AlertCircle className={className} />,
    [NotificationType.PROMOTIONAL]: <Gift className={className} />,
    [NotificationType.SOCIAL]: <Heart className={className} />,
    [NotificationType.SUPPORT]: <Headphones className={className} />,
    [NotificationType.ACCOUNT_VERIFIED]: <UserCheck className={className} />,
    [NotificationType.PASSWORD_CHANGED]: <Settings className={className} />,
    [NotificationType.SYSTEM_ALERT]: <AlertCircle className={className} />
  };
  return icons[type] || <Bell className={className} />;
};

const getNotificationColor = (type: NotificationType): string => {
  const colors = {
    [NotificationType.NEW_MESSAGE]: 'bg-blue-100 text-blue-600',
    [NotificationType.ORDER_CREATED]: 'bg-green-100 text-green-600',
    [NotificationType.ORDER_UPDATED]: 'bg-green-100 text-green-600',
    [NotificationType.ORDER_DELIVERED]: 'bg-emerald-100 text-emerald-600',
    [NotificationType.SHIPMENT]: 'bg-blue-100 text-blue-600',
    [NotificationType.RETURN_REQUEST_CREATED]: 'bg-yellow-100 text-yellow-600',
    [NotificationType.RETURN_STATUS_UPDATED]: 'bg-yellow-100 text-yellow-600',
    [NotificationType.RETURN_SHIPPED]: 'bg-yellow-100 text-yellow-600',
    [NotificationType.RETURN_RECEIVED]: 'bg-yellow-100 text-yellow-600',
    [NotificationType.RETURN_APPROVED]: 'bg-emerald-100 text-emerald-600',
    [NotificationType.REFUND_PROCESSED]: 'bg-emerald-100 text-emerald-600',
    [NotificationType.RETURN_COMPLETED]: 'bg-emerald-100 text-emerald-600',
    [NotificationType.RETURN_REJECTED]: 'bg-red-100 text-red-600',
    [NotificationType.PAYMENT_RECEIVED]: 'bg-emerald-100 text-emerald-600',
    [NotificationType.PAYMENT_CONFIRMATION]: 'bg-emerald-100 text-emerald-600',
    [NotificationType.PAYMENT_FAILED]: 'bg-orange-100 text-orange-600',
    [NotificationType.PROMOTIONAL]: 'bg-purple-100 text-purple-600',
    [NotificationType.SOCIAL]: 'bg-pink-100 text-pink-600',
    [NotificationType.SUPPORT]: 'bg-cyan-100 text-cyan-600',
    [NotificationType.ACCOUNT_VERIFIED]: 'bg-teal-100 text-teal-600',
    [NotificationType.PASSWORD_CHANGED]: 'bg-teal-100 text-teal-600',
    [NotificationType.SYSTEM_ALERT]: 'bg-orange-100 text-orange-600'
  };
  return colors[type] || 'bg-gray-100 text-gray-600';
};

// ==================== Sub-components ====================

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClick: (notification: Notification) => void;
  isDeleting?: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onRead, 
  onDelete, 
  onClick,
  isDeleting 
}) => {
  const [showActions, setShowActions] = useState(false);
  
  return (
    <div
      className={`
        px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 cursor-pointer
        ${!notification.isRead ? 'bg-blue-50/30 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}
        ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
        group
      `}
      onClick={() => onClick(notification)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
          {getNotificationIcon(notification.type, "w-5 h-5")}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
              {notification.title}
            </p>
            <span className="text-xs text-gray-500 flex items-center whitespace-nowrap">
              <Clock className="w-3 h-3 mr-1" />
              {getTimeAgo(notification.createdAt)}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 break-words mb-2">
            {notification.message}
          </p>
          
          {/* Actions */}
          <div className={`flex items-center gap-3 transition-opacity duration-200 ${showActions ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
            {!notification.isRead && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRead(notification.id);
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Mark as read
              </button>
            )}
            <button
              onClick={async (e) => {
                e.stopPropagation();
                await onDelete(notification.id);
              }}
              className="text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== Main Component ====================

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  userId,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onViewAll,
  fetchNotifications,
  fetchUnreadCount,
  position = 'top-right',
  maxHeight = '500px',
  width = '400px',
  showFooter = true,
  itemsPerPage = 10,
  enableRealtime = true,
  pollingInterval = 10000
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  // Position classes
  const positionClasses = {
    'top-right': 'top-full right-0 mt-2',
    'top-left': 'top-full left-0 mt-2',
    'bottom-right': 'bottom-full right-0 mb-2',
    'bottom-left': 'bottom-full left-0 mb-2'
  };

  // Load notifications
  const loadNotifications = useCallback(async (reset = true) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const currentPage = reset ? 1 : page;
      const limit = itemsPerPage;
      
      if (fetchNotifications) {
        const data = await fetchNotifications(userId, limit);
        setNotifications(reset ? data : [...notifications, ...data]);
        setHasMore(data.length === limit);
        if (reset) setPage(1);
      }
      
      if (fetchUnreadCount && reset) {
        const count = await fetchUnreadCount(userId);
        setUnreadCount(count);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, fetchNotifications, fetchUnreadCount, itemsPerPage, page, notifications]);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    if (!userId || !fetchUnreadCount) return;
    try {
      const count = await fetchUnreadCount(userId);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  }, [userId, fetchUnreadCount]);

  // Handle mark as read
  const handleMarkAsRead = async (id: string) => {
    if (!onMarkAsRead) return;
    
    try {
      await onMarkAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    if (!onMarkAllAsRead || !userId) return;
    
    try {
      await onMarkAllAsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    
    setDeletingId(id);
    try {
      await onDelete(id);
      const deletedNotification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    
    if (onNotificationClick) {
      onNotificationClick(notification);
    } else if (notification.link) {
      window.location.href = notification.link;
    }
    
    setIsOpen(false);
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load on open
  useEffect(() => {
    if (isOpen && userId) {
      loadNotifications(true);
    }
  }, [isOpen, userId, loadNotifications]);

  // Realtime polling
  useEffect(() => {
    if (!enableRealtime || !userId || !isOpen) return;
    
    const interval = setInterval(() => {
      loadUnreadCount();
      if (isOpen) {
        loadNotifications(true);
      }
    }, pollingInterval);
    
    return () => clearInterval(interval);
  }, [enableRealtime, userId, isOpen, pollingInterval, loadUnreadCount, loadNotifications]);

  // Load more on scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
    
    if (bottom && !loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  // Load more when page changes
  useEffect(() => {
    if (page > 1) {
      loadNotifications(false);
    }
  }, [page]);

  if (!userId) {
    return (
      <div className="relative">
        <button
          className="relative p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 cursor-not-allowed opacity-50"
          disabled
          title="Sign in to view notifications"
        >
          <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Button */}
      <button
        ref={bellRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
        aria-label="View notifications"
      >
        <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[1.25rem] h-5 text-xs font-bold text-white bg-red-500 rounded-full px-1 shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div 
          className={`absolute ${positionClasses[position]} z-50`}
          style={{ width }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
            style={{ maxHeight }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-blue-100 rounded-lg">
                  <Bell className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && !loading && (
                  <span className="px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                ) : (
                  <>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div 
              className="overflow-y-auto"
              style={{ maxHeight: `calc(${maxHeight} - 130px)` }}
              onScroll={handleScroll}
            >
              {loading && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-3" />
                  <p className="text-sm text-gray-500">Loading notifications...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                  <p className="text-sm text-gray-600 text-center">{error}</p>
                  <button
                    onClick={() => loadNotifications(true)}
                    className="mt-3 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Retry
                  </button>
                </div>
              ) : notifications.length > 0 ? (
                <>
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onRead={handleMarkAsRead}
                        onDelete={handleDelete}
                        onClick={handleNotificationClick}
                        isDeleting={deletingId === notification.id}
                      />
                    ))}
                  </div>
                  {loading && notifications.length > 0 && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 font-medium">No notifications</p>
                  <p className="text-xs text-gray-400 mt-1">You&apos;re all caught up!</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {showFooter && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 sticky bottom-0">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    if (onViewAll) onViewAll();
                  }}
                  className="w-full py-2 text-center text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== Usage Example ====================

/*
// Example usage with GraphQL:

import { useQuery, useMutation } from '@apollo/client';
import { GET_NOTIFICATIONS, GET_UNREAD_COUNT } from './graphql/queries';
import { MARK_AS_READ, MARK_ALL_AS_READ, DELETE_NOTIFICATION } from './graphql/mutations';

function App() {
  const { refetch } = useQuery(GET_NOTIFICATIONS);
  
  const fetchNotifications = async (userId: string, limit: number) => {
    const { data } = await refetch({ userId, filters: { limit } });
    return data?.notifications?.edges?.map((edge: any) => edge.node) || [];
  };
  
  const fetchUnreadCount = async (userId: string) => {
    const { data } = await refetch({ userId });
    return data?.notifications?.unreadCount || 0;
  };
  
  const [markAsRead] = useMutation(MARK_AS_READ);
  const [markAllAsRead] = useMutation(MARK_ALL_AS_READ);
  const [deleteNotification] = useMutation(DELETE_NOTIFICATION);
  
  return (
    <NotificationCenter
      userId="user-123"
      fetchNotifications={fetchNotifications}
      fetchUnreadCount={fetchUnreadCount}
      onMarkAsRead={(id) => markAsRead({ variables: { id } })}
      onMarkAllAsRead={(userId) => markAllAsRead({ variables: { userId } })}
      onDelete={(id) => deleteNotification({ variables: { id } })}
      onViewAll={() => router.push('/notifications')}
      position="top-right"
      width="420px"
      maxHeight="600px"
      enableRealtime={true}
      pollingInterval={15000}
    />
  );
}
*/
