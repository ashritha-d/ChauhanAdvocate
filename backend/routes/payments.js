const rateLimit = require('express-rate-limit');
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { optionalUserAuth } = require('../middleware/userAuth');
const upload = require('../middleware/upload');
const verifyTurnstile = require('../middleware/turnstile');
const {
  createPayment, getAllPayments, getPayment,
  updatePayment, deletePayment, getStats, getQRCode, uploadQRCode,
  getRevenue, exportPayments,
} = require('../controllers/paymentController');
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

// Admin: upload QR image
router.post('/qr', protect, upload.single('qrImage'), uploadQRCode);

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
