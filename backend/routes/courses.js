const router = require('express').Router();
const c = require('../controllers/courseController');
const { protect } = require('../middleware/auth');           // admin
const { protectUser } = require('../middleware/userAuth');   // user

// Public — no auth needed
router.get('/public', c.getPublicCourses);

// Public course detail — optional user auth (to check enrollment)
router.get('/public/:id', (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer')) {
    return require('../middleware/userAuth').protectUser(req, res, next);
  }
  next();
}, c.getPublicCourse);

// User routes
router.post('/enroll', protectUser, c.enrollCourse);
router.get('/my-enrollments', protectUser, c.getMyEnrollments);
router.post('/progress', protectUser, c.updateProgress);

// Admin routes
router.get('/enrollments/all', protect, c.getAllEnrollments);
router.put('/enrollments/:id', protect, c.updateEnrollment);
router.get('/', protect, c.getAllCourses);
router.post('/', protect, c.createCourse);
router.put('/:id', protect, c.updateCourse);
router.delete('/:id', protect, c.deleteCourse);

module.exports = router;
