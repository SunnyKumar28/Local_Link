const express = require('express');
const router = express.Router();
const {
  getProductsByShop,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyInventory,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// Public — get products by shop
router.get('/shop/:shopId', getProductsByShop);

// Protected — Shopkeeper inventory
router.get('/my/inventory', protect, authorize('Shopkeeper'), getMyInventory);

// Public — single product
router.get('/:id', getProduct);

// Protected — Shopkeeper CRUD
router.post('/', protect, authorize('Shopkeeper'), createProduct);
router.put('/:id', protect, authorize('Shopkeeper'), updateProduct);
router.delete('/:id', protect, authorize('Shopkeeper'), deleteProduct);

module.exports = router;
