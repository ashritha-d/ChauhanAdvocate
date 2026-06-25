import { useEffect, useRef, useState } from 'react';
import { getBooks, createBook, updateBook, deleteBook } from '../api';
import ConfirmModal from '../components/ConfirmModal';
import { mediaUrl, formatDate } from '../utils/helpers';

const EMPTY = {
  name: '', author: 'Adv Chauhan', price: '', description: '',
  stockStatus: 'available', contactNumber: '', isActive: true, order: 0,
};

export default function Books() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState(EMPTY);
  const [editing, setEditing]   = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [confirm, setConfirm]   = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch]     = useState('');
  const [alert, setAlert]       = useState(null);
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const imageRef = useRef();

  const showToast = (type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert(null), 4000); };

  const load = async () => {
    setLoading(true);
    try {
      const r = await getBooks();
      setItems(r.data.data || []);
    } catch { showToast('danger', 'Failed to load books'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter(b =>
    !search || b.name.toLowerCase().includes(search.toLowerCase()) || (b.author || '').toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setForm(EMPTY); setEditing(null); setError('');
    setImageFile(null); setImagePreview('');
    setShowForm(true);
  };

  const openEdit = item => {
    setForm({
      name:          item.name || '',
      author:        item.author || '',
      price:         item.price ?? '',
      description:   item.description || '',
      stockStatus:   item.stockStatus || 'available',
      contactNumber: item.contactNumber || '',
      isActive:      item.isActive !== false,
      order:         item.order ?? 0,
    });
    setEditing(item._id); setError('');
    setImageFile(null);
    setImagePreview(item.image ? mediaUrl(item.image) : '');
    setShowForm(true);
  };

  const handleSave = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);
      if (editing) await updateBook(editing, fd);
      else         await createBook(fd);
      showToast('success', editing ? 'Book updated!' : 'Book added!');
      setShowForm(false);
      load();
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteBook(confirm); setConfirm(null); showToast('success', 'Book deleted'); load(); }
    catch { showToast('danger', 'Delete failed'); }
    setDeleting(false);
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  return (
    <div>
      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
          {alert.msg}
          <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
        </div>
      )}

      <div className="page-card">
        <div className="page-card-header">
          <h6 className="mb-0 fw-bold">
            <i className="fas fa-book me-2" style={{ color: '#c9a227' }}></i>
            Books for Sale ({filtered.length})
          </h6>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <input
              className="search-input" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search books..."
            />
            <button className="btn btn-gold btn-sm" onClick={openCreate}>
              <i className="fas fa-plus me-1"></i>Add Book
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table admin-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Cover</th>
                <th>Name</th>
                <th>Author</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="8" className="text-center py-4">
                  <div className="spinner-border spinner-border-sm" style={{ color: '#c9a227' }}></div>
                </td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan="8" className="text-center py-5 text-muted">No books found.</td></tr>
              )}
              {filtered.map(item => (
                <tr key={item._id}>
                  <td>
                    {item.image
                      ? <img src={mediaUrl(item.image)} alt="" style={{ width: 42, height: 56, objectFit: 'cover', borderRadius: 4, border: '1px solid #dee2e6' }} onError={e => { e.target.style.display = 'none'; }} />
                      : <div style={{ width: 42, height: 56, background: '#f5f5f5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-book text-muted"></i></div>
                    }
                  </td>
                  <td>
                    <div className="fw-semibold">{item.name}</div>
                    {item.description && <small className="text-muted d-block" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</small>}
                  </td>
                  <td><small>{item.author || '—'}</small></td>
                  <td><span className="fw-semibold">₹{item.price}</span></td>
                  <td>
                    {item.stockStatus === 'available'
                      ? <span className="badge bg-success">Available</span>
                      : <span className="badge bg-secondary">Out of Stock</span>}
                  </td>
                  <td><span className={`status-badge ${item.isActive ? 'badge-active' : 'badge-inactive'}`}>{item.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td><small>{formatDate(item.createdAt)}</small></td>
                  <td>
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(item)} title="Edit"><i className="fas fa-edit"></i></button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => setConfirm(item._id)} title="Delete"><i className="fas fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050, position: 'fixed', inset: 0, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 12px' }}>
          <div className="modal-dialog modal-lg w-100 m-0" style={{ maxWidth: 700 }}>
            <div className="modal-content" style={{ borderRadius: 12 }}>
              <div className="modal-header" style={{ borderBottom: '1px solid #eee', position: 'sticky', top: 0, background: '#fff', zIndex: 1, borderRadius: '12px 12px 0 0' }}>
                <h5 className="modal-title">
                  <i className="fas fa-book me-2" style={{ color: '#c9a227' }}></i>
                  {editing ? 'Edit' : 'Add'} Book
                </h5>
                <button className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2">{error}</div>}
                  <div className="row g-3">

                    <div className="col-md-8">
                      <label className="form-label">Book Name *</label>
                      <input className="form-control" value={form.name} onChange={set('name')} required placeholder="e.g. Chattaparamina Samasyalu" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Price (₹) *</label>
                      <input type="number" className="form-control" value={form.price} onChange={set('price')} required min="0" step="1" placeholder="650" />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Author</label>
                      <input className="form-control" value={form.author} onChange={set('author')} placeholder="Adv Chauhan" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Contact Number</label>
                      <input className="form-control" value={form.contactNumber} onChange={set('contactNumber')} placeholder="9392538226" />
                    </div>

                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea className="form-control" rows="3" value={form.description} onChange={set('description')} placeholder="Brief description of the book..."></textarea>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Cover Image</label>
                      <input type="file" className="form-control" accept="image/*" ref={imageRef}
                        onChange={e => {
                          const f = e.target.files[0];
                          if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
                        }}
                      />
                      {imagePreview && (
                        <div className="mt-2 d-flex align-items-start gap-2">
                          <img src={imagePreview} alt="Cover" style={{ height: 100, width: 70, objectFit: 'cover', borderRadius: 4, border: '1px solid #dee2e6' }} />
                          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => { setImageFile(null); setImagePreview(''); if (imageRef.current) imageRef.current.value = ''; }}>
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Stock Status</label>
                      <select className="form-select" value={form.stockStatus} onChange={set('stockStatus')}>
                        <option value="available">Available</option>
                        <option value="out_of_stock">Out of Stock</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">Display Order</label>
                      <input type="number" className="form-control" value={form.order} onChange={set('order')} min="0" />
                    </div>
                    <div className="col-md-4 d-flex align-items-end">
                      <div className="form-check form-switch mb-2">
                        <input className="form-check-input" type="checkbox" id="book-active" checked={form.isActive} onChange={set('isActive')} />
                        <label className="form-check-label" htmlFor="book-active">Active (visible on site)</label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer" style={{ borderTop: '1px solid #eee', borderRadius: '0 0 12px 12px', background: '#fff' }}>
                  <button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-gold" disabled={saving}>
                    {saving ? <><i className="fas fa-spinner fa-spin me-1"></i>Saving...</> : (editing ? 'Update Book' : 'Add Book')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal show={!!confirm} title="Delete Book"
        message="Delete this book? This cannot be undone."
        onConfirm={handleDelete} onCancel={() => setConfirm(null)} loading={deleting} />
    </div>
  );
}
