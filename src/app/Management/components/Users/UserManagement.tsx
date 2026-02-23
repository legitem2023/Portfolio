'use client';

import { gql, useQuery, useMutation } from '@apollo/client';
import { useState } from 'react';
import Image from 'next/image';

// Types
type UserRole = 'ADMINISTRATOR' | 'MANAGER' | 'RIDER' | 'USER';
type TabType = UserRole | 'ALL';

interface Address {
  type: string;
  receiver: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  password: string;
  firstName: string | null;
  lastName: string | null;
  addresses: Address[];
  avatar: string | null;
  phone: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  role: UserRole;
}

interface UsersData {
  users: User[];
}

interface UpdateRoleResponse {
  updateRole: {
    statusText: string;
  };
}

interface UpdateRoleVariables {
  userId: string;
  Level: UserRole;
}

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
  mutation UpdateRole($userId: ID!, $Level: Role!) {
    updateRole(userId: $userId, Level: $Level) {
      statusText
    }
  }
`;

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const { loading, error, data } = useQuery<UsersData>(USERS);
  const [updateRole] = useMutation<UpdateRoleResponse, UpdateRoleVariables>(UPDATE_ROLE, {
    refetchQueries: [{ query: USERS }]
  });

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh] sm:min-h-[70vh]">
      <div className="text-gray-500 text-sm sm:text-base">Loading users...</div>
    </div>
  );
  
  if (error) return (
    <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-md m-3 sm:m-6">
      <p className="text-red-600 text-sm sm:text-base">Error: {error.message}</p>
    </div>
  );

  const users: User[] = data?.users || [];
  const tabs: TabType[] = ['ALL', 'ADMINISTRATOR', 'MANAGER', 'RIDER', 'USER'];
  
  const roleColors: Record<UserRole, string> = {
    ADMINISTRATOR: 'bg-purple-100 text-purple-800 border-purple-200',
    MANAGER: 'bg-blue-100 text-blue-800 border-blue-200',
    RIDER: 'bg-green-100 text-green-800 border-green-200',
    USER: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const filteredUsers = activeTab === 'ALL' 
    ? users 
    : users.filter((user) => user.role === activeTab);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateRole({
        variables: { userId, Level: newRole }
      });
    } catch (err) {
      console.error('Error updating role:', err);
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('An unknown error occurred');
      }
    }
  };

  const getRoleCount = (role: TabType): number => {
    if (role === 'ALL') return users.length;
    return users.filter((u) => u.role === role).length;
  };

  const toggleAddresses = (userId: string) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  const formatAddress = (address: Address) => {
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 px-3 sm:px-4 md:px-6 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            User Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            Manage user roles and permissions
          </p>
        </div>

        {/* Mobile Tabs Dropdown */}
        <div className="block sm:hidden mb-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-full bg-white rounded-lg shadow px-4 py-3 flex items-center justify-between"
          >
            <span className="font-medium text-gray-700">
              {activeTab === 'ALL' ? 'All Users' : activeTab}
            </span>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isMobileMenuOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left flex items-center justify-between
                    ${activeTab === tab ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}
                    ${tab !== tabs[tabs.length - 1] ? 'border-b border-gray-100' : ''}
                  `}
                >
                  <span className="font-medium">
                    {tab === 'ALL' ? 'All Users' : tab}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium
                    ${activeTab === tab ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                  `}>
                    {getRoleCount(tab)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Tabs */}
        <div className="hidden sm:block bg-white rounded-lg shadow mb-4 sm:mb-6 overflow-x-auto">
          <div className="border-b border-gray-200 min-w-max">
            <nav className="flex px-4 sm:px-6">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    py-3 sm:py-4 px-3 sm:px-4 md:px-6 font-medium text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap
                    ${activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab === 'ALL' ? 'All Users' : tab}
                  <span className={`
                    ml-1 sm:ml-2 py-0.5 px-1.5 sm:px-2 rounded-full text-xs
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
          <div className="bg-white rounded-lg shadow p-6 sm:p-8 md:p-12 text-center">
            <p className="text-sm sm:text-base text-gray-500">No users found in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Card Header with Role Color */}
                <div className={`h-1.5 sm:h-2 ${roleColors[user.role].split(' ')[0]}`} />

                {/* Card Content */}
                <div className="p-3 sm:p-4 md:p-6">
                  {/* User Header */}
                  <div className="flex items-start space-x-2 sm:space-x-3 md:space-x-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {user.avatar ? (
                        <Image
                          src={user.avatar}
                          alt={`${user.firstName || ''} ${user.lastName || ''}`}
                          width={48}
                          height={48}
                          className="rounded-full border-2 border-gray-200 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14"
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-gray-300">
                          <span className="text-gray-600 text-base sm:text-lg md:text-xl font-semibold">
                            {user.firstName?.[0] || user.lastName?.[0] || user.email[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                        {user.firstName || user.lastName ? (
                          `${user.firstName || ''} ${user.lastName || ''}`
                        ) : (
                          'No name provided'
                        )}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">{user.email}</p>
                      {user.phone && (
                        <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1 truncate">{user.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Current Role Badge */}
                  <div className="mt-2 sm:mt-3 md:mt-4">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 sm:mb-2">
                      Current Role
                    </label>
                    <span className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium border ${roleColors[user.role]}`}>
                      {user.role}
                    </span>
                  </div>

                  {/* Role Selector */}
                  <div className="mt-2 sm:mt-3 md:mt-4">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 sm:mb-2">
                      Change Role
                    </label>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                      className="block w-full text-xs sm:text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white py-1.5 sm:py-2"
                    >
                      <option value="ADMINISTRATOR">Administrator</option>
                      <option value="MANAGER">Manager</option>
                      <option value="RIDER">Rider</option>
                      <option value="USER">User</option>
                    </select>
                  </div>

                  {/* Addresses Section */}
                  <div className="mt-2 sm:mt-3 md:mt-4">
                    <button
                      onClick={() => toggleAddresses(user.id)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Addresses ({user.addresses?.length || 0})
                      </label>
                      <svg
                        className={`w-4 h-4 text-gray-500 transition-transform ${
                          expandedUserId === user.id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {expandedUserId === user.id && (
                      <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                        {user.addresses && user.addresses.length > 0 ? (
                          user.addresses.map((address, index) => (
                            <div
                              key={index}
                              className={`text-xs p-2 rounded border ${
                                address.isDefault
                                  ? 'border-blue-200 bg-blue-50'
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-700">
                                  {address.type || 'Address'} {address.isDefault && '(Default)'}
                                </span>
                                <span className="text-gray-400 text-xs">
                                  {new Date(address.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-gray-600">{formatAddress(address)}</p>
                              <p className="text-gray-500 mt-1">Receiver: {address.receiver}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500 italic p-2">No addresses found</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Additional Info */}
                  <div className="mt-2 sm:mt-3 md:mt-4 pt-2 sm:pt-3 md:pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-1 sm:gap-2 text-xs">
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-gray-500">Email verified:</span>
                        <span className={`ml-1 font-medium ${user.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
                          {user.emailVerified ? '✓' : '✗'}
                        </span>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
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
                  <div className="mt-2 sm:mt-3 md:mt-4 -mx-3 sm:-mx-4 md:-mx-6 -mb-3 sm:-mb-4 md:-mb-6 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gray-50">
                    <div className="flex items-center">
                      <div className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full mr-1.5 sm:mr-2 ${user.emailVerified ? 'bg-green-500' : 'bg-yellow-500'}`} />
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
        <div className="mt-4 sm:mt-6 md:mt-8 bg-white rounded-lg shadow p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs sm:text-sm text-gray-600 gap-2 sm:gap-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <span className="font-medium">Total: {users.length}</span>
              <span className="hidden sm:inline">•</span>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {tabs.slice(1).map((role) => (
                  <div key={role} className="flex items-center">
                    <span className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full mr-1 ${
                      role === 'ADMINISTRATOR' ? 'bg-purple-500' :
                      role === 'MANAGER' ? 'bg-blue-500' :
                      role === 'RIDER' ? 'bg-green-500' : 'bg-gray-500'
                    }`} />
                    <span className="text-xs">{role}: {getRoleCount(role)}</span>
                  </div>
                ))}
              </div>
            </div>
            <span className="text-xs text-gray-400 sm:text-right w-full sm:w-auto">
              Updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
