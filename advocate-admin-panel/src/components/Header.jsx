import { useAuth } from '../context/AuthContext';
import { useEffect, useRef, useState } from 'react';
import { getNotificationCounts } from '../api';

const PAGE_TITLES = {
  dashboard: 'Dashboard', settings: 'Site Settings', banners: 'Hero Banners',
  services: 'Services', blogs: 'Blogs', news: 'Latest News', testimonials: 'Testimonials',
  faqs: 'FAQs', appointments: 'Appointments', contacts: 'Contacts',
  profile: 'My Profile', youtube: 'YouTube Videos', courses: 'Courses / LMS',
  orders: 'Orders', jradvocates: 'Jr. Advocate Applications', bookorders: 'Book Orders',
};

export default function Header({ page, onMenuClick, onNavigate }) {
  const { admin } = useAuth();
  const [counts, setCounts] = useState({ appointments: 0, orders: 0, jrAdvocates: 0, bookOrders: 0, total: 0 });
  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);

  const fetchCounts = () => {
    getNotificationCounts()
      .then(r => setCounts(r.data.data || { appointments: 0, orders: 0, jrAdvocates: 0, total: 0 }))
      .catch(() => {});
  };

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const notifItems = [
    { label: 'Appointments', count: counts.appointments, page: 'appointments', icon: 'fas fa-calendar-alt' },
    { label: 'Orders', count: counts.orders, page: 'orders', icon: 'fas fa-file-alt' },
    { label: 'Book Orders', count: counts.bookOrders, page: 'bookorders', icon: 'fas fa-book' },
    { label: 'Jr. Advocates', count: counts.jrAdvocates, page: 'jradvocates', icon: 'fas fa-user-tie' },
  ].filter(n => n.count > 0);

  return (
    <header className="admin-header">
      <div className="d-flex align-items-center gap-3">
        <button className="btn btn-sm btn-light d-lg-none" onClick={onMenuClick}>
          <i className="fas fa-bars"></i>
        </button>
        <h5 className="mb-0 fw-bold">{PAGE_TITLES[page] || page}</h5>
      </div>
      <div className="d-flex align-items-center gap-3">
        <span className="badge bg-success">Live</span>

        {/* Notification Bell */}
        <div className="position-relative" ref={dropRef}>
          <button
            className="btn btn-sm btn-light position-relative"
            onClick={() => setOpen(o => !o)}
            title="Notifications"
          >
            <i className="fas fa-bell"></i>
            {counts.total > 0 && (
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                style={{ fontSize: '0.6rem' }}
              >
                {counts.total > 99 ? '99+' : counts.total}
              </span>
            )}
          </button>
          {open && (
            <div
              className="dropdown-menu show shadow"
              style={{ position: 'absolute', right: 0, top: '110%', minWidth: 240, zIndex: 1050 }}
            >
              <div className="dropdown-header fw-bold border-bottom pb-2">
                Unread Notifications
              </div>
              {notifItems.length === 0 ? (
                <div className="dropdown-item text-muted small">All caught up!</div>
              ) : (
                notifItems.map(n => (
                  <button
                    key={n.page}
                    className="dropdown-item d-flex justify-content-between align-items-center"
                    onClick={() => { onNavigate && onNavigate(n.page); setOpen(false); }}
                  >
                    <span><i className={`${n.icon} me-2 text-warning`}></i>{n.label}</span>
                    <span className="badge bg-danger">{n.count}</span>
                  </button>
                ))
              )}
              <div className="dropdown-divider"></div>
              <button className="dropdown-item text-muted small text-center" onClick={() => { fetchCounts(); setOpen(false); }}>
                <i className="fas fa-sync-alt me-1"></i> Refresh
              </button>
            </div>
          )}
        </div>

        <div className="admin-avatar">{(admin?.name || 'A').charAt(0).toUpperCase()}</div>
      </div>
    </header>
  );
}
