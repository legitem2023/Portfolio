// components/ConfirmationStep.tsx
import React from 'react';
import { CheckCircle } from 'lucide-react';

const ConfirmationStep: React.FC = () => {
  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={40} className="text-emerald-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
      <p className="text-gray-600 mb-6">Thank you for your purchase. Your order has been placed successfully.</p>
      
      <div className="bg-gray-50 rounded-xl p-6 max-w-md mx-auto">
        <h3 className="font-semibold text-gray-900 mb-4">Order Details</h3>
        
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Order Number:</span>
          <span className="font-medium">#123456</span>
        </div>
        
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Estimated Delivery:</span>
          <span className="font-medium">May 15-18, 2023</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Total Amount:</span>
          <span className="font-medium">$593.97</span>
        </div>
      </div>
      
      <div className="mt-8">
        <p className="text-gray-600">A confirmation email has been sent to your email address.</p>
      </div>
    </div>
  );
};

export default ConfirmationStep;
