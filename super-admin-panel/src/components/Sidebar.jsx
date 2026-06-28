import { useAuth } from '../context/AuthContext';

const NAV = [
  { icon: 'fas fa-tachometer-alt', label: 'Dashboard',        page: 'dashboard' },
  { icon: 'fas fa-shield-alt',     label: 'Admin Management', page: 'adminmanagement' },
  { icon: 'fas fa-clipboard-list', label: 'Audit Logs',       page: 'auditlogs' },
];

export default function Sidebar({ current, onChange, mobileOpen, onClose }) {
  const { admin, logout } = useAuth();

  return (
    <>
      {mobileOpen && <div className="sa-overlay" onClick={onClose}></div>}
      <aside className={`sa-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sa-sidebar-brand">
          <div className="sa-brand-shield"><i className="fas fa-user-shield"></i></div>
          <div>
            <div className="sa-brand-title">Super Admin</div>
            <div className="sa-brand-sub">Advocate Chauhan</div>
          </div>
        </div>

        <nav className="sa-sidebar-nav">
          <div className="sa-nav-section">Control Panel</div>
          {NAV.map(item => (
            <button
              key={item.page}
              className={`sa-nav-item ${current === item.page ? 'active' : ''}`}
              onClick={() => { onChange(item.page); onClose(); }}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sa-sidebar-footer">
          <div className="sa-footer-user">
            <div className="sa-footer-avatar">{(admin?.name || 'S').charAt(0).toUpperCase()}</div>
            <div className="sa-footer-info">
              <div className="sa-footer-name">{admin?.name || 'Super Admin'}</div>
              <div className="sa-footer-email">{admin?.email}</div>
            </div>
          </div>
          <button className="sa-logout-btn" onClick={logout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
