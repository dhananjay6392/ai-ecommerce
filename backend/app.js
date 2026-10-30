const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const errorMiddleware = require('./middleware/errorMiddleware');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const activityRoutes = require('./routes/activityRoutes');
const mlRoutes = require('./routes/mlRoutes');

const app = express();
const connectDB = require('./config/db');

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Cookie parser for HTTP-only cookies
app.use(cookieParser());

// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permissive for local development and postman/curl
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-session-id',
      'idempotency-key',
      'x-idempotency-key',
      'Accept',
      'X-Requested-With',
      'Origin',
    ],
  })
);

// Rate Limiting (General endpoints)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: 'Too many requests created from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', generalLimiter);

// Specific Auth Rate Limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Request body parsers
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Check API
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const dbInfo = connectDB.getConnectionInfo ? connectDB.getConnectionInfo() : {};
  res.status(200).json({
    success: true,
    status: 'ONLINE',
    service: 'IntelliCart AI Backend REST API',
    database: isDbConnected ? 'CONNECTED' : 'DISCONNECTED',
    databaseDetails: {
      status: isDbConnected ? 'CONNECTED' : 'DISCONNECTED',
      type: dbInfo.type || (isDbConnected ? 'CONNECTED' : 'NONE'),
      host: mongoose.connection.host || null,
      name: mongoose.connection.name || null,
      fallbackActive: dbInfo.fallbackActive || false,
      primaryError: dbInfo.primaryDiagnostic || null,
    },
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/orders', orderRoutes); // Mounts /api/admin/orders seamlessly
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/products/:productId/reviews', reviewRoutes); // Direct access via product route
app.use('/api/activity', activityRoutes);
app.use('/api/ml', mlRoutes);

// Centralized error handler
app.use(errorMiddleware);

module.exports = app;
