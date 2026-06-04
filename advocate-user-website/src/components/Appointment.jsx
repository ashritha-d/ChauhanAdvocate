import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServices, getAvailableSlots } from '../api';
import { useSite } from '../context/SiteContext';
import { useUserAuth } from '../context/UserAuthContext';
import { savePendingAction } from '../utils/pendingAction';

const APPT_FEES = { offline: 1, online: 2 };

export default function Appointment() {
  const { settings: s } = useSite();
  const { user, authHeader } = useUserAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ name:'', email:'', phone:'', service:'', date:'', time:'', message:'', appointmentMode:'offline' });
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    getServices().then(r => { if (r.data.success) setServices(r.data.data); }).catch(() => {});
    if (user) setForm(f => ({ ...f, name: user.name || f.name, email: user.email || f.email, phone: user.phone || f.phone }));
  }, [user]);

  const loadSlots = useCallback(async (date) => {
    if (!date) { setSlots([]); return; }
    setSlotsLoading(true);
    try {
      const r = await getAvailableSlots(date);
      if (r.data.success) setSlots(r.data.slots);
    } catch { setSlots([]); }
    setSlotsLoading(false);
  }, []);

  const handleDateChange = (e) => {
    const date = e.target.value;
    setForm(f => ({ ...f, date, time: '' }));
    loadSlots(date);
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!e.target.checkValidity()) { e.target.classList.add('was-validated'); return; }
    const amount = APPT_FEES[form.appointmentMode] || 1000;
    sessionStorage.setItem('pendingAppointment', JSON.stringify({ ...form, userId: user?._id, amount }));
    setSubmitting(true);
    setTimeout(() => navigate('/payment'), 300);
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const weekdayHours = s.office_hours_weekday || 'Mon–Sat: 9:00 AM – 7:00 PM';
  const sundayHours  = s.office_hours_sunday  || 'Sunday: 2:00 PM – 7:00 PM';
  const infoItems = [
    { icon: 'fas fa-clock',         title: 'Office Hours',       text: `${weekdayHours}  |  ${sundayHours}` },
    { icon: 'fas fa-phone',          title: 'Emergency Contact',  text: s.contact_phone || '+91 93925 38226' },
    { icon: 'fas fa-map-marker-alt', title: 'Location',           text: s.contact_address || 'Balu Law Chamber, New Venkatramana Colony, Hasthinapuram, LB Nagar' },
  ];

  return (
    <section id="appointment" className="section-padding appointment-section">
      <div className="container">
        <div className="row align-items-center g-5">

          {/* Left info column */}
          <div className="col-lg-5" data-aos="fade-right">
            <div className="section-label" style={{ color: 'rgba(201,168,76,0.8)' }}>Schedule a Meeting</div>
            <h2 className="section-title text-white">Book Your <span className="text-gold">Consultation</span></h2>
            <p style={{ color: 'rgba(255,255,255,0.75)' }} className="mb-4">Take the first step towards resolving your legal matter.</p>
            <div className="appointment-info">
              {infoItems.map(({ icon, title, text }) => (
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

          {/* Right: form / login gate */}
          <div className="col-lg-7" data-aos="fade-left">
            {user ? (
              /* ── Booking Form ── */
              <div className="appointment-form-card">
                <h4 className="mb-4"><i className="fas fa-calendar-alt text-gold me-2"></i>Book an Appointment</h4>

                {error && (
                  <div className="appt-error-card mb-3">
                    <i className="fas fa-exclamation-circle me-2"></i>
                    <div><strong>Error</strong><p className="mb-0 mt-1 small">{error}</p></div>
                    <button className="btn-close ms-auto flex-shrink-0" onClick={() => setError('')}></button>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Full Name *</label>
                      <input type="text" className="form-control" value={form.name} onChange={set('name')} placeholder="Your full name" required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email Address</label>
                      <input type="email" className="form-control" value={form.email} onChange={set('email')} placeholder="your@email.com" />
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
                      <input type="date" className="form-control" value={form.date} min={todayStr} onChange={handleDateChange} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">
                        Preferred Time *
                        {slotsLoading && <span className="text-muted ms-2 small"><i className="fas fa-spinner fa-spin"></i></span>}
                      </label>
                      <select className="form-select" value={form.time} onChange={set('time')} required disabled={!form.date || slotsLoading}>
                        <option value="">{form.date ? 'Select time...' : 'Select date first'}</option>
                        {slots.map(({ time, available }) => (
                          <option key={time} value={time} disabled={!available}>{time}{!available ? ' — Booked' : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Appointment Type *</label>
                      <div className="d-flex gap-3 mt-1">
                        {[
                          { value: 'offline', label: 'Offline — ₹1,000', icon: 'fa-building' },
                          { value: 'online',  label: 'Online — ₹500',    icon: 'fa-video' },
                        ].map(({ value, label, icon }) => (
                          <label key={value} className={`appt-type-card${form.appointmentMode === value ? ' active' : ''}`} style={{ flex:1, cursor:'pointer' }}>
                            <input type="radio" name="appointmentMode" value={value} checked={form.appointmentMode === value} onChange={set('appointmentMode')} style={{ display:'none' }} />
                            <i className={`fas ${icon} me-2`}></i>{label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Message / Case Brief</label>
                      <textarea className="form-control" rows="3" value={form.message} onChange={set('message')} placeholder="Briefly describe your legal matter..."></textarea>
                    </div>

                    {/* Fee Summary Card */}
                    <div className="col-12">
                      <div style={{ background:'linear-gradient(135deg,#f9f5e8,#fff9ed)', border:'1.5px solid rgba(201,168,76,0.3)', borderRadius:12, padding:'14px 16px' }}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="small text-muted mb-1"><i className="fas fa-shield-alt me-1 text-success"></i>Secure Online Payment</div>
                            <div className="fw-semibold small">{form.appointmentMode === 'online' ? 'Online' : 'Offline'} Consultation Fee</div>
                          </div>
                          <div className="text-end">
                            <div style={{ fontSize:'1.4rem', fontWeight:700, color:'#C9A84C' }}>
                              ₹{(APPT_FEES[form.appointmentMode] || 1000).toLocaleString('en-IN')}
                            </div>
                            <div className="small text-muted">+ GST as applicable</div>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-top d-flex gap-2 align-items-center flex-wrap">
                          <span className="badge bg-light text-dark border">Razorpay</span>
                          <span className="badge bg-light text-dark border">PhonePe</span>
                          <span className="badge bg-light text-dark border">Google Pay</span>
                          <span className="badge bg-light text-dark border">UPI</span>
                          <span className="badge bg-light text-dark border">QR Code</span>
                        </div>
                      </div>
                    </div>

                    <div className="col-12">
                      <button type="submit" className="btn btn-gold w-100 py-3" disabled={submitting}>
                        {submitting
                          ? <><i className="fas fa-spinner fa-spin me-2"></i>Redirecting to Payment...</>
                          : <><i className="fas fa-arrow-right me-2"></i>Proceed to Payment</>
                        }
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              /* ── Guest Login Gate ── */
              <div className="appt-gate-card">
                <div className="appt-gate-lock"><i className="fas fa-lock"></i></div>
                <h4 className="appt-gate-title">Login Required</h4>
                <p className="appt-gate-sub">
                  Please login or create an account to book an appointment and track its status in your dashboard.
                </p>
                <div className="appt-gate-features">
                  {[
                    'Track appointment status in real-time',
                    'Receive notifications on updates',
                    'Download payment receipts',
                    'Manage all your bookings in one place',
                  ].map(f => (
                    <div key={f} className="appt-gate-feature">
                      <i className="fas fa-check-circle"></i> {f}
                    </div>
                  ))}
                </div>
                <div className="d-flex gap-3 flex-wrap justify-content-center mt-4">
                  <button className="btn btn-gold px-5 py-3" onClick={() => { savePendingAction('appointment'); navigate('/login'); }}>
                    <i className="fas fa-sign-in-alt me-2"></i>Login to Book
                  </button>
                  <button className="btn btn-outline-light px-5 py-3" onClick={() => { savePendingAction('appointment'); navigate('/register'); }}>
                    <i className="fas fa-user-plus me-2"></i>Create Account
                  </button>
                </div>
                <p className="appt-gate-note mt-3">
                  Already have an account?{' '}
                  <button className="btn btn-link text-gold fw-semibold p-0" onClick={() => { savePendingAction('appointment'); navigate('/login'); }}>
                    Sign in
                  </button>
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
