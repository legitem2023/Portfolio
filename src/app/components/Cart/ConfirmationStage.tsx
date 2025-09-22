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
  
  // Format payment method for display
  const getPaymentMethodDisplay = () => {
    switch (paymentInfo.method) {
      case 'gcash':
        return {
          method: 'GCash',
          details: `Mobile: ${paymentInfo.gcashNumber || 'Not provided'}`,
          icon: '📱'
        };
      case 'bank':
        return {
          method: 'Bank Transfer',
          details: `${paymentInfo.bankName || 'No bank selected'} - ${paymentInfo.accountNumber || 'No account number'}`,
          icon: '🏦'
        };
      case 'cod':
        return {
          method: 'Cash on Delivery',
          details: 'Pay when you receive your order',
          icon: '💵'
        };
      default:
        return {
          method: 'Not selected',
          details: 'Please go back and select a payment method',
          icon: '❓'
        };
    }
  };

  const paymentDisplay = getPaymentMethodDisplay();

  return (
    <div>
      <h2 className="text-2xl font-serif font-bold text-indigo-900 mb-6 pb-2 border-b border-indigo-100">
        Order Confirmation
      </h2>
      
      {/* Success Alert */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold text-lg">✓</span>
            </div>
          </div>
          <div className="ml-3">
            <h3 className="text-green-800 font-semibold">Ready to place your order!</h3>
            <p className="text-green-700 text-sm mt-1">
              Please review your order details below before confirming.
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Order Summary */}
        <div className="lg:col-span-2 bg-white border border-indigo-200 rounded-xl shadow-sm">
          <div className="p-6 border-b border-indigo-100">
            <h3 className="font-serif font-semibold text-lg text-indigo-900">Order Items</h3>
          </div>
          <div className="p-6">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center py-4 border-b border-indigo-100 last:border-0">
                <img 
                  src={item.image || '/NoImage.webp'} 
                  alt={item.name} 
                  className="w-16 h-16 object-cover rounded-lg border border-indigo-200" 
                />
                <div className="ml-4 flex-1">
                  <h4 className="font-medium text-indigo-900">{item.name}</h4>
                  <p className="text-indigo-600 text-sm mt-1 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-indigo-700 text-sm">Qty: {item.quantity}</span>
                    <span className="text-indigo-700 font-medium">${item.price.toFixed(2)} each</span>
                  </div>
                </div>
                <div className="font-semibold text-indigo-900 text-lg ml-4">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Order Details Sidebar */}
        <div className="space-y-6">
          {/* Shipping Information */}
          <div className="bg-white border border-indigo-200 rounded-xl shadow-sm">
            <div className="p-6 border-b border-indigo-100">
              <h3 className="font-serif font-semibold text-lg text-indigo-900 flex items-center">
                <span className="mr-2">🚚</span>
                Shipping Address
              </h3>
            </div>
            <div className="p-6">
              <div className="text-indigo-800 space-y-2">
                <p className="font-medium">{shippingInfo.fullName}</p>
                <p className="text-sm">{shippingInfo.address}</p>
                <p className="text-sm">{shippingInfo.city}, {shippingInfo.zipCode}</p>
                <p className="text-sm">{shippingInfo.country}</p>
              </div>
            </div>
          </div>
          
          {/* Payment Information */}
          <div className="bg-white border border-indigo-200 rounded-xl shadow-sm">
            <div className="p-6 border-b border-indigo-100">
              <h3 className="font-serif font-semibold text-lg text-indigo-900 flex items-center">
                <span className="mr-2">{paymentDisplay.icon}</span>
                Payment Method
              </h3>
            </div>
            <div className="p-6">
              <div className="text-indigo-800 space-y-2">
                <p className="font-medium">{paymentDisplay.method}</p>
                <p className="text-sm">{paymentDisplay.details}</p>
                {paymentInfo.method === 'bank' && paymentInfo.accountName && (
                  <p className="text-sm">Account: {paymentInfo.accountName}</p>
                )}
                {paymentInfo.method === 'cod' && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-700 text-xs">
                      Please have exact amount ready for the delivery personnel.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Order Total */}
          <div className="bg-white border border-indigo-200 rounded-xl shadow-sm">
            <div className="p-6 border-b border-indigo-100">
              <h3 className="font-serif font-semibold text-lg text-indigo-900">Order Total</h3>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                <div className="flex justify-between text-indigo-700">
                  <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-indigo-700">
                  <span>Shipping</span>
                  <span>${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-indigo-700">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-indigo-200 pt-3 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span className="text-indigo-900">Total</span>
                    <span className="text-indigo-700">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Important Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            <span className="text-blue-500 text-lg">ℹ️</span>
          </div>
          <div className="ml-3">
            <p className="text-blue-800 text-sm">
              <strong>Important:</strong> By placing this order, you agree to our terms and conditions. 
              {paymentInfo.method === 'cod' ? ' You will pay the exact amount upon delivery.' : ' Your payment will be processed immediately.'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-indigo-100">
        <button 
          className="px-8 py-3 border border-indigo-300 text-indigo-700 rounded-lg font-medium hover:bg-indigo-50 transition-colors flex items-center space-x-2"
          onClick={onBack}
        >
          <span>←</span>
          <span>Back to Payment</span>
        </button>
        
        <div className="text-right">
          <div className="text-sm text-indigo-600 mb-2">
            Order Total: <span className="font-bold text-lg text-indigo-700">${total.toFixed(2)}</span>
          </div>
          <button 
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
            onClick={onPlaceOrder}
          >
            <span>✅</span>
            <span>Place Order</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationStage;
