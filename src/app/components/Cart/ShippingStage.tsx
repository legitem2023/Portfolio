import { ChangeEvent, FormEvent, useState,useEffect } from 'react';
import { ShippingInfo } from './DeluxeCart';
import { decryptToken } from '../../../../utils/decryptToken';

interface ShippingStageProps {
  shippingInfo: ShippingInfo;
  setShippingInfo: (info: ShippingInfo) => void;
  onSubmit: (e: FormEvent) => void;
  onBack: () => void;
}

// Temporary JSON database of saved addresses
const savedAddresses = [
  {
    id: 1,
    fullName: "John Smith",
    address: "123 Main Street",
    city: "New York",
    zipCode: "10001",
    country: "USA",
    isDefault: true,
    type: "Home"
  },
  {
    id: 2,
    fullName: "John Smith",
    address: "456 Office Park",
    city: "New York",
    zipCode: "10002",
    country: "USA",
    isDefault: false,
    type: "Work"
  },
  {
    id: 3,
    fullName: "Jane Smith",
    address: "789 Oak Avenue",
    city: "Los Angeles",
    zipCode: "90210",
    country: "USA",
    isDefault: false,
    type: "Parents"
  },
  {
    id: 4,
    fullName: "John Smith",
    address: "321 Business Center",
    city: "Chicago",
    zipCode: "60601",
    country: "USA",
    isDefault: false,
    type: "Office"
  }
];

const ShippingStage = ({ shippingInfo, setShippingInfo, onSubmit, onBack }: ShippingStageProps) => {
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(1); // Default to first address
  useEffect(() => {
    const getRole = async () => {
      try {
        const response = await fetch('/api/protected', {
          credentials: 'include' // Important: includes cookies
        });
        
        if (response.status === 401) {
          // Handle unauthorized access
          throw new Error('Unauthorized');
        }
        
        const data = await response.json();
        const token = data?.user;
        const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz";

        const payload = await decryptToken(token, secret.toString());
        console.log(payload);
      } catch (err) {
        console.error('Error getting role:', err);
      }
    };
    getRole();
  }, []);
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setShippingInfo({
      ...shippingInfo,
      [e.target.name]: e.target.value
    });
  };

  const handleAddressSelect = (address: any) => {
    setSelectedAddressId(address.id);
    setShippingInfo({
      addressId:address.id,
      fullName: address.fullName,
      address: address.address,
      city: address.city,
      zipCode: address.zipCode,
      country: address.country
    });
  };

  const handleUseNewAddress = () => {
    setSelectedAddressId(null);
    setShippingInfo({
      addressId:"",
      fullName: "",
      address: "",
      city: "",
      zipCode: "",
      country: ""
    });
  };
  
  return (
    <div>
      <h2 className="text-2xl font-serif font-bold text-indigo-900 mb-6 pb-2 border-b border-indigo-100">
        Shipping Information
      </h2>

      {/* Saved Addresses Section */}
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
                <p className="font-medium">{address.fullName}</p>
                <p>{address.address}</p>
                <p>{address.city}, {address.zipCode}</p>
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

      {/* Shipping Form */}
      <form onSubmit={onSubmit}>
        <div className="mb-5">
          <label className="block text-indigo-800 font-medium mb-2">Full Name</label>
          <input
            type="text"
            name="fullName"
            value={shippingInfo.fullName}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="Enter full name"
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
