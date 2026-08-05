const multer = require('multer');
const path   = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const mime = file.mimetype || '';
    let resource_type = 'image';
    if (mime.startsWith('video/'))  resource_type = 'video';
    else if (mime === 'application/pdf' || mime.includes('word') || mime.includes('document')) {
      resource_type = 'raw';
    }
    return {
      folder:        'advocate-chauhan',
      resource_type,
      // For images, auto-optimize quality & format; skip for raw/video
      ...(resource_type === 'image' ? { transformation: [{ quality: 'auto', fetch_format: 'auto' }] } : {}),
    };
  },
});

const fileFilter = (req, file, cb) => {
  const ext  = path.extname(file.originalname).toLowerCase().replace('.', '');
  const ok   = /^(jpeg|jpg|png|gif|webp|svg|pdf|mp4|mov|avi|doc|docx)$/.test(ext);
  if (ok) return cb(null, true);
  const err = new Error('File type not allowed');
  err.status = 400; // client input error, not a server failure
  cb(err);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 20 * 1024 * 1024 },
});

module.exports = upload;
module.exports.cloudinary = cloudinary;
