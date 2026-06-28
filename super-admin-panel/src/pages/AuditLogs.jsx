import { useEffect, useState } from 'react';
import api from '../api/axios';

const ACTION_LABELS = {
  ADMIN_CREATED:     { label: 'Admin Created',     color: '#34d399', icon: 'fa-user-plus' },
  ADMIN_UPDATED:     { label: 'Admin Updated',     color: '#60a5fa', icon: 'fa-user-edit' },
  ADMIN_DELETED:     { label: 'Admin Deleted',     color: '#f87171', icon: 'fa-user-minus' },
  ADMIN_ACTIVATED:   { label: 'Admin Activated',   color: '#34d399', icon: 'fa-user-check' },
  ADMIN_DEACTIVATED: { label: 'Admin Deactivated', color: '#fbbf24', icon: 'fa-user-times' },
  PASSWORD_RESET:    { label: 'Password Reset',    color: '#a78bfa', icon: 'fa-key' },
  LOGIN:             { label: 'Login',             color: '#22d3ee', icon: 'fa-sign-in-alt' },
  LOGOUT:            { label: 'Logout',            color: '#9ca3af', icon: 'fa-sign-out-alt' },
  FAILED_LOGIN:      { label: 'Failed Login',      color: '#f87171', icon: 'fa-exclamation-triangle' },
};

export default function AuditLogs() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction]   = useState('');
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [total, setTotal]     = useState(0);

  const loadLogs = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 25 });
      if (action) params.set('action', action);
      const r = await api.get(`/admin-management/audit-logs?${params}`);
      setLogs(r.data.data);
      setTotal(r.data.total);
      setPages(r.data.pages);
      setPage(p);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadLogs(1); }, [action]);

  const fmtDT = d => new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h4 className="sa-page-title"><i className="fas fa-clipboard-list me-2"></i>Audit Logs</h4>
          <p className="sa-page-subtitle">Complete history of all admin management actions</p>
        </div>
        <span className="sa-badge-count">{total} entries</span>
      </div>

      {/* Filter */}
      <div className="sa-card mb-4">
        <div className="sa-card-body py-2">
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <label style={{ color: '#9ca3af', fontSize: '0.83rem', fontWeight: 600 }}>Filter by Action:</label>
            <select className="form-select sa-input" style={{ maxWidth: 220 }} value={action} onChange={e => setAction(e.target.value)}>
              <option value="">All Actions</option>
              {Object.entries(ACTION_LABELS).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            {action && (
              <button className="btn sa-btn-outline btn-sm" onClick={() => setAction('')}>Clear</button>
            )}
          </div>
        </div>
      </div>

      {/* Log list */}
      <div className="sa-card">
        <div className="sa-card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border sa-spinner"></div></div>
          ) : logs.length === 0 ? (
            <div className="text-center py-5" style={{ color: '#6b7280' }}>
              <i className="fas fa-clipboard-list fa-2x mb-3 d-block"></i>No audit logs yet
            </div>
          ) : (
            <div>
              {logs.map(log => {
                const meta = ACTION_LABELS[log.action] || { label: log.action, color: '#9ca3af', icon: 'fa-circle' };
                return (
                  <div key={log._id} style={{ borderBottom: '1px solid #1e293b', padding: '14px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: meta.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <i className={`fas ${meta.icon}`} style={{ color: meta.color, fontSize: '0.88rem' }}></i>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span style={{ background: meta.color + '22', color: meta.color, padding: '2px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, border: `1px solid ${meta.color}44` }}>
                          {meta.label}
                        </span>
                        <span style={{ fontSize: '0.83rem', fontWeight: 600, color: '#e2e8f0' }}>{log.adminName}</span>
                        <span style={{ color: '#6b7280', fontSize: '0.76rem' }}>{log.adminEmail}</span>
                      </div>
                      {log.targetAdminEmail && (
                        <div style={{ marginTop: 4, fontSize: '0.78rem', color: '#9ca3af' }}>
                          <i className="fas fa-arrow-right me-1"></i>Target: <strong style={{ color: '#e2e8f0' }}>{log.targetAdminEmail}</strong>
                        </div>
                      )}
                      <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          <i className="fas fa-clock me-1"></i>{fmtDT(log.createdAt)}
                        </span>
                        {log.ipAddress && (
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            <i className="fas fa-map-marker-alt me-1"></i>{log.ipAddress}
                          </span>
                        )}
                        {log.details && Object.keys(log.details).length > 0 && (
                          <span style={{ fontSize: '0.72rem', color: '#6b7280', fontFamily: 'monospace' }}>
                            {JSON.stringify(log.details)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {pages > 1 && (
            <div className="d-flex justify-content-center py-3 gap-2">
              <button className="btn sa-btn-outline btn-sm" disabled={page <= 1} onClick={() => loadLogs(page - 1)}>
                <i className="fas fa-chevron-left"></i>
              </button>
              <span className="btn sa-btn-primary btn-sm px-3">{page} / {pages}</span>
              <button className="btn sa-btn-outline btn-sm" disabled={page >= pages} onClick={() => loadLogs(page + 1)}>
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
