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
      <h2 className="text-2xl font-serif font-bold text-indigo-900 mb-6 pb-2 border-b border-indigo-100">Your Shopping Cart</h2>
      <div className="mb-8">
        {cartItems.map(item => (
          <div key={item.id} className="flex flex-col sm:flex-row items-center py-5 border-b border-indigo-50 hover:bg-indigo-50 transition-all duration-200 rounded-lg px-2 sm:px-4">
            <img src={item.image || '/NoImage.webp'} alt={item.name} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border border-indigo-200 shadow-sm mb-3 sm:mb-0" />
            <div className="flex-1 px-2 sm:px-4 py-2 text-center sm:text-left w-full sm:w-auto">
              <h3 className="font-serif font-semibold text-lg text-indigo-900 mb-1">{item.name}</h3>
              <p className="text-indigo-600 text-sm hidden sm:block">{item.description}</p>
              <p className="text-indigo-600 text-xs sm:hidden line-clamp-2 mb-1">{item.description}</p>
              <div className="text-indigo-700 font-medium mt-1">${item.price.toFixed(2)}</div>
            </div>
            <div className="flex items-center justify-between sm:justify-center w-full sm:w-auto my-3 sm:my-0">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center hover:bg-indigo-200 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus size={12} />
                </button>
                <span className="font-medium text-indigo-900 w-6 text-center">{item.quantity}</span>
                <button 
                  onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center hover:bg-indigo-200 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus size={12} />
                </button>
              </div>
              <div className="font-semibold text-indigo-900 text-sm sm:text-base sm:min-w-[80px] sm:text-right px-2 sm:px-4">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
              <button 
                className="text-indigo-600 hover:text-indigo-800 transition-colors p-2"
                onClick={() => onQuantityChange(item.id, 0)}
                aria-label="Remove item"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-indigo-50 rounded-xl p-4 sm:p-6 border border-indigo-200">
        <div className="flex justify-between py-2 border-b border-indigo-100">
          <span className="text-indigo-700">Subtotal</span>
          <span className="font-medium text-indigo-900">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-indigo-100">
          <span className="text-indigo-700">Shipping</span>
          <span className="font-medium text-indigo-900">${shippingCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-indigo-100">
          <span className="text-indigo-700">Tax</span>
          <span className="font-medium text-indigo-900">${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between py-3 font-bold text-lg">
          <span className="text-indigo-900">Total</span>
          <span className="text-indigo-700">${total.toFixed(2)}</span>
        </div>
        
        <button 
          className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-3 rounded-lg font-semibold mt-4 hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
          onClick={onCheckout}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default CartStage;
