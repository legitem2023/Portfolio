// components/Header.tsx (OPTIMIZED VERSION)
"use client";
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveIndex } from '../../../Redux/activeIndexSlice';
import { decryptToken } from '../../../utils/decryptToken';
import { showNotification } from '../../../utils/notifications';
import { useQuery, useMutation } from '@apollo/client';
import { 
  User, 
  MessageCircle, 
  ShoppingBag, 
  X, 
  ChevronRight,
  Bell,
  AlertCircle,
  CheckCircle,
  Info,
  Clock,
  Menu
} from 'lucide-react';

// Import queries and mutations
import { USERS, GET_NOTIFICATIONS } from './graphql/query';
import { 
  MARK_AS_READ,
  MARK_ALL_AS_READ,
  DELETE_NOTIFICATION
} from './graphql/mutation';
import { NotificationType } from '../../../types/notification';

// Import local components
import VisitorCounter from './VisitorCounter';
import VisitorBadge from './VisitorBadge';
import AnimatedCrowd from "./AnimatedCrowd";
import AnimatedCrowdMenu from "./AnimatedCrowdMenu";
import LogoutButton from './LogoutButton';
import Ads from './Ads/Ads';
import { PromoAd } from './Ads/PromoAd';
import { useAdDrawer } from './hooks/useAdDrawer';

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

