const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating between 1 and 5'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    comment: {
      type: String,
      required: [true, 'Please provide review feedback text'],
      trim: true,
    },
    sentiment: {
      type: String,
      default: null,
    },
    sentimentScore: {
      type: Number,
      default: null,
    },
    sentimentConfidence: {
      type: Number,
      default: 0.9,
    },
    verifiedPurchase: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent user from submitting more than one review per product
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Sync user/userId and product/productId
ReviewSchema.pre('validate', function (next) {
  if (this.userId && !this.user) this.user = this.userId;
  if (this.user && !this.userId) this.userId = this.user;
  if (this.productId && !this.product) this.product = this.productId;
  if (this.product && !this.productId) this.productId = this.product;
  next();
});

// Recalculate average rating & review count for product
ReviewSchema.statics.getAverageRating = async function (prodId) {
  const targetId = prodId ? new mongoose.Types.ObjectId(prodId) : null;
  if (!targetId) return;

  const stats = await this.aggregate([
    {
      $match: { product: targetId },
    },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  try {
    if (stats.length > 0) {
      await mongoose.model('Product').findByIdAndUpdate(targetId, {
        averageRating: Math.round(stats[0].averageRating * 10) / 10,
        reviewCount: stats[0].reviewCount,
      });
    } else {
      await mongoose.model('Product').findByIdAndUpdate(targetId, {
        averageRating: 0,
        reviewCount: 0,
      });
    }
  } catch (err) {
    console.error('Error recalculating product average rating:', err);
  }
};

// Post-save and post-remove hooks
ReviewSchema.post('save', async function () {
  await this.constructor.getAverageRating(this.product);
});

ReviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.getAverageRating(doc.product);
  }
});

module.exports = mongoose.model('Review', ReviewSchema);
