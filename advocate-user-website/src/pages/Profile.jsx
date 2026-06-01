import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import {
  getUserProfile, updateUserProfile, changeUserPassword, uploadUserPhoto,
  getMyAppointments, getMyOrders, getNotifications,
  markNotificationRead, markAllNotificationsRead, getMyApplications,
} from '../api';

const TABS = [
  { id: 'dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard' },
  { id: 'appointments', icon: 'fa-calendar-alt', label: 'My Appointments' },
  { id: 'orders', icon: 'fa-book', label: 'My Orders' },
  { id: 'applications', icon: 'fa-user-tie', label: 'My Applications' },
  { id: 'notifications', icon: 'fa-bell', label: 'Notifications' },
  { id: 'settings', icon: 'fa-user-cog', label: 'Profile Settings' },
];

const STATUS_BADGE = {
  pending: 'warning',
  confirmed: 'info',
  'in progress': 'primary',
  completed: 'success',
  cancelled: 'danger',
  shipped: 'info',
  delivered: 'success',
  unpaid: 'secondary',
  pending_verification: 'warning',
  paid: 'success',
  failed: 'danger',
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Profile() {
  const { user, loading: authLoading, logout, updateUser, fetchUnreadCount, authHeader, unreadCount } = useUserAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') || 'dashboard');
  const [appointments, setAppointments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const fileInputRef = useRef();

  // Profile edit state
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) setProfileForm({ name: user.name, phone: user.phone });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (tab === 'appointments') loadAppointments();
    if (tab === 'orders') loadOrders();
    if (tab === 'applications') loadApplications();
    if (tab === 'notifications') loadNotifications();
  }, [tab, user]);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  };

  const loadAppointments = async () => {
    setDataLoading(true);
    try {
      const r = await getMyAppointments(authHeader());
      if (r.data.success) setAppointments(r.data.data);
    } catch { /* silent */ }
    setDataLoading(false);
  };

  const loadOrders = async () => {
    setDataLoading(true);
    try {
      const r = await getMyOrders(authHeader());
      if (r.data.success) setOrders(r.data.data);
    } catch { /* silent */ }
    setDataLoading(false);
  };

  const loadApplications = async () => {
    setDataLoading(true);
    try {
      const r = await getMyApplications(authHeader());
      if (r.data.success) setApplications(r.data.data);
    } catch { /* silent */ }
    setDataLoading(false);
  };

  const loadNotifications = async () => {
    setDataLoading(true);
    try {
      const r = await getNotifications(authHeader());
      if (r.data.success) { setNotifications(r.data.data); fetchUnreadCount(); }
    } catch { /* silent */ }
    setDataLoading(false);
  };

  const handleMarkRead = async (id) => {
    await markNotificationRead(id, authHeader());
    setNotifications(ns => ns.map(n => n._id === id ? { ...n, isRead: true } : n));
    fetchUnreadCount();
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead(authHeader());
    setNotifications(ns => ns.map(n => ({ ...n, isRead: true })));
    fetchUnreadCount();
  };

  const handlePhotoClick = () => fileInputRef.current?.click();

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    setSaving(true);
    try {
      const r = await uploadUserPhoto(formData, authHeader());
      if (r.data.success) { updateUser(r.data.user); showAlert('success', 'Profile photo updated!'); }
      else showAlert('danger', r.data.message);
    } catch (err) {
      showAlert('danger', err.response?.data?.message || 'Failed to upload photo');
    }
    setSaving(false);
  };

  const handleProfileSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await updateUserProfile(profileForm, authHeader());
      if (r.data.success) {
        updateUser(r.data.user);
        setEditing(false);
        showAlert('success', 'Profile updated successfully!');
      } else showAlert('danger', r.data.message);
    } catch (err) {
      showAlert('danger', err.response?.data?.message || 'Failed to update profile');
    }
    setSaving(false);
  };

  const handlePasswordChange = async e => {
    e.preventDefault();
    if (!pwdForm.currentPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) { showAlert('danger', 'All fields are required'); return; }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) { showAlert('danger', 'New passwords do not match'); return; }
    setSaving(true);
    try {
      const r = await changeUserPassword(pwdForm, authHeader());
      if (r.data.success) {
        setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showAlert('success', 'Password changed successfully!');
      } else showAlert('danger', r.data.message);
    } catch (err) {
      showAlert('danger', err.response?.data?.message || 'Failed to change password');
    }
    setSaving(false);
  };

  const apptStats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
  };

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  if (authLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
        <div className="spinner-border text-warning"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="profile-page">
      <div className="profile-hero">
        <div className="container">
          <div className="profile-hero-inner">
            <div className="profile-avatar-wrap" onClick={handlePhotoClick} title="Click to change photo">
              {user.profilePhoto
                ? <img src={user.profilePhoto} alt={user.name} className="profile-avatar-img" />
                : <div className="profile-avatar-placeholder">{user.name.charAt(0).toUpperCase()}</div>
              }
              <div className="profile-avatar-overlay"><i className="fas fa-camera"></i></div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="d-none" onChange={handlePhotoChange} />
            <div className="profile-hero-info">
              <h2 className="profile-hero-name">{user.name}</h2>
              <p className="profile-hero-email"><i className="fas fa-envelope me-2"></i>{user.email}</p>
              <p className="profile-hero-phone"><i className="fas fa-phone me-2"></i>{user.phone}</p>
              <div className="d-flex align-items-center gap-2 mt-2">
                <span className={`badge ${user.isActive ? 'bg-success' : 'bg-danger'}`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
                <small className="text-muted">Member since {formatDate(user.createdAt)}</small>
              </div>
            </div>
            <button className="btn btn-outline-light btn-sm" onClick={() => { logout(); navigate('/'); }}>
              <i className="fas fa-sign-out-alt me-1"></i> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="profile-body">
        <div className="container">
          {alert && (
            <div className={`alert alert-${alert.type} alert-dismissible mt-3`}>
              <i className={`fas ${alert.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2`}></i>
              {alert.msg}
              <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
            </div>
          )}

          <div className="profile-layout">
            {/* Sidebar Tabs */}
            <nav className="profile-nav">
              {TABS.map(t => (
                <button
                  key={t.id}
                  className={`profile-nav-item ${tab === t.id ? 'active' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  <i className={`fas ${t.icon}`}></i>
                  <span>{t.label}</span>
                  {t.id === 'notifications' && unreadCount > 0 && (
                    <span className="profile-nav-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>
              ))}
            </nav>

            {/* Main Content */}
            <div className="profile-content">

              {/* ── Dashboard ── */}
              {tab === 'dashboard' && (
                <div>
                  <h4 className="profile-section-title">Dashboard Overview</h4>
                  <div className="profile-stats-grid">
                    <div className="profile-stat-card" onClick={() => setTab('appointments')}>
                      <div className="psc-icon" style={{ background: 'rgba(13,202,240,0.15)', color: '#0dcaf0' }}><i className="fas fa-calendar-alt"></i></div>
                      <div className="psc-value">{apptStats.total}</div>
                      <div className="psc-label">Total Appointments</div>
                    </div>
                    <div className="profile-stat-card" onClick={() => setTab('appointments')}>
                      <div className="psc-icon" style={{ background: 'rgba(255,193,7,0.15)', color: '#ffc107' }}><i className="fas fa-clock"></i></div>
                      <div className="psc-value">{apptStats.pending}</div>
                      <div className="psc-label">Pending Appointments</div>
                    </div>
                    <div className="profile-stat-card" onClick={() => setTab('appointments')}>
                      <div className="psc-icon" style={{ background: 'rgba(25,135,84,0.15)', color: '#198754' }}><i className="fas fa-check-circle"></i></div>
                      <div className="psc-value">{apptStats.completed}</div>
                      <div className="psc-label">Completed Appointments</div>
                    </div>
                    <div className="profile-stat-card" onClick={() => setTab('orders')}>
                      <div className="psc-icon" style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c' }}><i className="fas fa-book"></i></div>
                      <div className="psc-value">{orderStats.total}</div>
                      <div className="psc-label">Total Orders</div>
                    </div>
                    <div className="profile-stat-card" onClick={() => setTab('orders')}>
                      <div className="psc-icon" style={{ background: 'rgba(220,53,69,0.15)', color: '#dc3545' }}><i className="fas fa-hourglass-half"></i></div>
                      <div className="psc-value">{orderStats.pending}</div>
                      <div className="psc-label">Pending Orders</div>
                    </div>
                    <div className="profile-stat-card" onClick={() => setTab('notifications')}>
                      <div className="psc-icon" style={{ background: 'rgba(111,66,193,0.15)', color: '#6f42c1' }}><i className="fas fa-bell"></i></div>
                      <div className="psc-value">{unreadCount}</div>
                      <div className="psc-label">Unread Notifications</div>
                    </div>
                  </div>

                  <div className="row g-4 mt-2">
                    <div className="col-lg-6">
                      <div className="profile-card">
                        <div className="profile-card-header">
                          <i className="fas fa-calendar-check text-gold me-2"></i>Recent Appointments
                        </div>
                        {appointments.length === 0 && apptStats.total === 0
                          ? <div className="profile-empty"><i className="fas fa-calendar-times"></i><p>No appointments yet</p><a href="#appointment" className="btn btn-gold btn-sm">Book Now</a></div>
                          : appointments.slice(0, 3).map(a => (
                            <div key={a._id} className="profile-list-item">
                              <div>
                                <strong>{a.service}</strong>
                                <small className="d-block text-muted">{formatDate(a.date)} at {a.time}</small>
                              </div>
                              <span className={`badge bg-${STATUS_BADGE[a.status] || 'secondary'}`}>{a.status}</span>
                            </div>
                          ))
                        }
                        {apptStats.total === 0 && appointments.length === 0 && (
                          <button className="btn btn-link text-gold p-0 mt-2" onClick={() => { setTab('appointments'); loadAppointments(); }}>Load appointments</button>
                        )}
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="profile-card">
                        <div className="profile-card-header">
                          <i className="fas fa-book text-gold me-2"></i>Recent Orders
                        </div>
                        {orders.length === 0 && orderStats.total === 0
                          ? <div className="profile-empty"><i className="fas fa-book-open"></i><p>No orders yet</p></div>
                          : orders.slice(0, 3).map(o => (
                            <div key={o._id} className="profile-list-item">
                              <div>
                                <strong>{o.bookTitle}</strong>
                                <small className="d-block text-muted">Qty: {o.quantity} · {formatDate(o.createdAt)}</small>
                              </div>
                              <span className={`badge bg-${STATUS_BADGE[o.status] || 'secondary'}`}>{o.status}</span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Appointments ── */}
              {tab === 'appointments' && (
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <h4 className="profile-section-title mb-0">My Appointments</h4>
                    <a href="#appointment" className="btn btn-gold btn-sm"><i className="fas fa-plus me-1"></i>Book New</a>
                  </div>
                  {dataLoading
                    ? <div className="text-center py-5"><div className="spinner-border text-warning"></div></div>
                    : appointments.length === 0
                    ? <div className="profile-empty"><i className="fas fa-calendar-times"></i><p>No appointments found</p><a href="#appointment" className="btn btn-gold btn-sm">Book Appointment</a></div>
                    : (
                      <div className="profile-table-wrap">
                        <table className="profile-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Service</th>
                              <th>Date & Time</th>
                              <th>Payment</th>
                              <th>Status</th>
                              <th>Booked On</th>
                            </tr>
                          </thead>
                          <tbody>
                            {appointments.map((a, i) => (
                              <tr key={a._id}>
                                <td><small className="text-muted">{i + 1}</small></td>
                                <td><strong>{a.service}</strong>{a.message && <small className="d-block text-muted">{a.message.slice(0, 50)}{a.message.length > 50 ? '…' : ''}</small>}</td>
                                <td>{formatDate(a.date)}<br /><small>{a.time}</small></td>
                                <td><span className={`badge bg-${STATUS_BADGE[a.paymentStatus] || 'secondary'}`}>{a.paymentStatus?.replace('_', ' ') || 'unpaid'}</span></td>
                                <td><span className={`badge bg-${STATUS_BADGE[a.status] || 'secondary'}`}>{a.status}</span></td>
                                <td><small>{formatDate(a.createdAt)}</small></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  }
                </div>
              )}

              {/* ── Orders ── */}
              {tab === 'orders' && (
                <div>
                  <h4 className="profile-section-title">My Orders</h4>
                  {dataLoading
                    ? <div className="text-center py-5"><div className="spinner-border text-warning"></div></div>
                    : orders.length === 0
                    ? <div className="profile-empty"><i className="fas fa-book-open"></i><p>No orders found</p></div>
                    : (
                      <div className="profile-table-wrap">
                        <table className="profile-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Book</th>
                              <th>Qty</th>
                              <th>Order Date</th>
                              <th>Payment</th>
                              <th>Status</th>
                              {orders.some(o => o.paymentId?.receiptId) && <th>Receipt</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {orders.map((o, i) => (
                              <tr key={o._id}>
                                <td><small className="text-muted">{i + 1}</small></td>
                                <td><strong>{o.bookTitle}</strong>{o.bookPrice && <small className="d-block text-muted">₹{o.bookPrice}</small>}</td>
                                <td>{o.quantity}</td>
                                <td><small>{formatDate(o.createdAt)}</small></td>
                                <td><span className={`badge bg-${STATUS_BADGE[o.paymentStatus] || 'secondary'}`}>{o.paymentStatus?.replace('_', ' ') || 'unpaid'}</span></td>
                                <td><span className={`badge bg-${STATUS_BADGE[o.status] || 'secondary'}`}>{o.status}</span></td>
                                {orders.some(ord => ord.paymentId?.receiptId) && (
                                  <td>
                                    {o.paymentId?.receiptId
                                      ? <button className="btn btn-outline-success btn-sm" onClick={() => window.print()} title="Download receipt"><i className="fas fa-download"></i></button>
                                      : <small className="text-muted">—</small>
                                    }
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  }
                </div>
              )}

              {/* ── My Applications ── */}
              {tab === 'applications' && (
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <h4 className="profile-section-title mb-0">My Applications</h4>
                    <a href="#join" className="btn btn-gold btn-sm"><i className="fas fa-plus me-1"></i>Apply Now</a>
                  </div>
                  {dataLoading
                    ? <div className="text-center py-5"><div className="spinner-border text-warning"></div></div>
                    : applications.length === 0
                    ? <div className="profile-empty"><i className="fas fa-user-tie"></i><p>No applications found</p><a href="#join" className="btn btn-gold btn-sm">Apply as Jr. Advocate</a></div>
                    : (
                      <div className="profile-table-wrap">
                        <table className="profile-table">
                          <thead>
                            <tr><th>#</th><th>Applied For</th><th>Qualification</th><th>Applied On</th><th>Status</th></tr>
                          </thead>
                          <tbody>
                            {applications.map((a, i) => {
                              const statusColor = { pending: 'warning', reviewed: 'info', selected: 'success', rejected: 'danger' };
                              return (
                                <tr key={a._id}>
                                  <td><small className="text-muted">{i + 1}</small></td>
                                  <td><strong>Jr. Advocate</strong><small className="d-block text-muted">{a.college || '—'}</small></td>
                                  <td>{a.qualification}</td>
                                  <td><small>{formatDate(a.createdAt)}</small></td>
                                  <td>
                                    <span className={`badge bg-${statusColor[a.status] || 'secondary'}`}>
                                      {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                                    </span>
                                    {a.adminNotes && <small className="d-block text-muted mt-1">{a.adminNotes}</small>}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )
                  }
                </div>
              )}

              {/* ── Notifications ── */}
              {tab === 'notifications' && (
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <h4 className="profile-section-title mb-0">Notifications</h4>
                    {notifications.some(n => !n.isRead) && (
                      <button className="btn btn-outline-warning btn-sm" onClick={handleMarkAllRead}>
                        <i className="fas fa-check-double me-1"></i>Mark all read
                      </button>
                    )}
                  </div>
                  {dataLoading
                    ? <div className="text-center py-5"><div className="spinner-border text-warning"></div></div>
                    : notifications.length === 0
                    ? <div className="profile-empty"><i className="fas fa-bell-slash"></i><p>No notifications yet</p></div>
                    : notifications.map(n => (
                      <div
                        key={n._id}
                        className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                        onClick={() => !n.isRead && handleMarkRead(n._id)}
                      >
                        <div className={`notif-icon notif-${n.type}`}>
                          <i className={`fas ${n.type === 'appointment' ? 'fa-calendar-alt' : n.type === 'order' ? 'fa-book' : n.type === 'payment' ? 'fa-credit-card' : 'fa-bell'}`}></i>
                        </div>
                        <div className="notif-body">
                          <div className="notif-title">{n.title}</div>
                          <div className="notif-message">{n.message}</div>
                          <div className="notif-time"><i className="fas fa-clock me-1"></i>{formatDate(n.createdAt)}</div>
                        </div>
                        {!n.isRead && <div className="notif-dot"></div>}
                      </div>
                    ))
                  }
                </div>
              )}

              {/* ── Settings ── */}
              {tab === 'settings' && (
                <div>
                  <h4 className="profile-section-title">Profile Settings</h4>

                  {/* Profile Info */}
                  <div className="profile-card mb-4">
                    <div className="profile-card-header"><i className="fas fa-user-edit text-gold me-2"></i>Personal Information</div>
                    <form onSubmit={handleProfileSave}>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="auth-label">Full Name</label>
                          <div className="auth-input-wrap">
                            <i className="fas fa-user auth-input-icon"></i>
                            <input type="text" className="auth-input" value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} disabled={!editing} />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <label className="auth-label">Mobile Number</label>
                          <div className="auth-input-wrap">
                            <i className="fas fa-mobile-alt auth-input-icon"></i>
                            <input type="tel" className="auth-input" value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} disabled={!editing} />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <label className="auth-label">Email Address</label>
                          <div className="auth-input-wrap">
                            <i className="fas fa-envelope auth-input-icon"></i>
                            <input type="email" className="auth-input" value={user.email} disabled />
                          </div>
                          <small className="text-muted">Email cannot be changed</small>
                        </div>
                        <div className="col-md-6">
                          <label className="auth-label">Member Since</label>
                          <div className="auth-input-wrap">
                            <i className="fas fa-calendar auth-input-icon"></i>
                            <input type="text" className="auth-input" value={formatDate(user.createdAt)} disabled />
                          </div>
                        </div>
                        <div className="col-12 d-flex gap-2">
                          {editing
                            ? <>
                                <button type="submit" className="btn btn-gold" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
                                <button type="button" className="btn btn-outline-secondary" onClick={() => { setEditing(false); setProfileForm({ name: user.name, phone: user.phone }); }}>Cancel</button>
                              </>
                            : <button type="button" className="btn btn-gold" onClick={() => setEditing(true)}><i className="fas fa-edit me-2"></i>Edit Profile</button>
                          }
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* Change Password */}
                  <div className="profile-card mb-4">
                    <div className="profile-card-header"><i className="fas fa-lock text-gold me-2"></i>Change Password</div>
                    <form onSubmit={handlePasswordChange}>
                      <div className="row g-3">
                        {[
                          { key: 'currentPassword', label: 'Current Password', placeholder: 'Enter current password' },
                          { key: 'newPassword', label: 'New Password', placeholder: 'At least 6 characters' },
                          { key: 'confirmPassword', label: 'Confirm New Password', placeholder: 'Re-enter new password' },
                        ].map(({ key, label, placeholder }) => (
                          <div className="col-md-4" key={key}>
                            <label className="auth-label">{label}</label>
                            <div className="auth-input-wrap">
                              <i className="fas fa-lock auth-input-icon"></i>
                              <input
                                type={showPwd[key] ? 'text' : 'password'}
                                className="auth-input"
                                value={pwdForm[key]}
                                onChange={e => setPwdForm(f => ({ ...f, [key]: e.target.value }))}
                                placeholder={placeholder}
                              />
                              <button type="button" className="auth-input-toggle" onClick={() => setShowPwd(p => ({ ...p, [key]: !p[key] }))} tabIndex={-1}>
                                <i className={`fas ${showPwd[key] ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="col-12">
                          <button type="submit" className="btn btn-gold" disabled={saving}>{saving ? 'Changing…' : 'Change Password'}</button>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* Profile Photo */}
                  <div className="profile-card">
                    <div className="profile-card-header"><i className="fas fa-camera text-gold me-2"></i>Profile Photo</div>
                    <div className="d-flex align-items-center gap-4">
                      <div className="profile-photo-preview" onClick={handlePhotoClick}>
                        {user.profilePhoto
                          ? <img src={user.profilePhoto} alt={user.name} />
                          : <div className="profile-photo-initial">{user.name.charAt(0).toUpperCase()}</div>
                        }
                        <div className="profile-photo-overlay"><i className="fas fa-camera"></i></div>
                      </div>
                      <div>
                        <button className="btn btn-gold btn-sm mb-2 d-block" onClick={handlePhotoClick} disabled={saving}>
                          <i className="fas fa-upload me-2"></i>{saving ? 'Uploading…' : 'Upload Photo'}
                        </button>
                        <small className="text-muted">Max 3MB. JPG, PNG, WebP.</small>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
