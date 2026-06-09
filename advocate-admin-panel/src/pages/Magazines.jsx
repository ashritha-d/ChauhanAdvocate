import { useEffect, useRef, useState } from 'react';
import { getMagazines, createMagazine, updateMagazine, deleteMagazine, bulkDeleteMagazines, bulkPublishMagazines } from '../api';
import ConfirmModal from '../components/ConfirmModal';
import { mediaUrl, formatDate } from '../utils/helpers';

const CATEGORIES = ['General', 'Law', 'Legal News', 'Case Studies', 'Criminal Law', 'Civil Law', 'Family Law', 'Corporate Law', 'Constitutional Law'];
const EMPTY = { title: '', description: '', issueNumber: '', publishedDate: new Date().toISOString().split('T')[0], category: 'General', tags: '', featured: false, isActive: true, order: 0 };
const LIMIT = 20;

export default function Magazines() {
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [form, setForm]             = useState(EMPTY);
  const [editing, setEditing]       = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [confirm, setConfirm]       = useState(null);
  const [deleting, setDeleting]     = useState(false);
  const [search, setSearch]         = useState('');
  const [filterCat, setFilterCat]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected]     = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const [alert, setAlert]           = useState(null);
  const [coverFile, setCoverFile]   = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [pdfFile, setPdfFile]       = useState(null);
  const [existingPdf, setExistingPdf] = useState('');
  const coverRef = useRef();
  const pdfRef   = useRef();

  const showToast = (type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert(null), 4000); };

  const load = async (p = page, s = search, cat = filterCat, st = filterStatus) => {
    setLoading(true);
    try {
      const params = { page: p, limit: LIMIT };
      if (s) params.search = s;
      if (cat) params.category = cat;
      if (st) params.status = st;
      const r = await getMagazines(params);
      const data = r.data.data || [];
      console.log('Loaded Magazines:', data);
      setItems(data);
      setTotal(r.data.total || 0);
      setSelected([]);
    } catch { showToast('danger', 'Failed to load magazines'); }
    setLoading(false);
  };

  useEffect(() => { load(page, search, filterCat, filterStatus); }, [page]);

  const handleSearch = () => { setPage(1); load(1, search, filterCat, filterStatus); };

  const openCreate = () => {
    setForm(EMPTY); setEditing(null); setError('');
    setCoverFile(null); setCoverPreview(''); setPdfFile(null); setExistingPdf('');
    setShowForm(true);
  };

  const openEdit = item => {
    setForm({
      title:         item.title || '',
      description:   item.description || '',
      issueNumber:   item.issueNumber || '',
      publishedDate: item.publishedDate ? item.publishedDate.split('T')[0] : new Date().toISOString().split('T')[0],
      category:      item.category || 'General',
      tags:          Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''),
      featured:      !!item.featured,
      isActive:      !!item.isActive,
      order:         item.order ?? 0
    });
    setEditing(item._id);
    setError('');
    setCoverFile(null);
    setCoverPreview(item.coverImage ? mediaUrl(item.coverImage) : '');
    setPdfFile(null);
    setExistingPdf(item.pdfFile || '');
    setShowForm(true);
  };

  const handleCoverChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSave = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (coverFile) fd.append('coverImage', coverFile);
      if (pdfFile) fd.append('pdfFile', pdfFile);
      if (editing) await updateMagazine(editing, fd);
      else await createMagazine(fd);
      showToast('success', editing ? 'Magazine updated!' : 'Magazine created!');
      setShowForm(false);
      load(page, search, filterCat, filterStatus);
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteMagazine(confirm); setConfirm(null); showToast('success', 'Magazine deleted'); load(page, search, filterCat, filterStatus); }
    catch { showToast('danger', 'Delete failed'); }
    setDeleting(false);
  };

  const toggleSelect = id => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll    = () => setSelected(selected.length === items.length ? [] : items.map(i => i._id));

  const handleBulkDelete = async () => {
    if (!selected.length) return;
    setBulkLoading(true);
    try { await bulkDeleteMagazines(selected); showToast('success', `${selected.length} magazines deleted`); load(page, search, filterCat, filterStatus); }
    catch { showToast('danger', 'Bulk delete failed'); }
    setBulkLoading(false);
  };

  const handleBulkPublish = async (isActive) => {
    if (!selected.length) return;
    setBulkLoading(true);
    try { await bulkPublishMagazines(selected, isActive); showToast('success', `${selected.length} magazines ${isActive ? 'published' : 'unpublished'}`); load(page, search, filterCat, filterStatus); }
    catch { showToast('danger', 'Bulk update failed'); }
    setBulkLoading(false);
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const totalPages = Math.ceil(total / LIMIT);

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
            <i className="fas fa-book-open me-2" style={{ color: '#c9a227' }}></i>
            Magazines ({total})
          </h6>
          <div className="d-flex gap-2 flex-wrap align-items-center">
            <input
              className="search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search magazines..."
            />
            <select className="form-select form-select-sm" style={{ width: 150 }} value={filterCat}
              onChange={e => { setFilterCat(e.target.value); setPage(1); load(1, search, e.target.value, filterStatus); }}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="form-select form-select-sm" style={{ width: 120 }} value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1); load(1, search, filterCat, e.target.value); }}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button className="btn btn-sm btn-outline-secondary" onClick={handleSearch}><i className="fas fa-search"></i></button>
            <button className="btn btn-gold btn-sm" onClick={openCreate}>
              <i className="fas fa-plus me-1"></i>Add Magazine
            </button>
          </div>
        </div>

        {selected.length > 0 && (
          <div className="d-flex align-items-center gap-2 px-3 py-2 bg-light border-bottom flex-wrap">
            <span className="fw-semibold small">{selected.length} selected</span>
            <button className="btn btn-sm btn-success" onClick={() => handleBulkPublish(true)} disabled={bulkLoading}>
              <i className="fas fa-eye me-1"></i>Publish
            </button>
            <button className="btn btn-sm btn-warning" onClick={() => handleBulkPublish(false)} disabled={bulkLoading}>
              <i className="fas fa-eye-slash me-1"></i>Unpublish
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
                <th style={{ width: 70 }}>Cover</th>
                <th>Title</th>
                <th>Issue</th>
                <th>Category</th>
                <th>Featured</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="9" className="text-center py-4">
                  <div className="spinner-border spinner-border-sm" style={{ color: '#c9a227' }}></div>
                </td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan="9" className="text-center py-5">
                  <i className="fas fa-book-open fa-3x mb-3 d-block" style={{ color: '#dee2e6' }}></i>
                  <span className="text-muted">No existing data found.</span>
                </td></tr>
              )}
              {items.map(item => (
                <tr key={item._id} className={selected.includes(item._id) ? 'table-active' : ''}>
                  <td>
                    <input type="checkbox" checked={selected.includes(item._id)} onChange={() => toggleSelect(item._id)} />
                  </td>
                  <td>
                    {item.coverImage
                      ? <img src={mediaUrl(item.coverImage)} alt="" style={{ width: 46, height: 62, objectFit: 'cover', borderRadius: 4, border: '1px solid #dee2e6' }} onError={e => { e.target.style.display = 'none'; }} />
                      : <div style={{ width: 46, height: 62, background: '#f5f5f5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fas fa-book text-muted"></i>
                        </div>
                    }
                  </td>
                  <td>
                    <div className="fw-semibold">{item.title}</div>
                    {item.description && (
                      <small className="text-muted">{item.description.substring(0, 55)}{item.description.length > 55 ? '...' : ''}</small>
                    )}
                    {item.pdfFile && (
                      <div><small className="text-success"><i className="fas fa-file-pdf me-1"></i>PDF</small></div>
                    )}
                  </td>
                  <td>
                    <span className="badge bg-light text-dark border">{item.issueNumber || '—'}</span>
                  </td>
                  <td>
                    <span className="badge bg-light text-dark border">{item.category || 'General'}</span>
                  </td>
                  <td>
                    {item.featured
                      ? <span className="badge" style={{ background: '#ffc107', color: '#000' }}><i className="fas fa-star me-1"></i>Featured</span>
                      : <span className="text-muted small">—</span>
                    }
                  </td>
                  <td>
                    <span className={`status-badge ${item.isActive ? 'badge-active' : 'badge-inactive'}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{formatDate(item.publishedDate || item.createdAt)}</td>
                  <td>
                    <div className="d-flex gap-1">
                      {item.pdfFile && (
                        <a className="btn btn-sm btn-outline-secondary" href={mediaUrl(item.pdfFile)} target="_blank" rel="noreferrer" title="View PDF">
                          <i className="fas fa-file-pdf"></i>
                        </a>
                      )}
                      <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(item)} title="Edit">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => setConfirm(item._id)} title="Delete">
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
                  <i className="fas fa-book-open me-2" style={{ color: '#c9a227' }}></i>
                  {editing ? 'Edit Magazine' : 'Add Magazine'}
                </h5>
                <button className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2">{error}</div>}
                  <div className="row g-3">
                    <div className="col-md-8">
                      <label className="form-label">Magazine Title *</label>
                      <input className="form-control" value={form.title} onChange={set('title')} required placeholder="e.g. Legal Digest Vol. 12" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Issue Number</label>
                      <input className="form-control" value={form.issueNumber} onChange={set('issueNumber')} placeholder="e.g. Issue #12" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Category</label>
                      <select className="form-select" value={form.category} onChange={set('category')}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Publication Date</label>
                      <input type="date" className="form-control" value={form.publishedDate} onChange={set('publishedDate')} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea className="form-control" rows="3" value={form.description} onChange={set('description')} placeholder="Short description of this magazine issue..."></textarea>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Tags <small className="text-muted fw-normal">(comma separated)</small></label>
                      <input className="form-control" value={form.tags} onChange={set('tags')} placeholder="law, criminal, advocacy, rights" />
                    </div>

                    {/* Cover Image */}
                    <div className="col-md-6">
                      <label className="form-label">Cover Image</label>
                      <input type="file" className="form-control" accept="image/*" ref={coverRef} onChange={handleCoverChange} />
                      {coverPreview && (
                        <div className="mt-2 d-flex align-items-start gap-2">
                          <img src={coverPreview} alt="Cover" style={{ height: 110, width: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid #dee2e6' }} />
                          <button type="button" className="btn btn-sm btn-outline-danger"
                            onClick={() => { setCoverFile(null); setCoverPreview(''); if (coverRef.current) coverRef.current.value = ''; }}>
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* PDF Upload */}
                    <div className="col-md-6">
                      <label className="form-label">PDF File</label>
                      <input type="file" className="form-control" accept=".pdf" ref={pdfRef} onChange={e => setPdfFile(e.target.files[0] || null)} />
                      {pdfFile && (
                        <div className="mt-2 d-flex align-items-center gap-2">
                          <small className="text-success"><i className="fas fa-file-pdf me-1"></i>{pdfFile.name}</small>
                          <button type="button" className="btn btn-sm btn-outline-danger"
                            onClick={() => { setPdfFile(null); if (pdfRef.current) pdfRef.current.value = ''; }}>
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      )}
                      {!pdfFile && existingPdf && (
                        <div className="mt-2">
                          <small className="text-success"><i className="fas fa-file-pdf me-1"></i>PDF already attached</small>
                          <a className="ms-2 small" href={mediaUrl(existingPdf)} target="_blank" rel="noreferrer">View</a>
                        </div>
                      )}
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">Display Order</label>
                      <input type="number" className="form-control" value={form.order} onChange={set('order')} min="0" />
                    </div>
                    <div className="col-md-4 d-flex align-items-end">
                      <div className="form-check form-switch mb-2">
                        <input className="form-check-input" type="checkbox" id="mag-featured" checked={form.featured} onChange={set('featured')} />
                        <label className="form-check-label" htmlFor="mag-featured">
                          <i className="fas fa-star me-1 text-warning"></i>Featured
                        </label>
                      </div>
                    </div>
                    <div className="col-md-4 d-flex align-items-end">
                      <div className="form-check form-switch mb-2">
                        <input className="form-check-input" type="checkbox" id="mag-active" checked={form.isActive} onChange={set('isActive')} />
                        <label className="form-check-label" htmlFor="mag-active">Active</label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-gold" disabled={saving}>
                    {saving ? <><i className="fas fa-spinner fa-spin me-1"></i>Saving...</> : 'Save Magazine'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        show={!!confirm}
        title="Delete Magazine"
        message="Are you sure you want to delete this magazine? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
        loading={deleting}
      />
    </div>
  );
}
