import { useEffect, useState, useCallback } from 'react';
import { getServices, bookAppointment, getAvailableSlots } from '../api';
import { useUserAuth } from '../context/UserAuthContext';
import AppointmentSuccessCard from './AppointmentSuccessCard';

const todayStr = () => new Date().toISOString().split('T')[0];

export default function AppointmentModal({ onClose }) {
  const { user, authHeader } = useUserAuth();
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '',
    phone: user?.phone || '', service: '', date: '', time: '', message: '', appointmentMode: 'offline',
  });
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [booked, setBooked] = useState(null);

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

  const handleSubmit = async e => {
    e.preventDefault();
    if (!e.target.checkValidity()) { e.target.classList.add('was-validated'); return; }
    setSubmitting(true);
    setError('');
    try {
      const payload = user ? { ...form, userId: user._id } : form;
      const r = await bookAppointment(payload, user ? authHeader() : {});
      if (r.data.success) {
        setBooked({
          appointmentId: r.data.data?.appointmentId || '',
          name: form.name,
          email: form.email,
          service: form.service,
          date: form.date,
          time: form.time,
          appointmentMode: form.appointmentMode,
        });
      } else {
        setError(r.data.message || 'Something went wrong. Please try again.');
        if (form.date) loadSlots(form.date);
      }
    } catch {
      setError('Server error. Please try again or call us directly.');
    }
    setSubmitting(false);
  };

  const handleBookAnother = () => {
    setBooked(null);
    setForm({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', service: '', date: '', time: '', message: '', appointmentMode: 'offline' });
    setSlots([]);
  };

  return (
    <div className="modal-backdrop" onClick={!booked ? onClose : undefined}>
      <div className={`appt-modal ${booked ? 'appt-modal-success' : ''}`} onClick={e => e.stopPropagation()}>
        <button className="jr-modal-close" onClick={onClose}>&times;</button>

        {booked ? (
          <AppointmentSuccessCard
            booked={booked}
            onBookAnother={handleBookAnother}
            onClose={onClose}
          />
        ) : (
          <>
            <h5 className="mb-1" style={{ fontFamily: "'Playfair Display',serif" }}>
              <i className="fas fa-calendar-alt text-gold me-2"></i>Book an Appointment
            </h5>
            <p className="text-muted small mb-3">Fill in the details below to schedule your consultation</p>

            {error && (
              <div className="appt-error-card">
                <i className="fas fa-exclamation-circle me-2"></i>
                <div>
                  <strong>Booking Failed</strong>
                  <p className="mb-0 mt-1 small">{error}</p>
                </div>
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
                  <label className="form-label form-label-sm">Appointment Type *</label>
                  <div className="d-flex gap-3 mt-1">
                    {[
                      { value: 'offline', label: 'Offline Appointment', icon: 'fa-building' },
                      { value: 'online',  label: 'Online Appointment',  icon: 'fa-video' },
                    ].map(({ value, label, icon }) => (
                      <label key={value} className={`appt-type-card appt-type-card-sm${form.appointmentMode === value ? ' active' : ''}`}>
                        <input type="radio" name="appointmentMode" value={value} checked={form.appointmentMode === value} onChange={set('appointmentMode')} />
                        <i className={`fas ${icon} me-2`}></i>{label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label form-label-sm">Message / Case Brief</label>
                  <textarea className="form-control form-control-sm" rows={2} value={form.message} onChange={set('message')} placeholder="Briefly describe your legal matter…"></textarea>
                </div>
              </div>
              <button type="submit" className="btn btn-gold w-100 mt-3" disabled={submitting}>
                {submitting
                  ? <><i className="fas fa-spinner fa-spin me-2"></i>Submitting…</>
                  : <><i className="fas fa-paper-plane me-2"></i>Submit</>
                }
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
