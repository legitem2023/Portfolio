import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_COMMENTS } from '../graphql/query';


interface CommentListProps {
  postId: string;
}

const DEFAULT_PAGE_SIZE = 10;

export const CommentList: React.FC<CommentListProps> = ({ postId }) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data, loading, error, fetchMore } = useQuery(GET_COMMENTS, {
    variables: {
      postId,
      page: 1,
      limit: DEFAULT_PAGE_SIZE
    },
    notifyOnNetworkStatusChange: true,
  });

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

  if (error) return <div>Error loading comments</div>;
  
  const comments = data?.comments.comments || [];
  const hasNextPage = data?.comments.hasNextPage || false;

  return (
    <div className="comment-section">
      <h3>Comments ({data?.comments.totalCount || 0})</h3>
      
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
