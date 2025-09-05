// components/PaymentStep.tsx
import React from 'react';
import { CreditCard, Shield } from 'lucide-react';
import { PaymentMethod } from './DeluxeCheckout';

interface PaymentStepProps {
  paymentMethod: PaymentMethod;
  handlePaymentChange: (method: PaymentMethod['type']) => void;
}

const PaymentStep: React.FC<PaymentStepProps> = ({ paymentMethod, handlePaymentChange }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Method</h2>
      
      {/* Payment options same as before */}
      {/* ... */}

      <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-100">
        <div className="flex items-start">
          <Shield size={20} className="text-green-600 mr-2 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-700">Secure Payment</h3>
            <p className="text-sm text-green-600 mt-1">Your payment information is encrypted and secure</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentStep;
