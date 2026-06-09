import { useEffect, useState } from 'react';
import { getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } from '../api';
import ImageUpload from '../components/ImageUpload';
import ConfirmModal from '../components/ConfirmModal';

const EMPTY = { name:'', designation:'', rating:5, message:'', avatar:'', isApproved:true, isFeatured:false };

export default function Testimonials() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    getTestimonials().then(r => { const data = r.data.data || []; console.log('Loaded Testimonials:', data); setItems(data); }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setEditing(null); setError(''); setShowForm(true); };
  const openEdit = item => { setForm({ ...item }); setEditing(item._id); setError(''); setShowForm(true); };

  const handleSave = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editing) await updateTestimonial(editing, form);
      else await createTestimonial(form);
      setShowForm(false); load();
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteTestimonial(confirm); setConfirm(null); load(); } catch {}
    setDeleting(false);
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target?.value ?? e }));
  const toggle = k => () => setForm(f => ({ ...f, [k]: !f[k] }));

  return (
    <div>
      <div className="page-card">
        <div className="page-card-header">
          <h6 className="mb-0 fw-bold">Testimonials ({items.length})</h6>
          <button className="btn btn-gold btn-sm" onClick={openCreate}><i className="fas fa-plus me-1"></i>Add Testimonial</button>
        </div>
        <div className="table-responsive">
          <table className="table admin-table">
            <thead><tr><th>Client</th><th>Rating</th><th>Message</th><th>Approved</th><th>Featured</th><th>Actions</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan="6" className="text-center py-4"><div className="spinner-border spinner-border-sm"></div></td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan="6" className="text-center text-muted py-4">No existing data found.</td></tr>}
              {items.map(item => (
                <tr key={item._id}>
                  <td><div className="fw-semibold">{item.name}</div><small className="text-muted">{item.designation}</small></td>
                  <td>{'★'.repeat(item.rating || 5)}</td>
                  <td><small>{item.message?.substring(0,80)}...</small></td>
                  <td><span className={`status-badge ${item.isApproved ? 'badge-active' : 'badge-inactive'}`}>{item.isApproved ? 'Yes' : 'No'}</span></td>
                  <td>{item.isFeatured ? <span className="badge bg-warning text-dark">Yes</span> : '—'}</td>
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
          <div className="modal-dialog modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editing ? 'Edit' : 'Add'} Testimonial</h5>
                <button className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2">{error}</div>}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Client Name *</label>
                      <input className="form-control" value={form.name} onChange={set('name')} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Designation</label>
                      <input className="form-control" value={form.designation} onChange={set('designation')} placeholder="e.g. Business Owner" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Rating</label>
                      <select className="form-select" value={form.rating} onChange={set('rating')}>
                        {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars {'★'.repeat(r)}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Testimonial Message *</label>
                      <textarea className="form-control" rows="4" value={form.message} onChange={set('message')} required></textarea>
                    </div>
                    <div className="col-12">
                      <ImageUpload label="Client Photo (optional)" value={form.avatar} onChange={v => setForm(f => ({ ...f, avatar: v }))} />
                    </div>
                    <div className="col-md-6">
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" checked={form.isApproved} onChange={toggle('isApproved')} />
                        <label className="form-check-label">Approved (visible on website)</label>
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
                    {saving ? <><i className="fas fa-spinner fa-spin me-1"></i>Saving...</> : 'Save Testimonial'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal show={!!confirm} title="Delete Testimonial" message="Delete this testimonial?" onConfirm={handleDelete} onCancel={() => setConfirm(null)} loading={deleting} />
    </div>
  );
}
