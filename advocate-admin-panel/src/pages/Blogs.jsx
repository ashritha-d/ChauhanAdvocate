import { useEffect, useState, lazy, Suspense } from 'react';
import { getBlogs, createBlog, updateBlog, deleteBlog } from '../api';
import { formatDate } from '../utils/helpers';
import ImageUpload from '../components/ImageUpload';
import ConfirmModal from '../components/ConfirmModal';

const ReactQuill = lazy(() => import('react-quill'));

const CATS = ['Criminal Law','Civil Law','Family Law','Corporate Law','Property Law','Constitutional Law','Legal News','General'];
const EMPTY = { title:'', excerpt:'', content:'', category:'Legal News', author:'Advocate Chauhan', coverImage:'', isPublished:true, isFeatured:false };

export default function Blogs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');

  const load = () => { setLoading(true); getBlogs(1, 50).then(r => setItems(r.data.data || [])).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setEditing(null); setError(''); setShowForm(true); };
  const openEdit = item => { setForm({ ...item }); setEditing(item._id); setError(''); setShowForm(true); };

  const handleSave = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editing) await updateBlog(editing, form);
      else await createBlog(form);
      setShowForm(false); load();
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteBlog(confirm); setConfirm(null); load(); } catch {}
    setDeleting(false);
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target?.value ?? e }));
  const toggle = k => () => setForm(f => ({ ...f, [k]: !f[k] }));
  const filtered = items.filter(b => b.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-card">
        <div className="page-card-header">
          <h6 className="mb-0 fw-bold">Blog Articles ({items.length})</h6>
          <div className="d-flex gap-2">
            <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search blogs..." />
            <button className="btn btn-gold btn-sm" onClick={openCreate}><i className="fas fa-plus me-1"></i>Add Blog</button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table admin-table">
            <thead><tr><th>Title</th><th>Category</th><th>Author</th><th>Published</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan="6" className="text-center py-4"><div className="spinner-border spinner-border-sm"></div></td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan="6" className="text-center text-muted py-4">No blogs found</td></tr>}
              {filtered.map(item => (
                <tr key={item._id}>
                  <td><div className="fw-semibold">{item.title}</div><small className="text-muted">{item.excerpt?.substring(0,60)}...</small></td>
                  <td><span className="badge bg-light text-dark border">{item.category}</span></td>
                  <td>{item.author}</td>
                  <td><span className={`status-badge ${item.isPublished ? 'badge-active' : 'badge-inactive'}`}>{item.isPublished ? 'Published' : 'Draft'}</span></td>
                  <td>{formatDate(item.publishedAt || item.createdAt)}</td>
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
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editing ? 'Edit' : 'Add'} Blog Article</h5>
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
                      <label className="form-label">Category</label>
                      <select className="form-select" value={form.category} onChange={set('category')}>
                        {CATS.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Author</label>
                      <input className="form-control" value={form.author} onChange={set('author')} />
                    </div>
                    <div className="col-md-3">
                      <div className="form-check form-switch mt-4">
                        <input className="form-check-input" type="checkbox" checked={form.isPublished} onChange={toggle('isPublished')} />
                        <label className="form-check-label">Published</label>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-check form-switch mt-4">
                        <input className="form-check-input" type="checkbox" checked={form.isFeatured} onChange={toggle('isFeatured')} />
                        <label className="form-check-label">Featured</label>
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Excerpt</label>
                      <textarea className="form-control" rows="2" value={form.excerpt} onChange={set('excerpt')} placeholder="Short description for blog listing..."></textarea>
                    </div>
                    <div className="col-12">
                      <ImageUpload label="Cover Image" value={form.coverImage} onChange={v => setForm(f => ({ ...f, coverImage: v }))} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Content *</label>
                      <Suspense fallback={<div className="form-control" style={{minHeight:200}}>Loading editor...</div>}>
                        <ReactQuill
                          value={form.content}
                          onChange={v => setForm(f => ({ ...f, content: v }))}
                          theme="snow"
                          style={{ minHeight: 200 }}
                        />
                      </Suspense>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-gold" disabled={saving}>
                    {saving ? <i className="fas fa-spinner fa-spin me-1"></i> : null}{saving ? 'Saving...' : 'Save Blog'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal show={!!confirm} title="Delete Blog" message="Are you sure you want to delete this blog article?" onConfirm={handleDelete} onCancel={() => setConfirm(null)} loading={deleting} />
    </div>
  );
}
