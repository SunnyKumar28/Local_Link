const Order = require('../models/Order');
const Product = require('../models/Product');
const Shop = require('../models/Shop');

/**
 * @desc    Place a new order (customer)
 * @route   POST /api/orders
 * @access  Private (Customer)
 */
const createOrder = async (req, res, next) => {
  try {
    const { shopId, items, deliveryAddress, notes } = req.body;

    if (!shopId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Shop ID and at least one item are required',
      });
    }

    // Verify shop exists
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

      // Decrement stock
      product.stock -= item.quantity;
      if (product.stock === 0) {
        product.isAvailable = false;
      }
      await product.save();

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      });

      totalAmount += product.price * item.quantity;
    }

    const order = await Order.create({
      customer: req.user._id,
      shop: shopId,
      items: orderItems,
      totalAmount,
      deliveryAddress,
      notes,
    });

    // Populate for response
    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email phone')
      .populate('shop', 'name');

    // Emit real-time event to the shopkeeper's room
    const io = req.app.get('io');
    if (io) {
      io.to(`shop:${shopId}`).emit('new_order', {
        order: populatedOrder,
        message: `New order received from ${req.user.name}!`,
      });
    }

    res.status(201).json({ success: true, order: populatedOrder });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get customer's own orders
 * @route   GET /api/orders/my
 * @access  Private (Customer)
 */
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('shop', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get orders for shopkeeper's shop (uses compound index)
 * @route   GET /api/orders/shop
 * @access  Private (Shopkeeper)
 */
const getShopOrders = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'You do not have a shop',
      });
    }

    const { status } = req.query;
    // This query leverages the compound index { shop: 1, order_status: 1 }
    const filter = { shop: shop._id };
    if (status) {
      filter.order_status = status;
    }

    const orders = await Order.find(filter)
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update order status (shopkeeper only)
 * @route   PUT /api/orders/:id/status
 * @access  Private (Shopkeeper)
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { order_status } = req.body;

    if (!order_status) {
      return res.status(400).json({
        success: false,
        message: 'order_status is required',
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Verify shopkeeper owns this shop
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop || order.shop.toString() !== shop._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update orders for your own shop',
      });
    }

    order.order_status = order_status;
    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email phone')
      .populate('shop', 'name');

    // Emit real-time event to the customer
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${order.customer._id || order.customer}`).emit(
        'order_status_update',
        {
          order: populatedOrder,
          message: `Your order status has been updated to "${order_status}"`,
        }
      );
      // Also notify the shop room
      io.to(`shop:${shop._id}`).emit('order_updated', {
        order: populatedOrder,
      });
    }

    res.status(200).json({ success: true, order: populatedOrder });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single order
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('shop', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Verify the user is either the customer or the shopkeeper
    const isCustomer =
      order.customer._id.toString() === req.user._id.toString();
    const shop = await Shop.findOne({ owner: req.user._id });
    const isShopkeeper =
      shop && order.shop._id.toString() === shop._id.toString();

    if (!isCustomer && !isShopkeeper) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order',
      });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getShopOrders,
  updateOrderStatus,
  getOrder,
};
