import { NotificationList } from './NotificationList';
import { useQuery, useMutation } from '@apollo/client';
import { GET_NOTIFICATIONS } from '../../components/graphql/query';
import { 
  MARK_AS_READ,
  MARK_ALL_AS_READ,
  DELETE_NOTIFICATION
} from '../../components/graphql/mutation';

export default function NotificationPage({ UserId }: { UserId: string }) {
  const { data, loading, error, refetch } = useQuery(GET_NOTIFICATIONS, {
    variables: { userId: UserId, filters: { limit: 100 } }
  });
  
  const [markAsRead] = useMutation(MARK_AS_READ);
  const [markAllAsRead] = useMutation(MARK_ALL_AS_READ);
  const [deleteNotification] = useMutation(DELETE_NOTIFICATION);
  
  const notifications = data?.notifications?.edges?.map((edge: any) => edge.node) || [];
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <NotificationList
        notifications={notifications}
        loading={loading}
        error={error?.message}
        onNotificationClick={(notification) => {
          // Handle click
          //router.push(notification.link || '/');
        }}
        onMarkAsRead={(id) => markAsRead({ variables: { id } })}
        onMarkAllAsRead={() => markAllAsRead({ variables: { userId: 'user-id' } })}
        onDelete={(id) => deleteNotification({ variables: { id } })}
        onRefresh={() => refetch()}
        showFilters={true}
        showActions={true}
        emptyMessage="No notifications found"
      />
    </div>
  );
}
