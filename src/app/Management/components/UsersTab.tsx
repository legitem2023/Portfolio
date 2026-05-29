// pages/UsersPage.tsx
import React from 'react';
import { useQuery } from '@apollo/client';
import { USERS } from '../../components/graphql/query';
import UserManagement from './Users/UserManagement';

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
     <div>
        <UserManagement/>
      </div>
  );
};

export default UsersTab;
