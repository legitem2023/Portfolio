// components/QuickViewModal.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import Image from 'next/image';
import { 
  X, 
  Star, 
  Heart, 
  ShoppingCart, 
  Minus, 
  Plus,
  Image as ImageIcon,
  Package,
  Truck,
  RefreshCw,
  Shield
} from 'lucide-react';
import { addToCart } from '../../../Redux/cartSlice';
import { Product, Variant } from '../../../types';
import LuxuryTabs from './ui/LuxuryTabs';
import ModelViewer from "./ModelViewer";

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: Product, options: { color: string; size: string; quantity: number }) => void;
}

// Helper function to format price as peso
const formatPesoPrice = (price: number): string => {
  return `₱${price.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

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
    return variants.find((variant) => 
      variant?.color === selectedColor && variant?.size === selectedSize
    ) as Variant | undefined;
  }, [variants, selectedColor, selectedSize]);

  // Get images for display - prioritize variant images
  const additionalImages = useMemo(() => {
    if (!product) return ['/NoImage.webp'];
    
    // Use selected variant images if available
    if (selectedVariant?.images && selectedVariant.images.length > 0) {
      return selectedVariant.images;
    }
    
    // Fallback to all variant images or product image
    const variantImages = variants
      ?.map((item: Variant) => item?.images)
      .filter(Boolean)
      .flat() || [];
    
    return variantImages.length > 0 ? variantImages : [product.image || '/NoImage.webp'];
  }, [product, variants, selectedVariant]);

  // 3D Model Component
  const ModelViewer3D = () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 rounded-lg">
      <div className="relative w-full h-64 md:h-80 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
        {/* Placeholder for 3D model - Replace with your actual 3D viewer */}
        <div className="text-center relative">
          <ModelViewer data={product?.model || ''}/>
        </div>
      </div>
    </div>
  );

  // Image Gallery Component
  const ImageGallery = () => (
    <div className="space-y-4">
      <div className="relative flex items-center justify-center aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
        <Image
          src={additionalImages[selectedImage]}
          alt={product?.name || 'Product'}
          className="h-full object-cover aspect-[1/1]"
          width={500}
          height={500}
          quality={85}
          onError={(e) => {
            e.currentTarget.src = '/NoImage.webp';
          }}
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
            className={`aspect-[1/1] h-16 md:h-20 bg-gray-100 rounded-md overflow-hidden border-2 transition-all ${
              selectedImage === index ? 'border-amber-500 scale-105' : 'border-transparent hover:border-gray-300'
            }`}
          >
            <div className="relative w-full h-full">
              <Image
                src={image}
                alt={`${product?.name || 'Product'} view ${index + 1}`}
                className="w-full h-full aspect-[1/1] object-cover"
                fill
                sizes="(max-width: 768px) 20vw, 25vw"
                quality={75}
                onError={(e) => {
                  e.currentTarget.src = '/NoImage.webp';
                }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // Define tabs for LuxuryTabs component
  const productTabs = useMemo(() => {
    // Create the tabs array with conditional inclusion
    const tabs = [
      {
        id: 'gallery',
        label: 'Image Gallery',
        icon: <ImageIcon className="w-4 h-4" />,
        content: <ImageGallery />
      },
      // Conditionally include the 3D View tab
      ...(product?.model ? [{
        id: '3d-view',
        label: '3D View',
        icon: <Package className="w-4 h-4" />,
        content: <ModelViewer3D />
      }] : [])  // Empty array if no model
    ];

    return tabs;
  }, [additionalImages, selectedImage, product]);

  // Update image when variant changes
  useEffect(() => {
    setSelectedImage(0); // Reset to first image when variant changes
  }, [selectedVariant]);

  // Get unique sizes and colors directly from variants with safety checks
  const uniqueSizes = useMemo(() => {
    const sizes = variants
      .map((item: Variant) => item?.size)
      .filter((size): size is string => Boolean(size) && typeof size === 'string');
    return Array.from(new Set(sizes));
  }, [variants]);

  const uniqueColors = useMemo(() => {
    const colors = variants
      .map((item: Variant) => item?.color)
      .filter((color): color is string => Boolean(color) && typeof color === 'string');
    return Array.from(new Set(colors));
  }, [variants]);

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

  // Handle color selection
  const handleColorSelect = (colorName: string) => {
    setSelectedColor(colorName);
  };

  // Handle size selection
  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
  };

  const handleAddToCartClick = () => {
    if (!product || !selectedVariant) return;
    
    try {
      // Create cart item with variant-specific data and proper error handling
      const cartItem = {
        id: Number(selectedVariant.id) || Date.now(),
        productId: product.id?.toString() || 'unknown',
        userId: 'current-user-id',
        sku: selectedVariant.sku?.toString() || `SKU-${selectedVariant.id || 'unknown'}`,
        name: product.name || 'Unknown Product',
        price: selectedVariant.price || product.price || 0,
        image: additionalImages[0] || product.image || '/NoImage.webp',
        quantity: quantity,
        color: selectedColor || 'Unknown',
        size: selectedSize || 'Unknown',
        variant: selectedVariant
      };

      // Validate required fields before dispatching
      if (!cartItem.id) {
        console.error('Missing required cart item fields:', cartItem);
        return;
      }
      
      dispatch(addToCart(cartItem));
      
      if (onAddToCart) {
        onAddToCart(product, {
          color: selectedColor,
          size: selectedSize,
          quantity: quantity
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  // Safe price calculation
  const getDisplayPrice = () => {
    const price = selectedVariant?.price || product?.price || 0;
    return price;
  };

  // Safe original price calculation
  const getOriginalPrice = () => {
    const originalPrice = product?.originalPrice;
    return originalPrice || 0;
  };

  // Calculate savings safely
  const getSavings = () => {
    const currentPrice = selectedVariant?.price || product?.price || 0;
    const originalPrice = product?.originalPrice || currentPrice;
    return (originalPrice - currentPrice);
  };

  if (!isVisible && !isOpen) return null;

  return (
    <div 
      className={`fixed h-[100vh] top-0 bottom-0 m-[auto] inset-0 z-50 flex items-end justify-center p-0 bg-black bg-opacity-70 backdrop-blur-sm transition-opacity duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleOverlayClick}
    >
      {/* The modal content container - 80% height at bottom */}
      <div 
        className={`
          relative bg-white w-full max-w-6xl
          h-[80vh] max-h-[80vh]
          rounded-t-2xl md:rounded-2xl
          overflow-y-auto no-scrollbar
          transition-transform duration-300 ease-out
          ${isAnimating ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        {/* Drag handle for mobile */}
        <div className="sticky top-0 left-0 right-0 flex justify-center py-2 z-10 bg-white">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
        >
          <X className="h-6 w-6 text-gray-600" />
        </button>

        <div className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-2'} gap-4 md:gap-8 p-4 md:p-6`}>
          {/* Product Media Section with Tabs */}
          <div className="h-full">
            <LuxuryTabs 
              tabs={productTabs} 
              defaultTab="gallery"
            />
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
                  <Star
                    key={star}
                    className={`w-4 h-4 md:w-5 md:h-5 ${
                      star <= Math.round(product?.rating || 0) 
                        ? 'fill-amber-400 text-amber-400' 
                        : 'text-gray-300'
                    }`}
                    fill="currentColor"
                  />
                ))}
              </div>
              <span className="ml-2 text-xs md:text-sm text-gray-600">({product?.reviewCount || 0} reviews)</span>
            </div>

            {/* Price - Use variant price if available */}
            <div className="mb-4 md:mb-6">
              <div className="flex items-center space-x-2">
                <span className="text-xl md:text-2xl font-bold text-gray-900">
                  {formatPesoPrice(getDisplayPrice())}
                </span>
                {product?.originalPrice && product.originalPrice > (selectedVariant?.price || product.price || 0) && (
                  <span className="text-lg text-gray-500 line-through">
                    {formatPesoPrice(getOriginalPrice())}
                  </span>
                )}
                {product?.onSale && (
                  <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-md">
                    Save {formatPesoPrice(getSavings())}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-700 text-sm md:text-base mb-4 md:mb-6">
              {product?.description || 'This premium product features high-quality materials and exquisite craftsmanship. Designed for those who appreciate luxury and attention to detail.'}
            </p>

            {/* Color Selection */}
            {uniqueColors.length > 0 && (
              <div className="mb-4 md:mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Color: <span className="font-normal">{selectedColor}</span>
                </h3>
                <div className="flex space-x-2 flex-wrap">
                  {uniqueColors.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => handleColorSelect(color)}
                      className={`px-4 py-2 text-sm border rounded-md transition-all ${
                        selectedColor === color 
                          ? 'border-amber-500 bg-amber-50 text-amber-700 font-semibold' 
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {uniqueSizes.length > 0 && (
              <div className="mb-4 md:mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Size: <span className="font-normal">{selectedSize}</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {uniqueSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => handleSizeSelect(size)}
                      className={`px-4 py-2 text-sm border rounded-md transition-all ${
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
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4 md:h-5 md:w-5" />
                </button>
                <span className="px-3 py-1 border-t border-b border-gray-300 text-center flex-1">{quantity}</span>
                <button
                  onClick={incrementQuantity}
                  className="p-2 border border-gray-300 rounded-r-md hover:bg-gray-100 transition-colors"
                >
                  <Plus className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 md:space-x-4 mb-4 md:mb-0">
              <button 
                onClick={handleAddToCartClick}
                disabled={!selectedVariant}
                className={`flex items-center justify-center flex-1 font-medium py-3 px-4 md:px-6 rounded-md transition-colors text-sm md:text-base ${
                  selectedVariant 
                    ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {selectedVariant ? 'Add to Cart' : 'Select Options'}
              </button>
              <button className="p-2 md:p-3 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors">
                <Heart className="h-5 w-5 md:h-6 md:w-6 text-gray-600" />
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
                <div className="flex items-start">
                  <Truck className="w-4 h-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900">Free Shipping</h4>
                    <p className="text-gray-600">On orders over ₱100</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <RefreshCw className="w-4 h-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900">Returns</h4>
                    <p className="text-gray-600">30-day money back guarantee</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Shield className="w-4 h-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900">Care</h4>
                    <p className="text-gray-600">Machine wash cold</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Package className="w-4 h-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
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
