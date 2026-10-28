const { protect, optionalAuth, authorize } = require('./authMiddleware');
const requireAdmin = require('./adminMiddleware');

module.exports = {
  protect,
  optionalAuth,
  authorize,
  requireAdmin,
};
