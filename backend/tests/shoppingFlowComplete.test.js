const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Payment = require('../models/Payment');

describe('IntelliCart Shopping Cart, Checkout, and Order Management Feature Suite', () => {
  let userToken1, user1;
  let userToken2, user2;
  let adminToken, adminUser;
  let inStockProduct, lowStockProduct, outOfStockProduct;
  let categoryId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/intellicart_test_db');

    // Clean test db collections
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Order.deleteMany({});
    await Cart.deleteMany({});
    await Payment.deleteMany({});

    // Create Category
    const category = await Category.create({
      name: 'Electronics & Audio',
      slug: 'electronics-audio',
      description: 'High performance audio gear',
    });
    categoryId = category._id;

    // Register User 1
    const regRes1 = await request(app).post('/api/auth/register').send({
      name: 'Test Customer One',
      email: 'customer1@test.com',
      password: 'Password123!',
    });
    userToken1 = regRes1.body.token;
    user1 = regRes1.body.user;

    // Register User 2
    const regRes2 = await request(app).post('/api/auth/register').send({
      name: 'Test Customer Two',
      email: 'customer2@test.com',
      password: 'Password123!',
    });
    userToken2 = regRes2.body.token;
    user2 = regRes2.body.user;

    // Create Admin User
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin_test@test.com',
      password: 'Password123!',
      role: 'ADMIN',
    });
    const loginAdmin = await request(app).post('/api/auth/login').send({
      email: 'admin_test@test.com',
      password: 'Password123!',
    });
    adminToken = loginAdmin.body.token;

    // Create In-Stock Product with discount (Price 1000, 10% discount -> Effective 900)
    inStockProduct = await Product.create({
      name: 'Noise Cancelling Headphones',
      description: 'Premium wireless headphones',
      brand: 'AcousticAI',
      category: categoryId,
      price: 1000,
      discountPercentage: 10,
      stock: 50,
      thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200',
    });

    // Create Low-Stock Product (Price 3000, stock: 2)
    lowStockProduct = await Product.create({
      name: 'Studio Reference Monitor',
      description: 'Precision studio monitor',
      brand: 'SoundCraft',
      category: categoryId,
      price: 3000,
      discountPercentage: 0,
      stock: 2,
      thumbnail: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=200',
    });

    // Create Out-of-Stock Product (stock: 0)
    outOfStockProduct = await Product.create({
      name: 'Vintage Turntable',
      description: 'Collector edition turntable',
      brand: 'RetroAudio',
      category: categoryId,
      price: 5000,
      stock: 0,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // =========================================================================
  // 1. SHOPPING CART TESTS
  // =========================================================================
  describe('Shopping Cart Features', () => {
    beforeEach(async () => {
      await Cart.deleteMany({});
    });

    it('1.1 Should reject adding product with invalid product ID', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({ productId: 'invalid-object-id', quantity: 1 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('valid product ID');
    });

    it('1.2 Should reject adding product with invalid or negative quantity', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({ productId: inStockProduct._id, quantity: -2 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('positive integer');
    });

    it('1.3 Should reject adding out-of-stock product to cart', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({ productId: outOfStockProduct._id, quantity: 1 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('out of stock');
    });

    it('1.4 Should reject adding quantity greater than available stock', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({ productId: lowStockProduct._id, quantity: 99 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Insufficient inventory');
    });

    it('1.5 Should successfully add product to cart and calculate effective price and totals correctly', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({ productId: inStockProduct._id, quantity: 2 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.cart.items).toHaveLength(1);

      // Price after 10% discount on 1000 is 900
      expect(res.body.cart.items[0].price).toBe(900);
      expect(res.body.cart.items[0].quantity).toBe(2);
      expect(res.body.cart.subtotal).toBe(1800);
      // Below 5000 threshold, shipping is 250
      expect(res.body.cart.shipping).toBe(250);
      expect(res.body.cart.total).toBe(2050);
    });

    it('1.6 Should update item quantity in cart and recalculate subtotal and free shipping threshold', async () => {
      // Add initial item
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({ productId: inStockProduct._id, quantity: 1 });

      // Update quantity to 6 (6 * 900 = 5400 >= 5000 -> Free Shipping!)
      const updateRes = await request(app)
        .put(`/api/cart/${inStockProduct._id}`)
        .set('Authorization', `Bearer ${userToken1}`)
        .send({ quantity: 6 });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.cart.items[0].quantity).toBe(6);
      expect(updateRes.body.cart.subtotal).toBe(5400);
      expect(updateRes.body.cart.shipping).toBe(0); // Free shipping unlocked
      expect(updateRes.body.cart.total).toBe(5400);
    });

    it('1.7 Should remove item from cart when quantity is set to 0 or via DELETE', async () => {
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({ productId: inStockProduct._id, quantity: 2 });

      const delRes = await request(app)
        .delete(`/api/cart/${inStockProduct._id}`)
        .set('Authorization', `Bearer ${userToken1}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.cart.items).toHaveLength(0);
      expect(delRes.body.cart.subtotal).toBe(0);
      expect(delRes.body.cart.total).toBe(0);
    });

    it('1.8 Should clear entire cart on DELETE /api/cart', async () => {
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({ productId: inStockProduct._id, quantity: 1 });

      const clearRes = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${userToken1}`);

      expect(clearRes.status).toBe(200);
      expect(clearRes.body.cart.items).toHaveLength(0);
      expect(clearRes.body.cart.total).toBe(0);
    });
  });

  // =========================================================================
  // 2. CHECKOUT AND ORDER CREATION TESTS
  // =========================================================================
  describe('Checkout and Order Creation Features', () => {
    beforeEach(async () => {
      await Cart.deleteMany({});
      await Order.deleteMany({});
      // Reset product stock
      await Product.findByIdAndUpdate(inStockProduct._id, { stock: 50, salesCount: 0 });
      await Product.findByIdAndUpdate(lowStockProduct._id, { stock: 2, salesCount: 0 });
    });

    it('2.1 Should reject checkout with an empty cart and no custom items', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          shippingAddress: {
            street: '123 Tech Park',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560001',
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('cart is empty');
    });

    it('2.2 Should reject checkout with incomplete shipping address', async () => {
      // Add product to cart
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({ productId: inStockProduct._id, quantity: 1 });

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          shippingAddress: {
            street: '',
            city: '',
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('2.3 Should recalculate prices from database and deduct inventory stock upon order placement', async () => {
      // User puts item in cart
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({ productId: inStockProduct._id, quantity: 3 });

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          shippingAddress: {
            street: '42 Silicon Highway',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560100',
            phone: '9876543210',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.order.items[0].price).toBe(900); // 1000 - 10%
      expect(res.body.order.subtotal).toBe(2700);
      expect(res.body.order.totalAmount).toBe(2950); // 2700 + 250 shipping

      // Verify stock was safely decremented in database
      const updatedProduct = await Product.findById(inStockProduct._id);
      expect(updatedProduct.stock).toBe(47); // 50 - 3
      expect(updatedProduct.salesCount).toBe(3);

      // Verify cart was cleared after order creation
      const cartRes = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${userToken1}`);
      expect(cartRes.body.cart.items).toHaveLength(0);
    });

    it('2.4 Should prevent duplicate orders when idempotencyKey is reused', async () => {
      const idempotencyKey = 'unique_idemp_key_12345';
      const address = {
        street: '42 Silicon Highway',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560100',
      };

      // First submission
      const res1 = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          items: [{ productId: inStockProduct._id, quantity: 1 }],
          shippingAddress: address,
          idempotencyKey,
        });

      expect(res1.status).toBe(201);
      const firstOrderId = res1.body.order._id;

      // Duplicate submission with same idempotency key
      const res2 = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          items: [{ productId: inStockProduct._id, quantity: 1 }],
          shippingAddress: address,
          idempotencyKey,
        });

      expect(res2.status).toBe(200);
      expect(res2.body.order._id).toBe(firstOrderId);
    });

    it('2.5 Should support Cash on Delivery (COD) and create order in CONFIRMED status', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          items: [{ productId: inStockProduct._id, quantity: 1 }],
          shippingAddress: {
            street: '100 COD Lane',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560001',
          },
          paymentMethod: 'COD',
        });

      expect(res.status).toBe(201);
      expect(res.body.order.paymentMethod).toBe('COD');
      expect(res.body.order.orderStatus).toBe('CONFIRMED');
      expect(res.body.order.paymentStatus).toBe('PENDING');
    });
  });

  // =========================================================================
  // 3. ORDER MANAGEMENT & AUTHORIZATION TESTS
  // =========================================================================
  describe('Order Management & Privacy Control', () => {
    let order1;

    beforeEach(async () => {
      await Order.deleteMany({});
      order1 = await Order.create({
        user: user1._id,
        userId: user1._id,
        items: [
          {
            product: inStockProduct._id,
            productId: inStockProduct._id,
            name: inStockProduct.name,
            price: 900,
            quantity: 2,
          },
        ],
        shippingAddress: {
          street: '123 Private Blvd',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
        },
        subtotal: 1800,
        shippingFee: 250,
        totalAmount: 2050,
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING',
      });
    });

    it('3.1 Customer can view their own order details', async () => {
      const res = await request(app)
        .get(`/api/orders/${order1._id}`)
        .set('Authorization', `Bearer ${userToken1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.order._id.toString()).toBe(order1._id.toString());
    });

    it('3.2 Customer CANNOT view another customer\'s order (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/orders/${order1._id}`)
        .set('Authorization', `Bearer ${userToken2}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Not authorized');
    });

    it('3.3 Customer order history only contains their own orders', async () => {
      // Create another order for user 2
      await Order.create({
        user: user2._id,
        userId: user2._id,
        items: [{ product: inStockProduct._id, name: inStockProduct.name, price: 900, quantity: 1 }],
        shippingAddress: { street: 'User 2 Street', city: 'Mumbai', state: 'MH', postalCode: '400001' },
        totalAmount: 1150,
      });

      const res1 = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken1}`);

      expect(res1.status).toBe(200);
      expect(res1.body.orders).toHaveLength(1);
      expect(res1.body.orders[0]._id.toString()).toBe(order1._id.toString());
    });

    it('3.4 Admin can view any customer order', async () => {
      const res = await request(app)
        .get(`/api/orders/${order1._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('3.5 Customer can cancel an order and stock is restored', async () => {
      const currentProduct = await Product.findById(inStockProduct._id);
      const initialStock = currentProduct.stock;

      // Create an order for 2 items
      const createRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          items: [{ productId: inStockProduct._id, quantity: 2 }],
          shippingAddress: { street: 'Cancel St', city: 'Bengaluru', state: 'KA', postalCode: '560001' },
        });

      const newOrderId = createRes.body.order._id;
      const stockAfterOrder = (await Product.findById(inStockProduct._id)).stock;
      expect(stockAfterOrder).toBe(initialStock - 2);

      // Now cancel order
      const cancelRes = await request(app)
        .put(`/api/orders/${newOrderId}/cancel`)
        .set('Authorization', `Bearer ${userToken1}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.order.orderStatus).toBe('CANCELLED');

      // Verify stock was restored
      const restoredProduct = await Product.findById(inStockProduct._id);
      expect(restoredProduct.stock).toBe(initialStock);
    });
  });

  // =========================================================================
  // 4. PAYMENT & FAILURE ROLLBACK TESTS
  // =========================================================================
  describe('Payment Validation and Rollback Features', () => {
    let order;

    beforeEach(async () => {
      await Order.deleteMany({});
      await Product.findByIdAndUpdate(inStockProduct._id, { stock: 50 });

      // Place an order reserving 2 units
      const createRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          items: [{ productId: inStockProduct._id, quantity: 2 }],
          shippingAddress: { street: 'Pay Lane', city: 'Bengaluru', state: 'KA', postalCode: '560001' },
        });

      order = createRes.body.order;
    });

    it('4.1 Rejects payment verification without proof parameters', async () => {
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          orderId: order._id,
          razorpay_order_id: 'order_mock_123',
          // razorpay_payment_id & razorpay_signature omitted
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Missing verification parameters');
    });

    it('4.2 Rejects payment verification from an unauthorized customer', async () => {
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${userToken2}`)
        .send({
          orderId: order._id,
          razorpay_order_id: 'order_mock_123',
          razorpay_payment_id: 'pay_mock_123',
          razorpay_signature: 'sig_mock_123',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Unauthorized');
    });

    it('4.3 Handles client payment failure endpoint and restores reserved stock', async () => {
      const stockBeforeFail = (await Product.findById(inStockProduct._id)).stock;
      expect(stockBeforeFail).toBe(48); // 50 - 2

      const failRes = await request(app)
        .post('/api/payments/fail')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          orderId: order._id,
          reason: 'User cancelled payment modal',
        });

      expect(failRes.status).toBe(200);
      expect(failRes.body.order.orderStatus).toBe('CANCELLED');
      expect(failRes.body.order.paymentStatus).toBe('FAILED');

      // Verify stock was restored to 50
      const restoredProduct = await Product.findById(inStockProduct._id);
      expect(restoredProduct.stock).toBe(50);
    });

    it('4.4 Verifies valid payment and marks order as PAID and CONFIRMED', async () => {
      // Initiate Razorpay order
      const rzpOrderRes = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({ orderId: order._id });

      expect(rzpOrderRes.status).toBe(200);
      const razorpayOrderId = rzpOrderRes.body.razorpayOrderId;

      // Verify payment with mock signature
      const verifyRes = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          orderId: order._id,
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpay_signature: 'verified_mock_sig',
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.order.paymentStatus).toBe('PAID');
      expect(verifyRes.body.order.orderStatus).toBe('CONFIRMED');
    });
  });
});
