// pages/UsersPage.tsx
import React from 'react';
import { useQuery } from '@apollo/client';
import { USERS } from '../../../components/graphql/queries';
import UserList from '../components/UserList';

const UsersPage: React.FC = () => {
  const { data, loading, error } = useQuery(USERS);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600 text-center">
          Error loading users: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-2">
            Manage and view user information
          </p>
        </div>
        
        <UserList 
          users={data?.users || []} 
          loading={loading}
        />
      </div>
    </div>
  );
};

export default UsersPage;
