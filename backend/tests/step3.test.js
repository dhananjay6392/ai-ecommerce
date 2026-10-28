const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');

describe('Step 3: Production Authentication & Role-Based Access Test Suite', () => {
  let customerToken;
  let customerId;
  let adminToken;
  let adminId;
  let testAddressId;
  const testCustomerEmail = `step3_customer_${Date.now()}@test.com`;
  const testPassword = 'Password@123';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/intellicart_ai');
    }
  });

  afterAll(async () => {
    // Cleanup test user
    await User.deleteMany({ email: testCustomerEmail });
    await mongoose.connection.close();
  });

  // 1. REGISTRATION
  describe('1. Customer Registration (POST /api/auth/register)', () => {
    it('should reject registration if password is under 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Short PW User',
          email: `short_${Date.now()}@test.com`,
          password: 'pass',
          confirmPassword: 'pass',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration if confirmPassword does not match', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Mismatch User',
          email: `mismatch_${Date.now()}@test.com`,
          password: 'Password@123',
          confirmPassword: 'DifferentPassword@123',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/confirmation does not match/i);
    });

    it('should successfully register a customer and set HTTP-only cookie', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Production Customer',
          email: testCustomerEmail,
          password: testPassword,
          confirmPassword: testPassword,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testCustomerEmail);
      expect(res.body.user.role).toBe('CUSTOMER');
      expect(res.body.user.password).toBeUndefined();

      // Check cookie header
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('token='))).toBe(true);

      customerToken = res.body.token;
      customerId = res.body.user.id || res.body.user._id;
    });

    it('should reject duplicate email registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Customer',
          email: testCustomerEmail,
          password: testPassword,
          confirmPassword: testPassword,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // 2. LOGIN & LOGOUT
  describe('2. Login, Logout & Session (POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me)', () => {
    it('should reject login with wrong password (enumeration safe)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testCustomerEmail,
          password: 'WrongPassword@999',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password.');
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent_account_9999@test.com',
          password: 'Password@123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password.');
    });

    it('should login customer with valid credentials and return user and token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testCustomerEmail,
          password: testPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testCustomerEmail);
      expect(res.body.user.password).toBeUndefined();
      customerToken = res.body.token;
    });

    it('should login admin with valid admin credentials', async () => {
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
      adminId = res.body.user.id || res.body.user._id;
    });

    it('should return sanitized profile on GET /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(testCustomerEmail);
      expect(res.body.user.role).toBe('CUSTOMER');
      expect(res.body.user.password).toBeUndefined();
    });

    it('should logout customer and clear cookie', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // 3. ROLE-BASED ACCESS CONTROL
  describe('3. Role-Based Access Control', () => {
    it('should forbid customer from accessing admin user management endpoint (HTTP 403 "Admin access required")', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Admin access required');
    });

    it('should allow admin to access admin user management endpoint', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.users).toBeDefined();
      expect(res.body.users.length).toBeGreaterThan(0);
    });
  });

  // 4. PROFILE & PASSWORD APIs
  describe('4. User Profile & Password Update (GET / PUT /api/users/profile, PUT /api/users/password)', () => {
    it('should get current profile via GET /api/users/profile', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(testCustomerEmail);
    });

    it('should update profile name and phone via PUT /api/users/profile', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Updated Customer Name',
          phone: '+91 99999 88888',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.name).toBe('Updated Customer Name');
      expect(res.body.user.phone).toBe('+91 99999 88888');
    });

    it('should reject password update if currentPassword is wrong', async () => {
      const res = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          currentPassword: 'IncorrectPassword@999',
          newPassword: 'NewPassword@123',
          confirmPassword: 'NewPassword@123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Current password is incorrect.');
    });

    it('should reject password update if confirmPassword does not match', async () => {
      const res = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          currentPassword: testPassword,
          newPassword: 'NewPassword@123',
          confirmPassword: 'MismatchPassword@123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should successfully update password with valid verification', async () => {
      const res = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          currentPassword: testPassword,
          newPassword: 'NewPassword@123',
          confirmPassword: 'NewPassword@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify login with new password works
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testCustomerEmail,
          password: 'NewPassword@123',
        });
      expect(loginRes.status).toBe(200);
      customerToken = loginRes.body.token;
    });
  });

  // 5. ADDRESS MANAGEMENT CRUD
  describe('5. Address Management (GET, POST, PUT, DELETE /api/users/addresses)', () => {
    it('should create a new address via POST /api/users/addresses', async () => {
      const res = await request(app)
        .post('/api/users/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          fullName: 'Jane Doe',
          phone: '+91 91234 56789',
          addressLine1: '123 Tech Park',
          addressLine2: 'Apt 4B',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560100',
          country: 'India',
          isDefault: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.address).toBeDefined();
      expect(res.body.address.city).toBe('Bengaluru');
      expect(res.body.address.isDefault).toBe(true);
      testAddressId = res.body.address._id;
    });

    it('should retrieve addresses via GET /api/users/addresses', async () => {
      const res = await request(app)
        .get('/api/users/addresses')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.addresses.length).toBeGreaterThan(0);
      expect(res.body.addresses[0].city).toBe('Bengaluru');
    });

    it('should update an address via PUT /api/users/addresses/:id', async () => {
      const res = await request(app)
        .put(`/api/users/addresses/${testAddressId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500081',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.address.city).toBe('Hyderabad');
      expect(res.body.address.state).toBe('Telangana');
    });

    it('should delete an address via DELETE /api/users/addresses/:id', async () => {
      const res = await request(app)
        .delete(`/api/users/addresses/${testAddressId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.addresses.length).toBe(0);
    });
  });

  // 6. ADMIN USER MANAGEMENT & SAFEGUARDS
  describe('6. Admin User Management & Safeguards', () => {
    it('should allow admin to view user list with filters', async () => {
      const res = await request(app)
        .get('/api/admin/users?role=CUSTOMER')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.users.every((u) => u.role === 'CUSTOMER')).toBe(true);
    });

    it('should allow admin to search users by name or email', async () => {
      const res = await request(app)
        .get(`/api/admin/users?search=${encodeURIComponent('Updated Customer')}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.users.length).toBeGreaterThanOrEqual(1);
    });

    it('should allow admin to deactivate a customer account', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${customerId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.isActive).toBe(false);

      // Verify deactivated customer cannot log in
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testCustomerEmail,
          password: 'NewPassword@123',
        });
      expect(loginRes.status).toBe(403);
      expect(loginRes.body.message).toMatch(/deactivated/i);

      // Reactivate customer for clean state
      await request(app)
        .put(`/api/admin/users/${customerId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: true });
    });

    it('should block deactivating the last active administrator', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${adminId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Cannot deactivate the last active administrator/i);
    });
  });
});
