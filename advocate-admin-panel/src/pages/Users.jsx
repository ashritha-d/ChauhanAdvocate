import { useEffect, useState } from 'react';
import usePolling from '../hooks/usePolling';
import api, { safeStorage } from '../api/axios';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Detail modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [userDetail, setUserDetail] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('appointments');

  // Notify modal
  const [notifyUser, setNotifyUser] = useState(null);
  const [notifyForm, setNotifyForm] = useState({ title: '', message: '', type: 'general' });
  const [notifying, setNotifying] = useState(false);

  const token = safeStorage('get', 'adminToken');
  const authHeader = { Authorization: `Bearer ${token}` };

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/users?page=${page}&limit=15&search=${search}`, { headers: authHeader });
      if (r.data.success) {
        setUsers(r.data.data);
        setTotal(r.data.total);
        setPages(r.data.pages);
      }
    } catch (err) {
      showAlert('danger', err.response?.data?.message || 'Failed to load users');
    }
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, [page, search]);
  usePolling(loadUsers, 30000);

  const handleSearchChange = (e) => { setSearch(e.target.value); setPage(1); };

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    setDetailLoading(true);
    try {
      const r = await api.get(`/users/${user._id}`, { headers: authHeader });
      if (r.data.success) setUserDetail(r.data.data);
    } catch { /* silent */ }
    setDetailLoading(false);
  };

  const handleToggleStatus = async (user) => {
    try {
      const r = await api.put(`/users/${user._id}/status`, { isActive: !user.isActive }, { headers: authHeader });
      if (r.data.success) {
        showAlert('success', r.data.message);
        setUsers(us => us.map(u => u._id === user._id ? { ...u, isActive: !u.isActive } : u));
      }
    } catch (err) {
      showAlert('danger', err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;
    try {
      const r = await api.delete(`/users/${user._id}`, { headers: authHeader });
      if (r.data.success) {
        showAlert('success', 'User deleted successfully');
        setUsers(us => us.filter(u => u._id !== user._id));
        setTotal(t => t - 1);
      }
    } catch (err) {
      showAlert('danger', err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notifyForm.title || !notifyForm.message) { showAlert('danger', 'Title and message are required'); return; }
    setNotifying(true);
    try {
      const r = await api.post(`/users/${notifyUser._id}/notify`, notifyForm, { headers: authHeader });
      if (r.data.success) {
        showAlert('success', `Notification sent to ${notifyUser.name}`);
        setNotifyUser(null);
        setNotifyForm({ title: '', message: '', type: 'general' });
      }
    } catch (err) {
      showAlert('danger', err.response?.data?.message || 'Failed to send notification');
    }
    setNotifying(false);
  };

  const STATUS_BADGE = {
    pending: 'warning', confirmed: 'info', completed: 'success', cancelled: 'danger',
    shipped: 'info', delivered: 'success',
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-0">Registered Users</h4>
          <small className="text-muted">{total} total registered users</small>
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible`}>
          {alert.msg}
          <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
        </div>
      )}

      {/* Search */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-body">
          <div className="input-group">
            <span className="input-group-text"><i className="fas fa-search"></i></span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, email, or phone…"
              value={search}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading
            ? <div className="text-center py-5"><div className="spinner-border text-warning"></div></div>
            : users.length === 0
            ? <div className="text-center py-5 text-muted"><i className="fas fa-users fa-2x mb-3 d-block"></i>No users found</div>
            : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>#</th>
                      <th>User</th>
                      <th>Mobile</th>
                      <th>Registered</th>
                      <th>Last Login</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={u._id}>
                        <td>{(page - 1) * 15 + i + 1}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {u.profilePhoto
                              ? <img src={u.profilePhoto} alt={u.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #c9a84c' }} />
                              : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#c9a84c,#a8893a)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.9rem' }}>{u.name.charAt(0).toUpperCase()}</div>
                            }
                            <div>
                              <div className="fw-semibold">{u.name}</div>
                              <small className="text-muted">{u.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>{u.phone}</td>
                        <td><small>{formatDate(u.createdAt)}</small></td>
                        <td><small>{u.lastLogin ? formatDate(u.lastLogin) : 'Never'}</small></td>
                        <td>
                          <span className={`badge bg-${u.isActive ? 'success' : 'secondary'}`}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm btn-outline-primary" title="View Details" onClick={() => handleViewUser(u)}>
                              <i className="fas fa-eye"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-warning" title="Send Notification" onClick={() => { setNotifyUser(u); setNotifyForm({ title: '', message: '', type: 'general' }); }}>
                              <i className="fas fa-bell"></i>
                            </button>
                            <button
                              className={`btn btn-sm btn-outline-${u.isActive ? 'secondary' : 'success'}`}
                              title={u.isActive ? 'Deactivate' : 'Activate'}
                              onClick={() => handleToggleStatus(u)}
                            >
                              <i className={`fas fa-${u.isActive ? 'ban' : 'check'}`}></i>
                            </button>
                            <button className="btn btn-sm btn-outline-danger" title="Delete" onClick={() => handleDeleteUser(u)}>
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
        {pages > 1 && (
          <div className="card-footer d-flex justify-content-between align-items-center">
            <small className="text-muted">Page {page} of {pages}</small>
            <div className="d-flex gap-1">
              <button className="btn btn-sm btn-outline-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <button className="btn btn-sm btn-outline-secondary" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* ── User Detail Modal ── */}
      {selectedUser && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-user me-2"></i>{selectedUser.name}
                  <small className="text-muted ms-2 fs-6">{selectedUser.email}</small>
                </h5>
                <button className="btn-close" onClick={() => { setSelectedUser(null); setUserDetail(null); }}></button>
              </div>
              <div className="modal-body">
                {detailLoading
                  ? <div className="text-center py-4"><div className="spinner-border text-warning"></div></div>
                  : userDetail && (
                    <>
                      {/* User info */}
                      <div className="row g-3 mb-4">
                        {[
                          { label: 'Full Name', value: userDetail.user.name },
                          { label: 'Email', value: userDetail.user.email },
                          { label: 'Mobile', value: userDetail.user.phone },
                          { label: 'Status', value: <span className={`badge bg-${userDetail.user.isActive ? 'success' : 'secondary'}`}>{userDetail.user.isActive ? 'Active' : 'Inactive'}</span> },
                          { label: 'Registered', value: formatDate(userDetail.user.createdAt) },
                          { label: 'Last Login', value: userDetail.user.lastLogin ? formatDate(userDetail.user.lastLogin) : 'Never' },
                        ].map(({ label, value }) => (
                          <div className="col-md-4" key={label}>
                            <label className="form-label fw-semibold text-muted small">{label}</label>
                            <div>{value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Tabs */}
                      <ul className="nav nav-tabs mb-3">
                        <li className="nav-item">
                          <button className={`nav-link ${activeDetailTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveDetailTab('appointments')}>
                            <i className="fas fa-calendar-alt me-1"></i>Appointments ({userDetail.appointments.length})
                          </button>
                        </li>
                        <li className="nav-item">
                          <button className={`nav-link ${activeDetailTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveDetailTab('orders')}>
                            <i className="fas fa-book me-1"></i>Orders ({userDetail.orders.length})
                          </button>
                        </li>
                      </ul>

                      {activeDetailTab === 'appointments' && (
                        userDetail.appointments.length === 0
                          ? <div className="text-center py-4 text-muted">No appointments</div>
                          : <div className="table-responsive">
                              <table className="table table-sm table-hover">
                                <thead><tr><th>Service</th><th>Date</th><th>Time</th><th>Status</th><th>Payment</th><th>Booked</th></tr></thead>
                                <tbody>
                                  {userDetail.appointments.map(a => (
                                    <tr key={a._id}>
                                      <td>{a.service}</td>
                                      <td>{formatDate(a.date)}</td>
                                      <td>{a.time}</td>
                                      <td><span className={`badge bg-${STATUS_BADGE[a.status] || 'secondary'}`}>{a.status}</span></td>
                                      <td><span className={`badge bg-${a.paymentStatus === 'paid' ? 'success' : 'warning'}`}>{a.paymentStatus}</span></td>
                                      <td><small>{formatDate(a.createdAt)}</small></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                      )}

                      {activeDetailTab === 'orders' && (
                        userDetail.orders.length === 0
                          ? <div className="text-center py-4 text-muted">No orders</div>
                          : <div className="table-responsive">
                              <table className="table table-sm table-hover">
                                <thead><tr><th>Book</th><th>Qty</th><th>Status</th><th>Payment</th><th>Date</th></tr></thead>
                                <tbody>
                                  {userDetail.orders.map(o => (
                                    <tr key={o._id}>
                                      <td>{o.bookTitle}</td>
                                      <td>{o.quantity}</td>
                                      <td><span className={`badge bg-${STATUS_BADGE[o.status] || 'secondary'}`}>{o.status}</span></td>
                                      <td><span className={`badge bg-${o.paymentStatus === 'paid' ? 'success' : 'warning'}`}>{o.paymentStatus}</span></td>
                                      <td><small>{formatDate(o.createdAt)}</small></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                      )}
                    </>
                  )
                }
              </div>
              <div className="modal-footer">
                <button className="btn btn-warning btn-sm" onClick={() => { setNotifyUser(selectedUser); setNotifyForm({ title: '', message: '', type: 'general' }); setSelectedUser(null); setUserDetail(null); }}>
                  <i className="fas fa-bell me-1"></i>Send Notification
                </button>
                <button className="btn btn-secondary" onClick={() => { setSelectedUser(null); setUserDetail(null); }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Send Notification Modal ── */}
      {notifyUser && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="fas fa-bell me-2"></i>Send Notification</h5>
                <button className="btn-close" onClick={() => setNotifyUser(null)}></button>
              </div>
              <form onSubmit={handleSendNotification}>
                <div className="modal-body">
                  <p className="text-muted mb-3">Sending to: <strong>{notifyUser.name}</strong> ({notifyUser.email})</p>
                  <div className="mb-3">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={notifyForm.type} onChange={e => setNotifyForm(f => ({ ...f, type: e.target.value }))}>
                      <option value="general">General</option>
                      <option value="appointment">Appointment</option>
                      <option value="order">Order</option>
                      <option value="payment">Payment</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Title *</label>
                    <input type="text" className="form-control" value={notifyForm.title} onChange={e => setNotifyForm(f => ({ ...f, title: e.target.value }))} placeholder="Notification title" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Message *</label>
                    <textarea className="form-control" rows={4} value={notifyForm.message} onChange={e => setNotifyForm(f => ({ ...f, message: e.target.value }))} placeholder="Notification message…" required></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setNotifyUser(null)}>Cancel</button>
                  <button type="submit" className="btn btn-warning" disabled={notifying}>
                    {notifying ? <><i className="fas fa-spinner fa-spin me-1"></i>Sending…</> : <><i className="fas fa-paper-plane me-1"></i>Send</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
