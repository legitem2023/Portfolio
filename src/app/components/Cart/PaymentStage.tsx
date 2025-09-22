import { ChangeEvent, FormEvent, useState } from 'react';
import { PaymentInfo } from './DeluxeCart';

interface PaymentStageProps {
  paymentInfo: PaymentInfo;
  setPaymentInfo: (info: PaymentInfo) => void;
  onSubmit: (e: FormEvent) => void;
  onBack: () => void;
}

// Payment method types
type PaymentMethod = 'gcash' | 'bank' | 'cod';

const PaymentStage = ({ paymentInfo, setPaymentInfo, onSubmit, onBack }: PaymentStageProps) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('gcash');

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPaymentInfo({
      ...paymentInfo,
      [e.target.name]: e.target.value
    });
  };

  const handleMethodChange = (method: PaymentMethod) => {
    setSelectedMethod(method);
    // Clear previous payment details when switching methods
    setPaymentInfo({
      method: method,
      cardNumber: '',
      cardHolder: '',
      expiryDate: '',
      cvv: '',
      gcashNumber: '',
      bankName: '',
      accountNumber: '',
      accountName: ''
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Set the selected method before submitting
    setPaymentInfo({
      ...paymentInfo,
      method: selectedMethod
    });
    onSubmit(e);
  };
  
  return (
    <div>
      <h2 className="text-2xl font-serif font-bold text-indigo-900 mb-6 pb-2 border-b border-indigo-100">
        Payment Method
      </h2>
      
      {/* Payment Method Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-indigo-800 mb-4">Choose Payment Method</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* GCash Option */}
          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
              selectedMethod === 'gcash'
                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                : 'border-indigo-200 hover:border-indigo-300 hover:bg-indigo-25'
            }`}
            onClick={() => handleMethodChange('gcash')}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full border-2 ${
                selectedMethod === 'gcash' ? 'bg-indigo-500 border-indigo-500' : 'border-indigo-300'
              }`}></div>
              <div>
                <div className="font-semibold text-indigo-900">GCash</div>
                <div className="text-sm text-indigo-600">Mobile Payment</div>
              </div>
            </div>
            {selectedMethod === 'gcash' && (
              <div className="mt-3 text-xs text-indigo-500">
                Pay using your GCash mobile wallet
              </div>
            )}
          </div>

          {/* Bank Transfer Option */}
          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
              selectedMethod === 'bank'
                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                : 'border-indigo-200 hover:border-indigo-300 hover:bg-indigo-25'
            }`}
            onClick={() => handleMethodChange('bank')}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full border-2 ${
                selectedMethod === 'bank' ? 'bg-indigo-500 border-indigo-500' : 'border-indigo-300'
              }`}></div>
              <div>
                <div className="font-semibold text-indigo-900">Bank Transfer</div>
                <div className="text-sm text-indigo-600">Online Banking</div>
              </div>
            </div>
            {selectedMethod === 'bank' && (
              <div className="mt-3 text-xs text-indigo-500">
                Transfer via online banking
              </div>
            )}
          </div>

          {/* COD Option */}
          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
              selectedMethod === 'cod'
                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                : 'border-indigo-200 hover:border-indigo-300 hover:bg-indigo-25'
            }`}
            onClick={() => handleMethodChange('cod')}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full border-2 ${
                selectedMethod === 'cod' ? 'bg-indigo-500 border-indigo-500' : 'border-indigo-300'
              }`}></div>
              <div>
                <div className="font-semibold text-indigo-900">Cash on Delivery</div>
                <div className="text-sm text-indigo-600">Pay when delivered</div>
              </div>
            </div>
            {selectedMethod === 'cod' && (
              <div className="mt-3 text-xs text-indigo-500">
                Pay cash when you receive your order
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Form Based on Selection */}
      <form onSubmit={handleSubmit}>
        {/* GCash Form */}
        {selectedMethod === 'gcash' && (
          <div className="space-y-5">
            <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 mb-4">
              <p className="text-indigo-700 text-sm">
                You will be redirected to GCash to complete your payment after placing the order.
              </p>
            </div>
            
            <div className="mb-5">
              <label className="block text-indigo-800 font-medium mb-2">GCash Registered Mobile Number</label>
              <input
                type="tel"
                name="gcashNumber"
                value={paymentInfo.gcashNumber || ''}
                onChange={handleChange}
                placeholder="09XX XXX XXXX"
                required
                className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
              <p className="text-xs text-indigo-600 mt-1">Enter the mobile number linked to your GCash account</p>
            </div>
          </div>
        )}

        {/* Bank Transfer Form */}
        {selectedMethod === 'bank' && (
          <div className="space-y-5">
            <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 mb-4">
              <p className="text-indigo-700 text-sm">
                We will provide bank details for transfer after you place the order.
              </p>
            </div>
            
            <div className="mb-5">
              <label className="block text-indigo-800 font-medium mb-2">Bank Name</label>
              <select
                name="bankName"
                value={paymentInfo.bankName || ''}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
              >
                <option value="">Select Your Bank</option>
                <option value="BDO">BDO Unibank</option>
                <option value="BPI">BPI</option>
                <option value="Metrobank">Metrobank</option>
                <option value="UnionBank">UnionBank</option>
                <option value="Landbank">Landbank</option>
                <option value="PNB">PNB</option>
                <option value="Security Bank">Security Bank</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-indigo-800 font-medium mb-2">Account Number</label>
                <input
                  type="text"
                  name="accountNumber"
                  value={paymentInfo.accountNumber || ''}
                  onChange={handleChange}
                  placeholder="Enter account number"
                  required
                  className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-indigo-800 font-medium mb-2">Account Name</label>
                <input
                  type="text"
                  name="accountName"
                  value={paymentInfo.accountName || ''}
                  onChange={handleChange}
                  placeholder="Account holder name"
                  required
                  className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* COD Information */}
        {selectedMethod === 'cod' && (
          <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-lg mb-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">✓</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-green-900 mb-2">Cash on Delivery Selected</h4>
                <p className="text-green-700 text-sm">
                  You will pay with cash when your order is delivered. Please have the exact amount ready.
                  A small processing fee may apply for COD orders.
                </p>
                <div className="mt-3 p-3 bg-green-100 rounded-md">
                  <p className="text-green-800 text-sm font-medium">
                    Expected Delivery: 3-5 business days
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Terms and Conditions */}
        <div className="mb-8">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="terms"
              required
              className="mt-1 w-4 h-4 text-indigo-600 border-indigo-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="terms" className="text-sm text-indigo-700">
              I agree to the terms and conditions and authorize the processing of my payment information.
            </label>
          </div>
        </div>
        
        <div className="flex justify-between">
          <button 
            type="button" 
            className="px-6 py-3 border border-indigo-300 text-indigo-700 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
            onClick={onBack}
          >
            Back to Shipping
          </button>
          <button 
            type="submit" 
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-md"
          >
            {selectedMethod === 'cod' ? 'Place Order' : 'Continue to Payment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentStage;
