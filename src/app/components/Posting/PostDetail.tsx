// components/PostDetail.tsx
import React from 'react';
import { useQuery } from '@apollo/client';
import DeluxeMessageCard from './DeluxeMessageCard';
import { GET_POST } from '../graphql/query'; // Adjust path as needed
import DeluxeMessageCardLoading from '../DeluxeMessageCardLoading';

interface PostDetailProps {
  postId: string;
}

const PostDetail: React.FC<PostDetailProps> = ({ postId }) => {
  const { data, loading, error } = useQuery(GET_POST, {
    variables: { id: postId },
  });

  if (loading) return <DeluxeMessageCardLoading/>;
  if (error) return <div>Error loading post: {error.message}</div>;
  if (!data?.post) return <div>Post not found</div>;

  // Transform the GraphQL response to match the Message interface
  const transformPostToMessage = (post: any) => {
    return {
      id: post.id,
      sender: `${post.user.firstName} ${post.user.lastName}`,
      avatar: post.user.avatar,
      timestamp: post.createdAt,
      content: post.content,
      background: post.background,
      images: post.images,
      isLikedByMe: post.isLikedByMe,
      likes: post.likeCount,
      comments: post.commentCount,
      shares: 0, // You might need to add this field to your GraphQL query
      privacy: post.privacy,
      taggedUsers: post.taggedUsers.map((user: any) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
      })),
      // Transform comments to match the Comment interface
      commentsList: post.comments.map((comment: any) => ({
        id: comment.id,
        user: {
          id: comment.user.id,
          name: `${comment.user.firstName} ${comment.user.lastName}`,
          avatar: comment.user.avatar,
        },
        content: comment.content,
        timestamp: comment.createdAt,
        likes: comment.likeCount,
      })),
      // You'll need to add likesList and sharesList if your GraphQL query includes them
      likesList: [], // Add this if you have likes data
      sharesList: [], // Add this if you have shares data
    };
  };

  const message = transformPostToMessage(data.post);

  return (
    <div className="post-detail-container">
      <DeluxeMessageCard 
        message={message}
        className="max-w-4xl mx-auto"
      />
    </div>
  );
};

export default PostDetail;
