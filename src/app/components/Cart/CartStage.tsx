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

const CartStage = ({ cartItems, subtotal, shippingCost, tax, total, onQuantityChange, onCheckout }: CartStageProps) => {
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
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <h2 className="text-xl md:text-2xl font-serif font-bold text-indigo-900 mb-6 md:mb-8">Shopping Cart</h2>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items Section */}
          <div className="flex-1">
            <div className="flow-root">
              <ul role="list" className="-my-6 divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <li key={item.id} className="flex py-4 md:py-6">
                    {/* Product Image */}
                    <div className="h-16 w-16 md:h-24 md:w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      <img
                        src={item.images?.[0] || '/NoImage.webp'}
                        alt={item.name}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="ml-3 md:ml-4 flex flex-1 flex-col">
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm md:text-base font-serif font-semibold text-indigo-900 line-clamp-2">
                            {item.name}
                          </h3>
                          <div className="mt-1 flex items-center space-x-2 md:space-x-4">
                            <div 
                              className="h-4 w-4 md:h-6 md:w-6 rounded-full border border-gray-300 shadow-sm"
                              style={{
                                backgroundColor: item.color || '#cccccc'
                              }}
                              title={item.color}
                            />
                            <p className="text-xs md:text-sm text-indigo-600">{item.size}</p>
                          </div>
                        </div>
                        <p className="text-sm md:text-base font-medium text-indigo-700 mt-1 sm:mt-0 sm:ml-4">
                          {formatPesoPrice((item?.price || 0) * (item?.quantity || 0))}
                        </p>
                      </div>

                      {/* Quantity Controls and Actions */}
                      <div className="flex flex-1 items-end justify-between mt-2 md:mt-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs md:text-sm text-indigo-700">Qty</span>
                          <div className="flex items-center border border-gray-300 rounded-md">
                            <button
                              onClick={() => {
  const quantity = item?.quantity ?? 0;
  if (item?.id && quantity > 0) {
    onQuantityChange(item.id, quantity - 1);
  }
}}
                              className="h-7 w-7 md:h-8 md:w-8 flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-l-md transition-colors"
                            >
                              <Minus size={12} className="w-3 h-3 md:w-3.5 md:h-3.5" />
                            </button>
                            <span className="h-7 w-7 md:h-8 md:w-8 flex items-center justify-center text-gray-900 font-medium text-xs md:text-sm">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                              className="h-7 w-7 md:h-8 md:w-8 flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-r-md transition-colors"
                            >
                              <Plus size={12} className="w-3 h-3 md:w-3.5 md:h-3.5" />
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => onQuantityChange(item.id, 0)}
                          type="button"
                          className="font-medium text-indigo-600 hover:text-indigo-500 flex items-center space-x-1"
                        >
                          <Trash2 size={14} className="w-3 h-3 md:w-4 md:h-4" />
                          <span className="hidden xs:inline text-xs md:text-sm">Remove</span>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Order Summary Section */}
          <div className="lg:w-96">
            <div className="bg-gray-50 rounded-lg p-4 md:p-6 sticky top-4">
              <h3 className="text-lg font-serif font-semibold text-indigo-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm md:text-base">
                  <p className="text-indigo-900">Subtotal</p>
                  <p className="text-indigo-700">{formatPesoPrice(subtotal)}</p>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <p>Shipping</p>
                  <p>{formatPesoPrice(shippingCost)}</p>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <p>Tax</p>
                  <p>{formatPesoPrice(tax)}</p>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-base md:text-lg font-semibold">
                    <p className="text-indigo-900">Total</p>
                    <p className="text-indigo-700">{formatPesoPrice(total)}</p>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs md:text-sm text-gray-500">
                Shipping and taxes calculated at checkout.
              </p>
              
              <div className="mt-6">
                <button
                  onClick={onCheckout}
                  className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-sm md:text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Checkout
                </button>
              </div>
              
              <div className="mt-4 flex justify-center text-center">
                <p className="text-xs md:text-sm text-gray-500">
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
      </div>
    </div>
  );
};

export default CartStage;
