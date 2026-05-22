const router = require('express').Router();
const { getSettings, getSettingsByGroup, getAllSettings, updateSettings, seedSettings } = require('../controllers/siteSettingsController');
const { protect } = require('../middleware/auth');

router.get('/', getSettings);
router.get('/group/:group', getSettingsByGroup);
router.get('/admin/all', protect, getAllSettings);
router.put('/', protect, updateSettings);
router.post('/seed', seedSettings);

module.exports = router;
