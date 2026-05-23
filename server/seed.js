const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const User = require('./models/User');
const Cart = require('./models/Cart');
const Order = require('./models/Order');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const products = [
  {
    name: 'Quantum Glide Wireless Mouse',
    description: 'An ergonomic wireless mouse featuring optical tracking, customizable DPI settings, ultra-fast 2.4GHz wireless response, and dynamic RGB lighting. Perfect for prolonged gaming or office work.',
    price: 59.99,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60',
    category: 'Electronics'
  },
  {
    name: 'AeroFit Pro Mechanical Keyboard',
    description: 'A tactile, hot-swappable mechanical keyboard equipped with premium brown switches, custom double-shot PBT keycaps, and a sleek aluminum chassis for maximum durability.',
    price: 129.99,
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60',
    category: 'Electronics'
  },
  {
    name: 'Vortex ANC Wireless Headphones',
    description: 'Experience deep, immersive audio with Active Noise Cancellation (ANC), 40-hour rechargeable battery life, memory-foam ear cups, and hi-res certified drivers.',
    price: 199.99,
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60',
    category: 'Electronics'
  },
  {
    name: 'Zenith Smartwatch Series 5',
    description: 'Track your health, fitness, and lifestyle with this premium smartwatch. Features include an always-on AMOLED display, heart rate monitor, sleep tracking, GPS navigation, and 7-day battery life.',
    price: 249.99,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60',
    category: 'Wearables'
  },
  {
    name: 'HydroFlow Stainless Water Bottle',
    description: 'A double-walled, vacuum-insulated stainless steel water bottle that keeps your drinks ice cold for up to 24 hours or piping hot for up to 12 hours. Sweat-free finish and leakproof lid.',
    price: 34.99,
    stock: 100,
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=60',
    category: 'Lifestyle'
  },
  {
    name: 'Omni Backpack v2 (Waterproof)',
    description: 'A heavy-duty, water-resistant travel and commute backpack. Featuring a dedicated 16-inch laptop compartment, ergonomic padded straps, and a hidden anti-theft pocket.',
    price: 89.99,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=60',
    category: 'Lifestyle'
  },
  {
    name: 'Nova Glow Ambient LED Desk Lamp',
    description: 'A customizable smart LED desk lamp with touch controls, multiple brightness levels, adjustable temperature settings, and a built-in wireless charging pad for your phone.',
    price: 49.99,
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=60',
    category: 'Home Office'
  },
  {
    name: 'Apex Ergonomic Office Chair',
    description: 'A high-back ergonomic office chair featuring adaptive lumbar support, 3D adjustable armrests, premium breathable mesh, and a sturdy nylon wheelbase. Built for maximum posture health.',
    price: 349.99,
    stock: 10,
    imageUrl: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=500&auto=format&fit=crop&q=60',
    category: 'Home Office'
  },
  {
    name: 'Aura Essential Oil Diffuser',
    description: 'Bring spa-like relaxation home with this ultrasonic cool mist diffuser. Includes a 300ml water tank, 7-color ambient LED lighting, auto-shutoff functionality, and WhisperQuiet operation.',
    price: 29.99,
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&auto=format&fit=crop&q=60',
    category: 'Lifestyle'
  },
  {
    name: 'Pulse Peak Running Shoes',
    description: 'High-performance running shoes built with responsive foam cushioning, a lightweight knit mesh upper, and a durable rubber outsole for superior grip and energy return.',
    price: 119.99,
    stock: 18,
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60',
    category: 'Apparel'
  }
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce';
    console.log(`Connecting to database at ${mongoUri}...`);
    await mongoose.connect(mongoUri, {
      dbName: 'ecommerce'
    });
    console.log('Connected to MongoDB. Clearing existing collections...');

    // Clear collections
    await Product.deleteMany({});
    await User.deleteMany({});
    await Cart.deleteMany({});
    await Order.deleteMany({});
    console.log('Collections cleared.');

    // Seed products
    console.log('Seeding products...');
    const createdProducts = await Product.insertMany(products);
    console.log(`Successfully seeded ${createdProducts.length} products.`);

    // Seed users
    console.log('Seeding admin and standard test user accounts...');
    
    // Create Admin
    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@ecommerce.com',
      passwordHash: 'adminpassword123', // Will be hashed in pre-save hook
      role: 'admin'
    });
    await adminUser.save();
    console.log('Created Admin User: admin@ecommerce.com / adminpassword123');

    // Create Standard User
    const standardUser = new User({
      name: 'Jane Doe',
      email: 'user@ecommerce.com',
      passwordHash: 'userpassword123', // Will be hashed in pre-save hook
      role: 'user'
    });
    await standardUser.save();
    console.log('Created Standard User: user@ecommerce.com / userpassword123');

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
