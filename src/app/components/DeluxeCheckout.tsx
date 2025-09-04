// components/DeluxeCheckout.tsx
import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  CreditCard, 
  Truck, 
  CheckCircle,
  Lock,
  Shield,
  Gift
} from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  color?: string;
  size?: string;
}

interface ShippingAddress {
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

interface PaymentMethod {
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
            {/* Progress Steps */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                {[1, 2, 3, 4].map(step => (
                  <div key={step} className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      currentStep >= step 
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {currentStep > step ? <CheckCircle size={20} /> : step}
                    </div>
                    <span className="text-xs font-medium text-gray-700">
                      {step === 1 && 'Cart'}
                      {step === 2 && 'Shipping'}
                      {step === 3 && 'Payment'}
                      {step === 4 && 'Confirmation'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="relative mb-6">
                <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200"></div>
                <div 
                  className="absolute top-1/2 transform -translate-y-1/2 h-1 bg-gradient-to-r from-purple-600 to-indigo-700 transition-all duration-500"
                  style={{ width: `${(currentStep - 1) * 33.33}%` }}
                ></div>
              </div>
            </div>

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
        </div>
      </div>
    </div>
  );
};

// Step 1: Cart Review
const CartReviewStep: React.FC<{
  cartItems: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}> = ({ cartItems, subtotal, shipping, tax, total }) => {
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
          <span className="font-medium text-emerald-700">Congratulations! Youve qualified for free shipping</span>
        </div>
      </div>
    </div>
  );
};

// Step 2: Shipping Information
const ShippingStep: React.FC<{
  shippingAddress: ShippingAddress;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}> = ({ shippingAddress, handleInputChange }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Information</h2>
      
      <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input
            type="text"
            name="firstName"
            value={shippingAddress.firstName}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={shippingAddress.lastName}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            type="email"
            name="email"
            value={shippingAddress.email}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={shippingAddress.phone}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            required
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
          <input
            type="text"
            name="address"
            value={shippingAddress.address}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            required
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Apartment, Suite, etc. (Optional)</label>
          <input
            type="text"
            name="apartment"
            value={shippingAddress.apartment}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            type="text"
            name="city"
            value={shippingAddress.city}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <input
            type="text"
            name="state"
            value={shippingAddress.state}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
          <input
            type="text"
            name="zipCode"
            value={shippingAddress.zipCode}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <select
            name="country"
            value={shippingAddress.country}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          >
            <option value="United States">United States</option>
            <option value="Canada">Canada</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Australia">Australia</option>
          </select>
        </div>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex items-start">
          <Truck size={20} className="text-blue-600 mr-2 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-700">Free Express Shipping</h3>
            <p className="text-sm text-blue-600 mt-1">Your order will arrive in 2-3 business days</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 3: Payment Method
const PaymentStep: React.FC<{
  paymentMethod: PaymentMethod;
  handlePaymentChange: (method: PaymentMethod['type']) => void;
}> = ({ paymentMethod, handlePaymentChange }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Method</h2>
      
      <div className="space-y-4">
        <div 
          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
            paymentMethod.type === 'credit-card' 
              ? 'border-purple-600 bg-purple-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => handlePaymentChange('credit-card')}
        >
          <div className="flex items-center">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
              paymentMethod.type === 'credit-card' 
                ? 'border-purple-600 bg-purple-600' 
                : 'border-gray-400'
            }`}>
              {paymentMethod.type === 'credit-card' && <div className="w-2 h-2 rounded-full bg-white"></div>}
            </div>
            <CreditCard size={20} className="mr-2" />
            <span className="font-medium">Credit Card</span>
          </div>
          
          {paymentMethod.type === 'credit-card' && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card Holder</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                <input
                  type="text"
                  placeholder="123"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
        
        <div 
          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
            paymentMethod.type === 'paypal' 
              ? 'border-purple-600 bg-purple-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => handlePaymentChange('paypal')}
        >
          <div className="flex items-center">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
              paymentMethod.type === 'paypal' 
                ? 'border-purple-600 bg-purple-600' 
                : 'border-gray-400'
            }`}>
              {paymentMethod.type === 'paypal' && <div className="w-2 h-2 rounded-full bg-white"></div>}
            </div>
            <span className="font-medium">PayPal</span>
          </div>
        </div>
        
        <div 
          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
            paymentMethod.type === 'apple-pay' 
              ? 'border-purple-600 bg-purple-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => handlePaymentChange('apple-pay')}
        >
          <div className="flex items-center">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
              paymentMethod.type === 'apple-pay' 
                ? 'border-purple-600 bg-purple-600' 
                : 'border-gray-400'
            }`}>
              {paymentMethod.type === 'apple-pay' && <div className="w-2 h-2 rounded-full bg-white"></div>}
            </div>
            <span className="font-medium">Apple Pay</span>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-100">
        <div className="flex items-start">
          <Shield size={20} className="text-green-600 mr-2 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-700">Secure Payment</h3>
            <p className="text-sm text-green-600 mt-1">Your payment information is encrypted and secure</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 4: Confirmation
const ConfirmationStep: React.FC = () => {
  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={40} className="text-emerald-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
      <p className="text-gray-600 mb-6">Thank you for your purchase. Your order has been placed successfully.</p>
      
      <div className="bg-gray-50 rounded-xl p-6 max-w-md mx-auto">
        <h3 className="font-semibold text-gray-900 mb-4">Order Details</h3>
        
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Order Number:</span>
          <span className="font-medium">#123456</span>
        </div>
        
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Estimated Delivery:</span>
          <span className="font-medium">May 15-18, 2023</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Total Amount:</span>
          <span className="font-medium">$593.97</span>
        </div>
      </div>
      
      <div className="mt-8">
        <p className="text-gray-600">A confirmation email has been sent to your email address.</p>
      </div>
    </div>
  );
};

export default DeluxeCheckout;
