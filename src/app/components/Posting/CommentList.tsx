import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_COMMENTS } from '../graphql/query';

// Define TypeScript interfaces
interface User {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: User;
  likeCount: number;
  isLikedByMe: boolean;
}

interface CommentsData {
  comments: {
    comments: Comment[];
    totalCount: number;
    hasNextPage: boolean;
  };
}

interface CommentsVars {
  postId: string;
  page?: number;
  limit?: number;
}

interface CommentListProps {
  postId: string;
}

const DEFAULT_PAGE_SIZE = 10;

export const CommentList: React.FC<CommentListProps> = ({ postId }) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data, loading, error, fetchMore } = useQuery<CommentsData, CommentsVars>(
    GET_COMMENTS,
    {
      variables: {
        postId,
        page: 1,
        limit: DEFAULT_PAGE_SIZE
      },
      notifyOnNetworkStatusChange: true,
    }
  );

  const loadMore = () => {
    fetchMore({
      variables: {
        page: currentPage + 1,
        limit: DEFAULT_PAGE_SIZE,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        
        return {
          comments: {
            ...fetchMoreResult.comments,
            comments: [
              ...prev.comments.comments,
              ...fetchMoreResult.comments.comments,
            ],
          },
        };
      },
    });
    setCurrentPage(prev => prev + 1);
  };

if (error) return <div className="error-message">Error loading comments: {error.message}</div>;
    
  const comments = data?.comments.comments || [];
  const hasNextPage = data?.comments.hasNextPage || false;
  const totalCount = data?.comments.totalCount || 0;

  return (
    <div className="comment-section h-[80%]">
      <h3>Comments ({totalCount})</h3>
      
      {comments.map(comment => (
        <div key={comment.id} className="comment">
          <div className="comment-header">
            <img 
              src={comment.user.avatar} 
              alt={`${comment.user.firstName} ${comment.user.lastName}`}
              className="avatar"
            />
            <div className="user-info">
              <span>{comment.user.firstName} {comment.user.lastName}</span>
              <span className="comment-date">
                {new Date(comment.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
          
          <p className="comment-content">{comment.content}</p>
          
          <div className="comment-actions">
            <button className="like-button">
              {comment.isLikedByMe ? '❤️' : '🤍'} {comment.likeCount}
            </button>
          </div>
        </div>
      ))}

      {loading && <div>Loading comments...</div>}
      
      {hasNextPage && (
        <button 
          onClick={loadMore}
          disabled={loading}
          className="load-more-btn"
        >
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
};
