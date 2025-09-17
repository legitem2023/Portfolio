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

  if (loading) return (
    <div className="flex justify-center items-center h-64 bg-gray-100 rounded-lg">
      <div className="flex items-center">
        <div className="h-2 w-2 bg-blue-500 rounded-full mr-1 animate-bounce"></div>
        <div className="h-2 w-2 bg-blue-500 rounded-full mr-1 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
      Error: {error.message}
    </div>
  );

  const user: User = data.user;

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Cover Photo */}
      <div className="h-80 bg-gradient-to-r from-blue-400 to-blue-600 relative">
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        {/* Profile Picture */}
        <div className="absolute -bottom-16 left-8">
          <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-lg">
            <Image
              src={user.avatar || '/default-avatar.png'}
              alt={`${user.firstName}'s avatar`}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="max-w-4xl mx-auto px-4 pt-20 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{user.firstName} {user.lastName}</h1>
            <p className="text-gray-600 mt-1">@{user.firstName.toLowerCase()}{user.lastName.toLowerCase()}</p>
            
            <div className="flex gap-6 mt-4 text-gray-700">
              <span className="hover:underline cursor-pointer">
                <strong>{user.posts.length}</strong> posts
              </span>
              <span className="hover:underline cursor-pointer">
                <strong>{user.followerCount}</strong> followers
              </span>
              <span className="hover:underline cursor-pointer">
                <strong>{user.followingCount}</strong> following
              </span>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4 md:mt-0">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              Follow
            </button>
            <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300 transition-colors flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              Message
            </button>
            <button className="px-3 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Tabs Navigation */}
        <div className="mt-6 border-t border-gray-300 flex overflow-x-auto">
          <div className="flex space-x-8 min-w-max">
            <button className="px-4 py-3 border-b-2 border-blue-600 text-blue-600 font-medium flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 005 10a6 6 0 0012 0c0-1.003-.21-1.96-.59-2.808A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
              Posts
            </button>
            <button className="px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md font-medium flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Photos
            </button>
            <button className="px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md font-medium flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              Friends
            </button>
            <button className="px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md font-medium flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Check-ins
            </button>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-1">
          {user.posts.map((post: Post) => (
            <div key={post.id} className="relative group cursor-pointer">
              <div className="aspect-square relative overflow-hidden bg-gray-200">
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
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-1 fill-current" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" />
                      </svg>
                      {post.likeCount}
                    </span>
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-1 fill-current" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      {post.commentCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
