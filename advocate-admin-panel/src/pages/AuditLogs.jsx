import { useEffect, useState } from 'react';
import api from '../api/axios';

const ACTION_LABELS = {
  ADMIN_CREATED:     { label: 'Admin Created',     color: '#198754', icon: 'fa-user-plus' },
  ADMIN_UPDATED:     { label: 'Admin Updated',     color: '#0d6efd', icon: 'fa-user-edit' },
  ADMIN_DELETED:     { label: 'Admin Deleted',     color: '#dc3545', icon: 'fa-user-minus' },
  ADMIN_ACTIVATED:   { label: 'Admin Activated',   color: '#198754', icon: 'fa-user-check' },
  ADMIN_DEACTIVATED: { label: 'Admin Deactivated', color: '#fd7e14', icon: 'fa-user-times' },
  PASSWORD_RESET:    { label: 'Password Reset',    color: '#6f42c1', icon: 'fa-key' },
  LOGIN:             { label: 'Login',             color: '#0dcaf0', icon: 'fa-sign-in-alt' },
  LOGOUT:            { label: 'Logout',            color: '#6c757d', icon: 'fa-sign-out-alt' },
  FAILED_LOGIN:      { label: 'Failed Login',      color: '#dc3545', icon: 'fa-exclamation-triangle' },
};

export default function AuditLogs() {
  const [logs, setLogs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('');
  const [page, setPage]     = useState(1);
  const [pages, setPages]   = useState(1);
  const [total, setTotal]   = useState(0);

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

  const fmtDT = (d) => new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return (
    <div style={{ padding: '0 0 40px' }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="mb-0 fw-bold"><i className="fas fa-clipboard-list me-2" style={{ color: '#C9A84C' }}></i>Audit Logs</h4>
          <p className="text-muted small mb-0">Complete history of all admin management actions</p>
        </div>
        <span className="badge bg-secondary">{total} total entries</span>
      </div>

      {/* Filter */}
      <div className="card mb-4" style={{ border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="card-body py-2">
          <div className="d-flex gap-2 align-items-center">
            <label className="small fw-semibold me-1 mb-0">Filter by Action:</label>
            <select className="form-select form-select-sm" style={{ maxWidth: 220 }} value={action} onChange={e => setAction(e.target.value)}>
              <option value="">All Actions</option>
              {Object.entries(ACTION_LABELS).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            {action && <button className="btn btn-sm btn-outline-secondary" onClick={() => setAction('')}>Clear</button>}
          </div>
        </div>
      </div>

      {/* Log list */}
      <div className="card" style={{ border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-warning"></div></div>
          ) : logs.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="fas fa-clipboard-list fa-2x mb-3 d-block"></i>No audit logs yet
            </div>
          ) : (
            <div>
              {logs.map(log => {
                const meta = ACTION_LABELS[log.action] || { label: log.action, color: '#6c757d', icon: 'fa-circle' };
                return (
                  <div key={log._id} style={{ borderBottom: '1px solid #f0f0f0', padding: '14px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: meta.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <i className={`fas ${meta.icon}`} style={{ color: meta.color, fontSize: '0.85rem' }}></i>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span style={{ background: meta.color, color: '#fff', padding: '2px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700 }}>{meta.label}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{log.adminName}</span>
                        <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{log.adminEmail}</span>
                      </div>
                      {log.targetAdminEmail && (
                        <div className="mt-1" style={{ fontSize: '0.78rem', color: '#6c757d' }}>
                          <i className="fas fa-arrow-right me-1"></i>Target: <strong>{log.targetAdminEmail}</strong>
                        </div>
                      )}
                      <div className="mt-1 d-flex align-items-center gap-3 flex-wrap">
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          <i className="fas fa-clock me-1"></i>{fmtDT(log.createdAt)}
                        </span>
                        {log.ipAddress && (
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                            <i className="fas fa-map-marker-alt me-1"></i>{log.ipAddress}
                          </span>
                        )}
                        {log.details && Object.keys(log.details).length > 0 && (
                          <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontFamily: 'monospace' }}>
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

          {/* Pagination */}
          {pages > 1 && (
            <div className="d-flex justify-content-center py-3 gap-2">
              <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => loadLogs(page - 1)}>
                <i className="fas fa-chevron-left"></i>
              </button>
              <span className="btn btn-sm btn-warning">{page} / {pages}</span>
              <button className="btn btn-sm btn-outline-secondary" disabled={page >= pages} onClick={() => loadLogs(page + 1)}>
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
