const mongoose = require('mongoose');
const User        = require('../models/User');
const Admin       = require('../models/Admin');
const Appointment = require('../models/Appointment');
const Payment     = require('../models/Payment');
const Book        = require('../models/Book');
const Magazine    = require('../models/Magazine');
const Draft       = require('../models/Draft');
const AuditLog    = require('../models/AuditLog');
const SiteSettings = require('../models/SiteSettings');

/* ── Dashboard aggregate stats ──────────────────────────────────────── */
exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      totalUsers, activeUsers, newUsersThisMonth,
      totalAdmins, activeAdmins,
      totalAppt, pendingAppt, confirmedAppt, completedAppt, cancelledAppt,
      totalPayments, pendingPayments, approvedPayments, rejectedPayments,
      totalBooks, totalMagazines, totalDrafts,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ createdAt: { $gte: monthStart } }),
      Admin.countDocuments({ deletedAt: null }),
      Admin.countDocuments({ isActive: true, deletedAt: null }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'pending' }),
      Appointment.countDocuments({ status: 'confirmed' }),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
      Payment.countDocuments(),
      Payment.countDocuments({ status: 'pending_verification' }),
      Payment.countDocuments({ status: 'approved' }),
      Payment.countDocuments({ status: 'rejected' }),
      Book.countDocuments(),
      Magazine.countDocuments(),
      Draft.countDocuments(),
    ]);

    // Revenue calculations
    const approvedPayments$ = await Payment.find({ status: 'approved' }).select('amount');
    const totalRevenue = approvedPayments$.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

    const thisMonthPayments = await Payment.find({ status: 'approved', approvedAt: { $gte: monthStart } }).select('amount');
    const thisMonthRevenue = thisMonthPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

    const lastMonthPayments = await Payment.find({ status: 'approved', approvedAt: { $gte: lastMonthStart, $lte: lastMonthEnd } }).select('amount');
    const lastMonthRevenue = lastMonthPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

    // Monthly revenue for last 6 months chart
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const mPayments = await Payment.find({ status: 'approved', approvedAt: { $gte: mStart, $lte: mEnd } }).select('amount');
      const mRevenue = mPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
      monthlyRevenue.push({
        month: mStart.toLocaleString('en-IN', { month: 'short' }),
        revenue: Math.round(mRevenue),
      });
    }

    // Appointments per month (last 6 months)
    const appointmentTrend = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const count  = await Appointment.countDocuments({ createdAt: { $gte: mStart, $lte: mEnd } });
      appointmentTrend.push({
        month: mStart.toLocaleString('en-IN', { month: 'short' }),
        appointments: count,
      });
    }

    // Recent appointments
    const recentAppointments = await Appointment.find()
      .sort({ createdAt: -1 }).limit(5)
      .select('name service date time status createdAt');

    // Recent payments
    const recentPayments = await Payment.find()
      .sort({ createdAt: -1 }).limit(5)
      .select('clientName amount status paymentMethod createdAt');

    // Recent audit logs
    const recentLogs = await AuditLog.find()
      .sort({ createdAt: -1 }).limit(8)
      .select('adminName action createdAt ipAddress');

    res.json({
      success: true,
      data: {
        users:        { total: totalUsers, active: activeUsers, newThisMonth: newUsersThisMonth },
        admins:       { total: totalAdmins, active: activeAdmins },
        appointments: { total: totalAppt, pending: pendingAppt, confirmed: confirmedAppt, completed: completedAppt, cancelled: cancelledAppt },
        payments:     { total: totalPayments, pending: pendingPayments, approved: approvedPayments, rejected: rejectedPayments },
        revenue:      { total: Math.round(totalRevenue), thisMonth: Math.round(thisMonthRevenue), lastMonth: Math.round(lastMonthRevenue) },
        content:      { books: totalBooks, magazines: totalMagazines, drafts: totalDrafts },
        charts:       { monthlyRevenue, appointmentTrend },
        recent:       { appointments: recentAppointments, payments: recentPayments, logs: recentLogs },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── System health ──────────────────────────────────────────────────── */
exports.getSystemHealth = async (req, res) => {
  try {
    const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const dbStatus = dbState[mongoose.connection.readyState] || 'unknown';

    const memUsage = process.memoryUsage();
    const uptimeSec = process.uptime();

    const hours   = Math.floor(uptimeSec / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);

    // Count records across main collections
    const [users, admins, appointments, payments] = await Promise.all([
      User.countDocuments(),
      Admin.countDocuments({ deletedAt: null }),
      Appointment.countDocuments(),
      Payment.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        database: {
          status: dbStatus,
          host: mongoose.connection.host || 'unknown',
          name: mongoose.connection.name || 'unknown',
        },
        server: {
          uptime: `${hours}h ${minutes}m`,
          uptimeSeconds: Math.round(uptimeSec),
          nodeVersion: process.version,
          platform: process.platform,
          memory: {
            used: Math.round(memUsage.heapUsed / 1024 / 1024),
            total: Math.round(memUsage.heapTotal / 1024 / 1024),
            rss: Math.round(memUsage.rss / 1024 / 1024),
          },
        },
        records: { users, admins, appointments, payments },
        timestamp: new Date(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Feature toggles ────────────────────────────────────────────────── */
const FEATURE_KEY = 'feature_toggles';

const DEFAULT_FEATURES = {
  bookingSystem:    true,
  paymentModule:    true,
  userRegistration: true,
  userLogin:        true,
  booksModule:      true,
  magazinesModule:  true,
  draftsModule:     true,
  youtubeModule:    true,
  contactForm:      true,
  maintenanceMode:  false,
};

exports.getFeatureToggles = async (req, res) => {
  try {
    let setting = await SiteSettings.findOne({ key: FEATURE_KEY });
    if (!setting) {
      setting = await SiteSettings.create({ key: FEATURE_KEY, value: DEFAULT_FEATURES, group: 'general', label: 'Feature Toggles', type: 'json' });
    }
    res.json({ success: true, data: setting.value });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateFeatureToggles = async (req, res) => {
  try {
    const updates = req.body;
    let setting = await SiteSettings.findOne({ key: FEATURE_KEY });
    if (!setting) {
      setting = await SiteSettings.create({ key: FEATURE_KEY, value: { ...DEFAULT_FEATURES, ...updates }, group: 'general', label: 'Feature Toggles', type: 'json' });
    } else {
      setting.value = { ...(setting.value || DEFAULT_FEATURES), ...updates };
      await setting.save();
    }

    // Audit log
    await AuditLog.create({
      adminId: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email,
      action: 'ADMIN_UPDATED', ipAddress: (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim(),
      details: { module: 'Feature Toggles', changes: updates },
    });

    res.json({ success: true, data: setting.value, message: 'Feature toggles updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Analytics ──────────────────────────────────────────────────────── */
exports.getAnalytics = async (req, res) => {
  try {
    const now = new Date();

    // User growth last 6 months
    const userGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const count  = await User.countDocuments({ createdAt: { $gte: mStart, $lte: mEnd } });
      userGrowth.push({ month: mStart.toLocaleString('en-IN', { month: 'short' }), users: count });
    }

    // Payment method breakdown
    const paymentMethods = await Payment.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 } } },
    ]);

    // Appointment status breakdown
    const apptStatus = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Top services
    const topServices = await Appointment.aggregate([
      { $group: { _id: '$service', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 5 },
    ]);

    res.json({
      success: true,
      data: { userGrowth, paymentMethods, apptStatus, topServices },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
