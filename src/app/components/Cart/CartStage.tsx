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
      <div className="text-center py-12">
        <div className="text-5xl text-amber-500 mb-4">
          <i className="fas fa-shopping-cart"></i>
        </div>
        <h2 className="text-2xl font-serif font-bold text-amber-900 mb-2">Your cart is empty</h2>
        <p className="text-amber-700">Add some items to your cart to continue shopping</p>
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-2xl font-serif font-bold text-indigo-900 mb-6 pb-2 border-b border-indigo-100">Your Shopping Cart</h2>
      <div className="mb-8">
        {cartItems.map(item => (
          <div key={item.id} className="flex flex-col md:flex-row items-center py-5 border-b border-indigo-50 hover:bg-violet-50 transition-all duration-200 rounded-lg">
            <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-lg border border-indigo-200 shadow-sm" />
            <div className="flex-1 px-4 md:px-6 py-2">
              <h3 className="font-serif font-semibold text-lg text-indigo-900">{item.name}</h3>
              <p className="text-indigo-600 text-sm">{item.description}</p>
              <div className="text-indigo-700 font-medium mt-1">${item.price.toFixed(2)}</div>
            </div>
            <div className="flex items-center space-x-3 my-4 md:my-0">
              <button 
                onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center hover:bg-indigo-200 transition-colors"
              >
                <i className="fas fa-minus text-xs"></i>
              </button>
              <span className="font-medium text-indigo-900 w-6 text-center">{item.quantity}</span>
              <button 
                onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                className="w-8 h-8 rounded-full bg-amber-100 text-indigo-700 flex items-center justify-center hover:bg-indigo-200 transition-colors"
              >
                <i className="fas fa-plus text-xs"></i>
              </button>
            </div>
            <div className="font-semibold text-indigo-900 min-w-[80px] text-right px-4">
              ${(item.price * item.quantity).toFixed(2)}
            </div>
            <button 
              className="text-indigo-600 hover:text-amber-800 transition-colors p-2"
              onClick={() => onQuantityChange(item.id, 0)}
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        ))}
      </div>
      
      <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
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
          className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white py-3 rounded-lg font-semibold mt-4 hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
          onClick={onCheckout}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default CartStage;
