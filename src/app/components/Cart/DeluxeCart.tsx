// components/DeluxeCart.jsx
import { useState, ChangeEvent, FormEvent } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  addToCart, 
  removeFromCart, 
  clearCart, 
  changeQuantity 
} from '../../../../Redux/cartSlice';

interface CartItem {
  id: string | number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image: string;
}

interface ShippingInfo {
  fullName: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
}

interface PaymentInfo {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
}

interface CartStageProps {
  cartItems: CartItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  onQuantityChange: (id: string | number, quantity: number) => void;
  onCheckout: () => void;
}

interface ShippingStageProps {
  shippingInfo: ShippingInfo;
  setShippingInfo: (info: ShippingInfo) => void;
  onSubmit: (e: FormEvent) => void;
  onBack: () => void;
}

interface PaymentStageProps {
  paymentInfo: PaymentInfo;
  setPaymentInfo: (info: PaymentInfo) => void;
  onSubmit: (e: FormEvent) => void;
  onBack: () => void;
}

interface ConfirmationStageProps {
  cartItems: CartItem[];
  shippingInfo: ShippingInfo;
  paymentInfo: PaymentInfo;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  onPlaceOrder: () => void;
  onBack: () => void;
}

interface CompletedStageProps {
  onContinueShopping: () => void;
}

const DeluxeCart = () => {
  const [currentStage, setCurrentStage] = useState<'cart' | 'shipping' | 'payment' | 'confirmation' | 'completed'>('cart');
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: '',
    address: '',
    city: '',
    zipCode: '',
    country: ''
  });
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });
  
  const cartItems = useSelector((state: any) => state.cart.cartItems as CartItem[]);
  const dispatch = useDispatch();
  
  const subtotal = cartItems.reduce((total: number, item: CartItem) => 
    total + (item.price * item.quantity), 0
  );
  const shippingCost = subtotal > 0 ? 5.99 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;
  
