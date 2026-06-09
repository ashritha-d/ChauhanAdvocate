const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ALLOWED_EXTS = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
const MAX_SIZE = parseInt(process.env.MAX_VIDEO_SIZE) || 500 * 1024 * 1024; // 500 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/videos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'video-' + unique + path.extname(file.originalname).toLowerCase());
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTS.includes(ext)) return cb(null, true);
  cb(new Error('Unsupported format. Allowed: MP4, MOV, AVI, WEBM, MKV'));
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } });
