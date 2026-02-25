import { ShoppingCart } from 'lucide-react';
import { CartItem } from '../../../../types';

interface CartStageProps {
  cartItems: CartItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  onQuantityChange: (id: string | number, quantity: number) => void;
  onCheckout: () => void;
}

// Helper function to format price as peso
const formatPesoPrice = (price: number): string => {
  return `₱${price.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const OrderSummary = ({ 
  cartItems, 
  subtotal, 
  shippingCost, 
  tax, 
  total, 
  onCheckout 
}: CartStageProps) => {
  if (cartItems.length === 0) {
    return (
      <div className="text-center py-8 md:py-12 px-4">
        <div className="text-indigo-500 mb-4 flex justify-center">
          <ShoppingCart size={48} className="w-8 h-8 md:w-12 md:h-12" />
        </div>
        <h2 className="text-xl md:text-2xl font-serif font-bold text-indigo-900 mb-2">Your cart is empty</h2>
        <p className="text-indigo-700 text-sm md:text-base">Add some items to your cart to continue shopping</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <h2 className="text-xl md:text-2xl font-serif font-bold text-indigo-900 mb-6 md:mb-8">Order Summary</h2>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items Count */}
          <div className="flex-1">
            <p className="text-indigo-700">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>

          {/* Order Summary Section */}
          <div className="lg:w-96">
            <div className="bg-indigo-50 rounded-lg p-6">
              <h3 className="text-lg font-serif font-bold text-indigo-900 mb-4">Order Total</h3>
              
              <div className="flow-root">
                <dl className="-my-4 text-sm divide-y divide-indigo-200">
                  <div className="py-4 flex items-center justify-between">
                    <dt className="text-indigo-700">Subtotal</dt>
                    <dd className="font-medium text-indigo-900">{formatPesoPrice(subtotal)}</dd>
                  </div>
                  
                  <div className="py-4 flex items-center justify-between">
                    <dt className="text-indigo-700">Shipping</dt>
                    <dd className="font-medium text-indigo-900">
                      {shippingCost === 0 ? 'Free' : formatPesoPrice(shippingCost)}
                    </dd>
                  </div>
                  
                  <div className="py-4 flex items-center justify-between">
                    <dt className="text-indigo-700">Tax</dt>
                    <dd className="font-medium text-indigo-900">{formatPesoPrice(tax)}</dd>
                  </div>
                  
                  <div className="py-4 flex items-center justify-between">
                    <dt className="text-base font-bold text-indigo-900">Total</dt>
                    <dd className="text-base font-bold text-indigo-900">{formatPesoPrice(total)}</dd>
                  </div>
                </dl>
              </div>

              {/* Checkout Button */}
              <button
                onClick={onCheckout}
                className="mt-6 w-full bg-indigo-600 border border-transparent rounded-md py-3 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
