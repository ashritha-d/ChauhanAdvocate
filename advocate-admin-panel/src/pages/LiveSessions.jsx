import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';

const PLATFORMS = ['Google Meet', 'Zoom', 'Microsoft Teams', 'YouTube Live', 'Webex', 'Other'];
const TIMEZONES = ['IST', 'UTC', 'UTC+5:30', 'EST', 'PST', 'GMT', 'CST', 'Other'];
const STATUS_OPTS = ['upcoming', 'live', 'ended', 'cancelled'];
const STATUS_COLORS = { upcoming: '#f59e0b', live: '#dc3545', ended: '#6b7280', cancelled: '#374151' };
const STATUS_LABELS = { upcoming: 'Upcoming', live: 'Live', ended: 'Ended', cancelled: 'Cancelled' };
const PLATFORM_ICONS = {
  'Google Meet': 'fab fa-google', 'Zoom': 'fas fa-video',
  'Microsoft Teams': 'fab fa-microsoft', 'YouTube Live': 'fab fa-youtube',
  'Webex': 'fas fa-video', 'Other': 'fas fa-video',
};

const EMPTY_FORM = {
  title: '', description: '', speaker: '', agenda: '',
  date: '', startTime: '', endTime: '', timezone: 'IST',
  platform: 'Google Meet', meetUrl: '', status: 'upcoming',
  isEnabled: true, displayInUpdates: true, banner: '',
};

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const bg = type === 'error' ? '#dc3545' : '#198754';
  return (
    <div style={{ position:'fixed', top:24, right:24, zIndex:9999, background:bg, color:'#fff', padding:'12px 20px', borderRadius:10, boxShadow:'0 4px 20px rgba(0,0,0,.25)', minWidth:260, display:'flex', alignItems:'center', gap:10 }}>
      <i className={type==='error'?'fas fa-times-circle':'fas fa-check-circle'} />
      <span style={{ flex:1 }}>{msg}</span>
      <button onClick={onClose} style={{ background:'none', border:'none', color:'#fff', cursor:'pointer', fontSize:'1.1rem' }}>&times;</button>
    </div>
  );
}

function Confirm({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:8000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:12, padding:28, maxWidth:360, width:'100%', textAlign:'center', boxShadow:'0 8px 32px rgba(0,0,0,.15)' }}>
        <i className="fas fa-exclamation-triangle" style={{ fontSize:'2rem', color:'#f59e0b', marginBottom:14, display:'block' }} />
        <p style={{ color:'#374151', marginBottom:22 }}>{message}</p>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger btn-sm" onClick={onConfirm}>Confirm Delete</button>
        </div>
      </div>
    </div>
  );
}

