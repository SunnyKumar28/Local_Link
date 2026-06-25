const Product = require('../models/Product');
const Shop = require('../models/Shop');

/**
 * @desc    Get all products for a specific shop
 * @route   GET /api/products/shop/:shopId
 * @access  Public
 */
const getProductsByShop = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const filter = { shop: req.params.shopId, isAvailable: true };

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single product
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      'shop',
      'name'
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new product (shopkeeper only)
 * @route   POST /api/products
 * @access  Private (Shopkeeper)
 */
const createProduct = async (req, res, next) => {
  try {
    // Find the shop owned by this shopkeeper
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'You must have a shop to add products',
      });
    }

    const product = await Product.create({
      ...req.body,
      shop: shop._id,
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a product (shopkeeper only — own shop)
 * @route   PUT /api/products/:id
 * @access  Private (Shopkeeper)
 */
const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Verify ownership
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop || product.shop.toString() !== shop._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update products in your own shop',
      });
    }

    const allowedFields = [
      'name',
      'description',
      'price',
      'stock',
      'category',
      'unit',
      'image',
      'isAvailable',
    ];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a product (shopkeeper only — own shop)
 * @route   DELETE /api/products/:id
 * @access  Private (Shopkeeper)
 */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Verify ownership
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop || product.shop.toString() !== shop._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete products in your own shop',
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all products for the shopkeeper's own shop
 * @route   GET /api/products/my/inventory
 * @access  Private (Shopkeeper)
 */
const getMyInventory = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'You must have a shop first',
      });
    }

    const products = await Product.find({ shop: shop._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProductsByShop,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyInventory,
};
