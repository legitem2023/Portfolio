// components/DeluxeMessageCard.tsx
import React, { useState } from 'react';
import Image from 'next/image';

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
  const [avatarError, setAvatarError] = useState(false);
  const [postImageError, setPostImageError] = useState(false);
  const [commentAvatarError, setCommentAvatarError] = useState(false);
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
    // New fields
    background,
    images = [],
    isLikedByMe = false,
    privacy,
    taggedUsers = [],
    user
  } = message;

  const FALLBACK_IMAGE = 'https://new-client-legitem.vercel.app/Thumbnail.png';

  const openModal = (type: ModalType) => {
    setModalType(type);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setTimeout(() => setModalType(null), 300);
  };

  // Format date to readable format
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

  const renderModalContent = () => {
    switch (modalType) {
      case 'likes':
        return (
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-4">Likes</h3>
            <div className="space-y-3">
              {likesList.length > 0 ? (
                likesList.map(like => (
                  <div key={like.id} className="flex items-center">
                    <div className="w-10 h-10 rounded-full overflow-hidden mr-3 relative">
                      {like.user.avatar ? (
                        <Image
                          src={like.user.avatar}
                          alt={like.user.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">
                          {like.user.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{like.user.name}</p>
                      <p className="text-xs text-gray-500">{like.timestamp}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No likes yet</p>
              )}
            </div>
          </div>
        );
      
      case 'comments':
        return (
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-4">Comments</h3>
            <div className="space-y-4">
              {commentsList.length > 0 ? (
                commentsList.map(comment => (
                  <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-full overflow-hidden mr-3 relative flex-shrink-0">
                        {comment.user.avatar ? (
                          <Image
                            src={comment.user.avatar || '/NoImage.webp'}
                            alt={comment.user.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                            {comment.user.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="font-medium">{comment.user.name}</p>
                          <p className="text-xs text-gray-500">{comment.timestamp}</p>
                        </div>
                        <p className="text-gray-800 mt-1">{comment.content}</p>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <button className="mr-3 hover:text-blue-500">Like ({comment.likes})</button>
                          <button className="hover:text-blue-500">Reply</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No comments yet</p>
              )}
            </div>
          </div>
        );
      
      case 'shares':
        return (
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-4">Shares</h3>
            <div className="space-y-3">
              {sharesList.length > 0 ? (
                sharesList.map(share => (
                  <div key={share.id} className="flex items-center">
                    <div className="w-10 h-10 rounded-full overflow-hidden mr-3 relative">
                      {share.user.avatar ? (
                        <Image
                          src={share.user.avatar || '/NoImage.webp'}
                          alt={share.user.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white font-bold">
                          {share.user.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{share.user.name}</p>
                      <p className="text-xs text-gray-500">{share.timestamp}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No shares yet</p>
              )}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      <div className={`max-w-2xl mx-auto bg-white shadow-lg overflow-hidden mb-0 ${className}`}>
        {/* Card Header */}
        <div className="flex items-center p-4 border-b border-gray-200">
          <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden mr-3 relative">
            {(avatar) && !avatarError ? (
              <Image
                src={avatar || '/NoImage.webp'}
                alt={sender || 'User'}
                fill
                className="object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">
                {(sender || user?.name || 'U').charAt(0)}
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">{sender || user?.name || 'Unknown User'}</h3>
            <p className="text-xs text-gray-500">{formatDate(timestamp)}</p>
          </div>
          
          <button className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </button>
        </div>
        
        {/* Message Content with optional background gradient */}
        <div 
          className="p-0"
        >    
          <div className="mb-3 p-2" style={background ? { background: background, color: 'white' } : {}}>{content}</div>
          {/* Post Images (if any) */}
          {images && images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
              {images.map((img, index) => (
                <div key={index} className="relative h-64 w-full rounded-lg overflow-hidden">
                  <Image
                    src={img}
                    alt={`Post image ${index + 1}`}
                    fill
                    className="object-cover"
                    onError={() => setPostImageError(true)}
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Single Post Image (if any) for backward compatibility */}
          {postImage && !images?.length && (
            <div className="relative h-80 md:h-96 w-full mb-3 rounded-lg overflow-hidden">
              <Image
                src={postImageError ? FALLBACK_IMAGE : postImage}
                alt="Post image"
                fill
                className="object-cover"
                onError={() => setPostImageError(true)}
              />
            </div>
          )}
          
          {/* Tagged Users */}
          {taggedUsers && taggedUsers.length > 0 && (
            <div className="mb-3 text-sm">
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
            <div className="m-3 text-sm text-gray-500 flex items-center">
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
          <div className="flex justify-between text-sm text-gray-500 m-3">
            <div 
              className="flex items-center cursor-pointer hover:text-gray-700"
              onClick={() => openModal('likes')}
            >
              <div className="flex -space-x-1 mr-1">
                <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-white"></div>
                <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white"></div>
                <div className="w-5 h-5 rounded-full bg-yellow-500 border-2 border-white"></div>
              </div>
              <span>{likes} likes</span>
            </div>
            <div>
              <span 
                className="cursor-pointer hover:text-gray-700"
                onClick={() => openModal('comments')}
              >
                {comments} comments
              </span>
              {' • '}
              <span 
                className="cursor-pointer hover:text-gray-700"
                onClick={() => openModal('shares')}
              >
                {shares} shares
              </span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-between border-t border-b border-gray-200 py-2">
            <button className={`flex items-center justify-center flex-1 py-1 ${isLikedByMe ? 'text-blue-500' : 'text-gray-500 hover:text-gray-700'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {isLikedByMe ? 'Liked' : 'Like'}
            </button>
            <button 
              className="flex items-center justify-center flex-1 text-gray-500 hover:text-gray-700 py-1"
              onClick={() => openModal('comments')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Comment
            </button>
            <button 
              className="flex items-center justify-center flex-1 text-gray-500 hover:text-gray-700 py-1"
              onClick={() => openModal('shares')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          </div>
          
          {/* Comment Input */}
          <div className="flex items-center mt-3">
            <div className="flex-shrink-0 h-8 w-8 rounded-full overflow-hidden mr-2 relative">
              {avatar && !commentAvatarError ? (
                <Image
                  src={avatar}
                  alt={sender}
                  fill
                  className="object-cover"
                  onError={() => setCommentAvatarError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                  {(sender || 'U').charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 bg-gray-100 rounded-full py-2 px-4">
              <input 
                type="text" 
                placeholder="Write a comment..." 
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>
        </div>
        
        {/* Message Status for own messages */}
        {isOwnMessage && (
          <div className="px-4 py-2 bg-gray-50 text-right text-xs text-gray-500">
            {status === 'read' ? 'Seen' : status === 'delivered' ? 'Delivered' : 'Sent'}
          </div>
        )}
      </div>

      {/* Sliding Modal */}
      {modalType && (
        <div 
          className={`fixed inset-0 z-50 transition-opacity duration-300 ${modalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={closeModal}
          ></div>
          <div 
            className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg transform transition-transform duration-300 ${modalOpen ? 'translate-y-0' : 'translate-y-full'}`}
            style={{ maxHeight: '80vh' }}
          >
            <div className="sticky top-0 bg-white flex justify-center py-3 rounded-t-2xl border-b border-gray-200">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 50px)' }}>
              {renderModalContent()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeluxeMessageCard;
