const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  verifyPayment,
  handleWebhook,
  handlePaymentFailure,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPayment);
router.post('/fail', protect, handlePaymentFailure);
router.post('/cancel', protect, handlePaymentFailure);
router.post('/webhook', handleWebhook);

module.exports = router;
