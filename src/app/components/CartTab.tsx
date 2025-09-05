// Example usage in a shopping cart page
import React, { useState } from 'react';
import DeluxeCartCard from './DeluxeCartCard';
import DeluxeCheckout from './DeluxeCheckout';

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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Shopping Cart </h1>
        <DeluxeCheckout/>
        {/* Cart Summary */}
      </div>
    </div>
  );
};

export default CartTab;
