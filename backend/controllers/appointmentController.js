const Appointment = require('../models/Appointment');
const UserNotification = require('../models/UserNotification');
const wa = require('../services/whatsapp');

// ALL working time slots
const ALL_SLOTS = [
  '09:00 AM','10:00 AM','11:00 AM','12:00 PM',
  '02:00 PM','03:00 PM','04:00 PM','05:00 PM','06:00 PM',
];

function generateAppointmentId() {
  const now = new Date();
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `APT-${ymd}-${rand}`;
}

// GET /api/appointments/available-slots?date=YYYY-MM-DD  (public)
exports.getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.json({ success: true, slots: ALL_SLOTS });

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Find all booked (non-cancelled) slots for that date
    const booked = await Appointment.find({
      date: { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ['cancelled'] },
    }).select('time rescheduledDate rescheduledTime');

    const bookedTimes = new Set();
    booked.forEach(a => {
      // If rescheduled, the effective slot is rescheduledDate+rescheduledTime
      if (a.status === 'rescheduled' && a.rescheduledTime) {
        bookedTimes.add(a.rescheduledTime);
      } else {
        bookedTimes.add(a.time);
      }
    });

    // Block past times if date is today
    const today = new Date();
    const isToday = dayStart.toDateString() === today.toDateString();

    const slots = ALL_SLOTS.map(slot => {
      let blocked = bookedTimes.has(slot);

      if (!blocked && isToday) {
        // Parse slot time and compare with now
        const [timePart, meridiem] = slot.split(' ');
        let [h, m] = timePart.split(':').map(Number);
        if (meridiem === 'PM' && h !== 12) h += 12;
        if (meridiem === 'AM' && h === 12) h = 0;
        const slotTime = new Date();
        slotTime.setHours(h, m, 0, 0);
        if (slotTime <= today) blocked = true;
      }

      return { time: slot, available: !blocked };
    });

    res.json({ success: true, slots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAppointment = async (req, res) => {
  try {
    const { date, time } = req.body;

    // Check slot conflict
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const conflict = await Appointment.findOne({
      date: { $gte: dayStart, $lte: dayEnd },
      time,
      status: { $nin: ['cancelled'] },
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'This appointment slot is no longer available. Please choose another time.',
      });
    }

    const appointmentId = generateAppointmentId();
    const appointment = await Appointment.create({ ...req.body, appointmentId });

    // In-app notification
    if (appointment.userId) {
      await UserNotification.create({
        userId: appointment.userId,
        title: 'Appointment Booked',
        message: `Your appointment for "${appointment.service}" on ${new Date(appointment.date).toLocaleDateString('en-IN')} at ${appointment.time} has been received.\nAppointment ID: ${appointmentId}`,
        type: 'appointment',
        referenceId: appointment._id,
        referenceType: 'Appointment',
      });
    }

    // WhatsApp notification (non-blocking)
    wa.appointmentBooked({
      name: appointment.name,
      phone: appointment.phone,
      appointmentId,
      date: appointment.date,
      time: appointment.time,
      appointmentMode: appointment.appointmentMode,
    }).catch(() => {});

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
        { phone: { $regex: search, $options: 'i' } },
        { appointmentId: { $regex: search, $options: 'i' } },
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
  cancelled: 'Your appointment has been cancelled. Please contact us to choose another slot.',
  completed: 'Your appointment has been marked as completed. Thank you for choosing Advocate Chauhan!',
  rescheduled: 'Your appointment has been rescheduled. Please check the new date and time.',
};

exports.updateAppointment = async (req, res) => {
  try {
    const existing = await Appointment.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Appointment not found' });

    const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    const newStatus = req.body.status;
    const statusChanged = newStatus && newStatus !== existing.status;

    // In-app notification on status change
    if (existing.userId && statusChanged) {
      const statusLabel = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      let notifMessage = STATUS_MESSAGES[newStatus] || `Your appointment status has been updated to "${statusLabel}".`;

      if (newStatus === 'rescheduled' && req.body.rescheduledDate && req.body.rescheduledTime) {
        const fmtDate = new Date(req.body.rescheduledDate).toLocaleDateString('en-IN');
        notifMessage = `Your appointment has been rescheduled to ${fmtDate} at ${req.body.rescheduledTime}.`;
      }

      await UserNotification.create({
        userId: existing.userId,
        title: `Appointment ${statusLabel}`,
        message: notifMessage,
        type: 'appointment',
        referenceId: existing._id,
        referenceType: 'Appointment',
      });
    }

    // WhatsApp on status change (non-blocking)
    if (statusChanged) {
      const apptId = existing.appointmentId || existing._id.toString();
      const info = { name: existing.name, phone: existing.phone, appointmentId: apptId };

      if (newStatus === 'confirmed') {
        wa.appointmentConfirmed({ ...info, date: existing.date, time: existing.time }).catch(() => {});
      } else if (newStatus === 'rescheduled' && req.body.rescheduledDate && req.body.rescheduledTime) {
        wa.appointmentRescheduled({ ...info, newDate: req.body.rescheduledDate, newTime: req.body.rescheduledTime }).catch(() => {});
      } else if (newStatus === 'cancelled') {
        wa.appointmentCancelled(info).catch(() => {});
      } else if (newStatus === 'completed') {
        wa.appointmentCompleted(info).catch(() => {});
      }
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
