const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const UserNotification = require('../models/UserNotification');

// ── Public ────────────────────────────────────────────────────────────────────

exports.getPublicCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true })
      .select('-modules.videos.videoUrl')
      .sort({ isFeatured: -1, createdAt: -1 });
    res.json({ success: true, data: courses });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getPublicCourse = async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, isActive: true });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    // Hide video URLs for non-enrolled users
    const userId = req.user?._id;
    let enrollment = null;
    if (userId) {
      enrollment = await Enrollment.findOne({ userId, courseId: course._id, paymentStatus: 'paid' });
    }

    const courseObj = course.toObject();
    if (!enrollment) {
      // For non-enrolled users: expose only the very first video URL as a
      // free preview; all remaining videos are hidden until payment is made.
      let firstVideoSeen = false;
      courseObj.modules = courseObj.modules.map(m => ({
        ...m,
        videos: m.videos.map(v => {
          if (!firstVideoSeen && v.videoUrl) {
            firstVideoSeen = true;
            return { ...v }; // first video — full URL for preview
          }
          return { ...v, videoUrl: null }; // all others hidden
        }),
      }));
    }

    res.json({ success: true, data: courseObj, enrolled: !!enrollment });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── Enrollment ────────────────────────────────────────────────────────────────

exports.enrollCourse = async (req, res) => {
  try {
    const { courseId, paymentScreenshot, amountPaid } = req.body;
    const userId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const existing = await Enrollment.findOne({ userId, courseId });
    if (existing) {
      if (existing.paymentStatus === 'paid') {
        return res.json({ success: true, message: 'Already enrolled', data: existing });
      }
      existing.paymentStatus = 'pending_verification';
      existing.paymentScreenshot = paymentScreenshot || existing.paymentScreenshot;
      existing.amountPaid = amountPaid || course.price;
      await existing.save();
      return res.json({ success: true, message: 'Payment submitted for verification', data: existing });
    }

    const enrollment = await Enrollment.create({
      userId,
      courseId,
      paymentStatus: course.price === 0 ? 'paid' : 'pending_verification',
      paymentScreenshot: paymentScreenshot || '',
      amountPaid: amountPaid || course.price,
      enrolledAt: course.price === 0 ? new Date() : null,
    });

    if (course.price === 0) {
      await Course.findByIdAndUpdate(courseId, { $inc: { totalStudents: 1 } });
      await UserNotification.create({
        userId,
        title: 'Course Enrolled',
        message: `You have been enrolled in "${course.title}". Start learning now!`,
        type: 'general',
        referenceId: enrollment._id,
        referenceType: 'Enrollment',
      });
    } else {
      await UserNotification.create({
        userId,
        title: 'Payment Under Review',
        message: `Your payment for "${course.title}" is under review. You will get access once approved.`,
        type: 'general',
        referenceId: enrollment._id,
        referenceType: 'Enrollment',
      });
    }

    res.status(201).json({ success: true, message: course.price === 0 ? 'Enrolled successfully!' : 'Payment submitted for verification. Access will be granted after approval.', data: enrollment });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ success: false, message: 'Already enrolled' });
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ userId: req.user._id })
      .populate('courseId', 'title thumbnail price instructor modules duration')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: enrollments });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.updateProgress = async (req, res) => {
  try {
    const { courseId, videoId, moduleId } = req.body;
    const userId = req.user._id;

    const enrollment = await Enrollment.findOne({ userId, courseId, paymentStatus: 'paid' });
    if (!enrollment) return res.status(403).json({ success: false, message: 'Not enrolled' });

    const alreadyDone = enrollment.progress.some(p => p.videoId?.toString() === videoId);
    if (!alreadyDone) {
      enrollment.progress.push({ videoId, moduleId, completedAt: new Date() });
      enrollment.completedVideos = enrollment.progress.length;
    }
    enrollment.lastAccessedAt = new Date();
    await enrollment.save();

    res.json({ success: true, data: enrollment });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── Admin ─────────────────────────────────────────────────────────────────────

exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json({ success: true, data: courses });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, data: course });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, data: course });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Course deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getAllEnrollments = async (req, res) => {
  try {
    const { status, courseId } = req.query;
    const query = {};
    if (status) query.paymentStatus = status;
    if (courseId) query.courseId = courseId;
    const enrollments = await Enrollment.find(query)
      .populate('userId', 'name email phone')
      .populate('courseId', 'title price')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: enrollments });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.updateEnrollment = async (req, res) => {
  try {
    const existing = await Enrollment.findById(req.params.id).populate('userId', 'name').populate('courseId', 'title');
    if (!existing) return res.status(404).json({ success: false, message: 'Enrollment not found' });

    const { paymentStatus } = req.body;
    const wasNotPaid = existing.paymentStatus !== 'paid';

    const enrollment = await Enrollment.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (paymentStatus === 'paid' && wasNotPaid) {
      await Course.findByIdAndUpdate(existing.courseId._id, { $inc: { totalStudents: 1 } });
      await UserNotification.create({
        userId: existing.userId._id,
        title: 'Course Access Granted',
        message: `Your payment for "${existing.courseId.title}" has been approved. You can now access all course content!`,
        type: 'general',
        referenceId: existing._id,
        referenceType: 'Enrollment',
      });
      enrollment.enrolledAt = new Date();
      await enrollment.save();
    }

    if (paymentStatus === 'failed') {
      await UserNotification.create({
        userId: existing.userId._id,
        title: 'Payment Rejected',
        message: `Your payment for "${existing.courseId.title}" was not verified. Please resubmit or contact support.`,
        type: 'general',
        referenceId: existing._id,
        referenceType: 'Enrollment',
      });
    }

    res.json({ success: true, data: enrollment });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
