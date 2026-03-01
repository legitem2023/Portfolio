// components/WishlistDisplay.jsx
import Image from 'next/image';
import { useState } from 'react';

const WishlistDisplay = ({ wishlistItems }: any) => {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, any>>({});

  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <div className="text-center p-12 bg-white rounded-xl border border-gray-200">
        <p className="text-lg text-gray-500">Your wishlist is empty</p>
      </div>
    );
  }

  console.log('Wishlist Data:', wishlistItems);

  const handleVariantSelect = (productId: string, variant: any) => {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: variant
    }));
  };

  const getSelectedVariant = (productId: string) => {
    return selectedVariants[productId];
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
        My Wishlist ({wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'})
      </h2>
      
      <div className="space-y-6">
        {wishlistItems.map((item: any, index: number) => {
          const product = item.product;
          if (!product) return null;
          
          const selectedVariant = getSelectedVariant(product.id);
          const variants = product.variants || [];
          const displayVariant = selectedVariant || variants[0];
          
          return (
            <div 
              key={product.id || index} 
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              {/* Horizontal Layout - Stack on mobile, row on larger screens */}
              <div className="flex flex-col md:flex-row">
                {/* Image Section - Left side */}
                <div className="md:w-72 lg:w-80 flex-shrink-0">
                  <div className="relative h-64 md:h-full min-h-[250px] bg-gray-100">
                    {displayVariant?.images && displayVariant.images.length > 0 ? (
                      <Image
                        src={displayVariant.images[0]}
                        alt={displayVariant.name || product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 320px"
                        className="object-cover"
                      />
                    ) : variants[0]?.images && variants[0].images.length > 0 ? (
                      <Image
                        src={variants[0].images[0]}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 320px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-purple-600 text-white text-sm">
                        No image
                      </div>
                    )}
                    
                    {/* Product name badge on mobile */}
                    <div className="absolute top-3 left-3 md:hidden">
                      <span className="bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                        {product.name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details Section - Right side */}
                <div className="flex-1 p-4 sm:p-6">
                  {/* Product name - hidden on mobile (shown in image badge) */}
                  <h3 className="hidden md:block text-xl font-bold text-gray-900 mb-4">
                    {product.name}
                  </h3>

                  {/* Variants Section */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Available Variants ({variants.length})
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {variants.map((variant: any, vIndex: number) => {
                        const isSelected = selectedVariant?.sku === variant.sku;
                        const hasSale = variant.salePrice && variant.salePrice < variant.price;
                        
                        return (
                          <div 
                            key={variant.sku || vIndex} 
                            className={`
                              border rounded-lg p-3 cursor-pointer transition-all duration-200
                              ${isSelected 
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                              }
                              ${variant.stock <= 0 ? 'opacity-60' : ''}
                            `}
                            onClick={() => variant.stock > 0 && handleVariantSelect(product.id, variant)}
                          >
                            {/* Variant Header */}
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-sm text-gray-900 truncate">
                                {variant.name || product.name}
                              </span>
                              {variant.stock > 0 ? (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                                  {variant.stock} in stock
                                </span>
                              ) : (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                                  Out of stock
                                </span>
                              )}
                            </div>

                            {/* Variant Details */}
                            <div className="space-y-2 text-sm">
                              {/* Color */}
                              {variant.color && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500 w-16">Color:</span>
                                  <div className="flex items-center gap-2">
                                    <span 
                                      className="w-5 h-5 rounded-full border border-gray-300 shadow-sm"
                                      style={{ backgroundColor: variant.color }}
                                    />
                                    <span className="text-gray-900 capitalize">
                                      {variant.color.replace('#', '')}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Size */}
                              {variant.size && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500 w-16">Size:</span>
                                  <span className="text-gray-900 font-medium">{variant.size}</span>
                                </div>
                              )}

                              {/* SKU */}
                              {variant.sku && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500 w-16">SKU:</span>
                                  <span className="text-xs font-mono text-gray-600">{variant.sku}</span>
                                </div>
                              )}

                              {/* Price */}
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 w-16">Price:</span>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {hasSale ? (
                                      <>
                                      <span className="text-red-600 font-bold">
                                        ${variant.salePrice?.toLocaleString()}
                                      </span>
                                      <span className="text-xs text-gray-400 line-through">
                                        ${variant.price?.toLocaleString()}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-gray-900 font-bold">
                                      ${variant.price?.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Created Date */}
                              {variant.createdAt && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500 w-16">Added:</span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(variant.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* 3D Model Link */}
                            {variant.model && (
                              <a 
                                href={variant.model} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                View 3D Model
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button 
                      className={`
                        flex-1 px-6 py-3 rounded-lg font-semibold text-sm transition-colors duration-200
                        ${selectedVariant 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }
                      `}
                      disabled={!selectedVariant}
                    >
                      Add to Cart
                      {selectedVariant && ` - $${selectedVariant.salePrice?.toLocaleString() || selectedVariant.price?.toLocaleString()}`}
                    </button>
                    
                    <button className="px-6 py-3 rounded-lg font-semibold text-sm bg-white text-red-600 border-2 border-red-600 hover:bg-red-600 hover:text-white transition-colors duration-200">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile bottom padding */}
      <div className="h-4 md:h-0" />
    </div>
  );
};

export default WishlistDisplay;