const pill = (color, label, dot=false) => (
  <span style={{ fontSize:'0.68rem', fontWeight:700, padding:'2px 10px', borderRadius:20, background:`${color}22`, color, border:`1px solid ${color}44`, letterSpacing:1, textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap:5 }}>
    {dot && <span style={{ width:7, height:7, borderRadius:'50%', background:color, display:'inline-block' }} />}
    {label}
  </span>
);

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
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('sessions');
  const [auditLog, setAuditLog]   = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const showToast = (msg, type='success') => setToast({ msg, type });

  const load = useCallback(async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (filterStatus !== 'all') params.status = filterStatus;
      const r = await api.get('/live', { params });
      setSessions(r.data.data || []);
    } catch { showToast('Failed to load sessions', 'error'); }
    setLoading(false);
  }, [search, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const loadAuditLog = useCallback(async () => {
    setAuditLoading(true);
    try {
      const r = await api.get('/live/audit-log');
      setAuditLog(r.data.data || []);
    } catch { showToast('Failed to load audit log', 'error'); }
    setAuditLoading(false);
  }, []);

  useEffect(() => { if (activeTab === 'auditlog') loadAuditLog(); }, [activeTab, loadAuditLog]);

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const openCreate = () => {
    setForm(EMPTY_FORM); setEditing(null); setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const openEdit = s => {
    setForm({
      title: s.title||'', description: s.description||'', speaker: s.speaker||'',
      agenda: s.agenda||'', date: s.date?s.date.slice(0,10):'',
      startTime: s.startTime||'', endTime: s.endTime||'',
      timezone: s.timezone||'IST', platform: s.platform||'Google Meet',
      meetUrl: s.meetUrl||'', status: s.status||'upcoming',
      isEnabled: s.isEnabled!==false, displayInUpdates: s.displayInUpdates!==false,
      banner: s.banner||'',
    });
    setEditing(s._id); setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async e => {
    e.preventDefault();
    if (!form.title.trim()) { showToast('Title is required', 'error'); return; }
    if (!form.date)         { showToast('Date is required', 'error'); return; }
    setSaving(true);
    try {
      if (editing) {
        const r = await api.put(`/live/${editing}`, form);
        setSessions(ss => ss.map(s => s._id===editing ? r.data.data : s));
        showToast('Session updated successfully');
      } else {
        const r = await api.post('/live', form);
        setSessions(ss => [r.data.data, ...ss]);
        showToast('Session created successfully');
      }
      setShowForm(false);
    } catch (err) { showToast(err.response?.data?.message || 'Save failed', 'error'); }
    setSaving(false);
  };

  const handleDelete = id => setConfirm({
    message: 'Permanently delete this live session?',
    onConfirm: async () => {
      setConfirm(null);
      try {
        await api.delete(`/live/${id}`);
        setSessions(ss => ss.filter(s => s._id!==id));
        showToast('Session deleted');
      } catch { showToast('Delete failed', 'error'); }
    },
  });

  const setStatus = async (id, status) => {
    try {
      const r = await api.put(`/live/${id}`, { status });
      setSessions(ss => ss.map(s => s._id===id ? r.data.data : s));
      showToast(`Status → ${STATUS_LABELS[status]}`);
    } catch { showToast('Status update failed', 'error'); }
  };

  const toggleEnabled = async (id, val) => {
    try {
      const r = await api.put(`/live/${id}`, { isEnabled: val });
      setSessions(ss => ss.map(s => s._id===id ? r.data.data : s));
    } catch { showToast('Toggle failed', 'error'); }
  };

  const toggleUpdates = async (id, val) => {
    try {
      const r = await api.put(`/live/${id}`, { displayInUpdates: val });
      setSessions(ss => ss.map(s => s._id===id ? r.data.data : s));
    } catch { showToast('Toggle failed', 'error'); }
  };

  const addAnn = async id => {
    const text = (annInputs[id]||'').trim();
    if (!text) return;
    setAnnSaving(p => ({ ...p, [id]: true }));
    try {
      const r = await api.post(`/live/${id}/announcements`, { text });
      setSessions(ss => ss.map(s => s._id===id ? r.data.data : s));
      setAnnInputs(p => ({ ...p, [id]: '' }));
    } catch { showToast('Failed to add announcement', 'error'); }
    setAnnSaving(p => ({ ...p, [id]: false }));
  };

  const deleteAnn = async (sid, annId) => {
    try {
      const r = await api.delete(`/live/${sid}/announcements/${annId}`);
      setSessions(ss => ss.map(s => s._id===sid ? r.data.data : s));
    } catch { showToast('Failed to delete announcement', 'error'); }
  };

  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';
  const fmtTs   = d => d ? new Date(d).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '';

  return (
    <div>
      {toast   && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
      {confirm && <Confirm message={confirm.message} onConfirm={confirm.onConfirm} onCancel={()=>setConfirm(null)} />}

      {/* Header */}
      <div className="page-header d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="page-title mb-1">Live Sessions</h1>
          <p className="text-muted mb-0" style={{ fontSize:'0.85rem' }}>Schedule and manage live legal sessions</p>
        </div>
        <button className="btn btn-gold" onClick={openCreate}>
          <i className="fas fa-plus me-2" />New Session
        </button>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${activeTab==='sessions'?'active':''}`} onClick={()=>setActiveTab('sessions')}>
            <i className="fas fa-video me-2" />Sessions ({sessions.length})
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab==='auditlog'?'active':''}`} onClick={()=>setActiveTab('auditlog')}>
            <i className="fas fa-clipboard-list me-2" />Audit Log
          </button>
        </li>
      </ul>

      {/* ── Sessions Tab ── */}
      {activeTab === 'sessions' && (
        <>
          {/* Form */}
          {showForm && (
            <div className="card mb-4 shadow-sm">
              <div className="card-header d-flex align-items-center justify-content-between">
                <h5 className="mb-0"><i className="fas fa-video me-2 text-gold" />{editing ? 'Edit Session' : 'New Live Session'}</h5>
                <button className="btn btn-sm btn-outline-secondary" onClick={()=>setShowForm(false)}><i className="fas fa-times" /></button>
              </div>
              <div className="card-body">
                <form onSubmit={handleSave}>
                  <div className="row g-3">

                    <div className="col-12">
                      <label className="form-label fw-semibold">Session Title *</label>
                      <input className="form-control" value={form.title} required
                        onChange={e=>f('title',e.target.value)} placeholder="e.g. Legal Rights Workshop" />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Date *</label>
                      <input type="date" className="form-control" value={form.date} required onChange={e=>f('date',e.target.value)} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold">Start Time</label>
                      <input type="time" className="form-control" value={form.startTime} onChange={e=>f('startTime',e.target.value)} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold">End Time</label>
                      <input type="time" className="form-control" value={form.endTime} onChange={e=>f('endTime',e.target.value)} />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label fw-semibold">Timezone</label>
                      <select className="form-select" value={form.timezone} onChange={e=>f('timezone',e.target.value)}>
                        {TIMEZONES.map(tz=><option key={tz}>{tz}</option>)}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Platform</label>
                      <select className="form-select" value={form.platform} onChange={e=>f('platform',e.target.value)}>
                        {PLATFORMS.map(p=><option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="col-md-8">
                      <label className="form-label fw-semibold">Meeting Link</label>
                      <input className="form-control" value={form.meetUrl}
                        placeholder="https://meet.google.com/…"
                        onChange={e=>f('meetUrl',e.target.value)} />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Speaker / Host</label>
                      <input className="form-control" value={form.speaker}
                        placeholder="e.g. Advocate Chauhan"
                        onChange={e=>f('speaker',e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Status</label>
                      <select className="form-select" value={form.status} onChange={e=>f('status',e.target.value)}>
                        {STATUS_OPTS.map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Description</label>
                      <textarea className="form-control" rows={2} value={form.description}
                        onChange={e=>f('description',e.target.value)} />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Agenda</label>
                      <textarea className="form-control" rows={3} value={form.agenda}
                        placeholder="Topics covered, schedule, speakers…"
                        onChange={e=>f('agenda',e.target.value)} />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Banner / Thumbnail URL</label>
                      <input className="form-control" value={form.banner}
                        placeholder="https://…"
                        onChange={e=>f('banner',e.target.value)} />
                    </div>

                    <div className="col-md-6">
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" id="chkEnabled" checked={form.isEnabled} onChange={e=>f('isEnabled',e.target.checked)} />
                        <label className="form-check-label fw-semibold" htmlFor="chkEnabled">Publish (visible to users)</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" id="chkUpdates" checked={form.displayInUpdates} onChange={e=>f('displayInUpdates',e.target.checked)} />
                        <label className="form-check-label fw-semibold" htmlFor="chkUpdates">Show in Latest Updates section</label>
                      </div>
                    </div>

                    <div className="col-12 d-flex gap-2 pt-1">
                      <button type="submit" className="btn btn-gold" disabled={saving}>
                        {saving ? <><i className="fas fa-spinner fa-spin me-2"/>Saving…</> : <><i className="fas fa-save me-2"/>Save Session</>}
                      </button>
                      <button type="button" className="btn btn-outline-secondary" onClick={()=>setShowForm(false)}>Cancel</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Search + Filter */}
          <div className="d-flex gap-2 mb-3 flex-wrap">
            <input className="form-control" style={{ maxWidth:280 }}
              placeholder="Search sessions…" value={search}
              onChange={e=>setSearch(e.target.value)} />
            <select className="form-select" style={{ maxWidth:170 }}
              value={filterStatus} onChange={e=>setFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              {STATUS_OPTS.map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>

          {/* List */}
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-warning" /></div>
          ) : sessions.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5 text-muted">
                <i className="fas fa-video fa-3x mb-3 d-block opacity-25" />
                {search || filterStatus!=='all' ? 'No sessions match your filters.' : 'No sessions yet. Click "+ New Session" to create one.'}
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {sessions.map(s => (
                <div key={s._id} className="card shadow-sm">
                  <div className="card-body">

                    {/* Top */}
                    <div className="d-flex align-items-start gap-3 flex-wrap">
                      <div style={{ flex:1, minWidth:0 }}>
                        <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                          <span className="fw-bold fs-6">{s.title}</span>
                          {pill(STATUS_COLORS[s.status], STATUS_LABELS[s.status], s.status==='live')}
                          {!s.isEnabled && pill('#6b7280','Hidden')}
                          {s.displayInUpdates && pill('#059669','In Updates')}
                        </div>
                        <div className="d-flex gap-3 flex-wrap text-muted" style={{ fontSize:'0.78rem' }}>
                          <span><i className="fas fa-calendar me-1"/>{fmtDate(s.date)}</span>
                          {s.startTime && <span><i className="fas fa-clock me-1"/>{s.startTime}{s.endTime?` – ${s.endTime}`:''} {s.timezone}</span>}
                          {s.speaker   && <span><i className="fas fa-user-tie me-1"/>{s.speaker}</span>}
                          <span><i className={`${PLATFORM_ICONS[s.platform]||'fas fa-video'} me-1`}/>{s.platform}</span>
                        </div>
                        {s.meetUrl && (
                          <a href={s.meetUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize:'0.75rem', color:'#0d6efd' }} className="d-block mt-1">
                            <i className="fas fa-link me-1"/>{s.meetUrl}
                          </a>
                        )}
                        {s.description && <p className="text-muted mb-0 mt-1" style={{ fontSize:'0.8rem' }}>{s.description}</p>}
                      </div>

                      {/* Actions */}
                      <div className="d-flex gap-1 flex-wrap flex-shrink-0">
                        {s.status!=='live'      && <button className="btn btn-sm btn-outline-danger"    onClick={()=>setStatus(s._id,'live')}     style={{ fontSize:'0.7rem' }}>Go Live</button>}
                        {s.status!=='upcoming'  && <button className="btn btn-sm btn-outline-warning"   onClick={()=>setStatus(s._id,'upcoming')} style={{ fontSize:'0.7rem' }}>Upcoming</button>}
                        {s.status!=='ended'     && <button className="btn btn-sm btn-outline-secondary" onClick={()=>setStatus(s._id,'ended')}    style={{ fontSize:'0.7rem' }}>End</button>}
                        {s.status!=='cancelled' && <button className="btn btn-sm btn-outline-secondary" onClick={()=>setStatus(s._id,'cancelled')} style={{ fontSize:'0.7rem' }}>Cancel</button>}

                        <button className={`btn btn-sm ${s.isEnabled?'btn-success':'btn-outline-secondary'}`}
                          onClick={()=>toggleEnabled(s._id,!s.isEnabled)} style={{ fontSize:'0.7rem' }}
                          title={s.isEnabled?'Click to unpublish':'Click to publish'}>
                          {s.isEnabled?'Published':'Publish'}
                        </button>

                        <button className={`btn btn-sm ${s.displayInUpdates?'btn-outline-success':'btn-outline-secondary'}`}
                          onClick={()=>toggleUpdates(s._id,!s.displayInUpdates)} style={{ fontSize:'0.7rem' }}
                          title="Toggle Latest Updates visibility">
                          <i className="fas fa-newspaper" />
                        </button>

                        <button className="btn btn-sm btn-outline-primary" onClick={()=>openEdit(s)} style={{ fontSize:'0.7rem' }}>
                          <i className="fas fa-edit" />
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={()=>handleDelete(s._id)} style={{ fontSize:'0.7rem' }}>
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    </div>

                    {/* Announcements */}
                    <div className="mt-3 pt-3 border-top">
                      <div className="text-muted mb-2" style={{ fontSize:'0.76rem', fontWeight:600 }}>
                        <i className="fas fa-bullhorn me-2"/>Announcements ({s.announcements?.length||0})
                      </div>
                      {s.announcements?.length > 0 && (
                        <ul className="list-unstyled mb-2">
                          {[...s.announcements].reverse().map(a => (
                            <li key={a._id} className="d-flex align-items-center gap-2 p-2 rounded mb-1" style={{ background:'#f8f9fa' }}>
                              <span style={{ flex:1, fontSize:'0.8rem' }}>{a.text}</span>
                              <span className="text-muted" style={{ fontSize:'0.7rem', whiteSpace:'nowrap' }}>{fmtTs(a.createdAt)}</span>
                              <button className="btn btn-sm btn-link text-danger p-0" onClick={()=>deleteAnn(s._id,a._id)}>
                                <i className="fas fa-times"/>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="d-flex gap-2">
                        <input className="form-control form-control-sm" style={{ maxWidth:360 }}
                          placeholder="Add announcement…"
                          value={annInputs[s._id]||''}
                          onChange={e=>setAnnInputs(p=>({...p,[s._id]:e.target.value}))}
                          onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addAnn(s._id))} />
                        <button className="btn btn-sm btn-gold" onClick={()=>addAnn(s._id)} disabled={annSaving[s._id]}>
                          {annSaving[s._id]?<i className="fas fa-spinner fa-spin"/>:'Add'}
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Audit Log Tab ── */}
      {activeTab === 'auditlog' && (
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h5 className="mb-0"><i className="fas fa-clipboard-list me-2 text-gold"/>Audit Log</h5>
            <button className="btn btn-sm btn-outline-secondary" onClick={loadAuditLog}><i className="fas fa-sync-alt"/></button>
          </div>
          <div className="card-body">
            {auditLoading ? (
              <div className="text-center py-4"><div className="spinner-border text-warning"/></div>
            ) : auditLog.length === 0 ? (
              <p className="text-muted text-center py-4 mb-0">No audit entries yet.</p>
            ) : (
              <div className="d-flex flex-column gap-2">
                {auditLog.map(log=>(
                  <div key={log._id} className="d-flex align-items-center gap-3 p-2 rounded"
                    style={{ background:'#f8f9fa', borderLeft:`4px solid ${log.action==='CREATE'?'#198754':log.action==='DELETE'?'#dc3545':'#f59e0b'}` }}>
                    <span style={{ width:60, fontWeight:700, fontSize:'0.7rem', letterSpacing:1, color: log.action==='CREATE'?'#198754':log.action==='DELETE'?'#dc3545':'#f59e0b', textTransform:'uppercase' }}>{log.action}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'0.82rem', fontWeight:600 }}>{log.sessionTitle||'Unknown session'}</div>
                      <div className="text-muted" style={{ fontSize:'0.72rem' }}>by {log.adminName} ({log.adminEmail})</div>
                    </div>
                    <span className="text-muted" style={{ fontSize:'0.72rem', whiteSpace:'nowrap' }}>{fmtTs(log.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
