'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
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
  Package,
  Truck,
  DollarSign,
  UserCheck,
  Settings,
  Filter,
  CheckCheck
} from 'lucide-react';

// ==================== Types ====================

export enum NotificationType {
  NEW_MESSAGE = 'NEW_MESSAGE',
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_UPDATED = 'ORDER_UPDATED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  SHIPMENT = 'SHIPMENT',
  RETURN_REQUEST_CREATED = 'RETURN_REQUEST_CREATED',
  RETURN_STATUS_UPDATED = 'RETURN_STATUS_UPDATED',
  RETURN_SHIPPED = 'RETURN_SHIPPED',
  RETURN_RECEIVED = 'RETURN_RECEIVED',
  RETURN_APPROVED = 'RETURN_APPROVED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',
  RETURN_COMPLETED = 'RETURN_COMPLETED',
  RETURN_REJECTED = 'RETURN_REJECTED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_CONFIRMATION = 'PAYMENT_CONFIRMATION',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
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

interface NotificationListProps {
  notifications: Notification[];
  loading?: boolean;
  error?: string | null;
  onNotificationClick?: (notification: Notification) => void;
  onMarkAsRead?: (id: string) => Promise<void>;
  onMarkAllAsRead?: () => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onRefresh?: () => void;
  showFilters?: boolean;
  showActions?: boolean;
  emptyMessage?: string;
  itemsPerPage?: number;
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

const getNotificationIcon = (type: NotificationType, className = "w-5 h-5") => {
  const icons: Record<NotificationType, React.ReactElement> = {
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
  const colors: Record<NotificationType, string> = {
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

// ==================== Main Component ====================

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  loading = false,
  error = null,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onRefresh,
  showFilters = true,
  showActions = true,
  emptyMessage = "No notifications to display",
  itemsPerPage = 10
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  // Paginate
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    setDeletingId(id);
    try {
      await onDelete(id);
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    } finally {
      setDeletingId(null);
    }
  };

  // Handle bulk delete - FIXED: using array instead of Set
  const handleBulkDelete = async () => {
    if (!onDelete) return;
    for (let i = 0; i < selectedIds.length; i++) {
      await onDelete(selectedIds[i]);
    }
    setSelectedIds([]);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    if (onMarkAllAsRead) {
      await onMarkAllAsRead();
    }
  };

  // Handle select all - FIXED: using array
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedNotifications.length) {
      setSelectedIds([]);
    } else {
      const allIds = paginatedNotifications.map(n => n.id);
      setSelectedIds(allIds);
    }
  };

  // Handle single select
  const handleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(selectedId => selectedId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [filter]);

  if (loading && notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-10 h-10 animate-spin text-gray-400 mb-3" />
        <p className="text-gray-500">Loading notifications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
        <p className="text-gray-600 text-center">{error}</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="mt-3 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
            {notifications.length > 0 && (
              <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded-full">
                {notifications.filter(n => !n.isRead).length} unread
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {showFilters && (
              <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filter === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filter === 'unread' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Unread
                </button>
                <button
                  onClick={() => setFilter('read')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filter === 'read' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Read
                </button>
              </div>
            )}
            
            {showActions && notifications.length > 0 && (
              <div className="flex items-center gap-2">
                {onMarkAllAsRead && notifications.some(n => !n.isRead) && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                {onRefresh && (
                  <button
                    onClick={onRefresh}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
          <span className="text-sm text-blue-700">
            {selectedIds.length} notification{selectedIds.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            >
              Delete selected
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      {paginatedNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <Bell className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">{emptyMessage}</p>
          <p className="text-sm text-gray-400 mt-1">
            {filter !== 'all' ? `No ${filter} notifications` : 'You\'re all caught up!'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {paginatedNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`
                px-6 py-4 hover:bg-gray-50 transition-all duration-200
                ${!notification.isRead ? 'bg-blue-50/30' : ''}
                ${deletingId === notification.id ? 'opacity-50 pointer-events-none' : ''}
              `}
            >
              <div className="flex gap-4">
                {/* Checkbox for bulk actions */}
                {onDelete && (
                  <div className="flex-shrink-0 pt-1">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(notification.id)}
                      onChange={() => handleSelect(notification.id)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </div>
                )}
                
                {/* Icon */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                  {getNotificationIcon(notification.type, "w-6 h-6")}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-base font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 flex items-center whitespace-nowrap">
                      <Clock className="w-3 h-3 mr-1" />
                      {getTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 break-words mb-3">
                    {notification.message}
                  </p>
                  
                  {/* Actions */}
                  {showActions && (
                    <div className="flex items-center gap-3">
                      {!notification.isRead && onMarkAsRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsRead(notification.id);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                        >
                          Mark as read
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await handleDelete(notification.id);
                          }}
                          className="text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
                          disabled={deletingId === notification.id}
                        >
                          {deletingId === notification.id ? (
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
                      )}
                      {onNotificationClick && (
                        <button
                          onClick={() => onNotificationClick(notification)}
                          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          View details →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
