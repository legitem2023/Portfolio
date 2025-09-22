import { ChangeEvent, FormEvent } from 'react';
import { ShippingInfo } from './DeluxeCart';

interface ShippingStageProps {
  shippingInfo: ShippingInfo;
  setShippingInfo: (info: ShippingInfo) => void;
  onSubmit: (e: FormEvent) => void;
  onBack: () => void;
}

const ShippingStage = ({ shippingInfo, setShippingInfo, onSubmit, onBack }: ShippingStageProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setShippingInfo({
      ...shippingInfo,
      [e.target.name]: e.target.value
    });
  };
  
  return (
    <div>
      <h2 className="text-2xl font-serif font-bold text-indigo-900 mb-6 pb-2 border-b border-indigo-100">Shipping Information</h2>
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
            Continue
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShippingStage;
