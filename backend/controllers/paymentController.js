const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const UserActivity = require('../models/UserActivity');
const paymentService = require('../services/paymentService');

// @desc    Initiate Razorpay Order for an existing Application Order
// @route   POST /api/payments/create-order
// @access  Private
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required.',
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Verify ownership
    if (order.user.toString() !== req.user.id && order.userId?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to pay for this order.' });
    }

    // Verify state
    if (order.paymentStatus !== 'PENDING' && order.paymentStatus !== 'Pending') {
      return res.status(400).json({ success: false, message: `Order is not eligible for payment. Status: ${order.paymentStatus}` });
    }

    // Idempotency check: If a razorpay order already exists on this order, we can reuse it,
    // but the prompt says: "Add idempotency protection against duplicate payment-order creation where appropriate."
    let razorpayOrderId = order.razorpayOrderId;
    let payment = null;

    if (razorpayOrderId) {
      payment = await Payment.findOne({ razorpayOrderId });
    }

    if (!razorpayOrderId || !payment) {
      const receiptId = `rcpt_${Date.now()}_${req.user.id.toString().slice(-4)}`;
      const totalAmount = order.totalAmount;
      
      const razorpayOrder = await paymentService.createOrder(
        totalAmount,
        receiptId,
        { userId: req.user.id.toString(), orderId: order._id.toString() }
      );
      
      razorpayOrderId = razorpayOrder.id;
      
      // Update order with razorpayOrderId
      order.razorpayOrderId = razorpayOrderId;
      await order.save();

      // Create Payment log in DB
      payment = await Payment.create({
        user: req.user.id,
        order: order._id,
        razorpayOrderId: razorpayOrderId,
        amount: totalAmount,
        currency: 'INR',
        status: 'PENDING',
        notes: { orderId: order._id.toString() },
      });
      
      order.payment = payment._id;
      await order.save();
    }

    res.status(200).json({
      success: true,
      razorpayOrderId: razorpayOrderId,
      amount: order.totalAmount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
      orderId: order._id,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify Razorpay Signature and Finalize Order
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Missing verification parameters. orderId, razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.',
      });
    }

    // Find Order
    const order = await Order.findById(orderId).populate('items.product');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Verify ownership
    const orderUserId = (order.user?._id || order.user || order.userId)?.toString();
    if (orderUserId !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to verify payment for this order.',
      });
    }

    // Cryptographic verification
    const isValid = paymentService.verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          status: 'failed',
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        }
      );

      if (order.paymentStatus !== 'PAID' && order.paymentStatus !== 'Paid') {
        order.paymentStatus = 'FAILED';
        order.orderStatus = 'CANCELLED';
        await order.save();

        // Restore stock (rollback)
        for (const item of order.items) {
          const pId = item.product?._id || item.product || item.productId;
          if (pId) {
            await Product.findByIdAndUpdate(pId, {
              $inc: { stock: item.quantity, salesCount: -item.quantity },
            });
          }
        }
      }

      return res.status(400).json({
        success: false,
        message: 'Cryptographic signature verification failed. Payment was rejected.',
      });
    }

    if (order.paymentStatus === 'PAID' || order.paymentStatus === 'Paid') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified',
        order,
      });
    }

    // Valid payment! Update Payment record
    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        status: 'captured',
        razorpayPaymentId: razorpay_payment_id || `pay_${Date.now()}`,
        razorpaySignature: razorpay_signature || 'verified_mock_sig',
      }
    );

    // Log interaction for recommendation AI model
    for (const item of order.items) {
      const pId = item.product?._id || item.product || item.productId;
      if (pId) {
        await UserActivity.create({
          user: req.user.id,
          product: pId,
          action: 'PURCHASE',
          metadata: {
            quantity: item.quantity,
            price: item.price,
            orderId: order._id,
          },
        });
      }
    }

    // Update Order state
    order.paymentStatus = 'PAID';
    order.orderStatus = 'CONFIRMED';
    order.paidAt = new Date();
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment verified and order confirmed successfully',
      order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Handle Payment Cancellation or Failure from Client
// @route   POST /api/payments/fail
// @access  Private
exports.handlePaymentFailure = async (req, res, next) => {
  try {
    const { orderId, reason } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required.',
      });
    }

    const order = await Order.findById(orderId).populate('items.product');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Verify ownership
    const orderUserId = (order.user?._id || order.user || order.userId)?.toString();
    if (orderUserId !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized for this order.',
      });
    }

    // Only cancel and rollback if payment is not already successful
    if (order.paymentStatus !== 'PAID') {
      order.paymentStatus = 'FAILED';
      order.orderStatus = 'CANCELLED';
      await order.save();

      // Restore reserved inventory
      for (const item of order.items) {
        const pId = item.product?._id || item.product || item.productId;
        if (pId) {
          await Product.findByIdAndUpdate(pId, {
            $inc: { stock: item.quantity, salesCount: -item.quantity },
          });
        }
      }

      if (order.razorpayOrderId) {
        await Payment.findOneAndUpdate(
          { razorpayOrderId: order.razorpayOrderId },
          { status: 'failed' }
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payment failure recorded and reserved stock restored.',
      order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Razorpay Webhook Handler
// @route   POST /api/payments/webhook
// @access  Public
exports.handleWebhook = async (req, res, next) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    // Test mode / missing secret
    if (!secret || secret.includes('placeholder')) {
      return res.status(200).json({ status: 'ignored', message: 'Webhook secret not configured.' });
    }

    const signature = req.headers['x-razorpay-signature'];
    
    // Verify signature using the raw body
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(req.rawBody || '')
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).send('Invalid Signature');
    }

    const event = req.body;
    
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const paymentEntity = event.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      
      const order = await Order.findOne({ razorpayOrderId });
      if (order && order.paymentStatus !== 'PAID') {
        order.paymentStatus = 'PAID';
        order.orderStatus = 'CONFIRMED';
        order.paidAt = new Date();
        await order.save();
        
        await Payment.findOneAndUpdate(
          { razorpayOrderId },
          {
            status: 'captured',
            razorpayPaymentId: paymentEntity.id,
          }
        );
      }
    } else if (event.event === 'payment.failed') {
      const paymentEntity = event.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      
      const order = await Order.findOne({ razorpayOrderId });
      if (order && order.paymentStatus !== 'PAID' && order.paymentStatus !== 'FAILED') {
        order.paymentStatus = 'FAILED';
        order.orderStatus = 'CANCELLED';
        await order.save();
        
        await Payment.findOneAndUpdate(
          { razorpayOrderId },
          {
            status: 'failed',
            razorpayPaymentId: paymentEntity.id,
          }
        );

        // Restore stock (rollback)
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.product._id || item.product, {
            $inc: { stock: item.quantity, salesCount: -item.quantity },
          });
        }
      }
    }

    res.status(200).send('Webhook processed');
  } catch (err) {
    console.error('Webhook Error:', err);
    res.status(500).send('Webhook error');
  }
};

