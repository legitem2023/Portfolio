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
import { useDispatch, useSelector } from 'react-redux';
import { setActiveIndex } from '../../../Redux/activeIndexSlice';

import TabContent from './TabContent';
const UserProfile = ({ userId }: { userId: string }) => {
  const { data, loading, error, refetch } = useQuery(GET_USER_PROFILE, {
    variables: { id: userId },
  });

  const [activeTab, setActiveTab] = useState<string>('address');
  const dispatch = useDispatch();
  if (loading) return <UserProfileShimmer />;
  if (error) return <UserProfileShimmerRed />;

  if(!data?.user) return "User not found!";
  
  const user: User = data?.user;
  return (
    <div className="min-h-screen bg-gray-100 p-0">
      <div className="max-w-2xl mx-auto">      {/* Cover Photo */}
      <div className="h-36 bg-gradient-to-r from-violet-100 to-indigo-100 bg-opacity-90 backdrop-blur-sm relative">
        <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        {/* Profile Picture */}
        <div className="absolute -bottom-12 md:-bottom-16 left-4 md:left-8 transform md:transform-none">
          <div className="relative w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden border-4 border-white shadow-lg">
            <Image
              src={user.avatar || '/NoImage.webp'}
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
      <TabContent activeTab={activeTab} user={user} userId={userId} refetch={refetch}/>
    </div>
     </div> 
  );
};

export default UserProfile;
