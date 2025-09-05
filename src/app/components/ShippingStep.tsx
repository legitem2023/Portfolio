// components/ShippingStep.tsx
import React from 'react';
import { Truck } from 'lucide-react';
import { ShippingAddress } from './DeluxeCheckout';

interface ShippingStepProps {
  shippingAddress: ShippingAddress;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const ShippingStep: React.FC<ShippingStepProps> = ({ shippingAddress, handleInputChange }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Information</h2>
      
      <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Form fields same as before */}
        {/* ... */}
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex items-start">
          <Truck size={20} className="text-blue-600 mr-2 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-700">Free Express Shipping</h3>
            <p className="text-sm text-blue-600 mt-1">Your order will arrive in 2-3 business days</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingStep;
