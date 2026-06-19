import { useEffect, useState, useRef } from 'react';
import SEOHead from '../components/SEOHead';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { useSite } from '../context/SiteContext';
import {
  getUserProfile, updateUserProfile, changeUserPassword, uploadUserPhoto,
  getMyAppointments, getMyOrders, getNotifications,
  markNotificationRead, markAllNotificationsRead, getMyApplications,
  getMyEnrollments, getPublicCourse, updateCourseProgress,
  getMyMagazinePurchases, downloadMagazineFull,
} from '../api';
import { mediaUrl } from '../utils/helpers';
import AppointmentModal from '../components/AppointmentModal';

const TABS = [
  { id: 'dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard' },
  { id: 'appointments', icon: 'fa-calendar-alt', label: 'My Appointments' },
  { id: 'orders', icon: 'fa-book', label: 'My Orders' },
  { id: 'courses', icon: 'fa-graduation-cap', label: 'My Courses' },
  { id: 'magazines', icon: 'fa-book-open', label: 'My Magazines' },
  { id: 'applications', icon: 'fa-user-tie', label: 'My Applications' },
  { id: 'notifications', icon: 'fa-bell', label: 'Notifications' },
  { id: 'settings', icon: 'fa-user-cog', label: 'Profile Settings' },
];

