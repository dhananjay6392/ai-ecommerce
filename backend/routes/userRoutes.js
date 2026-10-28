const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  updatePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');
const { passwordUpdateValidator } = require('../validators/authValidator');

// User profile routes
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Password update route
router.route('/password')
  .put(protect, passwordUpdateValidator, updatePassword);

// Address management routes
router.route('/addresses')
  .get(protect, getAddresses)
  .post(protect, addAddress);

router.route('/addresses/:id')
  .put(protect, updateAddress)
  .delete(protect, deleteAddress);

// Admin user management routes (backward compatible mount)
router.route('/')
  .get(protect, requireAdmin, getAllUsers);

router.route('/:id')
  .get(protect, requireAdmin, getUserById)
  .put(protect, requireAdmin, updateUser)
  .delete(protect, requireAdmin, deleteUser);

module.exports = router;
