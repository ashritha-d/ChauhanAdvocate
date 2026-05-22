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
  const [form, setForm] = useState({ name:'', email:'', phone:'', subject:'', message:'' });
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
        setForm({ name:'', email:'', phone:'', subject:'', message:'' });
        e.target.classList.remove('was-validated');
      } else { showAlert('danger', r.data.message || 'Something went wrong.'); }
    } catch { showAlert('danger', 'Server error. Please try again later.'); }
    setSubmitting(false);
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const phone = s.contact_phone || '9392538226';
  const phone2 = s.contact_phone2 || '9441335292';
  const email = s.contact_email || 'info@advocatechauhan.com';
  const address = s.contact_address || 'District Court Complex, Hyderabad';
  const mapUrl = s.contact_map || 'https://maps.google.com/maps?q=17.33365821838379%2C78.55482482910156&z=17&hl=en';

  return (
    <section id="contact" className="section-padding bg-white">
      <div className="container">
        <div className="text-center mb-5" data-aos="fade-up">
          <div className="section-label">Get In Touch</div>
          <h2 className="section-title">Contact <span className="text-gold">Us</span></h2>
          <p className="section-subtitle">We're here to help with your legal needs</p>
        </div>
        <div className="row g-5">
          <div className="col-lg-4" data-aos="fade-right">
            <div className="contact-info-card">
              {[
                { icon: 'fas fa-phone-alt', label: 'Phone', content: (
                  <>
                    <a href={`tel:${phone}`} className="text-dark d-block">{phone}</a>
                    <a href={`tel:${phone2}`} className="text-dark d-block">{phone2}</a>
                  </>
                )},
                { icon: 'fab fa-whatsapp', label: 'WhatsApp', content: <a href={`https://wa.me/91${s.contact_whatsapp || '9866222461'}`} className="text-dark" target="_blank" rel="noreferrer">{s.contact_whatsapp || '9866222461'}</a> },
                { icon: 'fas fa-envelope', label: 'Email', content: <a href={`mailto:${email}`} className="text-dark">{email}</a> },
                { icon: 'fas fa-map-marker-alt', label: 'Office Address', content: (
                  <>
                    <p className="mb-1 text-muted">{address}</p>
                    <a href={mapUrl} target="_blank" rel="noreferrer" className="text-gold small"><i className="fas fa-directions me-1"></i>Get Directions</a>
                  </>
                )},
                { icon: 'fas fa-clock', label: 'Office Hours', content: <p className="mb-0 text-muted">Mon–Sat: 9:00 AM – 7:00 PM</p> },
              ].map(({ icon, label, content }) => (
                <div className="contact-info-item" key={label}>
                  <div className="ci-icon"><i className={icon}></i></div>
                  <div><h6>{label}</h6>{content}</div>
                </div>
              ))}
            </div>
            <div className="social-links mt-4">
              {SOCIALS.filter(soc => s[soc.key]).map(soc => (
                <a key={soc.key} href={s[soc.key]} target="_blank" rel="noreferrer" title={soc.label}>
                  <i className={soc.icon}></i>
                </a>
              ))}
            </div>
          </div>
          <div className="col-lg-8" data-aos="fade-left">
            <div className="contact-form-card">
              <h4 className="mb-4"><i className="fas fa-paper-plane text-gold me-2"></i>Send Us a Message</h4>
              <form onSubmit={handleSubmit} noValidate>
                <div className="row g-3">
                  <div className="col-md-6">
                    <input type="text" className="form-control" value={form.name} onChange={set('name')} placeholder="Your Full Name *" required />
                  </div>
                  <div className="col-md-6">
                    <input type="email" className="form-control" value={form.email} onChange={set('email')} placeholder="Email Address *" required />
                  </div>
                  <div className="col-md-6">
                    <input type="tel" className="form-control" value={form.phone} onChange={set('phone')} placeholder="Phone Number" />
                  </div>
                  <div className="col-md-6">
                    <input type="text" className="form-control" value={form.subject} onChange={set('subject')} placeholder="Subject *" required />
                  </div>
                  <div className="col-12">
                    <textarea className="form-control" rows="5" value={form.message} onChange={set('message')} placeholder="Your Message *" required></textarea>
                  </div>
                  <div className="col-12">
                    <button type="submit" className="btn btn-gold px-5 py-3" disabled={submitting}>
                      {submitting
                        ? <><i className="fas fa-spinner fa-spin me-2"></i>Sending...</>
                        : <><i className="fas fa-paper-plane me-2"></i>Send Message</>
                      }
                    </button>
                  </div>
                </div>
              </form>
              {alert && <div className={`alert alert-${alert.type} mt-3`}>{alert.msg}</div>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
