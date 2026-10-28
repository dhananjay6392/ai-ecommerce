const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

router.route('/')
  .get(getCategories)
  .post(protect, requireAdmin, createCategory);

router.route('/:id')
  .get(getCategoryById)
  .put(protect, requireAdmin, updateCategory)
  .delete(protect, requireAdmin, deleteCategory);

module.exports = router;
