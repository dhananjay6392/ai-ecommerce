require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Order = require('../models/Order');
const UserActivity = require('../models/UserActivity');
const Payment = require('../models/Payment');
const Cart = require('../models/Cart');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/intellicart_ai');
    console.log(`[Seed DB] Connected to MongoDB: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Seed Error] Could not connect: ${error.message}`);
    process.exit(1);
  }
};

const categoriesData = [
  {
    name: 'Smartphones & Audio',
    slug: 'smartphones-audio',
    description: 'Next-gen flagship smartphones, active noise cancelling earbuds, and acoustic audio devices.',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Computing & AI Hardware',
    slug: 'computing-ai-hardware',
    description: 'High-performance neural workstations, ultra-slim notebooks, and peripheral hardware.',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Wearables & Health',
    slug: 'wearables-health',
    description: 'Biometric smartwatches, fitness bands, and continuous physiological telemetry monitors.',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Smart Living & IoT',
    slug: 'smart-living-iot',
    description: 'Automated home robotics, ambient lighting, and intelligent voice-controlled devices.',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Designer Ergonomics',
    slug: 'designer-ergonomics',
    description: 'Ergonomic workspace seating, electric sit-stand desks, and minimalist accessories.',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('Clearing existing collections...');
    await Promise.all([
      User.deleteMany(),
      Category.deleteMany(),
      Product.deleteMany(),
      Review.deleteMany(),
      Order.deleteMany(),
      Payment.deleteMany(),
      Cart.deleteMany(),
      UserActivity.deleteMany(),
    ]);

    console.log('Creating Admin and Customer accounts...');
    const adminUser = await User.create({
      name: 'Dr. Jane Roberts (Admin)',
      email: 'admin@intellicart.com',
      password: 'Admin@123456',
      role: 'admin',
      phone: '+91 98765 43210',
      address: {
        street: '42 Cyber City Tower 3',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560103',
        country: 'India',
      },
    });

    const customerUser = await User.create({
      name: 'Alex Mercer',
      email: 'alex@example.com',
      password: 'Customer@123456',
      role: 'customer',
      phone: '+91 91234 56789',
      address: {
        street: '15 Innovation Blvd, Tech Park',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500081',
        country: 'India',
      },
    });

    const customerUser2 = await User.create({
      name: 'Sarah Connor',
      email: 'sarah@example.com',
      password: 'Customer@123456',
      role: 'customer',
      phone: '+91 99887 76655',
      address: {
        street: '78 Silicon Avenue',
        city: 'Pune',
        state: 'Maharashtra',
        postalCode: '411057',
        country: 'India',
      },
    });

    console.log('Creating Product Categories...');
    const createdCategories = await Category.insertMany(categoriesData);
    const catMap = {};
    createdCategories.forEach((c) => {
      catMap[c.slug] = c._id;
    });

    console.log('Seeding Products...');
    const productsData = [
      {
        name: 'AeroPulse ANC Pro Wireless Headphones',
        description: 'Studio-grade hybrid active noise cancellation with 40mm beryllium drivers, spatial audio tracking, and 45-hour battery lifespan.',
        category: catMap['smartphones-audio'],
        categoryName: 'Smartphones & Audio',
        brand: 'SonicWave',
        price: 18999,
        discount: 15,
        stock: 35,
        minSafetyStock: 8,
        reorderPoint: 15,
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80',
        ],
        specifications: {
          'Battery Life': '45 Hours',
          'Bluetooth': 'v5.3 Low Latency',
          'Noise Cancellation': 'Hybrid 42dB ANC',
          'Weight': '245 grams',
        },
        tags: ['audio', 'wireless', 'anc', 'noise-cancelling'],
        averageRating: 4.8,
        reviewCount: 38,
        salesCount: 142,
      },
      {
        name: 'Nova Pro 5G Ultra Smartphone (256GB)',
        description: 'Featuring the TensorCore 9000 SoC, 120Hz LTPO AMOLED curved display, and a triple 108MP computational optical camera setup.',
        category: catMap['smartphones-audio'],
        categoryName: 'Smartphones & Audio',
        brand: 'NovaTech',
        price: 64999,
        discount: 10,
        stock: 22,
        minSafetyStock: 6,
        reorderPoint: 12,
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80',
        ],
        specifications: {
          'Processor': 'TensorCore 9000 Octa-Core',
          'Display': '6.8-inch AMOLED 120Hz',
          'Camera': '108MP + 48MP Periscope + 12MP Ultra-wide',
          'Charging': '100W HyperCharge',
        },
        tags: ['smartphone', '5g', 'flagship', 'camera'],
        averageRating: 4.7,
        reviewCount: 29,
        salesCount: 96,
      },
      {
        name: 'QuantumBook Edge M3 Laptop (32GB / 1TB)',
        description: 'Ultra-thin aerospace aluminum unibody designed for AI engineering, machine learning pipelines, and creative workflows.',
        category: catMap['computing-ai-hardware'],
        categoryName: 'Computing & AI Hardware',
        brand: 'Quantum',
        price: 134999,
        discount: 8,
        stock: 14,
        minSafetyStock: 4,
        reorderPoint: 8,
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
        ],
        specifications: {
          'RAM': '32GB LPDDR5X',
          'Storage': '1TB NVMe PCIe Gen 4',
          'Screen': '14.2-inch Mini-LED 3K HDR',
          'Weight': '1.38 kg',
        },
        tags: ['laptop', 'computing', 'developer', 'ai'],
        averageRating: 4.9,
        reviewCount: 24,
        salesCount: 58,
      },
      {
        name: 'Apex Neural Keychron Mechanical Keyboard',
        description: 'Gateron optical magnetic switches with customizable rapid trigger actuation (0.1mm - 4.0mm) and CNC anodized aluminum frame.',
        category: catMap['computing-ai-hardware'],
        categoryName: 'Computing & AI Hardware',
        brand: 'ApexGear',
        price: 11499,
        discount: 12,
        stock: 45,
        minSafetyStock: 10,
        reorderPoint: 20,
        isFeatured: false,
        images: [
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
        ],
        specifications: {
          'Layout': '75% Compact',
          'Switches': 'Hall-Effect Magnetic',
          'Backlight': 'Per-Key South-Facing RGB',
          'Connectivity': 'Tri-Mode (Bluetooth, 2.4G, Type-C)',
        },
        tags: ['keyboard', 'gaming', 'ergonomic', 'mechanical'],
        averageRating: 4.6,
        reviewCount: 19,
        salesCount: 110,
      },
      {
        name: 'Vanguard Titan AI Smartwatch Sapphire Edition',
        description: 'Advanced ECG telemetry, bioimpedance body composition, VO2 max estimation, and dual-frequency L1+L5 GPS navigation.',
        category: catMap['wearables-health'],
        categoryName: 'Wearables & Health',
        brand: 'Vanguard',
        price: 24999,
        discount: 20,
        stock: 28,
        minSafetyStock: 7,
        reorderPoint: 14,
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80',
        ],
        specifications: {
          'Display': '1.43-inch Sapphire AMOLED',
          'Water Resistance': '10 ATM (100 meters)',
          'Battery': 'Up to 14 days',
          'Sensors': 'ECG, PPG, SpO2, Temperature',
        },
        tags: ['smartwatch', 'fitness', 'health', 'gps'],
        averageRating: 4.7,
        reviewCount: 31,
        salesCount: 88,
      },
      {
        name: 'Lumina Smart Ambient Soundbar & Subwoofer',
        description: 'Dolby Atmos 5.1.2 wireless sound system with AI room acoustic calibration and integrated HDMI eARC pass-through.',
        category: catMap['smart-living-iot'],
        categoryName: 'Smart Living & IoT',
        brand: 'Lumina',
        price: 32999,
        discount: 5,
        stock: 16,
        minSafetyStock: 5,
        reorderPoint: 10,
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
        ],
        specifications: {
          'Channels': '5.1.2 Spatial Audio',
          'Output Power': '460W RMS',
          'Decoding': 'Dolby Atmos, DTS:X',
          'Smart Assistant': 'Alexa & Google Cast built-in',
        },
        tags: ['home-theater', 'audio', 'smart-home', 'dolby-atmos'],
        averageRating: 4.5,
        reviewCount: 15,
        salesCount: 42,
      },
      {
        name: 'ErgoGrid Executive Herman-Style Mesh Chair',
        description: 'Dynamic posture kinematics, self-adjusting lumbar support curve, 4D adjustable armrests, and breathable elastomeric mesh.',
        category: catMap['designer-ergonomics'],
        categoryName: 'Designer Ergonomics',
        brand: 'AeroForm',
        price: 28999,
        discount: 18,
        stock: 19,
        minSafetyStock: 5,
        reorderPoint: 10,
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1580481077195-c3a821a58875?auto=format&fit=crop&w=800&q=80',
        ],
        specifications: {
          'Weight Capacity': '160 kg',
          'Recline Tilt': '90° to 135° Synchronous',
          'Base': 'Heavy-duty Die-Cast Aluminum',
          'Warranty': '10-Year Manufacturer',
        },
        tags: ['chair', 'ergonomic', 'furniture', 'office'],
        averageRating: 4.9,
        reviewCount: 42,
        salesCount: 95,
      },
      {
        name: 'AeroGlide Electric Sit-Stand Desk 60x30',
        description: 'Dual high-torque whisper-quiet motors, four digital memory presets, collision anti-pinch detection, and solid walnut veneer.',
        category: catMap['designer-ergonomics'],
        categoryName: 'Designer Ergonomics',
        brand: 'AeroForm',
        price: 36999,
        discount: 15,
        stock: 9, // low stock trigger
        minSafetyStock: 10,
        reorderPoint: 15,
        isFeatured: false,
        images: [
          'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=800&q=80',
        ],
        specifications: {
          'Height Range': '62 cm - 128 cm',
          'Motor Type': 'Dual Synchronized German Motors',
          'Load Capacity': '125 kg',
          'Top Material': 'Sustainable Hardwood Walnut',
        },
        tags: ['desk', 'standing-desk', 'ergonomic', 'workspace'],
        averageRating: 4.8,
        reviewCount: 22,
        salesCount: 64,
      },
      {
        name: 'Iris Smart 4K UHD Robotic Security Cam',
        description: '360° pan-tilt coverage, on-device neural edge person & pet detection, starlight color night vision, and end-to-end encrypted storage.',
        category: catMap['smart-living-iot'],
        categoryName: 'Smart Living & IoT',
        brand: 'IrisAI',
        price: 7499,
        discount: 25,
        stock: 52,
        minSafetyStock: 12,
        reorderPoint: 25,
        isFeatured: false,
        images: [
          'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
        ],
        specifications: {
          'Resolution': '3840 x 2160 (4K)',
          'Field of View': '360° Horizontal, 115° Vertical',
          'Audio': 'Two-way duplex with noise filtering',
          'Local Storage': 'MicroSD up to 512GB & NAS RTSP',
        },
        tags: ['security', 'smart-home', 'camera', 'ai'],
        averageRating: 4.4,
        reviewCount: 18,
        salesCount: 135,
      },
      {
        name: 'OmniDrive MagSpeed Ergonomic Wireless Mouse',
        description: 'Electromagnetic MagSpeed scroll wheel (1000 lines/sec), Darkfield 8000 DPI sensor tracks on glass, USB-C fast charging.',
        category: catMap['computing-ai-hardware'],
        categoryName: 'Computing & AI Hardware',
        brand: 'OmniTech',
        price: 6999,
        discount: 10,
        stock: 6, // critical reorder trigger!
        minSafetyStock: 10,
        reorderPoint: 18,
        isFeatured: false,
        images: [
          'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
        ],
        specifications: {
          'DPI Range': '200 to 8000 DPI',
          'Battery Life': 'Up to 70 days per charge',
          'Buttons': '7 customizable buttons + gesture button',
          'Weight': '141 grams',
        },
        tags: ['mouse', 'ergonomic', 'accessories', 'computing'],
        averageRating: 4.9,
        reviewCount: 45,
        salesCount: 210,
      },
    ];

    const insertedProducts = await Product.insertMany(productsData);
    console.log(`Seeded ${insertedProducts.length} products successfully!`);

    console.log('Seeding Customer Reviews with sentiment labels...');
    const reviewsData = [
      {
        product: insertedProducts[0]._id, // AeroPulse ANC
        user: customerUser._id,
        rating: 5,
        title: 'Phenomenal acoustic fidelity and comfort',
        comment: 'The noise cancellation is astounding. Flying with these completely blocked out engine rumble. The highs and mids are crisp and spatial audio is mind-blowing.',
        sentiment: 'Positive',
        sentimentScore: 0.94,
        sentimentConfidence: 0.96,
      },
      {
        product: insertedProducts[0]._id,
        user: customerUser2._id,
        rating: 4,
        title: 'Very solid headphones with great battery',
        comment: 'Battery lasted me nearly a week without plugging in. Sound quality is rich. The app could use a bit more EQ customization though.',
        sentiment: 'Positive',
        sentimentScore: 0.72,
        sentimentConfidence: 0.88,
      },
      {
        product: insertedProducts[2]._id, // QuantumBook
        user: customerUser._id,
        rating: 5,
        title: 'Dream developer machine',
        comment: 'Compiles multi-container Docker applications in seconds. The mini-LED screen is breathtaking for coding and HDR video editing. Zero fan noise during normal work.',
        sentiment: 'Positive',
        sentimentScore: 0.92,
        sentimentConfidence: 0.95,
      },
      {
        product: insertedProducts[9]._id, // OmniDrive Mouse
        user: customerUser2._id,
        rating: 5,
        title: 'Best ergonomic mouse on the market',
        comment: 'Saved my wrist from repetitive strain. The magnetic scroll wheel feels luxurious and works effortlessly on my glass dining table.',
        sentiment: 'Positive',
        sentimentScore: 0.89,
        sentimentConfidence: 0.93,
      },
      {
        product: insertedProducts[7]._id, // Sit-stand desk
        user: customerUser._id,
        rating: 3,
        title: 'Great motor, assembly instructions could be better',
        comment: 'The desk is rock solid and motors are silent. However the manual was confusing and took 2 hours to put together.',
        sentiment: 'Neutral',
        sentimentScore: 0.15,
        sentimentConfidence: 0.78,
      },
    ];

    await Review.insertMany(reviewsData);

    console.log('Seeding Sample Completed Orders...');
    const sampleOrder = await Order.create({
      user: customerUser._id,
      items: [
        {
          product: insertedProducts[0]._id,
          name: insertedProducts[0].name,
          quantity: 1,
          price: insertedProducts[0].finalPrice || 16149,
          image: insertedProducts[0].images[0],
        },
        {
          product: insertedProducts[9]._id,
          name: insertedProducts[9].name,
          quantity: 2,
          price: insertedProducts[9].finalPrice || 6299,
          image: insertedProducts[9].images[0],
        },
      ],
      totalAmount: 28747,
      shippingAddress: customerUser.address,
      razorpayOrderId: 'order_seed_demo_001',
      paymentStatus: 'Paid',
      orderStatus: 'Delivered',
      paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    });

    await Payment.create({
      user: customerUser._id,
      order: sampleOrder._id,
      razorpayOrderId: 'order_seed_demo_001',
      razorpayPaymentId: 'pay_seed_demo_001',
      razorpaySignature: 'sig_verified_demo_001',
      amount: 28747,
      currency: 'INR',
      status: 'captured',
    });

    console.log('Seeding Interaction Logs for ML Recommender...');
    const activitiesData = [
      { user: customerUser._id, product: insertedProducts[0]._id, action: 'VIEW' },
      { user: customerUser._id, product: insertedProducts[0]._id, action: 'ADD_TO_CART' },
      { user: customerUser._id, product: insertedProducts[0]._id, action: 'PURCHASE' },
      { user: customerUser._id, product: insertedProducts[1]._id, action: 'VIEW' },
      { user: customerUser._id, product: insertedProducts[2]._id, action: 'VIEW' },
      { user: customerUser._id, product: insertedProducts[9]._id, action: 'VIEW' },
      { user: customerUser._id, product: insertedProducts[9]._id, action: 'PURCHASE' },
      { user: customerUser2._id, product: insertedProducts[0]._id, action: 'VIEW' },
      { user: customerUser2._id, product: insertedProducts[4]._id, action: 'WISHLIST' },
      { user: customerUser2._id, product: insertedProducts[6]._id, action: 'VIEW' },
      { user: customerUser2._id, product: insertedProducts[7]._id, action: 'VIEW' },
    ];
    await UserActivity.insertMany(activitiesData);

    console.log('\n======================================================');
    console.log(' IntelliCart AI Database Seeded Successfully!');
    console.log(' Admin Credentials:   admin@intellicart.com / Admin@123456');
    console.log(' Customer Credentials: alex@example.com / Customer@123456');
    console.log(' Total Categories:   ', createdCategories.length);
    console.log(' Total Products:     ', insertedProducts.length);
    console.log(' Total Orders:        1 (Delivered & Verified)');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failure:', error);
    process.exit(1);
  }
};

seedDatabase();
