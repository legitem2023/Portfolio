// components/DeluxeMessageCard.tsx
import React, { useState } from 'react';
import Image from 'next/image';

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
}

interface DeluxeMessageCardProps {
  message: Message;
  className?: string;
}

const DeluxeMessageCard: React.FC<DeluxeMessageCardProps> = ({ 
  message, 
  className = '' 
}) => {
  const [avatarError, setAvatarError] = useState(false);
  const [postImageError, setPostImageError] = useState(false);
  const [commentAvatarError, setCommentAvatarError] = useState(false);

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
    postImage
  } = message;

  const FALLBACK_IMAGE = 'https://new-client-legitem.vercel.app/Thumbnail.png';

  return (
    <div className={`max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden mb-6 ${className}`}>
      {/* Card Header */}
      <div className="flex items-center p-4 border-b border-gray-200">
        <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden mr-3 relative">
          {avatar && !avatarError ? (
            <Image
              src={avatar}
              alt={sender}
              fill
              className="object-cover"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">
              {sender.charAt(0)}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">{sender}</h3>
          <p className="text-xs text-gray-500">{timestamp}</p>
        </div>
        
        <button className="text-gray-500 hover:text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
        </button>
      </div>
      
      {/* Message Content */}
      <div className="p-4">
        <p className="text-gray-800 mb-3">{content}</p>
        
        {/* Post Image (if any) */}
        {postImage && (
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
        
        {/* Engagement Metrics */}
        <div className="flex justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center">
            <div className="flex -space-x-1 mr-1">
              <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-white"></div>
              <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white"></div>
              <div className="w-5 h-5 rounded-full bg-yellow-500 border-2 border-white"></div>
            </div>
            <span>{likes} likes</span>
          </div>
          <div>
            <span>{comments} comments • {shares} shares</span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-between border-t border-b border-gray-200 py-2">
          <button className="flex items-center justify-center flex-1 text-gray-500 hover:text-gray-700 py-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Like
          </button>
          <button className="flex items-center justify-center flex-1 text-gray-500 hover:text-gray-700 py-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Comment
          </button>
          <button className="flex items-center justify-center flex-1 text-gray-500 hover:text-gray-700 py-1">
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
                {sender.charAt(0)}
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
  );
};

export default DeluxeMessageCard;
