const router = require('express').Router();
const ctrl = require('../controllers/internshipController');
const { protect } = require('../middleware/auth');
const { protectUser } = require('../middleware/userAuth');
const upload = require('../middleware/upload');

// Public: submit application with payment screenshot
router.post('/', upload.single('screenshot'), ctrl.create);

// User: my applications
router.get('/my-applications', protectUser, ctrl.getMyApplications);

// Admin: all applications + CRUD
router.get('/', protect, ctrl.getAll);
router.put('/:id', protect, ctrl.updateStatus);
router.delete('/:id', protect, ctrl.remove);

module.exports = router;
