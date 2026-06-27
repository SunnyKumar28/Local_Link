const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Shop = require('../models/Shop');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * @desc    Create a Razorpay order (pre-payment)
 * @route   POST /api/payments/create-order
 * @access  Private (Customer)
 *
 * Flow: Validates cart items → creates Razorpay order → saves
 *       a Pending order in DB → returns razorpay order details
 *       to the frontend for checkout modal.
 */
const createPaymentOrder = async (req, res, next) => {
  try {
    const { shopId, items, deliveryAddress, notes } = req.body;

    if (!shopId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Shop ID and at least one item are required',
      });
    }

    // Verify shop exists and is active
    const shop = await Shop.findById(shopId);
    if (!shop || !shop.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found or is not active',
      });
    }

    // Validate items and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.product} not found`,
        });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}`,
        });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      });

      totalAmount += product.price * item.quantity;
    }

    // Check if Razorpay keys are not set or are default placeholders
    const isPlaceholderKey =
      !process.env.RAZORPAY_KEY_ID ||
      process.env.RAZORPAY_KEY_ID.includes('YourTestKeyHere') ||
      process.env.RAZORPAY_KEY_ID.includes('your_key_id') ||
      process.env.RAZORPAY_KEY_ID === 'rzp_test_YourTestKeyHere' ||
      process.env.RAZORPAY_KEY_ID === '';

    if (isPlaceholderKey) {
      // Create a pending order in our DB with a mock order ID
      const order = await Order.create({
        customer: req.user._id,
        shop: shopId,
        items: orderItems,
        totalAmount,
        deliveryAddress: deliveryAddress || '',
        notes: notes || '',
        razorpay_order_id: `mock_order_${Date.now()}`,
        payment_status: 'Pending',
        order_status: 'Pending',
      });

      return res.status(201).json({
        success: true,
        isMock: true,
        razorpayOrder: {
          id: order.razorpay_order_id,
          amount: Math.round(totalAmount * 100),
          currency: 'INR',
        },
        orderId: order._id,
        key: 'mock_key',
      });
    }

    // Create Razorpay order (amount in paise = ₹ × 100)
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: {
          shopId,
          customerName: req.user.name,
          customerEmail: req.user.email,
        },
      });
    } catch (rzpErr) {
      console.error('Razorpay SDK Order Create Error:', rzpErr);
      // Map 401/403 credentials error to a 500 server config error to prevent client logging out
      const statusCode = rzpErr.statusCode === 401 || rzpErr.statusCode === 403 ? 500 : (rzpErr.statusCode || 500);
      return res.status(statusCode).json({
        success: false,
        message: 'Payment gateway configuration issue. Please contact support.',
        ...(process.env.NODE_ENV === 'development' && { details: rzpErr.message }),
      });
    }

    // Save a pending order in our DB (stock not decremented yet)
    const order = await Order.create({
      customer: req.user._id,
      shop: shopId,
      items: orderItems,
      totalAmount,
      deliveryAddress: deliveryAddress || '',
      notes: notes || '',
      razorpay_order_id: razorpayOrder.id,
      payment_status: 'Pending',
      order_status: 'Pending',
    });

    res.status(201).json({
      success: true,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      orderId: order._id,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify Razorpay payment signature & finalize order
 * @route   POST /api/payments/verify
 * @access  Private (Customer)
 *
 * Flow: Verifies HMAC signature → marks order as Paid →
 *       decrements stock → emits Socket.IO event to shopkeeper.
 */
const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    // Check if it's a simulated order (mock or custom gateway)
    const isMock = razorpay_order_id && (razorpay_order_id.startsWith('mock_order_') || razorpay_order_id.startsWith('sim_order_'));

    if (isMock) {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }

      order.razorpay_payment_id = `mock_payment_${Date.now()}`;
      order.razorpay_signature = 'mock_signature';
      order.payment_status = 'Paid';
      order.order_status = 'Confirmed';
      await order.save();

      // Decrement stock
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock -= item.quantity;
          if (product.stock <= 0) {
            product.stock = 0;
            product.isAvailable = false;
          }
          await product.save();
        }
      }

      const populatedOrder = await Order.findById(order._id)
        .populate('customer', 'name email phone')
        .populate('shop', 'name');

      const io = req.app.get('io');
      if (io) {
        io.to(`shop:${order.shop}`).emit('new_order', {
          order: populatedOrder,
          message: `New paid order from ${req.user.name}! 💰 (Simulated Payment)`,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Mock payment verified successfully',
        order: populatedOrder,
      });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification data is incomplete',
      });
    }

    // ── Verify signature using HMAC SHA256 ────────────────────────────
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // Mark payment as failed
      await Order.findByIdAndUpdate(orderId, { payment_status: 'Failed' });
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed — invalid signature',
      });
    }

    // ── Payment verified — update order ───────────────────────────────
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.razorpay_payment_id = razorpay_payment_id;
    order.razorpay_signature = razorpay_signature;
    order.payment_status = 'Paid';
    order.order_status = 'Confirmed'; // Auto-confirm on successful payment
    await order.save();

    // ── Decrement stock (only after successful payment) ───────────────
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock -= item.quantity;
        if (product.stock <= 0) {
          product.stock = 0;
          product.isAvailable = false;
        }
        await product.save();
      }
    }

    // Populate for response & socket event
    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email phone')
      .populate('shop', 'name');

    // ── Real-time: notify shopkeeper ──────────────────────────────────
    const io = req.app.get('io');
    if (io) {
      io.to(`shop:${order.shop}`).emit('new_order', {
        order: populatedOrder,
        message: `New paid order from ${req.user.name}! 💰`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      order: populatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Razorpay public key (for frontend)
 * @route   GET /api/payments/key
 * @access  Public
 */
const getKey = async (req, res) => {
  res.status(200).json({
    success: true,
    key: process.env.RAZORPAY_KEY_ID,
  });
};

module.exports = { createPaymentOrder, verifyPayment, getKey };
