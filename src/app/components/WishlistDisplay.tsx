// components/WishlistDisplay.jsx
import Image from 'next/image';
import { useState } from 'react';

const WishlistDisplay = ({ wishlistItems }: any) => {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, any>>({});

  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <div className="wishlist-empty">
        <p>Your wishlist is empty</p>
      </div>
    );
  }

  const handleVariantSelect = (productId: string, variant: any) => {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: variant
    }));
  };

  const getSelectedVariant = (productId: string) => {
    return selectedVariants[productId];
  };

  const getCurrentPrice = (product: any, productId: string) => {
    const selectedVariant = getSelectedVariant(productId);
    if (selectedVariant) {
      return {
        price: selectedVariant.price,
        salePrice: selectedVariant.salePrice,
        hasSale: selectedVariant.salePrice && selectedVariant.salePrice < selectedVariant.price
      };
    }
    return {
      price: product.price,
      salePrice: product.salePrice,
      hasSale: product.salePrice && product.salePrice < product.price
    };
  };

  const handleAddToCart = (product: any, productId: string) => {
    const selectedVariant = getSelectedVariant(productId);
    if (!selectedVariant && product.variants?.length > 0) {
      alert('Please select a variant first');
      return;
    }
    console.log('Add to cart:', { 
      product, 
      variant: selectedVariant || null 
    });
  };

  const handleRemoveFromWishlist = (productId: string) => {
    console.log('Remove from wishlist:', productId);
  };

  const handleView3DModel = (modelUrl: string) => {
    if (modelUrl) {
      window.open(modelUrl, '_blank');
    }
  };

  return (
    <div className="wishlist-container">
      <h2 className="wishlist-title">My Wishlist ({wishlistItems.length} items)</h2>
      
      <div className="wishlist-grid">
        {wishlistItems.map((item: any, index: number) => {
          const selectedVariant = getSelectedVariant(item.product.id);
          const currentPrice = getCurrentPrice(item.product, item.product.id);
          
          return (
            <div key={item.product?.id || index} className="wishlist-card">
              {/* Product Image */}
              <div className="product-image-wrapper">
                {(selectedVariant?.images && selectedVariant.images.length > 0) ? (
                  <Image
                    src={selectedVariant.images[0]}
                    alt={selectedVariant.name || item.product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="product-image"
                  />
                ) : (item.product.images && item.product.images.length > 0) ? (
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="product-image"
                  />
                ) : (
                  <div className="image-placeholder">
                    <span>No image</span>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="product-details">
                <h3 className="product-name">
                  {selectedVariant?.name || item.product.name}
                </h3>
                
                {/* Price Display */}
                <div className="price-container">
                  {currentPrice.hasSale ? (
                    <>
                      <span className="sale-price">
                        ${currentPrice.salePrice.toLocaleString()}
                      </span>
                      <span className="original-price">
                        ${currentPrice.price.toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <span className="regular-price">
                      ${currentPrice.price.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Variants Section */}
                {item.product.variants && item.product.variants.length > 0 && (
                  <div className="variant-section">
                    <div className="variant-label">Select Variant:</div>
                    <div className="variant-options">
                      {item.product.variants.map((variant: any, vIndex: number) => (
                        <button
                          key={variant.sku || vIndex}
                          className={`variant-chip ${selectedVariant?.sku === variant.sku ? 'selected' : ''}`}
                          onClick={() => handleVariantSelect(item.product.id, variant)}
                        >
                          {variant.color && (
                            <span 
                              className="color-dot" 
                              style={{ backgroundColor: variant.color }}
                            />
                          )}
                          {variant.size && <span>{variant.size}</span>}
                          {variant.stock <= 0 && <span className="stock-badge">Out of Stock</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Variant Info */}
                {selectedVariant && (
                  <div className="variant-info">
                    {selectedVariant.sku && (
                      <p className="sku">SKU: {selectedVariant.sku}</p>
                    )}
                    {selectedVariant.stock > 0 ? (
                      <p className="in-stock">In Stock ({selectedVariant.stock})</p>
                    ) : (
                      <p className="out-of-stock">Out of Stock</p>
                    )}
                  </div>
                )}

                {/* 3D Model Button */}
                {selectedVariant?.model && (
                  <button
                    className="model-button"
                    onClick={() => handleView3DModel(selectedVariant.model)}
                  >
                    View 3D Model
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="product-actions">
                <button 
                  className="add-to-cart-btn"
                  onClick={() => handleAddToCart(item.product, item.product.id)}
                  disabled={item.product.variants?.length > 0 && !selectedVariant}
                >
                  Add to Cart
                </button>
                
                <button 
                  className="remove-btn"
                  onClick={() => handleRemoveFromWishlist(item.product?.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .wishlist-container {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .wishlist-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 2rem;
        }

        .wishlist-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
          width: 100%;
        }

        .wishlist-card {
          display: flex;
          flex-direction: column;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          overflow: hidden;
          transition: box-shadow 0.2s ease;
          height: 100%;
        }

        .wishlist-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .product-image-wrapper {
          position: relative;
          width: 100%;
          padding-top: 75%; /* 4:3 Aspect Ratio */
          background-color: #f9fafb;
        }

        .product-image {
          object-fit: cover;
        }

        .image-placeholder {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-size: 0.875rem;
        }

        .product-details {
          padding: 1rem;
          flex: 1;
        }

        .product-name {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.5rem 0;
          line-height: 1.4;
        }

        .price-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }

        .regular-price, .sale-price {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
        }

        .sale-price {
          color: #dc2626;
        }

        .original-price {
          font-size: 1rem;
          color: #6b7280;
          text-decoration: line-through;
        }

        .variant-section {
          margin-bottom: 1rem;
        }

        .variant-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #4b5563;
          margin-bottom: 0.5rem;
        }

        .variant-options {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .variant-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.375rem 0.75rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 9999px;
          font-size: 0.875rem;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .variant-chip:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .variant-chip.selected {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .color-dot {
          width: 1rem;
          height: 1rem;
          border-radius: 50%;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .stock-badge {
          font-size: 0.75rem;
          color: #ef4444;
          margin-left: 0.25rem;
        }

        .variant-chip.selected .stock-badge {
          color: white;
        }

        .variant-info {
          margin-bottom: 1rem;
          padding: 0.5rem;
          background: #f9fafb;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }

        .sku {
          color: #6b7280;
          margin: 0 0 0.25rem 0;
        }

        .in-stock {
          color: #10b981;
          font-weight: 500;
          margin: 0;
        }

        .out-of-stock {
          color: #ef4444;
          font-weight: 500;
          margin: 0;
        }

        .model-button {
          width: 100%;
          padding: 0.5rem;
          background: #8b5cf6;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
          margin-bottom: 1rem;
        }

        .model-button:hover {
          background: #7c3aed;
        }

        .product-actions {
          display: flex;
          gap: 0.5rem;
          padding: 1rem;
          border-top: 1px solid #e5e7eb;
        }

        .add-to-cart-btn, .remove-btn {
          flex: 1;
          padding: 0.625rem;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .add-to-cart-btn {
          background: #3b82f6;
          color: white;
        }

        .add-to-cart-btn:hover:not(:disabled) {
          background: #2563eb;
        }

        .add-to-cart-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .remove-btn {
          background: white;
          color: #ef4444;
          border: 1px solid #ef4444;
        }

        .remove-btn:hover {
          background: #ef4444;
          color: white;
        }

        .wishlist-empty {
          text-align: center;
          padding: 3rem;
          background: white;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
        }

        .wishlist-empty p {
          font-size: 1.125rem;
          color: #6b7280;
          margin: 0;
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .wishlist-grid {
            grid-template-columns: 1fr;
          }
          
          .wishlist-container {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default WishlistDisplay;
