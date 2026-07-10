const router = require('express').Router();
const { getSettings, getSettingsByGroup, getAllSettings, updateSettings, seedSettings } = require('../controllers/siteSettingsController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getSettings);
router.get('/group/:group', getSettingsByGroup);
router.get('/admin/all', protect, getAllSettings);
router.put('/', protect, updateSettings);
router.post('/seed', seedSettings);
router.post('/upload', protect, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, url: req.file.path });
});

module.exports = router;
