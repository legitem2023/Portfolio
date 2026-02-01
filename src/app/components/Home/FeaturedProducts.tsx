// components/FeaturedProducts.tsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

import Image from 'next/image';
import { showToast } from '../../../../utils/toastify';
import { Product } from '../../../../types';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import { Heart, Star } from 'lucide-react';
import CategoryShimmer from '../CategoryShimmer';

interface FeaturedProductsProps {
  products: Product[];
  loading: boolean;
  title?: string;
  description?: string;
}

// Helper function to format price as peso
const formatPesoPrice = (price: number): string => {
  return `₱${price.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({
  products,
  loading,
  title = "Featured Products",
  description = "Handpicked selection of our most exclusive and sought-after items."
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const dispatch = useDispatch();


  // Helper function to get unique colors from variants
  const getUniqueColors = (variants: Product['variants']) => {
    const colors = variants.map(variant => variant.color).filter(Boolean);
    return Array.from(new Set(colors));
  };

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">{description}</p>
        </div>

        {loading ? (
          <CategoryShimmer count={4} />
        ) : (
          <>
            <div className="w-full max-w-7xl grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-3 lg:gap-4">
              {products.map((product) => {
                const uniqueColors = getUniqueColors(product.variants);
                
                return (
                  <div 
                    key={product.id} 
                    className="group backdrop-blur-md shadow-md transition-all duration-300 hover:shadow-xl border border-gray-100/50 flex flex-col h-full"
                    style={{
                      border:'solid 1px transparent',
                      borderRadius:'1px',
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(200,180,255,0.5) 100%)',
                      backdropFilter: 'blur(3px)',
                      WebkitBackdropFilter: 'blur(3px)'
                    }}>
                    {/* Sale/New Badge */}
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
                    
                    {/* Featured Badge */}
                    {product.isFeatured && (
                      <div className="absolute top-2 right-2 z-10">
                        <span className="px-1.5 py-0.5 text-[10px] xs:text-xs font-bold bg-amber-600 text-white rounded-md">FEATURED</span>
                      </div>
                    )}
                    
                    {/* Product Image */}
                    <div className="relative overflow-hidden bg-gray-100 flex-grow">
                      <div className="aspect-square w-full">
                        {product.variants && product.variants.length > 0 ? (               
                          <Swiper
                            spaceBetween={10}
                            slidesPerView={1}
                            pagination={{
                              clickable: true,
                              bulletClass: 'swiper-pagination-bullet',
                              bulletActiveClass: 'swiper-pagination-bullet-active',
                              renderBullet: function (index, className) {
                                return `<span class="${className} !w-1.5 !h-1.5 !bg-white !opacity-70"></span>`;
                              }
                            }}
                            modules={[Pagination]}
                            className="h-full w-full"
                          >
                            {product.variants
                              .filter((variant: any) => variant.sku === product.sku)
                              .flatMap((variant: any) => 
                                variant.images?.length > 0 ? 
                                  variant.images.map((image: string, index: number) => ({
                                    image,
                                    key: `${variant.sku}-${index}`
                                  })) : []
                              )
                              .map(({ image, key }) => (
                                <SwiperSlide key={key}>
                                  <Image
                                    height={400}
                                    width={400}
                                    
                                    src={image || '/NoImage.webp'}
                                    alt={product.name}
                                    quality={25}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  />
                                </SwiperSlide>
                              ))
                            }
                          </Swiper>
                        ) : (
                          <Image
                            height={400}
                            width={400}
                            
                            src={product.image || '/NoImage.webp'}
                            alt={product.name}
                            quality={25}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                        
                        {/* Quick View Button */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                          
                        </div>
                      </div>
                    </div>
                    
                    {/* Product Details */}
                    <div className="p-2 sm:p-3 flex flex-col flex-grow">
                      <div className="flex justify-between items-start mb-1 sm:mb-2 flex-grow">
                        <h3 className="font-medium text-gray-900 text-[11px] xs:text-xs sm:text-sm hover:text-amber-700 transition-colors cursor-pointer line-clamp-2 leading-tight">
                          {product.name}
                        </h3>
                        
                        {/* Wishlist Button */}
                        <button className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-1">
                          <Heart size={14} className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
                        </button>
                      </div>
                      
                      {/* Rating */}
                      <div className="flex items-center mb-1 sm:mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i}
                              size={12}
                              className={`h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-4 sm:h-4 ${i < Math.floor(product.rating || 0) ? "text-amber-400 fill-amber-400" : "text-gray-300"}`}
                            />
                          ))}
                          <span className="text-[10px] xs:text-xs text-gray-500 ml-0.5 xs:ml-1">
                            ({product.reviewCount || 0})
                          </span>
                        </div>
                      </div>
                      
                      {/* Price */}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center space-x-1">
                          <span className="text-xs xs:text-sm sm:text-base md:text-lg font-bold text-gray-900">
                            {formatPesoPrice(product.price)}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-[10px] xs:text-xs text-gray-500 line-through">
                              {formatPesoPrice(product.originalPrice)}
                            </span>
                          )}
                        </div>
                        
                        
                      </div>
                      
                      {/* Color Options */}
                      {uniqueColors.length > 0 && (
                        <div className="mt-1 sm:mt-2 flex items-center space-x-1">
                          <span className="text-[10px] xs:text-xs text-gray-500">Colors:</span>
                          <div className="flex space-x-0.5 xs:space-x-1">
                            {uniqueColors.slice(0, 4).map((color, index) => (
                              <span
                                key={index}
                                className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 rounded-full border border-gray-200"
                                style={{ backgroundColor: color }}
                              ></span>
                            ))}
                            {uniqueColors.length > 4 && (
                              <span className="text-[10px] xs:text-xs text-gray-500">+{uniqueColors.length - 4}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            
          </>
        )}

        <div className="text-center mt-12">
          <button className="bg-gray-900 text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors">
            View All Products
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
