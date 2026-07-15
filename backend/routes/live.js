const router         = require('express').Router();
const LiveSession    = require('../models/LiveSession');
const LiveAuditLog   = require('../models/LiveAuditLog');
const { protect }    = require('../middleware/auth');
const { protectUser } = require('../middleware/userAuth');

// SEC-05: Escape regex special characters to prevent ReDoS
function escapeRegex(str) {
  return String(str).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ── Audit helper ── */
async function logAudit(admin, action, session, changes = {}) {
  try {
    await LiveAuditLog.create({
      adminId:      admin?._id    || null,
      adminName:    admin?.name   || 'Admin',
      adminEmail:   admin?.email  || '',
      action,
      sessionId:    session?._id   || null,
      sessionTitle: session?.title || '',
      changes,
    });
  } catch { /* audit failures must never break main flow */ }
}

/* ── Public ── */

// Current active/upcoming session (navbar + live page)
// SEC-02: meetUrl is omitted — returned only via the authenticated join endpoint
router.get('/current', async (req, res) => {
  try {
    const session = await LiveSession.findOne({
      isEnabled: true,
      status: { $in: ['live', 'upcoming'] },
    }).sort({ date: 1, createdAt: -1 }).select('-meetUrl');
    res.json({ success: true, data: session || null });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Upcoming sessions list (meetUrl hidden)
router.get('/upcoming', async (req, res) => {
  try {
    const sessions = await LiveSession.find({ isEnabled: true, status: 'upcoming' })
      .sort({ date: 1 })
      .select('-meetUrl');
    res.json({ success: true, data: sessions });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Past sessions for /live history section
router.get('/past', async (req, res) => {
  try {
    const sessions = await LiveSession.find({
      isEnabled: true,
      status: { $in: ['ended', 'cancelled'] },
    })
      .sort({ date: -1 })
      .limit(6)
      .select('-meetUrl -announcements');
    res.json({ success: true, data: sessions });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── Admin CRUD (protected) ── */

// List all with search + status filter
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    // SEC-05: Escape regex to prevent ReDoS
    if (req.query.search) filter.title = { $regex: escapeRegex(req.query.search), $options: 'i' };
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
    const sessions = await LiveSession.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: sessions });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Create
router.post('/', protect, async (req, res) => {
  try {
    if (req.body.meetUrl?.trim()) {
      try { new URL(req.body.meetUrl); } catch {
        return res.status(400).json({ success: false, message: 'Invalid meeting URL — must start with https://' });
      }
    }
    const session = await LiveSession.create(req.body);
    await logAudit(req.admin, 'CREATE', session, req.body);
    res.status(201).json({ success: true, data: session });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// Update
router.put('/:id', protect, async (req, res) => {
  try {
    if (req.body.meetUrl?.trim()) {
      try { new URL(req.body.meetUrl); } catch {
        return res.status(400).json({ success: false, message: 'Invalid meeting URL — must start with https://' });
      }
    }
    const session = await LiveSession.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!session) return res.status(404).json({ success: false, message: 'Not found' });
    await logAudit(req.admin, 'UPDATE', session, req.body);
    res.json({ success: true, data: session });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// Delete
router.delete('/:id', protect, async (req, res) => {
  try {
    const session = await LiveSession.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Not found' });
    await logAudit(req.admin, 'DELETE', session);
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Add announcement
router.post('/:id/announcements', protect, async (req, res) => {
  try {
    const session = await LiveSession.findByIdAndUpdate(
      req.params.id,
      { $push: { announcements: { text: req.body.text, createdAt: new Date() } } },
      { new: true }
    );
    if (!session) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: session });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// Remove announcement
router.delete('/:id/announcements/:annId', protect, async (req, res) => {
  try {
    const session = await LiveSession.findByIdAndUpdate(
      req.params.id,
      { $pull: { announcements: { _id: req.params.annId } } },
      { new: true }
    );
    res.json({ success: true, data: session });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Audit log (admin only)
router.get('/audit-log', protect, async (req, res) => {
  try {
    const logs = await LiveAuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: logs });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// SEC-02: Authenticated join-url — only logged-in users receive the meeting link
router.get('/:id/join-url', protectUser, async (req, res) => {
  try {
    const session = await LiveSession.findOne({
      _id: req.params.id,
      isEnabled: true,
      status: { $in: ['live', 'upcoming'] },
    }).select('meetUrl status title');
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, meetUrl: session.meetUrl || '', status: session.status });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
