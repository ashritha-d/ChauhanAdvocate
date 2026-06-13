import { useEffect, useState } from 'react';
import { getAppointments, getContacts, getServices, getBlogs } from '../api';
import NotificationAnalytics from '../components/NotificationAnalytics';

const StatCard = ({ icon, label, value, color, bg }) => (
  <div className="col-sm-6 col-xl-3">
    <div className="stat-card d-flex align-items-center gap-3">
      <div className="stat-icon" style={{ background: bg, color }}>
        <i className={icon}></i>
      </div>
      <div>
        <div className="stat-value">{value ?? <span className="spinner-border spinner-border-sm text-muted"></span>}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  </div>
);

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState({});
  const [recentAppts, setRecentAppts] = useState([]);
  const [recentContacts, setRecentContacts] = useState([]);

  useEffect(() => {
    Promise.all([
      getAppointments(1, 100),
      getContacts(1, 100),
      getServices(),
      getBlogs(1, 100),
    ]).then(([appts, contacts, services, blogs]) => {
      setStats({
        appointments: appts.data.total || appts.data.data?.length || 0,
        contacts: contacts.data.total || contacts.data.data?.length || 0,
        services: services.data.data?.length || 0,
        blogs: blogs.data.total || blogs.data.data?.length || 0,
        pending: appts.data.data?.filter(a => a.status === 'pending').length || 0,
        unread: contacts.data.data?.filter(c => c.status === 'unread').length || 0,
      });
      setRecentAppts((appts.data.data || []).slice(0, 5));
      setRecentContacts((contacts.data.data || []).slice(0, 5));
    }).catch(() => {});
  }, []);

  const STATUS_BADGE = { pending:'badge-pending', confirmed:'badge-confirmed', completed:'badge-completed', cancelled:'badge-cancelled' };

  return (
    <div>
      {/* ── Overview stat cards ── */}
      <div className="row g-4 mb-4">
        <StatCard icon="fas fa-calendar-alt" label="Total Appointments" value={stats.appointments} color="#1565c0" bg="#e3f2fd" />
        <StatCard icon="fas fa-clock"        label="Pending Appointments" value={stats.pending}     color="#e65100" bg="#fff3e0" />
        <StatCard icon="fas fa-envelope"     label="Total Inquiries"      value={stats.contacts}    color="#2e7d32" bg="#e8f5e9" />
        <StatCard icon="fas fa-briefcase"    label="Active Services"       value={stats.services}   color="#6a1b9a" bg="#f3e5f5" />
      </div>

      {/* ── Notification Analytics ── */}
      <NotificationAnalytics onNavigate={onNavigate} />

      {/* ── Recent activity tables ── */}
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="page-card">
            <div className="page-card-header">
              <h6 className="mb-0 fw-bold">Recent Appointments</h6>
            </div>
            <div className="table-responsive">
              <table className="table admin-table">
                <thead><tr><th>Client</th><th>Service</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  {recentAppts.length === 0 && (
                    <tr><td colSpan="4" className="text-center text-muted py-4">No appointments yet</td></tr>
                  )}
                  {recentAppts.map(a => (
                    <tr key={a._id}>
                      <td><div className="fw-semibold">{a.name}</div><small className="text-muted">{a.email}</small></td>
                      <td>{a.service}</td>
                      <td>{a.date} {a.time}</td>
                      <td><span className={`status-badge ${STATUS_BADGE[a.status] || 'badge-pending'}`}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="page-card">
            <div className="page-card-header">
              <h6 className="mb-0 fw-bold">Recent Inquiries</h6>
            </div>
            <div className="page-card-body p-0">
              {recentContacts.length === 0 && <p className="text-center text-muted py-4">No inquiries yet</p>}
              {recentContacts.map(c => (
                <div key={c._id} className="d-flex align-items-start gap-3 p-3 border-bottom">
                  <div className="admin-avatar flex-shrink-0">{c.name.charAt(0).toUpperCase()}</div>
                  <div className="overflow-hidden">
                    <div className="fw-semibold text-truncate">{c.name}</div>
                    <div className="text-muted small text-truncate">{c.subject}</div>
                    <small className="text-muted">{c.email}</small>
                  </div>
                  {c.status === 'unread' && <span className="badge bg-danger ms-auto flex-shrink-0">New</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
