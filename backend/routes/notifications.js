const router = require('express').Router();
const { protect } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const Order = require('../models/Order');
const JrAdvocate = require('../models/JrAdvocate');
const BookOrder = require('../models/BookOrder');
const Enrollment = require('../models/Enrollment');
const Magazine = require('../models/Magazine');
const Draft = require('../models/Draft');

router.get('/counts', protect, async (req, res) => {
  try {
    const [appointments, orders, jrAdvocates, bookOrders] = await Promise.all([
      Appointment.countDocuments({ isRead: false }),
      Order.countDocuments({ isRead: false }),
      JrAdvocate.countDocuments({ isRead: false }),
      BookOrder.countDocuments({ isRead: false })
    ]);
    const total = appointments + orders + jrAdvocates + bookOrders;
    res.json({ success: true, data: { appointments, orders, jrAdvocates, bookOrders, total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/analytics', protect, async (req, res) => {
  try {
    const { filter = 'all', from, to } = req.query;
    const now = new Date();

    let dateFilter = {};
    if (filter === 'today') {
      const s = new Date(now); s.setHours(0, 0, 0, 0);
      const e = new Date(now); e.setHours(23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: s, $lte: e } };
    } else if (filter === 'week') {
      const s = new Date(now);
      s.setDate(now.getDate() - now.getDay());
      s.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: s } };
    } else if (filter === 'month') {
      dateFilter = { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } };
    } else if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.$gte = new Date(from);
      if (to) {
        const e = new Date(to);
        e.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = e;
      }
    }

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayFilter = { createdAt: { $gte: todayStart } };

    const [
      apptTotal, jrTotal, bookTotal, courseTotal, magTotal, draftTotal,
      apptPending, jrPending, bookPending,
      apptRead, jrRead, bookRead,
      apptToday, jrToday, bookToday, courseToday, magToday, draftToday
    ] = await Promise.all([
      Appointment.countDocuments(dateFilter),
      JrAdvocate.countDocuments(dateFilter),
      BookOrder.countDocuments(dateFilter),
      Enrollment.countDocuments(dateFilter),
      Magazine.countDocuments(dateFilter),
      Draft.countDocuments(dateFilter),
      Appointment.countDocuments({ ...dateFilter, isRead: false }),
      JrAdvocate.countDocuments({ ...dateFilter, isRead: false }),
      BookOrder.countDocuments({ ...dateFilter, isRead: false }),
      Appointment.countDocuments({ ...dateFilter, isRead: true }),
      JrAdvocate.countDocuments({ ...dateFilter, isRead: true }),
      BookOrder.countDocuments({ ...dateFilter, isRead: true }),
      Appointment.countDocuments(todayFilter),
      JrAdvocate.countDocuments(todayFilter),
      BookOrder.countDocuments(todayFilter),
      Enrollment.countDocuments(todayFilter),
      Magazine.countDocuments(todayFilter),
      Draft.countDocuments(todayFilter),
    ]);

    const categories = [
      { key: 'appointments',      label: 'Appointments',              count: apptTotal,   pageKey: 'appointments' },
      { key: 'jrAdvocates',       label: 'Jr. Advocate Applications', count: jrTotal,     pageKey: 'jradvocates' },
      { key: 'bookOrders',        label: 'Book Orders',               count: bookTotal,   pageKey: 'bookorders' },
      { key: 'courseEnrollments', label: 'Course Enrollments',        count: courseTotal, pageKey: 'courses' },
      { key: 'magazineOrders',    label: 'Magazine Orders',           count: magTotal,    pageKey: 'magazines' },
      { key: 'draftPurchases',    label: 'Draft Purchases',           count: draftTotal,  pageKey: 'drafts' },
    ];

    const total    = categories.reduce((s, c) => s + c.count, 0);
    const pending  = apptPending + jrPending + bookPending;
    const read     = apptRead + jrRead + bookRead;
    const todayTotal = apptToday + jrToday + bookToday + courseToday + magToday + draftToday;

    res.json({
      success: true,
      data: {
        categories,
        summary: { total, pending, read, todayTotal }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
