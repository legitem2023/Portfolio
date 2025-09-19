// components/EngagementModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import UserAvatar from './UserAvatar';
import CommentInput from './CommentInput';
import { CommentList } from './CommentList';
import { CommentSystem } from './CommentSystem';
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
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [useCurrentUser,setCurrentUser] = useState(
    {
    id: '',
    firstName: '',
    lastName: '',
    avatar: '',
  };
  )
  useEffect(() => {
    if (isOpen && type === 'comments' && commentInputRef.current) {
      // Small timeout to ensure the modal is fully rendered before focusing
      setTimeout(() => {
        commentInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, type]);

  // Handle keyboard visibility on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        // Check if viewport height changed significantly (indicating keyboard)
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const keyboardThreshold = 300; // Keyboard is usually at least 300px tall
        
        setKeyboardVisible(windowHeight - viewportHeight > keyboardThreshold);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  // Scroll to bottom when keyboard appears
  useEffect(() => {
    if (keyboardVisible && modalContentRef.current) {
      setTimeout(() => {
        if (modalContentRef.current) {
          modalContentRef.current.scrollTop = modalContentRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [keyboardVisible]);

  useEffect(() => {
    const getRole = async () => {
      try {
        const response = await fetch('/api/protected', {
          credentials: 'include' // Important: includes cookies
        });
        
        if (response.status === 401) {
          // Handle unauthorized access
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
            avatar: payload.image,  
        })
        console.log(payload);
      } catch (err) {
        console.error('Error getting role:', err);
      }
    };
    getRole();
  }, []);




  
  const renderContent = () => {
    switch (type) {
      case 'likes':
        return (
          <div className="p-4 pb-20"> {/* Added padding at bottom for fixed input */}
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
          <>  
            <CommentSystem 
              postId={userId} 
              currentUser={useCurrentUser} 
            />
            {/* <CommentList postId={userId}/>
            <div className={`sticky-comment-input ${keyboardVisible ? 'keyboard-visible' : ''}`}>
              <CommentInput
                ref={commentInputRef}
                userAvatar={userAvatar}
                userName={userName}
                onSubmit={onSubmit}
                placeholder={placeholder}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
              />
            </div>*/}
          </>
        );
      
      case 'shares':
        return (
          <div className="p-4 pb-20"> {/* Added padding at bottom for fixed input */}
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
      className={`engagement-modal ${isOpen ? 'open' : ''} ${keyboardVisible ? 'keyboard-open' : ''}`}
    >
      <div 
        className="modal-overlay"
        onClick={onClose}
      ></div>
      <div 
        className="modal-content"
        ref={modalContentRef}
      >
        <div className="modal-drag-handle">
          <div className="drag-indicator"></div>
        </div>
        <div className="modal-body">
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
          max-height: 85vh;
          display: flex;
          flex-direction: column;
        }
        
        .engagement-modal.open .modal-content {
          transform: translateY(0);
        }
        
        .engagement-modal.keyboard-open .modal-content {
          max-height: 100vh;
          border-radius: 0;
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
        }
        
        .sticky-comment-input {
          position: sticky;
          bottom: 0;
          background: white;
          border-top: 1px solid #e5e7eb;
          padding: 0.75rem;
          z-index: 10;
          transition: transform 0.3s;
        }
        
        /* Adjust for mobile keyboards */
        @media (max-width: 768px) {
          .engagement-modal.keyboard-open .modal-content {
            height: 100vh;
          }
          
          .engagement-modal.keyboard-open .sticky-comment-input {
            padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0));
          }
        }
      `}</style>
    </div>
  );
};

export default EngagementModal;
