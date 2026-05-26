const router = require('express').Router();
const ctrl = require('../controllers/magazineController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', ctrl.getPublic);
router.get('/admin/all', protect, ctrl.getAll);
router.post('/', protect, upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'pdfFile', maxCount: 1 }]), ctrl.create);
router.put('/:id', protect, upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'pdfFile', maxCount: 1 }]), ctrl.update);
router.delete('/:id', protect, ctrl.remove);

module.exports = router;
