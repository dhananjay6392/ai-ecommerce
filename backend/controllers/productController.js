const Product = require('../models/Product');
const Category = require('../models/Category');

// @desc    Get all products with full filtering, sorting & pagination
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      rating,
      inStock,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};

    // Keyword search (name, description, brand, tags)
    if (search && search.trim() !== '') {
      const q = search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
      ];
    }

    // Category filter (slug or ObjectId)
    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        const cat = await Category.findOne({ slug: category.toLowerCase().trim() });
        if (cat) {
          query.category = cat._id;
        } else {
          // No matching category -> return empty results
          return res.status(200).json({
            success: true,
            products: [],
            total: 0,
            totalPages: 0,
            pagination: { page: Number(page), limit: Number(limit), total: 0, totalPages: 0 },
          });
        }
      }
    }

    // Brand filter (supports comma-separated multi-brand)
    if (brand) {
      const brandList = brand.split(',').map((b) => b.trim());
      query.brand = { $in: brandList.map((b) => new RegExp(`^${b}$`, 'i')) };
    }

    // Price range filter
    if (minPrice !== undefined && minPrice !== '' || maxPrice !== undefined && maxPrice !== '') {
      query.price = {};
      if (minPrice !== undefined && minPrice !== '') query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined && maxPrice !== '') query.price.$lte = Number(maxPrice);
    }

    // Customer rating filter
    if (rating !== undefined && rating !== '') {
      query.averageRating = { $gte: Number(rating) };
    }

    // Stock availability filter
    if (inStock === 'true' || inStock === true) {
      query.stock = { $gt: 0 };
    }

    // Sorting options
    let sortOption = { createdAt: -1 };
    switch (sort) {
      case 'price-asc':
      case 'price_asc':
        sortOption = { price: 1 };
        break;
      case 'price-desc':
      case 'price_desc':
        sortOption = { price: -1 };
        break;
      case 'rating':
        sortOption = { averageRating: -1 };
        break;
      case 'sales':
      case 'popular':
        sortOption = { salesCount: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'featured':
      default:
        sortOption = { featured: -1, salesCount: -1, createdAt: -1 };
        break;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      products,
      data: products,
      total,
      totalPages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single product by ID or slug
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let product;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id).populate('category', 'name slug description image');
    } else {
      product = await Product.findOne({ slug: id }).populate('category', 'name slug description image');
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with id or slug: ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      product,
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
exports.searchProducts = async (req, res, next) => {
  try {
    const { q = '', limit = 10 } = req.query;
    if (!q.trim()) {
      return res.status(200).json({ success: true, products: [], data: [] });
    }

    const regex = new RegExp(q.trim(), 'i');
    const products = await Product.find({
      $or: [{ name: regex }, { brand: regex }, { tags: regex }, { description: regex }],
    })
      .populate('category', 'name slug')
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: products.length,
      products,
      data: products,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 6;
    const products = await Product.find({ $or: [{ featured: true }, { isFeatured: true }] })
      .populate('category', 'name slug')
      .sort({ salesCount: -1, averageRating: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: products.length,
      products,
      data: products,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get trending products
// @route   GET /api/products/trending
// @access  Public
exports.getTrendingProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 6;
    const products = await Product.find({ trending: true })
      .populate('category', 'name slug')
      .sort({ salesCount: -1, averageRating: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: products.length,
      products,
      data: products,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
exports.getProductsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    let catId = category;

    if (!category.match(/^[0-9a-fA-F]{24}$/)) {
      const cat = await Category.findOne({ slug: category.toLowerCase().trim() });
      if (!cat) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      catId = cat._id;
    }

    const products = await Product.find({ category: catId }).populate('category', 'name slug');
    res.status(200).json({
      success: true,
      count: products.length,
      products,
      data: products,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get list of unique product brands
// @route   GET /api/products/brands
// @access  Public
exports.getBrands = async (req, res, next) => {
  try {
    const brands = await Product.distinct('brand');
    res.status(200).json({
      success: true,
      brands: brands.sort(),
      data: brands.sort(),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new product (Admin only)
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);

    // Increment category productCount
    if (product.category) {
      await Category.findByIdAndUpdate(product.category, { $inc: { productCount: 1 } });
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update product (Admin only)
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with id of ${req.params.id}`,
      });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product,
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete product (Admin only)
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with id of ${req.params.id}`,
      });
    }

    if (product.category) {
      await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
