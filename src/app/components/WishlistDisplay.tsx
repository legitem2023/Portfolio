// components/WishlistDisplay.jsx
import Image from 'next/image';

const WishlistDisplay = ({ wishlistItems }:any) => {
  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <div className="wishlist-empty">
        <p>Your wishlist is empty</p>
      </div>
    );
  }

  return (
    <div className="wishlist-container">
      <h2>My Wishlist ({wishlistItems.length} items)</h2>
      
      <div className="wishlist-grid">
        {wishlistItems.map((item:any, index:any) => (
          <div key={item.product?.id || index} className="wishlist-card">
            {/* Product Image Placeholder */}
            <div className="product-image">
              {item.product?.images && item.product.images.length > 0 ? (
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
              <h3 className="product-name">{item.product?.name}</h3>
              
              <p className="product-price">
                ${item.product?.price?.toLocaleString()}
              </p>

              {/* Product ID (optional - for debugging) */}
              <p className="product-id text-sm text-gray-500">
                ID: {item.product?.id}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="product-actions">
              <button 
                className="btn btn-primary"
                onClick={() => handleAddToCart(item.product)}
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
        ))}
      </div>

      {/* Styles */}
      <style jsx>{`
        .wishlist-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .wishlist-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
          margin-top: 24px;
        }

        .wishlist-card {
          border: 1px solid #eaeaea;
          border-radius: 8px;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
          background: white;
        }

        .wishlist-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .product-image {
          width: 100%;
          height: 200px;
          background: #f5f5f5;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .product-img {
          object-fit: cover;
          width: 100%;
          height: 100%;
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
          padding: 16px;
        }

        .product-name {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
          line-height: 1.4;
        }

        .product-price {
          margin: 8px 0;
          font-size: 20px;
          font-weight: 700;
          color: #2c3e50;
        }

        .product-id {
          margin: 4px 0;
          font-size: 12px;
          color: #999;
        }

        .product-actions {
          padding: 16px;
          border-top: 1px solid #eaeaea;
          display: flex;
          gap: 8px;
        }

        .btn {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-primary {
          background-color: #0070f3;
          color: white;
        }

        .btn-primary:hover {
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
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .wishlist-empty p {
          font-size: 18px;
          color: #666;
        }
      `}</style>
    </div>
  );
};

// Handler functions (you can implement these based on your needs)
const handleAddToCart = (product) => {
  console.log('Add to cart:', product);
  // Implement your add to cart logic here
};

const handleRemoveFromWishlist = (productId) => {
  console.log('Remove from wishlist:', productId);
  // Implement your remove from wishlist logic here
};

export default WishlistDisplay;
