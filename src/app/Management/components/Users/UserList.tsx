// components/UserList.tsx
import React, { useState } from 'react';
import { User } from '../../../../../types';
import UserCard from './UserCard';
import UserTable from './UserTable';
import AddressModal from './AddressModal';

interface UserListProps {
  users: User[];
  loading?: boolean;
  onUserUpdate?: (userId: string, updates: Partial<User>) => void;
}

const UserList: React.FC<UserListProps> = ({ 
  users, 
  loading = false,
  onUserUpdate 
}) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const handleViewAddresses = (user: User) => {
    setSelectedUser(user);
    setShowAddressModal(true);
  };

  const handleCloseModal = () => {
    setShowAddressModal(false);
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No users found
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="block md:hidden space-y-4">
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            onViewAddresses={() => handleViewAddresses(user)}
          />
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <UserTable
          users={users}
          onViewAddresses={handleViewAddresses}
        />
      </div>

      {/* Address Modal */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={handleCloseModal}
        user={selectedUser}
      />
    </>
  );
};

export default UserList;
