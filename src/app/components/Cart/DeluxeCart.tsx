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
  termsAccepted?: boolean;
}

type Coordinate = {
  lat: number;
  lng: number;
};

type PaymentMethod = 'gcash' | 'bank' | 'cod';
type CartStage = 'cart' | 'shipping' | 'payment' | 'confirmation' | 'completed';

const formatPesoPrice = (price: number): string => {
  return `₱${price.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

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

// Shimmer Component - Optimized for mobile
const CartStageShimmer = () => (
  <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 lg:p-8 animate-pulse">
    <div className="h-6 sm:h-7 md:h-8 bg-indigo-200 rounded w-32 sm:w-40 md:w-48 mb-4 sm:mb-6"></div>
    <div className="space-y-3 sm:space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex space-x-3 sm:space-x-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-indigo-200 rounded"></div>
          <div className="flex-1 space-y-2 sm:space-y-3">
            <div className="h-3 sm:h-4 bg-indigo-200 rounded w-3/4"></div>
            <div className="h-3 sm:h-4 bg-indigo-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Cart Stage Component - Mobile optimized
interface CartStageProps {
  cartItems: CartItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  onQuantityChange: (id: string | number, quantity: number) => void;
}

const CartStage = ({ cartItems, onQuantityChange }: CartStageProps) => {
  if (cartItems.length === 0) {
    return (
      <div className="text-center py-6 sm:py-8 md:py-12 px-2 sm:px-4">
        <div className="text-indigo-500 mb-2 sm:mb-3 md:mb-4 flex justify-center">
          <ShoppingCart size={32} className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12" />
        </div>
        <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-indigo-900 mb-1 sm:mb-2">Your cart is empty</h2>
        <p className="text-indigo-700 text-xs sm:text-sm md:text-base">Add some items to your cart to continue shopping</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 md:py-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-indigo-900 mb-4 sm:mb-6">Shopping Cart</h2>
        
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          <div className="flex-1">
            <div className="flow-root">
              <ul role="list" className="-my-3 sm:-my-4 divide-y divide-gray-200">
                {cartItems.map((item: any) => (
                  <li key={item.id} className="flex py-3 sm:py-4 md:py-5">
                    <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 flex-shrink-0 overflow-hidden rounded border border-gray-200">
                      <img
                        src={item.images?.[0] || '/NoImage.webp'}
                        alt={item.name}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>

                    <div className="ml-2 sm:ml-3 md:ml-4 flex flex-1 flex-col">
                      <div className="flex flex-col xs:flex-row xs:justify-between">
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="text-xs sm:text-sm md:text-base font-serif font-semibold text-indigo-900 line-clamp-2">
                            {item.name}
                          </h3>
                          <div className="mt-1 flex items-center flex-wrap gap-1 sm:gap-2">
                            <div 
                              className="h-3 w-3 sm:h-4 sm:w-4 rounded-full border border-gray-300 shadow-sm"
                              style={{ backgroundColor: item.color || '#cccccc' }}
                              title={item.color}
                            />
                            <p className="text-xs text-indigo-600">{item.size}</p>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm md:text-base font-medium text-indigo-700 mt-1 xs:mt-0 xs:ml-2 whitespace-nowrap">
                          {formatPesoPrice((item?.price || 0) * (item?.quantity || 0))}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2 sm:mt-3">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <span className="text-xs text-indigo-700">Qty</span>
                          <div className="flex items-center border border-gray-300 rounded">
                            <button
                              onClick={() => onQuantityChange(item?.id, (item?.quantity ?? 0) - 1)}
                              className="h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-l transition-colors"
                            >
                              <Minus size={10} className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </button>
                            <span className="h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center text-gray-900 font-medium text-xs">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                              className="h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-r transition-colors"
                            >
                              <Plus size={10} className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => onQuantityChange(item.id, 0)}
                          type="button"
                          className="font-medium text-indigo-600 hover:text-indigo-500 flex items-center space-x-1"
                        >
                          <Trash2 size={12} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span className="text-xs hidden xs:inline">Remove</span>
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

// Shipping Stage Component - Mobile optimized
interface ShippingStageProps {
  shippingInfo: ShippingInfo;
  addresses: Address[];
  setShippingInfo: (info: ShippingInfo) => void;
  userId: string;
  refresh: any;
}

const ShippingStage = ({ 
  shippingInfo, 
  addresses, 
  setShippingInfo, 
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
    <div className="w-full">
      <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-indigo-900 mb-3 sm:mb-4 pb-2 border-b border-indigo-100">
        Shipping Information
      </h2>

      {savedAddresses.length > 0 && (
        <div className="mb-4 sm:mb-6">
          <h3 className="text-sm sm:text-base font-semibold text-indigo-800 mb-2 sm:mb-3">
            Select a saved address
          </h3>
          
          <div className="space-y-2 sm:space-y-3 mb-3">
            {savedAddresses.map((address) => (
              <div
                key={address.id}
                className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                  selectedAddressId === address.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-indigo-200 hover:border-indigo-300'
                }`}
                onClick={() => handleAddressSelect(address)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center flex-wrap gap-1">
                    <span className="font-medium text-indigo-900 text-sm">
                      {address.type}
                    </span>
                    {address.isDefault && (
                      <span className="bg-indigo-100 text-indigo-800 text-xs px-1.5 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  {selectedAddressId === address.id && (
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  )}
                </div>
                
                <div className="text-xs sm:text-sm text-indigo-700 space-y-0.5">
                  <p className="font-medium text-sm">{address.receiver}</p>
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
            className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center space-x-1 transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            <span>Use a new address</span>
          </button>
        </div>
      )}

      <div className="space-y-3 sm:space-y-4">
        <div>
          <label className="block text-indigo-800 font-medium mb-1 text-sm">
            Receiver Name
          </label>
          <input
            type="text"
            name="receiver"
            value={shippingInfo.receiver}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="Enter receiver's name"
          />
        </div>
        
        <div>
          <label className="block text-indigo-800 font-medium mb-1 text-sm">
            Address
          </label>
          <input
            type="text"
            name="address"
            value={shippingInfo.address}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="Enter street address"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div>
            <label className="block text-indigo-800 font-medium mb-1 text-sm">
              City
            </label>
            <input
              type="text"
              name="city"
              value={shippingInfo.city}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="City"
            />
          </div>
          <div>
            <label className="block text-indigo-800 font-medium mb-1 text-sm">
              ZIP Code
            </label>
            <input
              type="text"
              name="zipCode"
              value={shippingInfo.zipCode}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="ZIP"
            />
          </div>
        </div>

        <div>
          <label className="block text-indigo-800 font-medium mb-1 text-sm">
            State/Province
          </label>
          <input
            type="text"
            name="state"
            value={shippingInfo.state || ''}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="Enter state or province"
          />
        </div>
        
        <div>
          <label className="block text-indigo-800 font-medium mb-1 text-sm">
            Country
          </label>
          <select
            name="country"
            value={shippingInfo.country}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
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
      </div>
    </div>
  );
};

