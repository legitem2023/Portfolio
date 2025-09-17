// components/CommentInput.tsx
import React, { useState } from 'react';
import UserAvatar from './UserAvatar';

interface CommentInputProps {
  userAvatar?: string;
  userName: string;
  placeholder?: string;
  onSubmit: (comment: string) => void;
  className?: string;
}

const CommentInput: React.FC<CommentInputProps> = ({
  userAvatar,
  userName,
  placeholder = "Write a comment...",
  onSubmit,
  className = ''
}) => {
  const [comment, setComment] = useState('');

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
          type="text" 
          placeholder={placeholder}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>
    </form>
  );
};

export default CommentInput;