const handleQuantityChange = (id: string | number, quantity: number) => {
  if (quantity === 0) {
    dispatch(removeFromCart({ id }));
  } else {
    dispatch(changeQuantity({ id, quantity }));
  }
};
  const handleCheckout = () => {
    setCurrentStage('shipping');
  };
  
  const handleShippingSubmit = (e: FormEvent) => {
    e.preventDefault();
    setCurrentStage('payment');
  };
  
  const handlePaymentSubmit = (e: FormEvent) => {
    e.preventDefault();
    setCurrentStage('confirmation');
  };
  
  const handlePlaceOrder = () => {
    // In a real app, you would send the order to your backend here
    dispatch(clearCart());
    setCurrentStage('completed');
  };
  
  const handleContinueShopping = () => {
    setCurrentStage('cart');
  };
  
  // Render different stages based on currentStage
  return (
    <div className="deluxe-cart-container">
      <style jsx>{`
        .deluxe-cart-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          font-family: 'Playfair Display', 'Georgia', serif;
          color: #2c3e50;
          background: linear-gradient(135deg, #f9f7f0 0%, #f1ece1 100%);
          min-height: 100vh;
        }
        
        .cart-stages {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3rem;
          position: relative;
        }
        
        .cart-stages::before {
          content: '';
          position: absolute;
          top: 20px;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(to right, #d4af37 0%, transparent 100%);
          z-index: 1;
        }
        
        .stage {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 2;
        }
        
        .stage-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1ece1;
          border: 2px solid #d4af37;
          color: #d4af37;
          font-weight: bold;
          margin-bottom: 0.5rem;
          transition: all 0.3s ease;
        }
        
        .stage.active .stage-number {
          background: #d4af37;
          color: white;
          box-shadow: 0 0 15px rgba(212, 175, 55, 0.5);
        }
        
        .stage.completed .stage-number {
          background: #d4af37;
          color: white;
        }
        
        .stage-label {
          font-size: 0.9rem;
          color: #7f8c8d;
          font-weight: 500;
        }
        
        .stage.active .stage-label,
        .stage.completed .stage-label {
          color: #2c3e50;
          font-weight: 600;
        }
        
        .cart-content {
          background: white;
          border-radius: 12px;
          padding: 2.5rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          border: 1px solid #eae6da;
        }
        
        h2 {
          color: #2c3e50;
          font-size: 2rem;
          margin-bottom: 1.5rem;
          font-weight: 600;
          position: relative;
          padding-bottom: 0.5rem;
        }
        
        h2::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 60px;
          height: 3px;
          background: linear-gradient(to right, #d4af37, #f1ece1);
          border-radius: 3px;
        }
        
        h3, h4 {
          color: #2c3e50;
          font-weight: 600;
        }
        
        .cart-empty {
          text-align: center;
          padding: 3rem;
          color: #7f8c8d;
        }
        
        .cart-empty i {
          font-size: 4rem;
          color: #d4af37;
          margin-bottom: 1rem;
        }
        
        .cart-items {
          margin-bottom: 2rem;
        }
        
        .cart-item {
          display: flex;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #f1ece1;
          transition: all 0.3s ease;
        }
        
        .cart-item:hover {
          background: #f9f7f0;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
          border-radius: 8px;
        }
        
        .cart-item img {
          width: 100px;
          height: 100px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #eae6da;
        }
        
        .item-details {
          flex: 1;
          padding: 0 1.5rem;
        }
        
        .item-details h3 {
          margin-bottom: 0.5rem;
          font-size: 1.2rem;
        }
        
        .item-details p {
          color: #7f8c8d;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }
        
        .item-price {
          color: #d4af37;
          font-weight: 600;
          font-size: 1.1rem;
        }
        
        .quantity-controls {
          display: flex;
          align-items: center;
          margin-right: 1.5rem;
        }
        
        .quantity-controls button {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #f1ece1;
          border: 1px solid #d4af37;
          color: #d4af37;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .quantity-controls button:hover {
          background: #d4af37;
          color: white;
        }
        
        .quantity-controls span {
          margin: 0 0.8rem;
          font-weight: 600;
          min-width: 20px;
          text-align: center;
        }
        
        .item-total {
          font-weight: 600;
          color: #2c3e50;
          font-size: 1.1rem;
          margin-right: 1.5rem;
          min-width: 80px;
          text-align: right;
        }
        
        .remove-item {
          background: none;
          border: none;
          color: #e74c3c;
          cursor: pointer;
          font-size: 1.2rem;
          transition: all 0.2s ease;
        }
        
        .remove-item:hover {
          transform: scale(1.2);
          color: #c0392b;
        }
        
        .cart-summary {
          background: #f9f7f0;
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid #eae6da;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #eae6da;
        }
        
        .summary-row:last-child {
          border-bottom: none;
        }
        
        .summary-row.total {
          font-weight: 700;
          font-size: 1.2rem;
          color: #2c3e50;
          padding-top: 1rem;
          margin-top: 0.5rem;
          border-top: 2px solid #d4af37;
        }
        
        .checkout-btn, .continue-btn, .place-order-btn, .continue-shopping-btn {
          background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 6px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
          margin-top: 1.5rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
        }
        
        .checkout-btn:hover, .continue-btn:hover, .place-order-btn:hover, .continue-shopping-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 7px 20px rgba(212, 175, 55, 0.4);
        }
        
        .back-btn {
          background: transparent;
          color: #7f8c8d;
          border: 1px solid #eae6da;
          padding: 1rem 2rem;
          border-radius: 6px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-right: 1rem;
        }
        
        .back-btn:hover {
          background: #f9f7f0;
          color: #2c3e50;
        }
        
        .form-row {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .form-group {
          flex: 1;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #2c3e50;
        }
        
        .form-group input, .form-group select {
          width: 100%;
          padding: 0.8rem 1rem;
          border: 1px solid #eae6da;
          border-radius: 6px;
          font-family: inherit;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: #f9f7f0;
        }
        
        .form-group input:focus, .form-group select:focus {
          outline: none;
          border-color: #d4af37;
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
        }
        
        .form-actions, .confirmation-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 2rem;
        }
        
        .confirmation-sections {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }
        
        .confirmation-section {
          background: #f9f7f0;
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid #eae6da;
        }
        
        .confirmation-section h3 {
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #d4af37;
        }
        
        .order-item {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #eae6da;
        }
        
        .order-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }
        
        .order-item img {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 6px;
          margin-right: 1rem;
          border: 1px solid #eae6da;
        }
        
        .shipping-details p, .payment-details p {
          margin-bottom: 0.5rem;
        }
        
        .completed-stage {
          text-align: center;
          padding: 2rem;
        }
        
        .completed-icon {
          font-size: 4rem;
          color: #d4af37;
          margin-bottom: 1.5rem;
        }
        
        @media (max-width: 768px) {
          .form-row {
            flex-direction: column;
            gap: 1rem;
          }
          
          .confirmation-sections {
            grid-template-columns: 1fr;
          }
          
          .cart-item {
            flex-direction: column;
            text-align: center;
          }
          
          .item-details {
            padding: 1rem 0;
          }
          
          .quantity-controls {
            margin: 1rem 0;
          }
        }
      `}</style>
      
      <div className="cart-stages">
        <div className={`stage ${currentStage === 'cart' ? 'active' : ''} ${['shipping', 'payment', 'confirmation', 'completed'].includes(currentStage) ? 'completed' : ''}`}>
          <span className="stage-number">1</span>
          <span className="stage-label">Cart</span>
        </div>
        <div className={`stage ${currentStage === 'shipping' ? 'active' : ''} ${['payment', 'confirmation', 'completed'].includes(currentStage) ? 'completed' : ''}`}>
          <span className="stage-number">2</span>
          <span className="stage-label">Shipping</span>
        </div>
        <div className={`stage ${currentStage === 'payment' ? 'active' : ''} ${['confirmation', 'completed'].includes(currentStage) ? 'completed' : ''}`}>
          <span className="stage-number">3</span>
          <span className="stage-label">Payment</span>
        </div>
        <div className={`stage ${currentStage === 'confirmation' ? 'active' : ''} ${['completed'].includes(currentStage) ? 'completed' : ''}`}>
          <span className="stage-number">4</span>
          <span className="stage-label">Confirmation</span>
        </div>
      </div>
      
      <div className="cart-content">
        {currentStage === 'cart' && (
          <CartStage 
            cartItems={cartItems}
            subtotal={subtotal}
            shippingCost={shippingCost}
            tax={tax}
            total={total}
            onQuantityChange={handleQuantityChange}
            onCheckout={handleCheckout}
          />
        )}
        
        {currentStage === 'shipping' && (
          <ShippingStage 
            shippingInfo={shippingInfo}
            setShippingInfo={setShippingInfo}
            onSubmit={handleShippingSubmit}
            onBack={() => setCurrentStage('cart')}
          />
        )}
        
        {currentStage === 'payment' && (
          <PaymentStage 
            paymentInfo={paymentInfo}
            setPaymentInfo={setPaymentInfo}
            onSubmit={handlePaymentSubmit}
            onBack={() => setCurrentStage('shipping')}
          />
        )}
        
        {currentStage === 'confirmation' && (
          <ConfirmationStage 
            cartItems={cartItems}
            shippingInfo={shippingInfo}
            paymentInfo={paymentInfo}
            subtotal={subtotal}
            shippingCost={shippingCost}
            tax={tax}
            total={total}
            onPlaceOrder={handlePlaceOrder}
            onBack={() => setCurrentStage('payment')}
          />
        )}
        
        {currentStage === 'completed' && (
          <CompletedStage onContinueShopping={handleContinueShopping} />
        )}
      </div>
    </div>
  );
};

