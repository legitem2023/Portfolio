'use client';
import { useState, ReactNode, useEffect } from 'react';
import { gql, useMutation } from '@apollo/client';
import { useSession } from 'next-auth/react';
import { MoreVertical, Edit2, Trash2, MapPin, Home, Building2, Package, CreditCard, Globe, X, CheckCircle, AlertCircle } from 'lucide-react';
import AddressForm from './Addresses/AddressForm';
import EditAddressForm from './Addresses/EditAddressForm';
import { SET_DEFAULT_ADDRESS } from './graphql/mutation';

// Types
export interface Address {
  id: string;
  userId: string;
  type: string;
  receiver?: string;
  phone?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  lat?: number;
  lng?: number;
}

interface AddressesTabProps {
  addresses: Address[];
  userId: string;
  onAddressUpdate: () => void;
  onTokenUpdate?: (newToken: string) => void;
}

// Delete Address Mutation
const DELETE_ADDRESS = gql`
  mutation DeleteAddress($id: ID!) {
    deleteAddress(id: $id) {
      statusText
    }
  }
`;

// Get address type icon
const getAddressTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'home':
      return <Home className="w-3 h-3" />;
    case 'work':
      return <Building2 className="w-3 h-3" />;
    case 'shipping':
      return <Package className="w-3 h-3" />;
    case 'billing':
      return <CreditCard className="w-3 h-3" />;
    default:
      return <MapPin className="w-3 h-3" />;
  }
};

// Professional Address Card Component with Dropdown Menu
const AddressCard: React.FC<{
  address: Address;
  onMakeDefault: (id: any) => void;
  onDelete: (id: string) => void;
  onEdit: (address: Address) => void;
  isDefault: boolean;
  isDeleting?: boolean;
}> = ({ address, onMakeDefault, onDelete, onEdit, isDefault, isDeleting }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen && !(event.target as Element).closest('.menu-container')) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  return (
    <div className={`
      relative rounded-xl transition-all duration-200 ease-in-out
      ${isDefault 
        ? 'border-2 border-blue-500 bg-gradient-to-br from-blue-50/50 to-white shadow-md' 
        : 'border border-gray-200 bg-white hover:shadow-lg hover:border-gray-300'
      }
      ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
    `}>
      {/* Status Badge - Top Left Corner */}
      <div className="absolute -top-2 -left-2 flex gap-1">
        {isDefault && (
          <span className="px-2.5 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full shadow-sm flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Default
          </span>
        )}
        <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full capitalize shadow-sm flex items-center gap-1">
          {getAddressTypeIcon(address.type)}
          {address.type}
        </span>
      </div>

      {/* Three Dots Menu Button - Top Right Corner */}
      <div className="absolute -top-2 -right-2 menu-container">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          disabled={isDeleting}
          className="p-1.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-700 rounded-full shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-300"
          title="More options"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 animate-in fade-in zoom-in-95 duration-100">
            {/* Edit Option */}
            <button
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors duration-150"
              onClick={() => {
                onEdit(address);
                setIsMenuOpen(false);
              }}
            >
              <Edit2 className="w-4 h-4" />
              Edit Address
            </button>

            {/* Divider */}
            <div className="border-t border-gray-100 my-1"></div>

            {/* Delete Option */}
            <button
              onClick={() => {
                onDelete(address.id);
                setIsMenuOpen(false);
              }}
              disabled={isDeleting}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors duration-150"
            >
              <Trash2 className="w-4 h-4" />
              Delete Address
            </button>
          </div>
        )}
      </div>

      {/* Card Content - Reduced padding */}
      <div className="p-4 pt-5">
        {/* Receiver and Phone */}
        {(address.receiver || address.phone) && (
          <div className="mb-3 pb-2 border-b border-gray-100">
            {address.receiver && (
              <p className="text-sm font-medium text-gray-700">
                {address.receiver}
              </p>
            )}
            {address.phone && (
              <p className="text-xs text-gray-500 mt-0.5">
                {address.phone}
              </p>
            )}
          </div>
        )}

        {/* Address Details */}
        <div className="space-y-1.5 mb-3">
          <p className="font-semibold text-gray-800 text-sm leading-relaxed">
            {address.street}
          </p>
          <p className="text-gray-600 text-sm">
            {address.city}, {address.state} {address.zipCode}
          </p>
          <p className="text-gray-600 text-sm flex items-center gap-1">
            <Globe className="w-3 h-3" />
            {address.country}
          </p>
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
};

