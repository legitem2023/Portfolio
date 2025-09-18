// components/CommentInput.tsx
import React, { useState, forwardRef, useImperativeHandle } from 'react';
import UserAvatar from './UserAvatar';

interface CommentInputProps {
  userAvatar?: string;
  userName: string;
  placeholder?: string;
  onSubmit: (comment: string) => void;
  className?: string;
}

export interface CommentInputHandle {
  focus: () => void;
}

const CommentInput = forwardRef<CommentInputHandle, CommentInputProps>(({
  userAvatar,
  userName,
  placeholder = "Write a comment...",
  onSubmit,
  className = ''
}, ref) => {
  const [comment, setComment] = useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Expose focus method via ref
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    }
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      onSubmit(comment.trim());
      setComment('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex items-center ${className}`}>
      <UserAvatar src={userAvatar} alt={userName} size="sm" className="mr-2" />
      <div className="flex-1 bg-gray-100 rounded-full py-2 px-4">
        <input 
          ref={inputRef}
          type="text" 
          placeholder={placeholder}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full bg-transparent text-sm outline-none"
          autoFocus // This will auto-focus when component mounts
        />
      </div>
      <button 
        type="submit" 
        disabled={!comment.trim()}
        className="ml-2 px-3 py-2 bg-blue-500 text-white rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Post
      </button>
    </form>
  );
});

CommentInput.displayName = 'CommentInput';

export default CommentInput;
