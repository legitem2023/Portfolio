// components/UserCard.tsx
import React from 'react';
import { User } from '../../types/types';

interface UserCardProps {
  user: User;
  onViewAddresses: () => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onViewAddresses }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={`${user.firstName} ${user.lastName}`}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          user.role === 'ADMIN' 
            ? 'bg-purple-100 text-purple-800'
            : 'bg-green-100 text-green-800'
        }`}>
          {user.role}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <span className="text-gray-500">Phone:</span>
          <p className="font-medium">{user.phone || 'N/A'}</p>
        </div>
        <div>
          <span className="text-gray-500">Verified:</span>
          <p className={`font-medium ${
            user.emailVerified ? 'text-green-600' : 'text-red-600'
          }`}>
            {user.emailVerified ? 'Yes' : 'No'}
          </p>
        </div>
        <div>
          <span className="text-gray-500">Addresses:</span>
          <p className="font-medium">{user.addresses?.length || 0}</p>
        </div>
        <div>
          <span className="text-gray-500">Joined:</span>
          <p className="font-medium">
            {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <button
        onClick={onViewAddresses}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 text-sm font-medium"
      >
        View Addresses ({user.addresses?.length || 0})
      </button>
    </div>
  );
};

export default UserCard;
