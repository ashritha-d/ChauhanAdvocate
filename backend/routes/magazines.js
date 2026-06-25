const router       = require('express').Router();
const ctrl         = require('../controllers/magazineController');
const purchaseCtrl = require('../controllers/magazinePurchaseController');
const { protect }     = require('../middleware/auth');
const { protectUser } = require('../middleware/userAuth');
const upload = require('../middleware/upload');

const multiUpload = upload.fields([
  { name: 'coverImage',  maxCount: 1 },
  { name: 'pdfFile',     maxCount: 1 },
  { name: 'previewPdf',  maxCount: 1 },
  { name: 'fullPdf',     maxCount: 1 },
]);

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/',                 ctrl.getPublic);
router.get('/my-purchases',     protectUser, purchaseCtrl.getMyPurchases);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get('/admin/all',        protect, ctrl.getAll);
router.get('/stats',            protect, ctrl.getStats);
router.post('/bulk-delete',     protect, ctrl.bulkDelete);
router.post('/bulk-publish',    protect, ctrl.bulkPublish);
router.post('/',                protect, multiUpload, ctrl.create);
router.put('/:id',              protect, multiUpload, ctrl.update);
router.delete('/:id',           protect, ctrl.remove);

// ── Per-magazine: download & purchase (user auth) ─────────────────────────────
router.get('/:id/download/preview',              ctrl.downloadPreview);
router.get('/:id/download/full',                 protectUser, ctrl.downloadFull);
router.get('/:id/purchase/status',               protectUser, purchaseCtrl.checkPurchase);
router.post('/:id/purchase/manual',              protectUser, upload.single('screenshot'), purchaseCtrl.submitManualPurchase);
router.post('/:id/purchase/razorpay/create-order', protectUser, purchaseCtrl.createRazorpayOrder);
router.post('/:id/purchase/razorpay/verify',       protectUser, purchaseCtrl.verifyRazorpayPayment);

module.exports = router;
