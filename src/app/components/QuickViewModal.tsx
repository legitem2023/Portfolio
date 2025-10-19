// components/QuickViewModal.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../../Redux/cartSlice';
import { Product, Variant } from '../../../types';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: Product, options: { color: string; size: string; quantity: number }) => void;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, isOpen, onClose, onAddToCart }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const dispatch = useDispatch();

  // Memoize variants to prevent unnecessary recalculations
  const variants = useMemo(() => product?.variants || [], [product?.variants]);

  // Get the currently selected variant based on color and size
  const selectedVariant = useMemo(() => {
    return variants.find((variant: Variant) => 
      variant.color === selectedColor && variant.size === selectedSize
    );
  }, [variants, selectedColor, selectedSize]);

  // Get images for display - prioritize variant images
  const additionalImages = useMemo(() => {
    if (!product) return ['/NoImage.webp'];
    
    // Use selected variant images if available
    if (selectedVariant?.images && selectedVariant.images.length > 0) {
      return selectedVariant.images;
    }
    
    // Fallback to all variant images
    const variantImages = variants
      ?.map((item: Variant) => item.images)
      .filter(Boolean)
      .flat() || [];
    
    return variantImages.length > 0 ? variantImages : [product.image || '/NoImage.webp'];
  }, [product, variants, selectedVariant]);

  // Update image when variant changes
  useEffect(() => {
    setSelectedImage(0); // Reset to first image when variant changes
  }, [selectedVariant]);

  // Get unique sizes and colors with filtering logic
  const { uniqueSizes, uniqueColors, availableSizes, availableColors } = useMemo(() => {
    const allSizes = Array.from(new Set(variants.map((item: Variant) => item.size).filter(Boolean)));
    const allColors = Array.from(new Set(variants.map((item: Variant) => item.color).filter(Boolean)));

    // Filter available options based on current selections
    let availableSizes = allSizes;
    let availableColors = allColors;

    if (selectedColor) {
      availableSizes = Array.from(new Set(variants
        .filter((item: Variant) => item.color === selectedColor)
        .map((item: Variant) => item.size)
        .filter(Boolean)
      ));
    }

    if (selectedSize) {
      availableColors = Array.from(new Set(variants
        .filter((item: Variant) => item.size === selectedSize)
        .map((item: Variant) => item.color)
        .filter(Boolean)
      ));
    }

    return {
      uniqueSizes: allSizes,
      uniqueColors: allColors,
      availableSizes,
      availableColors
    };
  }, [variants, selectedColor, selectedSize]);

  // Auto-select first available option when filters change
  useEffect(() => {
    if (availableColors.length > 0 && (!selectedColor || !availableColors.includes(selectedColor))) {
      setSelectedColor(availableColors[0]);
    }
  }, [availableColors, selectedColor]);

  useEffect(() => {
    if (availableSizes.length > 0 && (!selectedSize || !availableSizes.includes(selectedSize))) {
      setSelectedSize(availableSizes[0]);
    }
  }, [availableSizes, selectedSize]);

  // Initialize selections when product changes
  useEffect(() => {
    if (product && isVisible) {
      setSelectedImage(0);
      setQuantity(1);
      
      // Set default selections from available options
      if (uniqueColors.length > 0 && !selectedColor) {
        setSelectedColor(uniqueColors[0]);
      }
      if (uniqueSizes.length > 0 && !selectedSize) {
        setSelectedSize(uniqueSizes[0]);
      }
    }
  }, [product, isVisible, uniqueColors, uniqueSizes, selectedColor, selectedSize]);

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // Handle animation states
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isVisible]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, onClose]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);
 
  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  const handleAddToCartClick = () => {
    if (!product || !selectedVariant) return;
    
    // Create cart item with variant-specific data
    const cartItem = {
      id: selectedVariant.id, // Use variant ID instead of product ID
      productId: product.id, // Keep reference to main product
      userId: 'current-user-id', // Replace with actual user ID from your auth context
      sku: selectedVariant.sku, // Use variant SKU
      name: product.name,
      price: selectedVariant.price || product.price, // Use variant price if available
      image: additionalImages[0] || product.image,
      quantity: quantity,
      color: selectedColor,
      size: selectedSize,
      variant: selectedVariant // Include full variant data if needed
    };
    
    dispatch(addToCart(cartItem));
    
    if (onAddToCart) {
      onAddToCart(product, {
        color: selectedColor,
        size: selectedSize,
        quantity: quantity
      });
    }
    
    onClose();
  };

  if (!isVisible && !isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-end md:items-center justify-end md:justify-center p-0 md:p-4 bg-black bg-opacity-70 backdrop-blur-sm transition-opacity duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleOverlayClick}
    >
      <div 
        className={`
          relative bg-white w-full md:max-w-4xl md:rounded-2xl md:max-h-[90vh] 
          h-[80vh] overflow-y-auto no-scrollbar rounded-t-2xl
          transition-transform duration-300 ease-out
          ${isMobile 
            ? (isAnimating ? 'translate-y-0' : 'translate-y-full') 
            : (isAnimating ? 'scale-100' : 'scale-95 opacity-0')
          }
        `}
      >
        {/* Drag handle for mobile */}
        {isMobile && (
          <div className="sticky top-0 left-0 right-0 flex justify-center py-2 z-10 bg-white">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>
        )}
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 md:top-4 md:right-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 p-4 md:p-6">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative h-70 md:h-80 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={additionalImages[selectedImage]}
                alt={product?.name || 'Product'}
                className="w-full h-full object-cover"
              />
              
              {/* Sale/New Badge */}
              {(product?.onSale || product?.isNew) && (
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
                  className={`h-16 md:h-20 bg-gray-100 rounded-md overflow-hidden border-2 ${selectedImage === index ? 'border-amber-500' : 'border-transparent'}`}
                >
                  <img
                    src={image}
                    alt={`${product?.name || 'Product'} view ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="py-2 md:py-4">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{product?.name || 'Product Name'}</h2>
            
            {/* Variant-specific details */}
            {selectedVariant && (
              <div className="mb-3 text-sm text-gray-600">
                {selectedColor && <span>Color: {selectedColor}</span>}
                {selectedSize && <span className="ml-2">Size: {selectedSize}</span>}
                {selectedVariant.sku && <div className="mt-1">SKU: {selectedVariant.sku}</div>}
              </div>
            )}
            
            {/* Rating */}
            <div className="flex items-center mb-3 md:mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-4 h-4 md:w-5 md:h-5 ${star <= Math.round(product?.rating || 0) ? 'text-amber-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="ml-2 text-xs md:text-sm text-gray-600">({product?.reviewCount || 0} reviews)</span>
            </div>

            {/* Price - Use variant price if available */}
            <div className="mb-4 md:mb-6">
              <div className="flex items-center space-x-2">
                <span className="text-xl md:text-2xl font-bold text-gray-900">
                  ${(selectedVariant?.price || product?.price || 0).toFixed(2)}
                </span>
                {product?.originalPrice && product.originalPrice > (selectedVariant?.price || product.price || 0) && (
                  <span className="text-lg text-gray-500 line-through">${product.originalPrice.toFixed(2)}</span>
                )}
                {product?.onSale && (
                  <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-md">
                    Save ${(product.originalPrice! - (selectedVariant?.price || product.price)).toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-700 text-sm md:text-base mb-4 md:mb-6">
              {product?.description || 'This premium product features high-quality materials and exquisite craftsmanship. Designed for those who appreciate luxury and attention to detail.'}
            </p>

            {/* Color Selection */}
            {availableColors.length > 0 && (
              <div className="mb-4 md:mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Color: {selectedColor}
                  {selectedSize && ` (Available for size ${selectedSize})`}
                </h3>
                <div className="flex space-x-2 flex-wrap">
                  {availableColors.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 ${selectedColor === color ? 'border-amber-500 ring-2 ring-amber-200' : 'border-gray-300'} mb-2`}
                      style={{ backgroundColor: color.toLowerCase() }}
                      aria-label={`Color: ${color}`}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {availableSizes.length > 0 && (
              <div className="mb-4 md:mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Size
                  {selectedColor && ` (Available for ${selectedColor})`}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm border rounded-md transition-all ${
                        selectedSize === size 
                          ? 'border-amber-500 bg-amber-50 text-amber-700 font-semibold' 
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mb-4 md:mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Quantity</h3>
              <div className="flex items-center w-32">
                <button
                  onClick={decrementQuantity}
                  className="p-2 border border-gray-300 rounded-l-md hover:bg-gray-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="px-3 py-1 border-t border-b border-gray-300 text-center flex-1">{quantity}</span>
                <button
                  onClick={incrementQuantity}
                  className="p-2 border border-gray-300 rounded-r-md hover:bg-gray-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 md:space-x-4 mb-4 md:mb-0">
              <button 
                onClick={handleAddToCartClick}
                disabled={!selectedVariant}
                className={`flex-1 font-medium py-3 px-4 md:px-6 rounded-md transition-colors text-sm md:text-base ${
                  selectedVariant 
                    ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {selectedVariant ? 'Add to Cart' : 'Select Options'}
              </button>
              <button className="p-2 md:p-3 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
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

      <style jsx>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default QuickViewModal;
