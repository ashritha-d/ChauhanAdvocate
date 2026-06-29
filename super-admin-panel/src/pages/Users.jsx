import { useEffect, useState } from 'react';
import api from '../api/axios';

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: type === 'error' ? '#dc3545' : '#198754', color: '#fff', padding: '12px 20px', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', minWidth: 260, display: 'flex', alignItems: 'center', gap: 10 }}>
      <i className={type === 'error' ? 'fas fa-times-circle' : 'fas fa-check-circle'}></i>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.1rem' }}>&times;</button>
    </div>
  );
}

export default function Users() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [total, setTotal]     = useState(0);
  const [modal, setModal]     = useState(null); // 'delete' | 'notify' | 'view'
  const [selected, setSelected] = useState(null);
  const [notifyMsg, setNotifyMsg] = useState('');
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const load = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 15 });
      if (search)       params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const r = await api.get(`/users?${params}`);
      setUsers(r.data.data || r.data.users || []);
      setTotal(r.data.total || 0);
      setPages(r.data.pages || 1);
    } catch { showToast('Failed to load users', 'error'); }
    setLoading(false);
  };

  useEffect(() => { load(1); setPage(1); }, [search, statusFilter]);

  const handleToggleStatus = async (u) => {
    try {
      await api.put(`/users/${u._id}/status`, { isActive: !u.isActive });
      showToast(`User ${u.isActive ? 'suspended' : 'activated'}`);
      load();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/users/${selected._id}`);
      showToast('User deleted');
      setModal(null); load(1);
    } catch (e) { showToast(e.response?.data?.message || 'Delete failed', 'error'); }
    setSaving(false);
  };

  const handleNotify = async () => {
    if (!notifyMsg.trim()) return showToast('Message is required', 'error');
    setSaving(true);
    try {
      await api.post(`/users/${selected._id}/notify`, { message: notifyMsg });
      showToast('Notification sent');
      setModal(null); setNotifyMsg('');
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    setSaving(false);
  };

  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmtDT   = d => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never';

  return (
    <div className="sa-page">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="sa-page-header">
        <div>
          <h4 className="sa-page-title"><i className="fas fa-users me-2"></i>User Management</h4>
          <p className="sa-page-subtitle">View, manage, suspend and delete registered users</p>
        </div>
        <span className="sa-badge-count">{total} users</span>
      </div>

      {/* Filters */}
      <div className="sa-card mb-4">
        <div className="sa-card-body">
          <div className="row g-2">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text sa-input-icon"><i className="fas fa-search"></i></span>
                <input className="form-control sa-input" placeholder="Search name, email, phone..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select sa-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Suspended</option>
              </select>
            </div>
            <div className="col-md-3">
              <button className="btn sa-btn-outline w-100" onClick={() => { setSearch(''); setStatusFilter(''); }}>
                <i className="fas fa-redo me-1"></i>Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="sa-card">
        <div className="sa-card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border sa-spinner"></div></div>
          ) : (
            <div className="table-responsive">
              <table className="table sa-table mb-0">
                <thead>
                  <tr>
                    <th className="px-4">User</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Joined</th>
                    <th className="px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-5" style={{ color: '#6c757d' }}>No users found</td></tr>
                  ) : users.map(u => (
                    <tr key={u._id}>
                      <td className="px-4">
                        <div className="d-flex align-items-center gap-2">
                          <div className="sa-table-avatar" style={{ background: '#0d6efd' }}>{(u.name || 'U').charAt(0).toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#e2e8f0' }}>{u.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{u.email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.83rem', color: '#9ca3af' }}>{u.phone}</td>
                      <td>
                        <span style={{ background: u.isActive ? '#065f4622' : '#991b1b22', color: u.isActive ? '#34d399' : '#f87171', padding: '3px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600 }}>
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{fmtDT(u.lastLogin)}</td>
                      <td style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{fmtDate(u.createdAt)}</td>
                      <td className="px-4">
                        <div className="d-flex gap-1">
                          <button className="sa-action-btn sa-action-edit" title="Send Notification" onClick={() => { setSelected(u); setModal('notify'); }}>
                            <i className="fas fa-bell"></i>
                          </button>
                          <button className="sa-action-btn" title={u.isActive ? 'Suspend' : 'Activate'}
                            style={{ background: u.isActive ? '#7f1d1d33' : '#06402a33', color: u.isActive ? '#f87171' : '#34d399', border: 'none' }}
                            onClick={() => handleToggleStatus(u)}>
                            <i className={`fas fa-${u.isActive ? 'ban' : 'check'}`}></i>
                          </button>
                          <button className="sa-action-btn sa-action-delete" title="Delete" onClick={() => { setSelected(u); setModal('delete'); }}>
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pages > 1 && (
            <div className="d-flex justify-content-center py-3 gap-2">
              <button className="btn sa-btn-outline btn-sm" disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); load(p); }}><i className="fas fa-chevron-left"></i></button>
              <span className="btn sa-btn-primary btn-sm px-3">{page} / {pages}</span>
              <button className="btn sa-btn-outline btn-sm" disabled={page >= pages} onClick={() => { const p = page + 1; setPage(p); load(p); }}><i className="fas fa-chevron-right"></i></button>
            </div>
          )}
        </div>
      </div>

      {/* Delete modal */}
      {modal === 'delete' && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
            <div className="modal-content sa-modal">
              <div className="modal-header sa-modal-header border-0">
                <h5 className="modal-title fw-bold" style={{ color: '#f87171' }}><i className="fas fa-exclamation-triangle me-2"></i>Delete User</h5>
                <button className="btn-close btn-close-white" onClick={() => setModal(null)}></button>
              </div>
              <div className="modal-body sa-modal-body">
                <p style={{ color: '#9ca3af' }}>Are you sure you want to permanently delete <strong style={{ color: '#e2e8f0' }}>{selected?.name}</strong>?</p>
              </div>
              <div className="modal-footer sa-modal-footer border-0">
                <button className="btn sa-btn-outline" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn" style={{ background: '#dc3545', color: '#fff', fontWeight: 600 }} onClick={handleDelete} disabled={saving}>
                  {saving ? 'Deleting…' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notify modal */}
      {modal === 'notify' && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
            <div className="modal-content sa-modal">
              <div className="modal-header sa-modal-header">
                <h5 className="modal-title fw-bold"><i className="fas fa-bell me-2" style={{ color: '#C9A84C' }}></i>Send Notification</h5>
                <button className="btn-close btn-close-white" onClick={() => setModal(null)}></button>
              </div>
              <div className="modal-body sa-modal-body">
                <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>To: <strong style={{ color: '#e2e8f0' }}>{selected?.name}</strong></p>
                <label className="sa-label">Message *</label>
                <textarea className="form-control sa-input" rows={3} value={notifyMsg} onChange={e => setNotifyMsg(e.target.value)} placeholder="Type your message..."></textarea>
              </div>
              <div className="modal-footer sa-modal-footer">
                <button className="btn sa-btn-outline" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn sa-btn-primary" onClick={handleNotify} disabled={saving}>
                  {saving ? 'Sending…' : 'Send Notification'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
