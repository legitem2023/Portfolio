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
import { ShoppingCart, Minus, Plus, Trash2, Check, ChevronLeft, ChevronRight, MapPin, CreditCard, Truck, Package } from 'lucide-react';

// ==================== TYPES ====================
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
  method?: 'gcash' | 'bank' | 'cod';
  gcashNumber?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  cvv?: string;
}

interface ValidationErrors {
  [key: string]: string;
}

type Stage = 'cart' | 'shipping' | 'payment' | 'confirmation' | 'completed';
type PaymentMethod = 'gcash' | 'bank' | 'cod';

interface Coordinate {
  lat: number;
  lng: number;
}

// ==================== UTILITIES ====================
const formatPesoPrice = (price: number): string => {
  return `₱${price.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePhone = (phone: string): boolean => {
  const re = /^(09|\+639)\d{9}$/;
  return re.test(phone.replace(/\s/g, ''));
};

const validateZipCode = (zip: string): boolean => {
  const re = /^\d{4,10}$/;
  return re.test(zip);
};

// OSRM Distance API
async function getDistanceInKm(pickup: Coordinate, dropoff: Coordinate): Promise<number> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?overview=false`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 'Ok') {
      throw new Error('Route not found');
    }

    const route = data.routes[0];
    return route.distance / 1000;
  } catch (error) {
    console.error('Error fetching distance:', error);
    return calculateHaversineDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
  }
}

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

// ==================== SHIMMER COMPONENTS ====================
const CartStageShimmer = () => (
  <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex space-x-4">
          <div className="w-20 h-20 bg-gray-200 rounded"></div>
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ShippingStageShimmer = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
    <div className="space-y-4">
      <div className="h-12 bg-gray-100 rounded"></div>
      <div className="h-12 bg-gray-100 rounded"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-12 bg-gray-100 rounded"></div>
        <div className="h-12 bg-gray-100 rounded"></div>
      </div>
      <div className="h-12 bg-gray-100 rounded"></div>
      <div className="h-12 bg-gray-100 rounded"></div>
    </div>
  </div>
);

// ==================== PROGRESS BAR ====================
interface ProgressBarProps {
  currentStage: Stage;
  stages: { key: Stage; label: string; icon: React.ReactNode }[];
}

