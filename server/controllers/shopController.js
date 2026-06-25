const Shop = require('../models/Shop');

/**
 * @desc    Get all active shops (for customers to browse)
 * @route   GET /api/shops
 * @access  Public
 */
const getShops = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const filter = { isActive: true };

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const shops = await Shop.find(filter)
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: shops.length, shops });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single shop by ID
 * @route   GET /api/shops/:id
 * @access  Public
 */
const getShop = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id).populate(
      'owner',
      'name email phone'
    );

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
      });
    }

    res.status(200).json({ success: true, shop });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update shopkeeper's own shop
 * @route   PUT /api/shops/:id
 * @access  Private (Shopkeeper — owner only)
 */
const updateShop = async (req, res, next) => {
  try {
    let shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
      });
    }

    // Ensure requesting user is the shop owner
    if (shop.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own shop',
      });
    }

    const allowedFields = [
      'name',
      'description',
      'address',
      'category',
      'image',
      'isActive',
    ];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    shop = await Shop.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, shop });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get the shopkeeper's own shop
 * @route   GET /api/shops/my/shop
 * @access  Private (Shopkeeper)
 */
const getMyShop = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'You do not have a shop yet',
      });
    }

    res.status(200).json({ success: true, shop });
  } catch (error) {
    next(error);
  }
};

module.exports = { getShops, getShop, updateShop, getMyShop };
