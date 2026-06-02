import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getServices, bookAppointment } from '../api';
import { useSite } from '../context/SiteContext';
import { useUserAuth } from '../context/UserAuthContext';

const TIMES = ['09:00 AM','10:00 AM','11:00 AM','12:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM','06:00 PM'];

export default function Appointment() {
  const { settings: s } = useSite();
  const { user, authHeader } = useUserAuth();
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ name:'', email:'', phone:'', service:'', date:'', time:'', message:'' });
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('appt-date-input')?.setAttribute('min', tomorrow.toISOString().split('T')[0]);
    getServices().then(r => { if (r.data.success) setServices(r.data.data); }).catch(() => {});
    if (user) setForm(f => ({ ...f, name: user.name || f.name, email: user.email || f.email, phone: user.phone || f.phone }));
  }, [user]);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!e.target.checkValidity()) { e.target.classList.add('was-validated'); return; }
    setSubmitting(true);
    try {
      const payload = user ? { ...form, userId: user._id } : form;
      const r = await bookAppointment(payload, user ? authHeader() : {});
      if (r.data.success) {
        showAlert('success', (r.data.message || 'Appointment booked successfully!') + (user ? ' <a href="/ChauhanAdvocate/profile?tab=appointments" class="alert-link ms-1">View in dashboard →</a>' : ''));
        setForm({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', service:'', date:'', time:'', message:'' });
        e.target.classList.remove('was-validated');
      } else { showAlert('danger', r.data.message || 'Something went wrong.'); }
    } catch { showAlert('danger', 'Server error. Please try again later or call us directly.'); }
    setSubmitting(false);
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <section id="appointment" className="section-padding appointment-section">
      <div className="container">
        <div className="row align-items-center g-5">
          <div className="col-lg-5" data-aos="fade-right">
            <div className="section-label" style={{ color: 'rgba(201,168,76,0.8)' }}>Schedule a Meeting</div>
            <h2 className="section-title text-white">Book Your <span className="text-gold">Free Consultation</span></h2>
            <p style={{ color: 'rgba(255,255,255,0.75)' }} className="mb-4">Take the first step towards resolving your legal matter.</p>
            <div className="appointment-info">
              {[
                { icon: 'fas fa-clock', title: 'Office Hours', text: 'Mon-Sat: 9:00 AM – 7:00 PM' },
                { icon: 'fas fa-phone', title: 'Emergency Contact', text: s.contact_phone || '+91 93925 38226' },
                { icon: 'fas fa-map-marker-alt', title: 'Location', text: s.contact_address || 'Balu Law Chamber, New Venkatramana Colony, Hasthinapuram, LB Nagar' },
              ].map(({ icon, title, text }) => (
                <div className="info-item" key={title}>
                  <i className={`${icon} text-gold`}></i>
                  <div>
                    <strong className="text-white">{title}</strong>
                    <p style={{ color: 'rgba(255,255,255,0.75)' }} className="mb-0">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="col-lg-7" data-aos="fade-left">
            <div className="appointment-form-card">
              <h4 className="mb-4"><i className="fas fa-calendar-alt text-gold me-2"></i>Book Appointment</h4>

              {/* Login/Register prompt for guests */}
              {!user && (
                <div className="appt-login-prompt">
                  <i className="fas fa-user-shield fa-lg text-gold"></i>
                  <div className="flex-grow-1">
                    <div className="fw-semibold" style={{ fontSize: '0.92rem' }}>Login to track your appointment</div>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>Create an account to view appointment history and get status updates.</div>
                  </div>
                  <div className="d-flex gap-2 flex-shrink-0">
                    <Link to="/login" className="btn btn-sm btn-gold">Login</Link>
                    <Link to="/register" className="btn btn-sm btn-outline-secondary">Register</Link>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Full Name *</label>
                    <input type="text" className="form-control" value={form.name} onChange={set('name')} placeholder="Your full name" required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email Address *</label>
                    <input type="email" className="form-control" value={form.email} onChange={set('email')} placeholder="your@email.com" required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Phone Number *</label>
                    <input type="tel" className="form-control" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Legal Service *</label>
                    <select className="form-select" value={form.service} onChange={set('service')} required>
                      <option value="">Select service...</option>
                      {services.map(sv => <option key={sv._id} value={sv.title}>{sv.title}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Preferred Date *</label>
                    <input type="date" id="appt-date-input" className="form-control" value={form.date} onChange={set('date')} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Preferred Time *</label>
                    <select className="form-select" value={form.time} onChange={set('time')} required>
                      <option value="">Select time...</option>
                      {TIMES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Message / Case Brief</label>
                    <textarea className="form-control" rows="3" value={form.message} onChange={set('message')} placeholder="Briefly describe your legal matter..."></textarea>
                  </div>
                  <div className="col-12">
                    <button type="submit" className="btn btn-gold w-100 py-3" disabled={submitting}>
                      {submitting
                        ? <><i className="fas fa-spinner fa-spin me-2"></i>Booking...</>
                        : <><i className="fas fa-calendar-check me-2"></i>Confirm Appointment</>
                      }
                    </button>
                  </div>
                </div>
              </form>
              {alert && (
                <div className={`alert alert-${alert.type} mt-3`} dangerouslySetInnerHTML={{ __html: alert.msg }}></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
