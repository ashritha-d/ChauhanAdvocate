const router = require('express').Router();
const { createAppointment, getAllAppointments, getAppointment, updateAppointment, deleteAppointment, getStats, getAvailableSlots, deleteAllAppointments } = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

const appointmentValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('service').notEmpty().withMessage('Service is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').notEmpty().withMessage('Time is required'),
  validate
];

router.get('/available-slots', getAvailableSlots);
router.post('/', appointmentValidation, createAppointment);
router.get('/', protect, getAllAppointments);
router.get('/stats', protect, getStats);
router.get('/:id', protect, getAppointment);
router.put('/:id', protect, updateAppointment);
router.delete('/delete-all', protect, deleteAllAppointments);
router.delete('/:id', protect, deleteAppointment);

module.exports = router;
