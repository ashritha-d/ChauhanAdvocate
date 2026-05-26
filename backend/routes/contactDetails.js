const router = require('express').Router();
const ctrl = require('../controllers/contactDetailController');
const { protect } = require('../middleware/auth');

router.get('/', ctrl.getPublic);
router.get('/admin/all', protect, ctrl.getAll);
router.put('/', protect, ctrl.upsert);

module.exports = router;
