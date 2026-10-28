const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');
const { createOrderValidator } = require('../validators/orderValidator');

// Admin routes under /orders/admin
router.get('/admin', protect, requireAdmin, getAllOrders);
router.put('/admin/:id/status', protect, requireAdmin, updateOrderStatus);

// Customer order routes
router.route('/')
  .post(protect, createOrderValidator, createOrder)
  .get(protect, getMyOrders);

router.route('/:id')
  .get(protect, getOrderById);

router.route('/:id/cancel')
  .put(protect, cancelOrder)
  .post(protect, cancelOrder);

module.exports = router;
