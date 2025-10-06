'use client';

import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  addToCart, 
  removeFromCart, 
  clearCart, 
  changeQuantity 
} from '../../../../Redux/cartSlice';
import CartStage from './CartStage';
import ShippingStage from './ShippingStage';
import PaymentStage from './PaymentStage';
import ConfirmationStage from './ConfirmationStage';
import CompletedStage from './CompletedStage';
import { decryptToken } from '../../../../utils/decryptToken';


// Update your ShippingInfo interface to include addressId
export interface ShippingInfo {
  addressId: string; // Add this field
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}


export interface CartItem {
  userId: string;
  id: string | number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image: string;
}


export interface PaymentInfo {
  method?: string;
  // For GCash
  gcashNumber?: string;
  // For Bank Transfer
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  // For Credit Card (optional, if you want to keep it)
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  cvv?: string;
}

const DeluxeCart = () => {
  const [currentStage, setCurrentStage] = useState<'cart' | 'shipping' | 'payment' | 'confirmation' | 'completed'>('cart');
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    addressId:'',
    fullName: '',
    address: '',
    city: '',
    zipCode: '',
    country: '',
    state:''
  });
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    method:'',
    gcashNumber:'',
    bankName:'',
    accountNumber:'',
    accountName:'',
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });
  
  const cartItems = useSelector((state: any) => state.cart.cartItems as CartItem[]);
  const dispatch = useDispatch();
    const [userId, setUserId] = useState("");

  useEffect(() => {
    const getRole = async () => {
      try {
        const response = await fetch('/api/protected', {
          credentials: 'include' // Important: includes cookies
        });
        
        if (response.status === 401) {
          // Handle unauthorized access
          throw new Error('Unauthorized');
        }
        
        const data = await response.json();
        const token = data?.user;
        const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz";

        const payload = await decryptToken(token, secret.toString());
        setUserId(payload.userId);
        console.log(payload);
      } catch (err) {
        console.error('Error getting role:', err);
      }
    };
    getRole();
  }, []);
  const subtotal = cartItems.reduce((total: number, item: CartItem) => 
    total + (item.price * item.quantity), 0
  );
  const shippingCost = subtotal > 0 ? 5.99 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;
  
  const handleQuantityChange = (id: string | number, quantity: number) => {
    if (quantity === 0) {
      dispatch(removeFromCart({ id }));
    } else {
      dispatch(changeQuantity({ id, quantity }));
    }
  };
  
  const handleCheckout = () => {
    setCurrentStage('shipping');
  };
  
  const handleShippingSubmit = (e: FormEvent) => {
    e.preventDefault();
    setCurrentStage('payment');
  };
  
  const handlePaymentSubmit = (e: FormEvent) => {
    e.preventDefault();
    setCurrentStage('confirmation');
  };
  
  const handlePlaceOrder = () => {
    // In a real app, you would send the order to your backend here
    dispatch(clearCart());
    setCurrentStage('completed');
  };
  
  const handleContinueShopping = () => {
    setCurrentStage('cart');
  };
  
  // Render different stages based on currentStage
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
         {/* Progress Bar */}
<div className="flex justify-between relative mb-12">
  <div className="absolute top-5 left-5 right-5 h-0.5 bg-indigo-200 z-0"></div>
  
  {['cart', 'shipping', 'payment', 'confirmation'].map((stage, index) => {
    const stageIndex = ['cart', 'shipping', 'payment', 'confirmation'].indexOf(currentStage);
    const isCompleted = index < stageIndex;
    const isActive = index === stageIndex;
    
    return (
      <div key={stage} className="flex flex-col items-center relative z-10">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${isActive ? 'bg-indigo-500 border-indigo-500 text-white' : isCompleted ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-indigo-300 text-indigo-300'}`}>
          {index + 1}
        </div>
        <span className={`mt-2 text-sm font-medium ${isActive || isCompleted ? 'text-indigo-800' : 'text-indigo-400'}`}>
          {stage.charAt(0).toUpperCase() + stage.slice(1)}
        </span>
      </div>
    );
  })}
</div>
        
        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          {currentStage === 'cart' && (
            <CartStage 
              cartItems={cartItems}
              subtotal={subtotal}
              shippingCost={shippingCost}
              tax={tax}
              total={total}
              onQuantityChange={handleQuantityChange}
              onCheckout={handleCheckout}
            />
          )}
          
          {currentStage === 'shipping' && (
            <ShippingStage 
              shippingInfo={shippingInfo}
              setShippingInfo={setShippingInfo}
              onSubmit={handleShippingSubmit}
              onBack={() => setCurrentStage('cart')}
              userId={userId}
            />
          )}
          
          {currentStage === 'payment' && (
            <PaymentStage 
              paymentInfo={paymentInfo}
              setPaymentInfo={setPaymentInfo}
              onSubmit={handlePaymentSubmit}
              onBack={() => setCurrentStage('shipping')}
            />
          )}
          
          {currentStage === 'confirmation' && (
            <ConfirmationStage 
              userId={userId}
              cartItems={cartItems}
              shippingInfo={shippingInfo}
              paymentInfo={paymentInfo}
              subtotal={subtotal}
              shippingCost={shippingCost}
              tax={tax}
              total={total}
              onPlaceOrder={handlePlaceOrder}
              onBack={() => setCurrentStage('payment')}
            />
          )}
          
          {currentStage === 'completed' && (
            <CompletedStage onContinueShopping={handleContinueShopping} />
          )}
        </div>
      </div>
    </div>
  );
};

export default DeluxeCart;
