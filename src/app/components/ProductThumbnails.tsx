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

interface Review {
  productId: string;
  rating: number;
  images?: { url: string }[];
  userId: string;
  variantId: string;
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
  const [selectedVariantId, setSelectedVariantId] = useState<Record<string, string>>({});
  
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

  // Calculate average rating from variant reviews
  const calculateAverageRating = useCallback((variant: Product['variants'][0]): number => {
    if (!variant?.reviews || variant.reviews.length === 0) return 0;
    
    const totalRating = variant.reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    const averageRating = totalRating / variant.reviews.length;
    
    return Math.round(averageRating * 10) / 10; // Round to 1 decimal place
  }, []);

  // Calculate total review count for a variant
  const calculateTotalReviews = useCallback((variant: Product['variants'][0]): number => {
    if (!variant?.reviews) return 0;
    return variant.reviews.length;
  }, []);

  // Get overall product rating from all variants
  const getOverallProductRating = useCallback((variants: Product['variants']): { averageRating: number; totalReviews: number } => {
    if (!variants || variants.length === 0) return { averageRating: 0, totalReviews: 0 };
    
    let allRatings: number[] = [];
    let totalReviews = 0;
    
    variants.forEach(variant => {
      if (variant.reviews && variant.reviews.length > 0) {
        variant.reviews.forEach(review => {
          if (review.rating) {
            allRatings.push(review.rating);
          }
        });
        totalReviews += variant.reviews.length;
      }
    });
    
    if (allRatings.length === 0) return { averageRating: 0, totalReviews: 0 };
    
    const totalRating = allRatings.reduce((sum, rating) => sum + rating, 0);
    const averageRating = totalRating / allRatings.length;
    
    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews
    };
  }, []);

  // Get unique variant identifiers (using color, sku, or size)
  const getUniqueVariantIdentifiers = useCallback((variants: Product['variants']) => {
    if (!variants || variants.length === 0) return [];
    
    const identifiers = variants.map(variant => ({
      id: variant.sku || variant.color || variant.size || variant.id || `variant-${Math.random()}`,
      displayName: variant.color || variant.size || variant.name || variant.sku || 'Variant',
      colorValue: variant.color || null,
      variant: variant
    }));
    
    return identifiers;
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
          key: `${variant.sku || variant.color || variant.id || index}-${index}`
        }));
      } else if (variant.color) {
        // If no images but has color, show placeholder with color indicator
        return [{
          image: '/NoImage.webp',
          variant: variant,
          key: `${variant.sku || variant.color || variant.id}-noimage`
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
      
      // Calculate price - use variant salePrice or price if available
      const finalPrice = selectedVariantToUse?.salePrice || selectedVariantToUse?.price || product.salePrice || product.price;
      const originalPrice = selectedVariantToUse?.price || product.price;
      const isOnSale = !!(selectedVariantToUse?.salePrice || product.salePrice);
      
      const cartItem = {
        id: product.id,
        name: product.name,
        price: finalPrice,
        originalPrice: originalPrice,
        onSale: isOnSale,
        isNew: false, // You might want to calculate this based on createdAt
        isFeatured: product.featured || false,
        rating: calculateAverageRating(selectedVariantToUse),
        reviewCount: calculateTotalReviews(selectedVariantToUse),
        image: selectedVariantToUse?.images?.[0] || product.images?.[0] || '/NoImage.webp',
        description: product.description,
        productCode: product.sku,
        category: product.category?.id || '',
        sku: selectedVariantToUse?.sku,
        variants: product.variants,
        userId: 'current-user-id',
        quantity: 1,
        color: selectedVariantToUse?.color,
        size: selectedVariantToUse?.size,
        model: selectedVariantToUse?.model || product.model,
      };
      
      // dispatch(addToCart(cartItem));
      showToast('Added to Cart', 'success');
    } catch (error) {
      console.error('Error adding to cart:', error);
      showToast('Failed to add to cart', 'error');
    }
  }, [calculateAverageRating, calculateTotalReviews]);

  const handleVariantSelect = useCallback((productId: string, variantId: string) => {
    setSelectedVariantId(prev => ({
      ...prev,
      [productId]: variantId
    }));
  }, []);

  const getCurrentVariant = useCallback((product: Product, selectedVariantIdentifier?: string) => {
    if (!product.variants || product.variants.length === 0) return null;
    
    if (selectedVariantIdentifier) {
      const foundVariant = product.variants.find(v => 
        v.sku === selectedVariantIdentifier || 
        v.color === selectedVariantIdentifier || 
        v.size === selectedVariantIdentifier ||
        v.id === selectedVariantIdentifier
      );
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
          const variantIdentifiers = getUniqueVariantIdentifiers(product.variants || []);
          const currentVariant = getCurrentVariant(product, selectedVariantId[product.id]);
          const allVariantsWithImages = getAllVariantsWithImages(product);
          
          // Get rating for current variant or overall product rating
          let displayRating = 0;
          let displayReviewCount = 0;
          
          if (currentVariant) {
            // Use current variant's reviews
            displayRating = calculateAverageRating(currentVariant);
            displayReviewCount = calculateTotalReviews(currentVariant);
          } else {
            // Use overall product rating from all variants
            const overallRating = getOverallProductRating(product.variants || []);
            displayRating = overallRating.averageRating;
            displayReviewCount = overallRating.totalReviews;
          }
          
          // Get price display
          const displayPrice = currentVariant?.salePrice || currentVariant?.price || product.salePrice || product.price;
          const displayOriginalPrice = currentVariant?.price || product.price;
          const isOnSale = !!(currentVariant?.salePrice || product.salePrice);
          
          return (
            <div 
              key={product.id} 
              className="group backdrop-blur-md shadow-md transition-all duration-300 hover:shadow-xl border border-gray-100/50 flex flex-col h-full relative"
              style={{
                border: 'solid 1px transparent',
                borderRadius: '3px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(200,180,255,0.5) 100%)',
                backdropFilter: 'blur(2px)',
                WebkitBackdropFilter: 'blur(2px)'
              }}>
              {/* Badges */}
              {(isOnSale || product.featured) && (
                <div className="absolute top-2 left-2 z-10 flex flex-col space-y-1">
                  {isOnSale && (
                    <span className="px-1.5 py-0.5 text-[10px] xs:text-xs font-bold bg-red-600 text-white rounded-md">SALE</span>
                  )}
                  {product.featured && (
                    <span className="px-1.5 py-0.5 text-[10px] xs:text-xs font-bold bg-amber-600 text-white rounded-md">FEATURED</span>
                  )}
                </div>
              )}
              
              {/* Product Image */}
              <div className="relative overflow-hidden bg-gray-100 flex-grow">
                <div className="aspect-square w-full">
                  {allVariantsWithImages.length > 0 ? (
                    <Swiper
                      onSwiper={(swiper) => {
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
                              alt={`${product.name}${variant?.color ? ` - ${variant.color}` : ''}${variant?.size ? ` - ${variant.size}` : ''}`}
                              quality={25}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                            />
                            {/* Show variant details badge */}
                            {(variant?.color || variant?.size) && (
                              <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-[8px] xs:text-[10px] px-1.5 py-0.5 rounded">
                                {variant.color && variant.color}
                                {variant.color && variant.size && ' - '}
                                {variant.size && variant.size}
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
                      src={product.images?.[0] || '/NoImage.webp'}
                      alt={product.name}
                      quality={25}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
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
                
                {/* Dynamic Rating Stars */}
                <div className="flex items-center mb-1 sm:mb-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const starValue = displayRating;
                      const isFullStar = star <= Math.floor(starValue);
                      const isHalfStar = star === Math.ceil(starValue) && starValue % 1 !== 0;
                      
                      return (
                        <svg
                          key={star}
                          className={`w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 ${
                            isFullStar ? 'text-amber-400' : isHalfStar ? 'text-amber-400' : 'text-gray-300'
                          }`}
                          fill={isHalfStar ? "url(#half-star-gradient)" : "currentColor"}
                          viewBox="0 0 20 20"
                        >
                          {isHalfStar ? (
                            <>
                              <defs>
                                <linearGradient id="half-star-gradient" x1="0%" x2="100%" y1="0%" y2="0%">
                                  <stop offset="50%" stopColor="currentColor" />
                                  <stop offset="50%" stopColor="#D1D5DB" />
                                </linearGradient>
                              </defs>
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </>
                          ) : (
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          )}
                        </svg>
                      );
                    })}
                    {displayReviewCount > 0 && (
                      <span className="text-[10px] xs:text-xs text-gray-500 ml-0.5 xs:ml-1">
                        ({displayReviewCount})
                      </span>
                    )}
                    {displayReviewCount === 0 && displayRating > 0 && (
                      <span className="text-[10px] xs:text-xs text-gray-500 ml-0.5 xs:ml-1">
                        ({displayRating.toFixed(1)})
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs xs:text-sm sm:text-base md:text-lg font-bold text-gray-900">
                      {formatPesoPrice(displayPrice)}
                    </span>
                    {isOnSale && displayOriginalPrice > displayPrice && (
                      <span className="text-[10px] xs:text-xs text-gray-500 line-through">
                        {formatPesoPrice(displayOriginalPrice)}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Variant selection - Shows ALL variants */}
                {variantIdentifiers.length > 0 && (
                  <div className="mt-1 sm:mt-2">
                    <div className="flex flex-col space-y-1">
                      <span className="text-[10px] xs:text-xs text-gray-500 font-medium">Available Variants:</span>
                      <div className="flex flex-wrap gap-1 xs:gap-1.5">
                        {variantIdentifiers.map((identifier, index) => {
                          const isSelected = selectedVariantId[product.id] === identifier.id;
                          return (
                            <button
                              key={index}
                              onClick={() => handleVariantSelect(product.id, identifier.id)}
                              className={`
                                px-1.5 py-0.5 text-[9px] xs:text-[10px] sm:text-xs 
                                rounded-full border transition-all duration-200
                                ${isSelected 
                                  ? 'border-amber-500 bg-amber-50 text-amber-700 font-medium shadow-sm' 
                                  : 'border-gray-200 bg-white text-gray-600 hover:border-amber-300 hover:bg-amber-50'
                                }
                              `}
                              title={identifier.displayName}
                            >
                              {identifier.colorValue ? (
                                <div className="flex items-center space-x-1">
                                  <div 
                                    className="w-2 h-2 xs:w-2.5 xs:h-2.5 rounded-full" 
                                    style={{ backgroundColor: identifier.colorValue }}
                                  />
                                  <span>{identifier.displayName}</span>
                                </div>
                              ) : (
                                identifier.displayName
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Show current variant details */}
                {currentVariant && (
                  <div className="mt-1 space-y-0.5">
                    {currentVariant.color && (
                      <div className="text-[8px] xs:text-[10px] text-gray-500">
                        Color: {currentVariant.color}
                      </div>
                    )}
                    {currentVariant.size && (
                      <div className="text-[8px] xs:text-[10px] text-gray-500">
                        Size: {currentVariant.size}
                      </div>
                    )}
                    {currentVariant.sku && (
                      <div className="text-[8px] xs:text-[10px] text-gray-400">
                        SKU: {currentVariant.sku}
                      </div>
                    )}
                    {currentVariant.model && (
                      <div className="text-[8px] xs:text-[10px] text-gray-400">
                        Model: {currentVariant.model}
                      </div>
                    )}
                    {currentVariant.stock !== undefined && (
                      <div className={`text-[8px] xs:text-[10px] ${currentVariant.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Stock: {currentVariant.stock > 0 ? `${currentVariant.stock} available` : 'Out of stock'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <QuickViewModal 
        product={selectedVariant?.product || null}
        isOpen={isQuickViewOpen} 
        onClose={handleCloseQuickView} 
        onAddToCart={(product) => handleAddToCart(product, selectedVariant?.variant)}
        userId={userId}
      />
    </>
  );
};

export default React.memo(ProductThumbnails);