// Payment Stage Component - Mobile optimized
interface PaymentStageProps {
  paymentInfo: PaymentInfo;
  setPaymentInfo: (info: PaymentInfo) => void;
}

const PaymentStage = ({ paymentInfo, setPaymentInfo }: PaymentStageProps) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cod');

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPaymentInfo({
      ...paymentInfo,
      [e.target.name]: e.target.value
    });
  };

  const handleTermsChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPaymentInfo({
      ...paymentInfo,
      termsAccepted: e.target.checked
    });
  };

  const handleMethodChange = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setPaymentInfo({
      ...paymentInfo,
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
  
  return (
    <div>
      <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-indigo-900 mb-3 sm:mb-4 pb-2 border-b border-indigo-100">
        Payment Method
      </h2>
      
      <div className="mb-4 sm:mb-6">
        <h3 className="text-sm sm:text-base font-semibold text-indigo-800 mb-2 sm:mb-3">Choose Payment Method</h3>
        
        <div className="space-y-2 sm:space-y-3 mb-4">
          <div
            className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
              selectedMethod === 'gcash'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-indigo-200 hover:border-indigo-300'
            }`}
            onClick={() => handleMethodChange('gcash')}
          >
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
                selectedMethod === 'gcash' ? 'bg-indigo-500 border-indigo-500' : 'border-indigo-300'
              }`}></div>
              <div>
                <div className="font-semibold text-indigo-900 text-sm">GCash</div>
                <div className="text-xs text-indigo-600">Mobile Payment</div>
              </div>
            </div>
            {selectedMethod === 'gcash' && (
              <div className="mt-2 text-xs text-indigo-500 pl-5">
                Pay using your GCash mobile wallet
              </div>
            )}
          </div>

          <div
            className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
              selectedMethod === 'bank'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-indigo-200 hover:border-indigo-300'
            }`}
            onClick={() => handleMethodChange('bank')}
          >
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
                selectedMethod === 'bank' ? 'bg-indigo-500 border-indigo-500' : 'border-indigo-300'
              }`}></div>
              <div>
                <div className="font-semibold text-indigo-900 text-sm">Bank Transfer</div>
                <div className="text-xs text-indigo-600">Online Banking</div>
              </div>
            </div>
            {selectedMethod === 'bank' && (
              <div className="mt-2 text-xs text-indigo-500 pl-5">
                Transfer via online banking
              </div>
            )}
          </div>

          <div
            className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
              selectedMethod === 'cod'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-indigo-200 hover:border-indigo-300'
            }`}
            onClick={() => handleMethodChange('cod')}
          >
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
                selectedMethod === 'cod' ? 'bg-indigo-500 border-indigo-500' : 'border-indigo-300'
              }`}></div>
              <div>
                <div className="font-semibold text-indigo-900 text-sm">Cash on Delivery</div>
                <div className="text-xs text-indigo-600">Pay when delivered</div>
              </div>
            </div>
            {selectedMethod === 'cod' && (
              <div className="mt-2 text-xs text-indigo-500 pl-5">
                Pay cash when you receive your order
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        {selectedMethod === 'gcash' && (
          <div className="space-y-3">
            <div className="bg-indigo-50 border-l-4 border-indigo-400 p-3 mb-3">
              <p className="text-indigo-700 text-xs">
                You will be redirected to GCash to complete your payment after placing the order.
              </p>
            </div>
            
            <div>
              <label className="block text-indigo-800 font-medium mb-1 text-sm">GCash Registered Mobile Number</label>
              <input
                type="tel"
                name="gcashNumber"
                value={paymentInfo.gcashNumber || ''}
                onChange={handleChange}
                placeholder="09XX XXX XXXX"
                required
                className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
              <p className="text-xs text-indigo-600 mt-1">Enter the mobile number linked to your GCash account</p>
            </div>
          </div>
        )}

        {selectedMethod === 'bank' && (
          <div className="space-y-3">
            <div className="bg-indigo-50 border-l-4 border-indigo-400 p-3 mb-3">
              <p className="text-indigo-700 text-xs">
                We will provide bank details for transfer after you place the order.
              </p>
            </div>
            
            <div>
              <label className="block text-indigo-800 font-medium mb-1 text-sm">Bank Name</label>
              <select
                name="bankName"
                value={paymentInfo.bankName || ''}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
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
            
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-indigo-800 font-medium mb-1 text-sm">Account Number</label>
                <input
                  type="text"
                  name="accountNumber"
                  value={paymentInfo.accountNumber || ''}
                  onChange={handleChange}
                  placeholder="Enter account number"
                  required
                  className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-indigo-800 font-medium mb-1 text-sm">Account Name</label>
                <input
                  type="text"
                  name="accountName"
                  value={paymentInfo.accountName || ''}
                  onChange={handleChange}
                  placeholder="Account holder name"
                  required
                  className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {selectedMethod === 'cod' && (
          <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded-lg mb-4">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-xs">✓</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-green-900 text-sm mb-1">Cash on Delivery Selected</h4>
                <p className="text-green-700 text-xs">
                  You will pay with cash when your order is delivered.
                </p>
                <div className="mt-2 p-2 bg-green-100 rounded">
                  <p className="text-green-800 text-xs font-medium">
                    Expected Delivery: 3-5 business days
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4">
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              id="terms"
              checked={paymentInfo.termsAccepted || false}
              onChange={handleTermsChange}
              required
              className="mt-0.5 w-3.5 h-3.5 text-indigo-600 border-indigo-300 rounded focus:ring-indigo-500 flex-shrink-0"
            />
            <label htmlFor="terms" className="text-xs text-indigo-700">
              I agree to the terms and conditions and authorize the processing of my payment information.
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

// Confirmation Stage Component - Mobile optimized
interface ConfirmationStageProps {
  cartItems: CartItem[];
  shippingInfo: ShippingInfo;
  paymentInfo: PaymentInfo;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
}

const ConfirmationStage = ({ 
  cartItems, 
  shippingInfo, 
  paymentInfo, 
  subtotal, 
  shippingCost, 
  tax, 
  total 
}: ConfirmationStageProps) => {
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

  const paymentDisplay = getPaymentMethodDisplay();

  return (
    <div className="bg-white">
      <div className="px-2 sm:px-3 lg:px-4">
        <div className="py-3 sm:py-4">
          <h2 className="text-lg sm:text-xl font-serif font-bold text-indigo-900">Order Confirmation</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Review your order before placing</p>
        </div>
        
        <div className="space-y-3 mb-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="w-4 h-4 sm:w-5 sm:h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-xs">✓</span>
                </div>
              </div>
              <div className="ml-2 flex-1">
                <h3 className="text-green-800 font-semibold text-xs">Ready to place your order!</h3>
                <p className="text-green-700 text-xs mt-0.5">
                  Please review your order details below before confirming.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <section>
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Order Items ({cartItems.length})</h3>
              
              <div className="space-y-2">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="flex items-start space-x-2 p-2 bg-white rounded border border-gray-200">
                    <div className="flex-shrink-0">
                      <img
                        src={item.images?.[0] ?? '/NoImage.webp'}
                        alt={item.name}
                        className="w-12 h-12 sm:w-14 sm:h-14 object-cover object-center rounded"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <div className="flex-1">
                          <h4 className="text-xs font-medium text-gray-900 line-clamp-2 pr-1">
                            {item.name}
                          </h4>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.color && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                                {item.color}
                              </span>
                            )}
                            {item.size && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                                {item.size}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {formatPesoPrice(item.price)} × {item.quantity}
                          </p>
                        </div>
                        
                        <p className="text-xs font-semibold text-gray-900 whitespace-nowrap">
                          {formatPesoPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Shipping Address</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p className="font-medium text-gray-900">{shippingInfo.receiver}</p>
                <p className="leading-relaxed">{shippingInfo.address}</p>
                <p>{shippingInfo.city}, {shippingInfo.zipCode}</p>
                <p>{shippingInfo.country}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Payment Method</h3>
              <div className="flex items-start space-x-2">
                <span className="text-base flex-shrink-0">{paymentDisplay.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{paymentDisplay.method}</p>
                  <p className="text-gray-600 text-xs mt-0.5">{paymentDisplay.details}</p>
                  {paymentInfo.method === 'bank' && paymentInfo.accountName && (
                    <p className="text-gray-600 text-xs mt-0.5">Account: {paymentInfo.accountName}</p>
                  )}
                  {paymentInfo.method === 'cod' && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-yellow-700 text-xs">
                        Please have exact amount ready for delivery.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 pt-0.5">
                  <span className="text-blue-500 text-xs">ℹ️</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-blue-700 leading-relaxed">
                    <strong>Important:</strong> By placing this order, you agree to our terms and conditions.
                  </p>
                </div>
              </div>
            </div>
          </section>
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
    <div className="text-center py-6 sm:py-8">
      <div className="text-4xl sm:text-5xl text-amber-500 mb-3 sm:mb-4">
        ✓
      </div>
      <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-amber-900 mb-2">Order Placed Successfully!</h2>
      <p className="text-amber-700 text-xs sm:text-sm mb-4 px-4">Thank you for your purchase. Your order has been placed and will be processed shortly.</p>
      <button
        onClick={onContinueShopping}
        className="inline-block px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors"
      >
        Continue Shopping
      </button>
    </div>
  );
};

// Order Summary Component - Mobile optimized
interface OrderSummaryProps {
  cartItems: CartItem[];
  addresses: Address[];
  subtotal: number;
  tax: number;
  total: number;
  currentStage: CartStage;
  onProceedToShipping: () => void;
  onProceedToPayment: () => void;
  onProceedToConfirmation: () => void;
  onPlaceOrder: () => Promise<void>;
  onBackToCart: () => void;
  onBackToShipping: () => void;
  onBackToPayment: () => void;
  onContinueShopping: () => void;
  isPlacingOrder: boolean;
  canProceedToShipping: boolean;
  canProceedToPayment: boolean;
  canProceedToConfirmation: boolean;
  canPlaceOrder: boolean;
}

const OrderSummary = ({ 
  cartItems, 
  addresses,
  subtotal, 
  tax, 
  total, 
  currentStage,
  onProceedToShipping,
  onProceedToPayment,
  onProceedToConfirmation,
  onPlaceOrder,
  onBackToCart,
  onBackToShipping,
  onBackToPayment,
  onContinueShopping,
  isPlacingOrder,
  canProceedToShipping,
  canProceedToPayment,
  canProceedToConfirmation,
  canPlaceOrder
}: OrderSummaryProps) => {
  const [shippingCost, setShippingCost] = useState<number>(0);
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
        return;
      }

      const defaultAddress = addresses.find((item: Address) => item.isDefault === true);
      
      if (!defaultAddress) {
        setShippingError("No default delivery address found");
        setShippingCost(0);
        return;
      }

      setIsCalculatingShipping(true);
      setShippingError(null);

      try {
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
              accumulatedDistance += distance;
              itemsWithLocation++;
            } catch (error) {
              const fallbackDistance = calculateHaversineDistance(
                pickupLat, pickupLng,
                dropoffLat, dropoffLng
              );
              accumulatedDistance += fallbackDistance;
              itemsWithLocation++;
            }
          }
        }

        if (itemsWithLocation > 0) {
          const averageDistance = accumulatedDistance / cartItems.length;
          const distanceCharge = averageDistance * RATE_PER_KM;
          const totalShippingCost = BASE_RATE + distanceCharge;
          setShippingCost(totalShippingCost);
        } else {
          setShippingCost(0);
          setShippingError("No items with valid location data found");
        }
      } catch (error) {
        console.error("Error calculating shipping:", error);
        setShippingError("Error calculating shipping cost");
        setShippingCost(0);
      } finally {
        setIsCalculatingShipping(false);
      }
    };

    calculateShipping();
  }, [cartItems, addresses]);

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-4 px-2">
        <div className="text-indigo-500 mb-2 flex justify-center">
          <ShoppingCart size={24} className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <h2 className="text-base sm:text-lg font-serif font-bold text-indigo-900 mb-1">Your cart is empty</h2>
        <p className="text-indigo-700 text-xs">Add some items to your cart to continue shopping</p>
      </div>
    );
  }

  const totalWithShipping = total + shippingCost;

  const renderNavigationButtons = () => {
    switch (currentStage) {
      case 'cart':
        return (
          <button
            onClick={onProceedToShipping}
            disabled={!canProceedToShipping || isCalculatingShipping}
            className={`w-full rounded-lg py-2.5 px-3 text-sm font-medium text-white transition-all duration-200 ${
              !canProceedToShipping || isCalculatingShipping
                ? 'bg-gray-400 cursor-not-allowed opacity-50'
                : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
            }`}
          >
            {isCalculatingShipping ? 'Calculating Shipping...' : 'Proceed to Shipping'}
          </button>
        );

      case 'shipping':
        return (
          <div className="space-y-2">
            <button
              onClick={onProceedToPayment}
              disabled={!canProceedToPayment}
              className={`w-full rounded-lg py-2.5 px-3 text-sm font-medium text-white transition-all duration-200 ${
                !canProceedToPayment
                  ? 'bg-gray-400 cursor-not-allowed opacity-50'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
              }`}
            >
              Proceed to Payment
            </button>
            <button
              onClick={onBackToCart}
              className="w-full text-xs text-indigo-600 hover:text-indigo-800 underline py-1"
            >
              ← Back to Cart
            </button>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-2">
            <button
              onClick={onProceedToConfirmation}
              disabled={!canProceedToConfirmation}
              className={`w-full rounded-lg py-2.5 px-3 text-sm font-medium text-white transition-all duration-200 ${
                !canProceedToConfirmation
                  ? 'bg-gray-400 cursor-not-allowed opacity-50'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
              }`}
            >
              Review Order
            </button>
            <button
              onClick={onBackToShipping}
              className="w-full text-xs text-indigo-600 hover:text-indigo-800 underline py-1"
            >
              ← Back to Shipping
            </button>
          </div>
        );

      case 'confirmation':
        return (
          <div className="space-y-2">
            <button
              onClick={onPlaceOrder}
              disabled={!canPlaceOrder || isPlacingOrder}
              className={`w-full rounded-lg py-2.5 px-3 text-sm font-medium text-white transition-all duration-200 ${
                !canPlaceOrder || isPlacingOrder
                  ? 'bg-gray-400 cursor-not-allowed opacity-50'
                  : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
              }`}
            >
              {isPlacingOrder ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Placing Order...
                </span>
              ) : (
                'Place Order'
              )}
            </button>
            <button
              onClick={onBackToPayment}
              className="w-full text-xs text-indigo-600 hover:text-indigo-800 underline py-1"
            >
              ← Back to Payment
            </button>
          </div>
        );

      case 'completed':
        return (
          <button
            onClick={onContinueShopping}
            className="w-full rounded-lg py-2.5 px-3 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-all duration-200"
          >
            Continue Shopping
          </button>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg w-full">
      <div className="p-3 sm:p-4">
        <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold text-indigo-900 mb-3">
          Order Summary
        </h2>
        
        <div className="bg-indigo-50 rounded-lg p-3">
          {isCalculatingShipping && (
            <div className="mb-2 text-xs text-indigo-600 flex items-center gap-1">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600"></div>
              <span>Calculating shipping...</span>
            </div>
          )}
          
          {shippingError && (
            <div className="mb-2 text-xs text-red-600 bg-red-50 p-2 rounded">
              ⚠ {shippingError}
            </div>
          )}
          
          <div className="flow-root">
            <dl className="-my-2 text-xs divide-y divide-indigo-200">
              <div className="py-2 flex items-center justify-between">
                <dt className="text-indigo-700">Subtotal</dt>
                <dd className="font-medium text-indigo-900">{formatPesoPrice(subtotal)}</dd>
              </div>
              
              <div className="py-2 flex items-center justify-between">
                <dt className="text-indigo-700">Shipping</dt>
                <dd className="font-medium text-indigo-900">{formatPesoPrice(shippingCost)}</dd>
              </div>
              
              <div className="py-2 flex items-center justify-between">
                <dt className="text-indigo-700">Tax</dt>
                <dd className="font-medium text-indigo-900">{formatPesoPrice(tax)}</dd>
              </div>
              
              <div className="py-2 flex items-center justify-between">
                <dt className="text-sm font-bold text-indigo-900">Total</dt>
                <dd className="text-sm font-bold text-indigo-900">{formatPesoPrice(totalWithShipping)}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-3">
            {renderNavigationButtons()}
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
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [orderError, setOrderError] = useState<string | null>(null);
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
    cvv: '',
    termsAccepted: false
  });
  
  const cartItems = useSelector((state: any) => state.cart.cartItems as CartItem[]);
  const dispatch = useDispatch();
  const userId = user?.userId;
  
  const { data: profileData, loading: profileDataLoading, refetch: refresh } = useQuery(GET_USER_PROFILE, {
    variables: { id: user?.userId },
    skip: !user?.userId,
  });
  
  const [createOrder] = useMutation(CREATE_ORDER);
  
  const subtotal = cartItems.reduce((total: number, item: any) => 
    total + (item.price * item.quantity), 0
  );
  const shippingCost = subtotal > 0 ? 5.99 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Scroll to top whenever stage changes
  useEffect(() => {
    scrollToTop();
  }, [currentStage]);
  
  const handleQuantityChange = (id: string | number, quantity: number) => {
    if (quantity === 0) {
      dispatch(removeFromCart({ id }));
    } else {
      dispatch(changeQuantity({ id, quantity }));
    }
  };

  const handlePlaceOrder = async (): Promise<void> => {
    if (!validateStageTransition('confirmation', 'completed')) {
      return;
    }

    setIsPlacingOrder(true);
    setOrderError(null);

    try {
      const orderItems = cartItems.map(item => ({
        productId: item.id,
        supplierId: item.supplierId,
        quantity: item.quantity,
        price: item.price
      }));

      const orderParams = {
        userId: userId,
        addressId: shippingInfo.addressId,
        items: orderItems
      };

      const result = await createOrder({
        variables: orderParams
      });

      if (result.data?.createOrder) {
        dispatch(clearCart());
        setCurrentStage('completed');
      } else {
        throw new Error('Failed to create order');
      }
    } catch (err) {
      console.error('Error creating order:', err);
      setOrderError(err instanceof Error ? err.message : 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const validateStageTransition = (fromStage: CartStage, toStage: CartStage): boolean => {
    setStageError(null);

    const validationRules: Record<string, () => boolean> = {
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

      'shipping->payment': () => {
        if (!userId) {
          setStageError('User authentication required.');
          return false;
        }
        
        const requiredShippingFields: (keyof ShippingInfo)[] = [
          'receiver', 'address', 'city', 'zipCode', 'country', 'state'
        ];
        
        const missingFields = requiredShippingFields.filter(
          field => !shippingInfo[field] || shippingInfo[field]?.trim() === ''
        );
        
        if (missingFields.length > 0) {
          setStageError(`Please complete all shipping information fields: ${missingFields.join(', ')}`);
          return false;
        }
        
        return true;
      },

      'payment->confirmation': () => {
        if (!userId) {
          setStageError('User authentication required.');
          return false;
        }
        
        if (!paymentInfo.method) {
          setStageError('Please select a payment method.');
          return false;
        }

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

        if (!paymentInfo.termsAccepted) {
          setStageError('You must accept the terms and conditions to proceed.');
          return false;
        }

        return true;
      },

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

        if (!paymentInfo.termsAccepted) {
          setStageError('You must accept the terms and conditions to place order.');
          return false;
        }

        return true;
      },

      'shipping->cart': () => true,
      'payment->shipping': () => true,
      'confirmation->payment': () => true,
    };

    const transitionKey = `${fromStage}->${toStage}`;
    const validator = validationRules[transitionKey];

    if (!validator) {
      return true;
    }

    return validator();
  };

  const handleProceedToShipping = () => {
    if (validateStageTransition('cart', 'shipping')) {
      setCurrentStage('shipping');
    }
  };

  const handleProceedToPayment = () => {
    if (validateStageTransition('shipping', 'payment')) {
      setCurrentStage('payment');
    }
  };

  const handleProceedToConfirmation = () => {
    if (validateStageTransition('payment', 'confirmation')) {
      setCurrentStage('confirmation');
    }
  };

  const handleBackToCart = () => {
    if (validateStageTransition('shipping', 'cart')) {
      setCurrentStage('cart');
    }
  };

  const handleBackToShipping = () => {
    if (validateStageTransition('payment', 'shipping')) {
      setCurrentStage('shipping');
    }
  };

  const handleBackToPayment = () => {
    if (validateStageTransition('confirmation', 'payment')) {
      setCurrentStage('payment');
    }
  };

  const handleContinueShopping = () => {
    setCurrentStage('cart');
  };

  const canProceedToShipping = Boolean(cartItems.length > 0 && userId);
  const canProceedToPayment = Boolean(
    userId && 
    shippingInfo.receiver && 
    shippingInfo.address && 
    shippingInfo.city && 
    shippingInfo.zipCode && 
    shippingInfo.country && 
    shippingInfo.state
  );
  const canProceedToConfirmation = Boolean(
    userId && 
    paymentInfo.method && 
    (paymentInfo.method !== 'gcash' || paymentInfo.gcashNumber) &&
    (paymentInfo.method !== 'bank' || (paymentInfo.bankName && paymentInfo.accountNumber && paymentInfo.accountName)) &&
    paymentInfo.termsAccepted
  );
  const canPlaceOrder = Boolean(
    userId && 
    shippingInfo.addressId && 
    paymentInfo.method && 
    cartItems.length > 0 &&
    paymentInfo.termsAccepted
  );
  
  if (loading || profileDataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100 py-4 px-2 sm:py-6 sm:px-3 md:py-8 md:px-4">
        <div className="max-w-6xl mx-auto">
          <CartStageShimmer />
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100 py-4 px-2 sm:py-6 sm:px-3 md:py-8 md:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Progress Steps - Mobile Optimized */}
        <div className="flex justify-between relative mb-6 sm:mb-8 md:mb-10">
          <div className="absolute top-3 left-0 right-0 h-0.5 bg-indigo-200 z-0"></div>
          
          {['cart', 'shipping', 'payment', 'confirmation'].map((stage, index) => {
            const stageIndex = ['cart', 'shipping', 'payment', 'confirmation'].indexOf(currentStage);
            const isCompleted = index < stageIndex;
            const isActive = index === stageIndex;
            
            return (
              <div key={stage} className="flex flex-col items-center relative z-10">
                <div className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center border-2 text-xs sm:text-sm ${
                  isActive || isCompleted
                    ? 'bg-indigo-500 border-indigo-500 text-white' 
                    : 'bg-white border-indigo-300 text-indigo-300'
                }`}>
                  {index + 1}
                </div>
                <span className={`mt-1 text-xs sm:text-sm font-medium ${
                  isActive || isCompleted ? 'text-indigo-800' : 'text-indigo-400'
                }`}>
                  {stage.charAt(0).toUpperCase() + stage.slice(1)}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Error Messages */}
        {(stageError || orderError) && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-xs flex items-center">
              <span className="mr-1">⚠</span>
              {stageError || orderError}
            </p>
          </div>
        )}
        
        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-5 lg:p-6 mb-3 sm:mb-4">
          {currentStage === 'cart' && (
            <CartStage 
              cartItems={cartItems}
              subtotal={subtotal}
              shippingCost={shippingCost}
              tax={tax}
              total={total}
              onQuantityChange={handleQuantityChange}
            />
          )}
          
          {currentStage === 'shipping' && userId && (
            <ShippingStage 
              shippingInfo={shippingInfo}
              addresses={profileData?.user?.addresses || []}
              setShippingInfo={setShippingInfo}
              userId={userId}
              refresh={refresh}
            />
          )}
          
          {currentStage === 'shipping' && !userId && (
            <div className="text-center py-8">
              <div className="mb-3 text-red-500">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-6V7m0 0V5m0 2h2m-2 0H9m12 5a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">Authentication Required</h3>
              <p className="text-sm text-gray-600">Please log in to continue with shipping</p>
            </div>
          )}
          
          {currentStage === 'payment' && (
            <PaymentStage 
              paymentInfo={paymentInfo}
              setPaymentInfo={setPaymentInfo}
            />
          )}
          
          {currentStage === 'confirmation' && userId && (
            <ConfirmationStage 
              cartItems={cartItems}
              shippingInfo={shippingInfo}
              paymentInfo={paymentInfo}
              subtotal={subtotal}
              shippingCost={shippingCost}
              tax={tax}
              total={total}
            />
          )}
          
          {currentStage === 'confirmation' && !userId && (
            <div className="text-center py-8">
              <p className="text-sm text-red-500">User information not available</p>
            </div>
          )}
          
          {currentStage === 'completed' && (
            <CompletedStage onContinueShopping={handleContinueShopping} />
          )}
        </div>
        
        {/* Order Summary - Separate Card */}
        <div className="bg-white rounded-lg shadow-sm">
          <OrderSummary
            cartItems={cartItems}
            addresses={profileData?.user?.addresses || []}
            subtotal={subtotal}
            tax={tax}
            total={total}
            currentStage={currentStage}
            onProceedToShipping={handleProceedToShipping}
            onProceedToPayment={handleProceedToPayment}
            onProceedToConfirmation={handleProceedToConfirmation}
            onPlaceOrder={handlePlaceOrder}
            onBackToCart={handleBackToCart}
            onBackToShipping={handleBackToShipping}
            onBackToPayment={handleBackToPayment}
            onContinueShopping={handleContinueShopping}
            isPlacingOrder={isPlacingOrder}
            canProceedToShipping={canProceedToShipping}
            canProceedToPayment={canProceedToPayment}
            canProceedToConfirmation={canProceedToConfirmation}
            canPlaceOrder={canPlaceOrder}
          />
        </div>
      </div>
    </div>
  );
};

export default DeluxeCart;
