const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getFeaturedProducts,
  getTrendingProducts,
  getProductsByCategory,
  getBrands,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');
const { createProductValidator } = require('../validators/productValidator');

// Specific paths must be before /:id parameter
router.get('/search', searchProducts);
router.get('/featured', getFeaturedProducts);
router.get('/trending', getTrendingProducts);
router.get('/brands', getBrands);
router.get('/category/:category', getProductsByCategory);

router.route('/')
  .get(getProducts)
  .post(protect, requireAdmin, createProductValidator, createProduct);

router.route('/:id')
  .get(getProductById)
  .put(protect, requireAdmin, updateProduct)
  .delete(protect, requireAdmin, deleteProduct);

module.exports = router;
