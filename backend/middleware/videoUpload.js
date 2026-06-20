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
  cb(new Error('Unsupported format. Allowed: MP4, MOV, AVI, WEBM, MKV'));
};

module.exports = multer({ storage, fileFilter });
module.exports.cloudinary = cloudinary;
