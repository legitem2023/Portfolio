import { ChangeEvent, FormEvent, useState, useEffect } from 'react';
import { ShippingInfo } from './DeluxeCart';
import { useQuery } from '@apollo/client';
import { GET_USER_PROFILE } from '../graphql/query';
import ShippingStageShimmer from './ShippingStageShimmer';

interface ShippingStageProps {
  shippingInfo: ShippingInfo;
  setShippingInfo: (info: ShippingInfo) => void;
  onSubmit: (e: FormEvent) => void;
  onBack: () => void;
  userId: string;
}

interface Address {
  id: string;
  city: string;
  country: string;
  createdAt: string;
  isDefault: boolean;
  state: string;
  street: string;
  type: string;
  userId: string;
  zipCode: string;
}

const ShippingStage = ({ shippingInfo, setShippingInfo, onSubmit, onBack, userId }: ShippingStageProps) => {
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  
  // GraphQL query to fetch user addresses
  const { data, loading, error, refetch } = useQuery(GET_USER_PROFILE, {
    variables: { id: userId },
  });
  
  // Extract addresses from GraphQL response
  const savedAddresses: Address[] = data?.user.addresses || data?.user?.addresses || [];

  // Set default address when data loads
  useEffect(() => {
    if (savedAddresses.length > 0) {
      const defaultAddress = savedAddresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        setShippingInfo({
          addressId: defaultAddress.id,
          receiver: defaultAddress.receiver, // Changed from fullName to receiver
          address: defaultAddress.street,
          city: defaultAddress.city,
          zipCode: defaultAddress.zipCode,
          country: defaultAddress.country,
          state: defaultAddress.state
        });
      }
    }
  }, [savedAddresses, setShippingInfo]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setShippingInfo({
      ...shippingInfo,
      [e.target.name]: e.target.value
    });
  };

  const handleAddressSelect = (address: Address) => {
    setSelectedAddressId(address.id);
    setShippingInfo({
      addressId: address.id,
      receiver: address.receiver, // Changed from fullName to receiver
      address: address.street,
      city: address.city,
      zipCode: address.zipCode,
      country: address.country,
      state: address.state
    });
  };

  const handleUseNewAddress = () => {
    setSelectedAddressId(null);
    setShippingInfo({
      addressId: "",
      receiver: "", // Changed from fullName to receiver
      address: "",
      city: "",
      zipCode: "",
      country: "",
      state: ""
    });
  };

  if (loading) {
    return <ShippingStageShimmer/>;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-red-600">Error loading addresses: {error.message}</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-serif font-bold text-indigo-900 mb-6 pb-2 border-b border-indigo-100">
        Shipping Information
      </h2>

      {/* Saved Addresses Section - Only show if we have saved addresses */}
      {savedAddresses.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-indigo-800 mb-4">Select a saved address</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {savedAddresses.map((address) => (
              <div
                key={address.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  selectedAddressId === address.id
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : 'border-indigo-200 hover:border-indigo-300 hover:bg-indigo-25'
                }`}
                onClick={() => handleAddressSelect(address)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-indigo-900">{address.type}</span>
                    {address.isDefault && (
                      <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  {selectedAddressId === address.id && (
                    <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                  )}
                </div>
                
                <div className="text-sm text-indigo-700">
                  <p className="font-medium">{/* Add user name here if available */}</p>
                  <p>{address.street}</p>
                  <p>{address.city}, {address.state} {address.zipCode}</p>
                  <p>{address.country}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleUseNewAddress}
            className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center space-x-1 transition-colors"
          >
            <span>+ Use a new address</span>
          </button>
        </div>
      )}

      {/* Shipping Form */}
      <form onSubmit={onSubmit}>
        <div className="mb-5">
          <label className="block text-indigo-800 font-medium mb-2">Receiver Name</label> {/* Updated label */}
          <input
            type="text"
            name="receiver" {/* Updated name */}
            value={shippingInfo.receiver} {/* Updated value */}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="Enter receiver's name" {/* Updated placeholder */}
          />
        </div>
        
        <div className="mb-5">
          <label className="block text-indigo-800 font-medium mb-2">Address</label>
          <input
            type="text"
            name="address"
            value={shippingInfo.address}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="Enter street address"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="block text-indigo-800 font-medium mb-2">City</label>
            <input
              type="text"
              name="city"
              value={shippingInfo.city}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Enter city"
            />
          </div>
          <div>
            <label className="block text-indigo-800 font-medium mb-2">ZIP Code</label>
            <input
              type="text"
              name="zipCode"
              value={shippingInfo.zipCode}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Enter ZIP code"
            />
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-indigo-800 font-medium mb-2">State/Province</label>
          <input
            type="text"
            name="state"
            value={shippingInfo.state || ''}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="Enter state or province"
          />
        </div>
        
        <div className="mb-8">
          <label className="block text-indigo-800 font-medium mb-2">Country</label>
          <select
            name="country"
            value={shippingInfo.country}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
          >
            <option value="">Select Country</option>
            <option value="USA">United States</option>
            <option value="UK">United Kingdom</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="JP">Japan</option>
            <option value="Philippines">Philippines</option>
          </select>
        </div>
        
        <div className="flex justify-between">
          <button 
            type="button" 
            className="px-6 py-3 border border-indigo-300 text-indigo-700 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
            onClick={onBack}
          >
            Back
          </button>
          <button 
            type="submit" 
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-md"
          >
            Continue to Payment
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShippingStage;
