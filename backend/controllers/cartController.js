const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Helper to compute canonical product price
const getEffectivePrice = (product) => {
  const discount = product.discountPercentage || product.discount || 0;
  return discount > 0
    ? Math.round(product.price - (product.price * discount) / 100)
    : product.price;
};

// Helper to populate, synchronize, and format cart
const getPopulatedCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate('items.product');

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      userId: userId,
      items: [],
      subtotal: 0,
      shipping: 0,
      discount: 0,
      total: 0,
    });
    return cart;
  }

  let cartModified = false;

  // Filter out deleted products and adjust to current inventory & canonical prices
  const validItems = [];
  for (const item of cart.items) {
    if (!item.product) {
      cartModified = true;
      continue;
    }

    const prod = item.product;
    // If product is now out of stock, remove it from active cart
    if (prod.stock <= 0) {
      cartModified = true;
      continue;
    }

    // Cap quantity if current stock is lower than in cart
    if (item.quantity > prod.stock) {
      item.quantity = prod.stock;
      cartModified = true;
    }

    // Refresh trusted price
    const latestPrice = getEffectivePrice(prod);
    if (item.price !== latestPrice) {
      item.price = latestPrice;
      cartModified = true;
    }

    validItems.push(item);
  }

  if (cartModified || validItems.length !== cart.items.length) {
    cart.items = validItems;
    await cart.save();
  }

  return cart;
};

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res, next) => {
  try {
    const cart = await getPopulatedCart(req.user.id);
    res.status(200).json({
      success: true,
      cart,
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add product to cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid product ID is required.',
      });
    }

    const addQty = parseInt(quantity, 10);
    if (isNaN(addQty) || addQty < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer of at least 1.',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    if (product.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: `Product '${product.name}' is currently out of stock.`,
      });
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({ user: req.user.id, userId: req.user.id, items: [] });
    }

    // Check if item is already in cart
    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString()
    );

    const currentQty = existingIndex > -1 ? cart.items[existingIndex].quantity : 0;
    const requestedTotal = currentQty + addQty;

    if (requestedTotal > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Insufficient inventory: only ${product.stock} units available in stock.`,
      });
    }

    const effectivePrice = getEffectivePrice(product);

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity = requestedTotal;
      cart.items[existingIndex].price = effectivePrice;
    } else {
      cart.items.push({
        product: product._id,
        productId: product._id,
        quantity: addQty,
        price: effectivePrice,
      });
    }

    await cart.save();
    const populated = await getPopulatedCart(req.user.id);

    res.status(200).json({
      success: true,
      message: `Added ${product.name} to your cart.`,
      cart: populated,
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update quantity of product in cart
// @route   PUT /api/cart/:productId
// @access  Private
exports.updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid product ID is required.',
      });
    }

    const { quantity } = req.body;
    const newQty = parseInt(quantity, 10);

    if (isNaN(newQty)) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a valid number.',
      });
    }

    if (newQty < 1) {
      return exports.removeCartItem(req, res, next);
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    if (newQty > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity exceeds stock (${product.stock} units available).`,
      });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found.' });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart.',
      });
    }

    cart.items[itemIndex].quantity = newQty;
    cart.items[itemIndex].price = getEffectivePrice(product);
    await cart.save();

    const populated = await getPopulatedCart(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Cart updated successfully',
      cart: populated,
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove product from cart
// @route   DELETE /api/cart/:productId
// @access  Private
exports.removeCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid product ID is required.',
      });
    }

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found.' });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId.toString()
    );

    await cart.save();
    const populated = await getPopulatedCart(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart: populated,
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (cart) {
      cart.items = [];
      cart.subtotal = 0;
      cart.shipping = 0;
      cart.discount = 0;
      cart.total = 0;
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      cart: { items: [], subtotal: 0, shipping: 0, discount: 0, total: 0 },
      data: { items: [], subtotal: 0, shipping: 0, discount: 0, total: 0 },
    });
  } catch (err) {
    next(err);
  }
};
