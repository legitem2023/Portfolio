// components/ActionButtons.tsx
import React from 'react';

interface ActionButtonsProps {
  isLiked: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  className?: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  isLiked,
  onLike,
  onComment,
  onShare,
  className = ''
}) => {
  return (
    <div className={`flex justify-between border-t border-b border-gray-200 py-2 ${className}`}>
      <button 
        className={`flex items-center justify-center flex-1 py-1 ${isLiked ? 'text-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
        onClick={onLike}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        {isLiked ? 'Liked' : 'Like'}
      </button>
      <button 
        className="flex items-center justify-center flex-1 text-gray-500 hover:text-gray-700 py-1"
        onClick={onComment}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Comment
      </button>
      <button 
        className="flex items-center justify-center flex-1 text-gray-500 hover:text-gray-700 py-1"
        onClick={onShare}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share
      </button>
    </div>
  );
};

export default ActionButtons;
