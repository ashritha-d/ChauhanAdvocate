const ContactDetail = require('../models/ContactDetail');

exports.getPublic = async (req, res) => {
  try {
    const item = await ContactDetail.findOne({ isActive: true });
    res.json({ success: true, data: item });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getAll = async (req, res) => {
  try {
    const items = await ContactDetail.find();
    res.json({ success: true, data: items });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.upsert = async (req, res) => {
  try {
    let item = await ContactDetail.findOne();
    if (item) {
      Object.assign(item, req.body);
      await item.save();
    } else {
      item = await ContactDetail.create(req.body);
    }
    res.json({ success: true, data: item });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
