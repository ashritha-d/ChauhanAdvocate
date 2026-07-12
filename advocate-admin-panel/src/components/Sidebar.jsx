import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import api from '../api/axios';

const NAV = [
  { label: 'Main', items: [
    { icon: 'fas fa-tachometer-alt', label: 'Dashboard', page: 'dashboard' },
  ]},
  { label: 'Content', items: [
    { icon: 'fas fa-rss',            label: 'Latest News',     page: 'news', badge: 'news' },
    { icon: 'fas fa-newspaper',      label: 'Blogs',           page: 'blogs' },
    { icon: 'fas fa-graduation-cap', label: 'Courses',         page: 'courses' },
    { icon: 'fas fa-book-open',      label: 'Magazines',       page: 'magazines' },
    { icon: 'fas fa-book',           label: 'Books for Sale',  page: 'books' },
    { icon: 'fas fa-drafting-compass', label: 'Drafts',        page: 'drafts' },
    { icon: 'fas fa-star',           label: 'Testimonials',    page: 'testimonials' },
    { icon: 'fas fa-question-circle',label: 'FAQs',            page: 'faqs' },
    { icon: 'fab fa-youtube',        label: 'YouTube Videos',  page: 'youtube' },
    { icon: 'fab fa-facebook',       label: 'Facebook Content', page: 'facebook' },
    { icon: 'fas fa-video',          label: 'Live Sessions',   page: 'livesessions' },
  ]},
  { label: 'Inquiries', items: [
    { icon: 'fas fa-calendar-alt',   label: 'Appointments',      page: 'appointments' },
    { icon: 'fas fa-book',           label: 'Book Orders',       page: 'bookorders' },
    { icon: 'fas fa-user-tie',       label: 'Jr. Advocates',     page: 'jradvocates' },
    { icon: 'fas fa-graduation-cap', label: 'Internship Appls.', page: 'internships' },
    { icon: 'fas fa-credit-card',    label: 'Payments',          page: 'payments' },
  ]},
  { label: 'Alerts', items: [
    { icon: 'fas fa-bell', label: 'All Notifications', page: 'notifications' },
  ]},
  { label: 'Account', items: [
    { icon: 'fas fa-user-circle', label: 'My Profile', page: 'profile' },
  ]},
];

export default function Sidebar({ current, onChange, mobileOpen, onClose }) {
  const { admin, logout } = useAuth();
  const [newsCount, setNewsCount] = useState(0);

  useEffect(() => {
    api.get('/news').then(r => setNewsCount(r.data.activeCount || 0)).catch(() => {});
  }, [current]);

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay show" onClick={onClose}></div>}
      <aside className={`admin-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon"><i className="fas fa-balance-scale"></i></div>
          <span>Advocate Chauhan</span>
        </div>
        <nav className="sidebar-nav">
          {NAV.filter(section => !section.superadminOnly || admin?.role === 'superadmin').map(section => (
            <div key={section.label}>
              <div className="sidebar-section" style={section.superadminOnly ? { color: '#C9A84C' } : {}}>{section.label}</div>
              {section.items.map(item => (
                <button
                  key={item.page}
                  className={`nav-item-link ${current === item.page ? 'active' : ''}`}
                  onClick={() => { onChange(item.page); onClose(); }}
                >
                  <i className={item.icon}></i> {item.label}
                  {item.badge === 'news' && newsCount > 0 && (
                    <span className="ms-auto badge bg-success" style={{ fontSize: '0.65rem' }}>{newsCount}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="d-flex align-items-center gap-2 mb-3">
            <div className="admin-avatar">{(admin?.name || 'A').charAt(0).toUpperCase()}</div>
            <div>
              <div style={{ color:'#fff', fontSize:'.85rem', fontWeight:600 }}>{admin?.name || 'Admin'}</div>
              <div style={{ color:'rgba(255,255,255,.4)', fontSize:'.72rem' }}>{admin?.email}</div>
            </div>
          </div>
          <button className="nav-item-link w-100" onClick={logout} style={{ color:'#ff6b6b' }}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
