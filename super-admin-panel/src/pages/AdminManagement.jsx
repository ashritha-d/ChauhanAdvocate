import { useEffect, useState } from 'react';
import usePolling from '../hooks/usePolling';
import api from '../api/axios';

const ROLES = ['admin', 'editor', 'content_manager', 'support', 'superadmin'];
const ROLE_LABELS  = { superadmin: 'Super Admin', admin: 'Admin', editor: 'Editor', content_manager: 'Content Manager', support: 'Support' };
const ROLE_COLORS  = { superadmin: '#C9A84C', admin: '#0d6efd', editor: '#198754', content_manager: '#fd7e14', support: '#6f42c1' };

function RoleBadge({ role }) {
  const c = ROLE_COLORS[role] || '#6c757d';
  return (
    <span style={{ background: c + '22', color: c, padding: '3px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, border: `1px solid ${c}44` }}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}

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

const emptyForm = { name: '', username: '', email: '', phone: '', password: '', role: 'admin', isActive: true };

export default function AdminManagement() {
  const [admins, setAdmins]         = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);
  const [total, setTotal]           = useState(0);
  const [modal, setModal]           = useState(null);
  const [selected, setSelected]     = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [newPass, setNewPass]       = useState('');
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const loadAdmins = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 15 });
      if (search)       params.set('search', search);
      if (roleFilter)   params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);
      const r = await api.get(`/admin-management?${params}`);
      setAdmins(r.data.data);
      setTotal(r.data.total);
      setPages(r.data.pages);
    } catch { showToast('Failed to load admins', 'error'); }
    setLoading(false);
  };

  const loadStats = async () => {
    try { const r = await api.get('/admin-management/stats'); setStats(r.data.data); } catch {}
  };

  useEffect(() => { loadAdmins(1); setPage(1); }, [search, roleFilter, statusFilter]);
  useEffect(() => { loadStats(); }, []);
  usePolling(() => { loadAdmins(page); loadStats(); }, 30000);

  const openCreate = () => { setForm(emptyForm); setModal('create'); };
  const openEdit   = a => { setSelected(a); setForm({ name: a.name, username: a.username || '', email: a.email, phone: a.phone || '', password: '', role: a.role, isActive: a.isActive }); setModal('edit'); };
  const openDelete = a => { setSelected(a); setModal('delete'); };
  const openReset  = a => { setSelected(a); setNewPass(''); setModal('reset'); };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) return showToast('Name, email and password required', 'error');
    setSaving(true);
    try {
      await api.post('/admin-management', form);
      showToast('Admin created successfully');
      setModal(null); loadAdmins(1); loadStats();
    } catch (e) { showToast(e.response?.data?.message || 'Create failed', 'error'); }
    setSaving(false);
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const payload = { ...form }; delete payload.password;
      await api.put(`/admin-management/${selected._id}`, payload);
      showToast('Admin updated successfully');
      setModal(null); loadAdmins();
    } catch (e) { showToast(e.response?.data?.message || 'Update failed', 'error'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/admin-management/${selected._id}`);
      showToast('Admin deleted');
      setModal(null); loadAdmins(1); loadStats();
    } catch (e) { showToast(e.response?.data?.message || 'Delete failed', 'error'); }
    setSaving(false);
  };

  const handleResetPassword = async () => {
    if (!newPass || newPass.length < 6) return showToast('Password must be at least 6 characters', 'error');
    setSaving(true);
    try {
      await api.put(`/admin-management/${selected._id}/reset-password`, { newPassword: newPass });
      showToast('Password reset successfully');
      setModal(null);
    } catch (e) { showToast(e.response?.data?.message || 'Reset failed', 'error'); }
    setSaving(false);
  };

  const handleToggle = async a => {
    try {
      await api.put(`/admin-management/${a._id}/toggle-status`);
      showToast(`Admin ${a.isActive ? 'deactivated' : 'activated'}`);
      loadAdmins(); loadStats();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
  };

  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmtDT   = d => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div className="sa-page">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="sa-page-header">
        <div>
          <h4 className="sa-page-title"><i className="fas fa-shield-alt me-2"></i>Admin Management</h4>
          <p className="sa-page-subtitle">Create, edit and manage all administrator accounts</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <button className="sa-btn-primary" onClick={openCreate} disabled={stats && stats.nonSuperAdminCount >= 3} title={stats && stats.nonSuperAdminCount >= 3 ? 'Admin limit reached (max 3)' : ''}>
            <i className="fas fa-plus me-2"></i>Add Admin
          </button>
          {stats && stats.nonSuperAdminCount >= 3 && (
            <div style={{ fontSize: '0.72rem', color: '#f87171', marginTop: 4 }}>Limit reached (3/3)</div>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="sa-stats-grid mb-4">
          <div className="sa-stat-card">
            <div className="sa-stat-icon" style={{ background: '#0d6efd22', color: '#0d6efd' }}><i className="fas fa-users"></i></div>
            <div><div className="sa-stat-value">{stats.total}</div><div className="sa-stat-label">Total</div></div>
          </div>
          <div className="sa-stat-card">
            <div className="sa-stat-icon" style={{ background: '#19875422', color: '#198754' }}><i className="fas fa-user-check"></i></div>
            <div><div className="sa-stat-value">{stats.active}</div><div className="sa-stat-label">Active</div></div>
          </div>
          <div className="sa-stat-card">
            <div className="sa-stat-icon" style={{ background: '#dc354522', color: '#dc3545' }}><i className="fas fa-user-times"></i></div>
            <div><div className="sa-stat-value">{stats.inactive}</div><div className="sa-stat-label">Inactive</div></div>
          </div>
          <div className="sa-stat-card">
            <div className="sa-stat-icon" style={{ background: '#C9A84C22', color: '#C9A84C' }}><i className="fas fa-user-shield"></i></div>
            <div><div className="sa-stat-value">{stats.recentLogins?.filter(a => a.role === 'superadmin').length ?? 0}</div><div className="sa-stat-label">Super Admins</div></div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="sa-card mb-4">
        <div className="sa-card-body">
          <div className="row g-2">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text sa-input-icon"><i className="fas fa-search"></i></span>
                <input className="form-control sa-input" placeholder="Search name, email, username..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select sa-input" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                <option value="">All Roles</option>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select sa-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="col-md-2">
              <button className="btn sa-btn-outline w-100" onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); }}>
                <i className="fas fa-redo me-1"></i>Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="sa-card">
        <div className="sa-card-body p-0">
          <div className="d-flex align-items-center justify-content-between px-4 pt-3 pb-2">
            <span style={{ color: '#9ca3af', fontSize: '0.82rem' }}>{total} admin{total !== 1 ? 's' : ''} found</span>
          </div>
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border sa-spinner"></div></div>
          ) : (
            <div className="table-responsive">
              <table className="table sa-table mb-0">
                <thead>
                  <tr>
                    <th className="px-4">Admin</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Created</th>
                    <th className="px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-5" style={{ color: '#6c757d' }}>No admins found</td></tr>
                  ) : admins.map(a => (
                    <tr key={a._id}>
                      <td className="px-4">
                        <div className="d-flex align-items-center gap-2">
                          <div className="sa-table-avatar">{a.name.charAt(0).toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#111827' }}>{a.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>{a.email}</div>
                            {a.phone && <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>{a.phone}</div>}
                          </div>
                        </div>
                      </td>
                      <td><RoleBadge role={a.role} /></td>
                      <td>
                        <span style={{ background: a.isActive ? '#dcfce7' : '#fee2e2', color: a.isActive ? '#166534' : '#991b1b', padding: '3px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600 }}>
                          {a.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#374151' }}>
                        <div>{fmtDT(a.lastLogin)}</div>
                        {a.lastLoginIp && <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>{a.lastLoginIp}</div>}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#374151' }}>{fmtDate(a.createdAt)}</td>
                      <td className="px-4">
                        <div className="d-flex gap-1">
                          <button className="sa-action-btn sa-action-edit" title="Edit" onClick={() => openEdit(a)}><i className="fas fa-edit"></i></button>
                          <button className="sa-action-btn sa-action-key" title="Reset Password" onClick={() => openReset(a)}><i className="fas fa-key"></i></button>
                          <button className="sa-action-btn" title={a.isActive ? 'Deactivate' : 'Activate'}
                            style={{ background: a.isActive ? '#7f1d1d33' : '#06402a33', color: a.isActive ? '#f87171' : '#34d399', border: 'none' }}
                            onClick={() => handleToggle(a)}>
                            <i className={`fas fa-${a.isActive ? 'ban' : 'check'}`}></i>
                          </button>
                          {a.role !== 'superadmin' && (
                            <button className="sa-action-btn sa-action-delete" title="Delete" onClick={() => openDelete(a)}><i className="fas fa-trash"></i></button>
                          )}
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
              <button className="sa-btn-outline btn btn-sm" disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); loadAdmins(p); }}>
                <i className="fas fa-chevron-left"></i>
              </button>
              <span className="sa-btn-primary btn btn-sm px-3">{page} / {pages}</span>
              <button className="sa-btn-outline btn btn-sm" disabled={page >= pages} onClick={() => { const p = page + 1; setPage(p); loadAdmins(p); }}>
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content sa-modal">
              <div className="modal-header sa-modal-header">
                <h5 className="modal-title fw-bold">{modal === 'create' ? 'Add New Admin' : 'Edit Admin'}</h5>
                <button className="btn-close btn-close-white" onClick={() => setModal(null)}></button>
              </div>
              <div className="modal-body sa-modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="sa-label">Full Name *</label>
                    <input className="form-control sa-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full Name" />
                  </div>
                  <div className="col-md-6">
                    <label className="sa-label">Username</label>
                    <input className="form-control sa-input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="username" />
                  </div>
                  <div className="col-md-6">
                    <label className="sa-label">Email *</label>
                    <input className="form-control sa-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
                  </div>
                  <div className="col-md-6">
                    <label className="sa-label">Mobile Number</label>
                    <input className="form-control sa-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" />
                  </div>
                  {modal === 'create' && (
                    <div className="col-md-6">
                      <label className="sa-label">Password *</label>
                      <input className="form-control sa-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
                    </div>
                  )}
                  <div className="col-md-6">
                    <label className="sa-label">Role *</label>
                    <select className="form-select sa-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                      {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="sa-label">Status</label>
                    <select className="form-select sa-input" value={form.isActive ? 'active' : 'inactive'} onChange={e => setForm(f => ({ ...f, isActive: e.target.value === 'active' }))}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer sa-modal-footer">
                <button className="btn sa-btn-outline" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn sa-btn-primary" onClick={modal === 'create' ? handleCreate : handleUpdate} disabled={saving}>
                  {saving ? <><i className="fas fa-spinner fa-spin me-2"></i>Saving…</> : modal === 'create' ? 'Create Admin' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {modal === 'reset' && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
            <div className="modal-content sa-modal">
              <div className="modal-header sa-modal-header">
                <h5 className="modal-title fw-bold"><i className="fas fa-key me-2" style={{ color: '#C9A84C' }}></i>Reset Password</h5>
                <button className="btn-close btn-close-white" onClick={() => setModal(null)}></button>
              </div>
              <div className="modal-body sa-modal-body">
                <p style={{ color: '#9ca3af', fontSize: '0.88rem' }}>Resetting password for <strong style={{ color: '#e2e8f0' }}>{selected?.name}</strong> ({selected?.email})</p>
                <label className="sa-label">New Password *</label>
                <input className="form-control sa-input" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min 6 characters" />
              </div>
              <div className="modal-footer sa-modal-footer">
                <button className="btn sa-btn-outline" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn sa-btn-primary" onClick={handleResetPassword} disabled={saving}>
                  {saving ? 'Resetting…' : 'Reset Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {modal === 'delete' && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
            <div className="modal-content sa-modal">
              <div className="modal-header sa-modal-header border-0">
                <h5 className="modal-title fw-bold" style={{ color: '#f87171' }}><i className="fas fa-exclamation-triangle me-2"></i>Delete Admin</h5>
                <button className="btn-close btn-close-white" onClick={() => setModal(null)}></button>
              </div>
              <div className="modal-body sa-modal-body">
                <p style={{ color: '#9ca3af' }}>Are you sure you want to delete <strong style={{ color: '#e2e8f0' }}>{selected?.name}</strong>? This uses soft delete and can be audited.</p>
              </div>
              <div className="modal-footer sa-modal-footer border-0">
                <button className="btn sa-btn-outline" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn" style={{ background: '#dc3545', color: '#fff', fontWeight: 600 }} onClick={handleDelete} disabled={saving}>
                  {saving ? 'Deleting…' : 'Delete Admin'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
