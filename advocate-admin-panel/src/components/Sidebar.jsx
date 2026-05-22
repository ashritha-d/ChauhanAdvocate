import { useAuth } from '../context/AuthContext';

const NAV = [
  { label: 'Main', items: [
    { icon: 'fas fa-tachometer-alt', label: 'Dashboard', page: 'dashboard' },
  ]},
  { label: 'Content', items: [
    { icon: 'fas fa-cog', label: 'Site Settings', page: 'settings' },
    { icon: 'fas fa-image', label: 'Hero Banners', page: 'banners' },
    { icon: 'fas fa-briefcase', label: 'Services', page: 'services' },
    { icon: 'fas fa-newspaper', label: 'Blogs', page: 'blogs' },
    { icon: 'fas fa-star', label: 'Testimonials', page: 'testimonials' },
    { icon: 'fas fa-question-circle', label: 'FAQs', page: 'faqs' },
  ]},
  { label: 'Inquiries', items: [
    { icon: 'fas fa-calendar-alt', label: 'Appointments', page: 'appointments' },
    { icon: 'fas fa-envelope', label: 'Contacts', page: 'contacts' },
  ]},
  { label: 'Account', items: [
    { icon: 'fas fa-user-circle', label: 'My Profile', page: 'profile' },
  ]},
];

export default function Sidebar({ current, onChange, mobileOpen, onClose }) {
  const { admin, logout } = useAuth();

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay show" onClick={onClose}></div>}
      <aside className={`admin-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon"><i className="fas fa-balance-scale"></i></div>
          <span>Advocate Chauhan</span>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(section => (
            <div key={section.label}>
              <div className="sidebar-section">{section.label}</div>
              {section.items.map(item => (
                <button
                  key={item.page}
                  className={`nav-item-link ${current === item.page ? 'active' : ''}`}
                  onClick={() => { onChange(item.page); onClose(); }}
                >
                  <i className={item.icon}></i> {item.label}
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
