'use client';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useDispatch } from "react-redux";
import { setActiveIndex } from '../../../../Redux/activeIndexSlice';
import { setSelectedUser } from '../../../../Redux/selectedUserSlice';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import { LogOut, CreditCard, Building, ChevronDown, Bell, X, Clock, AlertCircle, CheckCircle, Info, ShoppingBag, MessageCircle, Trash2, Loader2 } from 'lucide-react';
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
  user: User | null | undefined;
}

export default function TopNav({ onMenuClick, user }: TopNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const [userId, setUserId] = useState(user?.userId);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isBellPopupOpen, setIsBellPopupOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [shownNotificationIds, setShownNotificationIds] = useState<Set<string>>(new Set());
  const [deletingNotificationId, setDeletingNotificationId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

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
    onError: (error) => console.error('Delete notification error:', error),
    onCompleted: () => {
      setDeletingNotificationId(null);
    }
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

  const handleProfile = () => {
    setIsDropdownOpen(false);
    dispatch(setActiveIndex(10));
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
    setDeletingNotificationId(id);
    
    try {
      await deleteNotificationMutation({
        variables: { id },
        update: (cache) => {
          const cachedData: any = cache.readQuery({
            query: GET_NOTIFICATIONS,
            variables: { userId, filters: { limit: 10 } }
          });
          
          if (cachedData && cachedData.notifications) {
            const updatedEdges = cachedData.notifications.edges.filter(
              (edge: any) => edge.node.id !== id
            );
            
            cache.writeQuery({
              query: GET_NOTIFICATIONS,
              variables: { userId, filters: { limit: 10 } },
              data: {
                notifications: {
                  ...cachedData.notifications,
                  edges: updatedEdges,
                  unreadCount: cachedData.notifications.unreadCount
                }
              }
            });
          }
        }
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      setDeletingNotificationId(null);
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
        return 'bg-teal-100 text-teal-600';
      case NotificationType.SYSTEM_ALERT:
        return 'bg-orange-100 text-orange-600';
      case NotificationType.PAYMENT_RECEIVED:
        return 'bg-emerald-100 text-emerald-600';
      case NotificationType.PAYMENT_FAILED:
        return 'bg-red-100 text-red-600';
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
    
    switch (notification.type) {
      case NotificationType.NEW_MESSAGE:
        dispatch(setActiveIndex(12));
        dispatch(setSelectedUser(notification.link || ""));
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

  return (
    <nav className="bg-zinc-800 shadow-md sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Left section - Menu Button */}
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all duration-200 md:hidden"
              aria-label="Open main menu"
            >
              <svg 
                className="h-6 w-6" 
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

          {/* Center - Logo */}
          <div className="flex items-center justify-center flex-shrink-0">
            <Image 
              src="/VendorCity_Management.webp" 
              alt="Logo" 
              height={56} 
              width={56} 
              className="h-14 sm:h-16 w-auto object-contain"
              priority
            />
          </div>

          {/* Right section - Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={toggleBellPopup}
                className="relative p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                disabled={!userId && notificationsLoading}
                title={!userId ? "Sign in to view notifications" : ""}
              >
                <span className="sr-only">View notifications</span>
                <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
                {notificationsLoading && userId ? (
                  <span className="absolute top-0 right-0">
                    <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-blue-600"></div>
                  </span>
                ) : unreadCount > 0 && userId && !notificationsLoading ? (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[1.25rem] h-5 text-xs font-bold text-white bg-red-500 rounded-full px-1 shadow-sm">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                ) : null}
              </button>

              {/* Notification Popup */}
              {isBellPopupOpen && userId && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
                    onClick={() => setIsBellPopupOpen(false)}
                  />
                  
                  {/* Popup Content */}
                  <div 
                    className={`
                      fixed md:absolute
                      ${isBellPopupOpen ? 'translate-y-0' : 'translate-y-full'}
                      transition-transform duration-300 ease-out
                      bottom-0 md:bottom-auto
                      left-0 md:left-auto
                      right-0
                      md:right-0 md:mt-2
                      w-full md:w-96
                      max-h-[85vh] md:max-h-[500px]
                      bg-white rounded-t-2xl md:rounded-lg
                      shadow-xl
                      z-50
                      flex flex-col
                    `}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    {/* Drag handle for mobile */}
                    <div className="md:hidden flex justify-center py-3">
                      <div className="w-12 h-1 bg-gray-300 rounded-full" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white rounded-t-2xl md:rounded-t-lg flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-blue-100 rounded-lg">
                          <Bell className="w-4 h-4 text-blue-600" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && !notificationsLoading && (
                          <span className="px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {notificationsLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                        ) : (
                          <>
                            {unreadCount > 0 && (
                              <button
                                onClick={markAllAsRead}
                                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                Mark all read
                              </button>
                            )}
                            <button
                              onClick={() => setIsBellPopupOpen(false)}
                              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4 text-gray-500" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Notifications List */}
                    <div className="flex-1 overflow-y-auto">
                      {notificationsLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-3" />
                          <p className="text-sm text-gray-500">Loading notifications...</p>
                        </div>
                      ) : notificationsError ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4">
                          <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                          <p className="text-sm text-gray-600 text-center">Failed to load notifications</p>
                          <button
                            onClick={() => refetchNotifications()}
                            className="mt-3 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
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
                                px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 cursor-pointer
                                ${!notification.isRead ? 'bg-blue-50/30' : ''}
                                ${deletingNotificationId === notification.id ? 'opacity-50 pointer-events-none' : ''}
                              `}
                              onClick={() => {
                                if (deletingNotificationId !== notification.id) {
                                  handleNotificationClick(notification);
                                }
                              }}
                            >
                              <div className="flex gap-3">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                                  {getNotificationIcon(notification.type)}
                                </div>
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
                                  <div className="flex items-center gap-2">
                                    {!notification.isRead && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          markAsRead(notification.id);
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                      >
                                        Mark as read
                                      </button>
                                    )}
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        await deleteNotification(notification.id);
                                      }}
                                      className="text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
                                      disabled={deletingNotificationId === notification.id}
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
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                          <Bell className="w-12 h-12 text-gray-300 mb-3" />
                          <p className="text-sm text-gray-500 font-medium">No notifications</p>
                          <p className="text-xs text-gray-400 mt-1">You&apos;re all caught up!</p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-2xl md:rounded-b-lg flex-shrink-0">
                      <button
                        onClick={() => {
                          setIsBellPopupOpen(false);
                          router.push('/Notifications');
                        }}
                        className="w-full py-2 text-center text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
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
                className="flex items-center gap-2 px-2 py-1.5 rounded-full bg-zinc-200 hover:bg-zinc-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
                id="user-menu-button"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <span className="sr-only">Open user menu</span>
                <img 
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border-2 border-white shadow-sm" 
                  src={user?.image || '/NoImage_2.webp'} 
                  alt={user?.name || 'User avatar'}
                />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.role || 'Guest'}</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black/5 focus:outline-none z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="py-1">
                    <button
                      onClick={handleProfile}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Profile</span>
                    </button>

                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors border-t border-gray-100 disabled:opacity-50"
                    >
                      <LogOut className={`h-4 w-4 ${isLoggingOut ? 'animate-spin' : ''}`} />
                      <span className="font-medium">{isLoggingOut ? 'Logging out...' : 'Sign Out'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
                    }
