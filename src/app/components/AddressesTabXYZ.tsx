'use client';
import { useState, ReactNode } from 'react';
import { gql, useMutation } from '@apollo/client';
import AddressForm from './Addresses/AddressForm';
import { SET_DEFAULT_ADDRESS } from './graphql/mutation';

// Types
export interface Address {
  id: string;
  type: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

interface AddressesTabProps {
  addresses: Address[];
  userId: string;
  onAddressUpdate: () => void;
}

// Professional Address Card Component
const AddressCard: React.FC<{
  address: Address;
  onMakeDefault: (id: any) => void;
  isDefault: boolean;
}> = ({ address, onMakeDefault, isDefault }) => (
  <div className={`
    relative rounded-xl transition-all duration-200 ease-in-out
    ${isDefault 
      ? 'border-2 border-blue-500 bg-gradient-to-br from-blue-50/50 to-white shadow-md' 
      : 'border border-gray-200 bg-white hover:shadow-lg hover:border-gray-300'
    }
  `}>
    {/* Status Badge - Top Left Corner */}
    <div className="absolute -top-2 -left-2 flex gap-1">
      {isDefault && (
        <span className="px-2.5 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full shadow-sm">
          Default
        </span>
      )}
      <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full capitalize shadow-sm">
        {address.type}
      </span>
    </div>

    {/* Card Content - Reduced padding */}
    <div className="p-4 pt-5">
      {/* Address Details */}
      <div className="space-y-1.5 mb-3">
        <p className="font-semibold text-gray-800 text-sm leading-relaxed">
          {address.street}
        </p>
        <p className="text-gray-600 text-sm">
          {address.city}, {address.state} {address.zipCode}
        </p>
        <p className="text-gray-600 text-sm">{address.country}</p>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 my-3"></div>

      {/* Footer with Date and Action */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-gray-400">
          Added {new Date(address.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </p>
        
        {!isDefault && (
          <button
            onClick={() => onMakeDefault(address.id)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-all duration-200 hover:shadow-md active:scale-95 whitespace-nowrap"
          >
            Set as Default
          </button>
        )}
      </div>
    </div>
  </div>
);

// Main Addresses Tab Component
const AddressesTab: React.FC<AddressesTabProps> = ({ addresses, userId, onAddressUpdate }) => {
  const [setDefaultAddress, { loading: updatingDefault }] = useMutation(SET_DEFAULT_ADDRESS);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const handleAddressSuccess = () => {
    setShowAddressForm(false);
    onAddressUpdate?.();
  };

  const handleMakeDefault = async (addressId: string) => {
    try {
      await setDefaultAddress({
        variables: {
          userId,
          addressId: addressId,
        },
      });
      onAddressUpdate?.();
    } catch (error) {
      console.error('Error setting default address:', error);
    }
  };

  // Sort addresses: default first, then by creation date
  const sortedAddresses = [...addresses].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Loading State
  if (updatingDefault) {
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-700 font-medium">Updating default address...</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty State
  if (!addresses || addresses.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="mb-4">
          <button
            onClick={() => setShowAddressForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-md text-sm font-medium"
          >
            + Add New Address
          </button>
        </div>

        {showAddressForm && (
          <div className="mb-6">
            <AddressForm
              userId={userId}
              onSuccess={handleAddressSuccess}
              onCancel={() => setShowAddressForm(false)}
              onAddressUpdate={() => onAddressUpdate?.()}
            />
          </div>
        )}

        <div className="text-center py-12 sm:py-16 bg-gray-50 rounded-xl">
          <svg className="w-16 h-16 mx-auto text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <p className="mt-4 text-gray-600 font-medium">No addresses found</p>
          <p className="mt-1 text-gray-400 text-sm">Add your first address to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      {/* Header Section */}
      <div className="mb-5 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Manage Addresses</h2>
            <p className="text-gray-500 text-sm mt-1">
              {sortedAddresses.length} address{ sortedAddresses.length !== 1 ? 'es' : '' } saved
              {sortedAddresses.some(a => a.isDefault) && ' • Default used for shipping'}
            </p>
          </div>
          
          <button
            onClick={() => setShowAddressForm(!showAddressForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-md text-sm font-medium whitespace-nowrap"
          >
            {showAddressForm ? '− Cancel' : '+ Add New Address'}
          </button>
        </div>
      </div>

      {/* Address Form */}
      {showAddressForm && (
        <div className="mb-6 animate-in slide-in-from-top-2 duration-200">
          <AddressForm
            userId={userId}
            onSuccess={handleAddressSuccess}
            onCancel={() => setShowAddressForm(false)}
            onAddressUpdate={() => onAddressUpdate?.()}
          />
        </div>
      )}

      {/* Address Cards Grid - Responsive */}
      <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
        {sortedAddresses.map((address, index) => (
          <AddressCard
            key={`${address.id}-${index}`}
            address={address}
            isDefault={address.isDefault}
            onMakeDefault={() => handleMakeDefault(address.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default AddressesTab;
