const express = require('express');
const router = express.Router();
const {
  getShops,
  getShop,
  updateShop,
  getMyShop,
} = require('../controllers/shopController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// Public routes
router.get('/', getShops);

// Protected — Shopkeeper only
router.get('/my/shop', protect, authorize('Shopkeeper'), getMyShop);

// Public — single shop
router.get('/:id', getShop);

// Protected — Shopkeeper only
router.put('/:id', protect, authorize('Shopkeeper'), updateShop);

module.exports = router;
