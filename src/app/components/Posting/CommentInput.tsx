// components/CommentInput.tsx
import React, { forwardRef, useState } from 'react';
import UserAvatar from './UserAvatar';

interface CommentInputProps {
  userAvatar?: string;
  userName: string;
  onSubmit: (comment: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

const CommentInput = forwardRef<HTMLInputElement, CommentInputProps>(
  ({ userAvatar, userName, onSubmit, placeholder = "Write a comment...", onFocus, onBlur }, ref) => {
    const [comment, setComment] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (comment.trim()) {
        onSubmit(comment);
        setComment('');
      }
    };

    return (
      <form onSubmit={handleSubmit} className="comment-input-form">
        <div className="comment-input-container">
          <UserAvatar 
            src={userAvatar} 
            alt={userName}
            size="sm" 
            className="user-avatar"
          />
          <input
            ref={ref}
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={placeholder}
            className="comment-input"
            onFocus={onFocus}
            onBlur={onBlur}
          />
          <button 
            type="submit" 
            className="submit-button"
            disabled={!comment.trim()}
          >
            Post
          </button>
        </div>
        
        <style jsx>{`
          .comment-input-form {
            width: 100%;
          }
          
          .comment-input-container {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: #f9fafb;
            border-radius: 2rem;
            padding: 0.5rem;
          }
          
          .user-avatar {
            flex-shrink: 0;
          }
          
          .comment-input {
            flex: 1;
            border: none;
            background: transparent;
            padding: 0.5rem;
            outline: none;
            font-size: 0.9rem;
          }
          
          .submit-button {
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 1rem;
            padding: 0.5rem 1rem;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            flex-shrink: 0;
          }
          
          .submit-button:disabled {
            background: #9ca3af;
            cursor: not-allowed;
          }
        `}</style>
      </form>
    );
  }
);

CommentInput.displayName = 'CommentInput';

export default CommentInput;
