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
  userId: string; // Add userId to props
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
  userId // Receive userId from props
}: ConfirmationStageProps) => {
  // Use the mutation hook
  const [createOrder, { loading, error }] = useMutation(CREATE_ORDER);

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

  // Enhanced place order function that uses the mutation
  const handlePlaceOrder = async () => {
    try {
      // Transform cart items to match OrderItemInput format
      const orderItems = cartItems.map(item => ({
        productId: item.id, // Assuming item.id is the product ID
        quantity: item.quantity,
        price: item.price
      }));
      const OrderParams = {
        userId: userId,
        addressId: shippingInfo.addressId, // You'll need to add addressId to your ShippingInfo interface
        items: orderItems
      }
      
      console.table(OrderParams);
      // Execute the mutation
      const result = await createOrder({
        variables: OrderParams
      });

      // Handle successful order creation
   /*   if (result.data?.createOrder) {
        console.log('Order created successfully:', result.data.createOrder);
        // You might want to pass the order data to the parent component
        onPlaceOrder(); // Call the original onPlaceOrder callback
      }*/
    } catch (err) {
      console.error('Error creating order:', err);
      // Handle error (show error message to user, etc.)
    }
  };

  const paymentDisplay = getPaymentMethodDisplay();

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-serif font-bold text-indigo-900 mb-8">Order Confirmation</h2>
        
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold text-sm">!</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-red-800 font-semibold text-sm">Order Error</h3>
                <p className="text-red-700 text-xs mt-1">
                  There was a problem placing your order. Please try again.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Alert */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">✓</span>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-green-800 font-semibold text-sm">Ready to place your order!</h3>
              <p className="text-green-700 text-xs mt-1">
                Please review your order details below before confirming.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start xl:gap-x-16">
          {/* Order Items Section */}
          <section aria-labelledby="cart-heading" className="lg:col-span-7">
            <h2 id="cart-heading" className="sr-only">Items in your order</h2>
            
            <ul role="list" className="border-t border-b border-gray-200 divide-y divide-gray-200">
              {cartItems.map((item) => (
                <li key={item.id} className="flex py-6 sm:py-10">
                  <div className="flex-shrink-0">
                    <img
                      src={item.image || '/NoImage.webp'}
                      alt={item.name}
                      className="w-24 h-24 rounded-lg object-center object-cover sm:w-32 sm:h-32 border border-gray-200"
                    />
                  </div>

                  <div className="ml-4 flex-1 flex flex-col justify-between sm:ml-6">
                    <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                      <div>
                        <div className="flex justify-between">
                          <h3 className="text-sm font-medium text-gray-900">
                            {item.name}
                          </h3>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{item.description}</p>
                        <p className="mt-1 text-sm font-medium text-gray-900">${item.price.toFixed(2)} each</p>
                      </div>

                      <div className="mt-4 sm:mt-0 sm:pr-9">
                        <div className="absolute top-0 right-0">
                          <span className="text-sm font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          <span className="font-medium">Qty: {item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Order Summary */}
          <section
            aria-labelledby="summary-heading"
            className="mt-16 bg-gray-50 rounded-lg px-4 py-6 sm:p-6 lg:p-8 lg:mt-0 lg:col-span-5"
          >
            <h2 id="summary-heading" className="text-lg font-medium text-gray-900">Order summary</h2>

            <dl className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">Subtotal</dt>
                <dd className="text-sm font-medium text-gray-900">${subtotal.toFixed(2)}</dd>
              </div>
              <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                <dt className="text-sm text-gray-600">Shipping</dt>
                <dd className="text-sm font-medium text-gray-900">${shippingCost.toFixed(2)}</dd>
              </div>
              <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                <dt className="text-sm text-gray-600">Tax</dt>
                <dd className="text-sm font-medium text-gray-900">${tax.toFixed(2)}</dd>
              </div>
              <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                <dt className="text-base font-medium text-gray-900">Order total</dt>
                <dd className="text-base font-medium text-gray-900">${total.toFixed(2)}</dd>
              </div>
            </dl>

            {/* Shipping Information */}
            <div className="mt-8 border-t border-gray-200 pt-8">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Shipping address</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-900">{shippingInfo.fullName}</p>
                <p>{shippingInfo.address}</p>
                <p>{shippingInfo.city}, {shippingInfo.zipCode}</p>
                <p>{shippingInfo.country}</p>
              </div>
            </div>

            {/* Payment Information */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Payment method</h3>
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900">{paymentDisplay.method}</p>
                <p className="mt-1">{paymentDisplay.details}</p>
                {paymentInfo.method === 'bank' && paymentInfo.accountName && (
                  <p className="mt-1">Account: {paymentInfo.accountName}</p>
                )}
                {paymentInfo.method === 'cod' && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-700 text-xs">
                      Please have exact amount ready for delivery.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Important Notice */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-blue-500 text-sm">ℹ️</span>
                </div>
                <div className="ml-2">
                  <p className="text-xs text-gray-600">
                    <strong>Important:</strong> By placing this order, you agree to our terms and conditions. 
                    {paymentInfo.method === 'cod' ? ' Pay upon delivery.' : ' Payment processed immediately.'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-between border-t border-gray-200 pt-8">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center disabled:opacity-50"
          >
            <span aria-hidden="true">←</span>
            <span className="ml-2">Back to payment</span>
          </button>
          
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-2">
              Total: <span className="font-bold text-lg text-gray-900">${total.toFixed(2)}</span>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationStage;
