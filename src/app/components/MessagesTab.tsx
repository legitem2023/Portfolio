'use client';
import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import DeluxeMessageCard from '../components/DeluxeMessageCard';
import PostInput from './PostInput';
import { GET_USER_FEED } from './graphql/query'; // Adjust the import path
import { CREATE_POST } from './graphql/mutation';

const MessagesTab = () => {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, loading:usersfeedloading, error:usersfeederror, fetchMore } = useQuery(GET_USER_FEED, {
    variables: { page, limit },
    fetchPolicy: 'cache-and-network'
  });
  const [createPost, { loading, error }] = useMutation(CREATE_POST,{
    onCompleted:(e:any) =>{
      console.log(e);
    }
  });
  const handlePostSubmit = async (content: string, images:any, selectedBackground:any,taggedUsers:any ) => {
    console.log('New post:', content,images,selectedBackground);
    // Add your post submission logic here
    // After successful post creation, you might want to refetch the feed
   const input = {
          content: content.trim(),
          background: selectedBackground || undefined,
          images: images.length > 0 ? images : undefined,
          taggedUsers: taggedUsers.map(user => user.id),
          privacy: 'PUBLIC' // Default privacy setting
        };
    
    const result = await createPost({
            variables: { input },
            update: (cache, { data }) => {
              // Handle cache update if needed
              if (data?.createPost) {
                // Optional: Update the cache with the new post
              }
            }
          });
  }
  const loadMore = () => {
    fetchMore({
      variables: {
        page: page + 1,
        limit,
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

  if (usersfeedloading && page === 1) return <div>Loading...</div>;
  if (usersfeederror) return <div>Error: {usersfeederror.message}</div>;

  const formatDate = (dateString: string) => {
    // Implement your date formatting logic here
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-0">
      <div className="max-w-2xl mx-auto">
        <PostInput
          user={{
            id: "1",
            name: "John Doe",
            avatar: "/path/to/avatar.jpg"
          }}
          onPostSubmit={handlePostSubmit}
          placeholder="What's on your mind?"
        />
        
        {data?.userFeed?.posts.map((post:any) => (
          <DeluxeMessageCard 
            key={post.id} 
            message={{
              id: post.id,
              sender: `${post.user.firstName} ${post.user.lastName}`,
              avatar: post.user.avatar || '/path/to/default-avatar.jpg',
              timestamp: formatDate(post.createdAt),
              content: post.content,
              likes: post.likeCount,
              comments: post.commentCount,
              shares: 0, // You might need to add this field to your schema
              postImage: post.images && post.images.length > 0 ? post.images[0] : undefined,
              isOwnMessage: post.user.id === "current-user-id" // You need to get the current user ID
            }} 
            className="mb-6"
          />
        ))}
        
        {data?.userFeed?.hasNextPage && (
          <button 
            onClick={loadMore}
            className="load-more-btn"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        )}
      </div>
    </div>
  );
};

export default MessagesTab;
