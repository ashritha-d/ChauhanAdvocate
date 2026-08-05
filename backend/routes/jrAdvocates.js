const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createJrAdvocate, getAllJrAdvocates, getJrAdvocate, updateJrAdvocate, deleteJrAdvocate, getStats, getMyApplications } = require('../controllers/jrAdvocateController');
const { protect } = require('../middleware/auth');
const { protectUser } = require('../middleware/userAuth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

// ── File upload config ────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'resume') {
    const allowed = /pdf|doc|docx/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else { const err = new Error('Resume must be PDF, DOC, or DOCX'); err.status = 400; cb(err); }
  } else if (file.fieldname === 'passportPhoto') {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else { const err = new Error('Photo must be JPG, PNG, or WebP'); err.status = 400; cb(err); }
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadFields = upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'passportPhoto', maxCount: 1 },
]);

// ── Validation ────────────────────────────────────────────────────────────────
const jrAdvocateValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('qualification').trim().notEmpty().withMessage('Qualification is required'),
  validate
];

// ── Routes ────────────────────────────────────────────────────────────────────
router.post('/', uploadFields, jrAdvocateValidation, createJrAdvocate);
router.get('/my-applications', protectUser, getMyApplications);
router.get('/', protect, getAllJrAdvocates);
router.get('/stats', protect, getStats);
router.get('/:id', protect, getJrAdvocate);
router.put('/:id', protect, updateJrAdvocate);
router.delete('/:id', protect, deleteJrAdvocate);

module.exports = router;
