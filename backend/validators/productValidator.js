const { body } = require('express-validator');
const { validate } = require('./authValidator');

const createProductValidator = validate([
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').trim().notEmpty().withMessage('Product description is required'),
  body('brand').trim().notEmpty().withMessage('Brand is required'),
  body('category').notEmpty().withMessage('Category ID is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
]);

module.exports = {
  createProductValidator,
};
