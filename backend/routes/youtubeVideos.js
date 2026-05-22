const router = require('express').Router();
const ctrl = require('../controllers/youtubeVideoController');
const { protect } = require('../middleware/auth');

router.get('/', ctrl.getPublic);
router.get('/admin', protect, ctrl.getAll);
router.post('/', protect, ctrl.create);
router.put('/:id', protect, ctrl.update);
router.delete('/:id', protect, ctrl.remove);

module.exports = router;
