'use client';

import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  removeFromCart, 
  clearCart, 
  changeQuantity 
} from '../../../../Redux/cartSlice';
import { useAuth } from '../hooks/useAuth';
import { CartItem, Address } from '../../../../types';
import { useQuery, useMutation } from '@apollo/client';
import { GET_USER_PROFILE } from '../graphql/query';
import { CREATE_ORDER } from '../graphql/mutation';
import { ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';

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

type Coordinate = {
  lat: number;
  lng: number;
};

type PaymentMethod = 'gcash' | 'bank' | 'cod';
type CartStage = 'cart' | 'shipping' | 'payment' | 'confirmation' | 'completed';

// Helper function to format price as peso
const formatPesoPrice = (price: number): string => {
  return `₱${price.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// Function to get distance from OSRM API
async function getDistanceInKm(
  pickup: Coordinate,
  dropoff: Coordinate
): Promise<number> {
  const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?overview=false`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.code !== 'Ok') {
    throw new Error('Route not found');
  }

  const route = data.routes[0];
  return route.distance / 1000;
}

// Shimmer Component
const CartStageShimmer = () => (
  <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 animate-pulse">
    <div className="h-8 bg-indigo-200 rounded w-48 mb-8"></div>
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex space-x-4">
          <div className="w-20 h-20 bg-indigo-200 rounded"></div>
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-indigo-200 rounded w-3/4"></div>
            <div className="h-4 bg-indigo-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Cart Stage Component
interface CartStageProps {
  cartItems: CartItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  onQuantityChange: (id: string | number, quantity: number) => void;
  onCheckout: () => void;
}

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
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <h2 className="text-xl md:text-2xl font-serif font-bold text-indigo-900 mb-6 md:mb-8">Shopping Cart</h2>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="flow-root">
              <ul role="list" className="-my-6 divide-y divide-gray-200">
                {cartItems.map((item: any) => (
                  <li key={item.id} className="flex py-4 md:py-6">
                    <div className="h-16 w-16 md:h-24 md:w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      <img
                        src={item.images?.[0] || '/NoImage.webp'}
                        alt={item.name}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>

                    <div className="ml-3 md:ml-4 flex flex-1 flex-col">
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm md:text-base font-serif font-semibold text-indigo-900 line-clamp-2">
                            {item.name}
                          </h3>
                          <div className="mt-1 flex items-center space-x-2 md:space-x-4">
                            <div 
                              className="h-4 w-4 md:h-6 md:w-6 rounded-full border border-gray-300 shadow-sm"
                              style={{ backgroundColor: item.color || '#cccccc' }}
                              title={item.color}
                            />
                            <p className="text-xs md:text-sm text-indigo-600">{item.size}</p>
                          </div>
                        </div>
                        <p className="text-sm md:text-base font-medium text-indigo-700 mt-1 sm:mt-0 sm:ml-4">
                          {formatPesoPrice((item?.price || 0) * (item?.quantity || 0))}
                        </p>
                      </div>

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

// Shipping Stage Component
interface ShippingStageProps {
  shippingInfo: ShippingInfo;
  addresses: Address[];
  setShippingInfo: (info: ShippingInfo) => void;
  onSubmit: (e: FormEvent) => void;
  onBack: () => void;
  userId: string;
  refresh: any;
}

const ShippingStage = ({ 
  shippingInfo, 
  addresses, 
  setShippingInfo, 
  onSubmit, 
  onBack, 
  userId, 
  refresh 
}: ShippingStageProps) => {
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const savedAddresses: Address[] = addresses;

  useEffect(() => {
    if (savedAddresses.length > 0) {
      const defaultAddress = savedAddresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        setShippingInfo({
          addressId: defaultAddress.id,
          receiver: defaultAddress.receiver,
          address: defaultAddress.street,
          city: defaultAddress.city,
          zipCode: defaultAddress.zipCode,
          country: defaultAddress.country,
          state: defaultAddress.state
        });
      }
    }
  }, [savedAddresses, setShippingInfo]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setShippingInfo({
      ...shippingInfo,
      [e.target.name]: e.target.value
    });
  };

  const handleAddressSelect = (address: Address) => {
    refresh();
    setSelectedAddressId(address.id);
    setShippingInfo({
      addressId: address.id,
      receiver: address.receiver,
      address: address.street,
      city: address.city,
      zipCode: address.zipCode,
      country: address.country,
      state: address.state
    });
  };

  const handleUseNewAddress = () => {
    setSelectedAddressId(null);
    setShippingInfo({
      addressId: "",
      receiver: "",
      address: "",
      city: "",
      zipCode: "",
      country: "",
      state: ""
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-serif font-bold text-indigo-900 mb-4 sm:mb-6 pb-2 border-b border-indigo-100">
        Shipping Information
      </h2>

      {savedAddresses.length > 0 && (
        <div className="mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-semibold text-indigo-800 mb-3 sm:mb-4">
            Select a saved address
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
            {savedAddresses.map((address) => (
              <div
                key={address.id}
                className={`border-2 rounded-lg p-3 sm:p-4 cursor-pointer transition-all duration-200 ${
                  selectedAddressId === address.id
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : 'border-indigo-200 hover:border-indigo-300 hover:bg-indigo-25'
                }`}
                onClick={() => handleAddressSelect(address)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center flex-wrap gap-1 sm:gap-2">
                    <span className="font-medium text-indigo-900 text-sm sm:text-base">
                      {address.type}
                    </span>
                    {address.isDefault && (
                      <span className="bg-indigo-100 text-indigo-800 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  {selectedAddressId === address.id && (
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-indigo-500 rounded-full"></div>
                  )}
                </div>
                
                <div className="text-xs sm:text-sm text-indigo-700 space-y-0.5 sm:space-y-1">
                  <p className="font-medium text-sm sm:text-base">{address.receiver}</p>
                  <p className="break-words">{address.street}</p>
                  <p>{address.city}, {address.state} {address.zipCode}</p>
                  <p>{address.country}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleUseNewAddress}
            className="text-indigo-600 hover:text-indigo-800 font-medium text-xs sm:text-sm flex items-center space-x-1 transition-colors"
          >
            <span className="text-base sm:text-lg">+</span>
            <span>Use a new address</span>
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5">
        <div>
          <label className="block text-indigo-800 font-medium mb-1.5 sm:mb-2 text-sm sm:text-base">
            Receiver Name
          </label>
          <input
            type="text"
            name="receiver"
            value={shippingInfo.receiver}
            onChange={handleChange}
            required
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="Enter receiver's name"
          />
        </div>
        
        <div>
          <label className="block text-indigo-800 font-medium mb-1.5 sm:mb-2 text-sm sm:text-base">
            Address
          </label>
          <input
            type="text"
            name="address"
            value={shippingInfo.address}
            onChange={handleChange}
            required
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="Enter street address"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
          <div>
            <label className="block text-indigo-800 font-medium mb-1.5 sm:mb-2 text-sm sm:text-base">
              City
            </label>
            <input
              type="text"
              name="city"
              value={shippingInfo.city}
              onChange={handleChange}
              required
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Enter city"
            />
          </div>
          <div>
            <label className="block text-indigo-800 font-medium mb-1.5 sm:mb-2 text-sm sm:text-base">
              ZIP Code
            </label>
            <input
              type="text"
              name="zipCode"
              value={shippingInfo.zipCode}
              onChange={handleChange}
              required
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Enter ZIP code"
            />
          </div>
        </div>

        <div>
          <label className="block text-indigo-800 font-medium mb-1.5 sm:mb-2 text-sm sm:text-base">
            State/Province
          </label>
          <input
            type="text"
            name="state"
            value={shippingInfo.state || ''}
            onChange={handleChange}
            required
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="Enter state or province"
          />
        </div>
        
        <div className="mb-6 sm:mb-8">
          <label className="block text-indigo-800 font-medium mb-1.5 sm:mb-2 text-sm sm:text-base">
            Country
          </label>
          <select
            name="country"
            value={shippingInfo.country}
            onChange={handleChange}
            required
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
          >
            <option value="">Select Country</option>
            <option value="USA">United States</option>
            <option value="UK">United Kingdom</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="JP">Japan</option>
            <option value="Philippines">Philippines</option>
          </select>
        </div>
        
        <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 sm:gap-4">
          <button 
            type="button" 
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 border border-indigo-300 text-indigo-700 rounded-lg font-medium text-sm sm:text-base hover:bg-indigo-50 transition-colors active:bg-indigo-100"
            onClick={onBack}
          >
            Back
          </button>
          <button 
            type="submit" 
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg font-medium text-sm sm:text-base hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-md active:scale-[0.98]"
          >
            Continue to Payment
          </button>
        </div>
      </form>
    </div>
  );
};

// Payment Stage Component
interface PaymentStageProps {
  paymentInfo: PaymentInfo;
  setPaymentInfo: (info: PaymentInfo) => void;
  onSubmit: (e: FormEvent) => void;
  onBack: () => void;
}

const PaymentStage = ({ paymentInfo, setPaymentInfo, onSubmit, onBack }: PaymentStageProps) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cod');

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPaymentInfo({
      ...paymentInfo,
      [e.target.name]: e.target.value
    });
  };

  const handleMethodChange = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setPaymentInfo({
      method: method,
      cardNumber: '',
      cardHolder: '',
      expiryDate: '',
      cvv: '',
      gcashNumber: '',
      bankName: '',
      accountNumber: '',
      accountName: ''
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPaymentInfo({
      ...paymentInfo,
      method: selectedMethod
    });
    onSubmit(e);
  };
  
  return (
    <div>
      <h2 className="text-2xl font-serif font-bold text-indigo-900 mb-6 pb-2 border-b border-indigo-100">
        Payment Method
      </h2>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-indigo-800 mb-4">Choose Payment Method</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
              selectedMethod === 'gcash'
                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                : 'border-indigo-200 hover:border-indigo-300 hover:bg-indigo-25'
            }`}
            onClick={() => handleMethodChange('gcash')}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full border-2 ${
                selectedMethod === 'gcash' ? 'bg-indigo-500 border-indigo-500' : 'border-indigo-300'
              }`}></div>
              <div>
                <div className="font-semibold text-indigo-900">GCash</div>
                <div className="text-sm text-indigo-600">Mobile Payment</div>
              </div>
            </div>
            {selectedMethod === 'gcash' && (
              <div className="mt-3 text-xs text-indigo-500">
                Pay using your GCash mobile wallet
              </div>
            )}
          </div>

          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
              selectedMethod === 'bank'
                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                : 'border-indigo-200 hover:border-indigo-300 hover:bg-indigo-25'
            }`}
            onClick={() => handleMethodChange('bank')}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full border-2 ${
                selectedMethod === 'bank' ? 'bg-indigo-500 border-indigo-500' : 'border-indigo-300'
              }`}></div>
              <div>
                <div className="font-semibold text-indigo-900">Bank Transfer</div>
                <div className="text-sm text-indigo-600">Online Banking</div>
              </div>
            </div>
            {selectedMethod === 'bank' && (
              <div className="mt-3 text-xs text-indigo-500">
                Transfer via online banking
              </div>
            )}
          </div>

          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
              selectedMethod === 'cod'
                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                : 'border-indigo-200 hover:border-indigo-300 hover:bg-indigo-25'
            }`}
            onClick={() => handleMethodChange('cod')}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full border-2 ${
                selectedMethod === 'cod' ? 'bg-indigo-500 border-indigo-500' : 'border-indigo-300'
              }`}></div>
              <div>
                <div className="font-semibold text-indigo-900">Cash on Delivery</div>
                <div className="text-sm text-indigo-600">Pay when delivered</div>
              </div>
            </div>
            {selectedMethod === 'cod' && (
              <div className="mt-3 text-xs text-indigo-500">
                Pay cash when you receive your order
              </div>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {selectedMethod === 'gcash' && (
          <div className="space-y-5">
            <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 mb-4">
              <p className="text-indigo-700 text-sm">
                You will be redirected to GCash to complete your payment after placing the order.
              </p>
            </div>
            
            <div className="mb-5">
              <label className="block text-indigo-800 font-medium mb-2">GCash Registered Mobile Number</label>
              <input
                type="tel"
                name="gcashNumber"
                value={paymentInfo.gcashNumber || ''}
                onChange={handleChange}
                placeholder="09XX XXX XXXX"
                required
                className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
              <p className="text-xs text-indigo-600 mt-1">Enter the mobile number linked to your GCash account</p>
            </div>
          </div>
        )}

        {selectedMethod === 'bank' && (
          <div className="space-y-5">
            <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 mb-4">
              <p className="text-indigo-700 text-sm">
                We will provide bank details for transfer after you place the order.
              </p>
            </div>
            
            <div className="mb-5">
              <label className="block text-indigo-800 font-medium mb-2">Bank Name</label>
              <select
                name="bankName"
                value={paymentInfo.bankName || ''}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
              >
                <option value="">Select Your Bank</option>
                <option value="BDO">BDO Unibank</option>
                <option value="BPI">BPI</option>
                <option value="Metrobank">Metrobank</option>
                <option value="UnionBank">UnionBank</option>
                <option value="Landbank">Landbank</option>
                <option value="PNB">PNB</option>
                <option value="Security Bank">Security Bank</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-indigo-800 font-medium mb-2">Account Number</label>
                <input
                  type="text"
                  name="accountNumber"
                  value={paymentInfo.accountNumber || ''}
                  onChange={handleChange}
                  placeholder="Enter account number"
                  required
                  className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-indigo-800 font-medium mb-2">Account Name</label>
                <input
                  type="text"
                  name="accountName"
                  value={paymentInfo.accountName || ''}
                  onChange={handleChange}
                  placeholder="Account holder name"
                  required
                  className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {selectedMethod === 'cod' && (
          <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-lg mb-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">✓</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-green-900 mb-2">Cash on Delivery Selected</h4>
                <p className="text-green-700 text-sm">
                  You will pay with cash when your order is delivered. Please have the exact amount ready.
                </p>
                <div className="mt-3 p-3 bg-green-100 rounded-md">
                  <p className="text-green-800 text-sm font-medium">
                    Expected Delivery: 3-5 business days
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="terms"
              required
              className="mt-1 w-4 h-4 text-indigo-600 border-indigo-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="terms" className="text-sm text-indigo-700">
              I agree to the terms and conditions and authorize the processing of my payment information.
            </label>
          </div>
        </div>
        
        <div className="flex justify-between">
          <button 
            type="button" 
            className="px-6 py-3 border border-indigo-300 text-indigo-700 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
            onClick={onBack}
          >
            Back to Shipping
          </button>
          <button 
            type="submit" 
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-md"
          >
            {selectedMethod === 'cod' ? 'Place Order' : 'Continue to Payment'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Confirmation Stage Component
interface ConfirmationStageProps {
  cartItems: CartItem[];
  shippingInfo: ShippingInfo;
  paymentInfo: PaymentInfo;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  onPlaceOrder: () => void;
  onBack: () => void;
  userId: string;
}

const ConfirmationStage = ({ 
  cartItems, 
  shippingInfo, 
  paymentInfo, 
  subtotal, 
  shippingCost, 
  tax, 
  total, 
  onPlaceOrder, 
  onBack,
  userId
}: ConfirmationStageProps) => {
  const [createOrder, { loading, error }] = useMutation(CREATE_ORDER);

  const getPaymentMethodDisplay = () => {
    switch (paymentInfo.method) {
      case 'gcash':
        return {
          method: 'GCash',
          details: `Mobile: ${paymentInfo.gcashNumber || 'Not provided'}`,
          icon: '📱'
        };
      case 'bank':
        return {
          method: 'Bank Transfer',
          details: `${paymentInfo.bankName || 'No bank selected'} - ${paymentInfo.accountNumber || 'No account number'}`,
          icon: '🏦'
        };
      case 'cod':
        return {
          method: 'Cash on Delivery',
          details: 'Pay when you receive your order',
          icon: '💵'
        };
      default:
        return {
          method: 'Not selected',
          details: 'Please go back and select a payment method',
          icon: '❓'
        };
    }
  };

  const handlePlaceOrder = async () => {
    try {
      const orderItems = cartItems.map(item => ({
        productId: item.id,
        supplierId: item.supplierId,
        quantity: item.quantity,
        price: item.price
      }));
      const OrderParams = {
        userId: userId,
        addressId: shippingInfo.addressId,
        items: orderItems
      }
      
      console.table(OrderParams);
      const result = await createOrder({
        variables: OrderParams
      });

      if (result.data?.createOrder) {
        console.log('Order created successfully:', result.data.createOrder);
        onPlaceOrder();
      } 
    } catch (err) {
      console.error('Error creating order:', err);
    }
  };

  const paymentDisplay = getPaymentMethodDisplay();

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="py-4 sm:py-6 lg:py-8">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-indigo-900">Order Confirmation</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Review your order before placing</p>
        </div>
        
        <div className="space-y-4 mb-6 sm:mb-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold text-xs sm:text-sm">!</span>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-red-800 font-semibold text-sm">Order Error</h3>
                  <p className="text-red-700 text-xs sm:text-sm mt-1">
                    There was a problem placing your order. Please try again.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-xs sm:text-sm">✓</span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-green-800 font-semibold text-sm">Ready to place your order!</h3>
                <p className="text-green-700 text-xs sm:text-sm mt-1">
                  Please review your order details below before confirming.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-6 xl:gap-8">
          <section className="lg:col-span-7 xl:col-span-8 mb-6 lg:mb-0">
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Items ({cartItems.length})</h3>
              
              <div className="space-y-4">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="flex items-start space-x-3 sm:space-x-4 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex-shrink-0">
                      <img
                        src={item.images?.[0] ?? '/NoImage.webp'}
                        alt={item.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover object-center rounded-md"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div className="flex-1">
                          <h4 className="text-sm sm:text-base font-medium text-gray-900 line-clamp-2">
                            {item.name}
                          </h4>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {item.color && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                Color: {item.color}
                              </span>
                            )}
                            {item.size && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                Size: {item.size}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            {formatPesoPrice(item.price)} × {item.quantity}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between sm:flex-col sm:items-end sm:space-y-1">
                          <p className="text-base font-semibold text-gray-900">
                            {formatPesoPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="lg:col-span-5 xl:col-span-4">
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span className="text-sm font-medium text-gray-900">{formatPesoPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Shipping</span>
                    <span className="text-sm font-medium text-gray-900">{formatPesoPrice(shippingCost)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Tax</span>
                    <span className="text-sm font-medium text-gray-900">{formatPesoPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="text-base font-semibold text-gray-900">Total</span>
                    <span className="text-base font-semibold text-gray-900">{formatPesoPrice(total)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Shipping Address</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p className="font-medium text-gray-900">{shippingInfo.receiver}</p>
                  <p className="leading-relaxed">{shippingInfo.address}</p>
                  <p>{shippingInfo.city}, {shippingInfo.zipCode}</p>
                  <p>{shippingInfo.country}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Method</h3>
                <div className="flex items-start space-x-3">
                  <span className="text-lg flex-shrink-0">{paymentDisplay.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">{paymentDisplay.method}</p>
                    <p className="text-gray-600 text-sm mt-1">{paymentDisplay.details}</p>
                    {paymentInfo.method === 'bank' && paymentInfo.accountName && (
                      <p className="text-gray-600 text-sm mt-1">Account: {paymentInfo.accountName}</p>
                    )}
                    {paymentInfo.method === 'cod' && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-yellow-700 text-xs sm:text-sm">
                          Please have exact amount ready for delivery.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 pt-0.5">
                    <span className="text-blue-500 text-sm">ℹ️</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-blue-700 leading-relaxed">
                      <strong>Important:</strong> By placing this order, you agree to our terms and conditions. 
                      {paymentInfo.method === 'cod' ? ' Pay upon delivery.' : ' Payment processed immediately.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 mt-8 py-4 sm:py-6 lg:relative lg:bg-transparent lg:border-t-0 lg:mt-8 lg:pt-8">
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <span className="mr-2">←</span>
              Back to Payment
            </button>
            
            <div className="text-center sm:text-right">
              <div className="flex items-center justify-center sm:justify-end space-x-2 mb-3">
                <span className="text-sm text-gray-600">Total:</span>
                <span className="text-lg font-bold text-gray-900">{formatPesoPrice(total)}</span>
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full sm:w-auto bg-indigo-600 border border-transparent rounded-md shadow-sm px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Placing Order...
                  </span>
                ) : (
                  'Place Order'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Completed Stage Component
interface CompletedStageProps {
  onContinueShopping: () => void;
}

const CompletedStage = ({ onContinueShopping }: CompletedStageProps) => {
  return (
    <div className="text-center py-8">
      <div className="text-5xl text-amber-500 mb-5">
        <i className="fas fa-check-circle"></i>
      </div>
      <h2 className="text-2xl font-serif font-bold text-amber-900 mb-3">Order Placed Successfully!</h2>
      <p className="text-amber-700 mb-6 max-w-md mx-auto">Thank you for your purchase. Your order has been placed and will be processed shortly.</p>
      <button 
        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 transition-all shadow-md"
        onClick={onContinueShopping}
      >
        Continue Shopping
      </button>
    </div>
  );
};

// Order Summary Component
interface OrderSummaryProps {
  cartItems: CartItem[];
  addresses: Address[];
  subtotal: number;
  tax: number;
  total: number;
  onQuantityChange: (id: string | number, quantity: number) => void;
  onCheckout: () => void;
  setCurrentStage: (stage: CartStage) => void;
  currentStage?: CartStage;
  validateStageTransition: (fromStage: CartStage, toStage: CartStage) => boolean;
}

const OrderSummary = ({ 
  cartItems, 
  addresses,
  subtotal, 
  tax, 
  total, 
  onCheckout,
  setCurrentStage,
  currentStage,
  validateStageTransition
}: OrderSummaryProps) => {
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [individualDistances, setIndividualDistances] = useState<number[]>([]);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState<boolean>(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  
  const BASE_RATE = 50;
  const RATE_PER_KM = 15;

  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round((R * c) * 100) / 100;
  };

  useEffect(() => {
    const calculateShipping = async () => {
      if (cartItems.length === 0 || addresses.length === 0) {
        setShippingCost(0);
        setTotalDistance(0);
        setIndividualDistances([]);
        return;
      }

      const defaultAddress = addresses.find((item: Address) => item.isDefault === true);
      
      if (!defaultAddress) {
        console.log("No default address found");
        setShippingError("No default delivery address found");
        setShippingCost(0);
        setTotalDistance(0);
        setIndividualDistances([]);
        return;
      }

      setIsCalculatingShipping(true);
      setShippingError(null);

      try {
        const distances: number[] = [];
        let accumulatedDistance = 0;
        let itemsWithLocation = 0;

        for (const item of cartItems) {
          const pickupLat = item.lat;
          const pickupLng = item.lng;
          const dropoffLat = defaultAddress.lat;
          const dropoffLng = defaultAddress.lng;
          
          if (pickupLat && pickupLng && dropoffLat && dropoffLng) {
            try {
              const distance = await getDistanceInKm(
                { lat: pickupLat, lng: pickupLng },
                { lat: dropoffLat, lng: dropoffLng }
              );
              distances.push(distance);
              accumulatedDistance += distance;
              itemsWithLocation++;
            } catch (error) {
              const fallbackDistance = calculateHaversineDistance(
                pickupLat, pickupLng,
                dropoffLat, dropoffLng
              );
              distances.push(fallbackDistance);
              accumulatedDistance += fallbackDistance;
              itemsWithLocation++;
            }
          } else {
            distances.push(0);
          }
        }

        if (itemsWithLocation > 0) {
          setIndividualDistances(distances);
          setTotalDistance(accumulatedDistance);
          
          const averageDistance = accumulatedDistance / cartItems.length;
          const distanceCharge = averageDistance * RATE_PER_KM;
          const totalShippingCost = BASE_RATE + distanceCharge;
          
          setShippingCost(totalShippingCost);
        } else {
          setShippingCost(0);
          setTotalDistance(0);
          setIndividualDistances([]);
          setShippingError("No items with valid location data found");
        }
      } catch (error) {
        console.error("Error calculating shipping:", error);
        setShippingError("Error calculating shipping cost");
        setShippingCost(0);
        setTotalDistance(0);
        setIndividualDistances([]);
      } finally {
        setIsCalculatingShipping(false);
      }
    };

    calculateShipping();
  }, [cartItems, addresses]);

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-6 md:py-8 px-3 md:px-4">
        <div className="text-indigo-500 mb-3 md:mb-4 flex justify-center">
          <ShoppingCart size={32} className="w-6 h-6 md:w-8 md:h-8 lg:w-12 lg:h-12" />
        </div>
        <h2 className="text-lg md:text-xl lg:text-2xl font-serif font-bold text-indigo-900 mb-1 md:mb-2">Your cart is empty</h2>
        <p className="text-indigo-700 text-xs md:text-sm lg:text-base">Add some items to your cart to continue shopping</p>
      </div>
    );
  }

  const renderStageButton = () => {
    if (currentStage === 'cart') return null;

    switch (currentStage) {
      case 'shipping':
        return (
          <button
            onClick={() => {
              if (validateStageTransition('shipping', 'payment')) {
                setCurrentStage('payment');
              }
            }}
            className="w-full border border-transparent rounded-md sm:rounded-lg py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 text-xs sm:text-sm md:text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform active:scale-[0.98] transition-all duration-200"
          >
            Proceed to Payment
          </button>
        );
      
      case 'payment':
        return (
          <button
            onClick={() => {
              if (validateStageTransition('payment', 'confirmation')) {
                setCurrentStage('confirmation');
              }
            }}
            className="w-full border border-transparent rounded-md sm:rounded-lg py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 text-xs sm:text-sm md:text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform active:scale-[0.98] transition-all duration-200"
          >
            Review Order
          </button>
        );
      
      case 'confirmation':
        return (
          <button
            onClick={() => {
              if (validateStageTransition('confirmation', 'completed')) {
                setCurrentStage('completed');
              }
            }}
            className="w-full border border-transparent rounded-md sm:rounded-lg py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 text-xs sm:text-sm md:text-base font-medium text-white bg-green-600 hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transform active:scale-[0.98] transition-all duration-200"
          >
            Place Order
          </button>
        );
      
      case 'completed':
        return (
          <button
            onClick={() => setCurrentStage('cart')}
            className="w-full border border-transparent rounded-md sm:rounded-lg py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 text-xs sm:text-sm md:text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform active:scale-[0.98] transition-all duration-200"
          >
            Continue Shopping
          </button>
        );
      
      default:
        return null;
    }
  };

  const totalWithShipping = total + shippingCost;

  return (
    <div className="bg-white rounded-lg md:rounded-xl w-full">
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8">
        <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-indigo-900 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
          Order Summary
        </h2>
        
        <div className="flex flex-col w-full">
          <div className="w-full">
            <div className="bg-indigo-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 lg:p-6">
              {isCalculatingShipping && (
                <div className="mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm text-indigo-600 flex items-center gap-1 sm:gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-indigo-600"></div>
                  <span className="text-xs sm:text-sm">Calculating shipping...</span>
                </div>
              )}
              
              {shippingError && (
                <div className="mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm text-red-600 bg-red-50 p-2 sm:p-3 rounded">
                  ⚠ {shippingError}
                </div>
              )}
              
              <div className="flow-root">
                <dl className="-my-2 sm:-my-3 md:-my-4 text-xs sm:text-sm divide-y divide-indigo-200">
                  <div className="py-2 sm:py-3 md:py-4 flex items-center justify-between">
                    <dt className="text-indigo-700 text-xs sm:text-sm">Subtotal</dt>
                    <dd className="font-medium text-indigo-900 text-xs sm:text-sm">{formatPesoPrice(subtotal)}</dd>
                  </div>
                  
                  <div className="py-2 sm:py-3 md:py-4 flex items-center justify-between">
                    <dt className="text-indigo-700 text-xs sm:text-sm">Shipping</dt>
                    <dd className="font-medium text-indigo-900 text-right">
                      <div className="text-xs sm:text-sm">{formatPesoPrice(shippingCost)}</div>
                    </dd>
                  </div>
                  
                  <div className="py-2 sm:py-3 md:py-4 flex items-center justify-between">
                    <dt className="text-indigo-700 text-xs sm:text-sm">Tax</dt>
                    <dd className="font-medium text-indigo-900 text-xs sm:text-sm">{formatPesoPrice(tax)}</dd>
                  </div>
                  
                  <div className="py-2 sm:py-3 md:py-4 flex items-center justify-between">
                    <dt className="text-xs sm:text-sm md:text-base font-bold text-indigo-900">Total</dt>
                    <dd className="text-xs sm:text-sm md:text-base font-bold text-indigo-900">{formatPesoPrice(totalWithShipping)}</dd>
                  </div>
                </dl>
              </div>

              {currentStage === 'cart' ? (
                <button
                  onClick={() => {
                    if (validateStageTransition('cart', 'shipping')) {
                      onCheckout();
                      setCurrentStage('shipping');
                    }
                  }}
                  disabled={isCalculatingShipping || !!shippingError}
                  className={`mt-3 sm:mt-4 md:mt-5 lg:mt-6 w-full border border-transparent rounded-md sm:rounded-lg py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 text-xs sm:text-sm md:text-base font-medium text-white transition-all duration-200 ${
                    isCalculatingShipping || shippingError
                      ? 'bg-gray-400 cursor-not-allowed opacity-50'
                      : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform active:scale-[0.98]'
                  }`}
                >
                  {isCalculatingShipping ? 'Calculating Shipping...' : 'Proceed to Checkout'}
                </button>
              ) : (
                renderStageButton()
              )}

              {currentStage && currentStage !== 'cart' && currentStage !== 'completed' && (
                <div className="mt-3 flex gap-2 justify-center">
                  <button
                    onClick={() => {
                      const backStage = currentStage === 'shipping' ? 'cart' : 
                                       currentStage === 'payment' ? 'shipping' : 
                                       currentStage === 'confirmation' ? 'payment' : 'cart';
                      if (validateStageTransition(currentStage, backStage)) {
                        setCurrentStage(backStage);
                      }
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                  >
                    ← Back to {currentStage === 'shipping' ? 'Cart' : 
                               currentStage === 'payment' ? 'Shipping' : 
                               currentStage === 'confirmation' ? 'Payment' : ''}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main DeluxeCart Component
const DeluxeCart = () => {
  const { user, loading } = useAuth();
  
  const [currentStage, setCurrentStage] = useState<CartStage>('cart');
  const [stageError, setStageError] = useState<string | null>(null);
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
  
  const { data: profileData, loading: profileDataLoading, refetch: refresh } = useQuery(GET_USER_PROFILE, {
    variables: { id: user?.userId },
  });
  
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
    if (validateStageTransition('shipping', 'payment')) {
      setCurrentStage('payment');
    }
  };
  
  const handlePaymentSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validateStageTransition('payment', 'confirmation')) {
      setCurrentStage('confirmation');
    }
  };
  
  const handlePlaceOrder = () => {
    if (validateStageTransition('confirmation', 'completed')) {
      dispatch(clearCart());
      setCurrentStage('completed');
    }
  };
  
  const handleContinueShopping = () => {
    setCurrentStage('cart');
  };

  // Centralized stage validation function
  const validateStageTransition = (fromStage: CartStage, toStage: CartStage): boolean => {
    setStageError(null);

    // Define validation rules for each stage transition
    const validationRules: Record<string, () => boolean> = {
      // Cart to Shipping validation
      'cart->shipping': () => {
        if (cartItems.length === 0) {
          setStageError('Your cart is empty. Please add items before proceeding.');
          return false;
        }
        if (!userId) {
          setStageError('Please log in to continue with checkout.');
          return false;
        }
        return true;
      },

      // Shipping to Payment validation
      'shipping->payment': () => {
        if (!userId) {
          setStageError('User authentication required.');
          return false;
        }
        
        // Validate shipping info is complete
        const requiredShippingFields: (keyof ShippingInfo)[] = [
          'receiver', 'address', 'city', 'zipCode', 'country', 'state'
        ];
        
        const missingFields = requiredShippingFields.filter(
          field => !shippingInfo[field] || shippingInfo[field].trim() === ''
        );
        
        if (missingFields.length > 0) {
          setStageError(`Please complete all shipping information fields: ${missingFields.join(', ')}`);
          return false;
        }
        
        return true;
      },

      // Payment to Confirmation validation
      'payment->confirmation': () => {
        if (!userId) {
          setStageError('User authentication required.');
          return false;
        }
        
        if (!paymentInfo.method) {
          setStageError('Please select a payment method.');
          return false;
        }

        // Validate specific payment method requirements
        if (paymentInfo.method === 'gcash' && !paymentInfo.gcashNumber) {
          setStageError('Please enter your GCash mobile number.');
          return false;
        }

        if (paymentInfo.method === 'bank') {
          if (!paymentInfo.bankName || !paymentInfo.accountNumber || !paymentInfo.accountName) {
            setStageError('Please complete all bank transfer details.');
            return false;
          }
        }

        return true;
      },

      // Confirmation to Completed validation
      'confirmation->completed': () => {
        if (cartItems.length === 0) {
          setStageError('Cannot place order: Cart is empty.');
          return false;
        }
        
        if (!userId) {
          setStageError('User authentication required to place order.');
          return false;
        }
        
        if (!shippingInfo.addressId) {
          setStageError('Shipping address is required.');
          return false;
        }
        
        if (!paymentInfo.method) {
          setStageError('Payment method is required.');
          return false;
        }

        return true;
      },

      // Back navigation validation (always allowed)
      'shipping->cart': () => true,
      'payment->shipping': () => true,
      'confirmation->payment': () => true,
    };

    const transitionKey = `${fromStage}->${toStage}`;
    const validator = validationRules[transitionKey];

    if (!validator) {
      console.warn(`No validation rule defined for transition: ${transitionKey}`);
      return true; // Allow transition if no specific rule defined
    }

    const isValid = validator();
    
    if (!isValid) {
      console.log(`Stage transition validation failed: ${transitionKey}`, stageError);
    }

    return isValid;
  };

  // Wrapper for setCurrentStage that includes validation
  const handleStageChange = (newStage: CartStage) => {
    if (validateStageTransition(currentStage, newStage)) {
      setCurrentStage(newStage);
    }
  };
  
  if (loading || profileDataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <CartStageShimmer />
        </div>
      </div>
    );
  }
  
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
        
        {/* Error Display */}
        {stageError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm flex items-center">
              <span className="mr-2">⚠</span>
              {stageError}
            </p>
          </div>
        )}
        
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
              addresses={profileData?.user.addresses}
              setShippingInfo={setShippingInfo}
              onSubmit={handleShippingSubmit}
              onBack={() => handleStageChange('cart')}
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
                onClick={() => handleStageChange('cart')}
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
              onBack={() => handleStageChange('shipping')}
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
              onBack={() => handleStageChange('payment')}
            />
          )}
          
          {currentStage === 'confirmation' && !userId && (
            <div className="text-center py-12">
              <p className="text-red-500">User information not available</p>
              <button
                onClick={() => handleStageChange('cart')}
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
            setCurrentStage={handleStageChange}
            currentStage={currentStage}
            validateStageTransition={validateStageTransition}
          />
        </div>
      </div>
    </div>
  );
};

export default DeluxeCart;
