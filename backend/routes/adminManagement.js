const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl  = require('../controllers/adminManagementController');
const audit = require('../controllers/auditLogController');

const superAdmin = [protect, authorize('superadmin')];

router.get('/stats',                     ...superAdmin, ctrl.getStats);
router.get('/',                          ...superAdmin, ctrl.getAllAdmins);
router.post('/',                         ...superAdmin, ctrl.createAdmin);
router.put('/:id',                       ...superAdmin, ctrl.updateAdmin);
router.put('/:id/reset-password',        ...superAdmin, ctrl.resetPassword);
router.put('/:id/toggle-status',         ...superAdmin, ctrl.toggleStatus);
router.delete('/:id',                    ...superAdmin, ctrl.deleteAdmin);
router.get('/audit-logs',                ...superAdmin, audit.getLogs);

module.exports = router;
