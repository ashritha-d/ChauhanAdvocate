const router = require('express').Router();
const { createJrAdvocate, getAllJrAdvocates, getJrAdvocate, updateJrAdvocate, deleteJrAdvocate, getStats } = require('../controllers/jrAdvocateController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const upload = require('../middleware/upload');

const jrAdvocateValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('qualification').trim().notEmpty().withMessage('Qualification is required'),
  validate
];

router.post('/', upload.single('resume'), jrAdvocateValidation, createJrAdvocate);
router.get('/', protect, getAllJrAdvocates);
router.get('/stats', protect, getStats);
router.get('/:id', protect, getJrAdvocate);
router.put('/:id', protect, updateJrAdvocate);
router.delete('/:id', protect, deleteJrAdvocate);

module.exports = router;
