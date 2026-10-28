const { body } = require('express-validator');
const { validate } = require('./authValidator');

const createReviewValidator = validate([
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
  body('comment').trim().notEmpty().withMessage('Review comment is required'),
]);

module.exports = {
  createReviewValidator,
};
