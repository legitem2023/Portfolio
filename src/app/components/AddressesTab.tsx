'use client';
import { useState, ReactNode } from 'react';
import { gql, useMutation } from '@apollo/client';
import AddressForm from './Addresses/AddressForm';
import { SET_DEFAULT_ADDRESS } from './graphql/mutation';

// Types
export interface Address {
  id:string;
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
  onAddressUpdate: () => void | Promise<any>;  // ✅ fix
}
// Address Card Component
const AddressCard: React.FC<{
  address: Address;
  onMakeDefault: (id:any) => void;
  isDefault: boolean;
}> = ({ address, onMakeDefault, isDefault }) => (
  <div className={`border rounded-lg p-6 ${isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium capitalize">
          {address.type}
        </span>
        {isDefault && (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            Default
          </span>
        )}
      </div>
      {//isDefault && (
        <button
          onClick={() => onMakeDefault(address.id)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Make Default
        </button>
      //)
      }
    </div>

    <div className="space-y-2 text-gray-700">
      <p className="font-medium">{address.street}</p>
      <p>
        {address.city}, {address.state} {address.zipCode}
      </p>
      <p>{address.country}</p>
    </div>

    <div className="mt-4 pt-4 border-t border-gray-200">
      <p className="text-sm text-gray-500">
        Added {new Date(address.createdAt).toLocaleDateString()}
      </p>
    </div>
  </div>
);

// Main Addresses Tab Component
const AddressesTab: React.FC<AddressesTabProps> = ({ addresses, userId, onAddressUpdate }) => {
  const [setDefaultAddress, { loading: updatingDefault }] = useMutation(SET_DEFAULT_ADDRESS);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const handleAddressSuccess = () => {
    setShowAddressForm(false);
    // Optionally refresh addresses list or show success message
    console.log('Address created successfully!');
  };
  const handleMakeDefault = async (addressType: string) => {
    try {
      await setDefaultAddress({
        variables: {
          userId,
          addressId: addressType, // You might need to adjust this based on your actual address ID structure
        },
      });
      
      // Call the update callback if provided
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

  if (!addresses || addresses.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div>
        <button
        onClick={() => setShowAddressForm(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-5"
      >
        Add New Address
      </button>

      {showAddressForm && (
        <AddressForm
          userId={userId} // This should come from your auth context or props
          onSuccess={handleAddressSuccess}
          onCancel={() => setShowAddressForm(false)}
          onAddressUpdate={() => onAddressUpdate?.()}

          />
      )}
      </div>
        <div className="text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <p className="mt-4 text-lg">No addresses found</p>
          <p className="mt-2 text-gray-400">Add your first address to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manage Addresses</h2>
        <p className="text-gray-600 mt-2">
          {sortedAddresses.length} address(es) saved • Default address is used for shipping
        </p>
      </div>
      <div>
        <button
        onClick={() => setShowAddressForm(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-5"
      >
        Add New Address
      </button>

      {showAddressForm && (
        <AddressForm
          userId={userId} // This should come from your auth context or props
          onSuccess={handleAddressSuccess}
          onCancel={() => setShowAddressForm(false)}
          onAddressUpdate={() => onAddressUpdate?.()}
        />
      )}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {sortedAddresses.map((address, index) => (
          <AddressCard
            key={`${address.type}-${index}`}
            address={address}
            isDefault={address.isDefault}
            onMakeDefault={() => handleMakeDefault(address.id)}
          />
        ))}
      </div>

      {updatingDefault && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="text-gray-700">Updating default address...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressesTab;
