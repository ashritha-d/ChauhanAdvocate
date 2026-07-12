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

/* ── Sub-components ── */
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position:'fixed', top:24, right:24, zIndex:9999, background: type==='error'?'#dc3545':'#198754', color:'#fff', padding:'12px 20px', borderRadius:10, boxShadow:'0 4px 20px rgba(0,0,0,.3)', minWidth:260, display:'flex', alignItems:'center', gap:10 }}>
      <i className={type==='error'?'fas fa-times-circle':'fas fa-check-circle'} />
      <span style={{ flex:1 }}>{msg}</span>
      <button onClick={onClose} style={{ background:'none', border:'none', color:'#fff', cursor:'pointer', fontSize:'1.1rem' }}>&times;</button>
    </div>
  );
}

function Confirm({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', zIndex:8000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#1e2235', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, padding:28, maxWidth:380, width:'100%', textAlign:'center' }}>
        <i className="fas fa-exclamation-triangle" style={{ fontSize:'2rem', color:'#f59e0b', marginBottom:14, display:'block' }} />
        <p style={{ color:'#e5e7eb', marginBottom:22 }}>{message}</p>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger btn-sm" onClick={onConfirm}>Confirm</button>
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
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions' | 'auditlog'
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

  const openCreate = () => { setForm(EMPTY_FORM); setEditing(null); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); };
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
    setEditing(s._id); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' });
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
        showToast('Session updated');
      } else {
        const r = await api.post('/live', form);
        setSessions(ss => [r.data.data, ...ss]);
        showToast('Session created');
      }
      setShowForm(false);
    } catch (err) { showToast(err.response?.data?.message || 'Save failed', 'error'); }
    setSaving(false);
  };

  const handleDelete = id => setConfirm({
    message: 'Permanently delete this session?',
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

  const toggleDisplayInUpdates = async (id, val) => {
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
    } catch { showToast('Failed to delete', 'error'); }
  };

  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';
  const fmtTs   = d => d ? new Date(d).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '';

  const pill = (color, label, dot=false) => (
    <span style={{ fontSize:'0.68rem', fontWeight:700, padding:'2px 10px', borderRadius:20, background:`${color}22`, color, border:`1px solid ${color}44`, letterSpacing:1, textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap:5 }}>
      {dot && <span style={{ width:7, height:7, borderRadius:'50%', background:color, display:'inline-block' }} />}
      {label}
    </span>
  );

  /* ── Render ── */
  return (
    <div>
      {toast   && <Toast   msg={toast.msg}   type={toast.type}     onClose={()=>setToast(null)} />}
      {confirm && <Confirm message={confirm.message} onConfirm={confirm.onConfirm} onCancel={()=>setConfirm(null)} />}

      {/* Page Header */}
      <div className="sa-page-header">
        <div>
          <h1 className="sa-page-title">Live Session Management</h1>
          <p className="sa-page-subtitle">Schedule, manage, and broadcast live legal sessions</p>
        </div>
        <button className="btn sa-btn-primary" onClick={openCreate}>
          <i className="fas fa-plus me-2" />New Session
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid rgba(255,255,255,.08)', paddingBottom:0 }}>
        {['sessions','auditlog'].map(tab => (
          <button key={tab} onClick={()=>setActiveTab(tab)}
            style={{ background:'none', border:'none', padding:'10px 18px', cursor:'pointer', fontWeight:600, fontSize:'0.85rem', color: activeTab===tab ? '#C9A84C' : '#9ca3af', borderBottom: activeTab===tab ? '2px solid #C9A84C' : '2px solid transparent', transition:'color .15s', marginBottom:-1 }}>
            {tab==='sessions' ? <><i className="fas fa-video me-2" />Sessions ({sessions.length})</> : <><i className="fas fa-clipboard-list me-2" />Audit Log</>}
          </button>
        ))}
      </div>

      {/* ── Sessions Tab ── */}
      {activeTab === 'sessions' && (
        <>
          {/* Create / Edit Form */}
          {showForm && (
            <div className="sa-card mb-4">
              <div className="sa-card-header">
                <h3 className="sa-card-title">{editing ? 'Edit Session' : 'New Live Session'}</h3>
                <button className="btn btn-sm btn-outline-secondary" onClick={()=>setShowForm(false)}><i className="fas fa-times" /></button>
              </div>
              <div className="sa-card-body">
                <form onSubmit={handleSave}>
                  <div className="row g-3">

                    {/* Title */}
                    <div className="col-12">
                      <label className="sa-label">Session Title *</label>
                      <input className="sa-input" value={form.title} required
                        onChange={e=>f('title',e.target.value)} placeholder="e.g. Legal Rights Workshop" />
                    </div>

                    {/* Date + Times */}
                    <div className="col-md-4">
                      <label className="sa-label">Date *</label>
                      <input type="date" className="sa-input" value={form.date} required onChange={e=>f('date',e.target.value)} />
                    </div>
                    <div className="col-md-3">
                      <label className="sa-label">Start Time</label>
                      <input type="time" className="sa-input" value={form.startTime} onChange={e=>f('startTime',e.target.value)} />
                    </div>
                    <div className="col-md-3">
                      <label className="sa-label">End Time</label>
                      <input type="time" className="sa-input" value={form.endTime} onChange={e=>f('endTime',e.target.value)} />
                    </div>
                    <div className="col-md-2">
                      <label className="sa-label">Time Zone</label>
                      <select className="sa-input" value={form.timezone} onChange={e=>f('timezone',e.target.value)}>
                        {TIMEZONES.map(tz=><option key={tz}>{tz}</option>)}
                      </select>
                    </div>

                    {/* Platform + Meeting URL */}
                    <div className="col-md-4">
                      <label className="sa-label">Platform</label>
                      <select className="sa-input" value={form.platform} onChange={e=>f('platform',e.target.value)}>
                        {PLATFORMS.map(p=><option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="col-md-8">
                      <label className="sa-label">Meeting Link</label>
                      <input className="sa-input" value={form.meetUrl} placeholder="https://meet.google.com/..."
                        onChange={e=>f('meetUrl',e.target.value)} />
                    </div>

                    {/* Speaker + Status */}
                    <div className="col-md-6">
                      <label className="sa-label">Speaker / Host</label>
                      <input className="sa-input" value={form.speaker} placeholder="e.g. Advocate Chauhan"
                        onChange={e=>f('speaker',e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="sa-label">Status</label>
                      <select className="sa-input" value={form.status} onChange={e=>f('status',e.target.value)}>
                        {STATUS_OPTS.map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                    </div>

                    {/* Description */}
                    <div className="col-12">
                      <label className="sa-label">Description</label>
                      <textarea className="sa-input" rows={2} value={form.description}
                        onChange={e=>f('description',e.target.value)} />
                    </div>

                    {/* Agenda */}
                    <div className="col-12">
                      <label className="sa-label">Agenda</label>
                      <textarea className="sa-input" rows={3} value={form.agenda}
                        placeholder="Topics covered, schedule, speakers…"
                        onChange={e=>f('agenda',e.target.value)} />
                    </div>

                    {/* Banner URL */}
                    <div className="col-12">
                      <label className="sa-label">Banner / Thumbnail URL</label>
                      <input className="sa-input" value={form.banner} placeholder="https://…"
                        onChange={e=>f('banner',e.target.value)} />
                    </div>

                    {/* Toggles */}
                    <div className="col-md-6">
                      <label className="sa-label d-flex align-items-center gap-2" style={{ cursor:'pointer' }}>
                        <input type="checkbox" checked={form.isEnabled} onChange={e=>f('isEnabled',e.target.checked)} />
                        Publish (visible to users)
                      </label>
                    </div>
                    <div className="col-md-6">
                      <label className="sa-label d-flex align-items-center gap-2" style={{ cursor:'pointer' }}>
                        <input type="checkbox" checked={form.displayInUpdates} onChange={e=>f('displayInUpdates',e.target.checked)} />
                        Show in Latest Updates section
                      </label>
                    </div>

                    {/* Save */}
                    <div className="col-12 d-flex gap-2 pt-1">
                      <button type="submit" className="btn sa-btn-primary" disabled={saving}>
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
          <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
            <input className="sa-input" style={{ flex:1, minWidth:200, fontSize:'0.85rem' }}
              placeholder="Search sessions…" value={search}
              onChange={e=>setSearch(e.target.value)} />
            <select className="sa-input" style={{ width:160, fontSize:'0.85rem' }}
              value={filterStatus} onChange={e=>setFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              {STATUS_OPTS.map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>

          {/* Sessions list */}
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border sa-spinner" /></div>
          ) : sessions.length === 0 ? (
            <div className="sa-card">
              <div className="sa-card-body text-center py-5" style={{ color:'#6b7280' }}>
                <i className="fas fa-video fa-3x mb-3 d-block" style={{ opacity:.25 }} />
                <p>{search || filterStatus!=='all' ? 'No sessions match your filters.' : 'No sessions yet. Create one to get started.'}</p>
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              {sessions.map(s => (
                <div key={s._id} className="sa-card">
                  <div className="sa-card-body">

                    {/* Top row */}
                    <div style={{ display:'flex', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        {/* Title + badges */}
                        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:6 }}>
                          <span style={{ fontWeight:700, fontSize:'1rem', color:'#f1f5f9' }}>{s.title}</span>
                          {pill(STATUS_COLORS[s.status], STATUS_LABELS[s.status], s.status==='live')}
                          {!s.isEnabled && pill('#374151','Hidden')}
                          {s.displayInUpdates && pill('#059669','In Updates')}
                        </div>

                        {/* Meta row */}
                        <div style={{ display:'flex', gap:14, flexWrap:'wrap', fontSize:'0.78rem', color:'#9ca3af' }}>
                          <span><i className="fas fa-calendar me-1"/>{fmtDate(s.date)}</span>
                          {s.startTime && <span><i className="fas fa-clock me-1"/>{s.startTime}{s.endTime?` – ${s.endTime}`:''} {s.timezone}</span>}
                          {s.speaker   && <span><i className="fas fa-user-tie me-1"/>{s.speaker}</span>}
                          <span><i className={`${PLATFORM_ICONS[s.platform]||'fas fa-video'} me-1`}/>{s.platform}</span>
                        </div>

                        {/* Meet URL */}
                        {s.meetUrl && (
                          <div style={{ marginTop:5 }}>
                            <a href={s.meetUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize:'0.75rem', color:'#60a5fa' }}>
                              <i className="fas fa-link me-1"/>{s.meetUrl}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap', flexShrink:0 }}>
                        {s.status!=='live'      && <button className="btn btn-sm" style={{ background:'#dc354522', color:'#dc3545', border:'1px solid #dc354544', fontSize:'0.7rem' }} onClick={()=>setStatus(s._id,'live')}>Go Live</button>}
                        {s.status!=='upcoming'  && <button className="btn btn-sm" style={{ background:'#f59e0b22', color:'#f59e0b', border:'1px solid #f59e0b44', fontSize:'0.7rem' }} onClick={()=>setStatus(s._id,'upcoming')}>Upcoming</button>}
                        {s.status!=='ended'     && <button className="btn btn-sm" style={{ background:'#6b728022', color:'#9ca3af', border:'1px solid #6b728044', fontSize:'0.7rem' }} onClick={()=>setStatus(s._id,'ended')}>End</button>}
                        {s.status!=='cancelled' && <button className="btn btn-sm" style={{ background:'#37415122', color:'#6b7280', border:'1px solid #37415144', fontSize:'0.7rem' }} onClick={()=>setStatus(s._id,'cancelled')}>Cancel</button>}

                        <button className="btn btn-sm" style={{ background: s.isEnabled?'#22c55e22':'#6b728022', color: s.isEnabled?'#22c55e':'#9ca3af', border:`1px solid ${s.isEnabled?'#22c55e':'#6b7280'}44`, fontSize:'0.7rem' }}
                          onClick={()=>toggleEnabled(s._id,!s.isEnabled)}>
                          {s.isEnabled?'Unpublish':'Publish'}
                        </button>

                        <button className="btn btn-sm" style={{ background: s.displayInUpdates?'#059669':'#6b728022', color: s.displayInUpdates?'#6ee7b7':'#9ca3af', border:`1px solid ${s.displayInUpdates?'#059669':'#6b7280'}44`, fontSize:'0.7rem' }}
                          onClick={()=>toggleDisplayInUpdates(s._id,!s.displayInUpdates)}
                          title="Show/hide in Latest Updates section">
                          <i className="fas fa-newspaper" />
                        </button>

                        <button className="btn btn-sm" style={{ background:'#60a5fa22', color:'#60a5fa', border:'1px solid #60a5fa44', fontSize:'0.7rem' }} onClick={()=>openEdit(s)}>
                          <i className="fas fa-edit"/>
                        </button>
                        <button className="btn btn-sm" style={{ background:'#dc354522', color:'#dc3545', border:'1px solid #dc354544', fontSize:'0.7rem' }} onClick={()=>handleDelete(s._id)}>
                          <i className="fas fa-trash"/>
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    {s.description && <p style={{ fontSize:'0.8rem', color:'#94a3b8', marginTop:8, marginBottom:0 }}>{s.description}</p>}

                    {/* Announcements */}
                    <div style={{ marginTop:14, borderTop:'1px solid rgba(255,255,255,.06)', paddingTop:12 }}>
                      <div style={{ fontSize:'0.76rem', fontWeight:600, color:'#9ca3af', marginBottom:8 }}>
                        <i className="fas fa-bullhorn me-2"/>Announcements ({s.announcements?.length||0})
                      </div>
                      {s.announcements?.length > 0 && (
                        <ul style={{ listStyle:'none', padding:0, margin:'0 0 8px', display:'flex', flexDirection:'column', gap:5 }}>
                          {[...s.announcements].reverse().map(a=>(
                            <li key={a._id} style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,.04)', borderRadius:8, padding:'5px 10px' }}>
                              <span style={{ flex:1, fontSize:'0.8rem', color:'#e5e7eb' }}>{a.text}</span>
                              <span style={{ fontSize:'0.7rem', color:'#6b7280', whiteSpace:'nowrap' }}>{fmtTs(a.createdAt)}</span>
                              <button style={{ background:'none', border:'none', color:'#dc3545', cursor:'pointer', padding:'0 4px', opacity:.7 }} onClick={()=>deleteAnn(s._id,a._id)}>
                                <i className="fas fa-times"/>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div style={{ display:'flex', gap:8 }}>
                        <input className="sa-input" style={{ flex:1, fontSize:'0.8rem', padding:'5px 10px' }}
                          placeholder="Add announcement…"
                          value={annInputs[s._id]||''}
                          onChange={e=>setAnnInputs(p=>({...p,[s._id]:e.target.value}))}
                          onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addAnn(s._id))} />
                        <button className="btn sa-btn-primary btn-sm" style={{ whiteSpace:'nowrap' }}
                          onClick={()=>addAnn(s._id)} disabled={annSaving[s._id]}>
                          {annSaving[s._id]?<i className="fas fa-spinner fa-spin"/>:<i className="fas fa-plus"/>}
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
        <div className="sa-card">
          <div className="sa-card-header">
            <h3 className="sa-card-title">Live Session Audit Log</h3>
            <button className="btn btn-sm btn-outline-secondary" onClick={loadAuditLog} title="Refresh">
              <i className="fas fa-sync-alt"/>
            </button>
          </div>
          <div className="sa-card-body">
            {auditLoading ? (
              <div className="text-center py-4"><div className="spinner-border sa-spinner"/></div>
            ) : auditLog.length === 0 ? (
              <p style={{ color:'#6b7280', textAlign:'center', padding:'30px 0' }}>No audit entries yet.</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {auditLog.map(log=>(
                  <div key={log._id} style={{ display:'flex', alignItems:'center', gap:14, background:'rgba(255,255,255,.03)', borderRadius:8, padding:'10px 14px', borderLeft:`3px solid ${log.action==='CREATE'?'#22c55e':log.action==='DELETE'?'#dc3545':'#f59e0b'}` }}>
                    <span style={{ width:60, fontWeight:700, fontSize:'0.7rem', letterSpacing:1, color: log.action==='CREATE'?'#22c55e':log.action==='DELETE'?'#dc3545':'#f59e0b', textTransform:'uppercase' }}>{log.action}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'0.82rem', color:'#e5e7eb', fontWeight:600 }}>{log.sessionTitle||'Unknown session'}</div>
                      <div style={{ fontSize:'0.72rem', color:'#9ca3af' }}>by {log.adminName} ({log.adminEmail})</div>
                    </div>
                    <span style={{ fontSize:'0.72rem', color:'#6b7280', whiteSpace:'nowrap' }}>{fmtTs(log.createdAt)}</span>
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
