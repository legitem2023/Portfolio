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
    <div className="px-4 sm:px-0">
      <h2 className="text-2xl font-serif font-bold text-indigo-900 mb-6">Your Shopping Cart</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items Section */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map(item => (
            <div key={item.id} className="flex flex-col sm:flex-row items-center bg-white border border-indigo-100 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
              {/* Image */}
              <div className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-4">
                <img 
                  src={item.image || '/NoImage.webp'} 
                  alt={item.name} 
                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                />
              </div>
              
              {/* Product Info */}
              <div className="flex-1 text-center sm:text-left mb-4 sm:mb-0 sm:mr-4">
                <h3 className="font-serif font-semibold text-lg text-indigo-900 mb-1">{item.name}</h3>
                <p className="text-indigo-600 text-sm mb-2 line-clamp-2">{item.description}</p>
                <div className="text-indigo-700 font-medium">${item.price.toFixed(2)}</div>
              </div>
              
              {/* Quantity Controls and Actions */}
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                {/* Quantity Controls */}
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center hover:bg-indigo-100 transition-colors border border-indigo-200"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-medium text-indigo-900 w-8 text-center">{item.quantity}</span>
                  <button 
                    onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center hover:bg-indigo-100 transition-colors border border-indigo-200"
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                {/* Price and Remove */}
                <div className="flex items-center space-x-4">
                  <div className="font-semibold text-indigo-900 text-lg">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                  <button 
                    className="text-indigo-400 hover:text-indigo-600 transition-colors p-2 hover:bg-indigo-50 rounded-lg"
                    onClick={() => onQuantityChange(item.id, 0)}
                    aria-label="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-indigo-100 rounded-lg shadow-sm p-6 sticky top-4">
            <h3 className="text-xl font-serif font-bold text-indigo-900 mb-4">Order Summary</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center py-2">
                <span className="text-indigo-700">Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                <span className="font-medium text-indigo-900">${subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-indigo-700">Shipping</span>
                <span className="font-medium text-indigo-900">${shippingCost.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-indigo-700">Tax</span>
                <span className="font-medium text-indigo-900">${tax.toFixed(2)}</span>
              </div>
              
              <div className="border-t border-indigo-100 pt-3 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-indigo-900">Total</span>
                  <span className="text-lg font-bold text-indigo-700">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <button 
              className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg focus:ring-2 focus:ring-indigo-300 focus:outline-none"
              onClick={onCheckout}
            >
              Proceed to Checkout
            </button>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-indigo-600">
                or <a href="#" className="text-indigo-500 hover:text-indigo-700 underline">continue shopping</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartStage;
