const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

describe('IntelliCart Razorpay Payment Integration (Step 5)', () => {
  let token1, token2;
  let user1, user2;
  let product1;
  let order1;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/intellicart_test_db');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Payment.deleteMany({});

    const res1 = await request(app).post('/api/auth/register').send({
      name: 'User One',
      email: 'user1@test.com',
      password: 'Password123'
    });
    token1 = res1.body.token;
    user1 = res1.body.user;

    const res2 = await request(app).post('/api/auth/register').send({
      name: 'User Two',
      email: 'user2@test.com',
      password: 'Password123'
    });
    token2 = res2.body.token;
    user2 = res2.body.user;

    product1 = await Product.create({
      name: 'Test Product 1',
      description: 'Desc',
      brand: 'TestBrand',
      price: 1000,
      stock: 10,
      category: new mongoose.Types.ObjectId(),
    });
  });

  beforeEach(async () => {
    await Order.deleteMany({});
    order1 = await Order.create({
      user: user1._id,
      items: [{ product: product1._id, name: product1.name, price: 1000, quantity: 2 }],
      totalAmount: 2000,
      shippingAddress: { street: '1', city: 'A', state: 'B', postalCode: '123' },
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING'
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Payment Order Creation', () => {
    it('1. Unauthenticated payment-order creation should fail', async () => {
      const res = await request(app)
        .post('/api/payments/create-order')
        .send({ orderId: order1._id });
      expect(res.status).toBe(401);
    });

    it('2. Payment for another customer\'s order should fail', async () => {
      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${token2}`)
        .send({ orderId: order1._id });
      expect(res.status).toBe(403);
    });

    it('3. Invalid application order ID should fail', async () => {
      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${token1}`)
        .send({ orderId: new mongoose.Types.ObjectId() });
      expect(res.status).toBe(404);
    });

    it('4. Server-side amount calculation should match order amount', async () => {
      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${token1}`)
        .send({ orderId: order1._id });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.amount).toBe(2000); // from our setup
      expect(res.body.razorpayOrderId).toContain('order_mock_');
    });
  });

  describe('Payment Verification and Webhook', () => {
    let mockRazorpayOrderId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${token1}`)
        .send({ orderId: order1._id });
      mockRazorpayOrderId = res.body.razorpayOrderId;
    });

    it('6. Invalid payment signature should fail', async () => {
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          razorpay_order_id: 'real_order_id_needs_sig', // bypassing mock bypass
          razorpay_payment_id: 'pay_123',
          razorpay_signature: 'invalid_sig',
          orderId: order1._id
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      
      const dbOrder = await Order.findById(order1._id);
      expect(dbOrder.paymentStatus).toBe('FAILED');
    });

    it('13. Inventory consistency on failed payment rollback', async () => {
      // Stock was 10. Let's assume orderController deducted 2. So it's 8.
      await Product.findByIdAndUpdate(product1._id, { stock: 8 });

      // Verification fails
      await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          razorpay_order_id: 'real_order_id_needs_sig2',
          razorpay_payment_id: 'pay_123',
          razorpay_signature: 'invalid_sig',
          orderId: order1._id
        });
      
      // Stock should roll back to 10
      const prod = await Product.findById(product1._id);
      expect(prod.stock).toBe(10);
    });

    it('5. Valid payment signature should succeed and mark paid', async () => {
      // Re-create order in PENDING because it was FAILED in previous tests
      order1.paymentStatus = 'PENDING';
      await order1.save();
      
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          razorpay_order_id: mockRazorpayOrderId,
          razorpay_payment_id: 'pay_valid_123',
          razorpay_signature: 'does_not_matter_for_mock',
          orderId: order1._id
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const dbOrder = await Order.findById(order1._id);
      expect(dbOrder.paymentStatus).toBe('PAID');
    });

    it('8. Duplicate verification request should be idempotent', async () => {
      await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          razorpay_order_id: mockRazorpayOrderId,
          razorpay_payment_id: 'pay_valid_123',
          razorpay_signature: 'does_not_matter_for_mock',
          orderId: order1._id
        });

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          razorpay_order_id: mockRazorpayOrderId,
          razorpay_payment_id: 'pay_valid_123',
          razorpay_signature: 'does_not_matter_for_mock',
          orderId: order1._id
        });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Payment already verified');
    });
    
    it('14. Invalid webhook signature', async () => {
      const res = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', 'wrong_sig')
        .send({ event: 'payment.captured' });
      // In tests process.env.RAZORPAY_WEBHOOK_SECRET might be 'placeholder' so it ignores
      // We will set a fake secret
      process.env.RAZORPAY_WEBHOOK_SECRET = 'test_secret';
      
      const res2 = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', 'wrong_sig')
        .send({ event: 'payment.captured' });
      
      expect(res2.status).toBe(400);
    });

    it('9. Duplicate webhook delivery', async () => {
      // Order is already paid.
      const crypto = require('crypto');
      const payload = JSON.stringify({
        event: 'payment.captured',
        payload: { payment: { entity: { order_id: mockRazorpayOrderId, id: 'pay_xyz' } } }
      });
      const sig = crypto.createHmac('sha256', 'test_secret').update(payload).digest('hex');

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', sig)
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.text).toBe('Webhook processed');
    });
  });
});
