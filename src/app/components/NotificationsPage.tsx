// components/NotificationsPage.tsx
"use client";
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useQuery, useMutation } from '@apollo/client';
import { 
  Bell, 
  MessageCircle, 
  ShoppingBag, 
  AlertCircle,
  CheckCircle,
  Info,
  Clock,
  ArrowLeft,
  Loader2,
  Trash2,
  CheckCheck,
  X
} from 'lucide-react';
import { GET_NOTIFICATIONS } from './graphql/query';
import { 
  MARK_AS_READ,
  MARK_ALL_AS_READ,
  DELETE_NOTIFICATION
} from './graphql/mutation';
import { NotificationType } from '../../../types/notification';
import { setActiveIndex } from '../../../Redux/activeIndexSlice';
import { showNotification } from '../../../utils/notifications';

interface Notification {
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

interface NotificationsPageProps {
  userId: string | null;
  onClose?: () => void;
  isModal?: boolean;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ 
  userId, 
  onClose, 
  isModal = false 
}) => {
  const router = useRouter();
  const dispatch = useDispatch();
  
  // State for notifications
  const [shownNotificationIds, setShownNotificationIds] = useState<Set<string>>(new Set());
  const [deletingNotificationId, setDeletingNotificationId] = useState<string | null>(null);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  // Queries and Mutations
  const { 
    data, 
    loading, 
    error, 
    refetch,
    fetchMore
  } = useQuery(GET_NOTIFICATIONS, {
    variables: { 
      userId: userId || '',
      limit: 20,
      offset: 0
    },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
    onError: (error) => {
      console.error('Notification query error:', error);
    },
  });

  const [markAsReadMutation] = useMutation(MARK_AS_READ, {
    onError: (error) => console.error('Mark as read error:', error),
    onCompleted: () => {
      showNotification(
        'Success',
        'Notification marked as read',
        'https://cdn-icons-png.flaticon.com/512/190/190411.png'
      );
    }
  });

  const [markAllAsReadMutation] = useMutation(MARK_ALL_AS_READ, {
    onError: (error) => console.error('Mark all as read error:', error),
    onCompleted: () => {
      showNotification(
        'Success',
        'All notifications marked as read',
        'https://cdn-icons-png.flaticon.com/512/190/190411.png'
      );
    }
  });

  const [deleteNotificationMutation] = useMutation(DELETE_NOTIFICATION, {
    onError: (error) => console.error('Delete notification error:', error),
    onCompleted: () => {
      setDeletingNotificationId(null);
      refetch();
    }
  });

  const [deleteMultipleNotificationsMutation] = useMutation(DELETE_NOTIFICATION, {
    onError: (error) => console.error('Delete multiple notifications error:', error)
  });

  // Extract notifications from GraphQL response
  const notifications = useMemo(() => {
    try {
      if (!data?.notifications?.edges) return [];
      return data.notifications.edges.map((edge: any) => edge.node);
    } catch (error) {
      console.error('Error extracting notifications:', error);
      return [];
    }
  }, [data]);

  const unreadCount = useMemo(() => 
    data?.notifications?.unreadCount || 0, 
    [data]
  );

  const totalCount = useMemo(() => 
    data?.notifications?.totalCount || 0, 
    [data]
  );

  const hasNextPage = useMemo(() => 
    data?.notifications?.pageInfo?.hasNextPage || false, 
    [data]
  );

  // Load more notifications
  const loadMore = useCallback(() => {
    if (!hasNextPage || loading) return;
    
    fetchMore({
      variables: {
        offset: notifications.length
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          notifications: {
            ...fetchMoreResult.notifications,
            edges: [
              ...prev.notifications.edges,
              ...fetchMoreResult.notifications.edges
            ]
          }
        };
      }
    });
  }, [hasNextPage, loading, notifications.length, fetchMore]);

  // Mark a single notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      await markAsReadMutation({
        variables: { id },
        optimisticResponse: {
          markNotificationAsRead: {
            id,
            isRead: true,
            __typename: 'Notification'
          }
        },
        update: (cache) => {
          const cachedData: any = cache.readQuery({
            query: GET_NOTIFICATIONS,
            variables: { userId, limit: 20, offset: 0 }
          });
          
          if (cachedData && cachedData.notifications) {
            const updatedEdges = cachedData.notifications.edges.map((edge: any) => 
              edge.node.id === id 
                ? { ...edge, node: { ...edge.node, isRead: true } }
                : edge
            );
            
            cache.writeQuery({
              query: GET_NOTIFICATIONS,
              variables: { userId, limit: 20, offset: 0 },
              data: {
                notifications: {
                  ...cachedData.notifications,
                  edges: updatedEdges,
                  unreadCount: Math.max(0, cachedData.notifications.unreadCount - 1)
                }
              }
            });
          }
        }
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [markAsReadMutation, userId]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    
    try {
      await markAllAsReadMutation({
        variables: { userId },
        optimisticResponse: {
          markAllNotificationsAsRead: true
        },
        update: (cache) => {
          const cachedData: any = cache.readQuery({
            query: GET_NOTIFICATIONS,
            variables: { userId, limit: 20, offset: 0 }
          });
          
          if (cachedData && cachedData.notifications) {
            const updatedEdges = cachedData.notifications.edges.map((edge: any) => ({
              ...edge,
              node: { ...edge.node, isRead: true }
            }));
            
            cache.writeQuery({
              query: GET_NOTIFICATIONS,
              variables: { userId, limit: 20, offset: 0 },
              data: {
                notifications: {
                  ...cachedData.notifications,
                  edges: updatedEdges,
                  unreadCount: 0
                }
              }
            });
          }
        }
      });
      
      // Clear selection if in selection mode
      if (isSelectionMode) {
        setIsSelectionMode(false);
        setSelectedNotifications(new Set());
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [markAllAsReadMutation, userId, isSelectionMode]);

  // Delete a single notification
  const deleteNotification = useCallback(async (id: string) => {
    setDeletingNotificationId(id);
    
    try {
      await deleteNotificationMutation({
        variables: { id },
        update: (cache) => {
          const cachedData: any = cache.readQuery({
            query: GET_NOTIFICATIONS,
            variables: { userId, limit: 20, offset: 0 }
          });
          
          if (cachedData && cachedData.notifications) {
            const updatedEdges = cachedData.notifications.edges.filter(
              (edge: any) => edge.node.id !== id
            );
            
            const deletedNotification = cachedData.notifications.edges.find(
              (edge: any) => edge.node.id === id
            );
            
            cache.writeQuery({
              query: GET_NOTIFICATIONS,
              variables: { userId, limit: 20, offset: 0 },
              data: {
                notifications: {
                  ...cachedData.notifications,
                  edges: updatedEdges,
                  unreadCount: deletedNotification?.node.isRead 
                    ? cachedData.notifications.unreadCount 
                    : Math.max(0, cachedData.notifications.unreadCount - 1),
                  totalCount: (cachedData.notifications.totalCount || 0) - 1
                }
              }
            });
          }
        }
      });
      
      // Remove from selection if selected
      if (selectedNotifications.has(id)) {
        setSelectedNotifications(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      setDeletingNotificationId(null);
    }
  }, [deleteNotificationMutation, userId, selectedNotifications]);

  // Delete multiple notifications
  const deleteMultipleNotifications = useCallback(async () => {
    const notificationIds = Array.from(selectedNotifications);
    if (notificationIds.length === 0) return;
    
    try {
      // Execute deletions in parallel
      await Promise.all(
        notificationIds.map(id => 
          deleteMultipleNotificationsMutation({
            variables: { id }
          })
        )
      );
      
      // Refetch to update the list
      await refetch();
      
      // Clear selection
      setSelectedNotifications(new Set());
      setIsSelectionMode(false);
      
      showNotification(
        'Success',
        `${notificationIds.length} notification(s) deleted`,
        'https://cdn-icons-png.flaticon.com/512/190/190411.png'
      );
    } catch (error) {
      console.error('Error deleting notifications:', error);
      showNotification(
        'Error',
        'Failed to delete notifications',
        'https://cdn-icons-png.flaticon.com/512/1828/1828640.png'
      );
    }
  }, [selectedNotifications, deleteMultipleNotificationsMutation, refetch]);

  // Toggle notification selection
  const toggleSelection = useCallback((id: string) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Select all notifications
  const selectAll = useCallback(() => {
    if (selectedNotifications.size === notifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(notifications.map(n => n.id)));
    }
  }, [notifications, selectedNotifications.size]);

  // Get notification icon
  const getNotificationIcon = useCallback((type: NotificationType) => {
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
  }, []);

  // Get notification color
  const getNotificationColor = useCallback((type: NotificationType) => {
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
  }, []);

  // Get time ago string
  const getTimeAgo = useCallback((dateString: string) => {
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
  }, []);

  // Handle notification click
  const handleNotificationClick = useCallback(async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    switch (notification.type) {
      case NotificationType.NEW_MESSAGE:
        router.push(`/Messaging?id=${notification.link}`);
        break;
      case NotificationType.ORDER_CREATED:
      case NotificationType.ORDER_UPDATED:
      case NotificationType.ORDER_DELIVERED:
        dispatch(setActiveIndex(10));
        router.push(`/?index=10`);
        break;
      default:
        if (notification.link) {
          router.push(notification.link);
        }
        break;
    }
    
    // Close modal if in modal mode
    if (isModal && onClose) {
      onClose();
    }
  }, [markAsRead, router, dispatch, isModal, onClose]);

  // Refresh notifications periodically
  useEffect(() => {
    if (!userId) return;
    
    const interval = setInterval(() => {
      refetch();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [userId, refetch]);

  // Reset selection when exiting selection mode
  useEffect(() => {
    if (!isSelectionMode) {
      setSelectedNotifications(new Set());
    }
  }, [isSelectionMode]);

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Sign in required</h2>
          <p className="text-gray-500 mb-4">Please sign in to view your notifications</p>
          <button
            onClick={() => router.push('/Login')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isModal ? '' : 'min-h-screen bg-gray-50'}`}>
      {/* Header */}
      <div className={`bg-white border-b border-gray-200 ${!isModal ? 'sticky top-0 z-10' : ''}`}>
        <div className="px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              {!isModal && (
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <h1 className="text-xl font-semibold text-gray-800">Notifications</h1>
              {totalCount > 0 && (
                <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-600 rounded-full">
                  {totalCount} total
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {!isSelectionMode ? (
                <>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>Mark all read</span>
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={() => setIsSelectionMode(true)}
                      className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Select
                    </button>
                  )}
                  {isModal && onClose && (
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={selectAll}
                    className="px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    {selectedNotifications.size === notifications.length ? 'Deselect all' : 'Select all'}
                  </button>
                  {selectedNotifications.size > 0 && (
                    <button
                      onClick={deleteMultipleNotifications}
                      className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete ({selectedNotifications.size})</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsSelectionMode(false);
                      setSelectedNotifications(new Set());
                    }}
                    className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-4 py-6">
        {loading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-4" />
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <p className="text-gray-600">Failed to load notifications</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              Try again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg shadow-sm">
            <Bell className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No notifications</h3>
            <p className="text-gray-500 text-center">
              You're all caught up! <br />
              New notifications will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {notifications.map((notification: Notification) => (
                <div
                  key={notification.id}
                  className={`
                    bg-white rounded-lg shadow-sm border transition-all duration-200
                    ${!notification.isRead ? 'border-l-4 border-l-purple-500 bg-purple-50 bg-opacity-30' : 'border-gray-200'}
                    ${isSelectionMode ? 'cursor-pointer' : 'cursor-pointer hover:shadow-md'}
                    ${deletingNotificationId === notification.id ? 'opacity-50' : ''}
                  `}
                  onClick={() => {
                    if (isSelectionMode) {
                      toggleSelection(notification.id);
                    } else {
                      handleNotificationClick(notification);
                    }
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-start space-x-3">
                      {/* Checkbox for selection mode */}
                      {isSelectionMode && (
                        <div className="flex-shrink-0 pt-1">
                          <div className={`
                            w-5 h-5 rounded border-2 flex items-center justify-center
                            ${selectedNotifications.has(notification.id) 
                              ? 'bg-purple-600 border-purple-600' 
                              : 'border-gray-300'}
                          `}>
                            {selectedNotifications.has(notification.id) && (
                              <CheckCheck className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Notification Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        getNotificationColor(notification.type)
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between flex-wrap gap-2">
                          <div className="flex-1">
                            <h3 className={`text-sm font-medium ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h3>
                            <p className="mt-1 text-sm text-gray-600">
                              {notification.message}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <span className="text-xs text-gray-500 flex items-center whitespace-nowrap">
                              <Clock className="w-3 h-3 mr-1" />
                              {getTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                        </div>
                        
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
                        
                        {/* Actions for non-selection mode */}
                        {!isSelectionMode && (
                          <div className="mt-3 flex items-center space-x-3">
                            {!notification.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="text-xs text-purple-600 hover:text-purple-800 transition-colors"
                              >
                                Mark as read
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              disabled={deletingNotificationId === notification.id}
                              className="text-xs text-red-600 hover:text-red-800 transition-colors flex items-center space-x-1"
                            >
                              {deletingNotificationId === notification.id ? (
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
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Load More Button */}
            {hasNextPage && (
              <div className="mt-6 text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    'Load more'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
