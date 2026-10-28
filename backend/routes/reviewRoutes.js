const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { createReviewValidator } = require('../validators/reviewValidator');

// When mounted at /api/products/:productId/reviews
router.route('/')
  .get(getProductReviews)
  .post(protect, createReviewValidator, createReview);

// When mounted at /api/reviews
router.route('/:id')
  .put(protect, updateReview)
  .delete(protect, deleteReview);

module.exports = router;
