const Appointment = require('../models/Appointment');
const UserNotification = require('../models/UserNotification');

exports.createAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.create(req.body);

    if (appointment.userId) {
      await UserNotification.create({
        userId: appointment.userId,
        title: 'Appointment Booked',
        message: `Your appointment for "${appointment.service}" on ${new Date(appointment.date).toLocaleDateString('en-IN')} at ${appointment.time} has been received and is pending confirmation.`,
        type: 'appointment',
        referenceId: appointment._id,
        referenceType: 'Appointment',
      });
    }

    res.status(201).json({ success: true, message: 'Appointment booked successfully!', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllAppointments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    const total = await Appointment.countDocuments(query);
    const appointments = await Appointment.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, data: appointments, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const STATUS_MESSAGES = {
  confirmed: 'Your appointment has been confirmed.',
  cancelled: 'Your appointment has been cancelled.',
  completed: 'Your appointment has been marked as completed. Thank you for choosing Advocate Chauhan!',
  'in progress': 'Your appointment consultation is currently in progress.',
};

exports.updateAppointment = async (req, res) => {
  try {
    const existing = await Appointment.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Appointment not found' });

    const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    if (existing.userId && req.body.status && req.body.status !== existing.status) {
      const statusLabel = req.body.status.charAt(0).toUpperCase() + req.body.status.slice(1);
      await UserNotification.create({
        userId: existing.userId,
        title: `Appointment ${statusLabel}`,
        message: STATUS_MESSAGES[req.body.status] || `Your appointment status has been updated to "${statusLabel}".`,
        type: 'appointment',
        referenceId: existing._id,
        referenceType: 'Appointment',
      });
    }

    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, message: 'Appointment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const stats = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const total = await Appointment.countDocuments();
    const unread = await Appointment.countDocuments({ isRead: false });
    res.json({ success: true, stats, total, unread });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
