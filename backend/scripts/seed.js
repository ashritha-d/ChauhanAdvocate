require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const SiteSettings = require('../models/SiteSettings');
const Service = require('../models/Service');
const FAQ = require('../models/FAQ');
const Testimonial = require('../models/Testimonial');

const defaultServices = [
  { title: 'Criminal Defense', icon: 'fas fa-gavel', shortDescription: 'Expert criminal defense across all courts.', description: 'Comprehensive criminal defense services including bail applications, trial representation, and appeals.', features: ['Bail Applications', 'Trial Representation', 'FIR Quashing', 'Anticipatory Bail', 'Appeals & Revisions'], order: 1, isActive: true, isFeatured: true },
  { title: 'Civil Litigation', icon: 'fas fa-balance-scale', shortDescription: 'Resolving civil disputes with expertise.', description: 'Handling all civil litigation matters including property disputes, contract enforcement, and money recovery.', features: ['Property Disputes', 'Money Recovery', 'Injunctions', 'Contract Disputes', 'Eviction Matters'], order: 2, isActive: true, isFeatured: true },
  { title: 'Family Law', icon: 'fas fa-users', shortDescription: 'Sensitive and effective family legal matters.', description: 'Comprehensive family law services covering divorce, custody, maintenance, and matrimonial matters.', features: ['Divorce Proceedings', 'Child Custody', 'Maintenance', 'Domestic Violence', 'Marriage Registration'], order: 3, isActive: true, isFeatured: true },
  { title: 'Corporate Law', icon: 'fas fa-building', shortDescription: 'Complete legal solutions for businesses.', description: 'Corporate legal services including company formation, contracts, compliance, and commercial disputes.', features: ['Company Formation', 'Contract Drafting', 'Compliance', 'Mergers & Acquisitions', 'Commercial Disputes'], order: 4, isActive: true, isFeatured: false },
  { title: 'Property Law', icon: 'fas fa-home', shortDescription: 'Expert property and real estate legal services.', description: 'Comprehensive property law services including title verification, transactions, and disputes.', features: ['Title Verification', 'Sale/Purchase Deeds', 'Property Disputes', 'RERA Matters', 'Tenant Issues'], order: 5, isActive: true, isFeatured: false },
  { title: 'Constitutional Law', icon: 'fas fa-scroll', shortDescription: 'Protecting fundamental rights and freedoms.', description: 'Writ petitions, PIL filings, and constitutional matters before High Courts and Supreme Court.', features: ['Writ Petitions', 'PIL Filing', 'Fundamental Rights', 'Service Matters', 'Election Disputes'], order: 6, isActive: true, isFeatured: false }
];

const defaultFAQs = [
  { question: 'What areas of law do you specialize in?', answer: 'We specialize in criminal law, civil litigation, family law, property law, corporate law, and constitutional law.', category: 'General', order: 1 },
  { question: 'How can I book a consultation?', answer: 'You can book a free consultation through our website, by calling us, or visiting our office during business hours (Mon-Sat, 9AM-7PM).', category: 'General', order: 2 },
  { question: 'What documents should I bring for my first consultation?', answer: 'Bring any relevant documents related to your case: FIR copies, property documents, court notices, contracts, or any other relevant paperwork.', category: 'Process', order: 3 },
  { question: 'What are your consultation fees?', answer: 'We offer a FREE initial consultation. Case fees vary based on complexity. We provide transparent fee structures with no hidden charges.', category: 'Fees', order: 4 },
  { question: 'Do you handle urgent/emergency cases?', answer: 'Yes, we handle urgent matters including bail applications, emergency injunctions, and time-sensitive legal matters. Call us on our emergency line.', category: 'General', order: 5 },
  { question: 'Do you practice in courts outside Delhi?', answer: 'Yes, we handle cases in High Courts across India and the Supreme Court. For local matters, we have a network of associate advocates.', category: 'General', order: 6 }
];

const defaultTestimonials = [
  { name: 'Ramesh Kumar', designation: 'Business Owner', rating: 5, message: 'Advocate Chauhan handled my property dispute with utmost professionalism. Won the case in 6 months. Highly recommend!', isApproved: true, isFeatured: true },
  { name: 'Priya Sharma', designation: 'Teacher', rating: 5, message: 'Got a fair settlement in my divorce case. The team was very supportive and explained everything clearly.', isApproved: true, isFeatured: true },
  { name: 'Anil Verma', designation: 'Engineer', rating: 5, message: 'My criminal case was handled expertly. Got bail within 24 hours. Dismissed in 3 hearings. Outstanding!', isApproved: true, isFeatured: true },
  { name: 'Sunita Devi', designation: 'Homemaker', rating: 5, message: 'Best advocate for family matters. Resolved our child custody issue sensitively and quickly.', isApproved: true, isFeatured: false },
  { name: 'Deepak Mehta', designation: 'Businessman', rating: 5, message: 'Corporate legal advice was invaluable. Saved our company from a major dispute. Very knowledgeable team.', isApproved: true, isFeatured: false }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { tlsAllowInvalidCertificates: true });
    console.log('Connected to MongoDB');

    // Admin
    const adminExists = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
    if (!adminExists) {
      await Admin.create({ name: process.env.ADMIN_NAME || 'Admin', email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, role: 'superadmin' });
      console.log('✓ Admin created');
    } else { console.log('- Admin already exists'); }

    // Services
    for (const s of defaultServices) {
      const exists = await Service.findOne({ title: s.title });
      if (!exists) await Service.create(s);
    }
    console.log('✓ Services seeded');

    // FAQs
    await FAQ.deleteMany({});
    await FAQ.insertMany(defaultFAQs);
    console.log('✓ FAQs seeded');

    // Testimonials
    for (const t of defaultTestimonials) {
      const exists = await Testimonial.findOne({ name: t.name });
      if (!exists) await Testimonial.create(t);
    }
    console.log('✓ Testimonials seeded');

    // Site Settings (seed via API after server starts)
    const settingsCount = await SiteSettings.countDocuments();
    if (settingsCount === 0) {
      console.log('ℹ  Hit GET /api/site-settings/seed to seed default settings');
    }

    console.log('\n✅ Database seeded successfully!');
    console.log(`\nAdmin Login:\n  Email: ${process.env.ADMIN_EMAIL}\n  Password: ${process.env.ADMIN_PASSWORD}`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
