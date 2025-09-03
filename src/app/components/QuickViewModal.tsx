// components/QuickViewModal.tsx
import React, { useEffect, useState } from 'react';
import { Product } from './ProductThumbnails';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, isOpen, onClose }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset selections when product changes
      setSelectedImage(0);
      setQuantity(1);
      setSelectedColor(product?.colors?.[0] || '');
      setSelectedSize('');
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, product]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  // Generate additional images for the gallery (in a real app, these would come from the product data)
  const additionalImages = [
    product.image,
    `https://picsum.photos/400/500?random=${product.id + 100}`,
    `https://picsum.photos/400/500?random=${product.id + 200}`,
    `https://picsum.photos/400/500?random=${product.id + 300}`,
  ];

  // Sample sizes
  const sizes = ['XS', 'S', 'M', 'L', 'XL'];

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative h-80 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={additionalImages[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              
              {/* Sale/New Badge */}
              {(product.onSale || product.isNew) && (
                <div className="absolute top-3 left-3 flex space-x-2">
                  {product.onSale && (
                    <span className="px-2 py-1 text-xs font-bold bg-red-600 text-white rounded-md">SALE</span>
                  )}
                  {product.isNew && (
                    <span className="px-2 py-1 text-xs font-bold bg-blue-600 text-white rounded-md">NEW</span>
                  )}
                </div>
              )}
            </div>
            
            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-4 gap-2">
              {additionalImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`h-20 bg-gray-100 rounded-md overflow-hidden border-2 ${selectedImage === index ? 'border-amber-500' : 'border-transparent'}`}
                >
                  <img
                    src={image}
                    alt={`${product.name} view ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="py-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
            
            {/* Rating */}
            <div className="flex items-center mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-5 h-5 ${star <= Math.round(product.rating) ? 'text-amber-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="ml-2 text-sm text-gray-600">({product.reviewCount} reviews)</span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-lg text-gray-500 line-through">${product.originalPrice.toFixed(2)}</span>
                )}
                {product.onSale && (
                  <span className="px-2 py-1 text-sm font-bold bg-red-100 text-red-700 rounded-md">
                    Save ${(product.originalPrice! - product.price).toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-700 mb-6">
              This premium product features high-quality materials and exquisite craftsmanship. Designed for those who appreciate luxury and attention to detail.
            </p>

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Color: {selectedColor}</h3>
                <div className="flex space-x-2">
                  {product.colors.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${selectedColor === color ? 'border-amber-500' : 'border-gray-300'}`}
                      style={{ backgroundColor: color }}
                      aria-label={`Color: ${color}`}
                    ></button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Size</h3>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border rounded-md ${selectedSize === size ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-300 text-gray-700'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Quantity</h3>
              <div className="flex items-center">
                <button
                  onClick={decrementQuantity}
                  className="p-2 border border-gray-300 rounded-l-md hover:bg-gray-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="px-4 py-2 border-t border-b border-gray-300">{quantity}</span>
                <button
                  onClick={incrementQuantity}
                  className="p-2 border border-gray-300 rounded-r-md hover:bg-gray-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 px-6 rounded-md transition-colors">
                Add to Cart
              </button>
              <button className="p-3 border border-gray-300 rounded-md hover:bg-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900">Free Shipping</h4>
                  <p className="text-gray-600">On orders over $100</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Returns</h4>
                  <p className="text-gray-600">30-day money back guarantee</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Care</h4>
                  <p className="text-gray-600">Machine wash cold</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Delivery</h4>
                  <p className="text-gray-600">Within 2-3 business days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
