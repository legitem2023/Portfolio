// components/UserCard.tsx
import React from 'react';
import { User } from '../../types/types';

interface UserCardProps {
  user: User;
  onViewAddresses: () => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onViewAddresses }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
        <div className="flex items-center space-x-3">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={`${user.firstName} ${user.lastName}`}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-sm text-gray-600 truncate">{user.email}</p>
          </div>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-medium self-start sm:self-auto ${
          user.role === 'ADMIN' 
            ? 'bg-purple-100 text-purple-800'
            : 'bg-green-100 text-green-800'
        }`}>
          {user.role}
        </span>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 text-sm mb-4">
        <div className="flex flex-col">
          <span className="text-gray-500 text-xs sm:text-sm mb-1">Phone:</span>
          <p className="font-medium text-sm sm:text-base truncate">
            {user.phone || 'N/A'}
          </p>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500 text-xs sm:text-sm mb-1">Verified:</span>
          <p className={`font-medium text-sm sm:text-base ${
            user.emailVerified ? 'text-green-600' : 'text-red-600'
          }`}>
            {user.emailVerified ? 'Yes' : 'No'}
          </p>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500 text-xs sm:text-sm mb-1">Addresses:</span>
          <p className="font-medium text-sm sm:text-base">
            {user.addresses?.length || 0}
          </p>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500 text-xs sm:text-sm mb-1">Joined:</span>
          <p className="font-medium text-sm sm:text-base">
            {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <button
        onClick={onViewAddresses}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg transition-colors duration-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        View Addresses ({user.addresses?.length || 0})
      </button>
    </div>
  );
};

export default UserCard;
