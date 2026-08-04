const router = require('express').Router();
const { protectUser } = require('../middleware/userAuth');
const { protect } = require('../middleware/auth');
// BUG-03: Use the shared Cloudinary upload middleware — avatars now stored permanently in cloud storage
const upload = require('../middleware/upload');
const {
  register, login, forgotPassword, verifyOTP, resetPassword,
  getProfile, updateProfile, changePassword, uploadPhoto,
  getMyAppointments, getMyOrders,
  getNotifications, markNotificationRead, markAllNotificationsRead,
  adminGetUsers, adminGetUser, adminUpdateUserStatus, adminDeleteUser, adminSendNotification, adminResetUserPassword,
  refreshToken, logoutUser,
} = require('../controllers/userController');

// ── Public auth routes ────────────────────────────────────────────────────────
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.post('/refresh', refreshToken);
router.post('/logout', logoutUser);

// ── Protected user routes ─────────────────────────────────────────────────────
router.get('/profile', protectUser, getProfile);
router.put('/profile', protectUser, updateProfile);
router.put('/change-password', protectUser, changePassword);
router.post('/upload-photo', protectUser, upload.single('photo'), uploadPhoto);

router.get('/my-appointments', protectUser, getMyAppointments);
router.get('/my-orders', protectUser, getMyOrders);

router.get('/notifications', protectUser, getNotifications);
router.put('/notifications/mark-all-read', protectUser, markAllNotificationsRead);
router.put('/notifications/:id/read', protectUser, markNotificationRead);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get('/', protect, adminGetUsers);
router.get('/:id', protect, adminGetUser);
router.put('/:id/status', protect, adminUpdateUserStatus);
router.delete('/:id', protect, adminDeleteUser);
router.post('/:id/notify', protect, adminSendNotification);
router.put('/:id/reset-password', protect, adminResetUserPassword);

module.exports = router;
