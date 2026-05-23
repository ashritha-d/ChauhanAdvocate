const router = require('express').Router();
const { protect } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const Order = require('../models/Order');
const JrAdvocate = require('../models/JrAdvocate');

router.get('/counts', protect, async (req, res) => {
  try {
    const [appointments, orders, jrAdvocates] = await Promise.all([
      Appointment.countDocuments({ isRead: false }),
      Order.countDocuments({ isRead: false }),
      JrAdvocate.countDocuments({ isRead: false })
    ]);
    const total = appointments + orders + jrAdvocates;
    res.json({ success: true, data: { appointments, orders, jrAdvocates, total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
