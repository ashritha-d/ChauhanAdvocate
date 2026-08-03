const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const UserNotification = require('../models/UserNotification');
const path = require('path');
const fs = require('fs');
const { cloudinary } = require('../middleware/videoUpload');

// ── Public ────────────────────────────────────────────────────────────────────

exports.getPublicCourses = async (req, res) => {
  try {
    const query = { isActive: true };
    if (req.query.programType) query.programType = req.query.programType;
    const courses = await Course.find(query)
      .select('-modules.videos.videoUrl -modules.videos.uploadedVideoPath')
      .sort({ sortOrder: 1, isFeatured: -1, createdAt: -1 });
    res.json({ success: true, data: courses });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getPublicCourse = async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, isActive: true });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const userId = req.user?._id;
    let enrollment = null;
    let expired = false;
    if (userId) {
      const anyPaid = await Enrollment.findOne({ userId, courseId: course._id, paymentStatus: 'paid' });
      if (anyPaid) {
        if (anyPaid.expiresAt && anyPaid.expiresAt < new Date()) {
          expired = true; // was enrolled, access lapsed — render "Renew Enrollment", not "Enroll to Access"
        } else {
          enrollment = anyPaid;
        }
      }
    }

    const courseObj = course.toObject();
    if (!enrollment) {
      // Expose only the very first video (the free preview); hide everything else
      let firstVideoSeen = false;
      courseObj.modules = courseObj.modules.map(m => ({
        ...m,
        videos: m.videos.map(v => {
          if (!firstVideoSeen && (v.videoUrl || v.uploadedVideoPath)) {
            firstVideoSeen = true;
            return { ...v };
          }
          return { ...v, videoUrl: null, uploadedVideoPath: null };
        }),
      }));
    }

    res.json({ success: true, data: courseObj, enrolled: !!enrollment, expired });
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
      const isExpired = existing.expiresAt && existing.expiresAt < new Date();
      if (existing.paymentStatus === 'paid' && !isExpired) {
        return res.json({ success: true, message: 'Already enrolled', data: existing });
      }
      // Either never paid, or a paid enrollment that has lapsed — both go through
      // the same manual re-verification cycle (this is also how renewal works).
      existing.paymentStatus = 'pending_verification';
      existing.paymentScreenshot = paymentScreenshot || existing.paymentScreenshot;
      existing.amountPaid = amountPaid || course.price;
      await existing.save();
      return res.json({ success: true, message: 'Payment submitted for verification', data: existing });
    }

    const now = new Date();
    const isFree = course.price === 0;
    const validityDays = course.validityDays || 365;
    const enrollment = await Enrollment.create({
      userId,
      courseId,
      paymentStatus: isFree ? 'paid' : 'pending_verification',
      paymentScreenshot: paymentScreenshot || '',
      amountPaid: amountPaid || course.price,
      enrolledAt: isFree ? now : null,
      // Free courses skip admin approval (where expiry is normally set), so set it here —
      // otherwise a free enrollment would have expiresAt: null and never expire, unlike paid ones.
      expiresAt: isFree ? new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000) : null,
    });

    if (isFree) {
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

    res.status(201).json({
      success: true,
      message: isFree ? 'Enrolled successfully!' : 'Payment submitted for verification. Access will be granted after approval.',
      data: enrollment,
    });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ success: false, message: 'Already enrolled' });
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ userId: req.user._id })
      .populate('courseId', 'title thumbnail price discountPrice instructor modules duration language programType certificate')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: enrollments });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Lightweight "resume position" ping — separate from updateProgress (completion tracking)
