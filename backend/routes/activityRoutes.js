const express = require('express');
const router = express.Router();
const { logActivity } = require('../controllers/activityController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.post('/', optionalAuth, logActivity);
router.post('/log', optionalAuth, logActivity); // Alias for compatibility

module.exports = router;
