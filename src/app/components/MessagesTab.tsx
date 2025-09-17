'use client';
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import DeluxeMessageCard from '../components/Posting/DeluxeMessageCard';
import DeluxeMessageCardLoading from './DeluxeMessageCardLoading';
import PostInput from './PostInput';
import { GET_USER_FEED } from './graphql/query';
import { CREATE_POST } from './graphql/mutation';
import { decryptToken } from '../../../utils/decryptToken';

interface User {
  id: string;
  name: string;
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
  const limit = 10;
  
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

  const { data, loading: usersfeedloading, error: usersfeederror, fetchMore } = useQuery(GET_USER_FEED, {
    variables: { page, limit, userId },
    fetchPolicy: 'cache-and-network',
    skip: !userId // Skip query until userId is available
  });

  const [createPost, { loading, error }] = useMutation(CREATE_POST, {
    onCompleted: (e: any) => {
      console.log(e);
      // Optionally refetch the feed after creating a post
    },
    refetchQueries: [{ query: GET_USER_FEED, variables: { page: 1, limit, userId } }]
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

  const loadMore = () => {
    fetchMore({
      variables: {
        page: page + 1,
        limit,
        userId: userId
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          userFeed: {
            ...fetchMoreResult.userFeed,
            posts: [...prev.userFeed.posts, ...fetchMoreResult.userFeed.posts],
          },
        };
      },
    });
    setPage(page + 1);
  };

  if (usersfeedloading && page === 1) return <DeluxeMessageCardLoading />;
  if (usersfeederror) return <div>Error: {usersfeederror.message}</div>;

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
        />
        
        {data?.userFeed?.posts.map((post: Post) => (
          <DeluxeMessageCard 
            key={post.id} 
            message={{
              id: post.id,
              sender: post.user.name,
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
        
        {data?.userFeed?.hasNextPage && (
          <div className="flex justify-center mt-6">
            <button 
              onClick={loadMore}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              disabled={usersfeedloading}
            >
              {usersfeedloading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesTab;
