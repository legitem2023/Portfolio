"use client";
import { useState, useRef, useEffect } from "react";
import { Bell, Package, LogOut, CreditCard, ChevronDown, Shield, Award, Clock, X, AlertCircle, CheckCircle, Info, ShoppingBag, MessageCircle, Power } from "lucide-react";
import { useAuth } from '../hooks/useAuth';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useDispatch } from "react-redux";
import { setActiveIndex } from '../../../../Redux/activeIndexSlice';
import { signOut } from 'next-auth/react';
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
}

interface HeaderProps {
  isMobile: boolean;
  isOnline: boolean;
  setIsOnline: (isOnline: boolean) => void;
  activeTab: string;
  newDeliveriesCount: number;
}

export default function TopNav({ 
  isMobile, 
  isOnline, 
  setIsOnline, 
  activeTab, 
  newDeliveriesCount 
}: HeaderProps) {

  const { user } = useAuth();
  const router = useRouter();
  const dispatch = useDispatch();
  const [isBellPopupOpen, setIsBellPopupOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [shownNotificationIds, setShownNotificationIds] = useState<Set<string>>(new Set());
  const bellRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  // Get user ID from auth
  const userId = user?.userId;

  // GraphQL queries and mutations
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
  });

  const [markAsReadMutation] = useMutation(MARK_AS_READ, {
    onError: (error) => console.error('Mark as read error:', error)
  });
  const [markAllAsReadMutation] = useMutation(MARK_ALL_AS_READ, {
    onError: (error) => console.error('Mark all as read error:', error)
  });
  const [deleteNotificationMutation] = useMutation(DELETE_NOTIFICATION, {
    onError: (error) => console.error('Delete notification error:', error)
  });

  // Extract notifications from data
  const extractNotifications = (data: any): Notification[] => {
    try {
      if (!data?.notifications?.edges) return [];
      return data.notifications.edges.map((edge: any) => edge.node);
    } catch (error) {
      console.error('Error extracting notifications:', error);
      return [];
    }
  };

  const notifications = notificationsData ? extractNotifications(notificationsData) : [];
  const unreadCount = notificationsData?.notifications?.unreadCount || 0;

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Check if click is on bell popup or its children
      if (popupRef.current && popupRef.current.contains(event.target as Node)) {
        return; // Don't close if clicking inside popup
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
    const deltaY = touchEnd.clientY - touchStart.y;

    // Swipe down to close
    if (deltaY > 50) {
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
        setIsBellPopupOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Refetch when bell popup opens
  useEffect(() => {
    if (isBellPopupOpen && userId) {
      refetchNotifications();
    }
  }, [isBellPopupOpen, userId, refetchNotifications]);

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
    router.push('/payments');
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (!confirmLogout) {
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
    }
  };

  const toggleBellPopup = () => {
    if (!userId) {
      router.push('/Login');
      return;
    }
    setIsBellPopupOpen(!isBellPopupOpen);
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

  const getNotificationIcon = (type: NotificationType) => {
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
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      return 'Recently';
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    switch (notification.type) {
      case NotificationType.NEW_MESSAGE:
        router.push(`/Messaging?id=${notification.link}`);
        break;
      case NotificationType.ORDER_CREATED:
      case NotificationType.ORDER_UPDATED:
      case NotificationType.ORDER_DELIVERED:
        dispatch(setActiveIndex(4));
        break;
      default:
        break;
    }

    setIsBellPopupOpen(false);
  };

  // Notification Bell Popup Component
  const NotificationBellPopup = () => (
    <div ref={popupRef}>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      markAllAsRead();
                    }}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsBellPopupOpen(false);
                  }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  refetchNotifications();
                }}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNotificationClick(notification);
                  }}
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
              <p className="text-xs sm:text-sm text-gray-400 mt-1">You&apos;re all caught up!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl md:rounded-b-lg flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsBellPopupOpen(false);
              router.push('/Notifications');
            }}
            className="w-full py-1.5 sm:py-2 text-center text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200"
          >
            View all notifications
          </button>
        </div>
      </div>
    </div>
  );

  // Mobile View - Deluxe Style
  if (isMobile) {
    return (
      <div>
        <div className="relative p-0 aspect-[4/1] sm:aspect-[9/1] bg-gradient-to-r from-white via-white to-lime-50/80 shadow-lg sticky top-0 z-50 border-b border-lime-100/50 backdrop-blur-sm">
          {/* Decorative Elements */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-lime-200/20 via-transparent to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lime-400/30 to-transparent"></div>
          
          <div className="z-20 flex items-center justify-between p-2 h-[100%] w-[100%] relative">
            {/* Logo with Premium Effect */}
            <div className="z-20 h-[100%] flex items-center group">
              <div className="relative">
                <div className="absolute inset-0 bg-lime-400/20 rounded-lg blur-md group-hover:blur-lg transition-all duration-300"></div>
                <Image 
                  src="/VendorCity_Rider.webp" 
                  alt="VendorCity Rider" 
                  height={60} 
                  width={60} 
                  className="h-[100%] w-auto rounded-lg relative transform group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>

            {/* User Section with Power Off Button - Mobile */}
            <div className="flex items-center gap-3 relative">
              {/* Notification Bell */}
              <div className="relative" ref={bellRef}>
                <button
                  onClick={toggleBellPopup}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-all duration-200 relative group"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-lime-400 to-lime-600 rounded-full opacity-0 group-hover:opacity-30 blur transition-opacity duration-300"></div>
                  <Bell className="w-5 h-5 text-gray-600 relative z-10 group-hover:text-lime-600 transition-colors" />
                  {!notificationsLoading && unreadCount > 0 && userId && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg ring-2 ring-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Power Off Button - Direct Logout */}
              <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="relative group"
                aria-label="Logout"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 rounded-full blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white shadow-lg ring-2 ring-white/50 group-hover:ring-red-200 transition-all duration-300">
                  <Power className={`w-5 h-5 ${isLoggingOut ? 'animate-spin' : ''}`} />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Notification Popup */}
        {isBellPopupOpen && <NotificationBellPopup />}
      </div>
    );
  }

  // Desktop View - Deluxe Style
  return (
    <>
      <header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-lime-100">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-lime-400 via-lime-500 to-lime-400"></div>
        
        <div className="max-w-7xl mx-auto px-6 py-3 relative">
          <div className="flex items-center justify-between">
            {/* Logo and Title - Premium */}
            <div className="flex items-center gap-4 group">
              <div className="relative">
                <div className="absolute inset-0 bg-lime-400/30 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <Image 
                  src="/VendorCity_Rider.webp" 
                  alt="Logo" 
                  height={100} 
                  width={100} 
                  className="h-[100%] w-[auto] rounded-xl relative transform group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  VendorCity
                  <span className="text-lime-600 ml-2">Rider</span>
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1.5 bg-lime-50 px-2 py-1 rounded-full">
                    <Package className="w-4 h-4 text-lime-600" />
                    <span className="text-sm font-medium text-lime-700">
                      {newDeliveriesCount} delivery piece{newDeliveriesCount !== 1 ? 's' : ''} available
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-full">
                    <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"} shadow-lg`} />
                    <span className="text-xs font-medium text-gray-600">
                      {isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Section with Power Off Button - Desktop */}
            <div className="flex items-center gap-4 relative">
              {/* Notification Bell - Premium */}
              <div className="relative group" ref={bellRef}>
                <button
                  onClick={toggleBellPopup}
                  className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200 relative"
                >
                  <div className="absolute -inset-2 bg-gradient-to-r from-lime-400 to-lime-600 rounded-full opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300"></div>
                  <Bell className="w-5 h-5 text-gray-600 relative z-10 group-hover:text-lime-600 transition-colors" />
                  {!notificationsLoading && unreadCount > 0 && userId && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg ring-2 ring-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* User Name with Status */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {user?.name || 'Rider Name'}
                  </p>
                  <div className="flex items-center gap-1 justify-end">
                    <Shield className="w-3 h-3 text-lime-500" />
                    <p className="text-sm text-gray-500">VC-001</p>
                  </div>
                </div>
                
                {/* Online Status Toggle */}
                <button
                  onClick={() => setIsOnline(!isOnline)}
                  className="relative group"
                  aria-label="Toggle online status"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-lime-400 to-lime-600 rounded-full blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                  <div className="relative w-10 h-10 bg-gradient-to-br from-lime-600 to-lime-700 rounded-full flex items-center justify-center text-white shadow-xl ring-2 ring-white/50 group-hover:ring-lime-200 transition-all duration-300">
                    <div className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"} shadow-lg`} />
                  </div>
                </button>

                {/* Power Off Button - Direct Logout */}
                <button 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="relative group"
                  aria-label="Logout"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 rounded-full blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                  <div className="relative w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white shadow-xl ring-2 ring-white/50 group-hover:ring-red-200 transition-all duration-300">
                    <Power className={`w-5 h-5 ${isLoggingOut ? 'animate-spin' : ''}`} />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Popup */}
      {isBellPopupOpen && <NotificationBellPopup />}
    </>
  );
}
