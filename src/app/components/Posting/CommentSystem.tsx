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
  isOpen: boolean;
}

const DEFAULT_PAGE_SIZE = 10;

export const CommentSystem: React.FC<CommentListProps> = ({ postId, currentUser, isOpen }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

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

  // Handle keyboard visibility
  useEffect(() => {
    const handleResize = () => {
      // Check if visualViewport API is available (mobile browsers)
      if (window.visualViewport) {
        const visualViewport = window.visualViewport;
        const windowHeight = window.innerHeight;
        const keyboardHeight = windowHeight - visualViewport.height;
        
        if (keyboardHeight > 100) {
          setIsKeyboardVisible(true);
          setKeyboardHeight(keyboardHeight);
          
          // Scroll to bottom when keyboard appears
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        } else {
          setIsKeyboardVisible(false);
          setKeyboardHeight(0);
        }
      }
    };

    // Add event listeners
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    // Initial check
    handleResize();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  // Scroll to bottom when modal opens or new comments are added
  useEffect(() => {
    if (isOpen && commentsContainerRef.current && data?.comments.comments) {
      // Only scroll if we haven't already scrolled to bottom or if new comments were added
      if (!hasScrolledToBottom || data.comments.comments.length > 0) {
        scrollToBottom();
        setHasScrolledToBottom(true);
      }
    }
  }, [isOpen, data?.comments.comments, hasScrolledToBottom]);

  // Scroll to bottom function for the comments container
  const scrollToBottom = () => {
    if (commentsContainerRef.current) {
      commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
    }
  };

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

  const handleSubmitComment = async (content: string) => {
    if (!content.trim()) return;
    
    try {
      await createComment({
        variables: {
          input: {
            postId,
            content,
            userId: currentUser.id
          }
        }
      });
      
      // Clear input after submission
      if (commentInputRef.current) {
        commentInputRef.current.value = '';
      }
      
      // Scroll to bottom after submitting a comment
      setTimeout(() => {
        scrollToBottom();
      }, 100);
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
    <div 
      ref={commentsContainerRef}
      className="flex overflow-y-auto flex-col h-[90vh] bg-white rounded-xl shadow-sm border border-gray-200 max-w-2xl mx-auto">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800">Comments ({totalCount})</h3>
      </div>
      
      {/* Comments List with fixed height and scrolling */}
      <div 
        
        className="flex-1 p-4 space-y-4">
        {comments.length === 0 && !loading && (
          <div className="text-center py-10 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        )}
        
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-3">
            <img 
              src={comment.user.avatar || '/NoImage.webp'} 
              alt={`${comment.user.firstName} ${comment.user.lastName}`}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1"
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
              
              <div className="flex items-center">
                <button className={`flex items-center gap-1 text-sm ${comment.isLikedByMe ? 'text-rose-500' : 'text-gray-500'} hover:text-rose-600 transition-colors`}>
                  {comment.isLikedByMe ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                  <span>{comment.likeCount}</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {hasNextPage && !loading && (
          <div className="flex justify-center pt-2">
            <button 
              onClick={loadMore}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              Load More Comments
            </button>
          </div>
        )}
      </div>

      {/* Comment Input - Always visible above keyboard */}
      <div 
        ref={inputContainerRef}
        className="p-4 border-t border-gray-200 bg-white"
        style={{
          position: isKeyboardVisible ? 'fixed' : 'static',
          bottom: isKeyboardVisible ? '0' : 'auto',
          left: isKeyboardVisible ? '0' : 'auto',
          right: isKeyboardVisible ? '0' : 'auto',
          zIndex: isKeyboardVisible ? 1000 : 'auto',
          paddingBottom: isKeyboardVisible ? `calc(1rem + env(safe-area-inset-bottom))` : '1rem'
        }}
      >
        <div className="flex gap-3 max-w-2xl mx-auto">
          
          
          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (commentInputRef.current) {
                  handleSubmitComment(commentInputRef.current.value);
                }
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={commentInputRef}
                type="text"
                placeholder="Write a comment..."
                className="flex-1 bg-transparent border-none outline-none py-2 text-gray-700"
                disabled={creatingComment}
              />
              <button 
                type="submit"
                disabled={creatingComment}
                className="text-blue-500 font-semibold px-3 py-1 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creatingComment ? 'Posting...' : 'Post'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
