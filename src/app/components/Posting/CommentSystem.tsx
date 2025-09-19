import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_COMMENTS } from '../graphql/query';
import { CREATE_COMMENT } from '../graphql/mutation';

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
  currentUser: User;
  onClose: () => void;
}

const DEFAULT_PAGE_SIZE = 10;

export const CommentSystem: React.FC<CommentListProps> = ({ postId, currentUser, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const [commentText, setCommentText] = useState('');
  
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

  const [createComment, { loading: creatingComment }] = useMutation(CREATE_COMMENT, {
    update(cache, { data: { createComment } }) {
      // Read the existing comments from the cache
      const existingComments = cache.readQuery<CommentsData>({
        query: GET_COMMENTS,
        variables: { postId, page: 1, limit: DEFAULT_PAGE_SIZE }
      });

      // Write back to the cache with the new comment added to the beginning
      if (existingComments && createComment) {
        cache.writeQuery({
          query: GET_COMMENTS,
          variables: { postId, page: 1, limit: DEFAULT_PAGE_SIZE },
          data: {
            comments: {
              ...existingComments.comments,
              comments: [createComment, ...existingComments.comments.comments],
              totalCount: existingComments.comments.totalCount + 1
            }
          }
        });
      }
    }
  });

  // Auto-scroll to bottom when new comment is added
  useEffect(() => {
    if (commentsContainerRef.current) {
      commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
    }
  }, [data?.comments.comments]);

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

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    try {
      await createComment({
        variables: {
          input: {
            postId,
            content: commentText,
            userId: currentUser.id
          }
        }
      });
      setCommentText('');
      
      // Reset textarea height
      if (commentInputRef.current) {
        commentInputRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error("Failed to create comment:", err);
    }
  };

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 my-4">
      <p className="font-medium">Error loading comments</p>
      <p className="text-sm">{error.message}</p>
    </div>
  );
    
  const comments = data?.comments.comments || [];
  const hasNextPage = data?.comments.hasNextPage || false;
  const totalCount = data?.comments.totalCount || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">Comments</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Comments List */}
        <div 
          ref={commentsContainerRef}
          className="flex-1 overflow-y-auto p-4"
        >
          <div className="space-y-4">
            {comments.map(comment => (
              <div key={comment.id} className="flex gap-3">
                <img 
                  src={comment.user.avatar || '/NoImage.webp'} 
                  alt={`${comment.user.firstName} ${comment.user.lastName}`}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                
                <div className="flex-1 min-w-0 bg-gray-100 rounded-2xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {comment.user.firstName} {comment.user.lastName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-2">{comment.content}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <button className={`flex items-center gap-1 ${comment.isLikedByMe ? 'text-blue-600' : ''}`}>
                      Like
                    </button>
                    <button className="flex items-center gap-1">
                      Reply
                    </button>
                    <span>{comment.likeCount} likes</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {hasNextPage && (
            <div className="mt-6 flex justify-center">
              <button 
                onClick={loadMore}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    Loading...
                  </>
                ) : (
                  'Load More Comments'
                )}
              </button>
            </div>
          )}

          {comments.length === 0 && !loading && (
            <div className="text-center py-10 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
        
        {/* Comment Input - Fixed at bottom */}
        <div className="border-t border-gray-200 bg-white p-4">
          <form onSubmit={handleSubmitComment} className="flex gap-3">
            <img 
              src={currentUser.avatar || '/NoImage.webp'} 
              alt={`${currentUser.firstName} ${currentUser.lastName}`}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            
            <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 flex items-center">
              <textarea
                ref={commentInputRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-transparent border-none outline-none py-1 text-gray-700 resize-none"
                disabled={creatingComment}
                rows={1}
                style={{ maxHeight: '100px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 100)}px`;
                }}
              />
              <button 
                type="submit"
                disabled={creatingComment || !commentText.trim()}
                className="text-blue-500 font-semibold px-3 py-1 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-2"
              >
                {creatingComment ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
