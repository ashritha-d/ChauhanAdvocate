import { useEffect, useState } from 'react';
import api from '../api/axios';

const STATUS_META = {
  pending:     { color: '#fbbf24', label: 'Pending' },
  confirmed:   { color: '#34d399', label: 'Confirmed' },
  rescheduled: { color: '#60a5fa', label: 'Rescheduled' },
  completed:   { color: '#9ca3af', label: 'Completed' },
  cancelled:   { color: '#f87171', label: 'Cancelled' },
};

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: type === 'error' ? '#dc3545' : '#198754', color: '#fff', padding: '12px 20px', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', minWidth: 260, display: 'flex', alignItems: 'center', gap: 10 }}>
      <i className={type === 'error' ? 'fas fa-times-circle' : 'fas fa-check-circle'}></i>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>&times;</button>
    </div>
  );
}

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatus] = useState('');
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [total, setTotal]       = useState(0);
  const [stats, setStats]       = useState(null);
  const [modal, setModal]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm]         = useState({ status: '', adminNotes: '' });
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const load = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 15 });
      if (search)       params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const r = await api.get(`/appointments?${params}`);
      setAppointments(r.data.data || r.data.appointments || []);
      setTotal(r.data.total || 0);
      setPages(r.data.pages || 1);
    } catch { showToast('Failed to load', 'error'); }
    setLoading(false);
  };

  useEffect(() => {
    api.get('/appointments/stats').then(r => setStats(r.data.data || r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(1); setPage(1); }, [search, statusFilter]);

  const openEdit = a => { setSelected(a); setForm({ status: a.status, adminNotes: a.adminNotes || '' }); setModal('edit'); };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await api.put(`/appointments/${selected._id}`, form);
      showToast('Appointment updated');
      setModal(null); load();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/appointments/${selected._id}`);
      showToast('Appointment deleted');
      setModal(null); load(1);
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    setSaving(false);
  };

  const quickAction = async (a, status) => {
    try {
      await api.put(`/appointments/${a._id}`, { status });
      showToast(`Appointment ${status}`);
      load();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
  };

  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="sa-page">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="sa-page-header">
        <div>
          <h4 className="sa-page-title"><i className="fas fa-calendar-alt me-2"></i>Appointments</h4>
          <p className="sa-page-subtitle">Manage all appointment bookings</p>
        </div>
        <span className="sa-badge-count">{total} total</span>
      </div>

      {/* Stats */}
      {stats && (
        <div className="sa-stats-grid mb-4">
          {['pending','confirmed','completed','cancelled'].map(s => (
            <div key={s} className="sa-stat-card">
              <div className="sa-stat-icon" style={{ background: STATUS_META[s]?.color + '22', color: STATUS_META[s]?.color }}>
                <i className="fas fa-calendar-check"></i>
              </div>
              <div>
                <div className="sa-stat-value">{stats[s] || 0}</div>
                <div className="sa-stat-label">{STATUS_META[s]?.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="sa-card mb-4">
        <div className="sa-card-body">
          <div className="row g-2">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text sa-input-icon"><i className="fas fa-search"></i></span>
                <input className="form-control sa-input" placeholder="Search name, email, service..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-md-4">
              <select className="form-select sa-input" value={statusFilter} onChange={e => setStatus(e.target.value)}>
                <option value="">All Status</option>
                {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <button className="btn sa-btn-outline w-100" onClick={() => { setSearch(''); setStatus(''); }}>
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
                    <th className="px-4">Client</th>
                    <th>Service</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th className="px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-5" style={{ color: '#6c757d' }}>No appointments found</td></tr>
                  ) : appointments.map(a => {
                    const sm = STATUS_META[a.status] || { color: '#9ca3af', label: a.status };
                    return (
                      <tr key={a._id}>
                        <td className="px-4">
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#111827' }}>{a.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>{a.email}</div>
                          <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>{a.phone}</div>
                        </td>
                        <td style={{ fontSize: '0.83rem', color: '#374151', maxWidth: 140 }}>{a.service}</td>
                        <td style={{ fontSize: '0.8rem', color: '#374151' }}>
                          <div>{fmtDate(a.date)}</div>
                          <div>{a.time}</div>
                        </td>
                        <td>
                          <span style={{ background: sm.color + '22', color: sm.color, padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600 }}>
                            {sm.label}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: a.paymentStatus === 'paid' ? '#34d399' : '#fbbf24' }}>
                            {a.paymentStatus || 'unpaid'}
                          </span>
                        </td>
                        <td className="px-4">
                          <div className="d-flex gap-1 flex-wrap">
                            {a.status === 'pending' && (
                              <button className="sa-action-btn" style={{ background: '#065f4633', color: '#34d399', border: 'none' }} title="Confirm" onClick={() => quickAction(a, 'confirmed')}>
                                <i className="fas fa-check"></i>
                              </button>
                            )}
                            {(a.status === 'pending' || a.status === 'confirmed') && (
                              <button className="sa-action-btn" style={{ background: '#7f1d1d33', color: '#f87171', border: 'none' }} title="Cancel" onClick={() => quickAction(a, 'cancelled')}>
                                <i className="fas fa-times"></i>
                              </button>
                            )}
                            <button className="sa-action-btn sa-action-edit" title="Edit" onClick={() => openEdit(a)}>
                              <i className="fas fa-edit"></i>
                            </button>
                            <button className="sa-action-btn sa-action-delete" title="Delete" onClick={() => { setSelected(a); setModal('delete'); }}>
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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

      {/* Edit modal */}
      {modal === 'edit' && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 460 }}>
            <div className="modal-content sa-modal">
              <div className="modal-header sa-modal-header">
                <h5 className="modal-title fw-bold"><i className="fas fa-edit me-2" style={{ color: '#C9A84C' }}></i>Update Appointment</h5>
                <button className="btn-close btn-close-white" onClick={() => setModal(null)}></button>
              </div>
              <div className="modal-body sa-modal-body">
                <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{selected?.name} — {selected?.service}</p>
                <label className="sa-label mt-2">Status</label>
                <select className="form-select sa-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <label className="sa-label mt-3">Admin Notes</label>
                <textarea className="form-control sa-input" rows={3} value={form.adminNotes} onChange={e => setForm(f => ({ ...f, adminNotes: e.target.value }))} placeholder="Optional notes..."></textarea>
              </div>
              <div className="modal-footer sa-modal-footer">
                <button className="btn sa-btn-outline" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn sa-btn-primary" onClick={handleUpdate} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {modal === 'delete' && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
            <div className="modal-content sa-modal">
              <div className="modal-header sa-modal-header border-0">
                <h5 className="modal-title fw-bold" style={{ color: '#f87171' }}><i className="fas fa-exclamation-triangle me-2"></i>Delete Appointment</h5>
                <button className="btn-close btn-close-white" onClick={() => setModal(null)}></button>
              </div>
              <div className="modal-body sa-modal-body">
                <p style={{ color: '#9ca3af' }}>Delete appointment for <strong style={{ color: '#e2e8f0' }}>{selected?.name}</strong>?</p>
              </div>
              <div className="modal-footer sa-modal-footer border-0">
                <button className="btn sa-btn-outline" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn" style={{ background: '#dc3545', color: '#fff', fontWeight: 600 }} onClick={handleDelete} disabled={saving}>
                  {saving ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
