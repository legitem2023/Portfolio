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
  console.log(cartItems);
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-2 sm:px-2 lg:px-3">
        <h2 className="text-2xl font-serif font-bold text-indigo-900 mb-8">Shopping Cart</h2>
        
        <div className="flow-root">
          <ul role="list" className="-my-6 divide-y divide-gray-200">
            {cartItems.map((item) => (
              <li key={item.id} className="flex py-6">
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                  <img
                    src={item.image || '/NoImage.webp'}
                    alt={item.name}
                    className="h-full w-full object-cover object-center"
                  />
                </div>

                <div className="ml-4 flex flex-1 flex-col">
                  <div>
                    <div className="flex justify-between text-base font-medium text-gray-900">
                      <h3 className="font-serif font-semibold text-indigo-900">{item.name}</h3>
                      <p className="ml-4 text-indigo-700">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    {/*   <p className="mt-1 text-sm text-indigo-600">{item.size}</p>*/}

                  </div>
                  <div className="flex flex-1 items-end justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-indigo-700">Qty</span>
                      <div className="flex items-center border border-gray-300 rounded-md">
                        <button
                          onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                          className="h-8 w-8 flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-l-md transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="h-8 w-8 flex items-center justify-center text-gray-900 font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                          className="h-8 w-8 flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-r-md transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex">
                      <button
                        onClick={() => onQuantityChange(item.id, 0)}
                        type="button"
                        className="font-medium text-indigo-600 hover:text-indigo-500 flex items-center space-x-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
          <div className="flex justify-between text-base font-medium text-gray-900">
            <p className="text-indigo-900">Subtotal</p>
            <p className="text-indigo-700">${subtotal.toFixed(2)}</p>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <p>Shipping</p>
            <p>${shippingCost.toFixed(2)}</p>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <p>Tax</p>
            <p>${tax.toFixed(2)}</p>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Shipping and taxes calculated at checkout.
          </p>
          <div className="mt-6">
            <button
              onClick={onCheckout}
              className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Checkout
            </button>
          </div>
          <div className="mt-6 flex justify-center text-sm text-center text-gray-500">
            <p>
              or{' '}
              <button
                type="button"
                className="text-indigo-600 font-medium hover:text-indigo-500"
              >
                Continue Shopping
                <span aria-hidden="true"> &rarr;</span>
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartStage;
