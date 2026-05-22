const YoutubeVideo = require('../models/YoutubeVideo');

function extractVideoId(input) {
  if (!input) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  return input;
}

exports.getPublic = async (req, res) => {
  try {
    const videos = await YoutubeVideo.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: videos });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getAll = async (req, res) => {
  try {
    const videos = await YoutubeVideo.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: videos });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { title, videoUrl, description, order } = req.body;
    const videoId = extractVideoId(videoUrl || req.body.videoId);
    if (!videoId) return res.status(400).json({ success: false, message: 'Invalid YouTube URL or video ID' });
    const video = await YoutubeVideo.create({ title, videoId, description, order: order || 0 });
    res.status(201).json({ success: true, data: video });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const { title, videoUrl, description, order, isActive } = req.body;
    const update = { title, description, order, isActive };
    if (videoUrl || req.body.videoId) update.videoId = extractVideoId(videoUrl || req.body.videoId);
    const video = await YoutubeVideo.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!video) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: video });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    await YoutubeVideo.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
