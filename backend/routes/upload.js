const router = require('express').Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

router.post('/', protect, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: imageUrl, filename: req.file.filename });
});

router.delete('/:filename', protect, (req, res) => {
  const filePath = path.join(__dirname, '../uploads', req.params.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return res.json({ success: true, message: 'File deleted' });
  }
  res.status(404).json({ success: false, message: 'File not found' });
});

module.exports = router;
