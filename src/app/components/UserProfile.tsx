// components/UserProfile.tsx
'use client';

import { useQuery } from '@apollo/client';
import Image from 'next/image';
import { GET_USER_PROFILE } from './graphql/query';
import { Post, User } from '../../../types';
import UserProfileShimmer from './UserProfileShimmer';
import UserProfileShimmerRed from './UserProfileShimmerRed';
import ProfileTabs from './ProfileTabs';
import { useState } from 'react';
import TabContent from './TabContent';
const UserProfile = ({ userId }: { userId: string }) => {
  const { data, loading, error } = useQuery(GET_USER_PROFILE, {
    variables: { id: userId },
  });

  const [activeTab, setActiveTab] = useState<string>('address');

  if (loading) return <UserProfileShimmer />;
  if (error) return <UserProfileShimmerRed />;

  const user: User = data.user;

  return (
    <div className="bg-gray-50 min-h-screen max-w-2xl">
      {/* Cover Photo */}
      <div className="h-48 md:h-60 lg:h-80 bg-gradient-to-r from-violet-100 to-indigo-100 bg-opacity-90 backdrop-blur-sm relative">
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        {/* Profile Picture */}
        <div className="absolute -bottom-12 md:-bottom-16 left-4 md:left-8 transform md:transform-none">
          <div className="relative w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden border-4 border-white shadow-lg">
            <Image
              src={user.avatar || '/default-avatar.png'}
              alt={`${user.firstName}'s avatar`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 96px, (max-width: 1024px) 128px, 160px"
            />
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="max-w-4xl mx-auto px-4 pt-16 md:pt-20 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="w-full md:w-auto">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{user.firstName} {user.lastName}</h1>
            <p className="text-gray-600 mt-1">@{user.firstName.toLowerCase()}{user.lastName.toLowerCase()}</p>
            
            <div className="flex gap-4 md:gap-6 mt-4 text-gray-700 text-sm md:text-base">
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
          
          <div className="flex gap-2 mt-4 md:mt-0 w-full md:w-auto justify-start md:justify-end">
            <button className="px-3 py-2 md:px-4 md:py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors flex items-center text-sm md:text-base flex-1 md:flex-initial justify-center">
              <svg className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              Follow
            </button>
            <button className="px-3 py-2 md:px-4 md:py-2 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300 transition-colors flex items-center text-sm md:text-base flex-1 md:flex-initial justify-center">
              <svg className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              Message
            </button>
            <button className="px-2 py-2 md:px-3 md:py-2 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Tabs Navigation */}
        <ProfileTabs 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabsConfig={[
            { id: 'posts', label: 'Posts', icon: 'user' },
            { id: 'address', label: 'Addresses', icon: 'location' }
          ]}
        />
      </div>

      {/* Tab Content */}
      <TabContent activeTab={activeTab} user={user} userId={userId}/>
    </div>
  );
};

export default UserProfile;
