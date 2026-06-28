import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ACTION_META = {
  ADMIN_CREATED:     { label: 'Created',     color: '#198754' },
  ADMIN_UPDATED:     { label: 'Updated',     color: '#0d6efd' },
  ADMIN_DELETED:     { label: 'Deleted',     color: '#dc3545' },
  ADMIN_ACTIVATED:   { label: 'Activated',   color: '#198754' },
  ADMIN_DEACTIVATED: { label: 'Deactivated', color: '#fd7e14' },
  PASSWORD_RESET:    { label: 'Pwd Reset',   color: '#6f42c1' },
  LOGIN:             { label: 'Login',        color: '#0dcaf0' },
  LOGOUT:            { label: 'Logout',       color: '#6c757d' },
  FAILED_LOGIN:      { label: 'Failed Login', color: '#dc3545' },
};

const ROLE_COLORS = {
  superadmin: '#C9A84C', admin: '#0d6efd',
  editor: '#198754', content_manager: '#fd7e14', support: '#6f42c1',
};
const ROLE_LABELS = {
  superadmin: 'Super Admin', admin: 'Admin',
  editor: 'Editor', content_manager: 'Content Manager', support: 'Support',
};

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="sa-stat-card">
      <div className="sa-stat-icon" style={{ background: color + '22', color }}>
        <i className={icon}></i>
      </div>
      <div>
        <div className="sa-stat-value">{value}</div>
        <div className="sa-stat-label">{label}</div>
        {sub && <div className="sa-stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard({ onNavigate }) {
  const { admin } = useAuth();
  const [stats, setStats] = useState(null);
  const [logs, setLogs]   = useState([]);

  useEffect(() => {
    api.get('/admin-management/stats').then(r => setStats(r.data.data)).catch(() => {});
    api.get('/admin-management/audit-logs?limit=8').then(r => setLogs(r.data.data || [])).catch(() => {});
  }, []);

  const fmtDT = d => new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="sa-page">
      {/* Welcome */}
      <div className="sa-page-header">
        <div>
          <h4 className="sa-page-title">
            <i className="fas fa-tachometer-alt me-2"></i>Dashboard
          </h4>
          <p className="sa-page-subtitle">Welcome back, <strong>{admin?.name}</strong></p>
        </div>
        <div className="sa-badge-superadmin">
          <i className="fas fa-user-shield me-1"></i>Super Admin
        </div>
      </div>

      {/* Stats */}
      {stats ? (
        <div className="sa-stats-grid mb-4">
          <StatCard icon="fas fa-users" label="Total Admins" value={stats.total} color="#0d6efd" />
          <StatCard icon="fas fa-user-check" label="Active" value={stats.active} color="#198754" />
          <StatCard icon="fas fa-user-times" label="Inactive" value={stats.inactive} color="#dc3545" />
          <StatCard
            icon="fas fa-clock"
            label="Last Login"
            value={stats.recentLogins?.[0] ? fmtDate(stats.recentLogins[0].lastLogin) : '—'}
            color="#fd7e14"
            sub={stats.recentLogins?.[0]?.name}
          />
        </div>
      ) : (
        <div className="text-center py-3"><div className="spinner-border sa-spinner"></div></div>
      )}

      <div className="row g-4">
        {/* Recent Audit Logs */}
        <div className="col-lg-7">
          <div className="sa-card">
            <div className="sa-card-header">
              <span><i className="fas fa-clipboard-list me-2"></i>Recent Activity</span>
              <button className="sa-link-btn" onClick={() => onNavigate('auditlogs')}>View All</button>
            </div>
            <div className="sa-card-body p-0">
              {logs.length === 0 ? (
                <div className="text-center text-muted py-4">No activity yet</div>
              ) : logs.map(log => {
                const meta = ACTION_META[log.action] || { label: log.action, color: '#6c757d' };
                return (
                  <div key={log._id} className="sa-log-row">
                    <div className="sa-log-dot" style={{ background: meta.color }}></div>
                    <div className="sa-log-content">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="sa-action-badge" style={{ background: meta.color + '22', color: meta.color }}>{meta.label}</span>
                        <span className="sa-log-actor">{log.adminName}</span>
                        {log.targetAdminEmail && (
                          <span className="sa-log-target">→ {log.targetAdminEmail}</span>
                        )}
                      </div>
                      <div className="sa-log-time">{fmtDT(log.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recently Created Admins */}
        <div className="col-lg-5">
          <div className="sa-card">
            <div className="sa-card-header">
              <span><i className="fas fa-user-plus me-2"></i>Recently Created</span>
              <button className="sa-link-btn" onClick={() => onNavigate('adminmanagement')}>Manage All</button>
            </div>
            <div className="sa-card-body p-0">
              {!stats?.recentlyCreated?.length ? (
                <div className="text-center text-muted py-4">No admins yet</div>
              ) : stats.recentlyCreated.map(a => (
                <div key={a._id} className="sa-admin-row">
                  <div className="sa-admin-avatar">{a.name.charAt(0).toUpperCase()}</div>
                  <div className="sa-admin-info">
                    <div className="sa-admin-name">{a.name}</div>
                    <div className="sa-admin-email">{a.email}</div>
                  </div>
                  <span className="sa-role-badge" style={{ background: ROLE_COLORS[a.role] + '22', color: ROLE_COLORS[a.role] }}>
                    {ROLE_LABELS[a.role] || a.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
