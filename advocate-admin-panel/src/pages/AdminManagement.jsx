import { useEffect, useState } from 'react';
import api from '../api/axios';

const ROLES = ['admin', 'editor', 'content_manager', 'support', 'superadmin'];
const ROLE_LABELS = { superadmin: 'Super Admin', admin: 'Admin', editor: 'Editor', content_manager: 'Content Manager', support: 'Support' };
const ROLE_COLORS = { superadmin: '#dc3545', admin: '#0d6efd', editor: '#198754', content_manager: '#fd7e14', support: '#6f42c1' };

function RoleBadge({ role }) {
  return (
    <span style={{ background: ROLE_COLORS[role] || '#6c757d', color: '#fff', padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600 }}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '18px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className={icon} style={{ color, fontSize: '1.3rem' }}></i>
      </div>
      <div>
        <div style={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.78rem', color: '#6c757d', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: type === 'error' ? '#dc3545' : '#198754', color: '#fff', padding: '12px 20px', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', minWidth: 260, display: 'flex', alignItems: 'center', gap: 10 }}>
      <i className={type === 'error' ? 'fas fa-times-circle' : 'fas fa-check-circle'}></i>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>&times;</button>
    </div>
  );
}

const emptyForm = { name: '', username: '', email: '', phone: '', password: '', role: 'admin', isActive: true };

export default function AdminManagement() {
  const [admins, setAdmins]       = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]           = useState(1);
  const [pages, setPages]         = useState(1);
  const [total, setTotal]         = useState(0);
  const [modal, setModal]         = useState(null); // null | 'create' | 'edit' | 'delete' | 'reset'
  const [selected, setSelected]   = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [newPass, setNewPass]     = useState('');
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);

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

  const openCreate = () => { setForm(emptyForm); setModal('create'); };
  const openEdit   = (a) => { setSelected(a); setForm({ name: a.name, username: a.username || '', email: a.email, phone: a.phone || '', password: '', role: a.role, isActive: a.isActive }); setModal('edit'); };
  const openDelete = (a) => { setSelected(a); setModal('delete'); };
  const openReset  = (a) => { setSelected(a); setNewPass(''); setModal('reset'); };

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
      showToast('Admin deleted successfully');
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

  const handleToggle = async (a) => {
    try {
      await api.put(`/admin-management/${a._id}/toggle-status`);
      showToast(`Admin ${a.isActive ? 'deactivated' : 'activated'}`);
      loadAdmins(); loadStats();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div style={{ padding: '0 0 40px' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="mb-0 fw-bold"><i className="fas fa-shield-alt me-2" style={{ color: '#C9A84C' }}></i>Admin Management</h4>
          <p className="text-muted small mb-0">Manage all administrator accounts</p>
        </div>
        <button className="btn btn-warning fw-semibold" onClick={openCreate}>
          <i className="fas fa-plus me-2"></i>Add Admin
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3"><StatCard icon="fas fa-users" label="Total Admins" value={stats.total} color="#0d6efd" /></div>
          <div className="col-6 col-md-3"><StatCard icon="fas fa-user-check" label="Active" value={stats.active} color="#198754" /></div>
          <div className="col-6 col-md-3"><StatCard icon="fas fa-user-times" label="Inactive" value={stats.inactive} color="#dc3545" /></div>
          <div className="col-6 col-md-3"><StatCard icon="fas fa-clock" label="Last Login" value={stats.recentLogins?.[0] ? fmtDate(stats.recentLogins[0].lastLogin) : '—'} color="#fd7e14" /></div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-4" style={{ border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text"><i className="fas fa-search"></i></span>
                <input className="form-control" placeholder="Search name, email, username..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                <option value="">All Roles</option>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="col-md-2">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); }}>
                <i className="fas fa-redo me-1"></i>Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="card-body p-0">
          <div className="d-flex align-items-center justify-content-between px-4 pt-3 pb-2">
            <span className="text-muted small">{total} admin{total !== 1 ? 's' : ''} found</span>
          </div>
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-warning"></div></div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ background: '#f8f9fa' }}>
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
                    <tr><td colSpan={6} className="text-center text-muted py-5">No admins found</td></tr>
                  ) : admins.map(a => (
                    <tr key={a._id}>
                      <td className="px-4">
                        <div className="d-flex align-items-center gap-2">
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#C9A84C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                            {a.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-semibold" style={{ fontSize: '0.88rem' }}>{a.name}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{a.email}</div>
                            {a.phone && <div className="text-muted" style={{ fontSize: '0.72rem' }}>{a.phone}</div>}
                          </div>
                        </div>
                      </td>
                      <td><RoleBadge role={a.role} /></td>
                      <td>
                        <span style={{ background: a.isActive ? '#d1fae5' : '#fee2e2', color: a.isActive ? '#065f46' : '#991b1b', padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600 }}>
                          {a.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                        <div>{fmtDateTime(a.lastLogin)}</div>
                        {a.lastLoginIp && <div style={{ fontSize: '0.7rem' }}>{a.lastLoginIp}</div>}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#6c757d' }}>{fmtDate(a.createdAt)}</td>
                      <td className="px-4">
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-outline-primary" title="Edit" onClick={() => openEdit(a)}><i className="fas fa-edit"></i></button>
                          <button className="btn btn-sm btn-outline-warning" title="Reset Password" onClick={() => openReset(a)}><i className="fas fa-key"></i></button>
                          <button className="btn btn-sm" title={a.isActive ? 'Deactivate' : 'Activate'} style={{ background: a.isActive ? '#fee2e2' : '#d1fae5', border: 'none', color: a.isActive ? '#991b1b' : '#065f46' }} onClick={() => handleToggle(a)}>
                            <i className={`fas fa-${a.isActive ? 'ban' : 'check'}`}></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger" title="Delete" onClick={() => openDelete(a)}><i className="fas fa-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="d-flex justify-content-center py-3 gap-2">
              <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => { setPage(p => p - 1); loadAdmins(page - 1); }}>
                <i className="fas fa-chevron-left"></i>
              </button>
              <span className="btn btn-sm btn-warning">{page} / {pages}</span>
              <button className="btn btn-sm btn-outline-secondary" disabled={page >= pages} onClick={() => { setPage(p => p + 1); loadAdmins(page + 1); }}>
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── CREATE / EDIT MODAL ── */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">{modal === 'create' ? 'Add New Admin' : 'Edit Admin'}</h5>
                <button className="btn-close" onClick={() => setModal(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Full Name *</label>
                    <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full Name" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Username</label>
                    <input className="form-control" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="username" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Email *</label>
                    <input className="form-control" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Mobile Number</label>
                    <input className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" />
                  </div>
                  {modal === 'create' && (
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Password *</label>
                      <input className="form-control" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
                    </div>
                  )}
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Role *</label>
                    <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                      {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Status</label>
                    <select className="form-select" value={form.isActive ? 'active' : 'inactive'} onChange={e => setForm(f => ({ ...f, isActive: e.target.value === 'active' }))}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn btn-warning fw-semibold" onClick={modal === 'create' ? handleCreate : handleUpdate} disabled={saving}>
                  {saving ? <><i className="fas fa-spinner fa-spin me-2"></i>Saving…</> : modal === 'create' ? 'Create Admin' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RESET PASSWORD MODAL ── */}
      {modal === 'reset' && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold"><i className="fas fa-key me-2 text-warning"></i>Reset Password</h5>
                <button className="btn-close" onClick={() => setModal(null)}></button>
              </div>
              <div className="modal-body">
                <p className="text-muted small">Resetting password for <strong>{selected?.name}</strong> ({selected?.email})</p>
                <label className="form-label small fw-semibold">New Password *</label>
                <input className="form-control" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min 6 characters" />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn btn-warning fw-semibold" onClick={handleResetPassword} disabled={saving}>
                  {saving ? 'Resetting…' : 'Reset Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {modal === 'delete' && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold text-danger"><i className="fas fa-exclamation-triangle me-2"></i>Delete Admin</h5>
                <button className="btn-close" onClick={() => setModal(null)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete <strong>{selected?.name}</strong>? This action uses soft delete and can be audited.</p>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn btn-danger fw-semibold" onClick={handleDelete} disabled={saving}>
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
