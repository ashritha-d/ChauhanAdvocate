const router = require('express').Router();
const { protect }     = require('../middleware/auth');
const { protectUser } = require('../middleware/userAuth');
const upload = require('../middleware/upload');
const {
  createPayment, getAllPayments, getPayment,
  updatePayment, deletePayment, getStats, getQRCode, uploadQRCode,
  getRevenue, exportPayments,
} = require('../controllers/paymentController');
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentSettings,
  createManualPayment,
} = require('../controllers/razorpayController');
const {
  createAppointmentOrder,
  getOrderStatus,
  webhookHandler,
  getWebhookLogs,
} = require('../controllers/cashfreeController');

// Public: payment settings (bank details, UPI ID, QR, env flags)
router.get('/payment-settings', getPaymentSettings);

// Public: Cashfree checkout flow
router.post('/cashfree/create-order', createAppointmentOrder);
router.post('/cashfree/webhook', webhookHandler);           // no auth — signature verified inside
router.get('/cashfree/order/:orderId', getOrderStatus);

// Public: manual bank transfer payment with optional screenshot
router.post('/manual', upload.single('screenshot'), createManualPayment);

// Public: Razorpay checkout flow (kept for fallback / legacy)
router.post('/razorpay/create-order', createRazorpayOrder);
router.post('/razorpay/verify', verifyRazorpayPayment);

// Admin: webhook audit logs
router.get('/webhook-logs', protect, getWebhookLogs);

// Public: legacy QR submit (kept for book orders)
router.post('/', upload.single('screenshot'), createPayment);

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
