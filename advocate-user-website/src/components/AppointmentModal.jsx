import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServices, getAvailableSlots } from '../api';
import { useUserAuth } from '../context/UserAuthContext';

const todayStr = () => new Date().toISOString().split('T')[0];
const APPT_FEES = { offline: 1, online: 2 };

export default function AppointmentModal({ onClose }) {
  const { user } = useUserAuth();
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '',
    phone: user?.phone || '', service: '', date: '', time: '', message: '', appointmentMode: 'offline',
  });
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getServices().then(r => { if (r.data.success) setServices(r.data.data); }).catch(() => {});
  }, []);

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

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = e => {
    e.preventDefault();
    if (!e.target.checkValidity()) { e.target.classList.add('was-validated'); return; }
    const amount = APPT_FEES[form.appointmentMode] || 1;
    sessionStorage.setItem('pendingAppointment', JSON.stringify({
      ...form,
      userId: user?._id,
      amount,
    }));
    setSubmitting(true);
    onClose();
    setTimeout(() => navigate('/payment'), 100);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div ref={modalRef} className="appt-modal" onClick={e => e.stopPropagation()}>
        <button className="jr-modal-close" onClick={onClose}>&times;</button>

        <h5 className="mb-1" style={{ fontFamily: "'Playfair Display',serif" }}>
          <i className="fas fa-calendar-alt text-gold me-2"></i>Book an Appointment
        </h5>
        <p className="text-muted small mb-3">Fill in the details below to schedule your consultation</p>

        {error && (
          <div className="appt-error-card">
            <i className="fas fa-exclamation-circle me-2"></i>
            <div><strong>Error</strong><p className="mb-0 mt-1 small">{error}</p></div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="row g-2">
            <div className="col-md-6">
              <label className="form-label form-label-sm">Full Name *</label>
              <input className="form-control form-control-sm" value={form.name} onChange={set('name')} placeholder="Your full name" required />
            </div>
            <div className="col-md-6">
              <label className="form-label form-label-sm">Phone Number *</label>
              <input className="form-control form-control-sm" type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" required />
            </div>
            <div className="col-12">
              <label className="form-label form-label-sm">Email Address</label>
              <input className="form-control form-control-sm" type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" />
            </div>
            <div className="col-12">
              <label className="form-label form-label-sm">Legal Service *</label>
              <select className="form-select form-select-sm" value={form.service} onChange={set('service')} required>
                <option value="">Select service…</option>
                {services.map(sv => <option key={sv._id} value={sv.title}>{sv.title}</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label form-label-sm">Preferred Date *</label>
              <input type="date" className="form-control form-control-sm" value={form.date} min={todayStr()} onChange={handleDateChange} required />
            </div>
            <div className="col-md-6">
              <label className="form-label form-label-sm">
                Preferred Time *
                {slotsLoading && <span className="ms-1 small text-muted"><i className="fas fa-spinner fa-spin"></i></span>}
              </label>
              <select className="form-select form-select-sm" value={form.time} onChange={set('time')} required disabled={!form.date || slotsLoading}>
                <option value="">{form.date ? 'Select time…' : 'Select date first'}</option>
                {slots.map(({ time, available }) => (
                  <option key={time} value={time} disabled={!available}>{time}{!available ? ' — Booked' : ''}</option>
                ))}
              </select>
            </div>
            <div className="col-12">
              <label className="form-label form-label-sm">Appointment Type</label>
              <div className="d-flex gap-3 mt-1">
                {[
                  { value: 'offline', label: `Offline — ₹${APPT_FEES.offline}`, icon: 'fa-building' },
                  { value: 'online',  label: `Online — ₹${APPT_FEES.online}`,   icon: 'fa-video' },
                ].map(({ value, label, icon }) => (
                  <label key={value} className={`appt-type-card appt-type-card-sm${form.appointmentMode === value ? ' active' : ''}`} style={{ flex:1, cursor:'pointer' }}>
                    <input type="radio" name="appointmentMode" value={value} checked={form.appointmentMode === value} onChange={set('appointmentMode')} style={{ display:'none' }} />
                    <i className={`fas ${icon} me-2`}></i>{label}
                  </label>
                ))}
              </div>
            </div>
            <div className="col-12">
              <label className="form-label form-label-sm">Message / Case Brief</label>
              <textarea className="form-control form-control-sm" rows={2} value={form.message} onChange={set('message')} placeholder="Briefly describe your legal matter…"></textarea>
            </div>

            {/* Fee summary */}
            <div className="col-12">
              <div style={{ background:'#f9f5e8', border:'1px solid rgba(201,168,76,0.3)', borderRadius:10, padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span className="small text-muted"><i className="fas fa-shield-alt me-1 text-success"></i>Consultation Fee</span>
                <span style={{ fontWeight:700, color:'#C9A84C', fontSize:'1.1rem' }}>
                  ₹{APPT_FEES[form.appointmentMode] || 1}
                </span>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-gold w-100 mt-3" disabled={submitting}>
            {submitting
              ? <><i className="fas fa-spinner fa-spin me-2"></i>Redirecting to Payment…</>
              : <><i className="fas fa-arrow-right me-2"></i>Proceed to Payment</>
            }
          </button>
        </form>
      </div>
    </div>
  );
}
