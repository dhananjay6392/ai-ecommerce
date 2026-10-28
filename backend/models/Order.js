const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
    image: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

OrderItemSchema.pre('validate', function (next) {
  if (this.product && !this.productId) {
    this.productId = this.product;
  } else if (this.productId && !this.product) {
    this.product = this.productId;
  }
  next();
});

const ShippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, default: '' },
    name: { type: String, default: '' },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'India' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
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
    items: [OrderItemSchema],
    shippingAddress: {
      type: ShippingAddressSchema,
      required: true,
    },
    subtotal: {
      type: Number,
      default: 0,
      min: [0, 'Subtotal cannot be negative'],
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: [0, 'Shipping fee cannot be negative'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative'],
    },
    paymentMethod: {
      type: String,
      enum: ['RAZORPAY', 'COD', 'CARD', 'UPI', 'NETBANKING', 'razorpay', 'cod', 'card', 'upi'],
      default: 'RAZORPAY',
      uppercase: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      index: true,
      sparse: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'PENDING',
      uppercase: true,
      index: true,
    },
    orderStatus: {
      type: String,
      enum: [
        'PENDING',
        'CONFIRMED',
        'PROCESSING',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED',
        'Pending',
        'Confirmed',
        'Processing',
        'Shipped',
        'Delivered',
        'Cancelled',
      ],
      default: 'CONFIRMED',
      uppercase: true,
      index: true,
    },
    paymentId: {
      type: String,
      default: '',
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    razorpayOrderId: {
      type: String,
      index: true,
    },
    paidAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Sync user and userId and shipping address names
OrderSchema.pre('validate', function (next) {
  if (this.userId && !this.user) {
    this.user = this.userId;
  } else if (this.user && !this.userId) {
    this.userId = this.user;
  }

  if (this.shippingAddress) {
    if (this.shippingAddress.name && !this.shippingAddress.fullName) {
      this.shippingAddress.fullName = this.shippingAddress.name;
    } else if (this.shippingAddress.fullName && !this.shippingAddress.name) {
      this.shippingAddress.name = this.shippingAddress.fullName;
    }
  }

  next();
});

module.exports = mongoose.model('Order', OrderSchema);
