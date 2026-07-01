import { useEffect, useRef, useState } from 'react';
import usePolling from '../hooks/usePolling';
import { getDrafts, createDraft, updateDraft, deleteDraft, publishDraft, bulkDeleteDrafts, bulkPublishDrafts } from '../api';
import ConfirmModal from '../components/ConfirmModal';
import { mediaUrl, formatDate } from '../utils/helpers';

const CONTENT_TYPES = ['blog', 'course', 'magazine', 'news', 'facebook', 'youtube'];
const TYPE_META = {
  blog:      { label: 'Blog',      icon: 'fas fa-newspaper',      color: '#6f42c1' },
  course:    { label: 'Course',    icon: 'fas fa-graduation-cap',  color: '#0d6efd' },
  magazine:  { label: 'Magazine',  icon: 'fas fa-book-open',       color: '#198754' },
  news:      { label: 'News',      icon: 'fas fa-rss',             color: '#fd7e14' },
  facebook:  { label: 'Facebook',  icon: 'fab fa-facebook',        color: '#1877f2' },
  youtube:   { label: 'YouTube',   icon: 'fab fa-youtube',         color: '#dc3545' },
};

const EMPTY = { title: '', contentType: 'blog', contentDataJson: '', status: 'draft', createdBy: '' };
const LIMIT  = 20;

