// components/EngagementMetrics.tsx
import React from 'react';

interface EngagementMetricsProps {
  likes: number;
  comments: number;
  shares: number;
  onLikesClick: () => void;
  onCommentsClick: () => void;
  onSharesClick: () => void;
  className?: string;
}

const EngagementMetrics: React.FC<EngagementMetricsProps> = ({
  likes,
  comments,
  shares,
  onLikesClick,
  onCommentsClick,
  onSharesClick,
  className = ''
}) => {
  return (
    <div className={`flex justify-between text-sm text-gray-500 ${className}`}>
      <div 
        className="flex items-center cursor-pointer hover:text-gray-700"
        onClick={onLikesClick}
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
          onClick={onCommentsClick}
        >
          {comments} comments
        </span>
        {' • '}
        <span 
          className="cursor-pointer hover:text-gray-700"
          onClick={onSharesClick}
        >
          {shares} shares
        </span>
      </div>
    </div>
  );
};

export default EngagementMetrics;
