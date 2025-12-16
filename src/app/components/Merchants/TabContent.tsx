// components/TabContent.tsx
import { ReactNode } from 'react';
import Image from 'next/image';
import { User, Post , Product } from '../../../../types';
import ProductThumbnails from '../ProductThumbnails';
import DeluxeMessageCard from '../Posting/DeluxeMessageCard';
import DeluxeMessageCardLoading from '../DeluxeMessageCardLoading';

import { ApolloQueryResult, OperationVariables } from "@apollo/client";

interface TabContentProps {
  activeTab: string;
  user: User;
  userId: string;
  refetch: (variables?: Partial<OperationVariables>) => Promise<ApolloQueryResult<any>>;
}

const TabContent = ({ activeTab, user, userId, refetch }: TabContentProps) => {
 console.log(user?.products,"tab ui"); 
 // Format user name for display
  const formatUserName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.firstName || 'Unknown User';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  
  const renderPostsTab = () => (
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
              shares: 0, // You might need to add this field to your schema
              // New post-specific fields
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

  const handleAddressUpdate = async () => {
    // Refetch user data to get updated addresses
    await refetch();
  };
  
  const renderProductTab = () => (
      <div className="max-w-4xl mx-auto p-4">
        {/*   <ProductThumbnails products={user?.products} />*/}
       </div>
      );

  switch (activeTab) {
    case 'posts':
      return renderPostsTab();
    case 'product':
      return renderProductTab();
    default:
      return renderProductTab();
  }
};

export default TabContent;
