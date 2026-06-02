import { useEffect, useState, useCallback } from 'react';
import { getServices, bookAppointment, getAvailableSlots } from '../api';
import { useUserAuth } from '../context/UserAuthContext';

const todayStr = () => new Date().toISOString().split('T')[0];

export default function AppointmentModal({ onClose }) {
  const { user, authHeader } = useUserAuth();
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '',
    phone: user?.phone || '', service: '', date: '', time: '', message: '',
  });
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

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
    setAlert(null);
    try {
      const payload = user ? { ...form, userId: user._id } : form;
      const r = await bookAppointment(payload, user ? authHeader() : {});
      if (r.data.success) {
        const apptId = r.data.data?.appointmentId || '';
        setAlert({ type: 'success', msg: `Appointment booked!${apptId ? ` ID: ${apptId}.` : ''} We will confirm shortly.` });
        setForm(f => ({ ...f, service: '', date: '', time: '', message: '' }));
        setSlots([]);
        e.target.classList.remove('was-validated');
        setTimeout(onClose, 2500);
      } else {
        setAlert({ type: 'danger', msg: r.data.message || 'Something went wrong.' });
        if (form.date) loadSlots(form.date);
      }
    } catch {
      setAlert({ type: 'danger', msg: 'Server error. Please try again or call us directly.' });
    }
    setSubmitting(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="appt-modal" onClick={e => e.stopPropagation()}>
        <button className="jr-modal-close" onClick={onClose}>&times;</button>
        <h5 className="mb-1" style={{ fontFamily: "'Playfair Display',serif" }}>
          <i className="fas fa-calendar-alt text-gold me-2"></i>Book an Appointment
        </h5>
        <p className="text-muted small mb-3">Fill in the details below to schedule your consultation</p>

        {alert && (
          <div className={`alert alert-${alert.type} py-2 small`}>
            <i className={`fas ${alert.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} me-1`}></i>
            {alert.msg}
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
              <input
                type="date"
                className="form-control form-control-sm"
                value={form.date}
                min={todayStr()}
                onChange={handleDateChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label form-label-sm">
                Preferred Time *
                {slotsLoading && <span className="ms-1 small text-muted"><i className="fas fa-spinner fa-spin"></i></span>}
              </label>
              <select
                className="form-select form-select-sm"
                value={form.time}
                onChange={set('time')}
                required
                disabled={!form.date || slotsLoading}
              >
                <option value="">{form.date ? 'Select time…' : 'Select date first'}</option>
                {slots.map(({ time, available }) => (
                  <option key={time} value={time} disabled={!available}>
                    {time}{!available ? ' — Booked' : ''}
                  </option>
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
              ? <><i className="fas fa-spinner fa-spin me-2"></i>Booking…</>
              : <><i className="fas fa-calendar-check me-2"></i>Confirm Appointment</>
            }
          </button>
        </form>
      </div>
    </div>
  );
}
