require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const UserActivity = require('../models/UserActivity');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/intellicart_ai';

const seedDatabase = async () => {
  try {
    console.log(`[Seed] Connecting to MongoDB: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI);
    console.log('[Seed] Database connected successfully.');

    // Clear existing collections
    console.log('[Seed] Wiping existing data...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Review.deleteMany({}),
      Order.deleteMany({}),
      Cart.deleteMany({}),
      UserActivity.deleteMany({}),
    ]);
    console.log('[Seed] Existing collections cleared.');

    // 1. Seed Users (1 Admin, 5 Demo Customers)
    console.log('[Seed] Creating Admin and 5 Demo Customers...');
    const users = await User.create([
      {
        name: 'System Administrator (Demo Admin)',
        email: 'admin@intellicart.com',
        password: process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123456',
        role: 'ADMIN',
        isActive: true,
        phone: '+91 98765 43210',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        address: {
          fullName: 'System Administrator',
          phone: '+91 98765 43210',
          addressLine1: '1 Tech Park Crescent, Suite 400',
          street: '1 Tech Park Crescent, Suite 400',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560100',
          country: 'India',
          isDefault: true,
        },
        addresses: [
          {
            fullName: 'System Administrator',
            phone: '+91 98765 43210',
            addressLine1: '1 Tech Park Crescent, Suite 400',
            street: '1 Tech Park Crescent, Suite 400',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560100',
            country: 'India',
            isDefault: true,
          },
        ],
      },
      {
        name: 'Demo Customer',
        email: 'customer@intellicart.com',
        password: 'Customer@123456',
        role: 'CUSTOMER',
        isActive: true,
        phone: '+91 98000 11223',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        address: {
          fullName: 'Demo Customer',
          phone: '+91 98000 11223',
          addressLine1: '100 Innovation Way, Whitefield',
          street: '100 Innovation Way, Whitefield',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560066',
          country: 'India',
          isDefault: true,
        },
        addresses: [
          {
            fullName: 'Demo Customer',
            phone: '+91 98000 11223',
            addressLine1: '100 Innovation Way, Whitefield',
            street: '100 Innovation Way, Whitefield',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560066',
            country: 'India',
            isDefault: true,
          },
        ],
      },
      {
        name: 'Alex Rivera',
        email: 'alex@example.com',
        password: 'Customer@123456',
        role: 'CUSTOMER',
        isActive: true,
        phone: '+91 91234 56789',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        address: {
          fullName: 'Alex Rivera',
          phone: '+91 91234 56789',
          addressLine1: '42 Silicon Avenue, Indiranagar',
          street: '42 Silicon Avenue, Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560038',
          country: 'India',
          isDefault: true,
        },
        addresses: [
          {
            fullName: 'Alex Rivera',
            phone: '+91 91234 56789',
            addressLine1: '42 Silicon Avenue, Indiranagar',
            street: '42 Silicon Avenue, Indiranagar',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560038',
            country: 'India',
            isDefault: true,
          },
        ],
      },
      {
        name: 'Priya Sharma',
        email: 'priya@example.com',
        password: 'Customer@123456',
        role: 'CUSTOMER',
        phone: '+91 98111 22334',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
        address: {
          street: '18 Hitech City Main Road, Madhapur',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500081',
          country: 'India',
        },
      },
      {
        name: 'Marcus Chen',
        email: 'marcus@example.com',
        password: 'Customer@123456',
        role: 'CUSTOMER',
        phone: '+91 97222 33445',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
        address: {
          street: '7B Bandra Kurla Complex',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400051',
          country: 'India',
        },
      },
      {
        name: 'Elena Rostova',
        email: 'elena@example.com',
        password: 'Customer@123456',
        role: 'CUSTOMER',
        phone: '+91 96333 44556',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
        address: {
          street: '104 Koregaon Park Lane 5',
          city: 'Pune',
          state: 'Maharashtra',
          postalCode: '411001',
          country: 'India',
        },
      },
      {
        name: 'David Kim',
        email: 'david@example.com',
        password: 'Customer@123456',
        role: 'CUSTOMER',
        phone: '+91 95444 55667',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
        address: {
          street: '55 Golf Course Road, Sector 54',
          city: 'Gurugram',
          state: 'Haryana',
          postalCode: '122002',
          country: 'India',
        },
      },
    ]);

    const adminUser = users[0];
    const customerUsers = users.slice(1);
    console.log(`[Seed] Created ${users.length} users (1 Admin, ${customerUsers.length} Customers).`);

    // 2. Seed Categories
    console.log('[Seed] Creating Categories...');
    const categoriesData = [
      {
        name: 'Audio & Acoustics',
        slug: 'audio',
        description: 'Studio monitors, spatial ANC headphones, and audiophile sound systems',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Laptops & Workstations',
        slug: 'computing',
        description: 'High-performance workstations, calibrated OLED notebooks, and 5K displays',
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Wearables & Health',
        slug: 'wearables',
        description: 'Titanium bio-sensor smartwatches, ECG monitors, and outdoor telemetry bands',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Smart Living & IoT',
        slug: 'smart-home',
        description: 'Matter-enabled ambient lighting, environmental hubs, and smart thermostats',
        image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Cameras & Optics',
        slug: 'cameras',
        description: 'Mirrorless cinema cameras, prime lenses, and gimbal stabilization rigs',
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Desk & Peripherals',
        slug: 'accessories',
        description: 'Custom mechanical keyboards, precision mice, and Qi2 MagSafe power stations',
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
      },
    ];

    const categories = await Category.create(categoriesData);
    const catMap = {};
    categories.forEach((c) => {
      catMap[c.slug] = c._id;
    });
    console.log(`[Seed] Created ${categories.length} categories.`);

    // 3. Seed Products (32 Realistic Products)
    console.log('[Seed] Creating 32 Products...');
    const productsData = [
      // AUDIO
      {
        name: 'AeroPulse ANC Pro Wireless Headphones',
        brand: 'AeroSound',
        category: catMap['audio'],
        categoryName: 'Audio & Acoustics',
        price: 24999,
        originalPrice: 28999,
        discountPercentage: 15,
        discount: 15,
        stock: 24,
        featured: true,
        trending: true,
        salesCount: 420,
        averageRating: 4.9,
        reviewCount: 184,
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'Engineered for audiophiles. AeroPulse ANC Pro features custom 40mm beryllium drivers, military-grade hybrid active noise cancellation (-42dB), and 48-hour continuous battery reserve.',
        specifications: { 'Driver': '40mm Beryllium', 'ANC': 'Hybrid -42dB', 'Battery': '48 Hours', 'Weight': '248g' },
        tags: ['audio', 'anc', 'headphones', 'wireless', 'beryllium'],
      },
      {
        name: 'SoundSphere Portable Hi-Fi 360 Speaker',
        brand: 'AeroSound',
        category: catMap['audio'],
        categoryName: 'Audio & Acoustics',
        price: 15499,
        originalPrice: 19499,
        discountPercentage: 20,
        discount: 20,
        stock: 35,
        featured: false,
        trending: true,
        salesCount: 510,
        averageRating: 4.7,
        reviewCount: 142,
        images: [
          'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=900&q=85',
          'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'Room-filling 360-degree acoustic fidelity with dual neodymium woofers, passive bass radiators, and IP67 waterproof enclosure.',
        specifications: { 'Power': '60W RMS', 'Waterproof': 'IP67 Submersible', 'Battery': '24 Hours' },
        tags: ['audio', 'speaker', 'bluetooth', 'waterproof'],
      },
      {
        name: 'PulseFlow Active Sport Earbuds',
        brand: 'AeroSound',
        category: catMap['audio'],
        categoryName: 'Audio & Acoustics',
        price: 9999,
        originalPrice: 12999,
        discountPercentage: 25,
        discount: 25,
        stock: 45,
        featured: false,
        trending: true,
        salesCount: 680,
        averageRating: 4.7,
        reviewCount: 160,
        images: [
          'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'Biometric sports earbuds featuring sweatproof IPX8 nano-coating, punchy graphene drivers, and in-ear optical heart rate monitoring.',
        specifications: { 'Driver': '11mm Graphene', 'Battery': '32 Hours with Case', 'Waterproof': 'IPX8' },
        tags: ['audio', 'earbuds', 'sport', 'ipx8'],
      },
      {
        name: 'Sonus Studio Reference Monitor Pair',
        brand: 'AeroSound',
        category: catMap['audio'],
        categoryName: 'Audio & Acoustics',
        price: 34999,
        originalPrice: 38999,
        discountPercentage: 10,
        discount: 10,
        stock: 12,
        featured: true,
        trending: false,
        salesCount: 95,
        averageRating: 4.9,
        reviewCount: 48,
        images: [
          'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'Calibrated bi-amplified near-field studio monitors for mixing and mastering engineers. Flat frequency response 38Hz - 24kHz.',
        specifications: { 'Amplifier': '140W Class-D', 'Woofer': '5.25" Kevlar', 'Inputs': 'XLR & Balanced TRS' },
        tags: ['audio', 'studio', 'monitors', 'reference'],
      },
      {
        name: 'VocalPro USB-C Studio Condenser Mic',
        brand: 'AeroSound',
        category: catMap['audio'],
        categoryName: 'Audio & Acoustics',
        price: 12499,
        originalPrice: 14999,
        discountPercentage: 16,
        discount: 16,
        stock: 28,
        featured: false,
        trending: false,
        salesCount: 220,
        averageRating: 4.8,
        reviewCount: 76,
        images: [
          'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=85',
        ],
        description: '24-bit/192kHz broadcast condenser microphone with switchable cardioid and omni polar patterns and internal pop filter.',
        specifications: { 'Capsule': '25mm Gold-Sputtered', 'Sample Rate': '192kHz / 24-bit' },
        tags: ['audio', 'microphone', 'podcast', 'streaming'],
      },

      // COMPUTING
      {
        name: 'QuantumBook Edge 16 OLED Workstation',
        brand: 'Novacore',
        category: catMap['computing'],
        categoryName: 'Laptops & Workstations',
        price: 149999,
        originalPrice: 164999,
        discountPercentage: 10,
        discount: 10,
        stock: 15,
        featured: true,
        trending: true,
        salesCount: 160,
        averageRating: 4.8,
        reviewCount: 92,
        images: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=85',
          'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'Workstation power in a 14mm unibody chassis. 3.2K 120Hz Calibrated OLED panel, 16-Core Neural matrix processor, and 32GB Unified RAM.',
        specifications: { 'CPU': '16-Core Neural Engine', 'RAM': '32GB LPDDR5X', 'SSD': '1TB NVMe', 'Display': '16" 3.2K 120Hz OLED' },
        tags: ['computing', 'laptop', 'workstation', 'oled'],
      },
      {
        name: 'Horizon Studio 27" 5K Retina Monitor',
        brand: 'Novacore',
        category: catMap['computing'],
        categoryName: 'Laptops & Workstations',
        price: 89999,
        originalPrice: 99999,
        discountPercentage: 8,
        discount: 8,
        stock: 18,
        featured: true,
        trending: true,
        salesCount: 140,
        averageRating: 4.8,
        reviewCount: 64,
        images: [
          'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'Pixel-perfect 5120x2880 clarity with 96W Thunderbolt 4 host charging, 600 nits constant luminance, and calibrated 100% DCI-P3.',
        specifications: { 'Resolution': '5120 x 2880 (218 PPI)', 'Brightness': '600 nits', 'Ports': 'Thunderbolt 4 + 3x USB-C' },
        tags: ['computing', 'monitor', '5k', 'thunderbolt'],
      },
      {
        name: 'MatrixMini M4 Compact Creator PC',
        brand: 'Novacore',
        category: catMap['computing'],
        categoryName: 'Laptops & Workstations',
        price: 74999,
        originalPrice: 79999,
        discountPercentage: 6,
        discount: 6,
        stock: 20,
        featured: false,
        trending: true,
        salesCount: 230,
        averageRating: 4.7,
        reviewCount: 88,
        images: [
          'https://images.unsplash.com/photo-1547394765-185e13174149?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'Silent mini workstation measuring just 5 inches square. Powers triple 4K monitors effortlessly with whisper-quiet magnetic levitation fans.',
        specifications: { 'RAM': '24GB Unified', 'Storage': '512GB PCIe 4.0 SSD', 'Weight': '680g' },
        tags: ['computing', 'desktop', 'mini', 'creator'],
      },
      {
        name: 'ThunderDock Ultra 14-in-1 Hub',
        brand: 'Novacore',
        category: catMap['computing'],
        categoryName: 'Laptops & Workstations',
        price: 18999,
        originalPrice: 22999,
        discountPercentage: 17,
        discount: 17,
        stock: 30,
        featured: false,
        trending: false,
        salesCount: 310,
        averageRating: 4.9,
        reviewCount: 110,
        images: [
          'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'Single-cable connectivity hub with dual 4K 144Hz HDMI outputs, UHS-II SD card readers, 2.5GbE Ethernet, and 100W PD passthrough.',
        specifications: { 'Speed': '40Gbps Thunderbolt 4', 'Power Delivery': '100W Host Charge' },
        tags: ['computing', 'dock', 'thunderbolt', 'hub'],
      },

      // WEARABLES
      {
        name: 'Vanguard Titan GPS Smartwatch',
        brand: 'Chronos',
        category: catMap['wearables'],
        categoryName: 'Wearables & Health',
        price: 32999,
        originalPrice: 39999,
        discountPercentage: 18,
        discount: 18,
        stock: 22,
        featured: true,
        trending: true,
        salesCount: 650,
        averageRating: 4.7,
        reviewCount: 230,
        images: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85',
          'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'Forged Grade 5 aerospace titanium smartwatch with unbreakable sapphire crystal, dual-frequency GNSS navigation, and clinical ECG sensors.',
        specifications: { 'Case': 'Grade 5 Titanium', 'Water Resistance': '10 ATM (100m)', 'Battery': '14 Days' },
        tags: ['wearables', 'smartwatch', 'titanium', 'ecg', 'gps'],
      },
      {
        name: 'AuraRing BioTelemetry Smart Ring',
        brand: 'Chronos',
        category: catMap['wearables'],
        categoryName: 'Wearables & Health',
        price: 21999,
        originalPrice: 24999,
        discountPercentage: 12,
        discount: 12,
        stock: 16,
        featured: true,
        trending: true,
        salesCount: 380,
        averageRating: 4.8,
        reviewCount: 140,
        images: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'Ultralight titanium ring weighing just 4 grams. Tracks sleep stages, body temperature variations, cardiovascular recovery, and stress.',
        specifications: { 'Material': 'Titanium PVD', 'Sensors': 'Infrared PPG, Temp, 3D Accelerometer', 'Battery': '7 Days' },
        tags: ['wearables', 'ring', 'sleep', 'biometrics'],
      },
      {
        name: 'PulseBand Sport GPS Band',
        brand: 'Chronos',
        category: catMap['wearables'],
        categoryName: 'Wearables & Health',
        price: 6999,
        originalPrice: 8999,
        discountPercentage: 22,
        discount: 22,
        stock: 40,
        featured: false,
        trending: false,
        salesCount: 750,
        averageRating: 4.6,
        reviewCount: 190,
        images: [
          'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'Slimline fitness band with bright AMOLED display, 100+ workout telemetry modes, continuous SpO2 monitoring, and 5 ATM water resistance.',
        specifications: { 'Display': '1.1" AMOLED', 'Battery': '10 Days', 'Weight': '22g' },
        tags: ['wearables', 'fitness', 'band', 'tracker'],
      },
      {
        name: 'Apex Horizon Diving Dive Watch',
        brand: 'Chronos',
        category: catMap['wearables'],
        categoryName: 'Wearables & Health',
        price: 49999,
        originalPrice: 54999,
        discountPercentage: 9,
        discount: 9,
        stock: 8,
        featured: false,
        trending: false,
        salesCount: 65,
        averageRating: 4.9,
        reviewCount: 32,
        images: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'Certified EN13319 professional dive computer in a sleek titanium smartwatch format. Depth gauge accurate to 100 meters with dive logs.',
        specifications: { 'Rating': 'EN13319 100m Dive', 'Screen': '1.5" LTPO Sapphire' },
        tags: ['wearables', 'dive', 'smartwatch', 'titanium'],
      },

      // SMART HOME
      {
        name: 'Lumix Aurora Matter Ambient Smart Lamp',
        brand: 'Aether',
        category: catMap['smart-home'],
        categoryName: 'Smart Living & IoT',
        price: 8499,
        originalPrice: 8499,
        discountPercentage: 0,
        discount: 0,
        stock: 25,
        featured: false,
        trending: true,
        salesCount: 310,
        averageRating: 4.8,
        reviewCount: 78,
        images: [
          'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'Circadian lighting lamp synchronizing with local daylight cycles. Matter-over-Thread connectivity and capacitive touch dimming base.',
        specifications: { 'Brightness': '1200 Lumens', 'Color Temp': '1800K - 6500K', 'Protocol': 'Matter / Thread' },
        tags: ['smart-home', 'lighting', 'matter', 'lamp'],
      },
      {
        name: 'NestSense Matter Smart Thermostat Hub',
        brand: 'Aether',
        category: catMap['smart-home'],
        categoryName: 'Smart Living & IoT',
        price: 13999,
        originalPrice: 16499,
        discountPercentage: 15,
        discount: 15,
        stock: 14,
        featured: false,
        trending: false,
        salesCount: 290,
        averageRating: 4.6,
        reviewCount: 88,
        images: [
          'https://images.unsplash.com/photo-1567928815104-b7980ee5032e?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'Polished stainless steel smart thermostat equipped with mmWave presence sensing and machine-learning schedule optimization.',
        specifications: { 'Display': '2.1" Circular IPS', 'Sensors': 'Radar mmWave, Temp, Humidity' },
        tags: ['smart-home', 'thermostat', 'matter', 'energy'],
      },
      {
        name: 'Aether Vision 4K HDR Smart Security Hub',
        brand: 'Aether',
        category: catMap['smart-home'],
        categoryName: 'Smart Living & IoT',
        price: 16999,
        originalPrice: 19999,
        discountPercentage: 15,
        discount: 15,
        stock: 22,
        featured: true,
        trending: false,
        salesCount: 180,
        averageRating: 4.8,
        reviewCount: 65,
        images: [
          'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'End-to-end encrypted 4K HDR home security camera with on-device AI person/package recognition and local encrypted microSD backup.',
        specifications: { 'Resolution': '4K HDR with Color Night Vision', 'FOV': '160-degree Wide' },
        tags: ['smart-home', 'security', 'camera', 'matter'],
      },
      {
        name: 'BreezePure HEPA Air Quality Purifier',
        brand: 'Aether',
        category: catMap['smart-home'],
        categoryName: 'Smart Living & IoT',
        price: 17499,
        originalPrice: 19999,
        discountPercentage: 12,
        discount: 12,
        stock: 19,
        featured: false,
        trending: true,
        salesCount: 340,
        averageRating: 4.9,
        reviewCount: 112,
        images: [
          'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'Medical-grade H13 True HEPA filter capturing 99.97% of airborne PM2.5 particulates with real-time laser laser sensor telemetry.',
        specifications: { 'CADR': '400 m3/h', 'Room Size': 'Up to 500 sq ft', 'Noise': 'Silent 21dB' },
        tags: ['smart-home', 'air-purifier', 'hepa', 'health'],
      },
      {
        name: 'Matter Smart Bridge & Zigbee Gateway',
        brand: 'Aether',
        category: catMap['smart-home'],
        categoryName: 'Smart Living & IoT',
        price: 4999,
        originalPrice: 5999,
        discountPercentage: 16,
        discount: 16,
        stock: 50,
        featured: false,
        trending: false,
        salesCount: 520,
        averageRating: 4.7,
        reviewCount: 130,
        images: [
          'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'Unifies Thread, Zigbee 3.0, and BLE devices into a single Matter ecosystem for Apple Home, Google Home, and Home Assistant.',
        specifications: { 'Radios': 'Thread, Zigbee 3.0, Wi-Fi 6', 'Range': '100m' },
        tags: ['smart-home', 'hub', 'gateway', 'matter'],
      },

      // CAMERAS
      {
        name: 'CineOptic X90 Full-Frame Cinema Camera',
        brand: 'OpticVue',
        category: catMap['cameras'],
        categoryName: 'Cameras & Optics',
        price: 219999,
        originalPrice: 234999,
        discountPercentage: 5,
        discount: 5,
        stock: 5,
        featured: true,
        trending: false,
        salesCount: 80,
        averageRating: 4.9,
        reviewCount: 42,
        images: [
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=85',
        ],
        description: '24.5MP Back-Illuminated full-frame cinema sensor with 6K 60fps ProRes RAW internal recording, 16+ stops dynamic range, and dual native ISO.',
        specifications: { 'Sensor': 'Full-Frame BSI CMOS', 'Video': '6K ProRes RAW / 4K 120p', 'IBIS': '5-Axis 7 Stops' },
        tags: ['cameras', 'cinema', 'raw', '4k', '6k'],
      },
      {
        name: 'OpticVue 50mm f/1.2 Creator Prime Lens',
        brand: 'OpticVue',
        category: catMap['cameras'],
        categoryName: 'Cameras & Optics',
        price: 84999,
        originalPrice: 94999,
        discountPercentage: 10,
        discount: 10,
        stock: 11,
        featured: false,
        trending: true,
        salesCount: 110,
        averageRating: 4.9,
        reviewCount: 54,
        images: [
          'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'Dreamy bokeh and corner-to-corner sharpness wide open at f/1.2. Features dual linear autofocus motors and weather sealing.',
        specifications: { 'Aperture': 'f/1.2 - f/16', 'Blades': '11-Blade Circular', 'Filter': '77mm' },
        tags: ['cameras', 'lens', 'prime', 'portrait'],
      },
      {
        name: 'ProGimbal Carbon 3-Axis Stabilizer',
        brand: 'OpticVue',
        category: catMap['cameras'],
        categoryName: 'Cameras & Optics',
        price: 34999,
        originalPrice: 39999,
        discountPercentage: 12,
        discount: 12,
        stock: 18,
        featured: false,
        trending: false,
        salesCount: 160,
        averageRating: 4.8,
        reviewCount: 72,
        images: [
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'Lightweight carbon fiber gimbal carrying payloads up to 4.5kg. Automated axis locks and OLED touch screen control dial.',
        specifications: { 'Payload': '4.5kg Max', 'Battery': '12 Hours', 'Weight': '1.3kg Carbon' },
        tags: ['cameras', 'gimbal', 'stabilizer', 'video'],
      },
      {
        name: 'OpticVue 24-70mm f/2.8 Constant Zoom',
        brand: 'OpticVue',
        category: catMap['cameras'],
        categoryName: 'Cameras & Optics',
        price: 114999,
        originalPrice: 124999,
        discountPercentage: 8,
        discount: 8,
        stock: 9,
        featured: false,
        trending: false,
        salesCount: 95,
        averageRating: 4.8,
        reviewCount: 45,
        images: [
          'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'The standard zoom workhorse for editorial, wedding, and documentary cinematography. Nano AR coating reduces flare.',
        specifications: { 'Focal Length': '24-70mm', 'Aperture': 'Constant f/2.8', 'Weight': '820g' },
        tags: ['cameras', 'lens', 'zoom', 'workhorse'],
      },

      // PERIPHERALS & ACCESSORIES
      {
        name: 'Apex Precision Mechanical Keyboard 75%',
        brand: 'Keychronx',
        category: catMap['accessories'],
        categoryName: 'Desk & Peripherals',
        price: 11999,
        originalPrice: 13999,
        discountPercentage: 12,
        discount: 12,
        stock: 25,
        featured: true,
        trending: true,
        salesCount: 890,
        averageRating: 4.9,
        reviewCount: 315,
        images: [
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'Gasket-mounted CNC aluminum keyboard with south-facing RGB, hot-swappable sockets, and pre-lubricated linear switches for deep acoustics.',
        specifications: { 'Layout': '75% (81 Keys)', 'Plate': 'FR4 & Poron Foam', 'Battery': '4000 mAh' },
        tags: ['accessories', 'keyboard', 'mechanical', 'custom'],
      },
      {
        name: 'ErgoGlide Master Precision Wireless Mouse',
        brand: 'LogiCraft',
        category: catMap['accessories'],
        categoryName: 'Desk & Peripherals',
        price: 7999,
        originalPrice: 8999,
        discountPercentage: 10,
        discount: 10,
        stock: 35,
        featured: false,
        trending: true,
        salesCount: 1200,
        averageRating: 4.9,
        reviewCount: 420,
        images: [
          'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'Ergonomic mouse with MagSpeed electromagnetic wheel that scrolls 1,000 lines per second. Tracks on glass with 8K DPI Darkfield sensor.',
        specifications: { 'DPI': '200 - 8,000', 'Battery': '70 Days per charge', 'Buttons': '7 Programmable' },
        tags: ['accessories', 'mouse', 'wireless', 'ergonomic'],
      },
      {
        name: 'Titanium Loop MagSafe Power Station 3-in-1',
        brand: 'LogiCraft',
        category: catMap['accessories'],
        categoryName: 'Desk & Peripherals',
        price: 8999,
        originalPrice: 9999,
        discountPercentage: 10,
        discount: 10,
        stock: 20,
        featured: false,
        trending: false,
        salesCount: 440,
        averageRating: 4.8,
        reviewCount: 98,
        images: [
          'https://images.unsplash.com/photo-1622445268462-3485efbdd876?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'Solid aluminum and leather Qi2 certified fast-charging tree. Simultaneously fast charges smartphone at 15W, smartwatch, and AirPods.',
        specifications: { 'Standard': 'Qi2 Certified 15W', 'Adapter': '45W USB-C PD included' },
        tags: ['accessories', 'charging', 'magsafe', 'qi2'],
      },
      {
        name: 'Apex Studio Desk Mat Wool Felt Large',
        brand: 'Keychronx',
        category: catMap['accessories'],
        categoryName: 'Desk & Peripherals',
        price: 2999,
        originalPrice: 3499,
        discountPercentage: 14,
        discount: 14,
        stock: 60,
        featured: false,
        trending: false,
        salesCount: 620,
        averageRating: 4.8,
        reviewCount: 155,
        images: [
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'Premium Australian merino wool felt desk pad with anti-slip silicone backing. Soft acoustic dampening for keyboards and laptops.',
        specifications: { 'Dimensions': '900mm x 400mm x 4mm', 'Material': 'Merino Wool Felt' },
        tags: ['accessories', 'deskmat', 'wool', 'workspace'],
      },
      {
        name: 'AeroArm Pro Heavy-Duty Monitor Arm',
        brand: 'LogiCraft',
        category: catMap['accessories'],
        categoryName: 'Desk & Peripherals',
        price: 10999,
        originalPrice: 12999,
        discountPercentage: 15,
        discount: 15,
        stock: 15,
        featured: false,
        trending: false,
        salesCount: 180,
        averageRating: 4.9,
        reviewCount: 65,
        images: [
          'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'Gas-spring counterbalanced aluminum monitor arm supporting displays up to 49" ultrawide (16kg). Integrated cable management tracks.',
        specifications: { 'VESA': '75x75 & 100x100', 'Max Weight': '16kg' },
        tags: ['accessories', 'monitor-arm', 'vesa', 'desk'],
      },
      {
        name: 'ProClick Numeric Keypad Wireless',
        brand: 'Keychronx',
        category: catMap['accessories'],
        categoryName: 'Desk & Peripherals',
        price: 3999,
        originalPrice: 4499,
        discountPercentage: 11,
        discount: 11,
        stock: 25,
        featured: false,
        trending: false,
        salesCount: 140,
        averageRating: 4.7,
        reviewCount: 50,
        images: [
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'Compact wireless numpad matching 75% mechanical keyboards. Machined aluminum body with Bluetooth 5.1 and Type-C.',
        specifications: { 'Keys': '21-Key Numpad', 'Switch': 'Hot-Swap Mechanical' },
        tags: ['accessories', 'numpad', 'keyboard'],
      },
      {
        name: 'NovaCore 100W GaN Fast Wall Charger',
        brand: 'Novacore',
        category: catMap['accessories'],
        categoryName: 'Desk & Peripherals',
        price: 4499,
        originalPrice: 4999,
        discountPercentage: 10,
        discount: 10,
        stock: 55,
        featured: false,
        trending: true,
        salesCount: 880,
        averageRating: 4.9,
        reviewCount: 290,
        images: [
          'https://images.unsplash.com/photo-1622445268462-3485efbdd876?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'Gallium Nitride 100W wall adapter smaller than a credit card. Features 3x USB-C and 1x USB-A with intelligent dynamic power distribution.',
        specifications: { 'Power': '100W Max', 'Tech': 'GaN III Architecture' },
        tags: ['accessories', 'charger', 'gan', 'fast-charge'],
      },
      {
        name: 'AeroPulse Lambskin Replacement Ear Cushions',
        brand: 'AeroSound',
        category: catMap['audio'],
        categoryName: 'Audio & Acoustics',
        price: 3499,
        originalPrice: 3999,
        discountPercentage: 12,
        discount: 12,
        stock: 30,
        featured: false,
        trending: false,
        salesCount: 130,
        averageRating: 4.8,
        reviewCount: 40,
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'Magnetic snap-on replacement ear cushions for AeroPulse ANC Pro made with genuine soft Italian lambskin and cooling gel memory foam.',
        specifications: { 'Material': 'Italian Lambskin & Gel Memory Foam' },
        tags: ['audio', 'accessories', 'cushions', 'earpads'],
      },
      {
        name: 'Chronos Titanium Link Watch Bracelet',
        brand: 'Chronos',
        category: catMap['wearables'],
        categoryName: 'Wearables & Health',
        price: 8999,
        originalPrice: 9999,
        discountPercentage: 10,
        discount: 10,
        stock: 14,
        featured: false,
        trending: false,
        salesCount: 90,
        averageRating: 4.9,
        reviewCount: 35,
        images: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85',
        ],
        description: 'Quick-release Grade 5 titanium link bracelet with micro-adjustment butterfly deployant clasp. Fits Vanguard Titan and standard 22mm lugs.',
        specifications: { 'Lug Width': '22mm', 'Material': 'Grade 5 Titanium' },
        tags: ['wearables', 'strap', 'titanium', 'bracelet'],
      },
    ];

    const products = await Product.create(productsData);
    console.log(`[Seed] Created ${products.length} products.`);

    // 4. Update category productCount
    for (const cat of categories) {
      const count = await Product.countDocuments({ category: cat._id });
      await Category.findByIdAndUpdate(cat._id, { productCount: count });
    }
    console.log('[Seed] Updated category product counts.');

    // 5. Seed Reviews
    console.log('[Seed] Creating Customer Reviews...');
    const reviewsData = [
      {
        product: products[0]._id, // AeroPulse Pro
        user: customerUsers[0]._id, // Alex
        rating: 5,
        title: 'Benchmark studio tuning in consumer wireless headphones',
        comment: 'The beryllium transient separation is remarkable. Vocal articulation is crystal clear and ANC completely silences airline engine rumble without nausea.',
        sentiment: 'Positive',
        sentimentScore: 0.95,
        verifiedPurchase: true,
      },
      {
        product: products[0]._id,
        user: customerUsers[1]._id, // Priya
        rating: 5,
        title: 'Flawless Bluetooth multipoint stability',
        comment: 'Instant handoff between my MacBook Pro and iPhone. Battery lasts an entire week of continuous Zoom calls and Spotify.',
        sentiment: 'Positive',
        sentimentScore: 0.92,
        verifiedPurchase: true,
      },
      {
        product: products[0]._id,
        user: customerUsers[2]._id, // Marcus
        rating: 4,
        title: 'Outstanding acoustic comfort',
        comment: 'Headband weight distribution is superb for 8+ hour coding stretches. Only wish the hard shell travel case was slightly slimmer.',
        sentiment: 'Positive',
        sentimentScore: 0.82,
        verifiedPurchase: true,
      },
      {
        product: products[5]._id, // QuantumBook Edge
        user: customerUsers[3]._id, // Elena
        rating: 5,
        title: 'The best creator display on the market',
        comment: '3.2K OLED 120Hz is stunning for color grading in DaVinci Resolve. The vapor chamber thermals keep it whisper-quiet under heavy load.',
        sentiment: 'Positive',
        sentimentScore: 0.96,
        verifiedPurchase: true,
      },
      {
        product: products[9]._id, // Vanguard Titan
        user: customerUsers[4]._id, // David
        rating: 5,
        title: 'Indestructible titanium build and accurate dual-band GPS',
        comment: 'Ran a 50k ultra marathon in heavy rainfall. GPS elevation tracks were accurate down to the meter. Battery only dropped 18% all day.',
        sentiment: 'Positive',
        sentimentScore: 0.94,
        verifiedPurchase: true,
      },
      {
        product: products[22]._id, // Apex Mechanical Keyboard
        user: customerUsers[0]._id, // Alex
        rating: 5,
        title: 'The acoustic thock is intoxicating',
        comment: 'Gasket mounting and acoustic foam make typing feel soft yet crisp. South-facing RGB and pre-lubed switches right out of the box.',
        sentiment: 'Positive',
        sentimentScore: 0.98,
        verifiedPurchase: true,
      },
    ];

    await Review.create(reviewsData);
    // Recalculate averages
    for (const p of products) {
      await Review.getAverageRating(p._id);
    }
    console.log(`[Seed] Created ${reviewsData.length} reviews and recalculated product ratings.`);

    // 6. Seed Sample Orders
    console.log('[Seed] Creating Sample Orders...');
    const ordersData = [
      {
        user: customerUsers[0]._id,
        userId: customerUsers[0]._id,
        items: [
          {
            product: products[0]._id,
            productId: products[0]._id,
            name: products[0].name,
            quantity: 1,
            price: 21249,
            image: products[0].thumbnail,
          },
          {
            product: products[23]._id,
            productId: products[23]._id,
            name: products[23].name,
            quantity: 1,
            price: 7199,
            image: products[23].thumbnail,
          },
        ],
        shippingAddress: customerUsers[0].address,
        subtotal: 28448,
        shippingFee: 0,
        discount: 0,
        totalAmount: 28448,
        paymentStatus: 'PAID',
        orderStatus: 'DELIVERED',
        paidAt: new Date(Date.now() - 7 * 86400000),
        deliveredAt: new Date(Date.now() - 5 * 86400000),
      },
      {
        user: customerUsers[1]._id,
        userId: customerUsers[1]._id,
        items: [
          {
            product: products[9]._id, // Vanguard Titan
            productId: products[9]._id,
            name: products[9].name,
            quantity: 1,
            price: 27059,
            image: products[9].thumbnail,
          },
        ],
        shippingAddress: customerUsers[1].address,
        subtotal: 27059,
        shippingFee: 0,
        discount: 0,
        totalAmount: 27059,
        paymentStatus: 'PAID',
        orderStatus: 'SHIPPED',
        paidAt: new Date(Date.now() - 2 * 86400000),
      },
      {
        user: customerUsers[2]._id,
        userId: customerUsers[2]._id,
        items: [
          {
            product: products[22]._id, // Keyboard
            productId: products[22]._id,
            name: products[22].name,
            quantity: 1,
            price: 10559,
            image: products[22].thumbnail,
          },
        ],
        shippingAddress: customerUsers[2].address,
        subtotal: 10559,
        shippingFee: 0,
        discount: 0,
        totalAmount: 10559,
        paymentStatus: 'PAID',
        orderStatus: 'CONFIRMED',
        paidAt: new Date(Date.now() - 12 * 3600000),
      },
    ];

    await Order.create(ordersData);
    console.log(`[Seed] Created ${ordersData.length} sample orders.`);

    // 7. Seed Sample User Activity Telemetry
    console.log('[Seed] Creating User Activity Telemetry...');
    const activities = [
      { user: customerUsers[0]._id, product: products[0]._id, action: 'VIEW_PRODUCT', metadata: { source: 'hero_carousel' } },
      { user: customerUsers[0]._id, product: products[0]._id, action: 'ADD_TO_CART', metadata: { qty: 1 } },
      { user: customerUsers[0]._id, product: products[0]._id, action: 'PURCHASE', metadata: { orderTotal: 28448 } },
      { user: customerUsers[1]._id, product: products[9]._id, action: 'VIEW_PRODUCT', metadata: { source: 'category_filter' } },
      { user: customerUsers[1]._id, product: products[9]._id, action: 'WISHLIST', metadata: {} },
      { user: customerUsers[1]._id, product: products[9]._id, action: 'PURCHASE', metadata: { orderTotal: 27059 } },
      { user: customerUsers[2]._id, product: products[22]._id, action: 'SEARCH', metadata: { query: 'mechanical keyboard' } },
      { user: customerUsers[2]._id, product: products[22]._id, action: 'VIEW_PRODUCT', metadata: { source: 'search' } },
      { user: customerUsers[2]._id, product: products[22]._id, action: 'ADD_TO_CART', metadata: { qty: 1 } },
      { user: customerUsers[3]._id, product: products[5]._id, action: 'VIEW_PRODUCT', metadata: { source: 'featured_innovations' } },
      { user: customerUsers[4]._id, product: products[10]._id, action: 'VIEW_PRODUCT', metadata: { source: 'recommendations' } },
    ];

    await UserActivity.create(activities);
    console.log(`[Seed] Logged ${activities.length} telemetry interactions.`);

    // 8. Attach sample items to Alex's wishlist
    await User.findByIdAndUpdate(customerUsers[0]._id, {
      wishlist: [products[0]._id, products[5]._id],
    });
    console.log("[Seed] Updated Alex's demo wishlist.");

    console.log('========================================================');
    console.log('✅ INTELLICART DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('Admin Account:    admin@intellicart.com / Admin@123456');
    console.log('Customer Account: alex@example.com / Customer@123456');
    console.log('Total Products:   ', products.length);
    console.log('Total Categories: ', categories.length);
    console.log('Total Users:      ', users.length);
    console.log('========================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDatabase();
