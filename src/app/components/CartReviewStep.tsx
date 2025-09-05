// components/CartReviewStep.tsx
import React from 'react';
import { Gift } from 'lucide-react';
import { CartItem } from './DeluxeCheckout';

interface CartReviewStepProps {
  cartItems: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

const CartReviewStep: React.FC<CartReviewStepProps> = ({ cartItems, subtotal, shipping, tax, total }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Your Cart</h2>
      
      <div className="space-y-4">
        {cartItems.map(item => (
          <div key={item.id} className="flex items-center p-4 bg-gray-50 rounded-xl">
            <div className="w-20 h-20 rounded-lg overflow-hidden relative bg-gray-100 mr-4">
              <img src={item.image} alt={item.name} className="object-cover w-full h-full" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{item.name}</h3>
              {item.color && (
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-500 mr-2">Color:</span>
                  <span 
                    className="w-4 h-4 rounded-full border border-gray-200 inline-block"
                    style={{ backgroundColor: item.color }}
                  ></span>
                </div>
              )}
              {item.size && (
                <div className="text-sm text-gray-500 mt-1">Size: {item.size}</div>
              )}
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</div>
              <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
        <div className="flex items-center">
          <Gift size={20} className="text-emerald-600 mr-2" />
          <span className="font-medium text-emerald-700">Congratulations! You've qualified for free shipping</span>
        </div>
      </div>
    </div>
  );
};

export default CartReviewStep;
