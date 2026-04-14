// components/WishlistDisplay.tsx
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

// Define types
interface Review {
  id: string;
  rating: number;
  comment: string;
  userId: string;
}

interface Variant {
  __typename: string;
  id: string;
  sku: string;
  name: string;
  price: number;
  salePrice: number | null;
  stock: number;
  size: string | null;
  color: string | null;
  createdAt: string;
  model: string | null;
  images: string[];
  reviews: Review[];
}

interface Product {
  __typename: string;
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  salePrice: number | null;
  stock: number;
  isActive: boolean;
  featured: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  onSale?: boolean;
  createdAt: string;
  updatedAt: string;
  brand: string | null;
  category: any;
  images: string[];
  variants: Variant[];
}

interface WishlistItem {
  __typename: string;
  product: Product;
  variants?: Variant[];
}

interface WishlistDisplayProps {
  wishlistItems: WishlistItem[];
}

interface ImageWithVariant {
  image: string;
  variant: Variant;
  key: string;
}

const formatPesoPrice = (price: number): string => {
  return `₱${price.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const WishlistDisplay: React.FC<WishlistDisplayProps> = ({ wishlistItems }) => {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, Variant>>({});
  const [selectedColor, setSelectedColor] = useState<Record<string, string>>({});
  const swiperInstancesRef = useRef<Map<string, any>>(new Map());

  // Handle case when data is passed directly as array
  const items = Array.isArray(wishlistItems) ? wishlistItems : [];

  // Cleanup all Swipers on unmount
  useEffect(() => {
    return () => {
      swiperInstancesRef.current.forEach((swiper) => {
        if (swiper) swiper.destroy(true, true);
      });
      swiperInstancesRef.current.clear();
    };
  }, []);

  if (!items || items.length === 0) {
    return (
      <div className="text-center p-12 bg-white rounded-xl border border-gray-200">
        <p className="text-lg text-gray-500">Your wishlist is empty</p>
      </div>
    );
  }

  const handleVariantSelect = (productId: string, variant: Variant) => {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: variant
    }));
  };

  const getSelectedVariant = (productId: string): Variant | undefined => {
    return selectedVariants[productId];
  };

  const getUniqueColors = useCallback((variants: Variant[]): string[] => {
    if (!variants || variants.length === 0) return [];
    const colors = variants.map(variant => variant.color).filter((color): color is string => Boolean(color));
    return Array.from(new Set(colors));
  }, []);

  const handleColorSelect = useCallback((productId: string, color: string) => {
    setSelectedColor(prev => ({
      ...prev,
      [productId]: color
    }));
    // Also select the variant when color is clicked
    const product = items.find(item => item.product.id === productId)?.product;
    if (product) {
      const variant = product.variants?.find((v: Variant) => v.color === color);
      if (variant) {
        handleVariantSelect(productId, variant);
      }
    }
  }, [items]);

  const getCurrentVariant = useCallback((product: Product, selectedColorValue?: string): Variant | null => {
    if (!product.variants || product.variants.length === 0) return null;
    
    if (selectedColorValue) {
      const foundVariant = product.variants.find((v: Variant) => v.color === selectedColorValue);
      return foundVariant || product.variants[0];
    }
    return product.variants[0];
  }, []);

  // Get all variants with images for swiper
  const getAllVariantsWithImages = useCallback((product: Product): ImageWithVariant[] => {
    if (!product.variants || product.variants.length === 0) return [];
    
    return product.variants.flatMap((variant: Variant) => {
      const images = variant.images || [];
      
      if (images.length > 0) {
        return images.map((image: string, index: number) => ({
          image,
          variant: variant,
          key: `${variant.sku || variant.color || index}-${index}`
        }));
      } else if (variant.color) {
        return [{
          image: '/NoImage.webp',
          variant: variant,
          key: `${variant.sku || variant.color}-noimage`
        }];
      }
      return [];
    });
  }, []);

  // Calculate average rating from variant reviews
  const calculateAverageRating = useCallback((variant: Variant): number => {
    if (!variant?.reviews || variant.reviews.length === 0) return 0;
    
    const totalRating = variant.reviews.reduce((sum: number, review: Review) => sum + (review.rating || 0), 0);
    const averageRating = totalRating / variant.reviews.length;
    
    return Math.round(averageRating * 10) / 10;
  }, []);

  // Calculate total review count for a variant
  const calculateTotalReviews = useCallback((variant: Variant): number => {
    if (!variant?.reviews) return 0;
    return variant.reviews.length;
  }, []);

  const handleRemoveFromWishlist = (item: WishlistItem) => {
    console.log('Remove from wishlist:', item);
    alert(`Removed ${item.product?.name} from wishlist`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
        My Wishlist ({items.length} {items.length === 1 ? 'item' : 'items'})
      </h2>
      
      <div className="w-full grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-3 lg:gap-4">
        {items.map((item: WishlistItem) => {
          const product = item.product;
          if (!product) return null;
          
          const selectedVariant = getSelectedVariant(product.id);
          const variants = product.variants || [];
          const uniqueColors = getUniqueColors(variants);
          const currentVariant = getCurrentVariant(product, selectedColor[product.id]) || selectedVariant || variants[0];
          const allVariantsWithImages = getAllVariantsWithImages(product);
          
          // Calculate rating for display
          let displayRating = 0;
          let displayReviewCount = 0;
          
          if (currentVariant) {
            displayRating = calculateAverageRating(currentVariant);
            displayReviewCount = calculateTotalReviews(currentVariant);
          }
          
          const hasSale = currentVariant?.salePrice && currentVariant?.salePrice < (currentVariant?.price || 0);
          const finalPrice = hasSale ? currentVariant?.salePrice : currentVariant?.price;
          const originalPrice = hasSale ? currentVariant?.price : null;
          
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
              <div className="absolute top-2 left-2 z-10 flex flex-col space-y-1">
                {hasSale && (
                  <span className="px-1.5 py-0.5 text-[10px] xs:text-xs font-bold bg-red-600 text-white rounded-md">SALE</span>
                )}
                {product.isNew && (
                  <span className="px-1.5 py-0.5 text-[10px] xs:text-xs font-bold bg-blue-600 text-white rounded-md">NEW</span>
                )}
                {currentVariant?.stock !== undefined && currentVariant.stock <= 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] xs:text-xs font-bold bg-gray-600 text-white rounded-md">OUT OF STOCK</span>
                )}
              </div>
              
              {product.isFeatured && (
                <div className="absolute top-2 right-2 z-10">
                  <span className="px-1.5 py-0.5 text-[10px] xs:text-xs font-bold bg-amber-600 text-white rounded-md">FEATURED</span>
                </div>
              )}
              
              {/* Remove from Wishlist Button */}
              <div className="absolute top-2 right-2 z-20 md:hidden">
                <button 
                  onClick={() => handleRemoveFromWishlist(item)}
                  className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-md hover:bg-red-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
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
                      {allVariantsWithImages.map((imageItem: ImageWithVariant) => (
                        <SwiperSlide key={imageItem.key}>
                          <div className="relative w-full h-full">
                            <Image
                              height={400}
                              width={400}
                              src={imageItem.image || '/NoImage.webp'}
                              alt={`${product.name}${imageItem.variant?.color ? ` - ${imageItem.variant.color}` : ''}`}
                              quality={25}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {imageItem.variant?.color && (
                              <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-[8px] xs:text-[10px] px-1.5 py-0.5 rounded">
                                {imageItem.variant.color}
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
                      src={product.images?.[0] || '/NoImage.webp'}
                      alt={product.name}
                      quality={25}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  
                  {/* Quick View Button */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <button 
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
                  
                  <button 
                    onClick={() => handleRemoveFromWishlist(item)}
                    className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-1 hidden md:block"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                {/* Dynamic Rating Stars from Variant Reviews */}
                <div className="flex items-center mb-1 sm:mb-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star: number) => {
                      const starValue = displayRating;
                      const isFullStar = star <= Math.floor(starValue);
                      
                      return (
                        <svg
                          key={star}
                          className={`w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 ${isFullStar ? 'text-amber-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      );
                    })}
                    {displayReviewCount > 0 && (
                      <span className="text-[10px] xs:text-xs text-gray-500 ml-0.5 xs:ml-1">
                        ({displayReviewCount})
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs xs:text-sm sm:text-base md:text-lg font-bold text-gray-900">
                      {formatPesoPrice(finalPrice || product.price)}
                    </span>
                    {originalPrice && originalPrice > (finalPrice || 0) && (
                      <span className="text-[10px] xs:text-xs text-gray-500 line-through">
                        {formatPesoPrice(originalPrice)}
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
                        {uniqueColors.slice(0, 4).map((color: string, index: number) => (
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
                    
                    {selectedColor[product.id] && (
                      <div className="mt-1 text-[8px] xs:text-[10px] text-gray-500">
                        Selected: {selectedColor[product.id]}
                      </div>
                    )}
                  </div>
                )}
                
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
    </div>
  );
};

export default React.memo(WishlistDisplay);
