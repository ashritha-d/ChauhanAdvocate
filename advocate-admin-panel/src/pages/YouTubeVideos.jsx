import { useEffect, useState } from 'react';
import { getYouTubeVideos, createYouTubeVideo, updateYouTubeVideo, deleteYouTubeVideo } from '../api';
import ConfirmModal from '../components/ConfirmModal';

const EMPTY = { title: '', videoUrl: '', description: '', order: 0, isActive: true };

export default function YouTubeVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [alert, setAlert] = useState(null);

  const showAlert = (type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert(null), 4000); };

  const load = async () => {
    try { const r = await getYouTubeVideos(); setVideos(r.data.data || []); }
    catch { showAlert('danger', 'Failed to load videos'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = v => { setEditing(v._id); setForm({ title: v.title, videoUrl: v.videoId, description: v.description || '', order: v.order, isActive: v.isActive }); setShowForm(true); };

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await updateYouTubeVideo(editing, form);
      else await createYouTubeVideo(form);
      showAlert('success', editing ? 'Video updated!' : 'Video added!');
      setShowForm(false);
      load();
    } catch (err) { showAlert('danger', err.response?.data?.message || 'Save failed'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    try { await deleteYouTubeVideo(confirmId); showAlert('success', 'Deleted'); load(); }
    catch { showAlert('danger', 'Delete failed'); }
    setConfirmId(null);
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const thumb = id => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-warning"></div></div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h4 className="fw-bold mb-0"><i className="fab fa-youtube text-danger me-2"></i>YouTube Videos</h4>
        <button className="btn btn-warning" onClick={openAdd}><i className="fas fa-plus me-2"></i>Add Video</button>
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      {showForm && (
        <div className="card shadow-sm mb-4">
          <div className="card-header"><h6 className="mb-0">{editing ? 'Edit Video' : 'Add Video'}</h6></div>
          <div className="card-body">
            <form onSubmit={handleSave}>
              <div className="row g-3">
                <div className="col-md-8">
                  <label className="form-label">YouTube URL or Video ID *</label>
                  <input className="form-control" value={form.videoUrl} onChange={set('videoUrl')} placeholder="https://youtu.be/VIDEO_ID or paste video URL" required />
                  <small className="text-muted">Paste any YouTube video URL — we extract the ID automatically</small>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Order</label>
                  <input type="number" className="form-control" value={form.order} onChange={set('order')} />
                </div>
                <div className="col-12">
                  <label className="form-label">Title *</label>
                  <input className="form-control" value={form.title} onChange={set('title')} placeholder="Video title" required />
                </div>
                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows="2" value={form.description} onChange={set('description')} placeholder="Short description (optional)" />
                </div>
                <div className="col-12">
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="isActive" checked={form.isActive} onChange={set('isActive')} />
                    <label className="form-check-label" htmlFor="isActive">Active (show on website)</label>
                  </div>
                </div>
              </div>
              <div className="d-flex gap-2 mt-3">
                <button type="submit" className="btn btn-warning" disabled={saving}>
                  {saving ? <><i className="fas fa-spinner fa-spin me-1"></i>Saving...</> : <><i className="fas fa-save me-1"></i>Save</>}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {videos.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="fab fa-youtube fa-3x mb-3 text-danger opacity-50"></i>
          <p>No videos yet. Add your first YouTube video!</p>
        </div>
      ) : (
        <div className="row g-3">
          {videos.map(v => (
            <div className="col-md-4 col-lg-3" key={v._id}>
              <div className={`card h-100 ${!v.isActive ? 'opacity-50' : ''}`}>
                <div className="position-relative">
                  <img src={thumb(v.videoId)} className="card-img-top" alt={v.title} style={{ height: 160, objectFit: 'cover' }} onError={e => { e.target.src = 'https://placehold.co/320x160?text=Video'; }} />
                  <a href={`https://www.youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noreferrer"
                    className="position-absolute top-50 start-50 translate-middle text-white"
                    style={{ background: 'rgba(255,0,0,0.85)', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-play" style={{ fontSize: 14, marginLeft: 3 }}></i>
                  </a>
                  {!v.isActive && <span className="badge bg-secondary position-absolute top-0 end-0 m-2">Hidden</span>}
                </div>
                <div className="card-body p-2">
                  <p className="mb-1 fw-semibold small" style={{ lineClamp: 2 }}>{v.title}</p>
                  {v.description && <p className="text-muted mb-0" style={{ fontSize: '.75rem' }}>{v.description.substring(0, 60)}{v.description.length > 60 ? '...' : ''}</p>}
                </div>
                <div className="card-footer p-2 d-flex gap-1">
                  <button className="btn btn-sm btn-outline-primary flex-fill" onClick={() => openEdit(v)}><i className="fas fa-edit"></i></button>
                  <button className="btn btn-sm btn-outline-danger flex-fill" onClick={() => setConfirmId(v._id)}><i className="fas fa-trash"></i></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal show={!!confirmId} title="Delete Video" message="Remove this video from the website?" onConfirm={handleDelete} onCancel={() => setConfirmId(null)} />
    </div>
  );
}
