const router = require('express').Router();
const ctrl = require('../controllers/draftPurchaseController');
const { protect } = require('../middleware/auth');
const { protectUser } = require('../middleware/userAuth');
const upload = require('../middleware/upload');

// User routes
router.post('/:draftId', protectUser, upload.single('screenshot'), ctrl.create);
router.get('/my', protectUser, ctrl.getMyPurchases);
router.get('/check/:draftId', protectUser, ctrl.checkStatus);

// Admin routes
router.get('/', protect, ctrl.getAll);
router.put('/:id', protect, ctrl.updateStatus);
router.delete('/:id', protect, ctrl.remove);

module.exports = router;