const Header: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBellPopupOpen, setIsBellPopupOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [shownNotificationIds, setShownNotificationIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  const pathname = usePathname();
  
  const drawer = useAdDrawer({ autoOpenDelay: 3000 });
  
  const dispatch = useDispatch();
  const activeIndex = useSelector((state: any) => state.activeIndex.value);

// Get user data
  const { data: userData, loading: userLoading } = useQuery(USERS);
  
  // Check if current route is auth page
  const isAuthPage = useMemo(() => {
    return ['/Login', '/Signup', '/ForgotPassword'].includes(pathname);
  }, [pathname]);
  
  // Check if user is logged in
  const isUserLoggedIn = useMemo(() => {
    return !!user || !!userData?.users?.[0];
  }, [user, userData]);

  // Check if current activeIndex requires authentication
  const isProtectedIndex = useMemo(() => {
    return [5, 6, 7, 10].includes(activeIndex);
  }, [activeIndex]);
  
  
  // Get userId from user data or auth
  const userId = user?.userId;

  // Track overall user loading state
  const isLoadingUser = userLoading || isLoading;

  // Function to trigger push notification with appropriate icon
  const triggerPushNotification = useCallback((notification: Notification) => {
    // Only show push notification for unread notifications that haven't been shown yet
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

    // Show browser notification
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
      
      // Add to shown notifications set
      setShownNotificationIds(prev => {
        const newSet = new Set(prev);
        newSet.add(notification.id);
        return newSet;
      });
      
      // Handle click on notification
      if (result.type === 'click' && notification.link) {
        router.push(notification.link);
      }
    }).catch(error => {
      console.error('Failed to show push notification:', error);
    });
  }, [shownNotificationIds, router]);

  // Extract notifications safely
  const extractNotifications = useCallback((data: any): Notification[] => {
    try {
      if (!data?.notifications?.edges) return [];
      return data.notifications.edges.map((edge: any) => edge.node);
    } catch (error) {
      console.error('Error extracting notifications:', error);
      return [];
    }
  }, []);

  // Handle new notifications from Apollo query
  const handleNewNotifications = useCallback((data: any) => {
    const latestNotifications = extractNotifications(data);
    
    // Find unread notifications that haven't been shown yet
    const newNotifications = latestNotifications.filter(
      (notification: Notification) => 
        !notification.isRead && !shownNotificationIds.has(notification.id)
    );
    
    // Trigger push notifications for each new notification
    newNotifications.forEach(notification => {
      triggerPushNotification(notification);
    });
  }, [extractNotifications, shownNotificationIds, triggerPushNotification]);

  // OPTIMIZED: Use Apollo's built-in polling
  const { 
    data: notificationsData, 
    loading: notificationsLoading, 
    error: notificationsError,
    refetch: refetchNotifications
  } = useQuery(GET_NOTIFICATIONS, {
    variables: { 
      userId: userId || '',
      limit: 5
    },
    skip: !userId, // Don't query if no userId
    fetchPolicy: 'cache-and-network',
    // Apollo handles polling automatically - more efficient than setInterval
    pollInterval: userId ? 10000 : 0, // Poll every 10s only when userId exists
    onError: (error) => {
      console.error('Notification query error:', error);
    },
    onCompleted: (data) => {
      // Handle new notifications when query completes
      if (data && userId) {
        handleNewNotifications(data);
      }
    },
  });

  // Memoize expensive calculations for better performance
  const notifications = useMemo(() => 
    notificationsData ? extractNotifications(notificationsData) : [], 
    [notificationsData, extractNotifications]
  );

  const unreadCount = useMemo(() => 
    notificationsData?.notifications?.unreadCount || 0, 
    [notificationsData]
  );

  // Notification mutations
  const [markAsReadMutation] = useMutation(MARK_AS_READ, {
    onError: (error) => console.error('Mark as read error:', error)
  });
  const [markAllAsReadMutation] = useMutation(MARK_ALL_AS_READ, {
    onError: (error) => console.error('Mark all as read error:', error)
  });
  const [deleteNotificationMutation] = useMutation(DELETE_NOTIFICATION, {
    onError: (error) => console.error('Delete notification error:', error)
  });

  // Check authentication status
  useEffect(() => {
    const getRole = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/protected', {
          credentials: 'include'
        });
        
        if (response.status === 401) {
          setUser(null);
          return;
        }
        
        const data = await response.json();
        const token = data?.user;
        const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz";

        if (token) {
          const payload = await decryptToken(token, secret.toString());
          setUser(payload);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error getting role:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
        setHasCheckedAuth(true);
      }
    };
    getRole();
  }, []);

  // Clear shown notifications when user changes
  useEffect(() => {
    if (userId) {
      setShownNotificationIds(new Set());
    }
  }, [userId]);

  // Check if current route requires authentication
  useEffect(() => {
    if (isLoadingUser) {
      return;
    }

    const protectedIndexes = [5, 6, 7, 10];
    console.log("index->",protectedIndexes.includes(activeIndex),"user->",isUserLoggedIn);
    // Redirect to login if trying to access protected index without user
    if (protectedIndexes.includes(activeIndex) && !isUserLoggedIn) {
      console.log('Redirecting to login: protected index without user');
      router.push('/Login');
    }
  }, [activeIndex, isUserLoggedIn, isLoadingUser, router]);

  // Close dropdown when clicking outside (desktop)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsBellPopupOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close modal when clicking outside or pressing escape (mobile)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsModalOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
        setIsBellPopupOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  // Refetch notifications when bell popup opens
  useEffect(() => {
    if (isBellPopupOpen && userId) {
      refetchNotifications();
    }
  }, [isBellPopupOpen, userId, refetchNotifications]);

  // Check if mobile device
  const isMobile = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  }, []);

  const handleUserButtonClick = () => {
    if (isAuthPage) return; // Don't open on auth pages
    
    if (isMobile()) {
      setIsModalOpen(true);
    } else {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  const handleBellButtonClick = () => {
    if (isAuthPage) return; // Don't open on auth pages
    
    if (!userId) {
      // If no user, redirect to login
      router.push('/Login');
      return;
    }
    
    if (isMobile()) {
      setIsBellPopupOpen(!isBellPopupOpen);
    } else {
      setIsBellPopupOpen(!isBellPopupOpen);
      setIsDropdownOpen(false);
    }
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
        return <MessageCircle className="w-4 h-4" />;
      case NotificationType.ORDER_CREATED:
      case NotificationType.ORDER_UPDATED:
      case NotificationType.ORDER_DELIVERED:
        return <ShoppingBag className="w-4 h-4" />;
      case NotificationType.PROMOTIONAL:
        return <AlertCircle className="w-4 h-4" />;
      case NotificationType.ACCOUNT_VERIFIED:
      case NotificationType.PASSWORD_CHANGED:
      case NotificationType.SYSTEM_ALERT:
        return <Info className="w-4 h-4" />;
      case NotificationType.PAYMENT_RECEIVED:
        return <CheckCircle className="w-4 h-4" />;
      case NotificationType.PAYMENT_FAILED:
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
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
          handleTabClick(10);
          break;
        case NotificationType.PAYMENT_RECEIVED:
        case NotificationType.PAYMENT_FAILED:
          router.push('/Payments');
          break;
        default:
          break;
      }
    }
    
    setIsBellPopupOpen(false);
  };

  const handleTabClick = (tabId: number) => {
    // Check if this is a protected tab and user is not logged in
    if ([5, 6, 7, 10].includes(tabId) && !isUserLoggedIn) {
      router.push('/Login');
      return;
    }

    if (pathname !== '/') {
      router.push('/');
      setTimeout(() => {
        dispatch(setActiveIndex(tabId));
      }, 100);
    } else {
      dispatch(setActiveIndex(tabId));
    }
  };

  return (
    <div>
      <div className="relative bg-gradient-to-r from-violet-100 to-indigo-100 bg-opacity-90 p-2 aspect-[4/1] sm:aspect-[9/1]">
        <AnimatedCrowd/>
        <div className="z-20 flex items-center justify-between p-2 h-[100%] w-[100%]">
        
          <div className="z-20 h-[100%] flex items-center">
            <Image 
              src="/VendorCity.svg" 
              alt="Logo" 
              height={80} 
              width={80} 
              className="h-[100%] w-[auto] rounded"
              style={{ filter: 'drop-shadow(0.5px 0.5px 3px black)' }}
            />
          </div>
             
          <div className="z-20 h-[100%] flex items-center space-x-2">
            {/* Bell Button with Notification Badge - Hidden on auth pages */}
            {!isAuthPage && (
              <div className="relative" ref={bellRef}>
                <button
                  onClick={handleBellButtonClick}
                  className="relative flex items-center text-sm focus:outline-none"
                  disabled={isLoadingUser}
                  title={!userId ? "Sign in to view notifications" : ""}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                    userId && !isLoadingUser ? 'bg-purple-100 border-indigo-200' : 'bg-gray-100 border-gray-200'
                  }`}>
                    <Bell className={`w-5 h-5 ${
                      userId && !isLoadingUser ? 'text-indigo-600' : 'text-gray-400'
                    }`} />
                  </div>
                  {isLoadingUser ? (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                    </span>
                  ) : unreadCount > 0 && userId && !notificationsLoading ? (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  ) : null}
                  {notificationsLoading && userId && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                    </span>
                  )}
                </button>

                {/* Slide-up Bell Popup with enhanced animation */}
                {isBellPopupOpen && userId && (
                  <div className="fixed inset-0 z-50 md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-96">
                    {/* Backdrop for mobile with fade-in animation */}
                    <div 
                      className="fixed inset-0 bg-black transition-opacity duration-300 ease-out md:hidden"
                      style={{
                        opacity: isBellPopupOpen ? 0.5 : 0,
                        backdropFilter: isBellPopupOpen ? 'blur(4px)' : 'blur(0px)'
                      }}
                      onClick={() => setIsBellPopupOpen(false)}
                    />
                    
                    {/* Popup Container with enhanced slide-up animation */}
                    <div className={`
                      fixed bottom-0 left-0 right-0 
                      md:absolute md:bottom-auto md:top-full 
                      bg-white rounded-t-2xl md:rounded-2xl 
                      shadow-2xl border border-gray-200 
                      transform transition-all duration-300 ease-out
                      ${isBellPopupOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 md:translate-y-2 md:opacity-0'}
                      max-h-[80vh] md:max-h-[70vh] flex flex-col
                    `}>
                      {/* Header */}
                      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-2xl md:rounded-t-2xl">
                        <div className="flex items-center space-x-2">
                          <Bell className="w-5 h-5 text-purple-600" />
                          <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                          {unreadCount > 0 && !notificationsLoading && (
                            <span className="px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {notificationsLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                          ) : (
                            <>
                              {unreadCount > 0 && (
                                <button
                                  onClick={markAllAsRead}
                                  className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200"
                                >
                                  Mark all read
                                </button>
                              )}
                              <button
                                onClick={() => setIsBellPopupOpen(false)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
                              >
                                <X className="w-5 h-5 text-gray-500" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Notifications List */}
                      <div className="flex-1 overflow-y-auto">
                        {notificationsLoading ? (
                          <div className="flex flex-col items-center justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
                            <p className="text-gray-600">Loading notifications...</p>
                          </div>
                        ) : notificationsError ? (
                          <div className="flex flex-col items-center justify-center p-8">
                            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                            <p className="text-gray-600">Failed to load notifications</p>
                            <button
                              onClick={() => refetchNotifications()}
                              className="mt-2 px-4 py-2 text-sm text-purple-600 hover:text-purple-800 transition-colors duration-200"
                            >
                              Retry
                            </button>
                          </div>
                        ) : notifications.length > 0 ? (
                          <div className="divide-y divide-gray-100">
                            {notifications.map((notification, index) => (
                              <div
                                key={notification.id}
                                className={`
                                  p-4 hover:bg-gray-50 transition-all duration-200 ease-out cursor-pointer
                                  ${!notification.isRead ? 'bg-blue-50 bg-opacity-50' : ''}
                                  transform transition-transform duration-300 ease-out
                                  ${isBellPopupOpen ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}
                                `}
                                style={{
                                  transitionDelay: `${index * 50}ms`
                                }}
                                onClick={() => handleNotificationClick(notification)}
                              >
                                <div className="flex items-start space-x-3">
                                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                    getNotificationColor(notification.type)
                                  }`}>
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className={`text-xs font-small ${
                                        !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                                      }`}>
                                        {notification.title}
                                      </p>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-xs text-gray-500 flex items-center">
                                          <Clock className="w-3 h-3 mr-1" />
                                          {getTimeAgo(notification.createdAt)}
                                        </span>
                                        {!notification.isRead && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              markAsRead(notification.id);
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800 transition-colors duration-200"
                                          >
                                            Mark read
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-600">
                                      {notification.message}
                                    </p>
                                    <div className="mt-2 flex space-x-2">
                                      {notification.type === NotificationType.NEW_MESSAGE && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setIsBellPopupOpen(false);
                                            router.push('/Messaging');
                                          }}
                                          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-200"
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
                                            handleTabClick(10);
                                          }}
                                          className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all duration-200"
                                        >
                                          View Order
                                        </button>
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteNotification(notification.id);
                                        }}
                                        className="px-3 py-1 text-xs text-gray-500 hover:text-red-600 transition-colors duration-200"
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
                          <div className="flex flex-col items-center justify-center p-8 text-center transform transition-all duration-300 ease-out">
                            <Bell className="w-12 h-12 text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium">No notifications</p>
                            <p className="text-gray-400 text-sm mt-1">Youre all caught up!</p>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="p-4 border-t border-gray-200 bg-gray-50">
                        <button
                          onClick={() => {
                            setIsBellPopupOpen(false);
                            router.push('/Notifications');
                          }}
                          className="w-full py-2 text-center text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors duration-200"
                        >
                          View all notifications
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Button - Hidden on auth pages */}
            {!isAuthPage && (
              <div ref={dropdownRef}>
                <button
                  onClick={handleUserButtonClick}
                  className="flex items-center text-sm focus:outline-none group"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center border border-indigo-200 group-hover:bg-purple-200 group-hover:border-indigo-300 transition-all duration-300 ease-out">
                    <Menu className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </button>
                
                {/* Desktop Dropdown with slide-down animation - Only show if user is logged in */}
                {isDropdownOpen && !isMobile() && isUserLoggedIn && (
                  <div className="absolute right-0 mt-2 w-48 bg-white bg-opacity-95 backdrop-blur-md rounded-md shadow-lg py-1 customZIndex border border-gray-200 transform transition-all duration-300 ease-out origin-top-right"
                    style={{
                      transform: isDropdownOpen ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(-10px)',
                      opacity: isDropdownOpen ? 1 : 0
                    }}
                  >
                    <div
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-all duration-200 ease-out hover:pl-5"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleTabClick(7);
                      }}
                    >
                      <User className="mr-2 text-gray-400 w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                      <span className="transition-all duration-200">Your Profile</span>
                      <ChevronRight className="ml-auto text-gray-400 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-all duration-200 ease-out hover:pl-5"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        router.push('/Messaging');
                      }}
                    >
                      <MessageCircle className="mr-2 text-gray-400 w-4 h-4" />
                      <span className="transition-all duration-200">Messages</span>
                      <ChevronRight className="ml-auto text-gray-400 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-all duration-200 ease-out hover:pl-5"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleTabClick(10);
                      }}
                    >
                      <ShoppingBag className="mr-2 text-gray-400 w-4 h-4" />
                      <span className="transition-all duration-200">Orders</span>
                      <ChevronRight className="ml-auto text-gray-400 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="border-t border-gray-100 my-1 transition-all duration-300"></div>
                    <div className="transform transition-all duration-300 hover:scale-[1.02]">
                      <LogoutButton/>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Slide From Left Modal with enhanced animation - Only show if user is logged in */}
      {isModalOpen && isMobile() && !isAuthPage && isUserLoggedIn && (
        <>
          {/* Backdrop with fade-in animation */}
          <div 
            className="fixed inset-0 bg-black z-40 md:hidden transition-all duration-300 ease-out"
            style={{
              opacity: isModalOpen ? 0.5 : 0,
              backdropFilter: isModalOpen ? 'blur(4px)' : 'blur(0px)'
            }}
            onClick={() => setIsModalOpen(false)}
          />
          
          {/* Modal with slide-in animation */}
          <div 
            ref={modalRef}
            className="fixed top-0 left-0 h-full w-3/4 max-w-sm shadow-2xl z-50 md:hidden"
            style={{
              transform: isModalOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Header with close button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-purple-400 bg-opacity-40 backdrop-blur-md p-2 aspect-[3/1]">
              <div className="z-20 h-[100%] flex items-center transform transition-all duration-300 hover:scale-105">
                <Image 
                  src="/VendorCity.svg" 
                  alt="Logo" 
                  height={80} 
                  width={80} 
                  className="h-[100%] w-[auto] rounded"
                  style={{ filter: 'drop-shadow(0.5px 0.5px 3px black)' }}
                />
              </div>
              
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-white hover:bg-opacity-50 transition-all duration-300 ease-out hover:rotate-90"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Modal content with staggered animation */}
            <div className="overflow-y-auto h-full pb-20 bg-[#f1f1f1]">
              <div className="p-4">
                <div className="space-y-1">
                  <button
                    className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-300 ease-out hover:pl-5 hover:shadow-sm"
                    style={{
                      transform: isModalOpen ? 'translateX(0)' : 'translateX(-20px)',
                      opacity: isModalOpen ? 1 : 0,
                      transitionDelay: '0.1s'
                    }}
                    onClick={() => {
                      setIsModalOpen(false);
                      handleTabClick(7);
                    }}
                  >
                    <User className="mr-3 text-gray-400 w-5 h-5 transform transition-transform duration-300 group-hover:scale-110" />
                    <span className="flex-1 transition-all duration-300">Your Profile</span>
                    <ChevronRight className="text-gray-400 w-4 h-4 transform transition-transform duration-300 group-hover:translate-x-1" />
                  </button>

                  <button
                    className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-300 ease-out hover:pl-5 hover:shadow-sm"
                    style={{
                      transform: isModalOpen ? 'translateX(0)' : 'translateX(-20px)',
                      opacity: isModalOpen ? 1 : 0,
                      transitionDelay: '0.15s'
                    }}
                    onClick={() => {
                      setIsModalOpen(false);
                      router.push('/Messaging');
                    }}
                  >
                    <MessageCircle className="mr-3 text-gray-400 w-5 h-5" />
                    <span className="flex-1 transition-all duration-300">Messages</span>
                    <ChevronRight className="text-gray-400 w-4 h-4 transform transition-transform duration-300 group-hover:translate-x-1" />
                  </button>

                  <button
                    className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-300 ease-out hover:pl-5 hover:shadow-sm"
                    style={{
                      transform: isModalOpen ? 'translateX(0)' : 'translateX(-20px)',
                      opacity: isModalOpen ? 1 : 0,
                      transitionDelay: '0.2s'
                    }}
                    onClick={() => {
                      setIsModalOpen(false);
                      handleTabClick(10);
                    }}
                  >
                    <ShoppingBag className="mr-3 text-gray-400 w-5 h-5" />
                    <span className="flex-1 transition-all duration-300">Orders</span>
                    <ChevronRight className="text-gray-400 w-4 h-4 transform transition-transform duration-300 group-hover:translate-x-1" />
                  </button>

                  <div 
                    className="border-t border-gray-200 my-3 transition-all duration-300"
                    style={{
                      transform: isModalOpen ? 'scaleX(1)' : 'scaleX(0)',
                      opacity: isModalOpen ? 1 : 0,
                      transitionDelay: '0.25s',
                      transformOrigin: 'left'
                    }}
                  ></div>

                  <div 
                    className="px-4 py-3 transform transition-all duration-300"
                    style={{
                      transform: isModalOpen ? 'translateX(0)' : 'translateX(-20px)',
                      opacity: isModalOpen ? 1 : 0,
                      transitionDelay: '0.3s'
                    }}
                  >
                    <LogoutButton/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {/*<VisitorCounter/>*/}
      
      {/*<Ads/>*/}
    </div>
  );
};

export default Header;
