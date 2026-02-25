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
                {cartItems.map((item:any) => (
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
                              onClick={() => onQuantityChange(item?.id, (item?.quantity ?? 0) - 1)}
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
        </div>
      </div>
    </div>
  );
};

export default CartStage;
