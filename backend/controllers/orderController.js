const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

// Helper to compute canonical product price
const getEffectivePrice = (product) => {
  const discount = product.discountPercentage || product.discount || 0;
  return discount > 0
    ? Math.round(product.price - (product.price * discount) / 100)
    : product.price;
};

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const { items: customItems, shippingAddress, paymentMethod: rawPaymentMethod, idempotencyKey: bodyKey } = req.body;
    const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'] || bodyKey;

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
      return res.status(400).json({
        success: false,
        message: 'A complete shipping address is required.',
      });
    }

    // 1. Check Idempotency Key if provided
    if (idempotencyKey) {
      const existingOrder = await Order.findOne({ user: req.user.id, idempotencyKey });
      if (existingOrder) {
        return res.status(200).json({
          success: true,
          message: 'Order already created (idempotent submission).',
          order: existingOrder,
          data: existingOrder,
        });
      }
    }

    let orderItemsToProcess = [];

    // Use items passed in body or fetch from user's active cart
    if (customItems && Array.isArray(customItems) && customItems.length > 0) {
      orderItemsToProcess = customItems;
    } else {
      const cart = await Cart.findOne({ user: req.user.id });
      if (!cart || !cart.items || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Your cart is empty. Please add products before placing an order.',
        });
      }
      orderItemsToProcess = cart.items.map((item) => ({
        productId: item.product || item.productId,
        quantity: item.quantity,
      }));
    }

    if (orderItemsToProcess.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty. Please add products before placing an order.',
      });
    }

    // 3. Server-side validation of products and stock
    let subtotal = 0;
    const finalOrderItems = [];

    for (const item of orderItemsToProcess) {
      const pId = item.productId || item.product;

      if (!pId || !mongoose.Types.ObjectId.isValid(pId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid product ID provided: ${pId}`,
        });
      }

      const requestedQty = parseInt(item.quantity, 10);
      if (isNaN(requestedQty) || requestedQty < 1) {
        return res.status(400).json({
          success: false,
          message: 'Item quantity must be a positive integer of at least 1.',
        });
      }

      const product = await Product.findById(pId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with id ${pId} not found.`,
        });
      }

      if (product.stock < requestedQty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient inventory: '${product.name}' only has ${product.stock} units remaining in stock.`,
        });
      }

      // Compute canonical server-side price from trusted database product data
      const effectivePrice = getEffectivePrice(product);
      subtotal += effectivePrice * requestedQty;

      finalOrderItems.push({
        product: product._id,
        productId: product._id,
        name: product.name,
        quantity: requestedQty,
        price: effectivePrice,
        image: product.thumbnail || product.images?.[0] || '',
      });
    }

    // Canonical calculations
    const shippingFee = subtotal >= 5000 ? 0 : 250;
    const discount = 0;
    const totalAmount = subtotal + shippingFee - discount;

    // Prevent rapid duplicate submission of identical order within 2 seconds
    if (!idempotencyKey) {
      const twoSecondsAgo = new Date(Date.now() - 2000);
      const recentDuplicate = await Order.findOne({
        user: req.user.id,
        createdAt: { $gte: twoSecondsAgo },
        totalAmount,
        'shippingAddress.street': shippingAddress.street,
        paymentStatus: 'PENDING',
      });
      if (recentDuplicate) {
        return res.status(200).json({
          success: true,
          message: 'Duplicate order submission prevented.',
          order: recentDuplicate,
          data: recentDuplicate,
        });
      }
    }

    // 4. Safe atomic stock deduction with rollback on failure
    const deductedItems = [];
    for (const item of finalOrderItems) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity, salesCount: item.quantity } },
        { new: true }
      );

      if (!updated) {
        // Rollback already deducted products
        for (const reverted of deductedItems) {
          await Product.findByIdAndUpdate(reverted.product, {
            $inc: { stock: reverted.quantity, salesCount: -reverted.quantity },
          });
        }
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product '${item.name}'. Order could not be fulfilled.`,
        });
      }

      deductedItems.push(item);
    }

    // 5. Payment method & status handling
    const paymentMethod = (rawPaymentMethod || 'RAZORPAY').toUpperCase();
    const isCOD = paymentMethod === 'COD';

    const order = await Order.create({
      user: req.user.id,
      userId: req.user.id,
      items: finalOrderItems,
      shippingAddress: {
        fullName: shippingAddress.fullName || shippingAddress.name || req.user.name || '',
        name: shippingAddress.name || shippingAddress.fullName || req.user.name || '',
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state || '',
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country || 'India',
        phone: shippingAddress.phone || req.user.phone || '',
        email: shippingAddress.email || req.user.email || '',
      },
      subtotal,
      shippingFee,
      discount,
      totalAmount,
      paymentMethod,
      idempotencyKey: idempotencyKey || undefined,
      paymentStatus: 'PENDING',
      orderStatus: isCOD ? 'CONFIRMED' : 'PENDING',
    });

    // Clear user's cart upon successful order creation
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [], subtotal: 0, shipping: 0, discount: 0, total: 0 }
    );

    res.status(201).json({
      success: true,
      message: isCOD
        ? 'Order placed successfully with Cash on Delivery.'
        : 'Order created and pending payment.',
      order,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders
// @access  Private
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      $or: [{ user: req.user.id }, { userId: req.user.id }],
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format.',
      });
    }

    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name slug brand thumbnail');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Ensure only the order owner or admin can view
    const orderUserId = (order.user?._id || order.user || order.userId)?.toString();
    const isOwner = orderUserId === req.user.id.toString();
    const isAdmin = (req.user.role || '').toUpperCase() === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order.',
      });
    }

    res.status(200).json({
      success: true,
      order,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel order and restore reserved stock
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format.',
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    const orderUserId = (order.user?._id || order.user || order.userId)?.toString();
    const isOwner = orderUserId === req.user.id.toString();
    const isAdmin = (req.user.role || '').toUpperCase() === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order.',
      });
    }

    if (order.orderStatus === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled.',
      });
    }

    if (order.orderStatus === 'SHIPPED' || order.orderStatus === 'DELIVERED') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order that has already been ${order.orderStatus.toLowerCase()}.`,
      });
    }

    // Restore stock and decrement salesCount
    for (const item of order.items) {
      const pId = item.product?._id || item.product || item.productId;
      if (pId) {
        await Product.findByIdAndUpdate(pId, {
          $inc: { stock: item.quantity, salesCount: -item.quantity },
        });
      }
    }

    order.orderStatus = 'CANCELLED';
    if (order.paymentStatus === 'PAID') {
      order.paymentStatus = 'REFUNDED';
    } else {
      order.paymentStatus = 'FAILED';
    }
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully and inventory restored.',
      order,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/admin/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update order status (Admin only)
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format.',
      });
    }

    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    const previousStatus = order.orderStatus;

    if (orderStatus) {
      order.orderStatus = orderStatus.toUpperCase();
      if (order.orderStatus === 'DELIVERED') {
        order.deliveredAt = new Date();
      }

      // If transitioning to CANCELLED from non-cancelled, restore stock
      if (order.orderStatus === 'CANCELLED' && previousStatus !== 'CANCELLED') {
        for (const item of order.items) {
          const pId = item.product?._id || item.product || item.productId;
          if (pId) {
            await Product.findByIdAndUpdate(pId, {
              $inc: { stock: item.quantity, salesCount: -item.quantity },
            });
          }
        }
      }
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus.toUpperCase();
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};
