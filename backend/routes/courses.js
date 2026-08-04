const router = require('express').Router();
const c = require('../controllers/courseController');
const { protect } = require('../middleware/auth');           // admin
const { protectUser, optionalUserAuth } = require('../middleware/userAuth');   // user
const videoUpload = require('../middleware/videoUpload');

// Public — no auth needed
router.get('/public', c.getPublicCourses);

// Video streaming — the frontend never receives a raw Cloudinary URL. It first
// asks for a short-lived, video-scoped access token (optionalUserAuth: logged-out
// visitors can still get one for isPreview videos), then <video src> points at the
// stream endpoint with that token — which is what a <video> tag can actually send,
// since it can't attach an Authorization header.
router.get('/:courseId/videos/:videoId/access-token', optionalUserAuth, c.getVideoAccessToken);
router.get('/stream/:videoId', c.streamVideo);

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
router.post('/last-watched', protectUser, c.markLastWatched);
router.put('/enrollments/:id/notes', protectUser, c.saveNotes);
router.put('/enrollments/:id/certificate-issued', protectUser, c.markCertificateIssued);

// Admin — video upload/delete (must come before /:id routes)
router.post('/upload-video', protect, videoUpload.single('video'), c.uploadVideo);
router.delete('/delete-video/:filename', protect, c.deleteVideo);

// Admin — enrollment management
router.get('/enrollments/all', protect, c.getAllEnrollments);
router.put('/enrollments/:id', protect, c.updateEnrollment);
router.post('/enrollments/:id/test-scores', protect, c.addTestScore);

// Admin — course CRUD
router.get('/', protect, c.getAllCourses);
router.post('/', protect, c.createCourse);
router.put('/:id', protect, c.updateCourse);
router.delete('/:id', protect, c.deleteCourse);

module.exports = router;
