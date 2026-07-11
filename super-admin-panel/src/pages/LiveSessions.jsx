import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';

const STATUS_LABELS = { upcoming: 'Upcoming', live: 'Live', ended: 'Ended' };
const STATUS_COLORS = { upcoming: '#f59e0b', live: '#dc3545', ended: '#6b7280' };

const EMPTY_FORM = {
  title: '', description: '', speaker: '', agenda: '',
  date: '', startTime: '', endTime: '', meetUrl: '',
  status: 'upcoming', isEnabled: true, banner: '',
};

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      background: type === 'error' ? '#dc3545' : '#198754',
      color: '#fff', padding: '12px 20px', borderRadius: 10,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)', minWidth: 260,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <i className={type === 'error' ? 'fas fa-times-circle' : 'fas fa-check-circle'} />
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.1rem' }}>&times;</button>
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 8000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#1e2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 28, maxWidth: 380, width: '100%', textAlign: 'center' }}>
        <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', color: '#f59e0b', marginBottom: 14, display: 'block' }} />
        <p style={{ color: '#e5e7eb', marginBottom: 22 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger btn-sm" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function LiveSessions() {
  const [sessions, setSessions]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [editing, setEditing]     = useState(null);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);
  const [confirm, setConfirm]     = useState(null);
  const [annInputs, setAnnInputs] = useState({});
  const [annSaving, setAnnSaving] = useState({});

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const load = useCallback(async () => {
    try {
      const r = await api.get('/live');
      setSessions(r.data.data || []);
    } catch { showToast('Failed to load sessions', 'error'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = s => {
    setForm({
      title:       s.title || '',
      description: s.description || '',
      speaker:     s.speaker || '',
      agenda:      s.agenda || '',
      date:        s.date ? s.date.slice(0, 10) : '',
      startTime:   s.startTime || '',
      endTime:     s.endTime || '',
      meetUrl:     s.meetUrl || '',
      status:      s.status || 'upcoming',
      isEnabled:   s.isEnabled !== false,
      banner:      s.banner || '',
    });
    setEditing(s._id);
    setShowForm(true);
  };

  const handleSave = async e => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) {
      showToast('Title and date are required', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const r = await api.put(`/live/${editing}`, form);
        setSessions(ss => ss.map(s => s._id === editing ? r.data.data : s));
        showToast('Session updated');
      } else {
        const r = await api.post('/live', form);
        setSessions(ss => [r.data.data, ...ss]);
        showToast('Session created');
      }
      setShowForm(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Save failed', 'error');
    }
    setSaving(false);
  };

  const handleDelete = id => {
    setConfirm({
      message: 'Delete this session? This cannot be undone.',
      onConfirm: async () => {
        setConfirm(null);
        try {
          await api.delete(`/live/${id}`);
          setSessions(ss => ss.filter(s => s._id !== id));
          showToast('Session deleted');
        } catch { showToast('Delete failed', 'error'); }
      },
    });
  };

  const setStatus = async (id, status) => {
    try {
      const r = await api.put(`/live/${id}`, { status });
      setSessions(ss => ss.map(s => s._id === id ? r.data.data : s));
      showToast(`Status set to ${status}`);
    } catch { showToast('Status update failed', 'error'); }
  };

  const toggleEnabled = async (id, val) => {
    try {
      const r = await api.put(`/live/${id}`, { isEnabled: val });
      setSessions(ss => ss.map(s => s._id === id ? r.data.data : s));
    } catch { showToast('Toggle failed', 'error'); }
  };

  const addAnn = async (id) => {
    const text = (annInputs[id] || '').trim();
    if (!text) return;
    setAnnSaving(p => ({ ...p, [id]: true }));
    try {
      const r = await api.post(`/live/${id}/announcements`, { text });
      setSessions(ss => ss.map(s => s._id === id ? r.data.data : s));
      setAnnInputs(p => ({ ...p, [id]: '' }));
    } catch { showToast('Failed to add announcement', 'error'); }
    setAnnSaving(p => ({ ...p, [id]: false }));
  };

  const deleteAnn = async (sessionId, annId) => {
    try {
      const r = await api.delete(`/live/${sessionId}/announcements/${annId}`);
      setSessions(ss => ss.map(s => s._id === sessionId ? r.data.data : s));
    } catch { showToast('Failed to delete announcement', 'error'); }
  };

  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {confirm && <ConfirmDialog message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}

      {/* Header */}
      <div className="sa-page-header">
        <div>
          <h1 className="sa-page-title">Live Sessions</h1>
          <p className="sa-page-subtitle">Manage live and upcoming legal sessions</p>
        </div>
        <button className="btn sa-btn-primary" onClick={openCreate}>
          <i className="fas fa-plus me-2" />New Session
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="sa-card mb-4">
          <div className="sa-card-header">
            <h3 className="sa-card-title">{editing ? 'Edit Session' : 'New Session'}</h3>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowForm(false)}>
              <i className="fas fa-times" />
            </button>
          </div>
          <div className="sa-card-body">
            <form onSubmit={handleSave}>
              <div className="row g-3">
                <div className="col-md-8">
                  <label className="sa-label">Title *</label>
                  <input className="sa-input" value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                </div>
                <div className="col-md-4">
                  <label className="sa-label">Date *</label>
                  <input type="date" className="sa-input" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                </div>
                <div className="col-md-6">
                  <label className="sa-label">Start Time</label>
                  <input type="time" className="sa-input" value={form.startTime}
                    onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="sa-label">End Time</label>
                  <input type="time" className="sa-input" value={form.endTime}
                    onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="sa-label">Speaker</label>
                  <input className="sa-input" value={form.speaker} placeholder="e.g. Advocate Chauhan"
                    onChange={e => setForm(f => ({ ...f, speaker: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="sa-label">Status</label>
                  <select className="sa-input" value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live</option>
                    <option value="ended">Ended</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="sa-label">Google Meet URL</label>
                  <input className="sa-input" value={form.meetUrl} placeholder="https://meet.google.com/..."
                    onChange={e => setForm(f => ({ ...f, meetUrl: e.target.value }))} />
                </div>
                <div className="col-12">
                  <label className="sa-label">Description</label>
                  <textarea className="sa-input" rows={2} value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="col-12">
                  <label className="sa-label">Agenda</label>
                  <textarea className="sa-input" rows={3} value={form.agenda} placeholder="Session topics, speakers, schedule..."
                    onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))} />
                </div>
                <div className="col-12">
                  <label className="sa-label">Banner Image URL</label>
                  <input className="sa-input" value={form.banner} placeholder="https://..."
                    onChange={e => setForm(f => ({ ...f, banner: e.target.value }))} />
                </div>
                <div className="col-12">
                  <label className="sa-label d-flex align-items-center gap-2">
                    <input type="checkbox" checked={form.isEnabled}
                      onChange={e => setForm(f => ({ ...f, isEnabled: e.target.checked }))} />
                    Enabled (show to users)
                  </label>
                </div>
                <div className="col-12 d-flex gap-2">
                  <button type="submit" className="btn sa-btn-primary" disabled={saving}>
                    {saving ? <><i className="fas fa-spinner fa-spin me-2" />Saving…</> : <><i className="fas fa-save me-2" />Save</>}
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sessions List */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border sa-spinner" /></div>
      ) : sessions.length === 0 ? (
        <div className="sa-card">
          <div className="sa-card-body text-center py-5" style={{ color: '#6b7280' }}>
            <i className="fas fa-video fa-3x mb-3 d-block" style={{ opacity: 0.3 }} />
            <p>No sessions yet. Create one to get started.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {sessions.map(s => (
            <div key={s._id} className="sa-card">
              <div className="sa-card-body">
                {/* Top row: title + status + actions */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>{s.title}</span>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                        background: STATUS_COLORS[s.status] + '22',
                        color: STATUS_COLORS[s.status],
                        border: `1px solid ${STATUS_COLORS[s.status]}44`,
                        letterSpacing: 1, textTransform: 'uppercase',
                      }}>
                        {s.status === 'live' && <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#dc3545', marginRight: 5, animation: 'pulse 1.4s ease-in-out infinite' }} />}
                        {STATUS_LABELS[s.status]}
                      </span>
                      {!s.isEnabled && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#37415166', color: '#9ca3af' }}>Hidden</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', color: '#9ca3af' }}>
                      <span><i className="fas fa-calendar me-1" />{fmtDate(s.date)}</span>
                      {s.startTime && <span><i className="fas fa-clock me-1" />{s.startTime}{s.endTime ? ` – ${s.endTime}` : ''}</span>}
                      {s.speaker && <span><i className="fas fa-user-tie me-1" />{s.speaker}</span>}
                    </div>
                    {s.meetUrl && (
                      <div style={{ marginTop: 6, fontSize: '0.78rem' }}>
                        <a href={s.meetUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>
                          <i className="fas fa-video me-1" />{s.meetUrl}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
                    {/* Status quick-set */}
                    {s.status !== 'live' && (
                      <button className="btn btn-sm" style={{ background: '#dc354522', color: '#dc3545', border: '1px solid #dc354544', fontSize: '0.72rem' }}
                        onClick={() => setStatus(s._id, 'live')}>
                        Go Live
                      </button>
                    )}
                    {s.status !== 'upcoming' && (
                      <button className="btn btn-sm" style={{ background: '#f59e0b22', color: '#f59e0b', border: '1px solid #f59e0b44', fontSize: '0.72rem' }}
                        onClick={() => setStatus(s._id, 'upcoming')}>
                        Set Upcoming
                      </button>
                    )}
                    {s.status !== 'ended' && (
                      <button className="btn btn-sm" style={{ background: '#6b728022', color: '#9ca3af', border: '1px solid #6b728044', fontSize: '0.72rem' }}
                        onClick={() => setStatus(s._id, 'ended')}>
                        End
                      </button>
                    )}
                    <button className="btn btn-sm" style={{ background: s.isEnabled ? '#22c55e22' : '#6b728022', color: s.isEnabled ? '#22c55e' : '#9ca3af', border: `1px solid ${s.isEnabled ? '#22c55e44' : '#6b728044'}`, fontSize: '0.72rem' }}
                      onClick={() => toggleEnabled(s._id, !s.isEnabled)}>
                      {s.isEnabled ? 'Disable' : 'Enable'}
                    </button>
                    <button className="btn btn-sm" style={{ background: '#60a5fa22', color: '#60a5fa', border: '1px solid #60a5fa44', fontSize: '0.72rem' }}
                      onClick={() => openEdit(s)}>
                      <i className="fas fa-edit" />
                    </button>
                    <button className="btn btn-sm" style={{ background: '#dc354522', color: '#dc3545', border: '1px solid #dc354544', fontSize: '0.72rem' }}
                      onClick={() => handleDelete(s._id)}>
                      <i className="fas fa-trash" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {s.description && (
                  <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 10, marginBottom: 0 }}>{s.description}</p>
                )}

                {/* Announcements */}
                <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#9ca3af', marginBottom: 8 }}>
                    <i className="fas fa-bullhorn me-2" />Announcements ({s.announcements?.length || 0})
                  </div>

                  {s.announcements?.length > 0 && (
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {[...s.announcements].reverse().map(a => (
                        <li key={a._id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '6px 10px' }}>
                          <span style={{ flex: 1, fontSize: '0.82rem', color: '#e5e7eb' }}>{a.text}</span>
                          <span style={{ fontSize: '0.72rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                            {new Date(a.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', padding: '0 4px', fontSize: '0.85rem', opacity: 0.7 }}
                            onClick={() => deleteAnn(s._id, a._id)} title="Delete announcement">
                            <i className="fas fa-times" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="sa-input"
                      style={{ flex: 1, fontSize: '0.82rem', padding: '6px 10px' }}
                      placeholder="Add announcement…"
                      value={annInputs[s._id] || ''}
                      onChange={e => setAnnInputs(p => ({ ...p, [s._id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAnn(s._id))}
                    />
                    <button className="btn sa-btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}
                      onClick={() => addAnn(s._id)} disabled={annSaving[s._id]}>
                      {annSaving[s._id] ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-plus" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
