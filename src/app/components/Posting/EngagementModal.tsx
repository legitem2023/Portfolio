// components/EngagementModal.tsx
import React from 'react';
import UserAvatar from './UserAvatar';
import CommentInput from './CommentInput';

interface Like {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: string;
}

interface Comment {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  likes: number;
}

interface Share {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: string;
}

interface EngagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'likes' | 'comments' | 'shares' | null;
  likes?: Like[];
  comments?: Comment[];
  shares?: Share[];
  
  userAvatar?: string;
  userName: string;
  placeholder?: string;
  onSubmit: (comment: string) => void;
}

const EngagementModal: React.FC<EngagementModalProps> = ({
  isOpen,
  onClose,
  type,
  likes = [],
  comments = [],
  shares = [],
  userAvatar,
  userName,
  placeholder,
  onSubmit

}) => {
  const renderContent = () => {
    switch (type) {
      case 'likes':
        return (
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-4">Likes</h3>
            <div className="space-y-3">
              {likes.length > 0 ? (
                likes.map(like => (
                  <div key={like.id} className="flex items-center">
                    <UserAvatar src={like.user.avatar} alt={like.user.name} size="sm" className="mr-3" />
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
            <div className="space-y-4 h-[100%] bg-indigo-200">
              {comments.length > 0 ? (
                comments.map(comment => (
                  <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-start">
                      <UserAvatar src={comment.user.avatar} alt={comment.user.name} size="sm" className="mr-3 flex-shrink-0" />
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
            <CommentInput
            userAvatar={userAvatar}
            userName={userName}
            onSubmit={onSubmit}
            className="m-3"
          />
          </div>
        );
      
      case 'shares':
        return (
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-4">Shares</h3>
            <div className="space-y-3">
              {shares.length > 0 ? (
                shares.map(share => (
                  <div key={share.id} className="flex items-center">
                    <UserAvatar src={share.user.avatar} alt={share.user.name} size="sm" className="mr-3" />
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
    <div 
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg transform transition-transform duration-300 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '80vh' }}
      >
        <div className="sticky top-0 bg-white flex justify-center py-3 rounded-t-2xl border-b border-gray-200">
          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>
        <div className="overflow-y-auto" style={{ minHeight: '75vh',maxHeight: '90vh' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default EngagementModal;
