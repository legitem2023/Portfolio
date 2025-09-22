import { ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem } from './DeluxeCart';

interface CartStageProps {
  cartItems: CartItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  onQuantityChange: (id: string | number, quantity: number) => void;
  onCheckout: () => void;
}

const CartStage = ({ cartItems, subtotal, shippingCost, tax, total, onQuantityChange, onCheckout }: CartStageProps) => {
  if (cartItems.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-indigo-500 mb-4 flex justify-center">
          <ShoppingCart size={48} />
        </div>
        <h2 className="text-2xl font-serif font-bold text-indigo-900 mb-2">Your cart is empty</h2>
        <p className="text-indigo-700">Add some items to your cart to continue shopping</p>
      </div>
    );
  }
  
  return (
    <div className="px-2 sm:px-0">
      <h2 className="text-2xl font-serif font-bold text-indigo-900 mb-4 sm:mb-6 pb-2 border-b border-indigo-100">Your Shopping Cart</h2>
      <div className="mb-6 sm:mb-8">
        {cartItems.map(item => (
          <div key={item.id} className="flex items-start py-3 sm:py-5 border-b border-indigo-50 hover:bg-indigo-50 transition-all duration-200 rounded-lg px-2 sm:px-4">
            {/* Column 1: Image */}
            <div className="flex-shrink-0 mr-3 sm:mr-4">
              <img 
                src={item.image || '/NoImage.webp'} 
                alt={item.name} 
                className="w-16 h-16 sm:w-24 sm:h-24 object-cover rounded-lg border border-indigo-200 shadow-sm" 
              />
            </div>
            
            {/* Column 2: Main content and actions stacked vertically */}
            <div className="flex-1 min-w-0">
              {/* Top row: Name and basic info */}
              <div className="mb-2">
                <h3 className="font-serif font-semibold text-sm sm:text-lg text-indigo-900 truncate">{item.name}</h3>
                <p className="text-indigo-600 text-xs sm:text-sm hidden sm:block mt-1">{item.description}</p>
                <p className="text-indigo-600 text-xs sm:hidden line-clamp-1 mt-1">{item.description}</p>
                <div className="text-indigo-700 font-medium text-sm sm:text-base mt-1">
                  ${item.price.toFixed(2)} each
                </div>
              </div>
              
              {/* Bottom row: Two columns for quantity controls and remove+subtotal */}
              <div className="flex items-center justify-between">
                {/* Left column: Quantity controls */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <button 
                    onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center hover:bg-indigo-200 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={12} className="sm:size-3" />
                  </button>
                  <span className="font-medium text-indigo-900 text-sm sm:text-base w-6 text-center">{item.quantity}</span>
                  <button 
                    onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center hover:bg-indigo-200 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus size={12} className="sm:size-3" />
                  </button>
                </div>
                
                {/* Right column: Remove button and subtotal stacked vertically */}
                <div className="flex flex-col items-end space-y-1">
                  <button 
                    className="text-indigo-600 hover:text-indigo-800 transition-colors p-1"
                    onClick={() => onQuantityChange(item.id, 0)}
                    aria-label="Remove item"
                  >
                    <Trash2 size={14} className="sm:size-4" />
                  </button>
                  <div className="font-semibold text-indigo-900 text-sm sm:text-base">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Summary Section */}
      <div className="bg-indigo-50 rounded-xl p-3 sm:p-6 border border-indigo-200">
        <div className="flex justify-between py-1 sm:py-2 border-b border-indigo-100">
          <span className="text-indigo-700 text-sm sm:text-base">Subtotal</span>
          <span className="font-medium text-indigo-900 text-sm sm:text-base">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between py-1 sm:py-2 border-b border-indigo-100">
          <span className="text-indigo-700 text-sm sm:text-base">Shipping</span>
          <span className="font-medium text-indigo-900 text-sm sm:text-base">${shippingCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between py-1 sm:py-2 border-b border-indigo-100">
          <span className="text-indigo-700 text-sm sm:text-base">Tax</span>
          <span className="font-medium text-indigo-900 text-sm sm:text-base">${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between py-2 sm:py-3 font-bold text-lg">
          <span className="text-indigo-900">Total</span>
          <span className="text-indigo-700">${total.toFixed(2)}</span>
        </div>
        
        <button 
          className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-3 rounded-lg font-semibold mt-3 sm:mt-4 hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
          onClick={onCheckout}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default CartStage;
