const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
  },
  { _id: true }
);

// Sync productId and product
CartItemSchema.pre('validate', function (next) {
  if (this.productId && !this.product) {
    this.product = this.productId;
  } else if (this.product && !this.productId) {
    this.productId = this.product;
  }
  next();
});

const CartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    items: [CartItemSchema],
    subtotal: {
      type: Number,
      default: 0,
      min: [0, 'Subtotal cannot be negative'],
    },
    shipping: {
      type: Number,
      default: 0,
      min: [0, 'Shipping cannot be negative'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
    },
    total: {
      type: Number,
      default: 0,
      min: [0, 'Total cannot be negative'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Sync user and userId
CartSchema.pre('validate', function (next) {
  if (this.userId && !this.user) {
    this.user = this.userId;
  } else if (this.user && !this.userId) {
    this.userId = this.user;
  }

  // Recalculate totals
  const sub = this.items.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);
  this.subtotal = Math.round(sub * 100) / 100;
  this.shipping = this.subtotal >= 5000 || this.subtotal === 0 ? 0 : 250;
  const disc = this.discount || 0;
  this.total = Math.max(0, Math.round((this.subtotal + this.shipping - disc) * 100) / 100);

  next();
});

// Virtual for backward compatibility
CartSchema.virtual('totalAmount').get(function () {
  return this.total || this.subtotal;
});

CartSchema.virtual('totalItems').get(function () {
  return this.items.reduce((acc, item) => acc + (item.quantity || 0), 0);
});

module.exports = mongoose.model('Cart', CartSchema);
