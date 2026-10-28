const UserActivity = require('../models/UserActivity');

// @desc    Log user interaction telemetry
// @route   POST /api/activity
// @access  Public / Optional Auth
exports.logActivity = async (req, res, next) => {
  try {
    const { productId, action, metadata = {} } = req.body;
    const sessionId = req.headers['x-session-id'] || req.body.sessionId || 'anon_session';

    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Interaction action type is required',
      });
    }

    const activity = await UserActivity.create({
      user: req.user ? req.user.id : null,
      userId: req.user ? req.user.id : null,
      sessionId,
      product: productId || null,
      productId: productId || null,
      action: action.toUpperCase(),
      metadata,
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Telemetry interaction logged successfully',
      data: activity,
    });
  } catch (err) {
    next(err);
  }
};
