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
    <div className="wishlist-container">
      <h2 className="wishlist-title">My Wishlist ({wishlistItems.length} items)</h2>
      
      <div className="wishlist-grid">
        {wishlistItems.map((item: any, index: number) => {
          const product = item.product;
          if (!product) return null;
          
          const selectedVariant = getSelectedVariant(product.id);
          const variants = product.variants || [];
          
          return (
            <div key={product.id || index} className="wishlist-card">
              {/* Variant Images */}
              <div className="variant-image-wrapper">
                {selectedVariant?.images && selectedVariant.images.length > 0 ? (
                  <Image
                    src={selectedVariant.images[0]}
                    alt={selectedVariant.name || product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="variant-image"
                  />
                ) : variants[0]?.images && variants[0].images.length > 0 ? (
                  <Image
                    src={variants[0].images[0]}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="variant-image"
                  />
                ) : (
                  <div className="image-placeholder">
                    <span>No image</span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                
                {/* Variants Display */}
                <div className="variants-container">
                  <h4 className="variants-title">Available Variants:</h4>
                  
                  {variants.map((variant: any, vIndex: number) => {
                    const isSelected = selectedVariant?.sku === variant.sku;
                    const hasSale = variant.salePrice && variant.salePrice < variant.price;
                    
                    return (
                      <div 
                        key={variant.sku || vIndex} 
                        className={`variant-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleVariantSelect(product.id, variant)}
                      >
                        {/* Variant Header */}
                        <div className="variant-header">
                          <span className="variant-name">{variant.name || product.name}</span>
                          {variant.stock > 0 ? (
                            <span className="stock-badge in-stock">In Stock ({variant.stock})</span>
                          ) : (
                            <span className="stock-badge out-of-stock">Out of Stock</span>
                          )}
                        </div>

                        {/* Variant Details Grid */}
                        <div className="variant-details-grid">
                          {/* Color */}
                          {variant.color && (
                            <div className="variant-detail">
                              <span className="detail-label">Color:</span>
                              <div className="color-display">
                                <span 
                                  className="color-swatch" 
                                  style={{ backgroundColor: variant.color }}
                                />
                                <span className="color-value">{variant.color}</span>
                              </div>
                            </div>
                          )}

                          {/* Size */}
                          {variant.size && (
                            <div className="variant-detail">
                              <span className="detail-label">Size:</span>
                              <span className="detail-value">{variant.size}</span>
                            </div>
                          )}

                          {/* SKU */}
                          {variant.sku && (
                            <div className="variant-detail">
                              <span className="detail-label">SKU:</span>
                              <span className="detail-value sku-value">{variant.sku}</span>
                            </div>
                          )}

                          {/* Price */}
                          <div className="variant-detail">
                            <span className="detail-label">Price:</span>
                            <div className="price-display">
                              {hasSale ? (
                                <>
                                  <span className="sale-price">
                                    ${variant.salePrice?.toLocaleString()}
                                  </span>
                                  <span className="original-price">
                                    ${variant.price?.toLocaleString()}
                                  </span>
                                </>
                              ) : (
                                <span className="regular-price">
                                  ${variant.price?.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Created At */}
                          {variant.createdAt && (
                            <div className="variant-detail">
                              <span className="detail-label">Added:</span>
                              <span className="detail-value">
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
                            className="model-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View 3D Model
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Selected Variant Actions */}
                {selectedVariant && (
                  <div className="selected-variant-actions">
                    <button 
                      className="add-to-cart-btn"
                      disabled={selectedVariant.stock <= 0}
                    >
                      Add Selected Variant to Cart
                    </button>
                  </div>
                )}
              </div>

              {/* Wishlist Actions */}
              <div className="wishlist-actions">
                <button className="remove-btn">
                  Remove from Wishlist
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
          display: flex;
          flex-direction: column;
          gap: 2rem;
          width: 100%;
        }

        .wishlist-card {
          display: flex;
          flex-direction: column;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          overflow: hidden;
          transition: box-shadow 0.2s ease;
          width: 100%;
        }

        .wishlist-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .variant-image-wrapper {
          position: relative;
          width: 100%;
          height: 300px;
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .variant-image {
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

        .product-info {
          padding: 1.5rem;
        }

        .product-name {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 1.5rem 0;
        }

        .variants-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .variants-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 0.5rem 0;
        }

        .variant-card {
          border: 2px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 1.25rem;
          cursor: pointer;
          transition: all 0.2s ease;
          background: white;
        }

        .variant-card:hover {
          border-color: #3b82f6;
          background: #fafafa;
        }

        .variant-card.selected {
          border-color: #3b82f6;
          background: #eff6ff;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
        }

        .variant-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .variant-name {
          font-weight: 600;
          color: #111827;
        }

        .stock-badge {
          font-size: 0.875rem;
          font-weight: 500;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
        }

        .in-stock {
          background: #d1fae5;
          color: #065f46;
        }

        .out-of-stock {
          background: #fee2e2;
          color: #991b1b;
        }

        .variant-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .variant-detail {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .detail-label {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .detail-value {
          font-weight: 500;
          color: #111827;
        }

        .color-display {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .color-swatch {
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .color-value {
          text-transform: capitalize;
        }

        .sku-value {
          font-family: monospace;
          font-size: 0.875rem;
        }

        .price-display {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .sale-price {
          font-weight: 700;
          color: #dc2626;
        }

        .original-price {
          font-size: 0.875rem;
          color: #6b7280;
          text-decoration: line-through;
        }

        .regular-price {
          font-weight: 700;
          color: #111827;
        }

        .model-link {
          display: inline-block;
          margin-top: 0.75rem;
          padding: 0.5rem 1rem;
          background: #8b5cf6;
          color: white;
          text-decoration: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          transition: background 0.2s ease;
        }

        .model-link:hover {
          background: #7c3aed;
        }

        .selected-variant-actions {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 2px solid #e5e7eb;
        }

        .add-to-cart-btn {
          width: 100%;
          padding: 1rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 0.75rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .add-to-cart-btn:hover:not(:disabled) {
          background: #2563eb;
        }

        .add-to-cart-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .wishlist-actions {
          padding: 1rem 1.5rem 1.5rem;
        }

        .remove-btn {
          width: 100%;
          padding: 0.75rem;
          background: white;
          color: #ef4444;
          border: 2px solid #ef4444;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .remove-btn:hover {
          background: #ef4444;
          color: white;
        }

        .wishlist-empty {
          text-align: center;
          padding: 3rem;
          background: white;
          border-radius: 1rem;
          border: 1px solid #e5e7eb;
        }

        .wishlist-empty p {
          font-size: 1.125rem;
          color: #6b7280;
          margin: 0;
        }

        @media (max-width: 768px) {
          .variant-details-grid {
            grid-template-columns: 1fr;
          }
          
          .variant-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default WishlistDisplay;
