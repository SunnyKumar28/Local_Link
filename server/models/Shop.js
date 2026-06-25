const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
      maxlength: [100, 'Shop name cannot exceed 100 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Shop owner is required'],
      unique: true, // One shopkeeper → one shop
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    address: {
      street: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      pincode: { type: String, trim: true, default: '' },
    },
    category: {
      type: String,
      enum: [
        'Grocery',
        'Electronics',
        'Clothing',
        'Pharmacy',
        'Bakery',
        'Stationery',
        'Hardware',
        'Other',
      ],
      default: 'Other',
    },
    image: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

// Note: owner index is auto-created by unique: true
// Index for category-based browsing
shopSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('Shop', shopSchema);
