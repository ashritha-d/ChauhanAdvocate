const router = require('express').Router();
const { createOrder, getAllOrders, getOrder, updateOrder, deleteOrder, getStats } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const upload = require('../middleware/upload');

const orderValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('serviceType').notEmpty().withMessage('Service type is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  validate
];

router.post('/', upload.array('documents', 5), orderValidation, createOrder);
router.get('/', protect, getAllOrders);
router.get('/stats', protect, getStats);
router.get('/:id', protect, getOrder);
router.put('/:id', protect, updateOrder);
router.delete('/:id', protect, deleteOrder);

module.exports = router;
