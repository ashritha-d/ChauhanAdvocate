import { Link } from 'react-router-dom';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

/**
 * Reusable success card shown after appointment is booked.
 * Props:
 *   booked   — { appointmentId, name, email, phone, service, date, time }
 *   onBookAnother — callback to reset form
 *   onClose  — callback to close (modal mode); if null, not shown
 *   inline   — true = rendered inside section (not modal)
 */
export default function AppointmentSuccessCard({ booked, onBookAnother, onClose, inline }) {
  const BASE = import.meta.env.BASE_URL;

  return (
    <div className={`appt-success-wrap ${inline ? 'appt-success-inline' : ''}`}>
      <div className="appt-success-card">

        {/* Header */}
        <div className="appt-success-header">
          <div className="appt-success-icon-wrap">
            <div className="appt-success-icon">
              <i className="fas fa-check"></i>
            </div>
            <div className="appt-success-ripple"></div>
          </div>
          <h4 className="appt-success-title">Appointment Successfully Booked!</h4>
          <p className="appt-success-subtitle">
            Thank you for booking an appointment with <strong>Balu Law Chamber</strong>.<br />
            We will confirm your appointment shortly.
          </p>
        </div>

        {/* Booking Details */}
        <div className="appt-success-details">
          <div className="appt-success-details-title">
            <i className="fas fa-clipboard-list me-2"></i>Booking Details
          </div>

          {booked.appointmentId && (
            <div className="appt-success-row appt-success-id-row">
              <span className="appt-success-label">Appointment ID</span>
              <span className="appt-success-id">{booked.appointmentId}</span>
            </div>
          )}

          {[
            { icon: 'fa-user', label: 'Client Name', value: booked.name },
            { icon: 'fa-briefcase', label: 'Service', value: booked.service },
            { icon: 'fa-calendar-alt', label: 'Date', value: formatDate(booked.date) },
            { icon: 'fa-clock', label: 'Time', value: booked.time },
            { icon: booked.appointmentMode === 'online' ? 'fa-phone' : 'fa-building', label: 'Appointment Type', value: booked.appointmentMode === 'online' ? 'On Call' : 'At Office' },
          ].filter(r => r.value).map(({ icon, label, value }) => (
            <div className="appt-success-row" key={label}>
              <span className="appt-success-label">
                <i className={`fas ${icon} me-2 text-gold`}></i>{label}
              </span>
              <span className="appt-success-value">{value}</span>
            </div>
          ))}

          <div className="appt-success-row">
            <span className="appt-success-label">
              <i className="fas fa-info-circle me-2 text-gold"></i>Status
            </span>
            <span className="appt-success-badge">
              <i className="fas fa-hourglass-half me-1"></i>Pending Confirmation
            </span>
          </div>
        </div>

        {/* Notifications */}
        <div className="appt-success-notifs">
          <div className="appt-success-notif">
            <i className="fab fa-whatsapp"></i>
            <span>A confirmation message has been sent to your WhatsApp.</span>
          </div>
          {booked.email && (
            <div className="appt-success-notif">
              <i className="fas fa-envelope"></i>
              <span>A confirmation email has been sent to <strong>{booked.email}</strong>.</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="appt-success-actions">
          <Link to="/profile?tab=appointments" className="btn appt-success-btn-primary">
            <i className="fas fa-calendar-alt me-2"></i>View My Appointments
          </Link>
          <button className="btn appt-success-btn-secondary" onClick={onBookAnother}>
            <i className="fas fa-plus me-2"></i>Book Another Appointment
          </button>
          <Link to="/profile" className="btn appt-success-btn-outline">
            <i className="fas fa-tachometer-alt me-2"></i>Go to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
