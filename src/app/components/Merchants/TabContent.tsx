// components/TabContent.tsx
import { ReactNode } from 'react';
import Image from 'next/image';
import { User, Post , Product } from '../../../../types';
import ProductThumbnails from '../ProductThumbnails';

import { ApolloQueryResult, OperationVariables } from "@apollo/client";

interface TabContentProps {
  activeTab: string;
  user: User;
  userId: string;
  refetch: (variables?: Partial<OperationVariables>) => Promise<ApolloQueryResult<any>>;
}

const TabContent = ({ activeTab, user, userId, refetch }: TabContentProps) => {
 console.log(user,"tab ui");
  const renderPostsTab = () => (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {user.posts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="mt-4 text-lg">No posts yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {user.posts.map((post: Post) => (
            <div key={post.id} className="relative group cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              <div className="aspect-square relative overflow-hidden bg-gray-200">
                <Image
                  src={post.content}
                  alt="Post image"
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity" />
                
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-4 md:gap-6 text-white font-semibold text-sm md:text-base">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 md:w-5 md:h-5 mr-1 fill-current" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" />
                      </svg>
                      {post.likeCount}
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 md:w-5 md:h-5 mr-1 fill-current" viewBox="0 0 20 20">
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
      )}
    </div>
  );
  

  const handleAddressUpdate = async () => {
    // Refetch user data to get updated addresses
    await refetch();
  };
  
  const renderProductTab = () => (
  <div>sample</div>
  {/* <ProductThumbnails products={user.products} />   */}       
  );

  switch (activeTab) {
    case 'posts':
      return renderPostsTab();
    case 'product':
      return renderProductTab();
    default:
      return renderProductTab();
  }
};

export default TabContent;
