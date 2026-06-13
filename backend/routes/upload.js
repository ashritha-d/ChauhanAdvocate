const router = require('express').Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');

router.post('/', protect, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, url: req.file.path, filename: req.file.filename });
});

// Delete by Cloudinary public_id
router.delete('/:publicId', protect, async (req, res) => {
  try {
    const { cloudinary } = require('../middleware/upload');
    await cloudinary.uploader.destroy(req.params.publicId);
    res.json({ success: true, message: 'File deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
