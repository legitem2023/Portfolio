// Example usage in a shopping cart page
import React, { useState } from 'react';
import DeluxeCartCard from '../components/DeluxeCartCard';

const CartTab = () => {
  const [cartItems, setCartItems] = useState([
    {
      id: '1',
      name: 'Premium Leather Handbag',
      price: 249.99,
      originalPrice: 299.99,
      image: '/path/to/handbag.jpg',
      quantity: 1,
      inStock: true,
      color: '#8B4513',
      material: 'Genuine Leather',
      deliveryDate: 'May 15-18'
    },
    {
      id: '2',
      name: 'Luxury Silk Scarf',
      price: 89.99,
      image: '/path/to/scarf.jpg',
      quantity: 2,
      inStock: true,
      color: '#FF6B6B',
      material: '100% Silk',
      deliveryDate: 'May 12-14'
    },
    {
      id: '3',
      name: 'Designer Sunglasses',
      price: 159.99,
      originalPrice: 199.99,
      image: '/path/to/sunglasses.jpg',
      quantity: 1,
      inStock: false,
      color: '#000000',
      deliveryDate: 'June 1-5'
    }
  ]);

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Shopping Cart</h1>
        
        <div className="space-y-6">
          {cartItems.map(item => (
            <DeluxeCartCard
              key={item.id}
              item={item}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemoveItem}
            />
          ))}
        </div>
        
        {/* Cart Summary */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">$549.97</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium text-emerald-600">Free</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium">$44.00</span>
            </div>
            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>$593.97</span>
              </div>
            </div>
          </div>
          
          <button className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-700 text-white py-4 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300">
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartTab;
