// pages/UsersPage.tsx
import React from 'react';
import { useQuery } from '@apollo/client';
import { USERS } from '../../components/graphql/query';
import UserList from './Users/UserList';

const UsersTab: React.FC = () => {
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
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Users</h2>
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

export default UsersTab;
