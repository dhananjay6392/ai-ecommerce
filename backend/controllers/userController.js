const User = require('../models/User');

// Helper to format sanitized user object
const sanitizeUser = (user) => ({
  id: user._id,
  _id: user._id,
  name: user.name,
  email: user.email,
  role: (user.role || 'CUSTOMER').toUpperCase(),
  avatar: user.avatar || '',
  phone: user.phone || '',
  isActive: user.isActive !== false,
  address: user.address || {},
  addresses: user.addresses || [],
  wishlist: user.wishlist || [],
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('wishlist');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user: sanitizeUser(user), data: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.name = req.body.name ? req.body.name.trim() : user.name;
    user.phone = req.body.phone !== undefined ? req.body.phone.trim() : user.phone;
    user.avatar = req.body.avatar !== undefined ? req.body.avatar : user.avatar;

    if (req.body.address) {
      user.address = { ...user.address.toObject(), ...req.body.address };
    }

    const updatedUser = await user.save();
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: sanitizeUser(updatedUser),
      data: sanitizeUser(updatedUser),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update password
// @route   PUT /api/users/password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.',
      });
    }

    if (confirmPassword !== undefined && confirmPassword !== newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation does not match.',
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// ADDRESS MANAGEMENT CONTROLLERS
// ==========================================

// @desc    Get user addresses
// @route   GET /api/users/addresses
// @access  Private
exports.getAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      count: user.addresses.length,
      addresses: user.addresses,
      data: user.addresses,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add new address
// @route   POST /api/users/addresses
// @access  Private
exports.addAddress = async (req, res, next) => {
  try {
    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      street,
      city,
      state,
      postalCode,
      country,
      isDefault,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const shouldBeDefault = isDefault || user.addresses.length === 0;

    if (shouldBeDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    const newAddress = {
      fullName: fullName || user.name,
      phone: phone || user.phone,
      addressLine1: addressLine1 || street || '',
      addressLine2: addressLine2 || '',
      street: addressLine1 || street || '',
      city: city || '',
      state: state || '',
      postalCode: postalCode || '',
      country: country || 'India',
      isDefault: shouldBeDefault,
    };

    user.addresses.push(newAddress);

    // Keep primary user.address in sync
    if (shouldBeDefault) {
      user.address = newAddress;
    }

    await user.save();
    const createdAddress = user.addresses[user.addresses.length - 1];

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      address: createdAddress,
      addresses: user.addresses,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update address
// @route   PUT /api/users/addresses/:id
// @access  Private
exports.updateAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const address = user.addresses.id(req.params.id);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      street,
      city,
      state,
      postalCode,
      country,
      isDefault,
    } = req.body;

    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    if (fullName !== undefined) address.fullName = fullName;
    if (phone !== undefined) address.phone = phone;
    if (addressLine1 !== undefined) {
      address.addressLine1 = addressLine1;
      address.street = addressLine1;
    }
    if (street !== undefined && !addressLine1) {
      address.street = street;
      address.addressLine1 = street;
    }
    if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (postalCode !== undefined) address.postalCode = postalCode;
    if (country !== undefined) address.country = country;
    if (isDefault !== undefined) address.isDefault = isDefault;

    if (address.isDefault) {
      user.address = address;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      address,
      addresses: user.addresses,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete address
// @route   DELETE /api/users/addresses/:id
// @access  Private
exports.deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const addressIndex = user.addresses.findIndex(
      (a) => a._id.toString() === req.params.id
    );
    if (addressIndex === -1) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    const wasDefault = user.addresses[addressIndex].isDefault;
    user.addresses.splice(addressIndex, 1);

    // If deleted address was default and other addresses exist, set first as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
      user.address = user.addresses[0];
    } else if (user.addresses.length === 0) {
      user.address = {};
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address removed successfully',
      addresses: user.addresses,
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// ADMIN USER MANAGEMENT CONTROLLERS
// ==========================================

// @desc    Get all users with search, role filter, status filter (Admin only)
// @route   GET /api/admin/users or GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
    }

    if (role && role !== 'ALL') {
      filter.role = role.toUpperCase();
    }

    if (status !== undefined && status !== 'ALL') {
      if (status === 'active' || status === 'true') filter.isActive = true;
      if (status === 'inactive' || status === 'false') filter.isActive = false;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)) || 1,
      users: users.map(sanitizeUser),
      data: users.map(sanitizeUser),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single user by ID (Admin only)
// @route   GET /api/admin/users/:id or GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user: sanitizeUser(user), data: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user status / activate / deactivate (Admin only)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newActiveState = Boolean(req.body.isActive);

    // Safeguard: Do not allow deactivating the last active administrator
    if (!newActiveState && (user.role || '').toUpperCase() === 'ADMIN') {
      const activeAdmins = await User.countDocuments({
        role: { $in: ['ADMIN', 'admin'] },
        isActive: true,
      });

      if (activeAdmins <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Action blocked: Cannot deactivate the last active administrator.',
        });
      }
    }

    user.isActive = newActiveState;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User successfully ${user.isActive ? 'activated' : 'deactivated'}.`,
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If changing role from ADMIN to CUSTOMER, ensure at least one active admin remains
    if (
      req.body.role &&
      req.body.role.toUpperCase() !== 'ADMIN' &&
      (user.role || '').toUpperCase() === 'ADMIN'
    ) {
      const activeAdmins = await User.countDocuments({
        role: { $in: ['ADMIN', 'admin'] },
        isActive: true,
      });

      if (activeAdmins <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Action blocked: Cannot demote the last active administrator.',
        });
      }
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email ? req.body.email.toLowerCase().trim() : user.email;
    if (req.body.role) {
      user.role = req.body.role.toUpperCase();
    }
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
    if (req.body.isActive !== undefined) {
      user.isActive = Boolean(req.body.isActive);
    }

    const updatedUser = await user.save();
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: sanitizeUser(updatedUser),
      data: sanitizeUser(updatedUser),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Safeguard: Do not allow deleting the last active administrator
    if ((user.role || '').toUpperCase() === 'ADMIN') {
      const activeAdmins = await User.countDocuments({
        role: { $in: ['ADMIN', 'admin'] },
        isActive: true,
      });

      if (activeAdmins <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Action blocked: Cannot delete the last active administrator.',
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'User removed successfully' });
  } catch (err) {
    next(err);
  }
};
