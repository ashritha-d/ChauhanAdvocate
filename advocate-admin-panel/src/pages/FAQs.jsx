import { useEffect, useState } from 'react';
import { getFAQs, createFAQ, updateFAQ, deleteFAQ } from '../api';
import ConfirmModal from '../components/ConfirmModal';

const CATS = ['General','Process','Fees','Criminal','Civil','Family','Corporate'];
const EMPTY = { question:'', answer:'', category:'General', order:0, isActive:true };

export default function FAQs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => { setLoading(true); getFAQs().then(r => setItems(r.data.data || [])).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setEditing(null); setError(''); setShowForm(true); };
  const openEdit = item => { setForm({ ...item }); setEditing(item._id); setError(''); setShowForm(true); };

  const handleSave = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editing) await updateFAQ(editing, form);
      else await createFAQ(form);
      setShowForm(false); load();
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteFAQ(confirm); setConfirm(null); load(); } catch {}
    setDeleting(false);
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const toggle = k => () => setForm(f => ({ ...f, [k]: !f[k] }));

  return (
    <div>
      <div className="page-card">
        <div className="page-card-header">
          <h6 className="mb-0 fw-bold">FAQs ({items.length})</h6>
          <button className="btn btn-gold btn-sm" onClick={openCreate}><i className="fas fa-plus me-1"></i>Add FAQ</button>
        </div>
        <div className="table-responsive">
          <table className="table admin-table">
            <thead><tr><th>#</th><th>Question</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan="5" className="text-center py-4"><div className="spinner-border spinner-border-sm"></div></td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan="5" className="text-center text-muted py-4">No FAQs yet</td></tr>}
              {items.map((item, i) => (
                <tr key={item._id}>
                  <td>{item.order || i+1}</td>
                  <td><div className="fw-semibold">{item.question}</div><small className="text-muted">{item.answer?.substring(0,80)}...</small></td>
                  <td><span className="badge bg-light text-dark border">{item.category}</span></td>
                  <td><span className={`status-badge ${item.isActive ? 'badge-active' : 'badge-inactive'}`}>{item.isActive ? 'Active' : 'Inactive'}</span></td>
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
                <h5 className="modal-title">{editing ? 'Edit' : 'Add'} FAQ</h5>
                <button className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2">{error}</div>}
                  <div className="row g-3">
                    <div className="col-md-8">
                      <label className="form-label">Question *</label>
                      <input className="form-control" value={form.question} onChange={set('question')} required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Category</label>
                      <select className="form-select" value={form.category} onChange={set('category')}>
                        {CATS.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Answer *</label>
                      <textarea className="form-control" rows="4" value={form.answer} onChange={set('answer')} required></textarea>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Order</label>
                      <input type="number" className="form-control" value={form.order} onChange={set('order')} />
                    </div>
                    <div className="col-md-6 d-flex align-items-end pb-2">
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" checked={form.isActive} onChange={toggle('isActive')} />
                        <label className="form-check-label">Active</label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-gold" disabled={saving}>
                    {saving ? <><i className="fas fa-spinner fa-spin me-1"></i>Saving...</> : 'Save FAQ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal show={!!confirm} title="Delete FAQ" message="Delete this FAQ?" onConfirm={handleDelete} onCancel={() => setConfirm(null)} loading={deleting} />
    </div>
  );
}
