import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../../Redux/cartSlice';
import QuickViewModal from './QuickViewModal';
import Image from 'next/image';
import { showToast } from '../../../utils/toastify';
import { Product } from '../../../types';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { useAuth } from './hooks/useAuth';
import 'swiper/css';
import 'swiper/css/pagination';

interface ProductThumbnailsProps {
  products: Product[];
}

interface SelectedVariant {
  product: Product;
  variant: Product['variants'][0];
}

const formatPesoPrice = (price: number): string => {
  return `₱${price.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const ProductThumbnails: React.FC<ProductThumbnailsProps> = ({ products }) => {
  const { user, loading: userloading } = useAuth();
  const [selectedVariant, setSelectedVariant] = useState<SelectedVariant | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<Record<string, string>>({});
  
  // Refs for cleanup
  const quickViewTimeoutRef = useRef<NodeJS.Timeout>();
  const swiperInstancesRef = useRef<Map<string, any>>(new Map());
  const dispatch = useDispatch();

  // Memoize products to prevent unnecessary re-renders
  const memoizedProducts = useMemo(() => products, [products]);

  // Cleanup function for Swiper instances
  const cleanupSwiper = useCallback((productId: string) => {
    const swiper = swiperInstancesRef.current.get(productId);
    if (swiper) {
      swiper.destroy(true, true);
      swiperInstancesRef.current.delete(productId);
    }
  }, []);

  // Cleanup all Swipers on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts
      if (quickViewTimeoutRef.current) {
        clearTimeout(quickViewTimeoutRef.current);
      }
      
      // Destroy all Swiper instances
      swiperInstancesRef.current.forEach((swiper) => {
        if (swiper) swiper.destroy(true, true);
      });
      swiperInstancesRef.current.clear();
    };
  }, []);

  // Get all variants for a product with their images
  const getAllVariantsWithImages = useCallback((product: Product) => {
    if (!product.variants || product.variants.length === 0) return [];
    
    return product.variants.flatMap(variant => {
      const images = variant.images || [];
      
      if (images.length > 0) {
        return images.map((image: string, index: number) => ({
          image,
          variant: variant,
          key: `${variant.sku || variant.color || index}-${index}`
        }));
      } else if (variant.color) {
        // If no images but has color, show placeholder with color indicator
        return [{
          image: '/NoImage.webp',
          variant: variant,
          key: `${variant.sku || variant.color}-noimage`
        }];
      }
      return [];
    });
  }, []);

  const handleQuickView = useCallback((product: Product, variant: Product['variants'][0]) => {
    setSelectedVariant({ product, variant });
    setIsQuickViewOpen(true);
  }, []);

  const handleCloseQuickView = useCallback(() => {
    setIsQuickViewOpen(false);
    if (quickViewTimeoutRef.current) {
      clearTimeout(quickViewTimeoutRef.current);
    }
    quickViewTimeoutRef.current = setTimeout(() => {
      setSelectedVariant(null);
    }, 300);
  }, []);

  const handleAddToCart = useCallback((product: Product, variant?: Product['variants'][0]) => {
    try {
      const selectedVariantToUse = variant || (product.variants && product.variants[0]);
      
      // Calculate price - use variant price if available, otherwise use product price
      const finalPrice = selectedVariantToUse?.price || product.price;
      
      const cartItem = {
        id: product.id,
        name: product.name,
        price: finalPrice,
        onSale: product.onSale,
        isNew: product.isNew,
        isFeatured: product.isFeatured,
        originalPrice: product.originalPrice, // Use product's original price
        rating: product.rating,
        reviewCount: product.reviewCount,
        image: selectedVariantToUse?.images?.[0] || product.image,
        colors: product.colors,
        description: product.description,
        productCode: product.productCode,
        category: product.category,
        sku: selectedVariantToUse?.sku,
        variants: product.variants,
        userId: 'current-user-id',
        quantity: 1,
        color: selectedVariantToUse?.color,
        size: selectedVariantToUse?.size,
      };
      
      // dispatch(addToCart(cartItem));
      showToast('Added to Cart', 'success');
    } catch (error) {
      console.error('Error adding to cart:', error);
      showToast('Failed to add to cart', 'error');
    }
  }, []);

  const getUniqueColors = useCallback((variants: Product['variants']) => {
    if (!variants || variants.length === 0) return [];
    const colors = variants.map(variant => variant.color).filter((color): color is string => Boolean(color));
    return Array.from(new Set(colors));
  }, []);

  const handleColorSelect = useCallback((productId: string, color: string) => {
    setSelectedColor(prev => ({
      ...prev,
      [productId]: color
    }));
  }, []);

  const getCurrentVariant = useCallback((product: Product, selectedColorValue?: string) => {
    if (!product.variants || product.variants.length === 0) return null;
    
    if (selectedColorValue) {
      const foundVariant = product.variants.find(v => v.color === selectedColorValue);
      return foundVariant || product.variants[0];
    }
    return product.variants[0];
  }, []);

  if (userloading) return null;

  const userId = user?.userId;
  
  return (
    <>
      <div className="w-full max-w-7xl grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-3 lg:gap-4">
        {memoizedProducts.map((product) => {
          const uniqueColors = getUniqueColors(product.variants || []);
          const currentVariant = getCurrentVariant(product, selectedColor[product.id]);
          const allVariantsWithImages = getAllVariantsWithImages(product);
          
          return (
            <div 
              key={product.id} 
              className="group backdrop-blur-md shadow-md transition-all duration-300 hover:shadow-xl border border-gray-100/50 flex flex-col h-full"
              style={{
                border: 'solid 1px transparent',
                borderRadius: '3px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(200,180,255,0.5) 100%)',
                backdropFilter: 'blur(2px)',
                WebkitBackdropFilter: 'blur(2px)'
              }}>
              {/* Badges */}
              {(product.onSale || product.isNew) && (
                <div className="absolute top-2 left-2 z-10 flex flex-col space-y-1">
                  {product.onSale && (
                    <span className="px-1.5 py-0.5 text-[10px] xs:text-xs font-bold bg-red-600 text-white rounded-md">SALE</span>
                  )}
                  {product.isNew && (
                    <span className="px-1.5 py-0.5 text-[10px] xs:text-xs font-bold bg-blue-600 text-white rounded-md">NEW</span>
                  )}
                </div>
              )}
              
              {product.isFeatured && (
                <div className="absolute top-2 right-2 z-10">
                  <span className="px-1.5 py-0.5 text-[10px] xs:text-xs font-bold bg-amber-600 text-white rounded-md">FEATURED</span>
                </div>
              )}
              
              {/* Product Image */}
              <div className="relative overflow-hidden bg-gray-100 flex-grow">
                <div className="aspect-square w-full">
                  {allVariantsWithImages.length > 0 ? (
                    <Swiper
                      onSwiper={(swiper) => {
                        // Store Swiper instance for cleanup
                        swiperInstancesRef.current.set(product.id, swiper);
                      }}
                      spaceBetween={10}
                      slidesPerView={1}
                      pagination={{
                        clickable: true,
                        dynamicBullets: true,
                        renderBullet: (index, className) => {
                          return `<span class="${className} !w-1.5 !h-1.5 !bg-white !opacity-70" data-index="${index}"></span>`;
                        }
                      }}
                      modules={[Pagination]}
                      className="h-full w-full"
                    >
                      {allVariantsWithImages.map(({ image, variant, key }) => (
                        <SwiperSlide key={key}>
                          <div className="relative w-full h-full">
                            <Image
                              height={400}
                              width={400}
                              onClick={() => variant && handleQuickView(product, variant)}
                              src={image || '/NoImage.webp'}
                              alt={`${product.name}${variant?.color ? ` - ${variant.color}` : ''}`}
                              quality={25}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {/* Show variant color badge */}
                            {variant?.color && (
                              <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-[8px] xs:text-[10px] px-1.5 py-0.5 rounded">
                                {variant.color}
                              </div>
                            )}
                          </div>
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  ) : (
                    <Image
                      height={400}
                      width={400}
                      onClick={() => {
                        const defaultVariant = product.variants?.[0];
                        if (defaultVariant) {
                          handleQuickView(product, defaultVariant);
                        }
                      }} 
                      src={product.image || '/NoImage.webp'}
                      alt={product.name}
                      quality={25}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  
                  {/* Quick View Button */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <button 
                      onClick={() => currentVariant && handleQuickView(product, currentVariant)} 
                      className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-white text-gray-900 font-medium px-2 py-1 text-[10px] xs:text-xs rounded-md"
                    >
                      Quick View
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Product Details */}
              <div className="p-2 sm:p-3 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-1 sm:mb-2 flex-grow">
                  <h3 className="font-medium text-gray-900 text-[11px] xs:text-xs sm:text-sm hover:text-amber-700 transition-colors cursor-pointer line-clamp-2 leading-tight">
                    {product.name}
                  </h3>
                  
                  <button className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex items-center mb-1 sm:mb-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 ${star <= Math.round(product.rating || 4) ? 'text-amber-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="text-[10px] xs:text-xs text-gray-500 ml-0.5 xs:ml-1">{product.reviewCount || 0}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs xs:text-sm sm:text-base md:text-lg font-bold text-gray-900">
                      {formatPesoPrice(currentVariant?.price || product.price)}
                    </span>
                    {product.originalPrice && product.originalPrice > (currentVariant?.price || product.price) && (
                      <span className="text-[10px] xs:text-xs text-gray-500 line-through">
                        {formatPesoPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Color selection */}
                {uniqueColors.length > 0 && (
                  <div className="mt-1 sm:mt-2">
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] xs:text-xs text-gray-500">Colors:</span>
                      <div className="flex space-x-0.5 xs:space-x-1">
                        {uniqueColors.slice(0, 4).map((color, index) => (
                          <button
                            key={index}
                            onClick={() => handleColorSelect(product.id, color)}
                            className={`w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 rounded-full border transition-all ${
                              selectedColor[product.id] === color 
                                ? 'border-2 border-amber-500 scale-110' 
                                : 'border-gray-200 hover:scale-110'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                        {uniqueColors.length > 4 && (
                          <span className="text-[10px] xs:text-xs text-gray-500">+{uniqueColors.length - 4}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Show selected color name */}
                    {selectedColor[product.id] && (
                      <div className="mt-1 text-[8px] xs:text-[10px] text-gray-500">
                        Selected: {selectedColor[product.id]}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Show current variant details */}
                {currentVariant?.size && (
                  <div className="mt-1 text-[8px] xs:text-[10px] text-gray-500">
                    Size: {currentVariant.size}
                  </div>
                )}
                
                {currentVariant?.sku && (
                  <div className="mt-0.5 text-[8px] xs:text-[10px] text-gray-400">
                    SKU: {currentVariant.sku}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <QuickViewModal 
        product={selectedVariant?.product || null}
       // selectedVariant={selectedVariant?.variant || null}
        isOpen={isQuickViewOpen} 
        onClose={handleCloseQuickView} 
        onAddToCart={(product) => handleAddToCart(product, selectedVariant?.variant)}
        userId={userId}
      />
    </>
  );
};

export default React.memo(ProductThumbnails);
