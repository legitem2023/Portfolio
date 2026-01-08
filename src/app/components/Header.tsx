// components/Header.tsx
"use client";
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import VisitorCounter from './VisitorCounter';
import VisitorBadge from './VisitorBadge';
import { decryptToken } from '../../../utils/decryptToken';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveIndex } from '../../../Redux/activeIndexSlice';
import AnimatedCrowd from "./AnimatedCrowd";
import AnimatedCrowdMenu from "./AnimatedCrowdMenu";
import { 
  User, 
  MessageCircle, 
  ShoppingBag, 
  X, 
  ChevronRight,
  Bell,
  LogOut,
  AlertCircle,
  CheckCircle,
  Info,
  Clock
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

import { USERS,GET_NOTIFICATIONS } from './graphql/query';
import { useQuery, useMutation, NetworkStatus } from '@apollo/client';
import LogoutButton from './LogoutButton';
import Ads from './Ads/Ads';
import { PromoAd } from './Ads/PromoAd';
import { useAdDrawer } from './hooks/useAdDrawer';

// Import the notification queries and types
import { 
  MARK_AS_READ,
  MARK_ALL_AS_READ,
  DELETE_NOTIFICATION
} from './graphql/mutation';
import { 
  NotificationType,
  type Notification 
} from '../../../types/notification';

const Header: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBellPopupOpen, setIsBellPopupOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  const pathname = usePathname();
  
  const drawer = useAdDrawer({ autoOpenDelay: 3000 });
  
  const dispatch = useDispatch();
  const activeIndex = useSelector((state: any) => state.activeIndex.value);
  const { data: userData, loading: userLoading, networkStatus } = useQuery(USERS, {
    notifyOnNetworkStatusChange: true
  });

  // Get userId from user data or auth
  const userId = user?.id || userData?.users?.[0]?.id || '';

  // Fetch notifications using the GET_NOTIFICATIONS query
  const { 
    data: notificationsData, 
    loading: notificationsLoading, 
    error: notificationsError,
    refetch: refetchNotifications
  } = useQuery(GET_NOTIFICATIONS, {
    variables: {
      userId,
      filters: {
        limit: 10, // Show last 10 notifications in header
      },
    },
    skip: !userId, // Only fetch if we have a userId
    fetchPolicy: 'cache-and-network',
    pollInterval: 60000, // Poll every minute for new notifications
  });

  // Notification mutations
  const [markAsReadMutation] = useMutation(MARK_AS_READ);
  const [markAllAsReadMutation] = useMutation(MARK_ALL_AS_READ);
  const [deleteNotificationMutation] = useMutation(DELETE_NOTIFICATION);

  // Extract notifications from query result
  const notifications: Notification[] = notificationsData?.notifications?.nodes || [];
  const unreadCount = notificationsData?.notifications?.unreadCount || 0;

  // Check authentication status
  useEffect(() => {
    const getRole = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/protected', {
          credentials: 'include' // Important: includes cookies
        });
        
        if (response.status === 401) {
          // Handle unauthorized access
          setUser(null);
          throw new Error('Unauthorized');
        }
        
        const data = await response.json();
        const token = data?.user;
        const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz";

        const payload = await decryptToken(token, secret.toString());
        setUser(payload);
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

  // Check if current route requires authentication - ONLY AFTER everything is loaded
  useEffect(() => {
    // Only check redirect conditions when:
    // 1. Authentication check is complete (hasCheckedAuth)
    // 2. User query is not loading (if you're using it)
    // 3. We're not in a loading state
    if (!hasCheckedAuth || isLoading || networkStatus === NetworkStatus.loading) {
      return;
    }

    const protectedIndexes = [5, 7, 8, 9, 10];
    
    if (protectedIndexes.includes(activeIndex) && !user) {
      console.log('Redirecting to login: protected index without user');
      router.push('/Login');
    }
  }, [activeIndex, user, isLoading, hasCheckedAuth, networkStatus, router]);

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
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
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
  const isMobile = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768; // 768px is typical breakpoint for md in Tailwind
  };

  const handleUserButtonClick = () => {
    if (isMobile()) {
      setIsModalOpen(true);
    } else {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  const handleBellButtonClick = () => {
    if (isMobile()) {
      // On mobile, show slide-up popup
      setIsBellPopupOpen(!isBellPopupOpen);
    } else {
      // On desktop, also show slide-up popup
      setIsBellPopupOpen(!isBellPopupOpen);
      setIsDropdownOpen(false); // Close user dropdown if open
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
        update: (cache) => {
          // Update cache immediately for instant UI feedback
          cache.modify({
            id: cache.identify({ id, __typename: 'Notification' }),
            fields: {
              isRead: () => true,
            },
          });
        }
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
        update: (cache) => {
          // Update all notifications in cache
          const notifications = cache.readQuery({
            query: GET_NOTIFICATIONS,
            variables: { userId, filters: { limit: 10 } }
          });

          if (notifications?.notifications?.nodes) {
            notifications.notifications.nodes.forEach((notification: any) => {
              cache.modify({
                id: cache.identify(notification),
                fields: {
                  isRead: () => true,
                },
              });
            });

            // Update unread count
            cache.modify({
              fields: {
                notifications: (existing) => ({
                  ...existing,
                  unreadCount: 0
                })
              }
            });
          }
        }
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
        update: (cache) => {
          // Remove from cache immediately
          cache.evict({ id: cache.identify({ id, __typename: 'Notification' }) });
          cache.gc();
        }
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
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

  const getNotificationTitle = (type: NotificationType) => {
    return type.replace(/_/g, ' ');
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    if (notification.link) {
      router.push(notification.link);
    } else {
      // Handle navigation based on notification type
      switch (notification.type) {
        case NotificationType.NEW_MESSAGE:
          router.push('/Messaging');
          break;
        case NotificationType.ORDER_CREATED:
        case NotificationType.ORDER_UPDATED:
        case NotificationType.ORDER_DELIVERED:
          handleTabClick(10); // Orders tab
          break;
        case NotificationType.PAYMENT_RECEIVED:
        case NotificationType.PAYMENT_FAILED:
          router.push('/Payments');
          break;
        default:
          // Default behavior
          break;
      }
    }
    
    setIsBellPopupOpen(false);
  };

  const handleTabClick = (tabId: number) => {
    // If not on homepage, redirect to homepage first
    if (pathname !== '/') {
      router.push('/');
      // Optionally, you can set a timeout to dispatch the active index after navigation
      setTimeout(() => {
        dispatch(setActiveIndex(tabId));
      }, 100);
    } else {
      // If already on homepage, just update the active tab
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
              src="/Vendor.svg" 
              alt="Logo" 
              height={80} 
              width={80} 
              className="h-[100%] w-[auto] rounded"
              style={{ filter: 'drop-shadow(0.5px 0.5px 3px black)' }}
            />
          </div>
             
          <div className="z-20 h-[100%] flex items-center space-x-2">
            {/* Bell Button with Notification Badge */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={handleBellButtonClick}
                className="relative flex items-center text-sm focus:outline-none"
                disabled={!userId}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                  userId ? 'bg-purple-100 border-indigo-200' : 'bg-gray-100 border-gray-200'
                }`}>
                  <Bell className={`w-5 h-5 ${userId ? 'text-indigo-600' : 'text-gray-400'}`} />
                </div>
                {unreadCount > 0 && userId && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Slide-up Bell Popup */}
              {isBellPopupOpen && userId && (
                <div className="fixed inset-0 z-50 md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-96">
                  {/* Backdrop for mobile */}
                  <div 
                    className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm md:hidden"
                    onClick={() => setIsBellPopupOpen(false)}
                  />
                  
                  {/* Popup Container */}
                  <div className={`
                    fixed bottom-0 left-0 right-0 
                    md:absolute md:bottom-auto md:top-full 
                    bg-white rounded-t-2xl md:rounded-2xl 
                    shadow-2xl border border-gray-200 
                    transform transition-transform duration-300 ease-out
                    ${isBellPopupOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-2'}
                    max-h-[80vh] md:max-h-[70vh] flex flex-col
                  `}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-2xl md:rounded-t-2xl">
                      <div className="flex items-center space-x-2">
                        <Bell className="w-5 h-5 text-purple-600" />
                        <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                        {unreadCount > 0 && (
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
                                className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              >
                                Mark all read
                              </button>
                            )}
                            <button
                              onClick={() => setIsBellPopupOpen(false)}
                              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
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
                            className="mt-2 px-4 py-2 text-sm text-purple-600 hover:text-purple-800"
                          >
                            Retry
                          </button>
                        </div>
                      ) : notifications.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                                !notification.isRead ? 'bg-blue-50 bg-opacity-50' : ''
                              }`}
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
                                    <p className={`text-sm font-medium ${
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
                                          className="text-xs text-blue-600 hover:text-blue-800"
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
                                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
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
                                        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                      >
                                        View Order
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notification.id);
                                      }}
                                      className="px-3 py-1 text-xs text-gray-500 hover:text-red-600 transition-colors"
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
                        className="w-full py-2 text-center text-sm text-purple-600 hover:text-purple-800 font-medium"
                      >
                        View all notifications
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Button */}
            <div ref={dropdownRef}>
              <button
                onClick={handleUserButtonClick}
                className="flex items-center text-sm focus:outline-none"
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center border border-indigo-200">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
              </button>
              
              {/* Desktop Dropdown */}
              {isDropdownOpen && !isMobile() && (
                <div className="absolute right-0 mt-2 w-48 bg-white bg-opacity-95 backdrop-blur-md rounded-md shadow-lg py-1 customZIndex border border-gray-200 translate-y-3/4">
                  <div
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleTabClick(7);
                    }}
                  >
                    <User className="mr-2 text-gray-400 w-4 h-4" />
                    Your Profile
                  </div>
                  <div
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      router.push('/Messaging');
                    }}
                  >
                    <MessageCircle className="mr-2 text-gray-400 w-4 h-4" />
                    Messages
                  </div>
                  <div
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleTabClick(10);
                    }}
                  >
                    <ShoppingBag className="mr-2 text-gray-400 w-4 h-4" />
                    Orders
                  </div>
                  <div className="border-t border-gray-100 my-1"></div>
                  <LogoutButton/>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Slide From Left Modal */}
      {isModalOpen && isMobile() && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black backdrop-blur-sm bg-opacity-50 z-40 transition-opacity duration-300 md:hidden"
            onClick={() => setIsModalOpen(false)}
          />
          
          {/* Modal */}
          <div 
            ref={modalRef}
            className="fixed top-0 left-0 h-full w-3/4 max-w-sm shadow-2xl z-50 transform transition-transform duration-300 ease-linear md:hidden"
            style={{ 
              transform: isModalOpen ? 'translateX(0)' : 'translateX(-100%)'
            }}
          >
            {/* Header with close button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-purple-400 bg-opacity-40 backdrop-blur-md p-2 aspect-[3/1]">
              <div className="z-20 h-[100%] flex items-center">
                <Image 
                  src="/Dlogo.svg" 
                  alt="Logo" 
                  height={80} 
                  width={80} 
                  className="h-[100%] w-[auto] rounded"
                  style={{ filter: 'drop-shadow(0.5px 0.5px 3px black)' }}
                />
              </div>
              
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-white hover:bg-opacity-50 transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Modal content */}
            <div className="overflow-y-auto h-full pb-20 bg-[#f1f1f1]">
              <div className="p-4">
                <div className="space-y-1">
                  <button
                    className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
                    onClick={() => {
                      setIsModalOpen(false);
                      handleTabClick(7);
                    }}
                  >
                    <User className="mr-3 text-gray-400 w-5 h-5" />
                    <span className="flex-1">Your Profile</span>
                    <ChevronRight className="text-gray-400 w-4 h-4" />
                  </button>

                  <button
                    className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
                    onClick={() => {
                      setIsModalOpen(false);
                      handleTabClick(9);
                    }}
                  >
                    <MessageCircle className="mr-3 text-gray-400 w-5 h-5" />
                    <span className="flex-1">Messages</span>
                    <ChevronRight className="text-gray-400 w-4 h-4" />
                  </button>

                  <button
                    className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
                    onClick={() => {
                      setIsModalOpen(false);
                      handleTabClick(10);
                    }}
                  >
                    <ShoppingBag className="mr-3 text-gray-400 w-5 h-5" />
                    <span className="flex-1">Orders</span>
                    <ChevronRight className="text-gray-400 w-4 h-4" />
                  </button>

                  <div className="border-t border-gray-200 my-3"></div>

                  <div className="px-4 py-3">
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
