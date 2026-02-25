import { ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
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

const OrderSummary = ({ cartItems, subtotal, shippingCost, tax, total, onQuantityChange, onCheckout }: CartStageProps) => {
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
    <div className="bg-white rounded mt-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <h2 className="text-xl md:text-2xl font-serif font-bold text-indigo-900 mb-6 md:mb-8">Order Summary</h2>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items Section */}
          <div className="flex-1">
            <div className="flow-root">
              <ul role="list" className="-my-6 divide-y divide-gray-200">
                 <li>SubTotal :{subtotal}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
