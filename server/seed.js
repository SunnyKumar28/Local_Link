require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Shop = require('./models/Shop');
const Product = require('./models/Product');
const Order = require('./models/Order');

const seedData = async () => {
  await connectDB();

  // Clear existing data
  await Order.deleteMany({});
  await Product.deleteMany({});
  await Shop.deleteMany({});
  await User.deleteMany({});
  console.log('🗑️  Cleared existing data');

  // ─── Create Users ───────────────────────────────────────────────────
  const users = await User.create([
    {
      name: 'Rahul Sharma',
      email: 'customer@localmart.com',
      password: 'password123',
      role: 'Customer',
      phone: '+91 9876543210',
    },
    {
      name: 'Priya Patel',
      email: 'customer2@localmart.com',
      password: 'password123',
      role: 'Customer',
      phone: '+91 9876543211',
    },
    {
      name: 'Amit Kumar',
      email: 'shopkeeper@localmart.com',
      password: 'password123',
      role: 'Shopkeeper',
      phone: '+91 9012345678',
    },
    {
      name: 'Sneha Reddy',
      email: 'shopkeeper2@localmart.com',
      password: 'password123',
      role: 'Shopkeeper',
      phone: '+91 9012345679',
    },
    {
      name: 'Vikram Singh',
      email: 'shopkeeper3@localmart.com',
      password: 'password123',
      role: 'Shopkeeper',
      phone: '+91 9012345680',
    },
  ]);

  console.log(`👤 Created ${users.length} users`);

  const [customer1, customer2, shopkeeper1, shopkeeper2, shopkeeper3] = users;

  // ─── Create Shops ──────────────────────────────────────────────────
  const shops = await Shop.create([
    {
      name: 'Fresh Mart Grocery',
      owner: shopkeeper1._id,
      description: 'Your one-stop shop for fresh fruits, vegetables, and daily essentials. Quality products at affordable prices.',
      address: { street: '12 MG Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
      category: 'Grocery',
      isActive: true,
      rating: 4.5,
    },
    {
      name: 'TechZone Electronics',
      owner: shopkeeper2._id,
      description: 'Latest gadgets, accessories, and electronics. From smartphones to smart homes — we have it all.',
      address: { street: '45 Brigade Road', city: 'Bangalore', state: 'Karnataka', pincode: '560025' },
      category: 'Electronics',
      isActive: true,
      rating: 4.2,
    },
    {
      name: 'Golden Crust Bakery',
      owner: shopkeeper3._id,
      description: 'Freshly baked bread, cakes, and pastries every morning. Made with love and the finest ingredients.',
      address: { street: '78 Church Street', city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
      category: 'Bakery',
      isActive: true,
      rating: 4.8,
    },
  ]);

  console.log(`🏪 Created ${shops.length} shops`);

  const [groceryShop, electronicsShop, bakeryShop] = shops;

  // ─── Create Products ───────────────────────────────────────────────
  const products = await Product.create([
    // Grocery Products
    { name: 'Organic Basmati Rice', shop: groceryShop._id, description: 'Premium aged basmati rice, 5kg pack', price: 450, stock: 50, category: 'Grains', unit: 'kg', isAvailable: true },
    { name: 'Fresh Tomatoes', shop: groceryShop._id, description: 'Farm-fresh red tomatoes', price: 40, stock: 100, category: 'Vegetables', unit: 'kg', isAvailable: true },
    { name: 'Amul Butter (500g)', shop: groceryShop._id, description: 'Creamy salted butter', price: 275, stock: 30, category: 'Dairy', unit: 'piece', isAvailable: true },
    { name: 'Tata Salt (1kg)', shop: groceryShop._id, description: 'Iodized vacuum evaporated salt', price: 28, stock: 200, category: 'Essentials', unit: 'piece', isAvailable: true },
    { name: 'Alphonso Mangoes', shop: groceryShop._id, description: 'Premium Ratnagiri Alphonso, per dozen', price: 800, stock: 15, category: 'Fruits', unit: 'dozen', isAvailable: true },
    { name: 'Whole Wheat Flour (5kg)', shop: groceryShop._id, description: 'Aashirvaad whole wheat atta', price: 265, stock: 60, category: 'Grains', unit: 'pack', isAvailable: true },
    { name: 'Olive Oil (1L)', shop: groceryShop._id, description: 'Extra virgin cold-pressed olive oil', price: 650, stock: 20, category: 'Cooking Oil', unit: 'litre', isAvailable: true },
    { name: 'Green Tea (100 bags)', shop: groceryShop._id, description: 'Organic green tea with antioxidants', price: 350, stock: 40, category: 'Beverages', unit: 'box', isAvailable: true },

    // Electronics Products
    { name: 'USB-C Fast Charger', shop: electronicsShop._id, description: '65W GaN charger with 3 ports', price: 1499, stock: 25, category: 'Chargers', unit: 'piece', isAvailable: true },
    { name: 'Wireless Earbuds Pro', shop: electronicsShop._id, description: 'ANC earbuds with 30hr battery, IPX5 waterproof', price: 3999, stock: 15, category: 'Audio', unit: 'piece', isAvailable: true },
    { name: 'Phone Screen Protector', shop: electronicsShop._id, description: 'Tempered glass 9H hardness, anti-fingerprint', price: 299, stock: 100, category: 'Accessories', unit: 'piece', isAvailable: true },
    { name: 'LED Desk Lamp', shop: electronicsShop._id, description: 'Adjustable brightness, USB powered, eye-care technology', price: 899, stock: 18, category: 'Lighting', unit: 'piece', isAvailable: true },
    { name: 'Bluetooth Keyboard', shop: electronicsShop._id, description: 'Slim wireless keyboard for tablet & laptop', price: 1299, stock: 12, category: 'Peripherals', unit: 'piece', isAvailable: true },
    { name: 'Power Bank 20000mAh', shop: electronicsShop._id, description: 'Fast charging, dual USB + USB-C output', price: 1799, stock: 30, category: 'Power', unit: 'piece', isAvailable: true },

    // Bakery Products
    { name: 'Sourdough Bread Loaf', shop: bakeryShop._id, description: 'Artisan sourdough with crispy crust, freshly baked', price: 180, stock: 20, category: 'Bread', unit: 'piece', isAvailable: true },
    { name: 'Chocolate Truffle Cake', shop: bakeryShop._id, description: 'Rich Belgian chocolate, 1kg', price: 750, stock: 8, category: 'Cakes', unit: 'piece', isAvailable: true },
    { name: 'Croissants (Pack of 4)', shop: bakeryShop._id, description: 'Buttery flaky French-style croissants', price: 220, stock: 25, category: 'Pastries', unit: 'pack', isAvailable: true },
    { name: 'Blueberry Muffins (6 pcs)', shop: bakeryShop._id, description: 'Soft muffins loaded with fresh blueberries', price: 320, stock: 15, category: 'Pastries', unit: 'box', isAvailable: true },
    { name: 'Garlic Breadsticks (8 pcs)', shop: bakeryShop._id, description: 'Crispy breadsticks with garlic butter glaze', price: 150, stock: 30, category: 'Bread', unit: 'pack', isAvailable: true },
    { name: 'Red Velvet Cupcakes (4 pcs)', shop: bakeryShop._id, description: 'Cream cheese frosting on moist red velvet', price: 400, stock: 12, category: 'Cakes', unit: 'box', isAvailable: true },
  ]);

  console.log(`📦 Created ${products.length} products`);

  // ─── Create Sample Orders ──────────────────────────────────────────
  const orders = await Order.create([
    {
      customer: customer1._id,
      shop: groceryShop._id,
      items: [
        { product: products[0]._id, name: products[0].name, price: products[0].price, quantity: 2 },
        { product: products[1]._id, name: products[1].name, price: products[1].price, quantity: 3 },
      ],
      totalAmount: 450 * 2 + 40 * 3,
      order_status: 'Delivered',
      deliveryAddress: '42 Koramangala, Bangalore',
    },
    {
      customer: customer2._id,
      shop: groceryShop._id,
      items: [
        { product: products[2]._id, name: products[2].name, price: products[2].price, quantity: 1 },
        { product: products[4]._id, name: products[4].name, price: products[4].price, quantity: 1 },
      ],
      totalAmount: 275 + 800,
      order_status: 'Preparing',
      deliveryAddress: '15 Indiranagar, Bangalore',
    },
    {
      customer: customer1._id,
      shop: bakeryShop._id,
      items: [
        { product: products[15]._id, name: products[15].name, price: products[15].price, quantity: 1 },
        { product: products[16]._id, name: products[16].name, price: products[16].price, quantity: 2 },
      ],
      totalAmount: 750 + 220 * 2,
      order_status: 'Pending',
      deliveryAddress: '42 Koramangala, Bangalore',
    },
    {
      customer: customer2._id,
      shop: electronicsShop._id,
      items: [
        { product: products[9]._id, name: products[9].name, price: products[9].price, quantity: 1 },
      ],
      totalAmount: 3999,
      order_status: 'Confirmed',
      deliveryAddress: '15 Indiranagar, Bangalore',
    },
  ]);

  console.log(`🛒 Created ${orders.length} sample orders`);

  // ─── Summary ───────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════');
  console.log('  ✅ Database seeded successfully!');
  console.log('═══════════════════════════════════════════');
  console.log('\n  Demo Accounts:');
  console.log('  ─────────────────────────────────────────');
  console.log('  Customer:    customer@localmart.com   / password123');
  console.log('  Customer 2:  customer2@localmart.com  / password123');
  console.log('  Shopkeeper:  shopkeeper@localmart.com / password123');
  console.log('  Shopkeeper2: shopkeeper2@localmart.com/ password123');
  console.log('  Shopkeeper3: shopkeeper3@localmart.com/ password123');
  console.log('  ─────────────────────────────────────────');
  console.log(`\n  Shops: ${shops.length} | Products: ${products.length} | Orders: ${orders.length}\n`);

  await mongoose.connection.close();
  process.exit(0);
};

seedData().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
