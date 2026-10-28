const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  toggleWishlist,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { registerValidator, loginValidator } = require('../validators/authValidator');

router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.post('/wishlist/:productId', protect, toggleWishlist);

module.exports = router;
