const router      = require('express').Router();
const LiveSession = require('../models/LiveSession');
const { protect } = require('../middleware/auth');

/* ── Public ── */

// Current active/upcoming session (for navbar status + live page)
router.get('/current', async (req, res) => {
  try {
    const session = await LiveSession.findOne({
      isEnabled: true,
      status: { $in: ['live', 'upcoming'] },
    }).sort({ date: 1, createdAt: -1 });
    res.json({ success: true, data: session || null });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Upcoming sessions list
router.get('/upcoming', async (req, res) => {
  try {
    const sessions = await LiveSession.find({ isEnabled: true, status: 'upcoming' })
      .sort({ date: 1 })
      .select('-meetUrl');          // hide meet URL from public upcoming list
    res.json({ success: true, data: sessions });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── Admin CRUD (protected) ── */

router.get('/', protect, async (req, res) => {
  try {
    const sessions = await LiveSession.find().sort({ createdAt: -1 });
    res.json({ success: true, data: sessions });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const session = await LiveSession.create(req.body);
    res.status(201).json({ success: true, data: session });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const session = await LiveSession.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!session) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: session });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const session = await LiveSession.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Add announcement to a session
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

// Remove an announcement
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

module.exports = router;
