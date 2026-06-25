const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getShopOrders,
  updateOrderStatus,
  getOrder,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// Customer routes
router.post('/', protect, authorize('Customer'), createOrder);
router.get('/my', protect, authorize('Customer'), getMyOrders);

// Shopkeeper routes
router.get('/shop', protect, authorize('Shopkeeper'), getShopOrders);
router.put(
  '/:id/status',
  protect,
  authorize('Shopkeeper'),
  updateOrderStatus
);

// Shared — view a single order (both roles)
router.get('/:id', protect, getOrder);

module.exports = router;
