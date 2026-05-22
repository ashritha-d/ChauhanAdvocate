const router = require('express').Router();
const { submitContact, getAllContacts, getContact, updateContact, deleteContact, getUnreadCount } = require('../controllers/contactController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

const contactValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required'),
  validate
];

router.post('/', contactValidation, submitContact);
router.get('/', protect, getAllContacts);
router.get('/unread-count', protect, getUnreadCount);
router.get('/:id', protect, getContact);
router.put('/:id', protect, updateContact);
router.delete('/:id', protect, deleteContact);

module.exports = router;
