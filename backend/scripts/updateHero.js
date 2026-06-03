require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const SiteSettings = require('../models/SiteSettings');

const updates = [
  { key: 'advocate_designation', value: 'MBA, M.Sc & LL.B' },
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { tlsAllowInvalidCertificates: true });
    console.log('Connected to MongoDB');

    for (const { key, value } of updates) {
      const result = await SiteSettings.findOneAndUpdate({ key }, { $set: { value } }, { new: true });
      if (result) {
        console.log(`✓ Updated "${key}" → "${value}"`);
      } else {
        console.log(`✗ Key "${key}" not found — creating it`);
        await SiteSettings.create({ key, value, group: 'advocate', label: 'Designation', type: 'text' });
        console.log(`✓ Created "${key}" → "${value}"`);
      }
    }

    console.log('\n✅ Done');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
