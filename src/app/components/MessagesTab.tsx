'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import DeluxeMessageCard from '../components/Posting/DeluxeMessageCard';
import DeluxeMessageCardLoading from './DeluxeMessageCardLoading';
import PostInput from './PostInput';
import { GET_ALL_POSTS } from './graphql/query'; // Changed to GET_ALL_POSTS
import { CREATE_POST } from './graphql/mutation';
import { decryptToken } from '../../../utils/decryptToken';
import { useInView } from 'react-intersection-observer';

interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  email?: string;
  phone?: string | null;
  role?: string;
}

interface Post {
  id: string;
  background: string | null;
  commentCount: number;
  content: string;
  createdAt: string;
  images: string[];
  isLikedByMe: boolean;
  likeCount: number;
  privacy: string;
  taggedUsers: User[];
  user: User;
}

const MessagesTab = () => {
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  // Intersection Observer for infinite scroll
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

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
        setUserId(payload.userId);
        setName(payload.name);
        setAvatar(payload.image || "/NoImage.webp");
      } catch (err) {
        console.error('Error getting role:', err);
      }
    };
    getRole();
  }, []);

  // Using GET_ALL_POSTS instead of GET_USER_FEED
  const { data, loading: postsLoading, error: postsError, fetchMore } = useQuery(GET_ALL_POSTS, {
    variables: { page: 1, limit }, // Start with page 1
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true, // This will trigger loading state on fetchMore
  });

  // Load more posts when the loader comes into view
  useEffect(() => {
    if (inView && hasMore && !postsLoading && data?.posts?.hasNextPage) {
      loadMore();
    }
  }, [inView, hasMore, postsLoading, data]);

  const [createPost, { loading: creatingPost, error: createError }] = useMutation(CREATE_POST, {
    onCompleted: () => {
      // Refetch posts to show the new post at the top
      // You might want to update the cache instead for better UX
      if (fetchMore) {
        fetchMore({
          variables: { page: 1, limit },
          updateQuery: (prev, { fetchMoreResult }) => {
            if (!fetchMoreResult) return prev;
            return fetchMoreResult;
          },
        });
      }
    },
  });

  const handlePostSubmit = async (content: string, images: any, taggedUsers: any, selectedBackground: any) => {
    const input = {
      content: content.trim(),
      background: selectedBackground || undefined,
      images: images.length > 0 ? images : undefined,
      taggedUsers: taggedUsers,
      privacy: 'PUBLIC',
      userId: userId
    };

    try {
      await createPost({
        variables: { input }
      });
    } catch (err) {
      console.error('Error creating post:', err);
    }
  };

  const loadMore = useCallback(async () => {
    if (!hasMore || postsLoading) return;

    const nextPage = page + 1;

    try {
      await fetchMore({
        variables: {
          page: nextPage,
          limit,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          
          const newPosts = fetchMoreResult.posts;
          
          // Check if we have more posts to load
          if (!newPosts.hasNextPage || newPosts.posts.length === 0) {
            setHasMore(false);
          }

          // Merge the posts
          return {
            posts: {
              ...newPosts,
              posts: [...prev.posts.posts, ...newPosts.posts],
            },
          };
        },
      });
      
      setPage(nextPage);
    } catch (error) {
      console.error('Error loading more posts:', error);
    }
  }, [page, hasMore, postsLoading, fetchMore, limit]);

  // Format user name for display
  const formatUserName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.name || 'Unknown User';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (postsError) return <div className="text-red-500 text-center p-4">Error: {postsError.message}</div>;

  const posts = data?.posts?.posts || [];
  const showLoader = postsLoading && page === 1;

  return (
    <div className="min-h-screen bg-gray-100 p-0">
      <div className="max-w-2xl mx-auto">
        <PostInput
          user={{
            id: userId,
            name: name,
            avatar: avatar
          }}
          onPostSubmit={handlePostSubmit}
          placeholder="What's on your mind?"
          isLoading={creatingPost}
        />
        
        {/* Loading state for initial load */}
        {showLoader && <DeluxeMessageCardLoading />}
        
        {/* Posts list */}
        {posts.map((post: Post, index: number) => (
          <DeluxeMessageCard 
            key={post.id} 
            message={{
              id: post.id,
              sender: formatUserName(post.user),
              avatar: post.user.avatar,
              timestamp: formatDate(post.createdAt),
              content: post.content,
              likes: post.likeCount,
              comments: post.commentCount,
              shares: 0, // You might need to add this field to your schema
              // New post-specific fields
              background: post.background,
              images: post.images,
              isLikedByMe: post.isLikedByMe,
              privacy: post.privacy,
              taggedUsers: post.taggedUsers,
              user: post.user,
              isOwnMessage: post.user.id === userId
            }} 
            className="mb-2"
          />
        ))}
        
        {/* Loading more indicator */}
        {postsLoading && page > 1 && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {/* Infinite scroll trigger */}
        {data?.posts?.hasNextPage && !postsLoading && (
          <div ref={ref} className="h-10 flex items-center justify-center">
            <span className="text-gray-500">Loading more posts...</span>
          </div>
        )}
        
        {/* No more posts message */}
        {!hasMore && posts.length > 0 && (
          <div className="text-center py-6 text-gray-500">
            Youve reached the end of the feed
          </div>
        )}
        
        {/* Empty state */}
        {!showLoader && posts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No posts yet</p>
            <p className="text-sm">Be the first to share something!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesTab;
