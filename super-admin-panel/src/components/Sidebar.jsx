import { useAuth } from '../context/AuthContext';

const NAV = [
  { section: 'Overview', items: [
    { icon: 'fas fa-tachometer-alt', label: 'Dashboard',     page: 'dashboard' },
    { icon: 'fas fa-chart-line',     label: 'Analytics',     page: 'analytics' },
  ]},
  { section: 'Management', items: [
    { icon: 'fas fa-users',          label: 'Users',         page: 'users' },
    { icon: 'fas fa-user-shield',    label: 'Admins',        page: 'adminmanagement' },
    { icon: 'fas fa-calendar-alt',   label: 'Appointments',  page: 'appointments' },
    { icon: 'fas fa-credit-card',    label: 'Payments',      page: 'payments' },
  ]},
  { section: 'Content', items: [
    { icon: 'fas fa-layer-group',    label: 'Content Hub',   page: 'content' },
  ]},
  { section: 'Configuration', items: [
    { icon: 'fas fa-cog',            label: 'Site Settings', page: 'sitesettings' },
    { icon: 'fas fa-toggle-on',      label: 'Feature Toggles', page: 'features' },
    { icon: 'fas fa-bell',           label: 'Notifications', page: 'notifications' },
    { icon: 'fas fa-user-tag',       label: 'Roles & Permissions', page: 'roles' },
  ]},
  { section: 'Security & System', items: [
    { icon: 'fas fa-shield-alt',     label: 'Security Center', page: 'security' },
    { icon: 'fas fa-heartbeat',      label: 'System Health',   page: 'system' },
    { icon: 'fas fa-clipboard-list', label: 'Audit Logs',      page: 'auditlogs' },
  ]},
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
          {NAV.map(group => (
            <div key={group.section}>
              <div className="sa-nav-section">{group.section}</div>
              {group.items.map(item => (
                <button
                  key={item.page}
                  className={`sa-nav-item ${current === item.page ? 'active' : ''}`}
                  onClick={() => { onChange(item.page); onClose(); }}
                >
                  <i className={item.icon}></i>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
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
