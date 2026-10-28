const express = require('express');
const router = express.Router();
const {
  getRecommendations,
  getInventoryIntelligence,
  getSentimentOverview,
  getBenchmarks,
} = require('../controllers/mlController');
const { optionalAuth, protect, authorize } = require('../middleware/auth');

router.get('/recommendations', optionalAuth, getRecommendations);
router.get('/benchmarks', getBenchmarks);
router.get('/inventory-intelligence', protect, authorize('admin'), getInventoryIntelligence);
router.get('/sentiment-overview', protect, authorize('admin'), getSentimentOverview);

module.exports = router;
