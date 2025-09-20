// components/EngagementModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import UserAvatar from './UserAvatar';
import { CommentSystem } from './CommentSystem';
import { decryptToken } from '../../../../utils/decryptToken';

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
  userId:string;
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
  userId,
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
  const commentInputRef = useRef<HTMLInputElement>(null);
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const [useCurrentUser, setCurrentUser] = useState({id: '',firstName: '',lastName: '',avatar: ''})
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    if (isOpen && type === 'comments' && commentInputRef.current) {
      setTimeout(() => {
        commentInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, type]);

  // Handle scroll to bottom when input is focused
  useEffect(() => {
    if (isInputFocused && modalBodyRef.current) {
      setTimeout(() => {
        if (modalBodyRef.current) {
          modalBodyRef.current.scrollTo({
            top: modalBodyRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 300);
    }
  }, [isInputFocused]);

  useEffect(() => {
    const getRole = async () => {
      try {
        const response = await fetch('/api/protected', {
          credentials: 'include'
        });
        
        if (response.status === 401) {
          throw new Error('Unauthorized');
        }
        
        const data = await response.json();
        const token = data?.user;
        const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz";

        const payload = await decryptToken(token, secret.toString());
        setCurrentUser({
            id: payload.userId,
            firstName: payload.name,
            lastName: '',
            avatar: payload.image 
        });
      } catch (err) {
        console.error('Error getting role:', err);
      }
    };
    
    if (isOpen) {
      getRole();
    }
  }, [isOpen]);

  const renderContent = () => {
    switch (type) {
      case 'likes':
        return (
          <div className="p-4 pb-20">
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
          <CommentSystem 
            postId={userId} 
            currentUser={useCurrentUser} 
            isOpen={isOpen && type === 'comments'}
            onInputFocusChange={setIsInputFocused}
            inputRef={commentInputRef}
          />
        );
      
      case 'shares':
        return (
          <div className="p-4 pb-20">
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
    <div className={`engagement-modal ${isOpen ? 'open' : ''}`}>
      <div 
        className="modal-overlay"
        onClick={onClose}
      ></div>
      <div className="modal-content">
        <div className="modal-drag-handle">
          <div className="drag-indicator"></div>
        </div>
        <div 
          className="modal-body"
          ref={modalBodyRef}
        >
          {renderContent()}
        </div>
      </div>
      
      <style jsx>{`
        .engagement-modal {
          position: fixed;
          inset: 0;
          z-index: 50;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s;
        }
        
        .engagement-modal.open {
          opacity: 1;
          pointer-events: auto;
        }
        
        .modal-overlay {
          position: absolute;
          inset: 0;
          background: black;
          opacity: 0.5;
        }
        
        .modal-content {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          border-radius: 1rem 1rem 0 0;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
          transform: translateY(100%);
          transition: transform 0.3s;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
        }
        
        .engagement-modal.open .modal-content {
          transform: translateY(0);
        }
        
        .modal-drag-handle {
          position: sticky;
          top: 0;
          background: white;
          display: flex;
          justify-content: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid #e5e7eb;
          z-index: 10;
          border-radius: 1rem 1rem 0 0;
        }
        
        .drag-indicator {
          width: 2.5rem;
          height: 0.25rem;
          background: #d1d5db;
          border-radius: 0.25rem;
        }
        
        .modal-body {
          flex: 1;
          overflow-y: auto;
          position: relative;
          -webkit-overflow-scrolling: touch;
        }

        @media (max-width: 768px) {
          .engagement-modal.open .modal-content {
            max-height: 85vh;
          }
        }
      `}</style>
    </div>
  );
};

export default EngagementModal;
