const SiteSettings = require('../models/SiteSettings');

const DEFAULT_SETTINGS = [
  { key: 'site_name', value: 'Advocate Chauhan', group: 'general', label: 'Site Name', type: 'text' },
  { key: 'site_tagline', value: 'Justice. Integrity. Excellence.', group: 'general', label: 'Tagline', type: 'text' },
  { key: 'site_logo', value: '', group: 'general', label: 'Logo', type: 'image' },
  { key: 'hero_title', value: 'Your Trusted Legal Advocate', group: 'hero', label: 'Hero Title', type: 'text' },
  { key: 'hero_subtitle', value: 'Expert legal representation across criminal, civil, family & corporate law', group: 'hero', label: 'Hero Subtitle', type: 'textarea' },
  { key: 'hero_image', value: '', group: 'hero', label: 'Hero Background', type: 'image' },
  { key: 'advocate_name', value: 'Adv. Rajesh Chauhan', group: 'advocate', label: 'Advocate Name', type: 'text' },
  { key: 'advocate_designation', value: 'MBA, M.Sc & LL.B', group: 'advocate', label: 'Designation', type: 'text' },
  { key: 'advocate_experience', value: '15+ Years Experience', group: 'advocate', label: 'Experience', type: 'text' },
  { key: 'advocate_photo', value: '', group: 'advocate', label: 'Advocate Photo', type: 'image' },
  { key: 'advocate_bio', value: 'With over 15 years of dedicated legal practice, Advocate Chauhan has successfully represented thousands of clients across various courts.', group: 'advocate', label: 'Bio', type: 'textarea' },
  { key: 'contact_phone', value: '9392538226', group: 'contact', label: 'Phone', type: 'phone' },
  { key: 'contact_phone2', value: '9441335292', group: 'contact', label: 'Phone 2', type: 'phone' },
  { key: 'contact_email', value: 'info@advocatechauhan.com', group: 'contact', label: 'Email', type: 'email' },
  { key: 'contact_address', value: 'Balu Law Chamber, New Venkatramana Colony, Hasthinapuram, LB Nagar', group: 'contact', label: 'Address', type: 'textarea' },
  { key: 'contact_whatsapp', value: '9866222461', group: 'contact', label: 'WhatsApp Number', type: 'phone' },
  { key: 'contact_map', value: 'https://maps.google.com/maps?q=17.333658%2C78.554825&z=17&hl=en', group: 'contact', label: 'Google Maps Link', type: 'url' },
  { key: 'social_facebook', value: 'https://www.facebook.com/share/1B761tqcFM/', group: 'social', label: 'Facebook URL', type: 'url' },
  { key: 'social_youtube', value: 'https://youtube.com/@vakeelchauhan2024', group: 'social', label: 'YouTube Channel URL', type: 'url' },
  { key: 'social_twitter', value: '', group: 'social', label: 'Twitter URL', type: 'url' },
  { key: 'social_linkedin', value: '', group: 'social', label: 'LinkedIn URL', type: 'url' },
  { key: 'social_instagram', value: '', group: 'social', label: 'Instagram URL', type: 'url' },
  { key: 'seo_title', value: 'Advocate Chauhan - Expert Legal Services', group: 'seo', label: 'SEO Title', type: 'text' },
  { key: 'seo_description', value: 'Expert legal representation in criminal, civil, family and corporate law. Contact Advocate Chauhan today.', group: 'seo', label: 'Meta Description', type: 'textarea' },
  { key: 'about_content', value: 'We are a premier law firm providing comprehensive legal services with a commitment to excellence and client satisfaction.', group: 'about', label: 'About Content', type: 'textarea' },
  { key: 'stats_cases', value: '500+', group: 'about', label: 'Cases Won', type: 'text' },
  { key: 'stats_clients', value: '1000+', group: 'about', label: 'Happy Clients', type: 'text' },
  { key: 'stats_years', value: '15+', group: 'about', label: 'Years Experience', type: 'text' },
  { key: 'stats_courts', value: '50+', group: 'about', label: 'Courts', type: 'text' }
];

// Keys that must never be returned to the public frontend
const PRIVATE_KEYS = new Set(['razorpay_secret', 'jwt_secret', 'admin_password']);

exports.getSettings = async (req, res) => {
  try {
    const settings = await SiteSettings.find();
    const settingsMap = {};
    settings.forEach(s => {
      if (!PRIVATE_KEYS.has(s.key)) settingsMap[s.key] = s.value;
    });
    res.json({ success: true, data: settingsMap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSettingsByGroup = async (req, res) => {
  try {
    const settings = await SiteSettings.find({ group: req.params.group });
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllSettings = async (req, res) => {
  try {
    const settings = await SiteSettings.find().sort({ group: 1 });
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    const ops = Object.entries(updates).map(([key, value]) => ({
      updateOne: {
        filter: { key },
        update: { $set: { value } },
        upsert: true
      }
    }));
    await SiteSettings.bulkWrite(ops);
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.seedSettings = async (req, res) => {
  try {
    for (const setting of DEFAULT_SETTINGS) {
      await SiteSettings.findOneAndUpdate({ key: setting.key }, setting, { upsert: true, new: true });
    }
    res.json({ success: true, message: 'Default settings seeded' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
