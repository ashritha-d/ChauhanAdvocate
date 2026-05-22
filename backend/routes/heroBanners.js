const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/heroBannerController');
const { protect } = require('../middleware/auth');

router.get('/', ctrl.getAll);
router.get('/admin', protect, ctrl.getAdminAll);
router.post('/', protect, ctrl.create);
router.put('/:id', protect, ctrl.update);
router.delete('/:id', protect, ctrl.remove);

module.exports = router;
