// components/UserProfile.tsx
'use client';
import { useQuery } from '@apollo/client';
import Image from 'next/image';
import { GET_USER_PROFILE } from '../graphql/query';
import { Post, User } from '../../../../types';
import UserProfileShimmer from '../UserProfileShimmer';
import UserProfileShimmerRed from '../UserProfileShimmerRed';
import ProfileTabs from '../ProfileTabs';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveIndex } from '../../../../Redux/activeIndexSlice';

import TabContent from './TabContent';
const MerchantDetails = ({ userId }: { userId: string }) => {
  const { data, loading, error, refetch } = useQuery(GET_USER_PROFILE, {
    variables: { id: userId },
  });

  const [activeTab, setActiveTab] = useState<string>('product');
  const dispatch = useDispatch();
  if (loading) return <UserProfileShimmer />;
  if (error) return <UserProfileShimmerRed />;

  if(!data?.user) return "User not found!";
  
  const user: User = data.user;
 //console.log(user,"User Profile");
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
                <strong>{user.products.length}</strong> Products
              </span>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4 md:mt-0 w-full md:w-auto justify-start md:justify-end">
            <button onClick={()=>dispatch(setActiveIndex(9))}className="px-3 py-2 md:px-4 md:py-2 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300 transition-colors flex items-center text-sm md:text-base flex-1 md:flex-initial justify-center">
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
            { id: 'product', label: 'Products', icon: 'tags' }
          ]}
        />
      </div>

      {/* Tab Content */}
         <TabContent activeTab={activeTab} user={user} userId={userId} refetch={refetch}/>
    </div>
     </div> 
  );
};

export default MerchantDetails;
