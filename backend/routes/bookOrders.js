const router = require('express').Router();
const { createBookOrder, getAllBookOrders, getBookOrder, updateBookOrder, deleteBookOrder, getStats } = require('../controllers/bookOrderController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

const bookOrderValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('bookTitle').trim().notEmpty().withMessage('Book title is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('address').trim().notEmpty().withMessage('Delivery address is required'),
  validate
];

router.post('/', bookOrderValidation, createBookOrder);
router.get('/', protect, getAllBookOrders);
router.get('/stats', protect, getStats);
router.get('/:id', protect, getBookOrder);
router.put('/:id', protect, updateBookOrder);
router.delete('/:id', protect, deleteBookOrder);

module.exports = router;
