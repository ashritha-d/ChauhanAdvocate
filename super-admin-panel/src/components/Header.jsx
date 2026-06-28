const PAGE_TITLES = {
  dashboard:       { label: 'Dashboard',        icon: 'fas fa-tachometer-alt' },
  adminmanagement: { label: 'Admin Management', icon: 'fas fa-shield-alt' },
  auditlogs:       { label: 'Audit Logs',       icon: 'fas fa-clipboard-list' },
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
