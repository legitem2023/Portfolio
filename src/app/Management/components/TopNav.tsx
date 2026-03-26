'use client';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useDispatch } from "react-redux";
import { setActiveIndex } from '../../../../Redux/activeIndexSlice';
import { signOut } from 'next-auth/react';
import { LogOut, CreditCard, ChevronDown, Bell, X, Clock, AlertCircle, CheckCircle, Info, ShoppingBag, MessageCircle } from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_NOTIFICATIONS } from '../../components/graphql/query';
import { 
  MARK_AS_READ,
  MARK_ALL_AS_READ,
  DELETE_NOTIFICATION
} from '../../components/graphql/mutation';
import { NotificationType } from '../../../../types/notification';
import { showNotification } from '../../../../utils/notifications';

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

interface User {
  userId: string;
  role: string;
  name?: string;
  email?: string;
  phone: string; 
  image?: string;
}
interface TopNavProps {
  onMenuClick?: () => void;
  user?:User;
}

export default function TopNav({ onMenuClick, user }: TopNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const [userId, setUserId] = useState(user.userId);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isBellPopupOpen, setIsBellPopupOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [shownNotificationIds, setShownNotificationIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  };

  const triggerPushNotification = useCallback((notification: Notification) => {
    if (notification.isRead || shownNotificationIds.has(notification.id)) {
      return;
    }

    const getNotificationIconUrl = (type: NotificationType): string => {
      switch (type) {
        case NotificationType.NEW_MESSAGE:
          return 'https://cdn-icons-png.flaticon.com/512/733/733585.png';
        case NotificationType.ORDER_CREATED:
        case NotificationType.ORDER_UPDATED:
        case NotificationType.ORDER_DELIVERED:
          return 'https://cdn-icons-png.flaticon.com/512/3144/3144456.png';
        case NotificationType.PROMOTIONAL:
          return 'https://cdn-icons-png.flaticon.com/512/869/869869.png';
        case NotificationType.ACCOUNT_VERIFIED:
        case NotificationType.PASSWORD_CHANGED:
          return 'https://cdn-icons-png.flaticon.com/512/190/190411.png';
        case NotificationType.SYSTEM_ALERT:
          return 'https://cdn-icons-png.flaticon.com/512/1828/1828640.png';
        case NotificationType.PAYMENT_RECEIVED:
          return 'https://cdn-icons-png.flaticon.com/512/190/190411.png';
        case NotificationType.PAYMENT_FAILED:
          return 'https://cdn-icons-png.flaticon.com/512/1828/1828843.png';
        default:
          return 'https://cdn-icons-png.flaticon.com/512/1827/1827304.png';
      }
    };

    showNotification(
      notification.title,
      notification.message,
      getNotificationIconUrl(notification.type),
      {
        tag: `notification-${notification.id}`,
        requireInteraction: false,
        data: { 
          notificationId: notification.id,
          link: notification.link,
          type: notification.type 
        }
      }
    ).then(result => {
      console.log(`Push notification shown: ${notification.title}`);
      
      setShownNotificationIds(prev => {
        const newSet = new Set(prev);
        newSet.add(notification.id);
        return newSet;
      });
      
      if (result.type === 'click' && notification.link) {
        router.push(notification.link);
      }
    }).catch(error => {
      console.error('Failed to show push notification:', error);
    });
  }, [shownNotificationIds, router]);

  const extractNotifications = useCallback((data: any): Notification[] => {
    try {
      if (!data?.notifications?.edges) return [];
      return data.notifications.edges.map((edge: any) => edge.node);
    } catch (error) {
      console.error('Error extracting notifications:', error);
      return [];
    }
  }, []);

  const handleNewNotifications = useCallback((data: any) => {
    const latestNotifications = extractNotifications(data);
    
    const newNotifications = latestNotifications.filter(
      (notification: Notification) => 
        !notification.isRead && !shownNotificationIds.has(notification.id)
    );
    
    newNotifications.forEach(notification => {
      triggerPushNotification(notification);
    });
  }, [extractNotifications, shownNotificationIds, triggerPushNotification]);

  const { 
    data: notificationsData, 
    loading: notificationsLoading, 
    error: notificationsError,
    refetch: refetchNotifications
  } = useQuery(GET_NOTIFICATIONS, {
    variables: { 
      userId: userId || '',
      filters: { limit: 10 }
    },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
    pollInterval: userId ? 10000 : 0,
    onError: (error) => {
      console.error('Notification query error:', error);
    },
    onCompleted: (data) => {
      if (data && userId) {
        handleNewNotifications(data);
      }
    },
  });

  const notifications = useMemo(() => 
    notificationsData ? extractNotifications(notificationsData) : [], 
    [notificationsData, extractNotifications]
  );

  const unreadCount = useMemo(() => 
    notificationsData?.notifications?.unreadCount || 0, 
    [notificationsData]
  );

  const [markAsReadMutation] = useMutation(MARK_AS_READ, {
    onError: (error) => console.error('Mark as read error:', error)
  });
  const [markAllAsReadMutation] = useMutation(MARK_ALL_AS_READ, {
    onError: (error) => console.error('Mark all as read error:', error)
  });
  const [deleteNotificationMutation] = useMutation(DELETE_NOTIFICATION, {
    onError: (error) => console.error('Delete notification error:', error)
  });

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsBellPopupOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Handle touch swipe for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !isBellPopupOpen) return;

    const touchEnd = e.touches[0];
    const deltaX = touchEnd.clientX - touchStart.x;
    const deltaY = touchEnd.clientY - touchStart.y;

    // Swipe down to close
    if (deltaY > 50 && Math.abs(deltaX) < 50) {
      setIsBellPopupOpen(false);
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
        setIsBellPopupOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    if (isBellPopupOpen && userId) {
      refetchNotifications();
    }
  }, [isBellPopupOpen, userId, refetchNotifications]);

  useEffect(() => {
    if (userId) {
      setShownNotificationIds(new Set());
    }
  }, [userId]);

  // Prevent body scroll when mobile popup is open
  useEffect(() => {
    if (isBellPopupOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isBellPopupOpen]);

  const handlePayments = () => {
    setIsDropdownOpen(false);
    router.push('/payments');
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (!confirmLogout) {
      setIsDropdownOpen(false);
      return;
    }
    
    setIsLoggingOut(true);
    
    try {
      await signOut({
        redirect: true,
        callbackUrl: '/Login',
      });
      
      dispatch(setActiveIndex(0));
      router.push('/Login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setIsDropdownOpen(false);
    }
  };

  const toggleDropdown = () => {
    if (!isLoggingOut) {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  const toggleBellPopup = () => {
    if (!userId) {
      router.push('/Login');
      return;
    }
    setIsBellPopupOpen(!isBellPopupOpen);
    setIsDropdownOpen(false);
  };

  const markAsRead = async (id: string) => {
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
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllAsReadMutation({
        variables: { userId },
        optimisticResponse: {
          markAllNotificationsAsRead: true
        },
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteNotificationMutation({
        variables: { id },
        optimisticResponse: {
          deleteNotification: true
        },
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = useCallback((type: NotificationType) => {
    switch (type) {
      case NotificationType.NEW_MESSAGE:
        return <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
      case NotificationType.ORDER_CREATED:
      case NotificationType.ORDER_UPDATED:
      case NotificationType.ORDER_DELIVERED:
        return <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />;
      case NotificationType.PROMOTIONAL:
        return <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
      case NotificationType.ACCOUNT_VERIFIED:
      case NotificationType.PASSWORD_CHANGED:
      case NotificationType.SYSTEM_ALERT:
        return <Info className="w-4 h-4 sm:w-5 sm:h-5" />;
      case NotificationType.PAYMENT_RECEIVED:
        return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
      case NotificationType.PAYMENT_FAILED:
        return <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
      default:
        return <Bell className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
  }, []);

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

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    if (notification.link) {
      router.push(notification.link);
    } else {
      switch (notification.type) {
        case NotificationType.NEW_MESSAGE:
          router.push('/Messaging');
          break;
        case NotificationType.ORDER_CREATED:
        case NotificationType.ORDER_UPDATED:
        case NotificationType.ORDER_DELIVERED:
          router.push('/orders');
          break;
        case NotificationType.PAYMENT_RECEIVED:
        case NotificationType.PAYMENT_FAILED:
          router.push('/payments');
          break;
        default:
          break;
      }
    }
    
    setIsBellPopupOpen(false);
  };

  return (
    <nav className="bg-gray-800 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between h-14 sm:h-16">
          {/* Left section */}
          <div className="flex">
            <div className="md:hidden flex items-center">
              <button
                onClick={onMenuClick}
                className="inline-flex items-center justify-center p-1.5 sm:p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors"
                aria-label="Open main menu"
              >
                <svg 
                  className="h-5 w-5 sm:h-6 sm:w-6" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 6h16M4 12h16M4 18h16" 
                  />
                </svg>
              </button>
            </div>

            <div className="flex-shrink-0 flex items-center">
              <span className="text-white font-bold text-base sm:text-xl">VendorCity</span>
              <span className="ml-1 sm:ml-2 text-gray-300 text-xs sm:text-sm hidden sm:inline">Rider</span>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Notification Bell */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={toggleBellPopup}
                className="p-1.5 sm:p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors relative"
                disabled={!userId && notificationsLoading}
                title={!userId ? "Sign in to view notifications" : ""}
              >
                <span className="sr-only">View notifications</span>
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {notificationsLoading && userId ? (
                  <span className="absolute top-0 right-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-white"></div>
                  </span>
                ) : unreadCount > 0 && userId && !notificationsLoading ? (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[1.25rem] h-5 text-[10px] sm:text-xs font-bold text-white bg-red-500 rounded-full px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                ) : null}
              </button>

              {/* Mobile Overlay */}
              {isBellPopupOpen && userId && (
                <>
                  {/* Backdrop for mobile */}
                  <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300"
                    onClick={() => setIsBellPopupOpen(false)}
                  />
                  
                  {/* Bell Popup - Mobile & Desktop Responsive */}
                  <div 
                    className={`
                      fixed md:absolute
                      ${isBellPopupOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
                      transition-all duration-300 ease-out
                      bottom-0 md:bottom-auto
                      left-0 md:left-auto
                      right-0
                      md:right-0 md:mt-2
                      w-full md:w-96
                      max-h-[85vh] md:max-h-[500px]
                      bg-white rounded-t-2xl md:rounded-lg
                      shadow-xl border-t md:border border-gray-200
                      z-50
                      flex flex-col
                    `}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    {/* Drag handle for mobile */}
                    <div className="md:hidden w-full flex justify-center py-2">
                      <div className="w-12 h-1 bg-gray-300 rounded-full" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-2xl md:rounded-t-lg flex-shrink-0">
                      <div className="flex items-center space-x-2">
                        <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800">Notifications</h3>
                        {unreadCount > 0 && !notificationsLoading && (
                          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold text-white bg-red-500 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {notificationsLoading ? (
                          <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-gray-600"></div>
                        ) : (
                          <>
                            {unreadCount > 0 && (
                              <button
                                onClick={markAllAsRead}
                                className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                              >
                                Mark all read
                              </button>
                            )}
                            <button
                              onClick={() => setIsBellPopupOpen(false)}
                              className="p-1 hover:bg-gray-200 rounded-full transition-colors duration-200"
                            >
                              <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Notifications List */}
                    <div className="flex-1 overflow-y-auto overscroll-contain">
                      {notificationsLoading ? (
                        <div className="flex flex-col items-center justify-center p-8">
                          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-indigo-600 mb-4"></div>
                          <p className="text-sm sm:text-base text-gray-600">Loading notifications...</p>
                        </div>
                      ) : notificationsError ? (
                        <div className="flex flex-col items-center justify-center p-8">
                          <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-400 mb-4" />
                          <p className="text-sm sm:text-base text-gray-600">Failed to load notifications</p>
                          <button
                            onClick={() => refetchNotifications()}
                            className="mt-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
                          >
                            Retry
                          </button>
                        </div>
                      ) : notifications.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`
                                p-3 sm:p-4 hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 cursor-pointer
                                ${!notification.isRead ? 'bg-blue-50 bg-opacity-50' : ''}
                              `}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <div className="flex items-start space-x-2 sm:space-x-3">
                                <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                                  getNotificationColor(notification.type)
                                }`}>
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                                    <p className={`text-xs sm:text-sm font-medium ${
                                      !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                                    }`}>
                                      {notification.title}
                                    </p>
                                    <div className="flex items-center justify-between sm:justify-end space-x-2">
                                      <span className="text-[10px] sm:text-xs text-gray-500 flex items-center whitespace-nowrap">
                                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                                        {getTimeAgo(notification.createdAt)}
                                      </span>
                                      {!notification.isRead && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            markAsRead(notification.id);
                                          }}
                                          className="text-[10px] sm:text-xs text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
                                        >
                                          Mark read
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <p className="mt-1 text-xs sm:text-sm text-gray-600 break-words">
                                    {notification.message}
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {notification.type === NotificationType.NEW_MESSAGE && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setIsBellPopupOpen(false);
                                          router.push('/Messaging');
                                        }}
                                        className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-200"
                                      >
                                        View Message
                                      </button>
                                    )}
                                    {(notification.type === NotificationType.ORDER_CREATED || 
                                      notification.type === NotificationType.ORDER_UPDATED || 
                                      notification.type === NotificationType.ORDER_DELIVERED) && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setIsBellPopupOpen(false);
                                          router.push('/orders');
                                        }}
                                        className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all duration-200"
                                      >
                                        View Order
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notification.id);
                                      }}
                                      className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs text-gray-500 hover:text-red-600 transition-colors duration-200"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                          <Bell className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mb-4" />
                          <p className="text-sm sm:text-base text-gray-500 font-medium">No notifications</p>
                          <p className="text-xs sm:text-sm text-gray-400 mt-1">Youre all caught up!</p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl md:rounded-b-lg flex-shrink-0">
                      <button
                        onClick={() => {
                          setIsBellPopupOpen(false);
                          router.push('/Notifications');
                        }}
                        className="w-full py-1.5 sm:py-2 text-center text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200"
                      >
                        View all notifications
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Menu Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                disabled={isLoggingOut}
                className="flex items-center gap-1 sm:gap-2 max-w-xs bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:opacity-50 transition-all hover:bg-gray-600 pl-0.5 sm:pl-1 pr-1 sm:pr-2 py-0.5 sm:py-1"
                id="user-menu-button"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <span className="sr-only">Open user menu</span>
                <img 
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full" 
                  src={user.avatar} 
                  alt={user.name}
                />
                <div className="hidden sm:block text-left">
                  <p className="text-xs sm:text-sm font-medium text-white">{user.name}</p>
                  <p className="text-[10px] sm:text-xs text-gray-300">Rider ID: VC-001</p>
                </div>
                <ChevronDown className={`h-3 w-3 sm:h-4 sm:w-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 sm:w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">Rider ID: VC-001</p>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1 truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={handlePayments}
                    className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 sm:gap-3 transition-colors"
                  >
                    <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                    <span className="font-medium">Billing & Payments</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 sm:gap-3 transition-colors border-t border-gray-100 disabled:opacity-50"
                  >
                    <LogOut className={`h-3 w-3 sm:h-4 sm:w-4 ${isLoggingOut ? 'animate-spin' : ''}`} />
                    <span className="font-medium">{isLoggingOut ? 'Logging out...' : 'Sign Out'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
    }
