const express = require('express');
const router = express.Router();
const {
  createPaymentOrder,
  verifyPayment,
  getKey,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// Public — get Razorpay key for frontend
router.get('/key', getKey);

// Protected — Customer only
router.post('/create-order', protect, authorize('Customer'), createPaymentOrder);
router.post('/verify', protect, authorize('Customer'), verifyPayment);

module.exports = router;