const ProgressBar = ({ currentStage, stages }: ProgressBarProps) => {
  const currentIndex = stages.findIndex(s => s.key === currentStage);

  return (
    <div className="relative mb-12">
      {/* Progress Line */}
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
        <div 
          className="h-full bg-indigo-600 transition-all duration-500"
          style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
        />
      </div>

      {/* Stages */}
      <div className="relative flex justify-between">
        {stages.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <div key={stage.key} className="flex flex-col items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                ${isActive ? 'bg-indigo-600 border-indigo-600 text-white scale-110 shadow-lg' : ''}
                ${isCompleted ? 'bg-green-500 border-green-500 text-white' : ''}
                ${isUpcoming ? 'bg-white border-gray-300 text-gray-400' : ''}
              `}>
                {isCompleted ? <Check size={18} /> : stage.icon}
              </div>
              <span className={`
                mt-2 text-sm font-medium
                ${isActive ? 'text-indigo-800' : ''}
                ${isCompleted ? 'text-green-600' : ''}
                ${isUpcoming ? 'text-gray-400' : ''}
              `}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==================== CART STAGE ====================
interface CartStageProps {
  cartItems: CartItem[];
  onQuantityChange: (id: string | number, quantity: number) => void;
  onCheckout: () => void;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
}

const CartStage = ({ cartItems, onQuantityChange, onCheckout, subtotal, shippingCost, tax, total }: CartStageProps) => {
  if (cartItems.length === 0) {
    return (
      <div className="text-center py-12 md:py-16 px-4">
        <div className="bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart size={48} className="text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-600 mb-8">Looks like you havent added anything to your cart yet</p>
        <button
          onClick={() => window.location.href = '/products'}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Shopping Cart ({cartItems.length} items)</h2>
      
      <div className="space-y-6">
        {cartItems.map((item: any) => (
          <div key={item.id} className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
            {/* Product Image */}
            <div className="w-full sm:w-32 h-32 flex-shrink-0">
              <img
                src={item.images?.[0] || '/NoImage.webp'}
                alt={item.name}
                className="w-full h-full object-cover object-center rounded-lg"
              />
            </div>

            {/* Product Details */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.color && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Color: {item.color}
                      </span>
                    )}
                    {item.size && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Size: {item.size}
                      </span>
                    )}
                    {item.supplier && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Seller: {item.supplier}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-lg font-bold text-gray-900 mt-2 sm:mt-0">
                  {formatPesoPrice((item.price || 0) * (item.quantity || 0))}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                {/* Quantity Controls */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Quantity:</span>
                  <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                    <button
                      onClick={() => onQuantityChange(item.id, Math.max(0, item.quantity - 1))}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-l-lg transition-colors"
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-10 h-8 flex items-center justify-center text-gray-900 font-medium text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-r-lg transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => onQuantityChange(item.id, 0)}
                  className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  <Trash2 size={16} />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <div className="flex justify-end">
          <div className="w-full sm:w-80 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">{formatPesoPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium text-gray-900">{formatPesoPrice(shippingCost)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax (8%)</span>
              <span className="font-medium text-gray-900">{formatPesoPrice(tax)}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-3 border-t border-gray-200">
              <span className="text-gray-900">Total</span>
              <span className="text-indigo-600">{formatPesoPrice(total)}</span>
            </div>

            <button
              onClick={onCheckout}
              className="w-full mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Proceed to Checkout</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== SHIPPING STAGE ====================
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
  refresh 
}: ShippingStageProps) => {
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [useNewAddress, setUseNewAddress] = useState(false);

  useEffect(() => {
    if (addresses?.length > 0 && !useNewAddress) {
      const defaultAddress = addresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        setShippingInfo({
          addressId: defaultAddress.id,
          receiver: defaultAddress.receiver || '',
          address: defaultAddress.street || '',
          city: defaultAddress.city || '',
          zipCode: defaultAddress.zipCode || '',
          country: defaultAddress.country || '',
          state: defaultAddress.state || ''
        });
      }
    }
  }, [addresses, setShippingInfo, useNewAddress]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!shippingInfo.receiver?.trim()) {
      newErrors.receiver = 'Receiver name is required';
    }

    if (!shippingInfo.address?.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!shippingInfo.city?.trim()) {
      newErrors.city = 'City is required';
    }

    if (!shippingInfo.zipCode?.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!validateZipCode(shippingInfo.zipCode)) {
      newErrors.zipCode = 'Invalid ZIP code format';
    }

    if (!shippingInfo.country) {
      newErrors.country = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(e);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShippingInfo({ ...shippingInfo, [name]: value });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAddressSelect = (address: Address) => {
    refresh();
    setSelectedAddressId(address.id);
    setShippingInfo({
      addressId: address.id,
      receiver: address.receiver || '',
      address: address.street || '',
      city: address.city || '',
      zipCode: address.zipCode || '',
      country: address.country || '',
      state: address.state || ''
    });
    setUseNewAddress(false);
  };

  const handleUseNewAddress = () => {
    setUseNewAddress(true);
    setSelectedAddressId(null);
    setShippingInfo({
      addressId: '',
      receiver: '',
      address: '',
      city: '',
      zipCode: '',
      country: '',
      state: ''
    });
  };

  return (
    <div className="bg-white">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Information</h2>

      {/* Saved Addresses */}
      {addresses?.length > 0 && !useNewAddress && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Select a saved address</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`
                  border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
                  ${selectedAddressId === address.id 
                    ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                  }
                `}
                onClick={() => handleAddressSelect(address)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <MapPin size={18} className={selectedAddressId === address.id ? 'text-indigo-600' : 'text-gray-400'} />
                    <span className="font-medium text-gray-900">{address.type || 'Address'}</span>
                    {address.isDefault && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  {selectedAddressId === address.id && (
                    <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 space-y-1 pl-6">
                  <p className="font-medium text-gray-800">{address.receiver}</p>
                  <p>{address.street}</p>
                  <p>{address.city}, {address.state} {address.zipCode}</p>
                  <p>{address.country}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleUseNewAddress}
            className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center space-x-1"
          >
            <span>+</span>
            <span>Use a new address</span>
          </button>
        </div>
      )}

      {/* Shipping Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Receiver Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="receiver"
            value={shippingInfo.receiver}
            onChange={handleChange}
            className={`
              w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all
              ${errors.receiver ? 'border-red-500 bg-red-50' : 'border-gray-300'}
            `}
            placeholder="Enter receiver's full name"
          />
          {errors.receiver && <p className="mt-1 text-sm text-red-600">{errors.receiver}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Street Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="address"
            value={shippingInfo.address}
            onChange={handleChange}
            className={`
              w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all
              ${errors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'}
            `}
            placeholder="House number, street name"
          />
          {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="city"
              value={shippingInfo.city}
              onChange={handleChange}
              className={`
                w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all
                ${errors.city ? 'border-red-500 bg-red-50' : 'border-gray-300'}
              `}
              placeholder="Enter city"
            />
            {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ZIP Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="zipCode"
              value={shippingInfo.zipCode}
              onChange={handleChange}
              className={`
                w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all
                ${errors.zipCode ? 'border-red-500 bg-red-50' : 'border-gray-300'}
              `}
              placeholder="Enter ZIP code"
            />
            {errors.zipCode && <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State/Province
          </label>
          <input
            type="text"
            name="state"
            value={shippingInfo.state || ''}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="Enter state or province"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country <span className="text-red-500">*</span>
          </label>
          <select
            name="country"
            value={shippingInfo.country}
            onChange={handleChange}
            className={`
              w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white
              ${errors.country ? 'border-red-500 bg-red-50' : 'border-gray-300'}
            `}
          >
            <option value="">Select Country</option>
            <option value="Philippines">Philippines</option>
            <option value="USA">United States</option>
            <option value="UK">United Kingdom</option>
            <option value="Canada">Canada</option>
            <option value="Australia">Australia</option>
            <option value="Japan">Japan</option>
            <option value="Singapore">Singapore</option>
            <option value="Malaysia">Malaysia</option>
            <option value="Thailand">Thailand</option>
            <option value="Vietnam">Vietnam</option>
            <option value="Indonesia">Indonesia</option>
          </select>
          {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
        </div>
        
        <div className="flex justify-between pt-6">
          <button 
            type="button" 
            onClick={onBack}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <ChevronLeft size={18} />
            <span>Back to Cart</span>
          </button>
          <button 
            type="submit" 
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center space-x-2"
          >
            <span>Continue to Payment</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

// ==================== PAYMENT STAGE ====================
interface PaymentStageProps {
  paymentInfo: PaymentInfo;
  setPaymentInfo: (info: PaymentInfo) => void;
  onSubmit: (e: FormEvent) => void;
  onBack: () => void;
}

const PaymentStage = ({ paymentInfo, setPaymentInfo, onSubmit, onBack }: PaymentStageProps) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(paymentInfo.method || 'cod');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [termsAccepted, setTermsAccepted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!termsAccepted) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    switch (selectedMethod) {
      case 'gcash':
        if (!paymentInfo.gcashNumber?.trim()) {
          newErrors.gcashNumber = 'GCash number is required';
        } else if (!validatePhone(paymentInfo.gcashNumber)) {
          newErrors.gcashNumber = 'Invalid GCash number format (e.g., 09123456789)';
        }
        break;

      case 'bank':
        if (!paymentInfo.bankName) {
          newErrors.bankName = 'Please select a bank';
        }
        if (!paymentInfo.accountNumber?.trim()) {
          newErrors.accountNumber = 'Account number is required';
        }
        if (!paymentInfo.accountName?.trim()) {
          newErrors.accountName = 'Account name is required';
        }
        break;

      case 'cod':
        // No validation needed for COD
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setPaymentInfo({ ...paymentInfo, method: selectedMethod });
      onSubmit(e);
    }
  };

  const handleMethodChange = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setPaymentInfo({ method });
    setErrors({});
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPaymentInfo({ ...paymentInfo, [name]: value });
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="bg-white">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Method</h2>
      
      {/* Payment Method Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Choose how to pay</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* GCash */}
          <div
            className={`
              border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
              ${selectedMethod === 'gcash' 
                ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
              }
            `}
            onClick={() => handleMethodChange('gcash')}
          >
            <div className="flex items-center space-x-3">
              <div className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${selectedMethod === 'gcash' ? 'border-indigo-600' : 'border-gray-300'}
              `}>
                {selectedMethod === 'gcash' && <div className="w-3 h-3 bg-indigo-600 rounded-full" />}
              </div>
              <div>
                <div className="font-semibold text-gray-900">GCash</div>
                <div className="text-sm text-gray-600">Mobile Payment</div>
              </div>
            </div>
            {selectedMethod === 'gcash' && (
              <div className="mt-3 text-xs text-indigo-600 bg-indigo-100 p-2 rounded">
                Pay using your GCash mobile wallet
              </div>
            )}
          </div>

          {/* Bank Transfer */}
          <div
            className={`
              border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
              ${selectedMethod === 'bank' 
                ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
              }
            `}
            onClick={() => handleMethodChange('bank')}
          >
            <div className="flex items-center space-x-3">
              <div className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${selectedMethod === 'bank' ? 'border-indigo-600' : 'border-gray-300'}
              `}>
                {selectedMethod === 'bank' && <div className="w-3 h-3 bg-indigo-600 rounded-full" />}
              </div>
              <div>
                <div className="font-semibold text-gray-900">Bank Transfer</div>
                <div className="text-sm text-gray-600">Online Banking</div>
              </div>
            </div>
            {selectedMethod === 'bank' && (
              <div className="mt-3 text-xs text-indigo-600 bg-indigo-100 p-2 rounded">
                Transfer via online banking
              </div>
            )}
          </div>

          {/* Cash on Delivery */}
          <div
            className={`
              border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
              ${selectedMethod === 'cod' 
                ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
              }
            `}
            onClick={() => handleMethodChange('cod')}
          >
            <div className="flex items-center space-x-3">
              <div className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${selectedMethod === 'cod' ? 'border-indigo-600' : 'border-gray-300'}
              `}>
                {selectedMethod === 'cod' && <div className="w-3 h-3 bg-indigo-600 rounded-full" />}
              </div>
              <div>
                <div className="font-semibold text-gray-900">Cash on Delivery</div>
                <div className="text-sm text-gray-600">Pay when delivered</div>
              </div>
            </div>
            {selectedMethod === 'cod' && (
              <div className="mt-3 text-xs text-green-600 bg-green-100 p-2 rounded">
                Pay cash upon delivery
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* GCash Form */}
        {selectedMethod === 'gcash' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                You will receive a payment request on your GCash app after placing your order.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GCash Registered Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="gcashNumber"
                value={paymentInfo.gcashNumber || ''}
                onChange={handleChange}
                placeholder="0912 345 6789"
                className={`
                  w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all
                  ${errors.gcashNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                `}
              />
              {errors.gcashNumber && <p className="mt-1 text-sm text-red-600">{errors.gcashNumber}</p>}
              <p className="mt-1 text-xs text-gray-500">Enter the mobile number linked to your GCash account</p>
            </div>
          </div>
        )}

        {/* Bank Transfer Form */}
        {selectedMethod === 'bank' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Bank details will be provided after order confirmation.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank <span className="text-red-500">*</span>
              </label>
              <select
                name="bankName"
                value={paymentInfo.bankName || ''}
                onChange={handleChange}
                className={`
                  w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white
                  ${errors.bankName ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                `}
              >
                <option value="">Select Your Bank</option>
                <option value="BDO">BDO Unibank</option>
                <option value="BPI">BPI</option>
                <option value="Metrobank">Metrobank</option>
                <option value="UnionBank">UnionBank</option>
                <option value="Landbank">Landbank</option>
                <option value="PNB">PNB</option>
                <option value="Security Bank">Security Bank</option>
                <option value="RCBC">RCBC</option>
                <option value="China Bank">China Bank</option>
              </select>
              {errors.bankName && <p className="mt-1 text-sm text-red-600">{errors.bankName}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={paymentInfo.accountNumber || ''}
                  onChange={handleChange}
                  placeholder="Enter account number"
                  className={`
                    w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all
                    ${errors.accountNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                  `}
                />
                {errors.accountNumber && <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="accountName"
                  value={paymentInfo.accountName || ''}
                  onChange={handleChange}
                  placeholder="Account holder name"
                  className={`
                    w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all
                    ${errors.accountName ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                  `}
                />
                {errors.accountName && <p className="mt-1 text-sm text-red-600">{errors.accountName}</p>}
              </div>
            </div>
          </div>
        )}

        {/* COD Information */}
        {selectedMethod === 'cod' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Truck size={24} className="text-green-600" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-green-900 mb-2">Cash on Delivery</h4>
                <p className="text-green-700 text-sm mb-3">
                  Pay with cash when your order is delivered. Please prepare the exact amount.
                </p>
                <div className="bg-white rounded-md p-3 text-sm">
                  <p className="text-gray-700">
                    <span className="font-medium">Delivery Estimate:</span> 3-5 business days
                  </p>
                  <p className="text-gray-700 mt-1">
                    <span className="font-medium">Cash Payment:</span> Pay directly to the rider
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Terms and Conditions */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                if (errors.terms) {
                  const newErrors = { ...errors };
                  delete newErrors.terms;
                  setErrors(newErrors);
                }
              }}
              className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="terms" className="text-sm text-gray-600">
              I agree to the <a href="/terms" className="text-indigo-600 hover:underline">Terms and Conditions</a> and 
              authorize the processing of my payment information.
            </label>
          </div>
          {errors.terms && <p className="mt-2 text-sm text-red-600">{errors.terms}</p>}
        </div>
        
        <div className="flex justify-between">
          <button 
            type="button" 
            onClick={onBack}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <ChevronLeft size={18} />
            <span>Back to Shipping</span>
          </button>
          <button 
            type="submit" 
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center space-x-2"
          >
            <span>{selectedMethod === 'cod' ? 'Review Order' : 'Continue to Review'}</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

// ==================== CONFIRMATION STAGE ====================
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
  const [isPlacing, setIsPlacing] = useState(false);

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
          details: `${paymentInfo.bankName || 'Bank'} - ${paymentInfo.accountNumber || 'Account'}`,
          icon: '🏦'
        };
      case 'cod':
        return {
          method: 'Cash on Delivery',
          details: 'Pay upon delivery',
          icon: '💵'
        };
      default:
        return {
          method: 'Payment Method',
          details: 'Not specified',
          icon: '❓'
        };
    }
  };

  const validateOrder = (): boolean => {
    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return false;
    }

    if (!shippingInfo.addressId && !shippingInfo.address) {
      alert('Please provide shipping address');
      return false;
    }

    if (!paymentInfo.method) {
      alert('Please select a payment method');
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateOrder() || isPlacing) return;

    setIsPlacing(true);
    try {
      const orderItems = cartItems.map(item => ({
        productId: item.id,
        supplierId: item.supplierId,
        quantity: item.quantity,
        price: item.price
      }));

      const orderInput = {
        userId: userId,
        addressId: shippingInfo.addressId || 'new',
        items: orderItems,
        paymentMethod: paymentInfo.method,
        totalAmount: total
      };

      const result = await createOrder({
        variables: orderInput
      });

      if (result.data?.createOrder) {
        onPlaceOrder();
      } else {
        throw new Error('Failed to create order');
      }
    } catch (err) {
      console.error('Error creating order:', err);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsPlacing(false);
    }
  };

  const paymentDisplay = getPaymentMethodDisplay();

  return (
    <div className="bg-white">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Order</h2>
      <p className="text-gray-600 mb-8">Please check all details before placing your order</p>
      
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">
            Error: {error.message || 'Failed to place order. Please try again.'}
          </p>
        </div>
      )}

      {/* Order Items */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Package size={20} className="mr-2" />
          Order Items ({cartItems.length})
        </h3>
        
        <div className="space-y-4">
          {cartItems.map((item: any) => (
            <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-20 h-20 flex-shrink-0">
                <img
                  src={item.images?.[0] || '/NoImage.webp'}
                  alt={item.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {item.color && (
                        <span className="text-xs text-gray-600">Color: {item.color}</span>
                      )}
                      {item.size && (
                        <span className="text-xs text-gray-600">Size: {item.size}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatPesoPrice(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatPesoPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Shipping Info */}
        <div className="bg-gray-50 rounded-lg p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Truck size={18} className="mr-2" />
            Shipping Address
          </h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium text-gray-800">{shippingInfo.receiver}</p>
            <p>{shippingInfo.address}</p>
            <p>{shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}</p>
            <p>{shippingInfo.country}</p>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-gray-50 rounded-lg p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <CreditCard size={18} className="mr-2" />
            Payment Method
          </h3>
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-800">{paymentDisplay.method}</p>
            <p className="mt-1">{paymentDisplay.details}</p>
            {paymentInfo.method === 'bank' && paymentInfo.accountName && (
              <p className="mt-1">Account Name: {paymentInfo.accountName}</p>
            )}
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-indigo-50 rounded-lg p-5 mb-8">
        <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-900">{formatPesoPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium text-gray-900">{formatPesoPrice(shippingCost)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax (8%)</span>
            <span className="font-medium text-gray-900">{formatPesoPrice(tax)}</span>
          </div>
          <div className="flex justify-between text-base font-bold pt-3 border-t border-indigo-200">
            <span className="text-gray-900">Total</span>
            <span className="text-indigo-600">{formatPesoPrice(total)}</span>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
        <p className="text-sm text-yellow-800">
          <strong>Please note:</strong> By placing this order, you agree to our terms and conditions. 
          {paymentInfo.method === 'cod' 
            ? ' Please prepare exact cash for delivery.' 
            : ' Payment will be processed immediately.'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isPlacing}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <ChevronLeft size={18} />
          <span>Back to Payment</span>
        </button>
        
        <button
          onClick={handlePlaceOrder}
          disabled={loading || isPlacing}
          className="px-8 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {loading || isPlacing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              <span>Placing Order...</span>
            </>
          ) : (
            <>
              <span>Place Order</span>
              <Check size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ==================== COMPLETED STAGE ====================
interface CompletedStageProps {
  onContinueShopping: () => void;
}

const CompletedStage = ({ onContinueShopping }: CompletedStageProps) => {
  return (
    <div className="text-center py-12">
      <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check size={48} className="text-green-600" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-3">Order Placed Successfully!</h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Thank you for your purchase. Weve sent a confirmation email with your order details.
      </p>
      
      <div className="bg-indigo-50 rounded-lg p-6 max-w-md mx-auto mb-8">
        <h3 className="font-semibold text-indigo-900 mb-3">Whats Next?</h3>
        <ul className="text-sm text-indigo-700 space-y-2 text-left">
          <li className="flex items-start space-x-2">
            <Check size={16} className="mt-0.5 flex-shrink-0" />
            <span>Youll receive an order confirmation via email</span>
          </li>
          <li className="flex items-start space-x-2">
            <Check size={16} className="mt-0.5 flex-shrink-0" />
            <span>Well notify you once your order is shipped</span>
          </li>
          <li className="flex items-start space-x-2">
            <Check size={16} className="mt-0.5 flex-shrink-0" />
            <span>Track your order in your account dashboard</span>
          </li>
        </ul>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button 
          onClick={onContinueShopping}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Continue Shopping
        </button>
        <button 
          onClick={() => window.location.href = '/account/orders'}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          View My Orders
        </button>
      </div>
    </div>
  );
};

// ==================== ORDER SUMMARY (SIDEBAR) ====================
interface OrderSummarySidebarProps {
  cartItems: CartItem[];
  addresses: Address[];
  subtotal: number;
  tax: number;
  total: number;
  onCheckout: () => void;
  setCurrentStage: (stage: Stage) => void;
  currentStage?: Stage;
}

const OrderSummarySidebar = ({ 
  cartItems, 
  addresses,
  subtotal, 
  tax, 
  total, 
  onCheckout,
  setCurrentStage,
  currentStage
}: OrderSummarySidebarProps) => {
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  
  const BASE_RATE = 50;
  const RATE_PER_KM = 15;

  useEffect(() => {
    const calculateShipping = async () => {
      if (cartItems.length === 0 || !addresses?.length) {
        setShippingCost(0);
        return;
      }

      const defaultAddress = addresses.find(a => a.isDefault);
      if (!defaultAddress) {
        setShippingError("No default address found");
        return;
      }

      setIsCalculating(true);
      setShippingError(null);

      try {
        let totalDistance = 0;
        let itemsWithLocation = 0;

        for (const item of cartItems) {
          if (item.lat && item.lng && defaultAddress.lat && defaultAddress.lng) {
            try {
              const distance = await getDistanceInKm(
                { lat: item.lat, lng: item.lng },
                { lat: defaultAddress.lat, lng: defaultAddress.lng }
              );
              totalDistance += distance;
              itemsWithLocation++;
            } catch (error) {
              console.error('Error calculating distance for item:', item.id);
            }
          }
        }

        if (itemsWithLocation > 0) {
          const avgDistance = totalDistance / itemsWithLocation;
          const cost = BASE_RATE + (avgDistance * RATE_PER_KM);
          setShippingCost(Math.round(cost * 100) / 100);
        }
      } catch (error) {
        console.error('Error calculating shipping:', error);
        setShippingError("Couldn't calculate shipping");
      } finally {
        setIsCalculating(false);
      }
    };

    calculateShipping();
  }, [cartItems, addresses]);

  if (cartItems.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 text-center">
        <ShoppingCart size={32} className="text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 text-sm">Your cart is empty</p>
      </div>
    );
  }

  const grandTotal = total + shippingCost;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
      
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium text-gray-900">{formatPesoPrice(subtotal)}</span>
        </div>
        
        <div className="flex justify-between items-start">
          <span className="text-gray-600">Shipping</span>
          <div className="text-right">
            {isCalculating ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-indigo-600 border-t-transparent" />
                <span className="text-gray-500">Calculating...</span>
              </div>
            ) : shippingError ? (
              <span className="text-red-500 text-xs">{shippingError}</span>
            ) : (
              <span className="font-medium text-gray-900">{formatPesoPrice(shippingCost)}</span>
            )}
          </div>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Tax (8%)</span>
          <span className="font-medium text-gray-900">{formatPesoPrice(tax)}</span>
        </div>
        
        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="flex justify-between text-base font-semibold">
            <span className="text-gray-900">Total</span>
            <span className="text-indigo-600">{formatPesoPrice(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons based on stage */}
      {currentStage === 'cart' && (
        <button
          onClick={onCheckout}
          disabled={isCalculating || !!shippingError}
          className="w-full mt-6 px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isCalculating ? 'Calculating...' : 'Proceed to Checkout'}
        </button>
      )}

      {currentStage === 'shipping' && (
        <button
          onClick={() => setCurrentStage('payment')}
          className="w-full mt-6 px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Proceed to Payment
        </button>
      )}

      {currentStage === 'payment' && (
        <button
          onClick={() => setCurrentStage('confirmation')}
          className="w-full mt-6 px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Review Order
        </button>
      )}

      {currentStage === 'confirmation' && (
        <p className="text-xs text-gray-500 mt-4 text-center">
          Review your order above before placing
        </p>
      )}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const DeluxeCart = () => {
  const { user, loading: authLoading } = useAuth();
  
  const [currentStage, setCurrentStage] = useState<Stage>('cart');
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
    method: undefined,
    gcashNumber: '',
    bankName: '',
    accountNumber: '',
    accountName: ''
  });
  
  const cartItems = useSelector((state: any) => state.cart.cartItems as CartItem[]);
  const dispatch = useDispatch();
  const userId = user?.userId;
  
  const { data: profileData, loading: profileLoading, refetch } = useQuery(GET_USER_PROFILE, {
    variables: { id: user?.userId },
    skip: !user?.userId
  });
  
  const subtotal = cartItems.reduce((total: number, item: any) => 
    total + (item.price * item.quantity), 0
  );
  const shippingCost = subtotal > 0 ? 5.99 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;

  const stages = [
    { key: 'cart' as Stage, label: 'Cart', icon: <ShoppingCart size={18} /> },
    { key: 'shipping' as Stage, label: 'Shipping', icon: <Truck size={18} /> },
    { key: 'payment' as Stage, label: 'Payment', icon: <CreditCard size={18} /> },
    { key: 'confirmation' as Stage, label: 'Review', icon: <Package size={18} /> }
  ];
  
  const handleQuantityChange = (id: string | number, quantity: number) => {
    if (quantity === 0) {
      dispatch(removeFromCart({ id }));
    } else {
      dispatch(changeQuantity({ id, quantity }));
    }
  };
  
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }
    
    if (!userId) {
      alert('Please log in to continue');
      return;
    }
    
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
    window.location.href = '/products';
  };

  const handleBack = () => {
    switch (currentStage) {
      case 'shipping':
        setCurrentStage('cart');
        break;
      case 'payment':
        setCurrentStage('shipping');
        break;
      case 'confirmation':
        setCurrentStage('payment');
        break;
      default:
        break;
    }
  };
  
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <CartStageShimmer />
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Progress Bar - Hide on completed stage */}
        {currentStage !== 'completed' && (
          <ProgressBar currentStage={currentStage} stages={stages} />
        )}
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
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
                  addresses={profileData?.user?.addresses || []}
                  setShippingInfo={setShippingInfo}
                  onSubmit={handleShippingSubmit}
                  onBack={handleBack}
                  userId={userId}
                  refresh={refetch}
                />
              )}
              
              {currentStage === 'shipping' && !userId && (
                <div className="text-center py-12">
                  <div className="bg-yellow-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🔒</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Authentication Required</h3>
                  <p className="text-gray-600 mb-6">Please log in to continue with checkout</p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={handleBack}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Back to Cart
                    </button>
                    <button
                      onClick={() => window.location.href = '/login?redirect=/cart'}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Log In
                    </button>
                  </div>
                </div>
              )}
              
              {currentStage === 'payment' && (
                <PaymentStage 
                  paymentInfo={paymentInfo}
                  setPaymentInfo={setPaymentInfo}
                  onSubmit={handlePaymentSubmit}
                  onBack={handleBack}
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
                  onBack={handleBack}
                />
              )}
              
              {currentStage === 'completed' && (
                <CompletedStage onContinueShopping={handleContinueShopping} />
              )}
            </div>
          </div>

          {/* Order Summary Sidebar - Hide on completed stage */}
          {currentStage !== 'completed' && (
            <div className="lg:col-span-1">
              <OrderSummarySidebar
                cartItems={cartItems}
                addresses={profileData?.user?.addresses || []}
                subtotal={subtotal}
                tax={tax}
                total={total}
                onCheckout={handleCheckout}
                setCurrentStage={setCurrentStage}
                currentStage={currentStage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeluxeCart;
