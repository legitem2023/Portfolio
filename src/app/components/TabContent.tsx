// components/TabContent.tsx
import { User, Post } from '../../../types';
import AddressesTab from './AddressesTab';
import DeluxeMessageCard from '../components/Posting/DeluxeMessageCard';
import WishlistDisplay from './WishlistDisplay';
import { ApolloQueryResult, OperationVariables } from "@apollo/client";

interface TabContentProps {
  activeTab: string;
  user: User;
  userId: string;
  refetch: (variables?: Partial<OperationVariables>) => Promise<ApolloQueryResult<any>>;
}

const TabContent = ({ activeTab, user, userId, refetch }: TabContentProps) => {
  // Add safety checks
  if (!user) {
    return <div>No user data available</div>;
  }

  const formatUserName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.name || 'Unknown User';
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const renderPostsTab = () => {
    // Check if posts exist
    if (!user.posts || user.posts.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No posts available
        </div>
      );
    }

    return (
      <div>
        {user.posts.map((post: Post, index: number) => (
          <DeluxeMessageCard 
            key={post.id} 
            message={{
              id: post.id,
              sender: formatUserName(post.user),
              avatar: post.user.avatar,
              timestamp: formatDate(post.createdAt),
              content: post.content,
              likes: post.likeCount,
              comments: post.commentCount,
              shares: 0,
              background: post.background,
              images: post.images,
              isLikedByMe: post.isLikedByMe,
              privacy: post.privacy,
              taggedUsers: post.taggedUsers,
              user: post.user,
              isOwnMessage: post.user.id === userId
            }} 
            className="mb-2"
          />
        ))}     
      </div>
    );
  };
  console.log("data=>",user?.wishlist);
  const renderAddressTab = () => {
    return (
      <AddressesTab
        addresses={user?.addresses || []}
        userId={userId}
        onAddressUpdate={async () => await refetch()}
      />
    );
  };
 const renderWishlistTab = () => {
   return (
     <WishlistDisplay wishlistItems={user?.wishlist} />
   )
 }
  // Add default case for unknown tabs
  switch (activeTab) {
    case 'posts':
      return renderPostsTab();
    case 'address':
      return renderAddressTab();
    case 'wishlist':
      return renderWishlistTab();
    default:
      return (
        <div className="text-center py-8">
          Tab content not available
        </div>
      );
  }
};

export default TabContent;
