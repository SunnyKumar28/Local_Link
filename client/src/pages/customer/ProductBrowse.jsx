import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI, shopAPI, orderAPI, paymentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { HiShoppingCart, HiPlus, HiMinus, HiArrowLeft, HiTrash } from 'react-icons/hi';
import toast from 'react-hot-toast';
import './Customer.css';

const ProductBrowse = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [shopRes, prodRes] = await Promise.all([
          shopAPI.getById(shopId),
          productAPI.getByShop(shopId),
        ]);
        setShop(shopRes.data.shop);
        setProducts(prodRes.data.products);
      } catch (err) {
        toast.error('Failed to load shop data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [shopId]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(`Only ${product.stock} available`);
          return prev;
        }
        return prev.map((item) =>
          item.product === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
          maxStock: product.stock,
        },
      ];
    });
    toast.success(`${product.name} added to cart`);
  };

  const updateCartQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.maxStock) {
              toast.error(`Only ${item.maxStock} available`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const placeOrder = async () => {
    if (cart.length === 0) return;
    if (!deliveryAddress.trim()) {
      toast.error('Please enter a delivery address');
      return;
    }

    try {
      setOrdering(true);
      
      // 1. Create payment order on server
      const res = await paymentAPI.createOrder({
        shopId,
        items: cart.map(({ product, quantity }) => ({ product, quantity })),
        deliveryAddress,
        notes,
      });

      const { razorpayOrder, orderId, key, isMock } = res.data;

      if (isMock) {
        toast.loading('Processing payment (Simulated Demo)...', { id: 'payment-verify' });
        setTimeout(async () => {
          try {
            const verifyRes = await paymentAPI.verifyPayment({
              razorpay_order_id: razorpayOrder.id,
              razorpay_payment_id: `mock_payment_${Date.now()}`,
              razorpay_signature: 'mock_signature',
              orderId,
            });

            if (verifyRes.data.success) {
              toast.success('Order placed & paid successfully (Demo)! 🎉', { id: 'payment-verify' });
              setCart([]);
              setDeliveryAddress('');
              setNotes('');
              setShowCart(false);
              navigate('/customer/orders');
            } else {
              toast.error('Payment simulation failed!', { id: 'payment-verify' });
            }
          } catch (err) {
            toast.error(
              err.response?.data?.message || 'Payment simulation failed',
              { id: 'payment-verify' }
            );
          } finally {
            setOrdering(false);
          }
        }, 1500);
        return;
      }

      // 2. Open Razorpay Checkout modal
      const options = {
        key: key,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Local Link',
        description: `Order from ${shop?.name || 'Local Shop'}`,
        order_id: razorpayOrder.id,
        handler: async (response) => {
          try {
            toast.loading('Verifying payment...', { id: 'payment-verify' });
            
            // 3. Verify signature
            const verifyRes = await paymentAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            });

            if (verifyRes.data.success) {
              toast.success('Order placed & paid successfully! 🎉', { id: 'payment-verify' });
              setCart([]);
              setDeliveryAddress('');
              setNotes('');
              setShowCart(false);
              navigate('/customer/orders');
            } else {
              toast.error('Payment verification failed!', { id: 'payment-verify' });
            }
          } catch (err) {
            toast.error(
              err.response?.data?.message || 'Payment verification failed',
              { id: 'payment-verify' }
            );
          } finally {
            setOrdering(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#10b981', // emerald color
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment checkout closed');
            setOrdering(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate checkout');
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="customer-page container">
        <div className="skeleton" style={{ height: 120, marginBottom: 24 }} />
        <div className="products-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton" style={{ height: 200 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="customer-page container fade-in">
      {/* Shop Header */}
      <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
        <HiArrowLeft /> Back
      </button>

      {shop && (
        <div className="shop-header glass" style={{ marginTop: 16 }}>
          <div className="shop-header-info">
            <h1 className="shop-header-name">{shop.name}</h1>
            <p className="shop-header-desc">{shop.description}</p>
            <span className="badge badge-confirmed">{shop.category}</span>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <h2 className="section-title" style={{ marginTop: 32 }}>Products</h2>

      {products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3>No products available</h3>
          <p>This shop hasn't added any products yet</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product, idx) => {
            const inCart = cart.find((c) => c.product === product._id);
            return (
              <div
                key={product._id}
                className="product-card card"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <div className="product-card-top">
                  <span className="product-unit">{product.unit}</span>
                  <span className={`product-stock ${product.stock < 5 ? 'low' : ''}`}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </span>
                </div>
                <h3 className="product-name">{product.name}</h3>
                {product.description && (
                  <p className="product-desc">{product.description}</p>
                )}
                <div className="product-bottom">
                  <span className="product-price">₹{product.price.toFixed(2)}</span>
                  {inCart ? (
                    <div className="qty-control">
                      <button
                        className="qty-btn"
                        onClick={() => updateCartQty(product._id, -1)}
                      >
                        <HiMinus />
                      </button>
                      <span className="qty-value">{inCart.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateCartQty(product._id, 1)}
                      >
                        <HiPlus />
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                    >
                      <HiPlus /> Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <button
          className="floating-cart-btn btn btn-primary"
          onClick={() => setShowCart(!showCart)}
        >
          <HiShoppingCart />
          <span>{cartCount} items</span>
          <span className="cart-total">₹{cartTotal.toFixed(2)}</span>
        </button>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="cart-overlay" onClick={() => setShowCart(false)}>
          <div className="cart-drawer glass" onClick={(e) => e.stopPropagation()}>
            <div className="cart-drawer-header">
              <h2>Your Cart</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCart(false)}>
                ✕
              </button>
            </div>

            <div className="cart-items">
              {cart.map((item) => (
                <div key={item.product} className="cart-item">
                  <div className="cart-item-info">
                    <span className="cart-item-name">{item.name}</span>
                    <span className="cart-item-price">
                      ₹{item.price.toFixed(2)} × {item.quantity}
                    </span>
                  </div>
                  <div className="cart-item-actions">
                    <div className="qty-control">
                      <button className="qty-btn" onClick={() => updateCartQty(item.product, -1)}>
                        <HiMinus />
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => updateCartQty(item.product, 1)}>
                        <HiPlus />
                      </button>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => removeFromCart(item.product)}>
                      <HiTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-checkout-details" style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Delivery Address *
                </label>
                <textarea
                  className="form-control"
                  style={{ width: '100%', minHeight: '60px', padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', resize: 'none' }}
                  placeholder="Enter full delivery address..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Order Notes (Optional)
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}
                  placeholder="e.g. deliver near park gate..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="cart-footer">
              <div className="cart-total-row">
                <span>Total</span>
                <span className="cart-total-amount">₹{cartTotal.toFixed(2)}</span>
              </div>
              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                onClick={placeOrder}
                disabled={ordering}
              >
                {ordering ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductBrowse;