const STATUS_BADGE = {
  pending: 'warning',
  confirmed: 'info',
  rescheduled: 'primary',
  'in progress': 'primary',
  completed: 'success',
  cancelled: 'danger',
  processing: 'info',
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

function getVideoEmbed(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&autoplay=1`;
  const drive = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;
  return null; // MP4 direct
}

function CoursePlayer({ enrollment, authHeader, onClose }) {
  const course = enrollment.courseId;
  const [detail, setDetail] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [completedSet, setCompletedSet] = useState(
    new Set((enrollment.progress || []).map(p => p.videoId?.toString()).filter(Boolean))
  );
  const [loadingDetail, setLoadingDetail] = useState(true);

  useEffect(() => {
    getPublicCourse(course._id, authHeader())
      .then(r => {
        if (r.data.success) {
          setDetail(r.data.data);
          const first = r.data.data.modules?.[0]?.videos?.[0];
          if (first?.videoUrl) setCurrentVideo(first);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingDetail(false));
  }, [course._id]);

  const handleSelectVideo = (video) => {
    if (!video.videoUrl) return;
    setCurrentVideo(video);
  };

  const handleMarkDone = async () => {
    if (!currentVideo?._id || completedSet.has(currentVideo._id)) return;
    try {
      await updateCourseProgress({ courseId: course._id, videoId: currentVideo._id }, authHeader());
      setCompletedSet(prev => new Set([...prev, currentVideo._id]));
    } catch {}
  };

  const totalVideos = detail?.modules?.reduce((s, m) => s + (m.videos?.length || 0), 0) || 0;

  return (
    <div className="course-player-wrap">
      <div className="course-player-header">
        <span className="course-player-title"><i className="fas fa-graduation-cap me-2" style={{ color: 'var(--gold)' }}></i>{course.title}</span>
        <button className="course-player-close" onClick={onClose} title="Close player">&times;</button>
      </div>

      {loadingDetail ? (
        <div className="text-center py-4"><div className="spinner-border" style={{ color: 'var(--gold)' }}></div></div>
      ) : !detail ? (
        <div className="text-center py-4 text-muted">Could not load course content.</div>
      ) : (
        <div className="course-player-body">
          {/* Sidebar — module & video list */}
          <div className="course-player-sidebar">
            {(detail.modules || []).map((mod, mi) => (
              <div key={mi}>
                <div className="course-module-header">
                  <i className="fas fa-folder me-1"></i>{mod.title || `Module ${mi + 1}`}
                </div>
                {(mod.videos || []).map((vid, vi) => (
                  <div
                    key={vi}
                    className={`course-video-item ${currentVideo?._id === vid._id ? 'active' : ''} ${!vid.videoUrl ? 'opacity-50' : ''}`}
                    onClick={() => handleSelectVideo(vid)}
                    title={!vid.videoUrl ? 'Video not available' : vid.title}
                  >
                    <i className={`fas ${completedSet.has(vid._id) ? 'fa-check-circle text-success' : vid.videoUrl ? 'fa-play-circle' : 'fa-lock'}`}></i>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vid.title}</span>
                    {vid.duration && <span className="course-video-duration">{vid.duration}</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Main — video player */}
          <div className="course-player-main">
            <div className="course-player-video">
              {currentVideo ? (
                (() => {
                  const embed = getVideoEmbed(currentVideo.videoUrl);
                  return embed
                    ? <iframe src={embed} title={currentVideo.title} allowFullScreen allow="autoplay; encrypted-media"></iframe>
                    : <video controls src={currentVideo.videoUrl} style={{ width: '100%', height: '100%', background: '#000' }}></video>;
                })()
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100" style={{ background: '#111', color: '#aaa' }}>
                  <div className="text-center">
                    <i className="fas fa-play-circle fa-3x mb-2"></i>
                    <p className="small mb-0">Select a video to start watching</p>
                  </div>
                </div>
              )}
            </div>

            {currentVideo && (
              <>
                <div className="course-player-info">
                  <div className="course-player-video-title">{currentVideo.title}</div>
                  {currentVideo.description && <p className="small text-muted mb-2">{currentVideo.description}</p>}
                  <button
                    className={`btn btn-sm course-player-mark-btn ${completedSet.has(currentVideo._id) ? 'btn-success disabled' : 'btn-outline-success'}`}
                    onClick={handleMarkDone}
                    disabled={completedSet.has(currentVideo._id)}
                  >
                    <i className={`fas ${completedSet.has(currentVideo._id) ? 'fa-check-circle' : 'fa-circle'} me-1`}></i>
                    {completedSet.has(currentVideo._id) ? 'Completed' : 'Mark as Done'}
                  </button>
                </div>
                <div className="course-player-progress">
                  <i className="fas fa-chart-line text-gold"></i>
                  <span>{completedSet.size} / {totalVideos} videos completed</span>
                  <div className="progress flex-grow-1" style={{ height: 6 }}>
                    <div className="progress-bar bg-success" style={{ width: `${totalVideos > 0 ? Math.round((completedSet.size / totalVideos) * 100) : 0}%` }}></div>
                  </div>
                  <span className="text-muted">{totalVideos > 0 ? Math.round((completedSet.size / totalVideos) * 100) : 0}%</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { user, loading: authLoading, logout, updateUser, fetchUnreadCount, authHeader, unreadCount } = useUserAuth();
  const { settings: s } = useSite();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') || 'dashboard');
  const [appointments, setAppointments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [applications, setApplications] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [myMagazines, setMyMagazines] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const fileInputRef = useRef();

  // Profile edit state
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState({});
  const [saving, setSaving] = useState(false);
  const [showApptModal, setShowApptModal] = useState(false);
  const [watchingEnrollmentId, setWatchingEnrollmentId] = useState(null);

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
    if (tab === 'courses') loadEnrollments();
    if (tab === 'magazines') loadMyMagazines();
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

  const loadEnrollments = async () => {
    setDataLoading(true);
    try {
      const r = await getMyEnrollments(authHeader());
      if (r.data.success) setEnrollments(r.data.data);
    } catch { /* silent */ }
    setDataLoading(false);
  };

  const loadMyMagazines = async () => {
    setDataLoading(true);
    try {
      const r = await getMyMagazinePurchases(authHeader());
      if (r.data.success) setMyMagazines(r.data.data);
    } catch {}
    setDataLoading(false);
  };

  const handleMagazineDownload = async (magazineId, title) => {
    try {
      const r = await downloadMagazineFull(magazineId, authHeader());
      if (r.data.success && r.data.url) {
        const url = r.data.url.startsWith('http') ? r.data.url : `https://chauhanadvocate.onrender.com${r.data.url}`;
        const a = document.createElement('a');
        a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.click();
      }
    } catch (e) {
      showAlert('danger', e.response?.data?.message || `Failed to download "${title}"`);
    }
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

  // Navigate to home section from profile page
  const goTo = (section) => { window.location.href = `${import.meta.env.BASE_URL}#${section}`; };

  return (
    <div className="profile-page">
      <SEOHead title="My Profile" description="Manage your Advocate Chauhan account – appointments, orders, notifications, and profile settings." canonical="/profile" noindex />
      {/* Hidden file input for photo upload (used in Settings tab) */}
      <input ref={fileInputRef} type="file" accept="image/*" className="d-none" onChange={handlePhotoChange} />

      {/* Slim top bar — replaces the old hero banner */}
      <div className="profile-top-bar">
        <div className="container">
          <div className="profile-top-bar-inner">
            <div className="profile-top-bar-left">
              <div className="profile-top-avatar">
                {user.profilePhoto
                  ? <img src={user.profilePhoto} alt={user.name} />
                  : <span>{user.name.charAt(0).toUpperCase()}</span>
                }
              </div>
              <div>
                <div className="profile-top-name">Welcome, {user.name.split(' ')[0]}</div>
                <div className="profile-top-sub">{user.email}</div>
              </div>
            </div>
            <div className="profile-top-bar-right">
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowApptModal(true)}>
                <i className="fas fa-calendar-check me-1"></i>
                <span className="d-none d-sm-inline">Book an Appointment</span>
                <span className="d-sm-none">Book</span>
              </button>
              <button className="btn btn-sm btn-outline-danger" onClick={() => { logout(); navigate('/'); }}>
                <i className="fas fa-sign-out-alt me-1"></i>
                <span className="d-none d-sm-inline">Logout</span>
              </button>
            </div>
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
                          ? <div className="profile-empty"><i className="fas fa-calendar-times"></i><p>No appointments yet</p><a onClick={() => setShowApptModal(true)} className="btn btn-gold btn-sm">Book Now</a></div>
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
                    <button className="btn btn-gold btn-sm" onClick={() => setShowApptModal(true)}><i className="fas fa-plus me-1"></i>Book New</button>
                  </div>
                  {dataLoading
                    ? <div className="text-center py-5"><div className="spinner-border text-warning"></div></div>
                    : appointments.length === 0
                    ? <div className="profile-empty"><i className="fas fa-calendar-times"></i><p>No appointments found</p><button className="btn btn-gold btn-sm" onClick={() => setShowApptModal(true)}>Book an Appointment</button></div>
                    : (
                      <div className="profile-table-wrap">
                        <table className="profile-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Service</th>
                              <th>Date & Time</th>
                              <th>Payment</th>
                              <th>Status</th>
                              <th>Booked On</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {appointments.map((a) => (
                              <tr key={a._id}>
                                <td>
                                  <small className="text-muted d-block" style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                                    {a.appointmentId || a._id.slice(-6)}
                                  </small>
                                </td>
                                <td>
                                  <strong>{a.service}</strong>
                                  {a.message && <small className="d-block text-muted">{a.message.slice(0, 50)}{a.message.length > 50 ? '…' : ''}</small>}
                                </td>
                                <td>
                                  {a.status === 'rescheduled' && a.rescheduledDate ? (
                                    <>
                                      <span className="text-decoration-line-through text-muted small">{formatDate(a.date)}</span>
                                      <br /><strong className="text-primary small">{formatDate(a.rescheduledDate)}</strong>
                                      <br /><small>{a.rescheduledTime || a.time}</small>
                                    </>
                                  ) : (
                                    <>{formatDate(a.date)}<br /><small>{a.time}</small></>
                                  )}
                                </td>
                                <td><span className={`badge bg-${STATUS_BADGE[a.paymentStatus] || 'secondary'}`}>{a.paymentStatus?.replace('_', ' ') || 'unpaid'}</span></td>
                                <td>
                                  <span className={`badge bg-${STATUS_BADGE[a.status] || 'secondary'}`}>
                                    {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                                  </span>
                                </td>
                                <td><small>{formatDate(a.createdAt)}</small></td>
                                <td>
                                  {a.status === 'cancelled' && (
                                    <a
                                      href={`tel:${s?.contact_phone || '+919392538226'}`}
                                      className="btn btn-outline-warning btn-sm"
                                      title="Request Reschedule"
                                    >
                                      <i className="fas fa-redo-alt me-1"></i>Reschedule
                                    </a>
                                  )}
                                </td>
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
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <h4 className="profile-section-title mb-0">My Orders</h4>
                    <button className="btn btn-gold btn-sm" onClick={() => goTo('books')}><i className="fas fa-book me-1"></i>Browse Books</button>
                  </div>
                  {dataLoading
                    ? <div className="text-center py-5"><div className="spinner-border text-warning"></div></div>
                    : orders.length === 0
                    ? <div className="profile-empty"><i className="fas fa-book-open"></i><p>No orders found</p></div>
                    : (
                      <div className="profile-table-wrap">
                        <table className="profile-table">
                          <thead>
                            <tr>
                              <th>Order ID</th>
                              <th>Book</th>
                              <th>Qty</th>
                              <th>Order Date</th>
                              <th>Payment</th>
                              <th>Status</th>
                              <th>Tracking</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.map((o) => (
                              <tr key={o._id}>
                                <td>
                                  <small className="text-muted d-block" style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                                    {o.orderId || o._id.slice(-6)}
                                  </small>
                                </td>
                                <td>
                                  <strong>{o.bookTitle || o.book?.name || '—'}</strong>
                                  {o.bookPrice && <small className="d-block text-muted">₹{o.bookPrice}</small>}
                                </td>
                                <td>{o.quantity}</td>
                                <td><small>{formatDate(o.createdAt)}</small></td>
                                <td><span className={`badge bg-${STATUS_BADGE[o.paymentStatus] || 'secondary'}`}>{o.paymentStatus?.replace('_', ' ') || 'unpaid'}</span></td>
                                <td>
                                  <span className={`badge bg-${STATUS_BADGE[o.status] || 'secondary'}`}>
                                    {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                                  </span>
                                </td>
                                <td>
                                  {o.trackingNumber
                                    ? <small className="text-info fw-semibold">{o.trackingNumber}</small>
                                    : <small className="text-muted">—</small>
                                  }
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  }
                </div>
              )}

              {/* ── My Courses ── */}
              {tab === 'courses' && (
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <h4 className="profile-section-title mb-0">My Courses</h4>
                    <a href="/ChauhanAdvocate/courses" className="btn btn-gold btn-sm"><i className="fas fa-plus me-1"></i>Browse Courses</a>
                  </div>
                  {dataLoading
                    ? <div className="text-center py-5"><div className="spinner-border text-warning"></div></div>
                    : enrollments.length === 0
                    ? (
                      <div className="profile-empty">
                        <i className="fas fa-graduation-cap"></i>
                        <p>No courses enrolled yet</p>
                        <a href="/ChauhanAdvocate/courses" className="btn btn-gold btn-sm">Browse Courses</a>
                      </div>
                    ) : (
                      <div className="row g-3">
                        {enrollments.map(en => {
                          const course = en.courseId;
                          if (!course) return null;
                          const totalVideos = course.modules?.reduce((s, m) => s + (m.videos?.length || 0), 0) || 0;
                          const pct = totalVideos > 0 ? Math.round(((en.completedVideos || 0) / totalVideos) * 100) : 0;
                          const isWatching = watchingEnrollmentId === en._id;
                          const statusColor = { paid: 'success', pending_verification: 'warning', pending: 'secondary', failed: 'danger' };
                          return (
                            <div key={en._id} className={isWatching ? 'col-12' : 'col-md-6'}>
                              <div className="profile-course-card">
                                <div className="profile-course-header">
                                  <div className="profile-course-title">{course.title}</div>
                                  <span className={`badge bg-${statusColor[en.paymentStatus] || 'secondary'}`}>
                                    {en.paymentStatus === 'paid' ? 'Active' :
                                     en.paymentStatus === 'pending_verification' ? 'Payment Review' :
                                     en.paymentStatus === 'pending' ? 'Pending' : 'Rejected'}
                                  </span>
                                </div>
                                <div className="text-muted small mb-2">by {course.instructor}</div>
                                {en.paymentStatus === 'paid' && (
                                  <>
                                    <div className="d-flex justify-content-between small mb-1">
                                      <span>Progress</span>
                                      <span>{en.completedVideos}/{totalVideos} videos</span>
                                    </div>
                                    <div className="progress" style={{ height: 6 }}>
                                      <div className="progress-bar bg-success" style={{ width: `${pct}%` }}></div>
                                    </div>
                                    <div className="text-end small text-muted mt-1">{pct}% complete</div>
                                    <button
                                      className="btn btn-gold btn-sm w-100 mt-3"
                                      onClick={() => setWatchingEnrollmentId(watchingEnrollmentId === en._id ? null : en._id)}
                                    >
                                      <i className={`fas ${watchingEnrollmentId === en._id ? 'fa-chevron-up' : 'fa-play'} me-1`}></i>
                                      {watchingEnrollmentId === en._id ? 'Hide Player' : pct > 0 ? 'Continue Learning' : 'Start Learning'}
                                    </button>
                                  </>
                                )}
                                {en.paymentStatus === 'pending_verification' && (
                                  <p className="small text-warning mb-0">
                                    <i className="fas fa-clock me-1"></i>Payment under review. Access will be granted within 24 hours.
                                  </p>
                                )}
                                {en.enrolledAt && (
                                  <small className="text-muted d-block mt-2">
                                    <i className="fas fa-calendar me-1"></i>Enrolled: {formatDate(en.enrolledAt)}
                                  </small>
                                )}
                              </div>
                              {isWatching && en.paymentStatus === 'paid' && (
                                <CoursePlayer
                                  enrollment={en}
                                  authHeader={authHeader}
                                  onClose={() => setWatchingEnrollmentId(null)}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )
                  }
                </div>
              )}

              {/* ── My Magazines ── */}
              {tab === 'magazines' && (
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <h4 className="profile-section-title mb-0">My Magazines</h4>
                    <button className="btn btn-gold btn-sm" onClick={() => goTo('magazines')}>
                      <i className="fas fa-book-open me-1"></i>Browse Magazines
                    </button>
                  </div>
                  {dataLoading
                    ? <div className="text-center py-5"><div className="spinner-border text-warning"></div></div>
                    : myMagazines.length === 0
                    ? (
                      <div className="profile-empty">
                        <i className="fas fa-book-open"></i>
                        <p>No purchased magazines yet</p>
                        <button className="btn btn-gold btn-sm" onClick={() => goTo('magazines')}>Browse Magazines</button>
                      </div>
                    ) : (
                      <div className="row g-3">
                        {myMagazines.map(p => {
                          const mag = p.magazineId;
                          if (!mag) return null;
                          return (
                            <div className="col-md-6 col-lg-4" key={p._id}>
                              <div className="profile-mag-card">
                                <div className="profile-mag-cover-wrap">
                                  <img
                                    src={mag.coverImage ? mediaUrl(mag.coverImage) : `${import.meta.env.BASE_URL}placeholder-lawyer.svg`}
                                    alt={mag.title}
                                    className="profile-mag-cover"
                                    onError={e => { e.target.src = `${import.meta.env.BASE_URL}placeholder-lawyer.svg`; }}
                                  />
                                  <span className="profile-mag-badge">PAID</span>
                                </div>
                                <div className="profile-mag-info">
                                  <div className="profile-mag-title">{mag.title}</div>
                                  {mag.issueNumber && <div className="profile-mag-issue">{mag.issueNumber}</div>}
                                  {mag.category && <div className="profile-mag-cat">{mag.category}</div>}
                                  <div className="profile-mag-meta">
                                    <span><i className="fas fa-rupee-sign me-1"></i>₹{p.amount || mag.price}</span>
                                    <span><i className="fas fa-calendar me-1"></i>{formatDate(p.purchaseDate)}</span>
                                  </div>
                                  {mag.allowDownload && (
                                    <button
                                      className="btn btn-gold btn-sm w-100 mt-2"
                                      onClick={() => handleMagazineDownload(mag._id, mag.title)}
                                    >
                                      <i className="fas fa-download me-1"></i>Download PDF
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
                    <button className="btn btn-gold btn-sm" onClick={() => goTo('join')}><i className="fas fa-plus me-1"></i>Apply Now</button>
                  </div>
                  {dataLoading
                    ? <div className="text-center py-5"><div className="spinner-border text-warning"></div></div>
                    : applications.length === 0
                    ? <div className="profile-empty"><i className="fas fa-user-tie"></i><p>No applications found</p><button className="btn btn-gold btn-sm" onClick={() => goTo('join')}>Apply as Jr. Advocate</button></div>
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

      {showApptModal && <AppointmentModal onClose={() => setShowApptModal(false)} />}
    </div>
  );
}
