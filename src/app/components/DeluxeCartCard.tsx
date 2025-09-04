// components/DeluxeCartCard.tsx
import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Minus, 
  Plus, 
  Trash2, 
  Heart,
  Shield,
  Check
} from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  inStock: boolean;
  color?: string;
  size?: string;
  material?: string;
  deliveryDate?: string;
}

interface DeluxeCartCardProps {
  item: CartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  className?: string;
}

const DeluxeCartCard: React.FC<DeluxeCartCardProps> = ({ 
  item, 
  onUpdateQuantity, 
  onRemove,
  className = '' 
}) => {
  const [isLiked, setIsLiked] = useState(false);

  const handleIncrement = () => {
    onUpdateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1);
    }
  };

  const discount = item.originalPrice 
    ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) 
    : 0;

  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-xl ${className}`}>
      <div className="flex flex-col md:flex-row">
        {/* Product Image */}
        <div className="relative md:w-1/3 h-56 md:h-auto">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
          />
          {discount > 0 && (
            <div className="absolute top-4 left-4 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              -{discount}%
            </div>
          )}
          <button 
            onClick={() => setIsLiked(!isLiked)}
            className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 ${
              isLiked 
                ? 'bg-rose-500 text-white' 
                : 'bg-white/80 text-gray-600 hover:bg-white'
            }`}
          >
            <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
        </div>
        
        {/* Product Details */}
        <div className="flex-1 p-5 md:p-6">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-semibold text-gray-900 pr-2">{item.name}</h3>
            <button 
              onClick={() => onRemove(item.id)}
              className="text-gray-400 hover:text-rose-500 transition-colors p-1"
            >
              <Trash2 size={18} />
            </button>
          </div>
          
          {/* Product Specifications */}
          <div className="flex flex-wrap gap-2 mb-4">
            {item.color && (
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-1">Color:</span>
                <span 
                  className="w-4 h-4 rounded-full border border-gray-200 inline-block"
                  style={{ backgroundColor: item.color }}
                ></span>
              </div>
            )}
            {item.size && (
              <div className="text-sm text-gray-600">
                Size: <span className="font-medium">{item.size}</span>
              </div>
            )}
            {item.material && (
              <div className="text-sm text-gray-600">
                Material: <span className="font-medium">{item.material}</span>
              </div>
            )}
          </div>
          
          {/* Stock Status */}
          <div className="flex items-center mb-4">
            {item.inStock ? (
              <div className="flex items-center text-emerald-600 text-sm">
                <Check size={16} className="mr-1" />
                In Stock
              </div>
            ) : (
              <div className="text-amber-600 text-sm">
                Backordered
              </div>
            )}
            {item.deliveryDate && (
              <span className="text-sm text-gray-500 ml-3">
                Est. delivery: {item.deliveryDate}
              </span>
            )}
          </div>
          
          {/* Price and Quantity */}
          <div className="flex flex-wrap justify-between items-center">
            <div className="flex items-center mb-3 md:mb-0">
              {/* Quantity Controls */}
              <div className="flex items-center border border-gray-200 rounded-lg mr-4">
                <button 
                  onClick={handleDecrement}
                  disabled={item.quantity <= 1}
                  className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-40"
                >
                  <Minus size={16} />
                </button>
                <span className="px-3 py-1 text-gray-800 font-medium">{item.quantity}</span>
                <button 
                  onClick={handleIncrement}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <Plus size={16} />
                </button>
              </div>
              
              {/* Price */}
              <div className="flex flex-col">
                <div className="flex items-center">
                  <span className="text-lg font-bold text-gray-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                  {item.originalPrice && (
                    <span className="text-sm text-gray-500 line-through ml-2">
                      ${(item.originalPrice * item.quantity).toFixed(2)}
                    </span>
                  )}
                </div>
                {item.quantity > 1 && (
                  <span className="text-xs text-gray-500">
                    ${item.price.toFixed(2)} each
                  </span>
                )}
              </div>
            </div>
            
            {/* Protection Plan */}
            <div className="flex items-center text-sm text-gray-600">
              <Shield size={16} className="mr-1 text-blue-500" />
              <span>Includes Protection Plan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeluxeCartCard;
