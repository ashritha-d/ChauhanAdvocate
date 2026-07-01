import { useEffect, useRef, useState } from 'react';
import usePolling from '../hooks/usePolling';
import { getFacebookContent, createFacebookContent, updateFacebookContent, deleteFacebookContent } from '../api';
import ConfirmModal from '../components/ConfirmModal';

const CATEGORIES = ['Video', 'Reel', 'Post', 'Live Video', 'Photo'];
const EMPTY = { title: '', facebookUrl: '', thumbnailUrl: '', description: '', category: 'Video', order: 0, isActive: true };
const FB_PLACEHOLDER = 'https://placehold.co/320x180/1877f2/ffffff?text=Facebook+Post';
const MEDIA_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace('/api', '');

const FB_URL_RE = /^https?:\/\/(www\.|m\.)?facebook\.com\/.+|^https?:\/\/fb\.watch\/.+/;
const isValidFbUrl = url => url && FB_URL_RE.test(url.trim());

export default function FacebookContent() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [thumbFile, setThumbFile] = useState(null);
  const [thumbPreview, setThumbPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [alert, setAlert] = useState(null);
  const [previewPost, setPreviewPost] = useState(null);
  const [urlError, setUrlError] = useState('');
  const fileRef = useRef();

  const showAlert = (type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert(null), 4000); };

  const load = async () => {
    setLoading(true);
    try {
      const r = await getFacebookContent();
      const data = r.data.data || [];
      console.log('Loaded Facebook Content:', data);
      setPosts(data);
    } catch { showAlert('danger', 'Failed to load Facebook content'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  usePolling(load, 30000);

  const openAdd = () => {
    setEditing(null); setForm(EMPTY); setThumbFile(null); setThumbPreview('');
    setUrlError(''); setShowForm(true);
  };

  const openEdit = p => {
    setEditing(p._id);
    const isAbsolute = p.thumbnail && /^https?:\/\//i.test(p.thumbnail);
    setForm({
      title: p.title,
      facebookUrl: p.facebookUrl || '',
      thumbnailUrl: isAbsolute ? p.thumbnail : '',
      description: p.description || '',
      category: p.category || 'Video',
      order: p.order ?? 0,
      isActive: p.isActive,
    });
    setThumbFile(null);
    setThumbPreview(isAbsolute ? p.thumbnail : p.thumbnail ? MEDIA_BASE + p.thumbnail : '');
    setUrlError(''); setShowForm(true);
  };

  const handleThumbChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleUrlChange = e => {
    const val = e.target.value;
    setForm(f => ({ ...f, facebookUrl: val }));
    setUrlError(val && !isValidFbUrl(val) ? 'Enter a valid facebook.com or fb.watch URL' : '');
  };

  const handleSave = async e => {
    e.preventDefault();
    if (form.facebookUrl && !isValidFbUrl(form.facebookUrl)) {
      setUrlError('Enter a valid facebook.com or fb.watch URL');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('facebookUrl', form.facebookUrl);
      fd.append('description', form.description);
      fd.append('category', form.category);
      fd.append('order', form.order);
      fd.append('isActive', form.isActive);
      if (thumbFile) fd.append('thumbnail', thumbFile);
      else if (form.thumbnailUrl) fd.append('thumbnailUrl', form.thumbnailUrl);
      if (editing) await updateFacebookContent(editing, fd);
      else await createFacebookContent(fd);
      showAlert('success', editing ? 'Content updated!' : 'Content added!');
      setShowForm(false);
      load();
    } catch (err) { showAlert('danger', err.response?.data?.message || 'Save failed'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    try { await deleteFacebookContent(confirmId); showAlert('success', 'Deleted'); load(); }
    catch { showAlert('danger', 'Delete failed'); }
    setConfirmId(null);
  };

  const thumbUrl = p => {
    if (!p.thumbnail) return FB_PLACEHOLDER;
    if (/^https?:\/\//i.test(p.thumbnail)) return p.thumbnail;
    return MEDIA_BASE + p.thumbnail;
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border" style={{ color: '#1877f2' }}></div></div>;

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h4 className="fw-bold mb-0">
          <i className="fab fa-facebook me-2" style={{ color: '#1877f2' }}></i>Facebook Content
        </h4>
        <button className="btn btn-primary" onClick={openAdd}>
          <i className="fas fa-plus me-2"></i>Add Content
        </button>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible`} role="alert">
          {alert.msg}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="card shadow-sm mb-4">
          <div className="card-header d-flex align-items-center gap-2">
            <i className="fab fa-facebook" style={{ color: '#1877f2' }}></i>
            <h6 className="mb-0">{editing ? 'Edit Facebook Content' : 'Add Facebook Content'}</h6>
          </div>
          <div className="card-body">
            <form onSubmit={handleSave}>
              <div className="row g-3">
                <div className="col-md-8">
                  <label className="form-label">Facebook URL *</label>
                  <input
                    className={`form-control ${urlError ? 'is-invalid' : ''}`}
                    value={form.facebookUrl}
                    onChange={handleUrlChange}
                    placeholder="https://www.facebook.com/share/v/... or https://fb.watch/..."
                    required
                  />
                  {urlError
                    ? <div className="invalid-feedback">{urlError}</div>
                    : <small className="text-muted">Accepts posts, videos, reels, live videos (facebook.com or fb.watch)</small>
                  }
                </div>
                <div className="col-md-4">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={set('category')}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-md-8">
                  <label className="form-label">Title *</label>
                  <input className="form-control" value={form.title} onChange={set('title')} placeholder="Content title" required />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Display Order</label>
                  <input type="number" className="form-control" value={form.order} onChange={set('order')} min="0" />
                </div>
                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows="2" value={form.description} onChange={set('description')} placeholder="Short description (optional)" />
                </div>
                <div className="col-12">
                  <label className="form-label">Thumbnail Image <span className="text-muted fw-normal">(optional)</span></label>
                  <div className="alert alert-warning py-2 px-3 mb-2" style={{ fontSize: '.82rem' }}>
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    <strong>Use an image URL</strong> (recommended) — uploaded files are lost on server restarts. Paste a direct image link from Facebook, Imgur, Google Drive, etc.
                  </div>
                  <input
                    type="url"
                    className="form-control mb-2"
                    placeholder="https://... (paste a direct image URL)"
                    value={form.thumbnailUrl}
                    onChange={e => {
                      setForm(f => ({ ...f, thumbnailUrl: e.target.value }));
                      setThumbPreview(e.target.value);
                      setThumbFile(null);
                      if (fileRef.current) fileRef.current.value = '';
                    }}
                  />
                  <div className="text-muted small mb-2">— or upload a file —</div>
                  <input type="file" className="form-control" accept="image/*" ref={fileRef} onChange={handleThumbChange} />
                  {thumbPreview && (
                    <div className="mt-2">
                      <img src={thumbPreview} alt="Preview" style={{ height: 100, objectFit: 'cover', borderRadius: 6, border: '1px solid #dee2e6' }}
                        onError={e => { e.target.style.display = 'none'; }} />
                      <button type="button" className="btn btn-sm btn-outline-danger ms-2 align-bottom"
                        onClick={() => { setThumbFile(null); setThumbPreview(''); setForm(f => ({ ...f, thumbnailUrl: '' })); if (fileRef.current) fileRef.current.value = ''; }}>
                        <i className="fas fa-times"></i> Remove
                      </button>
                    </div>
                  )}
                </div>
                <div className="col-12">
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="fbIsActive" checked={form.isActive} onChange={set('isActive')} />
                    <label className="form-check-label" htmlFor="fbIsActive">Active (show on website)</label>
                  </div>
                </div>
              </div>
              <div className="d-flex gap-2 mt-3">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving
                    ? <><i className="fas fa-spinner fa-spin me-1"></i>Saving...</>
                    : <><i className="fas fa-save me-1"></i>Save</>}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="fab fa-facebook fa-3x mb-3 opacity-25" style={{ color: '#1877f2' }}></i>
          <p>No existing data found.</p>
        </div>
      ) : (
        <div className="row g-3">
          {posts.map(p => (
            <div className="col-md-4 col-lg-3" key={p._id}>
              <div className={`card h-100 ${!p.isActive ? 'opacity-50' : ''}`}>
                <div className="position-relative">
                  <img
                    src={thumbUrl(p)} className="card-img-top" alt={p.title}
                    style={{ height: 160, objectFit: 'cover' }}
                    onError={e => { e.target.src = FB_PLACEHOLDER; }}
                  />
                  <button
                    type="button"
                    onClick={() => setPreviewPost(p)}
                    className="position-absolute top-50 start-50 translate-middle text-white border-0"
                    title="Preview"
                    style={{ background: 'rgba(24,119,242,0.85)', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <i className="fas fa-play" style={{ fontSize: 14, marginLeft: 3 }}></i>
                  </button>
                  {!p.isActive && (
                    <span className="badge bg-secondary position-absolute top-0 end-0 m-2">Hidden</span>
                  )}
                  {p.category && (
                    <span className="badge position-absolute top-0 start-0 m-2" style={{ background: '#1877f2' }}>{p.category}</span>
                  )}
                </div>
                <div className="card-body p-2">
                  <p className="mb-1 fw-semibold small" style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.title}</p>
                  {p.description && (
                    <p className="text-muted mb-0" style={{ fontSize: '.75rem' }}>
                      {p.description.substring(0, 60)}{p.description.length > 60 ? '...' : ''}
                    </p>
                  )}
                </div>
                <div className="card-footer p-2 d-flex gap-1">
                  <a href={p.facebookUrl} target="_blank" rel="noreferrer"
                    className="btn btn-sm btn-outline-primary flex-fill" title="Open on Facebook">
                    <i className="fab fa-facebook"></i>
                  </a>
                  <button className="btn btn-sm btn-outline-warning flex-fill" onClick={() => openEdit(p)} title="Edit">
                    <i className="fas fa-edit"></i>
                  </button>
                  <button className="btn btn-sm btn-outline-danger flex-fill" onClick={() => setConfirmId(p._id)} title="Delete">
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        show={!!confirmId}
        title="Delete Facebook Content"
        message="Remove this content from the website? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />

      {/* Preview Modal */}
      {previewPost && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.55)', zIndex: 1055 }} onClick={() => setPreviewPost(null)}>
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <i className="fab fa-facebook" style={{ color: '#1877f2' }}></i>
                  {previewPost.title}
                </h5>
                <button type="button" className="btn-close" onClick={() => setPreviewPost(null)}></button>
              </div>
              <div className="modal-body text-center pt-2">
                <img
                  src={thumbUrl(previewPost)} alt={previewPost.title}
                  style={{ maxWidth: '100%', maxHeight: 340, objectFit: 'contain', borderRadius: 8 }}
                  onError={e => { e.target.src = FB_PLACEHOLDER; }}
                />
                {previewPost.category && (
                  <div className="mt-3">
                    <span className="badge" style={{ background: '#1877f2' }}>{previewPost.category}</span>
                  </div>
                )}
                {previewPost.description && (
                  <p className="mt-2 text-muted">{previewPost.description}</p>
                )}
                {previewPost.facebookUrl && (
                  <p className="mb-0">
                    <small className="text-muted text-break">{previewPost.facebookUrl}</small>
                  </p>
                )}
              </div>
              <div className="modal-footer border-0 pt-0">
                <a href={previewPost.facebookUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
                  <i className="fab fa-facebook me-2"></i>Open on Facebook
                </a>
                <button className="btn btn-outline-secondary" onClick={() => setPreviewPost(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
