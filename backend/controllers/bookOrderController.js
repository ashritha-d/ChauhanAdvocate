const BookOrder = require('../models/BookOrder');

exports.createBookOrder = async (req, res) => {
  try {
    const order = await BookOrder.create(req.body);
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

exports.updateBookOrder = async (req, res) => {
  try {
    const order = await BookOrder.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ success: false, message: 'Book order not found' });
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
