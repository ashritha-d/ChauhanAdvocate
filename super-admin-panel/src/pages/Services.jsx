import { useEffect, useState } from 'react';
import usePolling from '../hooks/usePolling';
import api from '../api/axios';

const ICONS = [
  'fas fa-gavel','fas fa-balance-scale','fas fa-users','fas fa-building',
  'fas fa-home','fas fa-scroll','fas fa-briefcase','fas fa-file-contract',
  'fas fa-handshake','fas fa-shield-alt','fas fa-university','fas fa-pen-nib',
];

const EMPTY = { title: '', shortDescription: '', description: '', icon: 'fas fa-balance-scale', features: [], isActive: true, isFeatured: false, order: 0 };

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

export default function Services() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState(EMPTY);
  const [editing, setEditing]   = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [modal, setModal]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [featInput, setFeatInput] = useState('');
  const [toast, setToast]       = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/services');
      setItems(r.data.data || []);
    } catch { showToast('Failed to load services', 'error'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  usePolling(load, 30000);

  const openCreate = () => { setForm(EMPTY); setEditing(null); setFeatInput(''); setError(''); setShowForm(true); };
  const openEdit   = item => { setForm({ ...item, features: item.features || [] }); setEditing(item._id); setFeatInput(''); setError(''); setShowForm(true); };

  const addFeature = () => {
    if (featInput.trim()) {
      setForm(f => ({ ...f, features: [...(f.features || []), featInput.trim()] }));
      setFeatInput('');
    }
  };
  const removeFeature = i => setForm(f => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }));

  const handleSave = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editing) await api.put(`/services/${editing}`, form);
      else         await api.post('/services', form);
      setShowForm(false);
      showToast(editing ? 'Service updated!' : 'Service created!');
      load();
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    setSaving(false);
  };

  const handleToggle = async (item) => {
    try {
      await api.put(`/services/${item._id}`, { ...item, isActive: !item.isActive });
      showToast(`Service ${item.isActive ? 'disabled' : 'enabled'}`);
      load();
    } catch { showToast('Failed to update status', 'error'); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/services/${selected._id}`);
      showToast('Service deleted');
      setModal(null); load();
    } catch (err) { showToast(err.response?.data?.message || 'Delete failed', 'error'); }
    setDeleting(false);
  };

  const set   = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const toggle = k => () => setForm(f => ({ ...f, [k]: !f[k] }));

  return (
    <div className="sa-page">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="sa-page-header">
        <div>
          <h4 className="sa-page-title"><i className="fas fa-briefcase me-2"></i>Services</h4>
          <p className="sa-page-subtitle">Manage legal services shown on the website</p>
        </div>
        <button className="btn sa-btn-primary" onClick={openCreate}>
          <i className="fas fa-plus me-1"></i>Add Service
        </button>
      </div>

      {/* Table */}
      <div className="sa-card">
        <div className="sa-card-header">
          <span>All Services <span style={{ color: '#6b7280', fontWeight: 400, fontSize: '0.8rem' }}>({items.length})</span></span>
        </div>
        <div className="sa-card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border sa-spinner"></div></div>
          ) : (
            <div className="table-responsive">
              <table className="table sa-table mb-0">
                <thead>
                  <tr>
                    <th className="px-4">Icon</th>
                    <th>Title</th>
                    <th>Featured</th>
                    <th>Status</th>
                    <th>Order</th>
                    <th className="px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-5" style={{ color: '#6b7280' }}>No services yet. Click "Add Service" to create one.</td></tr>
                  ) : items.map(item => (
                    <tr key={item._id}>
                      <td className="px-4">
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: '#C9A84C20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className={`${item.icon}`} style={{ color: '#C9A84C', fontSize: '1rem' }}></i>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#e2e8f0' }}>{item.title}</div>
                        <div style={{ fontSize: '0.74rem', color: '#6b7280' }}>{item.shortDescription?.slice(0, 60)}{item.shortDescription?.length > 60 ? '…' : ''}</div>
                      </td>
                      <td>
                        {item.isFeatured
                          ? <span style={{ background: '#C9A84C20', color: '#C9A84C', border: '1px solid #C9A84C40', padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700 }}>Featured</span>
                          : <span style={{ color: '#4a5568' }}>—</span>}
                      </td>
                      <td>
                        <span style={{
                          background: item.isActive ? '#065f4620' : '#991b1b20',
                          color: item.isActive ? '#34d399' : '#f87171',
                          border: `1px solid ${item.isActive ? '#34d39940' : '#f8717140'}`,
                          padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
                        }}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{item.order}</td>
                      <td className="px-4">
                        <div className="d-flex gap-1">
                          <button className="sa-action-btn sa-action-edit" title="Edit" onClick={() => openEdit(item)}>
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="sa-action-btn"
                            title={item.isActive ? 'Disable' : 'Enable'}
                            style={{ background: item.isActive ? '#7f1d1d33' : '#06402a33', color: item.isActive ? '#f87171' : '#34d399', border: 'none' }}
                            onClick={() => handleToggle(item)}
                          >
                            <i className={`fas fa-${item.isActive ? 'ban' : 'check'}`}></i>
                          </button>
                          <button className="sa-action-btn sa-action-delete" title="Delete" onClick={() => { setSelected(item); setModal('delete'); }}>
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
        </div>
      </div>

      {/* Create / Edit modal */}
      {showForm && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content sa-modal">
              <div className="modal-header sa-modal-header">
                <h5 className="modal-title fw-bold">
                  <i className="fas fa-briefcase me-2" style={{ color: '#C9A84C' }}></i>
                  {editing ? 'Edit Service' : 'Add Service'}
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setShowForm(false)}></button>
              </div>
              <form id="service-form" onSubmit={handleSave}>
                <div className="modal-body sa-modal-body">
                  {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}
                  <div className="row g-3">
                    <div className="col-md-8">
                      <label className="sa-label">Title *</label>
                      <input className="form-control sa-input" value={form.title} onChange={set('title')} required placeholder="e.g. Criminal Defense" />
                    </div>
                    <div className="col-md-4">
                      <label className="sa-label">Order</label>
                      <input type="number" className="form-control sa-input" value={form.order} onChange={set('order')} min={0} />
                    </div>

                    <div className="col-12">
                      <label className="sa-label">Icon</label>
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        {ICONS.map(ic => (
                          <button type="button" key={ic}
                            style={{
                              width: 38, height: 38, borderRadius: 8, border: `2px solid ${form.icon === ic ? '#C9A84C' : '#2d3748'}`,
                              background: form.icon === ic ? '#C9A84C20' : '#1a2030', color: form.icon === ic ? '#C9A84C' : '#9ca3af', cursor: 'pointer',
                            }}
                            onClick={() => setForm(f => ({ ...f, icon: ic }))}
                            title={ic}
                          >
                            <i className={ic}></i>
                          </button>
                        ))}
                      </div>
                      <input className="form-control sa-input" value={form.icon} onChange={set('icon')} placeholder="fas fa-balance-scale" />
                    </div>

                    <div className="col-12">
                      <label className="sa-label">Short Description</label>
                      <input className="form-control sa-input" value={form.shortDescription} onChange={set('shortDescription')} placeholder="One-line summary shown in listings" />
                    </div>

                    <div className="col-12">
                      <label className="sa-label">Full Description *</label>
                      <textarea className="form-control sa-input" rows={3} value={form.description} onChange={set('description')} required placeholder="Detailed description of the service..."></textarea>
                    </div>

                    <div className="col-12">
                      <label className="sa-label">Features</label>
                      <div className="d-flex gap-2 mb-2">
                        <input
                          className="form-control sa-input"
                          value={featInput}
                          onChange={e => setFeatInput(e.target.value)}
                          placeholder="Add a feature point and press Enter…"
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                        />
                        <button type="button" className="btn sa-btn-outline px-3" onClick={addFeature}>
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        {(form.features || []).map((f, i) => (
                          <span key={i} style={{ background: '#1e2a3a', border: '1px solid #2d3748', color: '#e2e8f0', padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {f}
                            <button type="button" onClick={() => removeFeature(i)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', lineHeight: 1, padding: 0, fontSize: '0.9rem' }}>&times;</button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="d-flex align-items-center gap-3">
                        <div className="form-check form-switch mb-0">
                          <input className="form-check-input" type="checkbox" checked={form.isActive} onChange={toggle('isActive')} id="chk-active" />
                          <label className="form-check-label sa-label mb-0" htmlFor="chk-active">Active</label>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex align-items-center gap-3">
                        <div className="form-check form-switch mb-0">
                          <input className="form-check-input" type="checkbox" checked={form.isFeatured} onChange={toggle('isFeatured')} id="chk-featured" />
                          <label className="form-check-label sa-label mb-0" htmlFor="chk-featured">Featured</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
                <div className="modal-footer sa-modal-footer">
                  <button type="button" className="btn sa-btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" form="service-form" className="btn sa-btn-primary" disabled={saving}>
                    {saving ? <><i className="fas fa-spinner fa-spin me-1"></i>Saving…</> : (editing ? 'Update Service' : 'Create Service')}
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {modal === 'delete' && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
            <div className="modal-content sa-modal">
              <div className="modal-header sa-modal-header border-0">
                <h5 className="modal-title fw-bold" style={{ color: '#f87171' }}>
                  <i className="fas fa-exclamation-triangle me-2"></i>Delete Service
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setModal(null)}></button>
              </div>
              <div className="modal-body sa-modal-body">
                <p style={{ color: '#9ca3af' }}>
                  Are you sure you want to permanently delete <strong style={{ color: '#e2e8f0' }}>{selected?.title}</strong>?
                  This cannot be undone.
                </p>
              </div>
              <div className="modal-footer sa-modal-footer border-0">
                <button className="btn sa-btn-outline" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn" style={{ background: '#dc3545', color: '#fff', fontWeight: 600 }} onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting…' : 'Delete Service'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
