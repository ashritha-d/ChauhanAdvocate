import { useEffect, useState } from 'react';
import { getHeroBanners, createHeroBanner, updateHeroBanner, deleteHeroBanner } from '../api';
import ImageUpload from '../components/ImageUpload';
import ConfirmModal from '../components/ConfirmModal';

const EMPTY = { title:'', subtitle:'', badgeText:'', image:'', primaryBtnText:'Book Free Consultation', primaryBtnLink:'#appointment', secondaryBtnText:'Our Services', secondaryBtnLink:'#services', isActive:true, order:0 };

export default function HeroBanners() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => { setLoading(true); getHeroBanners().then(r => setItems(r.data.data||[])).catch(()=>{}).finally(()=>setLoading(false)); };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setEditing(null); setError(''); setShowForm(true); };
  const openEdit = item => { setForm({ ...item }); setEditing(item._id); setError(''); setShowForm(true); };

  const handleSave = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editing) await updateHeroBanner(editing, form);
      else await createHeroBanner(form);
      setShowForm(false); load();
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteHeroBanner(confirm); setConfirm(null); load(); } catch {}
    setDeleting(false);
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target?.value ?? e }));
  const toggle = k => () => setForm(f => ({ ...f, [k]: !f[k] }));

  return (
    <div>
      <div className="page-card">
        <div className="page-card-header">
          <h6 className="mb-0 fw-bold">Hero Banners ({items.length})</h6>
          <button className="btn btn-gold btn-sm" onClick={openCreate}><i className="fas fa-plus me-1"></i>Add Banner</button>
        </div>
        <div className="table-responsive">
          <table className="table admin-table">
            <thead><tr><th>Title</th><th>Subtitle</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan="5" className="text-center py-4"><div className="spinner-border spinner-border-sm"></div></td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan="5" className="text-center text-muted py-4">No banners yet. Add your first hero banner.</td></tr>}
              {items.map(item => (
                <tr key={item._id}>
                  <td className="fw-semibold">{item.title}</td>
                  <td><small className="text-muted">{item.subtitle?.substring(0,60)}</small></td>
                  <td>{item.order}</td>
                  <td><span className={`status-badge ${item.isActive ? 'badge-active':'badge-inactive'}`}>{item.isActive?'Active':'Inactive'}</span></td>
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
                <h5 className="modal-title">{editing ? 'Edit' : 'Add'} Hero Banner</h5>
                <button className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2">{error}</div>}
                  <div className="row g-3">
                    <div className="col-md-8">
                      <label className="form-label">Title *</label>
                      <input className="form-control" value={form.title} onChange={set('title')} placeholder="Your Trusted Legal Partner" required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Order</label>
                      <input type="number" className="form-control" value={form.order} onChange={set('order')} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Subtitle</label>
                      <textarea className="form-control" rows="2" value={form.subtitle} onChange={set('subtitle')} placeholder="Brief description..."></textarea>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Badge Text</label>
                      <input className="form-control" value={form.badgeText} onChange={set('badgeText')} placeholder="e.g. Trusted Legal Partner Since 2009" />
                    </div>
                    <div className="col-12">
                      <ImageUpload label="Banner Background Image" value={form.image} onChange={set('image')} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Primary Button Text</label>
                      <input className="form-control" value={form.primaryBtnText} onChange={set('primaryBtnText')} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Primary Button Link</label>
                      <input className="form-control" value={form.primaryBtnLink} onChange={set('primaryBtnLink')} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Secondary Button Text</label>
                      <input className="form-control" value={form.secondaryBtnText} onChange={set('secondaryBtnText')} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Secondary Button Link</label>
                      <input className="form-control" value={form.secondaryBtnLink} onChange={set('secondaryBtnLink')} />
                    </div>
                    <div className="col-12">
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" checked={form.isActive} onChange={toggle('isActive')} />
                        <label className="form-check-label">Active (visible on website)</label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-gold" disabled={saving}>
                    {saving ? <><i className="fas fa-spinner fa-spin me-1"></i>Saving...</> : 'Save Banner'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal show={!!confirm} title="Delete Banner" message="Delete this hero banner?" onConfirm={handleDelete} onCancel={() => setConfirm(null)} loading={deleting} />
    </div>
  );
}
