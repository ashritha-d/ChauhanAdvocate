import { useEffect, useState } from 'react';
import { getAppointments, updateAppointment, deleteAppointment } from '../api';
import { formatDate } from '../utils/helpers';
import ConfirmModal from '../components/ConfirmModal';

const STATUSES = ['pending', 'confirmed', 'rescheduled', 'completed', 'cancelled'];

const STATUS_BADGE = {
  pending: 'badge-pending',
  confirmed: 'badge-confirmed',
  rescheduled: 'badge-info',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
};

const ALL_TIMES = [
  '09:00 AM','10:00 AM','11:00 AM','12:00 PM',
  '02:00 PM','03:00 PM','04:00 PM','05:00 PM','06:00 PM',
];

function RescheduleModal({ appointment, onConfirm, onClose, saving }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fas fa-calendar-alt text-warning me-2"></i>Reschedule Appointment
            </h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p className="text-muted mb-3">
              Rescheduling appointment for <strong>{appointment.name}</strong>
              {appointment.appointmentId && <span className="ms-1 badge bg-secondary">{appointment.appointmentId}</span>}
            </p>
            <div className="mb-3">
              <label className="form-label fw-semibold">Current: {formatDate(appointment.date)} at {appointment.time}</label>
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">New Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={date}
                  min={minDate}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">New Time *</label>
                <select className="form-select" value={time} onChange={e => setTime(e.target.value)} required>
                  <option value="">Select time…</option>
                  {ALL_TIMES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-light" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-warning"
              onClick={() => { if (date && time) onConfirm(date, time); }}
              disabled={!date || !time || saving}
            >
              {saving ? <><i className="fas fa-spinner fa-spin me-1"></i>Saving…</> : <><i className="fas fa-calendar-check me-1"></i>Confirm Reschedule</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Appointments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getAppointments(1, 100, filter)
      .then(r => setItems(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const handleAction = async (id, status, extra = {}) => {
    setSaving(true);
    try {
      await updateAppointment(id, { status, ...extra });
      load();
    } catch {}
    setSaving(false);
  };

  const handleReschedule = async (date, time) => {
    if (!rescheduleTarget) return;
    setSaving(true);
    try {
      await updateAppointment(rescheduleTarget._id, {
        status: 'rescheduled',
        rescheduledDate: date,
        rescheduledTime: time,
      });
      setRescheduleTarget(null);
      load();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteAppointment(confirm); setConfirm(null); load(); } catch {}
    setDeleting(false);
  };

  const filtered = items.filter(a =>
    !search ||
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.phone?.toLowerCase().includes(search.toLowerCase()) ||
    a.appointmentId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-card">
        <div className="page-card-header flex-wrap gap-2">
          <h6 className="mb-0 fw-bold">Appointments ({items.length})</h6>
          <div className="d-flex gap-2 flex-wrap">
            <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone, ID…" />
            <select className="form-select form-select-sm" style={{ width: 'auto' }} value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Client</th>
                <th>Service</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="6" className="text-center py-4"><div className="spinner-border spinner-border-sm"></div></td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan="6" className="text-center text-muted py-4">No appointments found</td></tr>}
              {filtered.map(item => (
                <tr key={item._id}>
                  <td>
                    <small style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#666' }}>
                      {item.appointmentId || item._id.slice(-6)}
                    </small>
                  </td>
                  <td>
                    <div className="fw-semibold">{item.name}</div>
                    <small className="text-muted">{item.email}</small><br />
                    <small className="text-muted">{item.phone}</small>
                  </td>
                  <td>{item.service}</td>
                  <td>
                    {item.status === 'rescheduled' && item.rescheduledDate ? (
                      <>
                        <div className="text-decoration-line-through text-muted small">{formatDate(item.date)} {item.time}</div>
                        <div className="text-primary fw-semibold small">{formatDate(item.rescheduledDate)} {item.rescheduledTime}</div>
                      </>
                    ) : (
                      <>
                        <div>{formatDate(item.date)}</div>
                        <small className="text-muted">{item.time}</small>
                      </>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[item.status] || 'bg-secondary'}`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-1 flex-wrap">
                      {item.status === 'pending' && (
                        <button
                          className="btn btn-xs btn-success"
                          onClick={() => handleAction(item._id, 'confirmed')}
                          disabled={saving}
                          title="Confirm"
                        >
                          <i className="fas fa-check me-1"></i>Confirm
                        </button>
                      )}
                      {['pending', 'confirmed'].includes(item.status) && (
                        <button
                          className="btn btn-xs btn-warning"
                          onClick={() => setRescheduleTarget(item)}
                          disabled={saving}
                          title="Reschedule"
                        >
                          <i className="fas fa-calendar-alt me-1"></i>Reschedule
                        </button>
                      )}
                      {['pending', 'confirmed', 'rescheduled'].includes(item.status) && (
                        <button
                          className="btn btn-xs btn-danger"
                          onClick={() => handleAction(item._id, 'cancelled')}
                          disabled={saving}
                          title="Cancel"
                        >
                          <i className="fas fa-times me-1"></i>Cancel
                        </button>
                      )}
                      {['confirmed', 'rescheduled'].includes(item.status) && (
                        <button
                          className="btn btn-xs btn-primary"
                          onClick={() => handleAction(item._id, 'completed')}
                          disabled={saving}
                          title="Complete"
                        >
                          <i className="fas fa-flag-checkered me-1"></i>Complete
                        </button>
                      )}
                      <button className="btn btn-xs btn-outline-info" onClick={() => setSelected(item)} title="View Details">
                        <i className="fas fa-eye"></i>
                      </button>
                      <button className="btn btn-xs btn-outline-danger" onClick={() => setConfirm(item._id)}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Appointment Details</h5>
                <button className="btn-close" onClick={() => setSelected(null)}></button>
              </div>
              <div className="modal-body">
                {[
                  ['Appointment ID', selected.appointmentId || '—'],
                  ['Client Name', selected.name],
                  ['Email', selected.email],
                  ['Phone', selected.phone],
                  ['Service', selected.service],
                  ['Date', formatDate(selected.date)],
                  ['Time', selected.time],
                  ['Status', selected.status],
                  ...(selected.rescheduledDate ? [
                    ['Rescheduled Date', formatDate(selected.rescheduledDate)],
                    ['Rescheduled Time', selected.rescheduledTime],
                  ] : []),
                  ['Booked On', formatDate(selected.createdAt)],
                ].map(([label, value]) => (
                  <div className="row mb-2" key={label}>
                    <div className="col-4 text-muted small fw-semibold">{label}</div>
                    <div className="col-8">{value}</div>
                  </div>
                ))}
                {selected.message && (
                  <div className="mt-3">
                    <div className="text-muted small fw-semibold mb-1">Case Brief</div>
                    <div className="bg-light p-3 rounded">{selected.message}</div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" onClick={() => setSelected(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <RescheduleModal
          appointment={rescheduleTarget}
          onConfirm={handleReschedule}
          onClose={() => setRescheduleTarget(null)}
          saving={saving}
        />
      )}

      <ConfirmModal
        show={!!confirm}
        title="Delete Appointment"
        message="Delete this appointment permanently?"
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
        loading={deleting}
      />
    </div>
  );
}
