'use client';

import { useState, FormEvent } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  removeFromCart, 
  clearCart, 
  changeQuantity 
} from '../../../../Redux/cartSlice';
import CartStage from './CartStage';
import ShippingStage from './ShippingStage';
import PaymentStage from './PaymentStage';
import ConfirmationStage from './ConfirmationStage';
import CompletedStage from './CompletedStage';
import OrderSummary from './OrderSummary';
import { useAuth } from '../hooks/useAuth';
import { CartItem } from '../../../../types';
import { useQuery } from '@apollo/client';
import { GET_USER_PROFILE } from '../graphql/query';
import CartStageShimmer from './CartStageShimmer';

export interface ShippingInfo {
  addressId: string;
  receiver: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PaymentInfo {
  method?: string;
  gcashNumber?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  cvv?: string;
}

const DeluxeCart = () => {
  const { user,loading } = useAuth();
  
  const [currentStage, setCurrentStage] = useState<'cart' | 'shipping' | 'payment' | 'confirmation' | 'completed'>('cart');
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    addressId: '',
    receiver: '',
    address: '',
    city: '',
    zipCode: '',
    country: '',
    state: ''
  });
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    method: '',
    gcashNumber: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });
  
  const cartItems = useSelector((state: any) => state.cart.cartItems as CartItem[]);
  const dispatch = useDispatch();
  const userId = user?.userId;
  
  const { data: profileData,loading:profileDataLoading,refetch:refresh } = useQuery(GET_USER_PROFILE, {
    variables: { id: user?.userId },
  });
  
  if(loading) return <CartStageShimmer/>
  if(profileDataLoading) return <CartStageShimmer/>
  
  const subtotal = cartItems.reduce((total: number, item: any) => 
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
    dispatch(clearCart());
    setCurrentStage('completed');
  };
  
  const handleContinueShopping = () => {
    setCurrentStage('cart');
  };
  
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
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  isActive 
                    ? 'bg-indigo-500 border-indigo-500 text-white' 
                    : isCompleted 
                      ? 'bg-indigo-500 border-indigo-500 text-white' 
                      : 'bg-white border-indigo-300 text-indigo-300'
                }`}>
                  {index + 1}
                </div>
                <span className={`mt-2 text-sm font-medium ${
                  isActive || isCompleted ? 'text-indigo-800' : 'text-indigo-400'
                }`}>
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
          
          {currentStage === 'shipping' && userId && (
            <ShippingStage 
              shippingInfo={shippingInfo}
              addresses= {profileData?.user.addresses}
              setShippingInfo={setShippingInfo}
              onSubmit={handleShippingSubmit}
              onBack={() => setCurrentStage('cart')}
              userId={userId}
              refresh={refresh}
            />
          )}
          
          {currentStage === 'shipping' && !userId && (
            <div className="text-center py-12">
              <div className="mb-4 text-red-500">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-6V7m0 0V5m0 2h2m-2 0H9m12 5a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Authentication Required</h3>
              <p className="text-gray-600 mb-6">Please log in to continue with shipping</p>
              <button
                onClick={() => setCurrentStage('cart')}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Return to Cart
              </button>
            </div>
          )}
          
          {currentStage === 'payment' && (
            <PaymentStage 
              paymentInfo={paymentInfo}
              setPaymentInfo={setPaymentInfo}
              onSubmit={handlePaymentSubmit}
              onBack={() => setCurrentStage('shipping')}
            />
          )}
          
          {currentStage === 'confirmation' && userId && (
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
          
          {currentStage === 'confirmation' && !userId && (
            <div className="text-center py-12">
              <p className="text-red-500">User information not available</p>
              <button
                onClick={() => setCurrentStage('cart')}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Return to Cart
              </button>
            </div>
          )}
          
          {currentStage === 'completed' && (
            <CompletedStage onContinueShopping={handleContinueShopping} />
          )}
        </div>
        
        <div className="bg-white rounded-xl p-6 md:p-8 mt-5">
          <OrderSummary
            cartItems={cartItems}
            addresses={profileData?.user.addresses}
            subtotal={subtotal}
            tax={tax}
            total={total}
            onQuantityChange={handleQuantityChange}
            onCheckout={handleCheckout}
          />
        </div>
      </div>
    </div>
  );
};

export default DeluxeCart;
