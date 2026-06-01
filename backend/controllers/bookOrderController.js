const BookOrder = require('../models/BookOrder');
const UserNotification = require('../models/UserNotification');

exports.createBookOrder = async (req, res) => {
  try {
    const order = await BookOrder.create(req.body);

    if (order.userId) {
      await UserNotification.create({
        userId: order.userId,
        title: 'Order Placed',
        message: `Your order for "${order.bookTitle}" (Qty: ${order.quantity}) has been placed successfully and is pending confirmation.`,
        type: 'order',
        referenceId: order._id,
        referenceType: 'BookOrder',
      });
    }

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
        { bookTitle: { $regex: search, $options: 'i' } }
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
  shipped: 'Great news! Your order has been shipped and is on the way.',
  delivered: 'Your order has been delivered. Enjoy your book!',
  cancelled: 'Your book order has been cancelled.',
};

exports.updateBookOrder = async (req, res) => {
  try {
    const existing = await BookOrder.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Book order not found' });

    const order = await BookOrder.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    if (existing.userId && req.body.status && req.body.status !== existing.status) {
      const statusLabel = req.body.status.charAt(0).toUpperCase() + req.body.status.slice(1);
      await UserNotification.create({
        userId: existing.userId,
        title: `Order ${statusLabel}`,
        message: ORDER_STATUS_MESSAGES[req.body.status] || `Your order status has been updated to "${statusLabel}".`,
        type: 'order',
        referenceId: existing._id,
        referenceType: 'BookOrder',
      });
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
