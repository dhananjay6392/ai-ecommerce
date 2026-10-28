const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');

describe('IntelliCart Production Backend Test Suite (Step 2)', () => {
  let customerToken;
  let adminToken;
  let sampleProduct;
  let sampleCategory;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/intellicart_ai');
    }

    sampleCategory = await Category.findOne();
    sampleProduct = await Product.findOne();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // 1. REGISTER
  describe('1. Registration & Authentication', () => {
    const testEmail = `testuser_${Date.now()}@example.com`;

    it('should register a new customer account', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Unit Test Customer',
          email: testEmail,
          password: 'Password@123',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
    });

    it('should reject registration with duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate User',
          email: testEmail,
          password: 'Password@123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should login customer with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex@example.com',
          password: 'Customer@123456',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      customerToken = res.body.token;
    });

    it('should reject invalid login password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex@example.com',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should login admin with admin credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@intellicart.com',
          password: 'Admin@123456',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role.toUpperCase()).toBe('ADMIN');
      adminToken = res.body.token;
    });

    it('should return profile on GET /api/auth/me for authenticated user', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('alex@example.com');
    });

    it('should reject unauthenticated request on protected route', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // 2. AUTHORIZATION & ADMIN ACCESS
  describe('2. Role-Based Authorization', () => {
    it('should forbid customer from accessing admin product creation', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Forbidden Hack Device',
          description: 'Testing RBAC',
          brand: 'Unauthorized',
          category: sampleCategory._id,
          price: 9999,
          stock: 10,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should forbid customer from accessing admin order list', async () => {
      const res = await request(app)
        .get('/api/orders/admin')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow admin to access admin order list', async () => {
      const res = await request(app)
        .get('/api/orders/admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.orders)).toBe(true);
    });
  });

  // 3. PRODUCT CRUD & FILTERING
  describe('3. Product APIs & Filtering', () => {
    let createdProductId;

    it('should get all products with pagination structure', async () => {
      const res = await request(app).get('/api/products?page=1&limit=5');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(5);
    });

    it('should filter products by search term', async () => {
      const res = await request(app).get('/api/products?search=Titanium');
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBeGreaterThan(0);
    });

    it('should filter products by price range', async () => {
      const res = await request(app).get('/api/products?minPrice=10000&maxPrice=50000');
      expect(res.status).toBe(200);
      res.body.products.forEach((p) => {
        expect(p.price).toBeGreaterThanOrEqual(10000);
        expect(p.price).toBeLessThanOrEqual(50000);
      });
    });

    it('should get single product by ID', async () => {
      const res = await request(app).get(`/api/products/${sampleProduct._id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.product._id.toString()).toBe(sampleProduct._id.toString());
    });

    it('should handle invalid product ID gracefully with 404', async () => {
      const res = await request(app).get('/api/products/000000000000000000000000');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should allow admin to create a new product', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Unit Test Mechanical Switch Pack',
          description: 'Pack of 35 factory lubed linear switches',
          brand: 'Keychronx',
          category: sampleCategory._id,
          price: 1899,
          stock: 50,
          featured: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.product.name).toBe('Unit Test Mechanical Switch Pack');
      createdProductId = res.body.product._id;
    });

    it('should allow admin to update a product', async () => {
      const res = await request(app)
        .put(`/api/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 1699, stock: 45 });

      expect(res.status).toBe(200);
      expect(res.body.product.price).toBe(1699);
      expect(res.body.product.stock).toBe(45);
    });

    it('should allow admin to delete a product', async () => {
      const res = await request(app)
        .delete(`/api/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // 4. CART & INVENTORY VALIDATION
  describe('4. Cart Management & Stock Guard', () => {
    it('should fetch user cart', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.cart).toBeDefined();
    });

    it('should add available product to cart', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: sampleProduct._id, quantity: 1 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject adding quantity exceeding available inventory stock', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: sampleProduct._id, quantity: 99999 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/inventory|stock/i);
    });
  });

  // 5. WISHLIST & DUPLICATE PREVENTION
  describe('5. Wishlist Management', () => {
    it('should fetch wishlist', async () => {
      const res = await request(app)
        .get('/api/wishlist')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.wishlist)).toBe(true);
    });

    it('should add product to wishlist', async () => {
      // Find a product not yet in wishlist
      const user = await User.findOne({ email: 'alex@example.com' });
      const availableProd = await Product.findOne({ _id: { $nin: user.wishlist } });

      const res = await request(app)
        .post(`/api/wishlist/${availableProd._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should prevent adding duplicate items to wishlist', async () => {
      const user = await User.findOne({ email: 'alex@example.com' });
      const wishlistedId = user.wishlist[0];

      const res = await request(app)
        .post(`/api/wishlist/${wishlistedId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already/i);
    });

    it('should remove product from wishlist', async () => {
      const user = await User.findOne({ email: 'alex@example.com' });
      const wishlistedId = user.wishlist[0];

      const res = await request(app)
        .delete(`/api/wishlist/${wishlistedId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // 6. ORDER CREATION
  describe('6. Orders & Server-Side Total Calculation', () => {
    it('should create order and calculate totals on backend', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ productId: sampleProduct._id, quantity: 1 }],
          shippingAddress: {
            street: '123 Test Boulevard',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560001',
            country: 'India',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.order.totalAmount).toBeGreaterThan(0);
      expect(res.body.order.orderStatus.toUpperCase()).toBe('PENDING');
    });

    it('should retrieve customer order history', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.orders.length).toBeGreaterThan(0);
    });
  });

  // 7. REVIEWS & RATING RECALCULATION
  describe('7. Customer Reviews & Average Rating', () => {
    it('should fetch reviews for a product', async () => {
      const res = await request(app).get(`/api/products/${sampleProduct._id}/reviews`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.sentimentStats).toBeDefined();
    });

    it('should allow customer to submit a review', async () => {
      // Find another customer who hasn't reviewed sampleProduct yet
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'marcus@example.com', password: 'Customer@123456' });

      const marcusToken = loginRes.body.token;

      // Delete any prior review from marcus on sampleProduct
      await mongoose.model('Review').deleteOne({ product: sampleProduct._id, user: loginRes.body.user.id });

      const res = await request(app)
        .post(`/api/products/${sampleProduct._id}/reviews`)
        .set('Authorization', `Bearer ${marcusToken}`)
        .send({
          rating: 5,
          title: 'Top Tier Hardware Performance',
          comment: 'Exceeded all expectations in endurance and acoustics.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.review.rating).toBe(5);
    });
  });

  // 8. USER ACTIVITY TELEMETRY
  describe('8. User Activity Telemetry', () => {
    it('should record user interaction telemetry', async () => {
      const res = await request(app)
        .post('/api/activity')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: sampleProduct._id,
          action: 'VIEW_PRODUCT',
          metadata: { page: 'product_detail', duration: 12 },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.action).toBe('VIEW_PRODUCT');
    });
  });
});
