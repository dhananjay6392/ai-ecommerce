const mongoose = require('mongoose');

const UserActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    sessionId: {
      type: String,
      index: true,
      default: '',
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      index: true,
      default: null,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      index: true,
      default: null,
    },
    action: {
      type: String,
      enum: [
        'VIEW_PRODUCT',
        'SEARCH',
        'ADD_TO_CART',
        'REMOVE_FROM_CART',
        'WISHLIST',
        'PURCHASE',
        'VIEW', // Backward compatibility alias for VIEW_PRODUCT
      ],
      required: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

UserActivitySchema.pre('validate', function (next) {
  if (this.userId && !this.user) this.user = this.userId;
  if (this.user && !this.userId) this.userId = this.user;
  if (this.productId && !this.product) this.product = this.productId;
  if (this.product && !this.productId) this.productId = this.product;
  if (this.action === 'VIEW') this.action = 'VIEW_PRODUCT';
  next();
});

UserActivitySchema.index({ user: 1, action: 1, timestamp: -1 });
UserActivitySchema.index({ product: 1, action: 1 });

module.exports = mongoose.model('UserActivity', UserActivitySchema);
