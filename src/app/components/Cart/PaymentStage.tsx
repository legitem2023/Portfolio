import { ChangeEvent, FormEvent } from 'react';
import { PaymentInfo } from './DeluxeCart';

interface PaymentStageProps {
  paymentInfo: PaymentInfo;
  setPaymentInfo: (info: PaymentInfo) => void;
  onSubmit: (e: FormEvent) => void;
  onBack: () => void;
}

const PaymentStage = ({ paymentInfo, setPaymentInfo, onSubmit, onBack }: PaymentStageProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPaymentInfo({
      ...paymentInfo,
      [e.target.name]: e.target.value
    });
  };
  
  return (
    <div>
      <h2 className="text-2xl font-serif font-bold text-indigo-900 mb-6 pb-2 border-b border-indigo-100">Payment Information</h2>
      <form onSubmit={onSubmit}>
        <div className="mb-5">
          <label className="block text-indigo-800 font-medium mb-2">Card Number</label>
          <input
            type="text"
            name="cardNumber"
            value={paymentInfo.cardNumber}
            onChange={handleChange}
            placeholder="1234 5678 9012 3456"
            required
            className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
        
        <div className="mb-5">
          <label className="block text-indigo-800 font-medium mb-2">Card Holder</label>
          <input
            type="text"
            name="cardHolder"
            value={paymentInfo.cardHolder}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <div>
            <label className="block text-indigo-800 font-medium mb-2">Expiry Date</label>
            <input
              type="text"
              name="expiryDate"
              value={paymentInfo.expiryDate}
              onChange={handleChange}
              placeholder="MM/YY"
              required
              className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-indigo-800 font-medium mb-2">CVV</label>
            <input
              type="text"
              name="cvv"
              value={paymentInfo.cvv}
              onChange={handleChange}
              placeholder="123"
              required
              className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
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
            Continue
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentStage;
