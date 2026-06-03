require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const Service = require('../models/Service');

const updates = [
  {
    title: 'Family Law',
    fields: {
      description: 'Comprehensive family law services covering divorce, custody, maintenance, matrimonial matters, and RCR petitions.',
      features: ['Divorce Proceedings', 'Child Custody', 'Maintenance', 'Domestic Violence', 'Marriage Registration', 'RCR (Restitution of Conjugal Rights)'],
    },
  },
  {
    title: 'Property Law',
    fields: {
      shortDescription: 'Expert property and real estate legal services, including legal opinions and documentation.',
      description: 'Comprehensive property law services including title verification, transactions, disputes, and expert legal opinions on property matters.',
      features: ['Title Verification', 'Sale/Purchase Deeds', 'Property Disputes', 'RERA Matters', 'Tenant Issues', 'Legal Opinions on Property Matters'],
    },
  },
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { tlsAllowInvalidCertificates: true });
    console.log('Connected to MongoDB');

    for (const { title, fields } of updates) {
      const result = await Service.findOneAndUpdate({ title }, { $set: fields }, { new: true });
      if (result) {
        console.log(`✓ Updated "${title}" — features: [${result.features.join(', ')}]`);
      } else {
        console.log(`✗ "${title}" not found in DB`);
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
