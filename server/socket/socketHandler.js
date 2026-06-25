const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Shop = require('../models/Shop');

/**
 * Socket.IO Handler
 *
 * Uses 'rooms' based on shop_id so that incoming order alerts are only
 * broadcasted to the specific shopkeeper, not the entire connected network.
 *
 * Room naming convention:
 *   - Shopkeeper rooms: "shop:<shop_id>"
 *   - Customer rooms:   "user:<user_id>"
 */
const initializeSocket = (io) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error — no token'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('Authentication error — user not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error — invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(
      `🔌 Socket connected: ${socket.user.name} (${socket.user.role})`
    );

    // ── Join user-specific room ────────────────────────────────────
    socket.join(`user:${socket.user._id}`);

    // ── If Shopkeeper, join shop room ──────────────────────────────
    if (socket.user.role === 'Shopkeeper') {
      const shop = await Shop.findOne({ owner: socket.user._id });
      if (shop) {
        socket.join(`shop:${shop._id}`);
        console.log(
          `🏪 Shopkeeper ${socket.user.name} joined room: shop:${shop._id}`
        );
      }
    }

    // ── Listen for customer joining order tracking ──────────────────
    socket.on('join_order_tracking', (data) => {
      const { orderId } = data;
      socket.join(`order:${orderId}`);
      console.log(
        `📦 ${socket.user.name} is tracking order: ${orderId}`
      );
    });

    // ── Listen for shopkeeper joining their shop room manually ──────
    socket.on('join_shop_room', (data) => {
      const { shopId } = data;
      socket.join(`shop:${shopId}`);
      console.log(
        `🏪 ${socket.user.name} joined shop room: shop:${shopId}`
      );
    });

    // ── Disconnect ──────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(
        `🔌 Socket disconnected: ${socket.user.name}`
      );
    });
  });
};

module.exports = { initializeSocket };
