const AuditLog = require('../models/AuditLog');

// GET /api/admin-management/audit-logs
exports.getLogs = async (req, res) => {
  try {
    const { action = '', adminId = '', page = 1, limit = 30 } = req.query;
    const query = {};
    if (action)  query.action  = action;
    if (adminId) query.adminId = adminId;

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      AuditLog.countDocuments(query),
    ]);

    res.json({ success: true, data: logs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