// Cart Stage Component
const CartStage = ({ cartItems, subtotal, shippingCost, tax, total, onQuantityChange, onCheckout }: CartStageProps) => {
  if (cartItems.length === 0) {
    return (
      <div className="cart-empty">
        <i className="fas fa-shopping-cart"></i>
        <h2>Your cart is empty</h2>
        <p>Add some items to your cart to continue shopping</p>
      </div>
    );
  }
  
  return (
    <div className="cart-stage">
      <h2>Your Shopping Cart</h2>
      <div className="cart-items">
        {cartItems.map(item => (
          <div key={item.id} className="cart-item">
            <img src={item.image} alt={item.name} />
            <div className="item-details">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <div className="item-price">${item.price.toFixed(2)}</div>
            </div>
            <div className="quantity-controls">
              <button onClick={() => onQuantityChange(item.id, item.quantity - 1)}>
                <i className="fas fa-minus"></i>
              </button>
              <span>{item.quantity}</span>
              <button onClick={() => onQuantityChange(item.id, item.quantity + 1)}>
                <i className="fas fa-plus"></i>
              </button>
            </div>
            <div className="item-total">${(item.price * item.quantity).toFixed(2)}</div>
            <button 
              className="remove-item"
              onClick={() => onQuantityChange(item.id, 0)}
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        ))}
      </div>
      
      <div className="cart-summary">
        <div className="summary-row">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Shipping</span>
          <span>${shippingCost.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Tax</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="summary-row total">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        
        <button className="checkout-btn" onClick={onCheckout}>
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

// Shipping Stage Component
const ShippingStage = ({ shippingInfo, setShippingInfo, onSubmit, onBack }: ShippingStageProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setShippingInfo({
      ...shippingInfo,
      [e.target.name]: e.target.value
    });
  };
  
  return (
    <div className="shipping-stage">
      <h2>Shipping Information</h2>
      <form onSubmit={onSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={shippingInfo.fullName}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              name="address"
              value={shippingInfo.address}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              name="city"
              value={shippingInfo.city}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>ZIP Code</label>
            <input
              type="text"
              name="zipCode"
              value={shippingInfo.zipCode}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Country</label>
            <select
              name="country"
              value={shippingInfo.country}
              onChange={handleChange}
              required
            >
              <option value="">Select Country</option>
              <option value="USA">United States</option>
              <option value="UK">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
            </select>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" className="back-btn" onClick={onBack}>
            Back to Cart
          </button>
          <button type="submit" className="continue-btn">
            Continue to Payment
          </button>
        </div>
      </form>
    </div>
  );
};

// Payment Stage Component
const PaymentStage = ({ paymentInfo, setPaymentInfo, onSubmit, onBack }: PaymentStageProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPaymentInfo({
      ...paymentInfo,
      [e.target.name]: e.target.value
    });
  };
  
  return (
    <div className="payment-stage">
      <h2>Payment Information</h2>
      <form onSubmit={onSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Card Number</label>
            <input
              type="text"
              name="cardNumber"
              value={paymentInfo.cardNumber}
              onChange={handleChange}
              placeholder="1234 5678 9012 3456"
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Card Holder</label>
            <input
              type="text"
              name="cardHolder"
              value={paymentInfo.cardHolder}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Expiry Date</label>
            <input
              type="text"
              name="expiryDate"
              value={paymentInfo.expiryDate}
              onChange={handleChange}
              placeholder="MM/YY"
              required
            />
          </div>
          <div className="form-group">
            <label>CVV</label>
            <input
              type="text"
              name="cvv"
              value={paymentInfo.cvv}
              onChange={handleChange}
              placeholder="123"
              required
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" className="back-btn" onClick={onBack}>
            Back to Shipping
          </button>
          <button type="submit" className="continue-btn">
            Continue to Review
          </button>
        </div>
      </form>
    </div>
  );
};

// Confirmation Stage Component
const ConfirmationStage = ({ 
  cartItems, 
  shippingInfo, 
  paymentInfo, 
  subtotal, 
  shippingCost, 
  tax, 
  total, 
  onPlaceOrder, 
  onBack 
}: ConfirmationStageProps) => {
  return (
    <div className="confirmation-stage">
      <h2>Order Confirmation</h2>
      
      <div className="confirmation-sections">
        <div className="confirmation-section">
          <h3>Order Summary</h3>
          <div className="order-items">
            {cartItems.map(item => (
              <div key={item.id} className="order-item">
                <img src={item.image} alt={item.name} />
                <div className="item-details">
                  <h4>{item.name}</h4>
                  <p>Quantity: {item.quantity}</p>
                </div>
                <div className="item-total">${(item.price * item.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>
          
          <div className="order-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>${shippingCost.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="confirmation-section">
          <h3>Shipping Information</h3>
          <div className="shipping-details">
            <p>{shippingInfo.fullName}</p>
            <p>{shippingInfo.address}</p>
            <p>{shippingInfo.city}, {shippingInfo.zipCode}</p>
            <p>{shippingInfo.country}</p>
          </div>
        </div>
        
        <div className="confirmation-section">
          <h3>Payment Information</h3>
          <div className="payment-details">
            <p>Card ending in ****{paymentInfo.cardNumber.slice(-4)}</p>
            <p>Expires: {paymentInfo.expiryDate}</p>
          </div>
        </div>
      </div>
      
      <div className="confirmation-actions">
        <button type="button" className="back-btn" onClick={onBack}>
          Back to Payment
        </button>
        <button type="button" className="place-order-btn" onClick={onPlaceOrder}>
          Place Order
        </button>
      </div>
    </div>
  );
};

// Completed Stage Component
const CompletedStage = ({ onContinueShopping }: CompletedStageProps) => {
  return (
    <div className="completed-stage">
      <div className="completed-icon">
        <i className="fas fa-check-circle"></i>
      </div>
      <h2>Order Placed Successfully!</h2>
      <p>Thank you for your purchase. Your order has been placed and will be processed shortly.</p>
      <button className="continue-shopping-btn" onClick={onContinueShopping}>
        Continue Shopping
      </button>
    </div>
  );
};

export default DeluxeCart;
