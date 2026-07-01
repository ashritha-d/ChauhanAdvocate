const Admin    = require('../models/Admin');
const AuditLog = require('../models/AuditLog');

function getIp(req) {
  return (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
}

async function log(action, req, opts = {}) {
  try {
    await AuditLog.create({
      adminId:          req.admin?._id,
      adminName:        req.admin?.name || 'System',
      adminEmail:       req.admin?.email || '',
      action,
      targetAdminId:    opts.targetId   || null,
      targetAdminEmail: opts.targetEmail || '',
      ipAddress:        getIp(req),
      details:          opts.details    || {},
    });
  } catch (_) {}
}

// GET /api/admin-management  — list all non-deleted admins with search/filter
exports.getAllAdmins = async (req, res) => {
  try {
    const { search = '', role = '', status = '', page = 1, limit = 20 } = req.query;
    const query = { deletedAt: null };

    if (search) {
      query.$or = [
        { name:     { $regex: search, $options: 'i' } },
        { email:    { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }
    if (role)   query.role     = role;
    if (status === 'active')   query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const skip  = (Number(page) - 1) * Number(limit);
    const [admins, total] = await Promise.all([
      Admin.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Admin.countDocuments(query),
    ]);

    res.json({ success: true, data: admins, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin-management/stats
exports.getStats = async (req, res) => {
  try {
    const [total, active, inactive, nonSuperAdminCount, recentLogins, recentCreated] = await Promise.all([
      Admin.countDocuments({ deletedAt: null }),
      Admin.countDocuments({ deletedAt: null, isActive: true }),
      Admin.countDocuments({ deletedAt: null, isActive: false }),
      Admin.countDocuments({ deletedAt: null, role: { $ne: 'superadmin' } }),
      Admin.find({ deletedAt: null, lastLogin: { $ne: null } })
           .sort({ lastLogin: -1 }).limit(5)
           .select('name email role lastLogin lastLoginIp'),
      Admin.find({ deletedAt: null })
           .sort({ createdAt: -1 }).limit(5)
           .select('name email role isActive createdAt'),
    ]);
    res.json({ success: true, data: { total, active, inactive, nonSuperAdminCount, recentLogins, recentCreated } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin-management — create admin
exports.createAdmin = async (req, res) => {
  try {
    const { name, username, email, phone, password, role, isActive } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const existing = await Admin.findOne({ $or: [{ email }, ...(username ? [{ username }] : [])] });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email or username already in use' });
    }

    // Hard limit: maximum 3 admins (excluding superadmin accounts)
    const adminCount = await Admin.countDocuments({ role: { $ne: 'superadmin' } });
    const assignedRole = role || 'admin';
    if (assignedRole !== 'superadmin' && adminCount >= 3) {
      return res.status(403).json({ success: false, message: 'Admin limit reached. Maximum 3 admins allowed.' });
    }

    // Only superadmin can create another superadmin
    if (assignedRole === 'superadmin' && req.admin.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Only superadmin can create another superadmin' });
    }

    const admin = await Admin.create({ name, username, email, phone, password, role: assignedRole, isActive: isActive !== false });

    await log('ADMIN_CREATED', req, {
      targetId: admin._id, targetEmail: admin.email,
      details: { name, email, role: assignedRole },
    });

    res.status(201).json({ success: true, data: admin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin-management/:id — update admin info
exports.updateAdmin = async (req, res) => {
  try {
    const { name, username, email, phone, role, isActive, permissions } = req.body;
    const admin = await Admin.findOne({ _id: req.params.id, deletedAt: null });

    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    // Only superadmin can change roles or manage another superadmin
    if (admin.role === 'superadmin' && req.admin.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Cannot modify a superadmin account' });
    }
    if (role === 'superadmin' && req.admin.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Only superadmin can assign superadmin role' });
    }

    if (name)        admin.name        = name;
    if (username)    admin.username    = username;
    if (email)       admin.email       = email;
    if (phone !== undefined) admin.phone = phone;
    if (role)        admin.role        = role;
    if (permissions) admin.permissions = permissions;
    if (isActive !== undefined) admin.isActive = isActive;

    await admin.save();

    await log('ADMIN_UPDATED', req, {
      targetId: admin._id, targetEmail: admin.email,
      details: { updatedFields: Object.keys(req.body) },
    });

    res.json({ success: true, data: admin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin-management/:id/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const admin = await Admin.findOne({ _id: req.params.id, deletedAt: null }).select('+password');
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    if (admin.role === 'superadmin' && req.admin.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Cannot reset a superadmin password' });
    }

    admin.password = newPassword;
    await admin.save();

    await log('PASSWORD_RESET', req, { targetId: admin._id, targetEmail: admin.email });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin-management/:id/toggle-status
exports.toggleStatus = async (req, res) => {
  try {
    const admin = await Admin.findOne({ _id: req.params.id, deletedAt: null });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    // Prevent deactivating the last active superadmin
    if (admin.role === 'superadmin' && admin.isActive) {
      const activeSuperAdmins = await Admin.countDocuments({ role: 'superadmin', isActive: true, deletedAt: null });
      if (activeSuperAdmins <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot deactivate the last active superadmin' });
      }
    }

    admin.isActive = !admin.isActive;
    await admin.save();

    const action = admin.isActive ? 'ADMIN_ACTIVATED' : 'ADMIN_DEACTIVATED';
    await log(action, req, { targetId: admin._id, targetEmail: admin.email });

    res.json({ success: true, data: admin, message: `Admin ${admin.isActive ? 'activated' : 'deactivated'} successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin-management/:id — soft delete
exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findOne({ _id: req.params.id, deletedAt: null });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    // Prevent self-deletion
    if (String(admin._id) === String(req.admin._id)) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    // Prevent deleting last active superadmin
    if (admin.role === 'superadmin') {
      const activeSuperAdmins = await Admin.countDocuments({ role: 'superadmin', isActive: true, deletedAt: null });
      if (activeSuperAdmins <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot delete the last active superadmin' });
      }
    }

    admin.deletedAt = new Date();
    admin.isActive  = false;
    await admin.save();

    await log('ADMIN_DELETED', req, { targetId: admin._id, targetEmail: admin.email });

    res.json({ success: true, message: 'Admin deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
