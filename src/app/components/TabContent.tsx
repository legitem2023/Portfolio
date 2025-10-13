// components/TabContent.tsx
import { ReactNode } from 'react';
import Image from 'next/image';
import { User, Post } from '../../../types';
import AddressesTab, { Address } from './AddressesTab';
import DeluxeMessageCard from '../components/Posting/DeluxeMessageCard';
import DeluxeMessageCardLoading from './DeluxeMessageCardLoading';

import { ApolloQueryResult, OperationVariables } from "@apollo/client";

interface TabContentProps {
  activeTab: string;
  user: User;
  userId: string;
  refetch: (variables?: Partial<OperationVariables>) => Promise<ApolloQueryResult<any>>;
}

const TabContent = ({ activeTab, user, userId, refetch }: TabContentProps) => {
 // Format user name for display
  const formatUserName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.name || 'Unknown User';
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

  const renderPhotosTab = () => (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="text-center py-12 text-gray-500">
        <svg className="w-16 h-16 mx-auto text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
        <p className="mt-4 text-lg">Photos content coming soon</p>
      </div>
    </div>
  );

  const renderFriendsTab = () => (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="text-center py-12 text-gray-500">
        <svg className="w-16 h-16 mx-auto text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
        </svg>
        <p className="mt-4 text-lg">Friends content coming soon</p>
      </div>
    </div>
  );

  const handleAddressUpdate = async () => {
    // Refetch user data to get updated addresses
    await refetch();
  };
  
  const renderAddressTab = () => (
    <AddressesTab
      addresses={user.addresses}
      userId={userId}
      onAddressUpdate={handleAddressUpdate}
    />
  );

  switch (activeTab) {
    case 'posts':
      return renderPostsTab();
    case 'photos':
      return renderPhotosTab();
    case 'friends':
      return renderFriendsTab();
    case 'address':
      return renderAddressTab();
    default:
      return renderAddressTab();
  }
};

export default TabContent;
