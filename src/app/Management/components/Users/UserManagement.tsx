'use client';

import { gql, useQuery, useMutation } from '@apollo/client';
import { useState } from 'react';
import Image from 'next/image';

// Queries and Mutations
const USERS = gql`
  query GetUsers {
    users {
      id
      email
      password
      firstName
      lastName
      addresses {
        type
        receiver
        street
        city
        state
        zipCode
        country
        isDefault
        createdAt
      }
      avatar
      phone
      emailVerified
      createdAt
      updatedAt
      role
    }
  }
`;

const UPDATE_ROLE = gql`
  mutation UpdateRole($userId: ID!, $level: Role!) {
    updateRole(userId: $userId, level: $level) {
      statusText
    }
  }
`;

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('ALL');
  const { loading, error, data } = useQuery(USERS);
  const [updateRole] = useMutation(UPDATE_ROLE, {
    refetchQueries: [{ query: USERS }]
  });

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="text-gray-500">Loading users...</div>
    </div>
  );
  
  if (error) return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
      <p className="text-red-600">Error: {error.message}</p>
    </div>
  );

  const users:any = data?.users || [];
  const tabs = ['ALL', 'ADMINISTRATOR', 'MANAGER', 'RIDER', 'USER'];
  
  const roleColors = {
    ADMINISTRATOR: 'bg-purple-100 text-purple-800 border-purple-200',
    MANAGER: 'bg-blue-100 text-blue-800 border-blue-200',
    RIDER: 'bg-green-100 text-green-800 border-green-200',
    USER: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const filteredUsers = activeTab === 'ALL' 
    ? users 
    : users.filter((user:any) => user.role === activeTab);

  const handleRoleChange = async (userId:any, newRole:any) => {
    try {
      await updateRole({
        variables: { userId, level: newRole }
      });
    } catch (err:any) {
      console.error('Error updating role:', err);
      alert(err.message);
    }
  };

  const getRoleCount = (role:any) => {
    if (role === 'ALL') return users.length;
    return users.filter((u:any) => u.role === role).length;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage user roles and permissions</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px px-6">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    py-4 px-6 font-medium text-sm border-b-2 transition-colors
                    ${activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab === 'ALL' ? 'All Users' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                  <span className={`
                    ml-2 py-0.5 px-2 rounded-full text-xs
                    ${activeTab === tab ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                  `}>
                    {getRoleCount(tab)}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Users Grid */}
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No users found in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user:any) => (
              <div
                key={user.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Card Header with Role Color */}
                <div className={`h-2 ${roleColors[user.role].split(' ')[0]}`} />

                {/* Card Content */}
                <div className="p-6">
                  {/* User Header */}
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {user.avatar ? (
                        <Image
                          src={user.avatar}
                          alt={`${user.firstName || ''} ${user.lastName || ''}`}
                          width={56}
                          height={56}
                          className="rounded-full border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-gray-300">
                          <span className="text-gray-600 text-xl font-semibold">
                            {user.firstName?.[0] || user.lastName?.[0] || user.email[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {user.firstName || user.lastName ? (
                          `${user.firstName || ''} ${user.lastName || ''}`
                        ) : (
                          'No name provided'
                        )}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      {user.phone && (
                        <p className="text-sm text-gray-400 mt-1">{user.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Current Role Badge */}
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Current Role
                    </label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${roleColors[user.role]}`}>
                      {user.role}
                    </span>
                  </div>

                  {/* Role Selector */}
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Change Role
                    </label>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="ADMINISTRATOR">Administrator</option>
                      <option value="MANAGER">Manager</option>
                      <option value="RIDER">Rider</option>
                      <option value="USER">User</option>
                    </select>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Email verified:</span>
                        <span className={`ml-1 font-medium ${user.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
                          {user.emailVerified ? '✓' : '✗'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Addresses:</span>
                        <span className="ml-1 font-medium text-gray-700">
                          {user.addresses?.length || 0}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Joined:</span>
                        <span className="ml-1 font-medium text-gray-700">
                          {new Date(user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Email Verification Status Bar */}
                  <div className="mt-4 -mx-6 -mb-6 px-6 py-3 bg-gray-50">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${user.emailVerified ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      <span className="text-xs text-gray-600">
                        {user.emailVerified ? 'Verified user' : 'Pending verification'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Footer */}
        <div className="mt-8 bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span className="font-medium">Total Users: {users.length}</span>
              <span>•</span>
              <div className="flex space-x-3">
                {tabs.slice(1).map((role:any) => (
                  <div key={role} className="flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-1 ${
                      role === 'ADMINISTRATOR' ? 'bg-purple-500' :
                      role === 'MANAGER' ? 'bg-blue-500' :
                      role === 'RIDER' ? 'bg-green-500' : 'bg-gray-500'
                    }`} />
                    <span>{role}: {getRoleCount(role)}</span>
                  </div>
                ))}
              </div>
            </div>
            <span className="text-gray-400">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
