const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protectUser } = require('../middleware/userAuth');
const { protect } = require('../middleware/auth');
const {
  register, login, forgotPassword, verifyOTP, resetPassword,
  getProfile, updateProfile, changePassword, uploadPhoto,
  getMyAppointments, getMyOrders,
  getNotifications, markNotificationRead, markAllNotificationsRead,
  adminGetUsers, adminGetUser, adminUpdateUserStatus, adminDeleteUser, adminSendNotification,
} = require('../controllers/userController');

// ── Avatar upload config ──────────────────────────────────────────────────────
const avatarsDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-${req.user._id}-${Date.now()}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|png|webp|gif)/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// ── Public auth routes ────────────────────────────────────────────────────────
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

// ── Protected user routes ─────────────────────────────────────────────────────
router.get('/profile', protectUser, getProfile);
router.put('/profile', protectUser, updateProfile);
router.put('/change-password', protectUser, changePassword);
router.post('/upload-photo', protectUser, avatarUpload.single('photo'), uploadPhoto);

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

module.exports = router;
