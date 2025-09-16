'use client';
import React, { useState, useEffect } from 'react';
import { useQuery,useMutation } from '@apollo/client';
import DeluxeMessageCard from '../components/DeluxeMessageCard';
import DeluxeMessageCardLoading from './DeluxeMessageCardLoading';
import PostInput from './PostInput';
import { GET_USER_FEED } from './graphql/query'; // Adjust the import path
import { CREATE_POST } from './graphql/mutation';
import { decryptToken } from '../../../utils/decryptToken';

const MessagesTab = () => {
  const [page, setPage] = useState(1);
  const [userId,setUserId] = useState("");
  const [name,setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const limit = 10;
useEffect(() => {
    const getRole = async () => {
      try {
        const response = await fetch('/api/protected', {
          credentials: 'include' // Important: includes cookies
        });
        
        if (response.status === 401) {
          // Handle unauthorized access
          throw new Error('Unauthorized');
        }
        
        const data = await response.json();
        const token = data?.user;
        const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz";

        const payload = await decryptToken(token, secret.toString());
        setUserId(payload.userId);
        setName(payload.name);
        setAvatar(payload.image);
        console.log(payload);
      } catch (err) {
        console.error('Error getting role:', err);
      }
    };
    getRole();
  }, []);
  const { data, loading:usersfeedloading, error:usersfeederror, fetchMore } = useQuery(GET_USER_FEED, {
    variables: { page, limit },
    fetchPolicy: 'cache-and-network'
  });
  const [createPost, { loading, error }] = useMutation(CREATE_POST,{
    onCompleted:(e:any) =>{
      console.log(e);
    }
  });
  const handlePostSubmit = async (content: string, images:any, taggedUsers:any , selectedBackground:any) => {
       const input = {
          content: content.trim(),
          background: selectedBackground || undefined,
          images: images.length > 0 ? images : undefined,
          taggedUsers: taggedUsers,
          privacy: 'PUBLIC', // Default privacy setting
          userId:"099ffffhytfdfjj"
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

  if (usersfeedloading && page === 1) return <DeluxeMessageCardLoading/>;
  if (usersfeederror) return <div>Error: {usersfeederror.message}</div>;

  const formatDate = (dateString: string) => {
    // Implement your date formatting logic here
    return new Date(dateString).toLocaleDateString();
  };
console.log(data?.userFeed);
  return (
    <div className="min-h-screen bg-gray-100 p-0">
      <div className="max-w-2xl mx-auto">
        <PostInput
          user={{
            id: userId,
            name:name,
            avatar: avatar || "/NoImage.webp"
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
