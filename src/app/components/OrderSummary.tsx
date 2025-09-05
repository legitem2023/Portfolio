// components/OrderSummary.tsx
import React from 'react';
import { Lock } from 'lucide-react';
import { CartItem } from './DeluxeCheckout';

interface OrderSummaryProps {
  cartItems: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ 
  cartItems, 
  subtotal, 
  shipping, 
  tax, 
  total 
}) => {
  return (
    <div className="lg:w-1/3">
      <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
        
        <div className="space-y-4 mb-6">
          {cartItems.map(item => (
            <div key={item.id} className="flex items-center">
              <div className="w-16 h-16 rounded-lg overflow-hidden relative bg-gray-100 mr-4">
                <img src={item.image} alt={item.name} className="object-cover w-full h-full" />
                <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.quantity}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{item.name}</h3>
                {item.color && (
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-gray-500 mr-2">Color:</span>
                    <span 
                      className="w-3 h-3 rounded-full border border-gray-200 inline-block"
                      style={{ backgroundColor: item.color }}
                    ></span>
                  </div>
                )}
              </div>
              <div className="font-semibold text-gray-900">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 border-t border-gray-200 pt-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium">{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax</span>
            <span className="font-medium">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-3 mt-3">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-lg font-bold text-gray-900">${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-6 flex items-center text-xs text-gray-500">
          <Lock size={14} className="mr-1" />
          <span>Your payment is secured with 256-bit SSL encryption</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
