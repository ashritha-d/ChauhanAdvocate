const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_EXTS = ['jpeg', 'jpg', 'png', 'webp'];

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'advocate-chauhan/payment-qr',
    resource_type: 'image',
    allowed_formats: ALLOWED_EXTS,
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  },
});

const fileFilter = (req, file, cb) => {
  const ext = file.originalname.split('.').pop().toLowerCase();
  if (ALLOWED_EXTS.includes(ext)) return cb(null, true);
  const err = new Error('Unsupported format. Allowed: PNG, JPG, JPEG, WEBP');
  err.status = 400; // client input error, not a server failure
  cb(err);
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
module.exports.cloudinary = cloudinary;
