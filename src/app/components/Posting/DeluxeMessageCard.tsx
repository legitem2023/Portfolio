// components/DeluxeMessageCard.tsx
import React, { useState } from 'react';
import UserAvatar from './UserAvatar';
import EngagementModal from './EngagementModal';
import PostImages from './PostImages';
import EngagementMetrics from './EngagementMetrics';
import ActionButtons from './ActionButtons';
import CommentInput from './CommentInput';

// ... keep your existing interfaces ...
interface User {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  phone?: string | null;
  role?: string;
}

interface Comment {
  id: string;
  user: User;
  content: string;
  timestamp: string;
  likes: number;
}

interface Like {
  id: string;
  user: User;
  timestamp: string;
}

interface Share {
  id: string;
  user: User;
  timestamp: string;
}

interface Post {
  id: string;
  background: string | null;
  commentCount: number;
  content: string;
  createdAt: string;
  images: string[];
  isLikedByMe: boolean;
  likeCount: number;
  privacy: string;
  taggedUsers: User[];
  user: User;
}

interface Message {
  id: string;
  sender: string;
  avatar?: string;
  timestamp: string;
  content: string;
  status?: string;
  isOwnMessage?: boolean;
  likes?: number;
  comments?: number;
  shares?: number;
  postImage?: string;
  likesList?: Like[];
  commentsList?: Comment[];
  sharesList?: Share[];
  // New fields to match GraphQL response
  background?: string | null;
  images?: string[];
  isLikedByMe?: boolean;
  privacy?: string;
  taggedUsers?: User[];
  user?: User;
}

interface DeluxeMessageCardProps {
  message: Message;
  className?: string;
}

type ModalType = 'likes' | 'comments' | 'shares' | null;

const DeluxeMessageCard: React.FC<DeluxeMessageCardProps> = ({ 
  message, 
  className = '' 
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);

  const {
    sender,
    avatar,
    timestamp,
    content,
    status = 'delivered',
    isOwnMessage = false,
    likes = 0,
    comments = 0,
    shares = 0,
    postImage,
    likesList = [],
    commentsList = [],
    sharesList = [],
    background,
    images = [],
    isLikedByMe = false,
    privacy,
    taggedUsers = [],
    user
  } = message;

  const openModal = (type: ModalType) => {
    setModalType(type);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setTimeout(() => setModalType(null), 300);
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

  const handleCommentSubmit = (comment: string) => {
    // Handle comment submission
    console.log('New comment:', comment);
  };

  return (
    <>
      <div className={`max-w-2xl mx-auto bg-white shadow-lg overflow-hidden mb-0 ${className}`}>
        {/* Card Header */}
        <div className="flex items-center p-4 border-b border-gray-200">
          <UserAvatar src={avatar} alt={sender || 'User'} className="mr-3" />
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">{sender || 'Unknown User'}</h3>
            <p className="text-xs text-gray-500">{formatDate(timestamp)}</p>
          </div>
          
          <button className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </button>
        </div>
        
        {/* Message Content */}
        <div className="p-0">    
          <div className="mb-3 p-2" style={background ? { background: background, color: 'white' } : {}}>
            {content}
          </div>
          
          {/* Post Images */}
          {images && images.length > 0 && (
            <PostImages images={images} />
          )}
          
          {/* Single Post Image for backward compatibility */}
          {postImage && !images?.length && (
            <PostImages images={[postImage]} />
          )}
          
          {/* Tagged Users */}
          {taggedUsers && taggedUsers.length > 0 && (
            <div className="mb-3 text-sm mx-3">
              <span className="text-gray-500">With: </span>
              {taggedUsers.map((user, index) => (
                <span key={user.id} className="font-medium">
                  {user.name}
                  {index < taggedUsers.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          )}
          
          {/* Privacy Setting */}
          {privacy && (
            <div className="mx-3 mb-3 text-sm text-gray-500 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {privacy === 'PUBLIC' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                )}
              </svg>
              {privacy.charAt(0) + privacy.slice(1).toLowerCase()}
            </div>
          )}
          
          {/* Engagement Metrics */}
          <EngagementMetrics
            likes={likes}
            comments={comments}
            shares={shares}
            onLikesClick={() => openModal('likes')}
            onCommentsClick={() => openModal('comments')}
            onSharesClick={() => openModal('shares')}
            className="m-3"
          />
          
          {/* Action Buttons */}
          <ActionButtons
            isLiked={isLikedByMe}
            onLike={() => console.log('Like post')}
            onComment={() => openModal('comments')}
            onShare={() => openModal('shares')}
          />
          
          {/* Comment Input */}
          <CommentInput
            userAvatar={avatar}
            userName={sender || 'User'}
            onSubmit={handleCommentSubmit}
            className="m-3"
          />
        </div>
        
        {/* Message Status for own messages */}
        {isOwnMessage && (
          <div className="px-4 py-2 bg-gray-50 text-right text-xs text-gray-500">
            {status === 'read' ? 'Seen' : status === 'delivered' ? 'Delivered' : 'Sent'}
          </div>
        )}
      </div>

      {/* Engagement Modal */}
      <EngagementModal
        isOpen={modalOpen}
        onClose={closeModal}
        type={modalType}
        likes={likesList}
        comments={commentsList}
        shares={sharesList}
        userAvatar={avatar}
        userName={sender || 'User'}
        onSubmit={handleCommentSubmit}
      />
    </>
  );
};

export default DeluxeMessageCard;
