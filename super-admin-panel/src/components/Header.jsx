const PAGE_TITLES = {
  dashboard:       { label: 'Dashboard',           icon: 'fas fa-tachometer-alt' },
  analytics:       { label: 'Analytics',           icon: 'fas fa-chart-line' },
  users:           { label: 'User Management',     icon: 'fas fa-users' },
  adminmanagement: { label: 'Admin Management',    icon: 'fas fa-user-shield' },
  appointments:    { label: 'Appointments',        icon: 'fas fa-calendar-alt' },
  payments:        { label: 'Payment Management',  icon: 'fas fa-credit-card' },
  content:         { label: 'Content Hub',         icon: 'fas fa-layer-group' },
  sitesettings:    { label: 'Site Settings',       icon: 'fas fa-cog' },
  features:        { label: 'Feature Toggles',     icon: 'fas fa-toggle-on' },
  notifications:   { label: 'Notifications',       icon: 'fas fa-bell' },
  roles:           { label: 'Roles & Permissions', icon: 'fas fa-user-tag' },
  security:        { label: 'Security Center',     icon: 'fas fa-shield-alt' },
  system:          { label: 'System Health',       icon: 'fas fa-heartbeat' },
  auditlogs:       { label: 'Audit Logs',          icon: 'fas fa-clipboard-list' },
};

export default function Header({ page, onMenuClick }) {
  const meta = PAGE_TITLES[page] || { label: page, icon: 'fas fa-circle' };

  return (
    <header className="sa-header">
      <div className="sa-header-left">
        <button className="sa-hamburger" onClick={onMenuClick}>
          <i className="fas fa-bars"></i>
        </button>
        <div className="sa-header-breadcrumb">
          <i className={meta.icon + ' me-2'}></i>{meta.label}
        </div>
      </div>
      <div className="sa-header-right">
        <div className="sa-header-badge">
          <i className="fas fa-lock me-1"></i>Secure Session
        </div>
      </div>
    </header>
  );
}
