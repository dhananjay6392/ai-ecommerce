const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');

describe('IntelliCart AI Core REST Endpoints', () => {
  let customerToken;
  let adminToken;
  let testProductId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/intellicart_ai');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('Health Check: GET /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('ONLINE');
  });

  it('Auth: Customer Login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alex@example.com', password: 'Customer@123456' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    customerToken = res.body.token;
  });

  it('Auth: Admin Login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@intellicart.com', password: 'Admin@123456' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role.toUpperCase()).toBe('ADMIN');
    adminToken = res.body.token;
  });

  it('Auth Profile: GET /api/auth/me', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('alex@example.com');
  });

  it('Categories: GET /api/categories', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);
  });

  it('Products: GET /api/products', async () => {
    const res = await request(app).get('/api/products?limit=5');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products.length).toBeGreaterThan(0);
    testProductId = res.body.products[0]._id;
  });

  it('Products: Filter by search and price', async () => {
    const res = await request(app).get('/api/products?search=headphone');
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThanOrEqual(1);
  });

  it('Cart: Add Item and Fetch Cart', async () => {
    const addRes = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: testProductId, quantity: 1 });
    expect(addRes.status).toBe(200);
    expect(addRes.body.success).toBe(true);

    const getRes = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.cart.items.length).toBeGreaterThan(0);
  });

  it('ML: Get Hybrid Recommendations', async () => {
    const res = await request(app)
      .get(`/api/ml/recommendations?productId=${testProductId}&limit=4`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.recommendations.length).toBeGreaterThan(0);
  });

  it('ML: Get Research Benchmarks', async () => {
    const res = await request(app).get('/api/ml/benchmarks');
    expect(res.status).toBe(200);
    expect(res.body.recommendation_metrics).toBeDefined();
    expect(res.body.demand_forecasting_metrics).toBeDefined();
  });

  it('Admin: Get Inventory Intelligence', async () => {
    const res = await request(app)
      .get('/api/ml/inventory-intelligence')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
    expect(res.body.items.length).toBeGreaterThan(0);
  });
});
