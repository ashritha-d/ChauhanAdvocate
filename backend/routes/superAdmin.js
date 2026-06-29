const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/superAdminController');

const sa = [protect, authorize('superadmin')];

router.get('/dashboard-stats',   ...sa, ctrl.getDashboardStats);
router.get('/system-health',     ...sa, ctrl.getSystemHealth);
router.get('/feature-toggles',   ...sa, ctrl.getFeatureToggles);
router.put('/feature-toggles',   ...sa, ctrl.updateFeatureToggles);
router.get('/analytics',         ...sa, ctrl.getAnalytics);

module.exports = router;
