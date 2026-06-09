const router = require('express').Router();
const ctrl = require('../controllers/magazineController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const multiUpload = upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'pdfFile', maxCount: 1 }]);

router.get('/',            ctrl.getPublic);
router.get('/admin/all',   protect, ctrl.getAll);
router.post('/bulk-delete', protect, ctrl.bulkDelete);
router.post('/bulk-publish', protect, ctrl.bulkPublish);
router.post('/',           protect, multiUpload, ctrl.create);
router.put('/:id',         protect, multiUpload, ctrl.update);
router.delete('/:id',      protect, ctrl.remove);

module.exports = router;
