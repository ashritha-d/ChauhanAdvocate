import { useEffect, useState } from 'react';
import { getServices, createService, updateService, deleteService } from '../api';
import ConfirmModal from '../components/ConfirmModal';

const ICONS = ['fas fa-gavel','fas fa-balance-scale','fas fa-users','fas fa-building','fas fa-home','fas fa-scroll','fas fa-briefcase','fas fa-file-contract','fas fa-handshake','fas fa-shield-alt'];
const EMPTY = { title:'', shortDescription:'', description:'', icon:'fas fa-balance-scale', features:[], isActive:true, isFeatured:false, order:0 };

export default function Services() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [featInput, setFeatInput] = useState('');

  const load = () => { setLoading(true); getServices().then(r => setItems(r.data.data || [])).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setEditing(null); setFeatInput(''); setError(''); setShowForm(true); };
  const openEdit = item => { setForm({ ...item, features: item.features || [] }); setEditing(item._id); setFeatInput(''); setError(''); setShowForm(true); };

  const addFeature = () => { if (featInput.trim()) { setForm(f => ({ ...f, features: [...(f.features||[]), featInput.trim()] })); setFeatInput(''); } };
  const removeFeature = i => setForm(f => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }));

  const handleSave = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editing) await updateService(editing, form);
      else await createService(form);
      setShowForm(false); load();
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteService(confirm); setConfirm(null); load(); } catch {}
    setDeleting(false);
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const toggle = k => () => setForm(f => ({ ...f, [k]: !f[k] }));

  return (
    <div>
      <div className="page-card">
        <div className="page-card-header">
          <h6 className="mb-0 fw-bold">Services ({items.length})</h6>
          <button className="btn btn-gold btn-sm" onClick={openCreate}><i className="fas fa-plus me-1"></i>Add Service</button>
        </div>
        <div className="table-responsive">
          <table className="table admin-table">
            <thead><tr><th>Icon</th><th>Title</th><th>Featured</th><th>Status</th><th>Order</th><th>Actions</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan="6" className="text-center py-4"><div className="spinner-border spinner-border-sm"></div></td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan="6" className="text-center text-muted py-4">No services yet</td></tr>}
              {items.map(item => (
                <tr key={item._id}>
                  <td><i className={`${item.icon} text-gold fa-lg`}></i></td>
                  <td><div className="fw-semibold">{item.title}</div><small className="text-muted">{item.shortDescription?.substring(0,60)}...</small></td>
                  <td>{item.isFeatured ? <span className="badge bg-warning text-dark">Featured</span> : <span className="text-muted">—</span>}</td>
                  <td><span className={`status-badge ${item.isActive ? 'badge-active' : 'badge-inactive'}`}>{item.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>{item.order}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(item)}><i className="fas fa-edit"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => setConfirm(item._id)}><i className="fas fa-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editing ? 'Edit' : 'Add'} Service</h5>
                <button className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2">{error}</div>}
                  <div className="row g-3">
                    <div className="col-md-8">
                      <label className="form-label">Title *</label>
                      <input className="form-control" value={form.title} onChange={set('title')} required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Order</label>
                      <input type="number" className="form-control" value={form.order} onChange={set('order')} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Icon Class</label>
                      <div className="d-flex gap-2 flex-wrap mb-2">
                        {ICONS.map(ic => (
                          <button type="button" key={ic} className={`btn btn-sm ${form.icon===ic ? 'btn-gold' : 'btn-outline-secondary'}`} onClick={() => setForm(f => ({ ...f, icon:ic }))}>
                            <i className={ic}></i>
                          </button>
                        ))}
                      </div>
                      <input className="form-control form-control-sm" value={form.icon} onChange={set('icon')} placeholder="fas fa-balance-scale" />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Short Description</label>
                      <input className="form-control" value={form.shortDescription} onChange={set('shortDescription')} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Full Description *</label>
                      <textarea className="form-control" rows="3" value={form.description} onChange={set('description')} required></textarea>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Features</label>
                      <div className="d-flex gap-2 mb-2">
                        <input className="form-control" value={featInput} onChange={e => setFeatInput(e.target.value)} placeholder="Add a feature..." onKeyDown={e => { if(e.key==='Enter'){e.preventDefault();addFeature();} }} />
                        <button type="button" className="btn btn-outline-secondary" onClick={addFeature}><i className="fas fa-plus"></i></button>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        {(form.features||[]).map((f, i) => (
                          <span key={i} className="badge bg-light text-dark border d-flex align-items-center gap-1">
                            {f} <button type="button" className="btn-close btn-close-sm" style={{fontSize:'.5rem'}} onClick={() => removeFeature(i)}></button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" checked={form.isActive} onChange={toggle('isActive')} />
                        <label className="form-check-label">Active</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" checked={form.isFeatured} onChange={toggle('isFeatured')} />
                        <label className="form-check-label">Featured</label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-gold" disabled={saving}>
                    {saving ? <i className="fas fa-spinner fa-spin me-1"></i> : null}{saving ? 'Saving...' : 'Save Service'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal show={!!confirm} title="Delete Service" message="Are you sure you want to delete this service? This cannot be undone." onConfirm={handleDelete} onCancel={() => setConfirm(null)} loading={deleting} />
    </div>
  );
}
