const router = require('express').Router();
const { getServices, getAllServices, getService, createService, updateService, deleteService } = require('../controllers/serviceController');
const { protect } = require('../middleware/auth');

router.get('/', getServices);
router.get('/admin/all', protect, getAllServices);
router.get('/:id', getService);
router.post('/', protect, createService);
router.put('/:id', protect, updateService);
router.delete('/:id', protect, deleteService);

module.exports = router;
