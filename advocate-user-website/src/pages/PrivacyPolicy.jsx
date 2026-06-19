import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

export default function PrivacyPolicy() {
  return (
    <>
      <SEOHead
        title="Privacy Policy"
        description="Privacy policy for the Advocate Chauhan website. Learn how we collect, use, and protect your personal information."
        canonical="/privacy-policy"
      />
      <div className="privacy-hero text-white">
        <div className="container">
          <h1 className="display-5 fw-bold">Privacy <span className="text-gold">Policy</span></h1>
          <p className="lead mt-2" style={{ color: 'rgba(255,255,255,0.7)' }}>Last updated: {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>
      <div className="container py-5 privacy-content">
        <div className="row justify-content-center">
          <div className="col-lg-9">
            <p>This Privacy Policy describes how Advocate Chauhan collects, uses, and shares information about you when you use our website and services.</p>
            <h2>Information We Collect</h2>
            <p>We collect information you provide directly to us, such as when you book an appointment or send us a message:</p>
            <ul>
              <li>Name, email address, and phone number</li>
              <li>Details about your legal matter</li>
              <li>Any other information you choose to provide</li>
            </ul>
            <h2>How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Respond to your inquiries and provide legal consultations</li>
              <li>Schedule and manage appointments</li>
              <li>Communicate with you about our services</li>
              <li>Improve our website and services</li>
            </ul>
            <h2>Information Sharing</h2>
            <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
            <ul>
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and property</li>
            </ul>
            <h2>Data Security</h2>
            <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
            <h2>Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us through our <Link to="/#contact">Contact page</Link>.</p>
          </div>
        </div>
      </div>
    </>
  );
}
