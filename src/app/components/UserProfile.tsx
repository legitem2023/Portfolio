// components/UserProfile.tsx
'use client';

import { useQuery } from '@apollo/client';
import Image from 'next/image';
import { GET_USER_PROFILE } from './graphql/query';
import { Post, User } from '../../../types';
import UserProfileShimmer from './UserProfileShimmer';
import UserProfileShimmerRed from './UserProfileShimmerRed';
import ProfileTabs from './ProfileTabs';
import ParticleBackground from './ParticleBackground';
import CityScape from './CityScape';
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
  if (!data?.user) return <UserProfileShimmer />;
  
  const user: User = data?.user;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Photo - Mobile Optimized */}
      <div className="relative h-32 sm:h-36 md:h-48 w-full overflow-hidden">
        <ParticleBackground />
        
        {/* Profile Picture - Responsive positioning */}
        <div className="absolute -bottom-12 sm:-bottom-14 md:-bottom-16 left-4 sm:left-6 md:left-8 z-10">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full overflow-hidden border-3 sm:border-4 border-white shadow-lg bg-white">
            <Image
              src={user.avatar || '/NoImage.webp'}
              alt={`${user.firstName}'s avatar`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, (max-width: 1024px) 128px, 144px"
              priority
            />
          </div>
        </div>
      </div>

      {/* Profile Info - Responsive Container */}
      <div className="px-3 sm:px-4 md:px-6 max-w-7xl mx-auto">
        {/* User Details - Adjusted for mobile */}
        <div className="pt-10 sm:pt-12 md:pt-16 pb-2 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 break-words pr-2">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-0.5 sm:mt-1 break-words">
                @{user.firstName.toLowerCase()}{user.lastName.toLowerCase()}
              </p>
              
              {/* Stats - Horizontally scrollable on very small screens if needed */}
              <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-6 mt-3 sm:mt-4 text-xs sm:text-sm md:text-base text-gray-700">
                <span className="hover:underline cursor-pointer bg-white px-3 py-1.5 rounded-full shadow-sm">
                  <strong className="text-gray-900">{user.posts?.length || 0}</strong> 
                  <span className="ml-1 text-gray-600">posts</span>
                </span>
                <span className="hover:underline cursor-pointer bg-white px-3 py-1.5 rounded-full shadow-sm">
                  <strong className="text-gray-900">{user.addresses?.length || 0}</strong> 
                  <span className="ml-1 text-gray-600">addresses</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation - Sticky on mobile for better UX */}
        <div className="sticky top-0 z-20 bg-gray-50/80 backdrop-blur-sm -mx-3 sm:-mx-4 md:mx-0 px-3 sm:px-4 md:px-0">
          <ProfileTabs 
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabsConfig={[
              { id: 'posts', label: 'Posts', icon: 'user' },
              { id: 'address', label: 'Addresses', icon: 'location' },
              { id: 'wishlist', label: 'Wishlist', icon: 'wishlist' }
            ]}
          />
        </div>

        {/* Tab Content with proper spacing */}
        <div className="py-3 sm:py-4 md:py-6">
          <TabContent 
            activeTab={activeTab} 
            user={user} 
            userId={userId} 
            refetch={refetch}
          />
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