// Confirmation Modal Component
const ConfirmDeleteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  addressType: string;
}> = ({ isOpen, onClose, onConfirm, addressType }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Delete Address</h3>
        </div>
        
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete your {addressType} address? This action cannot be undone.
        </p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Toast Notification Component
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ 
  message, 
  type, 
  onClose 
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-300`}>
      <div className={`rounded-lg shadow-lg p-4 ${
        type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center gap-2">
          {type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <p className={`text-sm font-medium ${
            type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

// Main Addresses Tab Component
const AddressesTab: React.FC<AddressesTabProps> = ({ 
  addresses, 
  userId, 
  onAddressUpdate,
  onTokenUpdate 
}) => {
  const { update: updateSession, data: session } = useSession();
  const [setDefaultAddress, { loading: updatingDefault }] = useMutation(SET_DEFAULT_ADDRESS);
  const [deleteAddress, { loading: deletingAddress }] = useMutation(DELETE_ADDRESS);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Helper function to refresh session data and sync with useAuth
  const refreshSession = async (newToken?: string) => {
    try {
      setIsRefreshing(true);
      
      if (newToken) {
        // Update NextAuth session with new token
        await updateSession({
          serverToken: newToken,
          user: session?.user
        });
        
        // Notify parent component about token update
        if (onTokenUpdate) {
          onTokenUpdate(newToken);
        }
        
        // Dispatch custom event for useAuth hook to listen to
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth-token-updated', { 
            detail: { token: newToken } 
          }));
        }
      } else {
        // Just refresh existing session
        await updateSession();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddressSuccess = async () => {
    setShowAddressForm(false);
    await refreshSession();
    onAddressUpdate?.();
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setShowEditForm(true);
  };

  const handleEditSuccess = async (result: any) => {
    console.log("✅ Address edit successful");
    
    // Refresh session with new token if provided
    if (result?.token) {
      await refreshSession(result.token);
    } else {
      await refreshSession();
    }
    
    setShowEditForm(false);
    setEditingAddress(null);
    onAddressUpdate?.();
    showToast('Address updated successfully', 'success');
  };

  const handleEditCancel = () => {
    setShowEditForm(false);
    setEditingAddress(null);
  };

  const handleMakeDefault = async (addressId: string) => {
    if (isRefreshing) {
      showToast('Please wait, updating session...', 'error');
      return;
    }

    try {
      const response = await setDefaultAddress({
        variables: {
          userId,
          addressId: addressId,
        },
      });

      const result = response.data?.setDefaultAddress;
      
      // Check if mutation returned a new token
      if (result?.token) {
        // Update session with the new token
        await refreshSession(result.token);
        showToast('Default address updated and session synced successfully', 'success');
      } else if (result?.user) {
        // If no token but user data returned, just refresh
        await refreshSession();
        showToast('Default address updated successfully', 'success');
      } else {
        // Just refresh to get latest data
        await refreshSession();
        showToast('Default address updated successfully', 'success');
      }
      
      onAddressUpdate?.();
      
    } catch (error: any) {
      console.error('Error setting default address:', error);
      showToast(error.message || 'Failed to update default address', 'error');
    }
  };

  const handleDeleteClick = (address: Address) => {
    if (address.isDefault) {
      showToast('Cannot delete default address. Set another address as default first.', 'error');
      return;
    }
    setAddressToDelete(address);
  };

  const handleConfirmDelete = async () => {
    if (!addressToDelete) return;

    try {
      const response = await deleteAddress({
        variables: { id: addressToDelete.id },
        update: (cache) => {
          cache.modify({
            fields: {
              addresses(existingAddresses = [], { readField }) {
                return existingAddresses.filter(
                  (addressRef: any) => readField('id', addressRef) !== addressToDelete.id
                );
              },
            },
          });
        },
      });

      if (response.data?.deleteAddress?.statusText === "Successful deleted") {
        // Refresh session after deletion
        await refreshSession();
        showToast(`${addressToDelete.type} address deleted successfully`, 'success');
        setAddressToDelete(null);
        onAddressUpdate?.();
      }
    } catch (error: any) {
      console.error('Error deleting address:', error);
      showToast(error.message || 'Failed to delete address', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  // Sort addresses: default first, then by creation date
  const sortedAddresses = [...addresses].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Loading State
  if (updatingDefault || deletingAddress || isRefreshing) {
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-700 font-medium">
              {deletingAddress ? 'Deleting address...' : 
               isRefreshing ? 'Updating session...' : 
               'Updating default address...'}
            </p>
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
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-md text-sm font-medium flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
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
          <MapPin className="w-16 h-16 mx-auto text-gray-300" />
          <p className="mt-4 text-gray-600 font-medium">No addresses found</p>
          <p className="mt-1 text-gray-400 text-sm">Add your first address to get started</p>
        </div>

        {/* Toast Notifications */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
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
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-md text-sm font-medium whitespace-nowrap flex items-center gap-2"
          >
            {showAddressForm ? (
              <>
                <X className="w-4 h-4" />
                Cancel
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                + Add New Address
              </>
            )}
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

      {/* Edit Address Modal */}
      {showEditForm && editingAddress && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="max-w-2xl w-full my-8">
            <EditAddressForm
              address={editingAddress}
              onSuccess={handleEditSuccess}
              onCancel={handleEditCancel}
              onAddressUpdate={onAddressUpdate}
            />
          </div>
        </div>
      )}

      {/* Address Cards Grid */}
      <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
        {sortedAddresses.map((address, index) => (
          <AddressCard
            key={`${address.id}-${index}`}
            address={address}
            isDefault={address.isDefault}
            onMakeDefault={() => handleMakeDefault(address.id)}
            onDelete={() => handleDeleteClick(address)}
            onEdit={() => handleEditAddress(address)}
            isDeleting={deletingAddress}
          />
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!addressToDelete}
        onClose={() => setAddressToDelete(null)}
        onConfirm={handleConfirmDelete}
        addressType={addressToDelete?.type || ''}
      />

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AddressesTab;
