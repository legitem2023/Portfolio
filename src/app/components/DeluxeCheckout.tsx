// components/DeluxeCheckout.tsx
import React, { useState } from 'react';
import ProgressSteps from './ProgressSteps';
import OrderSummary from './OrderSummary';
import CartReviewStep from './CartReviewStep';
import ShippingStep from './ShippingStep';
import PaymentStep from './PaymentStep';
import ConfirmationStep from './ConfirmationStep';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  color?: string;
  size?: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PaymentMethod {
  type: 'credit-card' | 'paypal' | 'apple-pay';
  cardNumber?: string;
  cardHolder?: string;
  expiry?: string;
  cvv?: string;
}

const DeluxeCheckout: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [cartItems] = useState<CartItem[]>([
    {
      id: '1',
      name: 'Premium Leather Handbag',
      price: 249.99,
      image: '/path/to/handbag.jpg',
      quantity: 1,
      color: '#8B4513'
    },
    {
      id: '2',
      name: 'Luxury Silk Scarf',
      price: 89.99,
      image: '/path/to/scarf.jpg',
      quantity: 2,
      color: '#FF6B6B'
    }
  ]);

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>({
    type: 'credit-card'
  });

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 200 ? 0 : 15;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (method: PaymentMethod['type']) => {
    setPaymentMethod({ type: method });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <CartReviewStep cartItems={cartItems} subtotal={subtotal} shipping={shipping} tax={tax} total={total} />;
      case 2:
        return <ShippingStep shippingAddress={shippingAddress} handleInputChange={handleInputChange} />;
      case 3:
        return <PaymentStep paymentMethod={paymentMethod} handlePaymentChange={handlePaymentChange} />;
      case 4:
        return <ConfirmationStep />;
      default:
        return <CartReviewStep cartItems={cartItems} subtotal={subtotal} shipping={shipping} tax={tax} total={total} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your purchase with confidence</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="lg:w-2/3">
            <ProgressSteps currentStep={currentStep} />
            
            {/* Step Content */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              {renderStep()}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              {currentStep > 1 ? (
                <button 
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="flex items-center text-gray-600 hover:text-gray-800 font-medium"
                >
                  <ChevronLeft size={20} className="mr-1" />
                  Previous Step
                </button>
              ) : (
                <div></div>
              )}
              
              <button 
                onClick={handleSubmit}
                className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white py-3 px-6 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center"
              >
                {currentStep < 4 ? (
                  <>
                    Continue to {currentStep === 1 ? 'Shipping' : currentStep === 2 ? 'Payment' : 'Review'}
                    <ChevronRight size={20} className="ml-1" />
                  </>
                ) : (
                  'Place Order'
                )}
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <OrderSummary 
            cartItems={cartItems} 
            subtotal={subtotal} 
            shipping={shipping} 
            tax={tax} 
            total={total} 
          />
        </div>
      </div>
    </div>
  );
};

export default DeluxeCheckout;
