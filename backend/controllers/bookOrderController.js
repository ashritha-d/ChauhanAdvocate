const BookOrder = require('../models/BookOrder');
const UserNotification = require('../models/UserNotification');
const wa = require('../services/whatsapp');

exports.createBookOrder = async (req, res) => {
  try {
    const order = await BookOrder.create(req.body);

    if (order.userId) {
      await UserNotification.create({
        userId: order.userId,
        title: 'Order Placed',
        message: `Your order for "${order.bookTitle}" (Qty: ${order.quantity}) has been placed successfully.\nOrder ID: ${order.orderId || order._id}`,
        type: 'order',
        referenceId: order._id,
        referenceType: 'BookOrder',
      });
    }

    // WhatsApp notification (non-blocking)
    wa.orderPlaced({
      name: order.name,
      phone: order.phone,
      orderId: order.orderId || order._id.toString(),
      bookTitle: order.bookTitle,
    }).catch(() => {});

    res.status(201).json({ success: true, message: 'Book order placed successfully! We will contact you shortly.', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllBookOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { bookTitle: { $regex: search, $options: 'i' } },
        { orderId: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await BookOrder.countDocuments(query);
    const orders = await BookOrder.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, data: orders, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBookOrder = async (req, res) => {
  try {
    const order = await BookOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Book order not found' });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const ORDER_STATUS_MESSAGES = {
  confirmed: 'Your book order has been confirmed and is being processed.',
  processing: 'Your order is being processed and will be shipped soon.',
  shipped: 'Great news! Your order has been shipped and is on the way.',
  delivered: 'Your order has been delivered. Enjoy your book!',
  cancelled: 'Your book order has been cancelled.',
};

exports.updateBookOrder = async (req, res) => {
  try {
    const existing = await BookOrder.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Book order not found' });

    const order = await BookOrder.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    const newStatus = req.body.status;
    const statusChanged = newStatus && newStatus !== existing.status;

    if (existing.userId && statusChanged) {
      const statusLabel = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      await UserNotification.create({
        userId: existing.userId,
        title: `Order ${statusLabel}`,
        message: ORDER_STATUS_MESSAGES[newStatus] || `Your order status has been updated to "${statusLabel}".`,
        type: 'order',
        referenceId: existing._id,
        referenceType: 'BookOrder',
      });
    }

    // WhatsApp on status change (non-blocking)
    if (statusChanged) {
      const orderId = existing.orderId || existing._id.toString();
      const info = { name: existing.name, phone: existing.phone, orderId };

      if (newStatus === 'confirmed') {
        wa.orderConfirmed(info).catch(() => {});
      } else if (newStatus === 'processing') {
        wa.orderProcessing(info).catch(() => {});
      } else if (newStatus === 'shipped') {
        wa.orderShipped({ ...info, trackingNumber: req.body.trackingNumber || order.trackingNumber }).catch(() => {});
      } else if (newStatus === 'delivered') {
        wa.orderDelivered(info).catch(() => {});
      } else if (newStatus === 'cancelled') {
        wa.orderCancelled(info).catch(() => {});
      }
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteBookOrder = async (req, res) => {
  try {
    const order = await BookOrder.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Book order not found' });
    res.json({ success: true, message: 'Book order deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const stats = await BookOrder.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const total = await BookOrder.countDocuments();
    const unread = await BookOrder.countDocuments({ isRead: false });
    res.json({ success: true, stats, total, unread });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
