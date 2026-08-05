const router = require('express').Router();
const { getSettings, getSettingsByGroup, getAllSettings, updateSettings, seedSettings } = require('../controllers/siteSettingsController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getSettings);
router.get('/group/:group', getSettingsByGroup);
router.get('/admin/all', protect, getAllSettings);
router.put('/', protect, updateSettings);
// Development-only, same convention as auth.js's /seed — always 403 in production.
router.post('/seed', (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
}, seedSettings);
router.post('/upload', protect, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, url: req.file.path });
});

module.exports = router;
