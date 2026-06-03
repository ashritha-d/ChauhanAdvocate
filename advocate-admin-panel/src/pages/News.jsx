import { useEffect, useState } from 'react';
import { getNews, createNews, updateNews, deleteNews } from '../api';
import ConfirmModal from '../components/ConfirmModal';

const EMPTY = {
  title: '', description: '', date: new Date().toISOString().split('T')[0],
  link: '', linkLabel: 'Read More', isActive: true, priority: 0,
};

function fmt(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function News() {
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

  const load = () => {
    setLoading(true);
    getNews().then(r => setItems(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setEditing(null); setError(''); setShowForm(true); };
  const openEdit   = item => {
    setForm({ ...item, date: item.date ? new Date(item.date).toISOString().split('T')[0] : '' });
    setEditing(item._id); setError(''); setShowForm(true);
  };

  const handleSave = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editing) await updateNews(editing, form);
      else         await createNews(form);
      setShowForm(false); load();
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteNews(confirm); setConfirm(null); load(); } catch {}
    setDeleting(false);
  };

  const toggleActive = async (item) => {
    try { await updateNews(item._id, { isActive: !item.isActive }); load(); } catch {}
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target?.type === 'checkbox' ? e.target.checked : (e.target?.value ?? e) }));

  const filtered    = items.filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()));
  const activeCount = items.filter(n => n.isActive).length;

  return (
    <div>
      <div className="page-card">
        <div className="page-card-header">
          <div className="d-flex align-items-center gap-2">
            <h6 className="mb-0 fw-bold">Latest News</h6>
            {activeCount > 0 && (
              <span className="badge bg-success">{activeCount} Active</span>
            )}
          </div>
          <div className="d-flex gap-2">
            <input
              className="search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search news…"
            />
            <button className="btn btn-gold btn-sm" onClick={openCreate}>
              <i className="fas fa-plus me-1"></i>Add News
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Priority</th>
                <th>Link</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="6" className="text-center py-4">
                  <div className="spinner-border spinner-border-sm"></div>
                </td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan="6" className="text-center text-muted py-4">No news items yet</td></tr>
              )}
              {!loading && filtered.map(item => (
                <tr key={item._id}>
                  <td>
                    <div className="fw-semibold">{item.title}</div>
                    {item.description && (
                      <small className="text-muted">{item.description.slice(0, 80)}{item.description.length > 80 ? '…' : ''}</small>
                    )}
                  </td>
                  <td><small>{fmt(item.date)}</small></td>
                  <td>
                    <span className="badge bg-secondary">{item.priority}</span>
                  </td>
                  <td>
                    {item.link
                      ? <a href={item.link} target="_blank" rel="noreferrer" className="text-gold small"><i className="fas fa-external-link-alt me-1"></i>{item.linkLabel}</a>
                      : <small className="text-muted">—</small>
                    }
                  </td>
                  <td>
                    <div className="form-check form-switch mb-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={item.isActive}
                        onChange={() => toggleActive(item)}
                        title={item.isActive ? 'Disable' : 'Enable'}
                      />
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-info me-1" onClick={() => openEdit(item)} title="Edit">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => setConfirm(item._id)} title="Delete">
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-newspaper text-gold me-2"></i>
                  {editing ? 'Edit News Item' : 'Add News Item'}
                </h5>
                <button className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2">{error}</div>}
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">News Title *</label>
                      <input
                        className="form-control"
                        value={form.title}
                        onChange={set('title')}
                        placeholder="e.g. Supreme Court Ruling on Property Rights"
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Short Description</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={form.description}
                        onChange={set('description')}
                        placeholder="Brief description shown on the news page…"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={form.date}
                        onChange={set('date')}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Priority (higher = first)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={form.priority}
                        onChange={set('priority')}
                        min="0"
                      />
                    </div>
                    <div className="col-md-4 d-flex align-items-end pb-1">
                      <div className="form-check form-switch">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="newsActive"
                          checked={form.isActive}
                          onChange={set('isActive')}
                        />
                        <label className="form-check-label fw-semibold" htmlFor="newsActive">
                          Active (show on website)
                        </label>
                      </div>
                    </div>
                    <div className="col-md-8">
                      <label className="form-label fw-semibold">Link URL (optional)</label>
                      <input
                        type="url"
                        className="form-control"
                        value={form.link}
                        onChange={set('link')}
                        placeholder="https://…"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Button Label</label>
                      <input
                        className="form-control"
                        value={form.linkLabel}
                        onChange={set('linkLabel')}
                        placeholder="Read More"
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-gold" disabled={saving}>
                    {saving
                      ? <><i className="fas fa-spinner fa-spin me-1"></i>Saving…</>
                      : <><i className="fas fa-save me-1"></i>Save News</>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        show={!!confirm}
        title="Delete News"
        message="Delete this news item? It will no longer appear on the website."
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
        loading={deleting}
      />
    </div>
  );
}