exports.markLastWatched = async (req, res) => {
  try {
    const { courseId, videoId, moduleId } = req.body;
    const userId = req.user._id;
    const enrollment = await Enrollment.findOneAndUpdate(
      { userId, courseId, paymentStatus: 'paid' },
      { lastVideoId: videoId || null, lastModuleId: moduleId || null, lastAccessedAt: new Date() },
      { new: true }
    );
    if (!enrollment) return res.status(403).json({ success: false, message: 'Not enrolled' });
    res.json({ success: true, data: enrollment });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.saveNotes = async (req, res) => {
  try {
    const { notes } = req.body;
    const enrollment = await Enrollment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { notes: notes || '' },
      { new: true }
    );
    if (!enrollment) return res.status(404).json({ success: false, message: 'Enrollment not found' });
    res.json({ success: true, data: enrollment });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.markCertificateIssued = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { certificateIssued: true },
      { new: true }
    );
    if (!enrollment) return res.status(404).json({ success: false, message: 'Enrollment not found' });
    res.json({ success: true, data: enrollment });
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
    const enrollmentCount = await Enrollment.countDocuments({ courseId: req.params.id });
    if (enrollmentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete: ${enrollmentCount} student(s) are enrolled in this course. Deactivate it instead to hide it from new students while preserving existing enrollments.`,
      });
    }

    const course = await Course.findByIdAndDelete(req.params.id);
    // Clean up any uploaded video files belonging to this course
    if (course) {
      for (const mod of course.modules || []) {
        for (const vid of mod.videos || []) {
          if (!vid.uploadedVideoPath) continue;
          if (vid.uploadedVideoPath.startsWith('http')) {
            // Cloudinary asset — same public_id derivation as the dedicated deleteVideo endpoint
            const filename = vid.uploadedVideoPath.split('/').pop();
            const publicId = 'advocate-chauhan/videos/' + filename.replace(/\.[^.]+$/, '');
            try { await cloudinary.uploader.destroy(publicId, { resource_type: 'video' }); } catch (_) { /* asset may not exist */ }
          } else {
            // Legacy local file path (pre-Cloudinary uploads)
            const full = path.join(__dirname, '..', vid.uploadedVideoPath);
            if (fs.existsSync(full)) fs.unlinkSync(full);
          }
        }
      }
    }
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
      .populate('courseId', 'title price programType modules')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: enrollments });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.updateEnrollment = async (req, res) => {
  try {
    // Whitelist — this endpoint must never mass-assign arbitrary fields (userId, courseId,
    // progress, testScores, etc. must not be settable through here).
    const { paymentStatus, adminNotes } = req.body;
    const update = {};
    if (paymentStatus !== undefined) update.paymentStatus = paymentStatus;
    if (adminNotes !== undefined) update.adminNotes = adminNotes;

    const existing = await Enrollment.findById(req.params.id).populate('userId', 'name').populate('courseId', 'title validityDays');
    if (!existing) return res.status(404).json({ success: false, message: 'Enrollment not found' });

    const wasNotPaid = existing.paymentStatus !== 'paid';
    const isApproving = paymentStatus === 'paid' && wasNotPaid;

    if (isApproving) {
      const now = new Date();
      // Recomputed on every approval, so approving a renewal (re-submitted after expiry) extends access correctly
      const validityDays = existing.courseId?.validityDays || 365;
      update.enrolledAt = now;
      update.expiresAt = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);
    }

    // Atomic conditional update: if approving, only succeed if the enrollment is still
    // not-paid at write time — prevents two concurrent approvals from both incrementing
    // totalStudents / sending duplicate notifications for the same enrollment.
    const filter = { _id: req.params.id };
    if (isApproving) filter.paymentStatus = { $ne: 'paid' };
    const enrollment = await Enrollment.findOneAndUpdate(filter, update, { new: true });
    if (!enrollment) {
      // Lost the race — another request already approved it; return current state, not an error.
      const current = await Enrollment.findById(req.params.id);
      return res.json({ success: true, data: current });
    }

    if (isApproving) {
      await Course.findByIdAndUpdate(existing.courseId._id, { $inc: { totalStudents: 1 } });
      await UserNotification.create({
        userId: existing.userId._id,
        title: 'Course Access Granted',
        message: `Your payment for "${existing.courseId.title}" has been approved. You can now access all course content!`,
        type: 'general',
        referenceId: existing._id,
        referenceType: 'Enrollment',
      });
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

// ADMIN: log a student's test score (e.g. Judiciary mock tests) — self-reported/auto-grading is out of scope
exports.addTestScore = async (req, res) => {
  try {
    const { title, score, maxScore } = req.body;
    const numScore = Number(score);
    const numMaxScore = Number(maxScore);
    if (!title || typeof title !== 'string' || score === undefined || maxScore === undefined || Number.isNaN(numScore) || Number.isNaN(numMaxScore)) {
      return res.status(400).json({ success: false, message: 'title, score, and maxScore (numbers) are required' });
    }
    if (numScore < 0 || numMaxScore <= 0 || numScore > numMaxScore) {
      return res.status(400).json({ success: false, message: 'score must be between 0 and maxScore' });
    }
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { $push: { testScores: { title: title.trim(), score: numScore, maxScore: numMaxScore, date: new Date() } } },
      { new: true }
    );
    if (!enrollment) return res.status(404).json({ success: false, message: 'Enrollment not found' });
    res.json({ success: true, data: enrollment });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── Video Upload ──────────────────────────────────────────────────────────────

exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No video file provided' });
    // req.file.path  = Cloudinary secure_url
    // req.file.filename = Cloudinary public_id
    const sizeMB = req.file.size ? (req.file.size / (1024 * 1024)).toFixed(1) + ' MB' : '';
    res.json({
      success: true,
      path: req.file.path,       // Cloudinary URL — saved as uploadedVideoPath
      filename: req.file.filename, // Cloudinary public_id
      size: sizeMB,
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ADMIN: bulk video upload — one Course video entry per uploaded file
exports.uploadVideosBulk = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No video files provided' });
    }
    const results = req.files.map(f => ({
      path: f.path,
      filename: f.filename,
      originalName: f.originalname,
      size: f.size ? (f.size / (1024 * 1024)).toFixed(1) + ' MB' : '',
    }));
    res.json({ success: true, data: results });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.deleteVideo = async (req, res) => {
  try {
    const { filename } = req.params;
    if (!filename || filename.includes('..')) {
      return res.status(400).json({ success: false, message: 'Invalid filename' });
    }
    // Derive Cloudinary public_id from filename (strip extension)
    const publicId = 'advocate-chauhan/videos/' + filename.replace(/\.[^.]+$/, '');
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    } catch (_) {
      // File may not exist on Cloudinary (legacy local upload) — ignore
    }
    // Also clean up any legacy local file
    const fullPath = path.join(__dirname, '../uploads/videos', filename);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
