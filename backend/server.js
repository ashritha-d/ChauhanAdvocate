const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Trust Render/Heroku reverse proxy so req.protocol returns 'https'
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['https://ashritha-d.github.io'];

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? allowedOrigins : true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/', authLimiter);

// Prevent browser/CDN from caching any API response
app.use('/api/', (req, res, next) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  });
  next();
});

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure upload directories exist
const galleryDir = path.join(__dirname, 'uploads', 'gallery');
if (!fs.existsSync(galleryDir)) fs.mkdirSync(galleryDir, { recursive: true });
const paymentsUploadDir = path.join(__dirname, 'uploads', 'payments');
if (!fs.existsSync(paymentsUploadDir)) fs.mkdirSync(paymentsUploadDir, { recursive: true });
const avatarsUploadDir = path.join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(avatarsUploadDir)) fs.mkdirSync(avatarsUploadDir, { recursive: true });
const videosUploadDir = path.join(__dirname, 'uploads', 'videos');
if (!fs.existsSync(videosUploadDir)) fs.mkdirSync(videosUploadDir, { recursive: true });

// MongoDB connection
const mongoOptions = process.env.NODE_ENV === 'development' ? { tlsAllowInvalidCertificates: true } : {};
mongoose.connect(process.env.MONGO_URI, mongoOptions)
  .then(() => console.log('MongoDB connected'))
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/services', require('./routes/services'));
app.use('/api/blogs', require('./routes/blogs'));
app.use('/api/testimonials', require('./routes/testimonials'));
app.use('/api/faqs', require('./routes/faqs'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/site-settings', require('./routes/siteSettings'));
app.use('/api/hero-banners', require('./routes/heroBanners'));
app.use('/api/youtube-videos', require('./routes/youtubeVideos'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/jr-advocates', require('./routes/jrAdvocates'));
app.use('/api/book-orders', require('./routes/bookOrders'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/facebook-posts', require('./routes/facebookPosts'));
app.use('/api/magazines', require('./routes/magazines'));
app.use('/api/drafts', require('./routes/drafts'));
app.use('/api/books', require('./routes/books'));
app.use('/api/join-with-us', require('./routes/joinWithUs'));
app.use('/api/contact-details', require('./routes/contactDetails'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin-management', require('./routes/adminManagement'));
app.use('/api/super-admin',      require('./routes/superAdmin'));
app.use('/api/users', require('./routes/users'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/news',    require('./routes/news'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Gallery images listing
app.get('/api/gallery', (req, res) => {
  const imageExts = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif']);
  try {
    const files = fs.existsSync(galleryDir)
      ? fs.readdirSync(galleryDir).filter(f => imageExts.has(path.extname(f).toLowerCase()))
      : [];
    // Use x-forwarded-proto so HTTPS is preserved behind Render's reverse proxy
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    const baseUrl = `${proto}://${req.get('host')}`;
    res.json({ success: true, data: files.map(f => ({ filename: f, url: `${baseUrl}/uploads/gallery/${f}` })) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
