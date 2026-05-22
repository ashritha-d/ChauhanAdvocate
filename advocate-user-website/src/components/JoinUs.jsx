import { useState } from 'react';
import SliderSection from './SliderSection';
import { useSite } from '../context/SiteContext';

function JrAdvocateModal({ onClose }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', experience: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="jr-modal" onClick={e => e.stopPropagation()}>
        <button className="jr-modal-close" onClick={onClose}>&times;</button>
        <h4 className="mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
          Join as <span style={{ color: 'var(--gold)' }}>Jr. Advocate</span>
        </h4>
        {submitted ? (
          <div className="text-center py-4">
            <i className="fas fa-check-circle fa-3x mb-3" style={{ color: 'var(--gold)' }}></i>
            <p className="fw-bold">Application submitted!</p>
            <p className="text-muted small">We will contact you shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input className="form-control" placeholder="Full Name *" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="mb-3">
              <input className="form-control" type="email" placeholder="Email Address *" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="mb-3">
              <input className="form-control" type="tel" placeholder="Phone Number *" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="mb-3">
              <textarea className="form-control" rows="3" placeholder="Brief about your experience / education" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-gold w-100">Submit Application</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function JoinUs() {
  const { settings: s } = useSite();
  const [showModal, setShowModal] = useState(false);

  const waNumber = (s.contact_whatsapp || s.contact_phone || '919392538226').replace(/\D/g, '');

  const items = [
    {
      img: '/adv-photos/p1.webp',
      title: 'WhatsApp Legal Updates Group',
      description: 'Join our exclusive WhatsApp group for daily legal updates, case studies, and quick legal tips.',
      buttonText: 'Join Now',
      href: `https://wa.me/${waNumber}?text=I want to join the legal updates group`,
      external: true,
    },
    {
      img: '/adv-photos/p4.webp',
      title: 'Telegram Legal Updates Channel',
      description: 'Subscribe to our Telegram channel for in-depth legal analysis, judgment updates, and legislative changes.',
      buttonText: 'Subscribe Now',
      href: 'https://t.me/yourchannel',
      external: true,
    },
    {
      img: '/adv-photos/p5.webp',
      title: 'Monthly Legal Newsletter',
      description: 'Get our comprehensive monthly newsletter featuring landmark judgments, legal amendments, and expert commentary.',
      buttonText: 'Subscribe',
      href: '#contact',
    },
    {
      img: '/adv-photos/p1.webp',
      title: 'Join as Jr. Advocate',
      description: 'Start your legal career with us. Submit your details to apply for a junior advocate position.',
      buttonText: 'Apply Now',
      isButton: true,
      onClick: () => setShowModal(true),
    },
  ];

  return (
    <>
      <SliderSection
        id="join"
        label="Community"
        title={<>Join <span className="text-gold">With Us</span></>}
        description="Become part of our legal community and stay updated with the latest insights"
        items={items}
        bg="bg-light"
      />
      {showModal && <JrAdvocateModal onClose={() => setShowModal(false)} />}
    </>
  );
}
