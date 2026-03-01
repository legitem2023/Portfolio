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
    // If no variant selected, show base product price (assuming product has price)
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
    // Implement your add to cart logic here
  };

  const handleRemoveFromWishlist = (productId: string) => {
    console.log('Remove from wishlist:', productId);
    // Implement your remove from wishlist logic here
  };

  const handleView3DModel = (modelUrl: string) => {
    if (modelUrl) {
      window.open(modelUrl, '_blank');
    }
  };

  // Render variant options
  const renderVariants = (product: any, productId: string) => {
    if (!product.variants || product.variants.length === 0) return null;

    const selectedVariant = getSelectedVariant(productId);

    return (
      <div className="variant-section">
        <h4 className="variant-title">Select Variant:</h4>
        
        <div className="variants-list">
          {product.variants.map((variant: any, index: number) => (
            <div
              key={variant.sku || index}
              className={`variant-card ${selectedVariant?.sku === variant.sku ? 'selected' : ''}`}
              onClick={() => handleVariantSelect(productId, variant)}
            >
              {/* Color Display */}
              {variant.color && (
                <div className="variant-color">
                  <span 
                    className="color-swatch" 
                    style={{ backgroundColor: variant.color }}
                  />
                  <span className="color-value">{variant.color}</span>
                </div>
              )}

              {/* Size Display */}
              {variant.size && (
                <div className="variant-size">
                  <span className="size-label">Size:</span>
                  <span className="size-value">{variant.size}</span>
                </div>
              )}

              {/* Price Display */}
              <div className="variant-pricing">
                {variant.salePrice && variant.salePrice < variant.price ? (
                  <>
                    <span className="sale-price">
                      ${variant.salePrice.toLocaleString()}
                    </span>
                    <span className="original-price">
                      ${variant.price.toLocaleString()}
                    </span>
                  </>
                ) : (
                  <span className="regular-price">
                    ${variant.price.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="variant-stock">
                {variant.stock > 0 ? (
                  <span className="in-stock">In Stock ({variant.stock})</span>
                ) : (
                  <span className="out-of-stock">Out of Stock</span>
                )}
              </div>

              {/* 3D Model Indicator */}
              {variant.model && (
                <div className="model-indicator">
                  <span className="model-badge">3D Model Available</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="wishlist-container">
      <h2>My Wishlist ({wishlistItems.length} items)</h2>
      
      <div className="wishlist-grid">
        {wishlistItems.map((item: any, index: number) => {
          const selectedVariant = getSelectedVariant(item.product.id);
          const currentPrice = getCurrentPrice(item.product, item.product.id);
          
          return (
            <div key={item.product?.id || index} className="wishlist-card">
              {/* Product Image */}
              <div className="product-image">
                {selectedVariant?.images && selectedVariant.images.length > 0 ? (
                  <Image
                    src={selectedVariant.images[0]}
                    alt={selectedVariant.name || item.product.name}
                    width={300}
                    height={300}
                    className="product-img"
                  />
                ) : item.product.images && item.product.images.length > 0 ? (
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.name}
                    width={300}
                    height={300}
                    className="product-img"
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
                      <p className="sale-price">
                        ${currentPrice.salePrice.toLocaleString()}
                      </p>
                      <p className="original-price">
                        ${currentPrice.price.toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <p className="product-price">
                      ${currentPrice.price.toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Variants Section */}
                {renderVariants(item.product, item.product.id)}

                {/* Selected Variant Info */}
                {selectedVariant && (
                  <div className="selected-variant-info">
                    <p className="sku">SKU: {selectedVariant.sku}</p>
                    {selectedVariant.model && (
                      <button
                        className="btn btn-model"
                        onClick={() => handleView3DModel(selectedVariant.model)}
                      >
                        View 3D Model
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="product-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => handleAddToCart(item.product, item.product.id)}
                  disabled={item.product.variants?.length > 0 && !selectedVariant}
                >
                  Add to Cart
                </button>
                
                <button 
                  className="btn btn-remove"
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
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .wishlist-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
          margin-top: 24px;
        }

        .wishlist-card {
          border: 1px solid #eaeaea;
          border-radius: 12px;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
          background: white;
          display: flex;
          flex-direction: column;
        }

        .wishlist-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .product-image {
          width: 100%;
          height: 240px;
          background: #f5f5f5;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .product-img {
          object-fit: cover;
          width: 100%;
          height: 100%;
          transition: transform 0.3s;
        }

        .product-img:hover {
          transform: scale(1.05);
        }

        .image-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-size: 14px;
        }

        .product-details {
          padding: 20px;
          flex: 1;
        }

        .product-name {
          margin: 0 0 12px 0;
          font-size: 18px;
          font-weight: 600;
          color: #1a1a1a;
          line-height: 1.4;
        }

        .price-container {
          margin-bottom: 16px;
        }

        .product-price, .sale-price {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: #2c3e50;
        }

        .sale-price {
          color: #dc2626;
        }

        .original-price {
          margin: 4px 0 0;
          font-size: 16px;
          color: #999;
          text-decoration: line-through;
        }

        .variant-section {
          margin: 16px 0;
        }

        .variant-title {
          font-size: 14px;
          font-weight: 600;
          color: #666;
          margin-bottom: 12px;
        }

        .variants-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .variant-card {
          border: 1px solid #eaeaea;
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s;
          background: #fafafa;
        }

        .variant-card:hover {
          border-color: #0070f3;
          background: #f0f7ff;
        }

        .variant-card.selected {
          border-color: #0070f3;
          background: #f0f7ff;
          box-shadow: 0 2px 8px rgba(0, 112, 243, 0.1);
        }

        .variant-color {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .color-swatch {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .color-value {
          font-size: 14px;
          color: #666;
          text-transform: capitalize;
        }

        .variant-size {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .size-label {
          color: #999;
        }

        .size-value {
          font-weight: 600;
          color: #333;
        }

        .variant-pricing {
          margin-bottom: 8px;
        }

        .regular-price {
          font-weight: 600;
          color: #2c3e50;
        }

        .variant-stock {
          font-size: 13px;
          margin-bottom: 8px;
        }

        .in-stock {
          color: #10b981;
        }

        .out-of-stock {
          color: #ef4444;
        }

        .model-indicator {
          margin-top: 8px;
        }

        .model-badge {
          display: inline-block;
          padding: 4px 8px;
          background: #e879f9;
          color: white;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
        }

        .selected-variant-info {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px dashed #eaeaea;
        }

        .sku {
          font-size: 12px;
          color: #999;
          margin-bottom: 8px;
        }

        .btn-model {
          background-color: #8b5cf6;
          color: white;
          width: 100%;
          margin-top: 8px;
        }

        .btn-model:hover {
          background-color: #7c3aed;
        }

        .product-actions {
          padding: 20px;
          border-top: 1px solid #eaeaea;
          display: flex;
          gap: 12px;
        }

        .btn {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background-color: #0070f3;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #0051b3;
        }

        .btn-remove {
          background-color: #fff;
          color: #dc2626;
          border: 1px solid #dc2626;
        }

        .btn-remove:hover {
          background-color: #dc2626;
          color: white;
        }

        .wishlist-empty {
          text-align: center;
          padding: 48px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .wishlist-empty p {
          font-size: 18px;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default WishlistDisplay;
