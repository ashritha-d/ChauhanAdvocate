import { useEffect, useState } from 'react';
import usePolling from '../hooks/usePolling';
import api from '../api/axios';
import { formatDate } from '../utils/helpers';

const BACKEND = import.meta.env.VITE_API_BASE?.replace('/api', '') || 'https://chauhanadvocate.onrender.com';

const TABS = [
  { id: 'all',          label: 'All',              icon: 'fas fa-bell' },
  { id: 'users',        label: 'New Users',        icon: 'fas fa-user-plus' },
  { id: 'appointments', label: 'Appointments',     icon: 'fas fa-calendar-alt' },
  { id: 'bookorders',   label: 'Book Orders',      icon: 'fas fa-book' },
  { id: 'jradvocates',  label: 'Jr. Applications', icon: 'fas fa-user-tie' },
];

function Badge({ count }) {
  if (!count) return null;
  return <span className="badge bg-danger ms-1" style={{ fontSize: '0.65rem' }}>{count}</span>;
}

function StatusBadge({ status }) {
  const colors = { pending: 'warning', confirmed: 'info', completed: 'success', cancelled: 'danger', shipped: 'info', delivered: 'success', accepted: 'success', rejected: 'danger', reviewed: 'info', selected: 'success' };
  return <span className={`badge bg-${colors[status] || 'secondary'}`}>{status}</span>;
}

