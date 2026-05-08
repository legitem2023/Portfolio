import { NotificationList } from './NotificationList';
import { useQuery, useMutation } from '@apollo/client';
import { GET_NOTIFICATIONS } from '../../components/graphql/query';
import { 
  MARK_AS_READ,
  MARK_ALL_AS_READ,
  DELETE_NOTIFICATION
} from '../../components/graphql/mutation';
import { NotificationType } from '../../../../types/notification';
import { useDispatch } from "react-redux";
import { setActiveIndex } from '../../../../Redux/activeIndexSlice';
import { useRouter, usePathname } from 'next/navigation';
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

export default function NotificationPage({ UserId }: { UserId: string }) {
  const { data, loading, error, refetch } = useQuery(GET_NOTIFICATIONS, {
    variables: { userId: UserId, filters: { limit: 100 } }
  });
  const router = useRouter();
  const [markAsRead] = useMutation(MARK_AS_READ);
  const [markAllAsRead] = useMutation(MARK_ALL_AS_READ);
  const [deleteNotification] = useMutation(DELETE_NOTIFICATION);
  const dispatch = useDispatch();
  const notifications = data?.notifications?.edges?.map((edge: any) => edge.node) || [];
  
  const handleMarkAsRead = async (id: string) => {
    await markAsRead({ variables: { id } });
  };
  
  const handleMarkAllAsRead = async () => {
    await markAllAsRead({ variables: { userId: UserId } });
  };
  
  const handleDelete = async (id: string) => {
    await deleteNotification({ variables: { id } });
  };
    const handleNotificationClick = async (notification: Notification) => {
    
    
    switch (notification.type) {
      case NotificationType.NEW_MESSAGE:
        dispatch(setActiveIndex(12));
        dispatch(setSelectedUser(notification.link || ""));
        router.push('/Messaging');
        break;
      case NotificationType.ORDER_CREATED:
      case NotificationType.ORDER_UPDATED:
      case NotificationType.ORDER_DELIVERED:
      case NotificationType.SHIPMENT:
        dispatch(setActiveIndex(4));
        router.push('/Management?index=4');
        break;
      case NotificationType.RETURN_REQUEST_CREATED:
      case NotificationType.RETURN_STATUS_UPDATED:
      case NotificationType.RETURN_APPROVED:
      case NotificationType.RETURN_REJECTED:
      case NotificationType.RETURN_SHIPPED:
      case NotificationType.RETURN_RECEIVED:
      case NotificationType.REFUND_PROCESSED:
      case NotificationType.RETURN_COMPLETED:
        dispatch(setActiveIndex(14));
        router.push('/Management?index=14');
        break;
      case NotificationType.PAYMENT_CONFIRMATION:
      case NotificationType.PAYMENT_RECEIVED:
      case NotificationType.PAYMENT_FAILED:
        dispatch(setActiveIndex(4)); // Orders page
        router.push('/Management?index=4');
        break;
      case NotificationType.SUPPORT:
        router.push('/Support');
        break;
      case NotificationType.PROMOTIONAL:
      case NotificationType.SOCIAL:
        if (notification.link) {
          router.push(notification.link);
        }
        break;
      case NotificationType.ACCOUNT_VERIFIED:
      case NotificationType.PASSWORD_CHANGED:
        dispatch(setActiveIndex(10)); // Profile page
        router.push('/Management?index=10');
        break;
      case NotificationType.SYSTEM_ALERT:
        // Handle system alerts - could show a modal or redirect to system status page
        console.log('System alert:', notification.message);
        break;
      default:
        if (notification.link) {
          router.push(notification.link);
        }
        break;
    }
   // setIsBellPopupOpen(false);
  };
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <NotificationList
        notifications={notifications}
        loading={loading}
        error={error?.message}
        onNotificationClick={(notification) => {
          handleNotificationClick(notification);
        }}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDelete={handleDelete}
        onRefresh={() => refetch()}
        showFilters={true}
        showActions={true}
        emptyMessage="No notifications found"
      />
    </div>
  );
}
