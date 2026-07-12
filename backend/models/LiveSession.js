const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  text:      { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const liveSessionSchema = new mongoose.Schema({
  title:            { type: String, required: true, trim: true },
  description:      { type: String, default: '' },
  speaker:          { type: String, default: '' },
  agenda:           { type: String, default: '' },
  date:             { type: Date, required: true },
  startTime:        { type: String, default: '' },
  endTime:          { type: String, default: '' },
  timezone:         { type: String, default: 'IST' },
  platform:         { type: String, default: 'Google Meet' },
  meetUrl:          { type: String, default: '' },
  status:           { type: String, enum: ['upcoming', 'live', 'ended', 'cancelled'], default: 'upcoming' },
  isEnabled:        { type: Boolean, default: true },
  displayInUpdates: { type: Boolean, default: true },
  banner:           { type: String, default: '' },
  announcements:    [announcementSchema],
}, { timestamps: true });

module.exports = mongoose.model('LiveSession', liveSessionSchema);
