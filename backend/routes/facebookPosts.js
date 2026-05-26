const router = require('express').Router();
const ctrl = require('../controllers/facebookPostController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', ctrl.getPublic);
router.get('/admin/all', protect, ctrl.getAll);
router.post('/', protect, upload.single('thumbnail'), ctrl.create);
router.put('/:id', protect, upload.single('thumbnail'), ctrl.update);
router.delete('/:id', protect, ctrl.remove);

module.exports = router;
