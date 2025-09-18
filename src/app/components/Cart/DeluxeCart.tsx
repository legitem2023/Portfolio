// components/DeluxeCart.jsx
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  addToCart, 
  removeFromCart, 
  clearCart, 
  changeQuantity 
} from '../../../../Redux/cartSlice';

const DeluxeCart = () => {
  const [currentStage, setCurrentStage] = useState('cart');
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    address: '',
    city: '',
    zipCode: '',
    country: ''
  });
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });
  
  const cartItems = useSelector(state => state.cart.cartItems);
  const dispatch = useDispatch();
  
  const subtotal = cartItems.reduce((total, item) => 
    total + (item.price * item.quantity), 0
  );
  const shippingCost = subtotal > 0 ? 5.99 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;
  
  const handleQuantityChange = (id, quantity) => {
    if (quantity === 0) {
      dispatch(removeFromCart({ id }));
    } else {
      dispatch(changeQuantity({ id, quantity }));
    }
  };
  
  const handleCheckout = () => {
    setCurrentStage('shipping');
  };
  
  const handleShippingSubmit = (e) => {
    e.preventDefault();
    setCurrentStage('payment');
  };
  
  const handlePaymentSubmit = (e) => {
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
const CartStage = ({ cartItems, subtotal, shippingCost, tax, total, onQuantityChange, onCheckout }) => {
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
const ShippingStage = ({ shippingInfo, setShippingInfo, onSubmit, onBack }) => {
  const handleChange = (e) => {
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
const PaymentStage = ({ paymentInfo, setPaymentInfo, onSubmit, onBack }) => {
  const handleChange = (e) => {
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
}) => {
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
const CompletedStage = ({ onContinueShopping }) => {
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
