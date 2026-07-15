const router = require('express').Router();
const { login, logout, getMe, updateProfile, changePassword, seedAdmin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// SEC-01: Seed is development-only. Always returns 403 in production.
router.post('/seed', (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
}, seedAdmin);

module.exports = router;
