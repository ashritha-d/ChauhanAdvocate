const router = require('express').Router();
const { login, getMe, updateProfile, changePassword, seedAdmin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.post('/seed', seedAdmin);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