export default function Notifications() {
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ users: [], appointments: [], bookorders: [], jradvocates: [] });
  const [counts, setCounts] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [usersR, apptsR, ordersR, jrR] = await Promise.all([
        api.get('/users?limit=20&page=1'),
        api.get('/appointments?limit=20&page=1'),
        api.get('/book-orders?limit=20&page=1'),
        api.get('/jr-advocates?limit=20&page=1'),
      ]);

      const users        = usersR.data.data        || [];
      const appointments = apptsR.data.data         || [];
      const bookorders   = ordersR.data.data        || [];
      const jradvocates  = jrR.data.data            || [];

      setData({ users, appointments, bookorders, jradvocates });
      setCounts({
        users:        users.filter(u => {
          const age = (Date.now() - new Date(u.createdAt)) / 864e5;
          return age < 7;
        }).length,
        appointments: appointments.filter(a => !a.isRead).length,
        bookorders:   bookorders.filter(o => !o.isRead).length,
        jradvocates:  jradvocates.filter(j => !j.isRead).length,
      });
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  usePolling(load, 30000);

  const totalNew = (counts.users || 0) + (counts.appointments || 0) + (counts.bookorders || 0) + (counts.jradvocates || 0);

  const show = id => tab === 'all' || tab === id;

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-0">Notifications</h4>
          <small className="text-muted">{totalNew} new items across all sections</small>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={load}>
          <i className="fas fa-sync-alt me-1"></i>Refresh
        </button>
      </div>

      {/* Tab bar */}
      <div className="mb-4 d-flex gap-2 flex-wrap">
        {TABS.map(t => {
          const count = t.id === 'all' ? totalNew : counts[t.id];
          return (
            <button
              key={t.id}
              className={`btn btn-sm ${tab === t.id ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => setTab(t.id)}
            >
              <i className={`${t.icon} me-1`}></i>{t.label}
              {count > 0 && <Badge count={count} />}
            </button>
          );
        })}
      </div>

      {loading && <div className="text-center py-5"><div className="spinner-border text-warning"></div></div>}

      {!loading && (
        <div className="d-flex flex-column gap-4">

          {/* New User Registrations */}
          {show('users') && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white d-flex align-items-center justify-content-between">
                <h6 className="mb-0 fw-bold"><i className="fas fa-user-plus text-success me-2"></i>New User Registrations<Badge count={counts.users} /></h6>
                <small className="text-muted">{data.users.length} total</small>
              </div>
              {data.users.length === 0
                ? <div className="card-body text-center text-muted py-4">No users yet</div>
                : <div className="table-responsive">
                    <table className="table table-hover mb-0 table-sm">
                      <thead className="table-light"><tr><th>Name</th><th>Email</th><th>Phone</th><th>Registered</th><th>Status</th></tr></thead>
                      <tbody>
                        {data.users.map(u => {
                          const isNew = (Date.now() - new Date(u.createdAt)) / 864e5 < 7;
                          return (
                            <tr key={u._id} className={isNew ? 'table-warning' : ''}>
                              <td>{u.name}{isNew && <span className="badge bg-success ms-1" style={{ fontSize: '0.6rem' }}>NEW</span>}</td>
                              <td><small>{u.email || '—'}</small></td>
                              <td><small>{u.phone}</small></td>
                              <td><small>{formatDate(u.createdAt)}</small></td>
                              <td><span className={`badge bg-${u.isActive ? 'success' : 'secondary'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
              }
            </div>
          )}

          {/* Appointment Requests */}
          {show('appointments') && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white d-flex align-items-center justify-content-between">
                <h6 className="mb-0 fw-bold"><i className="fas fa-calendar-alt text-primary me-2"></i>Appointment Requests<Badge count={counts.appointments} /></h6>
                <small className="text-muted">{data.appointments.length} total</small>
              </div>
              {data.appointments.length === 0
                ? <div className="card-body text-center text-muted py-4">No appointments</div>
                : <div className="table-responsive">
                    <table className="table table-hover mb-0 table-sm">
                      <thead className="table-light"><tr><th>Name</th><th>Service</th><th>Date</th><th>Payment</th><th>Status</th><th>Booked</th></tr></thead>
                      <tbody>
                        {data.appointments.map(a => (
                          <tr key={a._id} className={!a.isRead ? 'table-warning' : ''}>
                            <td>{a.name}{!a.isRead && <span className="badge bg-danger ms-1" style={{ fontSize: '0.6rem' }}>NEW</span>}</td>
                            <td><small>{a.service}</small></td>
                            <td><small>{formatDate(a.date)}</small></td>
                            <td><small><span className={`badge bg-${a.paymentStatus === 'paid' ? 'success' : 'warning'}`}>{a.paymentStatus || 'unpaid'}</span></small></td>
                            <td><StatusBadge status={a.status} /></td>
                            <td><small>{formatDate(a.createdAt)}</small></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              }
            </div>
          )}

          {/* Book Orders */}
          {show('bookorders') && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white d-flex align-items-center justify-content-between">
                <h6 className="mb-0 fw-bold"><i className="fas fa-book text-warning me-2"></i>Book Orders<Badge count={counts.bookorders} /></h6>
                <small className="text-muted">{data.bookorders.length} total</small>
              </div>
              {data.bookorders.length === 0
                ? <div className="card-body text-center text-muted py-4">No book orders</div>
                : <div className="table-responsive">
                    <table className="table table-hover mb-0 table-sm">
                      <thead className="table-light"><tr><th>Customer</th><th>Book</th><th>Qty</th><th>Payment</th><th>Status</th><th>Date</th></tr></thead>
                      <tbody>
                        {data.bookorders.map(o => (
                          <tr key={o._id} className={!o.isRead ? 'table-warning' : ''}>
                            <td>{o.name}{!o.isRead && <span className="badge bg-danger ms-1" style={{ fontSize: '0.6rem' }}>NEW</span>}</td>
                            <td><small>{o.bookTitle}</small></td>
                            <td>{o.quantity}</td>
                            <td><span className={`badge bg-${o.paymentStatus === 'paid' ? 'success' : 'warning'}`}>{o.paymentStatus || 'unpaid'}</span></td>
                            <td><StatusBadge status={o.status} /></td>
                            <td><small>{formatDate(o.createdAt)}</small></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              }
            </div>
          )}

          {/* Jr. Advocate Applications */}
          {show('jradvocates') && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white d-flex align-items-center justify-content-between">
                <h6 className="mb-0 fw-bold"><i className="fas fa-user-tie text-info me-2"></i>Jr. Advocate Applications<Badge count={counts.jradvocates} /></h6>
                <small className="text-muted">{data.jradvocates.length} total</small>
              </div>
              {data.jradvocates.length === 0
                ? <div className="card-body text-center text-muted py-4">No applications</div>
                : <div className="table-responsive">
                    <table className="table table-hover mb-0 table-sm">
                      <thead className="table-light"><tr><th>Applicant</th><th>Qualification</th><th>Resume</th><th>Status</th><th>Applied</th></tr></thead>
                      <tbody>
                        {data.jradvocates.map(j => (
                          <tr key={j._id} className={!j.isRead ? 'table-warning' : ''}>
                            <td>
                              <div>{j.name}{!j.isRead && <span className="badge bg-danger ms-1" style={{ fontSize: '0.6rem' }}>NEW</span>}</div>
                              <small className="text-muted">{j.email}</small>
                            </td>
                            <td><small>{j.qualification}</small></td>
                            <td>
                              {j.resume
                                ? <a href={`${BACKEND}${j.resume}`} target="_blank" rel="noreferrer" className="btn btn-xs btn-outline-primary" style={{ fontSize: '0.72rem', padding: '2px 8px' }}><i className="fas fa-file-pdf me-1"></i>View</a>
                                : <small className="text-muted">—</small>}
                            </td>
                            <td><StatusBadge status={j.status} /></td>
                            <td><small>{formatDate(j.createdAt)}</small></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              }
            </div>
          )}

        </div>
      )}
    </div>
  );
}
