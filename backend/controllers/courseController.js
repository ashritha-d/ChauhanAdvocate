const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const UserNotification = require('../models/UserNotification');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { URL } = require('url');
const { cloudinary } = require('../middleware/videoUpload');
const { generateVideoAccessToken, verifyVideoAccessToken } = require('../utils/videoAccess');

// Notifications are a side-effect of enrollment/payment state changes, not part of
// the transaction itself — a failure here (e.g. a schema/validation issue) must never
// block the enrollment update or the response the student/admin is waiting on.
async function notifyUser(data) {
  try {
    await UserNotification.create(data);
  } catch (e) {
    console.error('UserNotification.create failed (non-blocking):', e.message);
  }
}

// ── Public ────────────────────────────────────────────────────────────────────

// Drops admin-disabled videos entirely, then — for viewers without full access —
// strips the playable source from every video except the ones the admin explicitly
// flagged as a free preview (previously only the first video in the course was ever
// unlocked, ignoring the isPreview flag admins can set on any video).
//
// uploadedVideoPath (the raw Cloudinary URL) is stripped for EVERY viewer, even
// fully-authorized ones — it's never sent to the frontend at all. Playback instead
// goes through the token-based streaming endpoint (getVideoAccessToken/streamVideo),
// requested using courseId+videoId once the student actually presses play.
// `hasUpload` just tells the frontend "yes, request a stream token for this one."
function visibleVideos(modules, hasFullAccess) {
  return (modules || []).map(m => ({
    ...m,
    videos: (m.videos || [])
      .filter(v => v.isPublished !== false)
      .map(v => {
        const allowed = hasFullAccess || v.isPreview;
        return {
          ...v,
          uploadedVideoPath: undefined,
          hasUpload: !!v.uploadedVideoPath,
          videoUrl: allowed ? v.videoUrl : null,
        };
      }),
  }));
}

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
    courseObj.modules = visibleVideos(courseObj.modules, !!enrollment);

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
      await notifyUser({
        userId,
        title: 'Course Enrolled',
        message: `You have been enrolled in "${course.title}". Start learning now!`,
        type: 'general',
        referenceId: enrollment._id,
        referenceType: 'Enrollment',
      });
    } else {
      await notifyUser({
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
    // Hide admin-disabled videos here too — this populated `modules` is what the
    // frontend uses for totalVideos/progress-percentage math, so it must agree
    // with what the player and locked-list actually show.
    const data = enrollments.map(en => {
      const obj = en.toObject();
      if (obj.courseId?.modules) obj.courseId.modules = visibleVideos(obj.courseId.modules, true);
      return obj;
    });
    res.json({ success: true, data });
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

// Light sanity check on pasted video URLs — catches obvious typos/garbage without
// being strict about which providers are allowed (YouTube/Vimeo/Drive/direct MP4 all vary).
function findInvalidVideoUrl(modules) {
  for (const m of modules || []) {
    for (const v of m.videos || []) {
      if (v.videoUrl && !/^https?:\/\//i.test(v.videoUrl)) return v.videoUrl;
    }
  }
  return null;
}

exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json({ success: true, data: courses });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.createCourse = async (req, res) => {
  try {
    const badUrl = findInvalidVideoUrl(req.body.modules);
    if (badUrl) return res.status(400).json({ success: false, message: `Invalid video URL: "${badUrl}" must start with http:// or https://` });
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, data: course });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.updateCourse = async (req, res) => {
  try {
    const badUrl = findInvalidVideoUrl(req.body.modules);
    if (badUrl) return res.status(400).json({ success: false, message: `Invalid video URL: "${badUrl}" must start with http:// or https://` });
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
      await notifyUser({
        userId: existing.userId._id,
        title: 'Course Access Granted',
        message: `Your payment for "${existing.courseId.title}" has been approved. You can now access all course content!`,
        type: 'general',
        referenceId: existing._id,
        referenceType: 'Enrollment',
      });
    }

    if (paymentStatus === 'failed') {
      await notifyUser({
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

// ── Video streaming (protected — no raw Cloudinary URL ever reaches the frontend) ──

function findVideoInCourse(course, videoId) {
  for (const mod of course.modules || []) {
    const video = (mod.videos || []).find(v => v._id.toString() === videoId);
    if (video) return { video, module: mod };
  }
  return null;
}

// Fetches the video from Cloudinary server-side and pipes it straight through,
// forwarding the Range header so seeking/scrubbing works (206 Partial Content) —
// the actual Cloudinary URL is never sent to the client, only these bytes are.
function proxyVideo(cloudinaryUrl, req, res) {
  return new Promise((resolve, reject) => {
    const target = new URL(cloudinaryUrl);
    const options = {
      hostname: target.hostname,
      path: target.pathname + target.search,
      method: 'GET',
      headers: req.headers.range ? { range: req.headers.range } : {},
    };

    const proxyReq = https.request(options, proxyRes => {
      res.status(proxyRes.statusCode);
      ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control', 'etag', 'last-modified']
        .forEach(h => { if (proxyRes.headers[h]) res.set(h, proxyRes.headers[h]); });
      // 'inline' (not 'attachment') so the browser plays it rather than offering a save dialog.
      res.set('Content-Disposition', 'inline');
      proxyRes.pipe(res);
      proxyRes.on('end', resolve);
      proxyRes.on('error', reject);
    });
    proxyReq.on('error', err => {
      if (!res.headersSent) res.status(502).json({ success: false, message: 'Video streaming failed' });
      reject(err);
    });
    req.on('close', () => proxyReq.destroy());
    proxyReq.end();
  });
}

// Step 1 of the authorization chain: mint a short-lived, video-scoped token. Called
// with optionalUserAuth so an anonymous visitor can still get one for isPreview
// videos (preserving the existing "watch a free preview without logging in" UX) —
// anyone without full access is only ever granted a token for a preview video.
exports.getVideoAccessToken = async (req, res) => {
  try {
    const { courseId, videoId } = req.params;
    const course = await Course.findOne({ _id: courseId, isActive: true });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const found = findVideoInCourse(course, videoId);
    if (!found || found.video.isPublished === false) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }
    const { video } = found;
    if (video.videoSourceType !== 'upload' || !video.uploadedVideoPath) {
      return res.status(400).json({ success: false, message: 'This video is not served through the streaming endpoint' });
    }

    const userId = req.user?._id;
    let hasFullAccess = false;
    if (userId) {
      const enrollment = await Enrollment.findOne({ userId, courseId, paymentStatus: 'paid' });
      hasFullAccess = !!(enrollment && (!enrollment.expiresAt || enrollment.expiresAt > new Date()));
    }

    if (!hasFullAccess && !video.isPreview) {
      return res.status(403).json({
        success: false,
        message: userId ? 'You are not enrolled in this course, or your access has expired.' : 'Please log in and enroll to watch this video.',
      });
    }

    const token = generateVideoAccessToken({
      userId: userId ? userId.toString() : null,
      sessionId: req.user?.activeSessionId || null,
      courseId: course._id.toString(),
      videoId: video._id.toString(),
      preview: !hasFullAccess,
    });

    res.json({ success: true, streamUrl: `/courses/stream/${video._id}?token=${token}` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// The full authorization chain, isolated from response-writing/proxying so it can
// be unit-tested directly: authenticated -> enrolled -> access still valid ->
// authorized for this specific video -> allow. Every claim in the token is
// re-verified fresh against the DB here, never trusted at face value, so a
// still-time-valid token stops working the moment the underlying enrollment
// expires, the session is invalidated, or the video is unpublished — no token
// revocation list needed.
async function authorizeVideoStream(token, videoId) {
  if (!token) return { ok: false, status: 401, message: 'Missing access token' };

  let decoded;
  try { decoded = verifyVideoAccessToken(token); }
  catch { return { ok: false, status: 401, message: 'Invalid or expired video access token' }; }

  if (decoded.videoId !== videoId) {
    return { ok: false, status: 403, message: 'Token does not match requested video' };
  }

  const course = await Course.findOne({ _id: decoded.courseId, isActive: true });
  if (!course) return { ok: false, status: 404, message: 'Course not found' };
  const found = findVideoInCourse(course, videoId);
  if (!found || found.video.isPublished === false || !found.video.uploadedVideoPath) {
    return { ok: false, status: 404, message: 'Video not found' };
  }
  const { video } = found;

  if (decoded.preview) {
    if (!video.isPreview) {
      return { ok: false, status: 403, message: 'This video is no longer available as a preview' };
    }
  } else {
    if (!decoded.uid) return { ok: false, status: 401, message: 'Not authorized' };
    const user = await User.findById(decoded.uid).select('+activeSessionId');
    if (!user || !user.isActive) return { ok: false, status: 401, message: 'Account not found or deactivated' };
    if (decoded.sid && decoded.sid !== user.activeSessionId) {
      return { ok: false, status: 401, message: 'Session no longer active — logged in elsewhere or session expired' };
    }
    const enrollment = await Enrollment.findOne({ userId: decoded.uid, courseId: course._id, paymentStatus: 'paid' });
    const stillValid = enrollment && (!enrollment.expiresAt || enrollment.expiresAt > new Date());
    if (!stillValid) {
      return { ok: false, status: 403, message: 'Your enrollment is no longer active' };
    }
  }

  return { ok: true, video };
}
exports.authorizeVideoStream = authorizeVideoStream; // exported for direct testing

// Step 2: the actual streaming request from <video src>. Public route (a <video>
// tag cannot send an Authorization header) — authorization happens entirely via
// the token, checked by authorizeVideoStream above.
exports.streamVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { token } = req.query;
    const result = await authorizeVideoStream(token, videoId);
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });

    await proxyVideo(result.video.uploadedVideoPath, req, res);
  } catch (e) {
    if (!res.headersSent) res.status(500).json({ success: false, message: e.message });
  }
};
