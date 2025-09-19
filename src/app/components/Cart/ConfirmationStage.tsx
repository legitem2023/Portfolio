import { CartItem, ShippingInfo, PaymentInfo } from './DeluxeCart';

interface ConfirmationStageProps {
  cartItems: CartItem[];
  shippingInfo: ShippingInfo;
  paymentInfo: PaymentInfo;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  onPlaceOrder: () => void;
  onBack: () => void;
}

const ConfirmationStage = ({ 
  cartItems, 
  shippingInfo, 
  paymentInfo, 
  subtotal, 
  shippingCost, 
  tax, 
  total, 
  onPlaceOrder, 
  onBack 
}: ConfirmationStageProps) => {
  return (
    <div>
      <h2 className="text-2xl font-serif font-bold text-indigo-900 mb-6 pb-2 border-b border-indigo-100">Order Confirmation</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-200">
          <h3 className="font-serif font-semibold text-lg text-indigo-900 mb-4 pb-2 border-b border-indigo-200">Order Summary</h3>
          <div className="mb-4">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center py-3 border-b border-indigo-100 last:border-0">
                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg border border-indigo-200" />
                <div className="ml-4 flex-1">
                  <h4 className="font-medium text-indigo-900">{item.name}</h4>
                  <p className="text-indigo-600 text-sm">Quantity: {item.quantity}</p>
                </div>
                <div className="font-medium text-indigo-900">${(item.price * item.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>
          
          <div className="pt-3 border-t border-indigo-200">
            <div className="flex justify-between py-2">
              <span className="text-indigo-700">Subtotal</span>
              <span className="font-medium text-indigo-900">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-indigo-700">Shipping</span>
              <span className="font-medium text-indigo-900">${shippingCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-indigo-700">Tax</span>
              <span className="font-medium text-indigo-900">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-3 font-bold border-t border-indigo-200">
              <span className="text-indigo-900">Total</span>
              <span className="text-indigo-700">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-200 mb-6">
            <h3 className="font-serif font-semibold text-lg text-indigo-900 mb-3 pb-2 border-b border-indigo-200">Shipping Information</h3>
            <div className="text-indigo-800">
              <p className="mb-1">{shippingInfo.fullName}</p>
              <p className="mb-1">{shippingInfo.address}</p>
              <p className="mb-1">{shippingInfo.city}, {shippingInfo.zipCode}</p>
              <p>{shippingInfo.country}</p>
            </div>
          </div>
          
          <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-200">
            <h3 className="font-serif font-semibold text-lg text-indigo-900 mb-3 pb-2 border-b border-indigo-200">Payment Information</h3>
            <div className="text-indigo-800">
              <p className="mb-1">Card ending in ****{paymentInfo.cardNumber.slice(-4)}</p>
              <p>Expires: {paymentInfo.expiryDate}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between">
        <button 
          className="px-6 py-3 border border-indigo-300 text-indigo-700 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
          onClick={onBack}
        >
          Back to Payment
        </button>
        <button 
          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-md"
          onClick={onPlaceOrder}
        >
          Place Order
        </button>
      </div>
    </div>
  );
};

export default ConfirmationStage;
