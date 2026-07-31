const rateLimit = require('express-rate-limit');
const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { optionalUserAuth } = require('../middleware/userAuth');
const upload = require('../middleware/upload');
const qrUpload = require('../middleware/qrUpload');
const verifyTurnstile = require('../middleware/turnstile');
const {
  createPayment, getAllPayments, getPayment,
  updatePayment, deletePayment, getStats, getQRCode, uploadQRCode, deleteQRCode,
  getRevenue, exportPayments,
} = require('../controllers/paymentController');

// Only a Super Admin may manage the payment QR image
const superAdminOnly = [protect, authorize('superadmin')];
const {
  getPaymentSettings,
  createManualPayment,
  createBookManualPayment,
} = require('../controllers/razorpayController');

// SEC-03: Strict per-IP rate limit on public payment submission endpoints
const paymentSubmitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many payment submissions from this IP. Please try again in an hour.' },
});

// Public: payment settings (UPI ID, QR, bank details)
router.get('/payment-settings', getPaymentSettings);

// Public: manual UPI/QR/bank payment with optional screenshot
// Upload runs before verifyTurnstile so multer parses FormData (and req.body) first
router.post('/manual', paymentSubmitLimiter, optionalUserAuth, upload.single('screenshot'), verifyTurnstile, createManualPayment);

// Public: book order UPI/QR payment
router.post('/book-manual', paymentSubmitLimiter, optionalUserAuth, upload.single('screenshot'), verifyTurnstile, createBookManualPayment);

// Public: legacy QR submit (kept for book orders)
router.post('/', paymentSubmitLimiter, optionalUserAuth, upload.single('screenshot'), verifyTurnstile, createPayment);

// Public: get QR image URL
router.get('/qr', getQRCode);

// Super Admin: upload / replace / delete QR image
router.post('/qr', ...superAdminOnly, qrUpload.single('qrImage'), uploadQRCode);
router.put('/qr', ...superAdminOnly, qrUpload.single('qrImage'), uploadQRCode);
router.delete('/qr', ...superAdminOnly, deleteQRCode);

// Admin: revenue stats
router.get('/revenue', protect, getRevenue);

// Admin: export payments CSV
router.get('/export', protect, exportPayments);

// Admin: CRUD
router.get('/stats', protect, getStats);
router.get('/', protect, getAllPayments);
router.get('/:id', protect, getPayment);
router.put('/:id', protect, updatePayment);
router.delete('/:id', protect, deletePayment);

module.exports = router;
