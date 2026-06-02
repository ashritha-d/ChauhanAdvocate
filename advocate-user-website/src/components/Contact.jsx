import { useState } from 'react';
import { sendContact } from '../api';
import { useSite } from '../context/SiteContext';

const SOCIALS = [
  { key: 'social_facebook', icon: 'fab fa-facebook-f', label: 'Facebook' },
  { key: 'social_youtube', icon: 'fab fa-youtube', label: 'YouTube' },
  { key: 'social_twitter', icon: 'fab fa-twitter', label: 'Twitter' },
  { key: 'social_linkedin', icon: 'fab fa-linkedin-in', label: 'LinkedIn' },
  { key: 'social_instagram', icon: 'fab fa-instagram', label: 'Instagram' },
];

export default function Contact() {
  const { settings: s } = useSite();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  const showAlert = (type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert(null), 5000); };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!e.target.checkValidity()) { e.target.classList.add('was-validated'); return; }
    setSubmitting(true);
    try {
      const r = await sendContact(form);
      if (r.data.success) {
        showAlert('success', r.data.message || 'Message sent successfully!');
        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
        e.target.classList.remove('was-validated');
      } else { showAlert('danger', r.data.message || 'Something went wrong.'); }
    } catch { showAlert('danger', 'Server error. Please try again later.'); }
    setSubmitting(false);
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const phone   = s.contact_phone   || '9392538226';
  const phone2  = s.contact_phone2  || '9441335292';
  const email   = s.contact_email   || 'info@advocatechauhan.com';
  const address = s.contact_address || 'Balu Law Chamber, New Venkatramana Colony, Hasthinapuram, LB Nagar';
  const mapUrl  = s.contact_map     || 'https://maps.google.com/maps?q=17.333658%2C78.554825&z=17&hl=en';

  const mapEmbed = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed&z=15`;

  const socialItems = SOCIALS.filter(soc => s[soc.key]);

  return (
    <section id="contact" className="section-padding bg-white">
      <div className="container">
        <div className="text-center mb-5" data-aos="fade-up">
          <div className="section-label">Get In Touch</div>
          <h2 className="section-title">Contact <span className="text-gold">Us</span></h2>
          <p className="section-subtitle">We're here to help with your legal needs</p>
        </div>

        {/* Three equal-height columns */}
        <div className="row g-4 contact-equal-row">

          {/* ── Column 1: Contact Details ── */}
          <div className="col-lg-4 col-md-6 d-flex" data-aos="fade-up" data-aos-delay="0">
            <div className="contact-panel contact-panel--details w-100">
              <div className="contact-panel-header">
                <div className="contact-panel-icon"><i className="fas fa-address-card"></i></div>
                <h5>Contact Details</h5>
              </div>

              <div className="contact-panel-body">
                {[
                  {
                    icon: 'fas fa-phone-alt',
                    label: 'Phone',
                    content: (
                      <>
                        <a href={`tel:${phone}`} className="contact-link d-block">{phone}</a>
                        <a href={`tel:${phone2}`} className="contact-link d-block">{phone2}</a>
                      </>
                    ),
                  },
                  {
                    icon: 'fab fa-whatsapp',
                    label: 'WhatsApp',
                    content: (
                      <a href={`https://wa.me/91${s.contact_whatsapp || '9866222461'}`} className="contact-link" target="_blank" rel="noreferrer">
                        {s.contact_whatsapp || '9866222461'}
                      </a>
                    ),
                  },
                  {
                    icon: 'fas fa-envelope',
                    label: 'Email',
                    content: <a href={`mailto:${email}`} className="contact-link" style={{ wordBreak: 'break-all' }}>{email}</a>,
                  },
                  {
                    icon: 'fas fa-map-marker-alt',
                    label: 'Office Address',
                    content: (
                      <>
                        <p className="mb-1 text-muted" style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>{address}</p>
                        <a href={mapUrl} target="_blank" rel="noreferrer" className="text-gold small fw-semibold">
                          <i className="fas fa-directions me-1"></i>Get Directions
                        </a>
                      </>
                    ),
                  },
                  {
                    icon: 'fas fa-clock',
                    label: 'Office Hours',
                    content: <p className="mb-0 text-muted" style={{ fontSize: '0.88rem' }}>Mon–Sat: 9:00 AM – 7:00 PM</p>,
                  },
                ].map(({ icon, label, content }) => (
                  <div className="contact-detail-item" key={label}>
                    <div className="contact-detail-icon"><i className={icon}></i></div>
                    <div>
                      <div className="contact-detail-label">{label}</div>
                      {content}
                    </div>
                  </div>
                ))}
              </div>

              {/* Social links pinned to bottom */}
              {socialItems.length > 0 && (
                <div className="contact-panel-footer">
                  <div className="contact-social-label">Follow Us</div>
                  <div className="contact-social-row">
                    {socialItems.map(soc => (
                      <a key={soc.key} href={s[soc.key]} target="_blank" rel="noreferrer" title={soc.label} className="contact-social-btn">
                        <i className={soc.icon}></i>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Column 2: Location (Map) ── */}
          <div className="col-lg-4 col-md-6 d-flex" data-aos="fade-up" data-aos-delay="100">
            <div className="contact-panel contact-panel--map w-100">
              <div className="contact-panel-header">
                <div className="contact-panel-icon"><i className="fas fa-map-marked-alt"></i></div>
                <h5>Our Location</h5>
              </div>
              <div className="contact-map-fill">
                <iframe
                  title="Office Location"
                  src={mapEmbed}
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: 'block', minHeight: 300 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
              <div className="contact-map-address">
                <i className="fas fa-map-marker-alt text-gold me-2"></i>
                <span>{address}</span>
              </div>
            </div>
          </div>

          {/* ── Column 3: Send Message ── */}
          <div className="col-lg-4 col-md-12 d-flex" data-aos="fade-up" data-aos-delay="200">
            <div className="contact-panel contact-panel--form w-100">
              <div className="contact-panel-header">
                <div className="contact-panel-icon"><i className="fas fa-paper-plane"></i></div>
                <h5>Send Us a Message</h5>
              </div>

              <div className="contact-panel-body contact-form-body">
                <form onSubmit={handleSubmit} noValidate className="d-flex flex-column h-100">
                  <div className="row g-3 flex-grow-1">
                    <div className="col-12">
                      <input type="text" className="form-control" value={form.name} onChange={set('name')} placeholder="Your Full Name *" required />
                    </div>
                    <div className="col-12">
                      <input type="email" className="form-control" value={form.email} onChange={set('email')} placeholder="Email Address *" required />
                    </div>
                    <div className="col-12">
                      <input type="tel" className="form-control" value={form.phone} onChange={set('phone')} placeholder="Phone Number" />
                    </div>
                    <div className="col-12">
                      <input type="text" className="form-control" value={form.subject} onChange={set('subject')} placeholder="Subject *" required />
                    </div>
                    <div className="col-12 d-flex flex-column flex-grow-1">
                      <textarea
                        className="form-control contact-msg-area"
                        value={form.message}
                        onChange={set('message')}
                        placeholder="Your Message *"
                        required
                      ></textarea>
                    </div>
                  </div>

                  <div className="mt-3">
                    <button type="submit" className="btn btn-gold w-100 py-3" disabled={submitting}>
                      {submitting
                        ? <><i className="fas fa-spinner fa-spin me-2"></i>Sending...</>
                        : <><i className="fas fa-paper-plane me-2"></i>Send Message</>
                      }
                    </button>
                  </div>

                  {alert && <div className={`alert alert-${alert.type} mt-3 mb-0`}>{alert.msg}</div>}
                </form>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
