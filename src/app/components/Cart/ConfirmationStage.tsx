'use client';
import { useMutation } from '@apollo/client';
import { CartItem, ShippingInfo, PaymentInfo } from './DeluxeCart';
import { CREATE_ORDER } from '../graphql/mutation'; 

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
  userId: string;
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
  onBack,
  userId
}: ConfirmationStageProps) => {
  const [createOrder, { loading, error }] = useMutation(CREATE_ORDER);

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

  const handlePlaceOrder = async () => {
    try {
      const orderItems = cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price
      }));
      const OrderParams = {
        userId: userId,
        addressId: shippingInfo.addressId,
        items: orderItems
      }
      
      console.table(OrderParams);
      const result = await createOrder({
        variables: OrderParams
      });

      // Handle successful order creation
      /* if (result.data?.createOrder) {
        console.log('Order created successfully:', result.data.createOrder);
        onPlaceOrder();
      } */
    } catch (err) {
      console.error('Error creating order:', err);
    }
  };

  const paymentDisplay = getPaymentMethodDisplay();

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="py-4 sm:py-6 lg:py-8">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-indigo-900">Order Confirmation</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Review your order before placing</p>
        </div>
        
        {/* Alerts */}
        <div className="space-y-4 mb-6 sm:mb-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold text-xs sm:text-sm">!</span>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-red-800 font-semibold text-sm">Order Error</h3>
                  <p className="text-red-700 text-xs sm:text-sm mt-1">
                    There was a problem placing your order. Please try again.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-xs sm:text-sm">✓</span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-green-800 font-semibold text-sm">Ready to place your order!</h3>
                <p className="text-green-700 text-xs sm:text-sm mt-1">
                  Please review your order details below before confirming.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-6 xl:gap-8">
          {/* Order Items - Mobile First Stack, Desktop Grid */}
          <section className="lg:col-span-7 xl:col-span-8 mb-6 lg:mb-0">
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Items ({cartItems.length})</h3>
              
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-start space-x-3 sm:space-x-4 p-3 bg-white rounded-lg border border-gray-200">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.images?.[0] ?? '/NoImage.webp'}
                        alt={item.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover object-center rounded-md"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div className="flex-1">
                          <h4 className="text-sm sm:text-base font-medium text-gray-900 line-clamp-2">
                            {item.name}
                          </h4>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {item.color && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                Color: {item.color}
                              </span>
                            )}
                            {item.size && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                Size: {item.size}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            ₱{item.price.toFixed(2)} × {item.quantity}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between sm:flex-col sm:items-end sm:space-y-1">
                          <p className="text-base font-semibold text-gray-900">
                            ₱{(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Order Summary & Information */}
          <section className="lg:col-span-5 xl:col-span-4">
            <div className="space-y-4 sm:space-y-6">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span className="text-sm font-medium text-gray-900">₱{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Shipping</span>
                    <span className="text-sm font-medium text-gray-900">₱{shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Tax</span>
                    <span className="text-sm font-medium text-gray-900">₱{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="text-base font-semibold text-gray-900">Total</span>
                    <span className="text-base font-semibold text-gray-900">₱{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Information */}
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Shipping Address</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p className="font-medium text-gray-900">{shippingInfo.fullName}</p>
                  <p className="leading-relaxed">{shippingInfo.address}</p>
                  <p>{shippingInfo.city}, {shippingInfo.zipCode}</p>
                  <p>{shippingInfo.country}</p>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Method</h3>
                <div className="flex items-start space-x-3">
                  <span className="text-lg flex-shrink-0">{paymentDisplay.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">{paymentDisplay.method}</p>
                    <p className="text-gray-600 text-sm mt-1">{paymentDisplay.details}</p>
                    {paymentInfo.method === 'bank' && paymentInfo.accountName && (
                      <p className="text-gray-600 text-sm mt-1">Account: {paymentInfo.accountName}</p>
                    )}
                    {paymentInfo.method === 'cod' && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-yellow-700 text-xs sm:text-sm">
                          Please have exact amount ready for delivery.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Important Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 pt-0.5">
                    <span className="text-blue-500 text-sm">ℹ️</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-blue-700 leading-relaxed">
                      <strong>Important:</strong> By placing this order, you agree to our terms and conditions. 
                      {paymentInfo.method === 'cod' ? ' Pay upon delivery.' : ' Payment processed immediately.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Action Buttons - Fixed bottom on mobile, normal flow on desktop */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 mt-8 py-4 sm:py-6 lg:relative lg:bg-transparent lg:border-t-0 lg:mt-8 lg:pt-8">
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <span className="mr-2">←</span>
              Back to Payment
            </button>
            
            <div className="text-center sm:text-right">
              <div className="flex items-center justify-center sm:justify-end space-x-2 mb-3">
                <span className="text-sm text-gray-600">Total:</span>
                <span className="text-lg font-bold text-gray-900">₱{total.toFixed(2)}</span>
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full sm:w-auto bg-indigo-600 border border-transparent rounded-md shadow-sm px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Placing Order...
                  </span>
                ) : (
                  'Place Order'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationStage;
