const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  getOrderAnalytics,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');
const { createOrderValidator } = require('../validators/orderValidator');

// Admin Analytics
router.get('/analytics', protect, requireAdmin, getOrderAnalytics);
router.get('/admin/analytics', protect, requireAdmin, getOrderAnalytics);

// Admin routes under /orders/admin
router.get('/admin', protect, requireAdmin, getAllOrders);
router.put('/admin/:id/status', protect, requireAdmin, updateOrderStatus);

// Customer / Admin polymorphic root route
router.route('/')
  .post(protect, createOrderValidator, createOrder)
  .get(protect, (req, res, next) => {
    // When mounted at /api/admin/orders, delegate to getAllOrders
    if (req.baseUrl.includes('/admin')) {
      return requireAdmin(req, res, () => getAllOrders(req, res, next));
    }
    return getMyOrders(req, res, next);
  });

router.route('/:id/status')
  .put(protect, requireAdmin, updateOrderStatus);

router.route('/:id')
  .get(protect, getOrderById);

router.route('/:id/cancel')
  .put(protect, cancelOrder)
  .post(protect, cancelOrder);

module.exports = router;

