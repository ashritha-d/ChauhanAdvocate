const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_EXTS = ['mp4', 'mov', 'avi', 'webm', 'mkv'];

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'advocate-chauhan/videos',
    resource_type: 'video',
    allowed_formats: ALLOWED_EXTS,
  },
});

const fileFilter = (req, file, cb) => {
  const ext = file.originalname.split('.').pop().toLowerCase();
  if (ALLOWED_EXTS.includes(ext)) return cb(null, true);
  const err = new Error('Unsupported format. Allowed: MP4, MOV, AVI, WEBM, MKV');
  err.status = 400; // client input error, not a server failure
  cb(err);
};

// Server-side backstop matching the admin UI's client-side MAX_VIDEO_MB check (previously
// enforced only in the browser — a client could bypass it entirely).
const MAX_VIDEO_MB = parseInt(process.env.MAX_VIDEO_MB) || 500;

module.exports = multer({ storage, fileFilter, limits: { fileSize: MAX_VIDEO_MB * 1024 * 1024 } });
module.exports.cloudinary = cloudinary;