export default function Drafts() {
  const [items, setItems]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [form, setForm]                 = useState(EMPTY);
  const [editing, setEditing]           = useState(null);
  const [showForm, setShowForm]         = useState(false);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');
  const [confirm, setConfirm]           = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [search, setSearch]             = useState('');
  const [filterType, setFilterType]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected]         = useState([]);
  const [bulkLoading, setBulkLoading]   = useState(false);
  const [page, setPage]                 = useState(1);
  const [total, setTotal]               = useState(0);
  const [alert, setAlert]               = useState(null);
  const [thumbFile, setThumbFile]       = useState(null);
  const [thumbPreview, setThumbPreview] = useState('');
  const [preview, setPreview]           = useState(null);
  const thumbRef = useRef();

  const showToast = (type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert(null), 4000); };

  const load = async (p = page, s = search, ct = filterType, st = filterStatus) => {
    setLoading(true);
    try {
      const params = { page: p, limit: LIMIT };
      if (s) params.search = s;
      if (ct) params.contentType = ct;
      if (st) params.status = st;
      const r = await getDrafts(params);
      const data = r.data.data || [];
      console.log('Loaded Drafts:', data);
      setItems(data);
      setTotal(r.data.total || 0);
      setSelected([]);
    } catch { showToast('danger', 'Failed to load drafts'); }
    setLoading(false);
  };

  useEffect(() => { load(page, search, filterType, filterStatus); }, [page]);
  usePolling(() => load(page, search, filterType, filterStatus), 30000);

  const handleSearch = () => { setPage(1); load(1, search, filterType, filterStatus); };

  const openCreate = () => {
    setForm(EMPTY); setEditing(null); setError('');
    setThumbFile(null); setThumbPreview('');
    setShowForm(true);
  };

  const openEdit = item => {
    setForm({
      title:           item.title || '',
      contentType:     item.contentType || 'blog',
      contentDataJson: item.contentDataJson && typeof item.contentDataJson === 'object'
        ? JSON.stringify(item.contentDataJson, null, 2)
        : (item.contentDataJson || ''),
      status:    item.status || 'draft',
      createdBy: item.createdBy || ''
    });
    setEditing(item._id);
    setError('');
    setThumbFile(null);
    setThumbPreview(item.thumbnail ? mediaUrl(item.thumbnail) : '');
    setShowForm(true);
  };

  const handleSave = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('contentType', form.contentType);
      fd.append('contentDataJson', form.contentDataJson || '{}');
      fd.append('status', form.status);
      fd.append('createdBy', form.createdBy);
      if (thumbFile) fd.append('thumbnail', thumbFile);
      if (editing) await updateDraft(editing, fd);
      else await createDraft(fd);
      showToast('success', editing ? 'Draft updated!' : 'Draft saved!');
      setShowForm(false);
      load(page, search, filterType, filterStatus);
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteDraft(confirm); setConfirm(null); showToast('success', 'Draft deleted'); load(page, search, filterType, filterStatus); }
    catch { showToast('danger', 'Delete failed'); }
    setDeleting(false);
  };

  const handlePublish = async id => {
    try { await publishDraft(id); showToast('success', 'Draft published!'); load(page, search, filterType, filterStatus); }
    catch { showToast('danger', 'Publish failed'); }
  };

  const toggleSelect = id => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll    = () => setSelected(selected.length === items.length ? [] : items.map(i => i._id));

  const handleBulkDelete = async () => {
    if (!selected.length) return;
    setBulkLoading(true);
    try { await bulkDeleteDrafts(selected); showToast('success', `${selected.length} drafts deleted`); load(page, search, filterType, filterStatus); }
    catch { showToast('danger', 'Bulk delete failed'); }
    setBulkLoading(false);
  };

  const handleBulkPublish = async () => {
    if (!selected.length) return;
    setBulkLoading(true);
    try { await bulkPublishDrafts(selected); showToast('success', `${selected.length} drafts published`); load(page, search, filterType, filterStatus); }
    catch { showToast('danger', 'Bulk publish failed'); }
    setBulkLoading(false);
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const totalPages = Math.ceil(total / LIMIT);
  const meta = t => TYPE_META[t] || { label: t, icon: 'fas fa-file', color: '#6c757d' };

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
            <i className="fas fa-drafting-compass me-2" style={{ color: '#c9a227' }}></i>
            Drafts ({total})
          </h6>
          <div className="d-flex gap-2 flex-wrap align-items-center">
            <input
              className="search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search drafts..."
            />
            <select className="form-select form-select-sm" style={{ width: 140 }} value={filterType}
              onChange={e => { setFilterType(e.target.value); setPage(1); load(1, search, e.target.value, filterStatus); }}>
              <option value="">All Types</option>
              {CONTENT_TYPES.map(t => <option key={t} value={t}>{TYPE_META[t]?.label || t}</option>)}
            </select>
            <select className="form-select form-select-sm" style={{ width: 120 }} value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1); load(1, search, filterType, e.target.value); }}>
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <button className="btn btn-sm btn-outline-secondary" onClick={handleSearch}><i className="fas fa-search"></i></button>
            <button className="btn btn-gold btn-sm" onClick={openCreate}>
              <i className="fas fa-plus me-1"></i>New Draft
            </button>
          </div>
        </div>

        {selected.length > 0 && (
          <div className="d-flex align-items-center gap-2 px-3 py-2 bg-light border-bottom flex-wrap">
            <span className="fw-semibold small">{selected.length} selected</span>
            <button className="btn btn-sm btn-success" onClick={handleBulkPublish} disabled={bulkLoading}>
              <i className="fas fa-check me-1"></i>Publish All
            </button>
            <button className="btn btn-sm btn-danger" onClick={handleBulkDelete} disabled={bulkLoading}>
              {bulkLoading ? <i className="fas fa-spinner fa-spin me-1"></i> : <i className="fas fa-trash me-1"></i>}Delete
            </button>
            <button className="btn btn-sm btn-outline-secondary ms-auto" onClick={() => setSelected([])}>
              Clear
            </button>
          </div>
        )}

        <div className="table-responsive">
          <table className="table admin-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" checked={items.length > 0 && selected.length === items.length} onChange={toggleAll} />
                </th>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Last Saved</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="7" className="text-center py-4">
                  <div className="spinner-border spinner-border-sm" style={{ color: '#c9a227' }}></div>
                </td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan="7" className="text-center py-5">
                  <i className="fas fa-drafting-compass fa-3x mb-3 d-block" style={{ color: '#dee2e6' }}></i>
                  <span className="text-muted">No existing data found.</span>
                </td></tr>
              )}
              {items.map(item => {
                const m = meta(item.contentType);
                return (
                  <tr key={item._id} className={selected.includes(item._id) ? 'table-active' : ''}>
                    <td>
                      <input type="checkbox" checked={selected.includes(item._id)} onChange={() => toggleSelect(item._id)} />
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        {item.thumbnail
                          ? <img src={mediaUrl(item.thumbnail)} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4, border: '1px solid #dee2e6' }} />
                          : <div style={{ width: 36, height: 36, background: '#f5f5f5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <i className={m.icon} style={{ color: m.color, fontSize: 14 }}></i>
                            </div>
                        }
                        <span className="fw-semibold">{item.title}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: m.color, color: '#fff', fontSize: '0.72rem' }}>
                        <i className={`${m.icon} me-1`}></i>{m.label}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${item.status === 'published' ? 'badge-active' : 'badge-inactive'}`}>
                        {item.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td>{formatDate(item.lastSavedAt || item.updatedAt)}</td>
                    <td><small className="text-muted">{item.createdBy || '—'}</small></td>
                    <td>
                      <div className="d-flex gap-1">
                        <button className="btn btn-sm btn-outline-info" onClick={() => setPreview(item)} title="Preview">
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(item)} title="Edit">
                          <i className="fas fa-edit"></i>
                        </button>
                        {item.status !== 'published' && (
                          <button className="btn btn-sm btn-outline-success" onClick={() => handlePublish(item._id)} title="Publish">
                            <i className="fas fa-check"></i>
                          </button>
                        )}
                        <button className="btn btn-sm btn-outline-danger" onClick={() => setConfirm(item._id)} title="Delete">
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

        {totalPages > 1 && (
          <div className="d-flex justify-content-center align-items-center gap-2 p-3 border-top">
            <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <i className="fas fa-chevron-left"></i>
            </button>
            <span className="small text-muted">Page {page} of {totalPages}</span>
            <button className="btn btn-sm btn-outline-secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-drafting-compass me-2" style={{ color: '#c9a227' }}></i>
                  {editing ? 'Edit Draft' : 'New Draft'}
                </h5>
                <button className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2">{error}</div>}
                  <div className="row g-3">
                    <div className="col-md-8">
                      <label className="form-label">Draft Title *</label>
                      <input className="form-control" value={form.title} onChange={set('title')} required placeholder="Draft title..." />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Content Type *</label>
                      <select className="form-select" value={form.contentType} onChange={set('contentType')} required>
                        {CONTENT_TYPES.map(t => (
                          <option key={t} value={t}>{TYPE_META[t]?.label || t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Status</label>
                      <select className="form-select" value={form.status} onChange={set('status')}>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Created By</label>
                      <input className="form-control" value={form.createdBy} onChange={set('createdBy')} placeholder="Author name or ID" />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Thumbnail <small className="text-muted fw-normal">(optional)</small></label>
                      <input type="file" className="form-control" accept="image/*" ref={thumbRef}
                        onChange={e => { const f = e.target.files[0]; if (!f) return; setThumbFile(f); setThumbPreview(URL.createObjectURL(f)); }} />
                      {thumbPreview && (
                        <div className="mt-2 d-flex align-items-start gap-2">
                          <img src={thumbPreview} alt="Thumbnail" style={{ height: 70, objectFit: 'cover', borderRadius: 4, border: '1px solid #dee2e6' }} />
                          <button type="button" className="btn btn-sm btn-outline-danger"
                            onClick={() => { setThumbFile(null); setThumbPreview(''); if (thumbRef.current) thumbRef.current.value = ''; }}>
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="col-12">
                      <label className="form-label">
                        Content Data <small className="text-muted fw-normal">(JSON)</small>
                      </label>
                      <textarea
                        className="form-control font-monospace"
                        rows="7"
                        value={form.contentDataJson}
                        onChange={set('contentDataJson')}
                        placeholder={'{\n  "content": "Draft content goes here...",\n  "excerpt": ""\n}'}
                        style={{ fontSize: '0.82rem' }}
                      ></textarea>
                      <small className="text-muted">Store draft content as JSON. Leave as {} for a blank draft.</small>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-gold" disabled={saving}>
                    {saving
                      ? <><i className="fas fa-spinner fa-spin me-1"></i>Saving...</>
                      : <><i className="fas fa-save me-1"></i>Save Draft</>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.55)', zIndex: 1055 }} onClick={() => setPreview(null)}>
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <i className={`${meta(preview.contentType).icon}`} style={{ color: meta(preview.contentType).color }}></i>
                  {preview.title}
                </h5>
                <button type="button" className="btn-close" onClick={() => setPreview(null)}></button>
              </div>
              <div className="modal-body">
                {preview.thumbnail && (
                  <div className="text-center mb-3">
                    <img src={mediaUrl(preview.thumbnail)} alt="" style={{ maxHeight: 180, maxWidth: '100%', objectFit: 'contain', borderRadius: 8 }} />
                  </div>
                )}
                <div className="row g-3 mb-2">
                  <div className="col-sm-4">
                    <div className="small text-muted">Type</div>
                    <span className="badge mt-1" style={{ background: meta(preview.contentType).color }}>
                      <i className={`${meta(preview.contentType).icon} me-1`}></i>
                      {meta(preview.contentType).label}
                    </span>
                  </div>
                  <div className="col-sm-4">
                    <div className="small text-muted">Status</div>
                    <span className={`status-badge mt-1 d-inline-block ${preview.status === 'published' ? 'badge-active' : 'badge-inactive'}`}>
                      {preview.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="col-sm-4">
                    <div className="small text-muted">Last Saved</div>
                    <div className="small mt-1">{formatDate(preview.lastSavedAt || preview.updatedAt)}</div>
                  </div>
                  {preview.createdBy && (
                    <div className="col-12">
                      <div className="small text-muted">Created By</div>
                      <div className="small">{preview.createdBy}</div>
                    </div>
                  )}
                </div>
                {preview.contentDataJson && Object.keys(preview.contentDataJson || {}).length > 0 && (
                  <div>
                    <div className="small text-muted mb-1">Content Data</div>
                    <pre className="bg-light p-2 rounded small" style={{ maxHeight: 220, overflow: 'auto', fontSize: '0.78rem' }}>
                      {JSON.stringify(preview.contentDataJson, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              <div className="modal-footer border-0 pt-0">
                {preview.status !== 'published' && (
                  <button className="btn btn-success btn-sm" onClick={() => { handlePublish(preview._id); setPreview(null); }}>
                    <i className="fas fa-check me-1"></i>Publish
                  </button>
                )}
                <button className="btn btn-outline-primary btn-sm" onClick={() => { openEdit(preview); setPreview(null); }}>
                  <i className="fas fa-edit me-1"></i>Edit
                </button>
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setPreview(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        show={!!confirm}
        title="Delete Draft"
        message="Are you sure you want to delete this draft? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
        loading={deleting}
      />
    </div>
  );
}
