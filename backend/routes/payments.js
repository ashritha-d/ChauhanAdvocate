const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const {
  createPayment, getAllPayments, getPayment,
  updatePayment, deletePayment, getStats, getQRCode
} = require('../controllers/paymentController');

// Payment screenshot upload — saved to uploads/payments/
const paymentsDir = path.join(__dirname, '../uploads/payments');
if (!fs.existsSync(paymentsDir)) fs.mkdirSync(paymentsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, paymentsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'pay-' + unique + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|jpg|png|gif|webp)/.test(file.mimetype)) return cb(null, true);
    cb(new Error('Only images are allowed for payment screenshot'));
  }
});

router.get('/qr', getQRCode);                              // public — fetch QR image URL
router.post('/', upload.single('screenshot'), createPayment); // public — submit payment
router.get('/', protect, getAllPayments);
router.get('/stats', protect, getStats);
router.get('/:id', protect, getPayment);
router.put('/:id', protect, updatePayment);
router.delete('/:id', protect, deletePayment);

module.exports = router;
