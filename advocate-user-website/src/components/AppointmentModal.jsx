import { useEffect, useState, useCallback } from 'react';
import { getServices, bookAppointment, getAvailableSlots } from '../api';
import { useUserAuth } from '../context/UserAuthContext';

const todayStr = () => new Date().toISOString().split('T')[0];

export default function AppointmentModal({ onClose, onSuccess }) {
  const { user, authHeader } = useUserAuth();
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '',
    phone: user?.phone || '', service: '', date: '', time: '', message: '',
  });
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [booked, setBooked] = useState(null); // { appointmentId, service, date, time }

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
        const apptId = r.data.data?.appointmentId || '';
        setBooked({
          appointmentId: apptId,
          service: form.service,
          date: form.date,
          time: form.time,
          name: form.name,
        });
        onSuccess?.();
      } else {
        setError(r.data.message || 'Something went wrong. Please try again.');
        if (form.date) loadSlots(form.date);
      }
    } catch {
      setError('Server error. Please try again or call us directly.');
    }
    setSubmitting(false);
  };

  return (
    <div className="modal-backdrop" onClick={!booked ? onClose : undefined}>
      <div className="appt-modal" onClick={e => e.stopPropagation()}>
        <button className="jr-modal-close" onClick={onClose}>&times;</button>

        {booked ? (
          /* ── Success Screen ── */
          <div className="form-success-screen">
            <div className="form-success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h5 className="form-success-title">Appointment Booked Successfully!</h5>
            <p className="form-success-msg">
              Your appointment request has been submitted successfully. We will contact you shortly to confirm.
            </p>
            {booked.appointmentId && (
              <div className="form-success-ref">
                <span className="form-success-ref-label">Appointment ID</span>
                <span className="form-success-ref-value">{booked.appointmentId}</span>
              </div>
            )}
            <div className="form-success-details">
              {booked.service && <div><i className="fas fa-briefcase me-2 text-gold"></i><strong>Service:</strong> {booked.service}</div>}
              {booked.date && <div><i className="fas fa-calendar me-2 text-gold"></i><strong>Date:</strong> {new Date(booked.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>}
              {booked.time && <div><i className="fas fa-clock me-2 text-gold"></i><strong>Time:</strong> {booked.time}</div>}
            </div>
            <p className="form-success-note">
              <i className="fab fa-whatsapp me-1 text-success"></i>
              A WhatsApp confirmation has been sent to your registered number.
            </p>
            <button className="btn btn-gold mt-3 px-5" onClick={onClose}>
              <i className="fas fa-times me-2"></i>Close
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <>
            <h5 className="mb-1" style={{ fontFamily: "'Playfair Display',serif" }}>
              <i className="fas fa-calendar-alt text-gold me-2"></i>Book an Appointment
            </h5>
            <p className="text-muted small mb-3">Fill in the details below to schedule your consultation</p>

            {error && (
              <div className="alert alert-danger py-2 small mb-3">
                <i className="fas fa-exclamation-circle me-1"></i>{error}
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
