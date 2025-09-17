// components/UserProfile.tsx
'use client';

import { useQuery } from '@apollo/client';
import Image from 'next/image';
import { GET_USER_PROFILE } from './graphql/query';
import { Post, User } from '../../../types';

const UserProfile = ({ userId }: { userId: string }) => {
  const { data, loading, error } = useQuery(GET_USER_PROFILE, {
    variables: { id: userId },
  });

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const user: User = data.user;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-gray-200">
        <div className="relative w-32 h-32 rounded-full overflow-hidden ring-4 ring-white shadow-xl">
          <Image
            src={user.avatar || '/default-avatar.png'}
            alt={`${user.firstName}'s avatar`}
            fill
            className="object-cover"
          />
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
            <h1 className="text-2xl font-light">{user.firstName} {user.lastName}</h1>
            <div className="flex gap-3">
              <button className="px-6 py-1 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors">
                Follow
              </button>
              <button className="px-6 py-1 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
                Message
              </button>
            </div>
          </div>

          <div className="flex justify-center md:justify-start gap-6 mb-4">
            <span className="text-sm">
              <strong>{user.posts.length}</strong> posts
            </span>
            <span className="text-sm">
              <strong>{user.followerCount}</strong> followers
            </span>
            <span className="text-sm">
              <strong>{user.followingCount}</strong> following
            </span>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-3 gap-4 mt-8">
        {user.posts.map((post: Post) => (
          <div key={post.id} className="relative group cursor-pointer">
            <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
              <Image
                src={post.content}
                alt="Post image"
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity" />
              
              {/* Engagement metrics */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-6 text-white font-semibold">
                  <span>❤️ {post.likeCount}</span>
                  <span>💬 {post.commentCount}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserProfile;
