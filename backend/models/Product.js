const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product title'],
      trim: true,
      maxlength: [200, 'Product title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a product description'],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, 'Please specify the brand'],
      trim: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please associate product with a category'],
      index: true,
    },
    categoryName: {
      type: String,
      default: '',
    },
    images: {
      type: [String],
      default: [],
    },
    thumbnail: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Please enter product price'],
      min: [0, 'Price cannot be negative'],
      index: true,
    },
    originalPrice: {
      type: Number,
      default: function () {
        return this.price;
      },
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: [0, 'Discount percentage cannot be negative'],
      max: [100, 'Discount percentage cannot exceed 100'],
    },
    discount: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      required: [true, 'Please enter current inventory stock'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
      index: true,
    },
    specifications: {
      type: Map,
      of: String,
      default: {},
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be greater than 5'],
      index: true,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    salesCount: {
      type: Number,
      default: 0,
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    trending: {
      type: Boolean,
      default: false,
      index: true,
    },
    minSafetyStock: {
      type: Number,
      default: 10,
    },
    reorderPoint: {
      type: Number,
      default: 15,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for discounted effective price
ProductSchema.virtual('finalPrice').get(function () {
  const disc = this.discountPercentage || this.discount || 0;
  if (disc > 0) {
    const discounted = this.price - (this.price * disc) / 100;
    return Math.round(discounted * 100) / 100;
  }
  return this.price;
});

// Auto-generate slug and sync discount aliases
ProductSchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Sync discount fields
  if (this.discountPercentage && !this.discount) {
    this.discount = this.discountPercentage;
  } else if (this.discount && !this.discountPercentage) {
    this.discountPercentage = this.discount;
  }

  // Sync featured fields
  if (this.featured && !this.isFeatured) {
    this.isFeatured = this.featured;
  } else if (this.isFeatured && !this.featured) {
    this.featured = this.isFeatured;
  }

  // Set default thumbnail if needed
  if ((!this.thumbnail || this.thumbnail === '') && this.images && this.images.length > 0) {
    this.thumbnail = this.images[0];
  }

  // Sync originalPrice if not set
  if (!this.originalPrice || this.originalPrice === 0) {
    this.originalPrice = this.price;
  }

  next();
});

// Text index for search
ProductSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
