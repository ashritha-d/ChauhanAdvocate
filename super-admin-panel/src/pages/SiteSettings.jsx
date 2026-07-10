import { useEffect, useRef, useState } from 'react';
import api from '../api/axios';

const GROUPS = ['general', 'hero', 'advocate', 'about', 'contact', 'social', 'seo', 'payment'];

const GROUP_LABELS = { general: 'General', hero: 'Hero Section', advocate: 'Advocate Profile', about: 'About', contact: 'Contact', social: 'Social Media', seo: 'SEO', payment: 'Payment' };
const GROUP_ICONS  = { general: 'fas fa-cog', hero: 'fas fa-image', advocate: 'fas fa-user-tie', about: 'fas fa-info-circle', contact: 'fas fa-phone', social: 'fas fa-share-alt', seo: 'fas fa-search', payment: 'fas fa-credit-card' };

export default function SiteSettings() {
  const [settings, setSettings]       = useState({});
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [activeGroup, setActiveGroup] = useState('general');
  const [changes, setChanges]         = useState({});
  const [fileChanges, setFileChanges] = useState({});
  const [saved, setSaved]             = useState(false);
  const fileRefs = useRef({});

  useEffect(() => {
    api.get('/site-settings/admin/all').then(r => {
      const map = {};
      (r.data.data || r.data || []).forEach(s => { map[s.key] = s; });
      setSettings(map);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleChange = (key, value) => {
    setChanges(c => ({ ...c, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upload any image files first
      const fileKeys = Object.keys(fileChanges);
      const uploadedUrls = {};
      for (const key of fileKeys) {
        const fd = new FormData();
        fd.append('file', fileChanges[key]);
        const r = await api.post('/site-settings/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (r.data.url) uploadedUrls[key] = r.data.url;
      }

      const allChanges = { ...changes, ...uploadedUrls };
      const payload = Object.entries(allChanges).map(([key, value]) => ({ key, value }));
      if (payload.length) await api.put('/site-settings', { settings: payload });

      setSettings(s => {
        const updated = { ...s };
        Object.entries(allChanges).forEach(([key, value]) => {
          if (updated[key]) updated[key] = { ...updated[key], value };
        });
        return updated;
      });
      setChanges({});
      setFileChanges({});
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  };

  const groupSettings = Object.values(settings).filter(s => s.group === activeGroup);
  const getValue = (s) => changes[s.key] !== undefined ? changes[s.key] : (s.value || '');

  if (loading) return <div className="text-center py-5"><div className="spinner-border sa-spinner"></div></div>;

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h4 className="sa-page-title"><i className="fas fa-cog me-2"></i>Site Settings</h4>
          <p className="sa-page-subtitle">Configure all website settings — name, contact, social, SEO, and more</p>
        </div>
        <button className="btn sa-btn-primary" onClick={handleSave} disabled={saving || (Object.keys(changes).length === 0 && Object.keys(fileChanges).length === 0)}>
          {saving ? <><i className="fas fa-spinner fa-spin me-2"></i>Saving…</> : saved ? <><i className="fas fa-check me-2"></i>Saved!</> : <><i className="fas fa-save me-2"></i>Save Changes {Object.keys(changes).length > 0 && `(${Object.keys(changes).length})`}</>}
        </button>
      </div>

      <div className="row g-4">
        {/* Group sidebar */}
        <div className="col-lg-3">
          <div className="sa-card">
            <div className="sa-card-body p-2">
              {GROUPS.map(g => (
                <button key={g} className={`sa-nav-item w-100 ${activeGroup === g ? 'active' : ''}`} style={{ marginBottom: 2 }} onClick={() => setActiveGroup(g)}>
                  <i className={GROUP_ICONS[g]}></i>
                  <span>{GROUP_LABELS[g]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Settings fields */}
        <div className="col-lg-9">
          <div className="sa-card">
            <div className="sa-card-header">
              <span><i className={GROUP_ICONS[activeGroup] + ' me-2'}></i>{GROUP_LABELS[activeGroup]} Settings</span>
            </div>
            <div className="sa-card-body">
              {groupSettings.length === 0 ? (
                <div className="text-center py-4" style={{ color: '#6b7280' }}>No settings in this group</div>
              ) : (
                <div className="row g-3">
                  {groupSettings.map(s => (
                    <div key={s.key} className={s.type === 'textarea' ? 'col-12' : 'col-md-6'}>
                      <label className="sa-label">{s.label || s.key}</label>
                      {s.type === 'textarea' ? (
                        <textarea className="form-control sa-input" rows={3} value={getValue(s)} onChange={e => handleChange(s.key, e.target.value)} />
                      ) : s.type === 'image' ? (
                        <div>
                          <input
                            type="file" accept="image/*"
                            className="form-control sa-input mb-2"
                            ref={el => fileRefs.current[s.key] = el}
                            onChange={e => {
                              const f = e.target.files[0];
                              if (f) setFileChanges(c => ({ ...c, [s.key]: f }));
                            }}
                          />
                          {fileChanges[s.key] && (
                            <div style={{ fontSize: '0.75rem', color: '#34d399', marginBottom: 6 }}>
                              <i className="fas fa-check-circle me-1"></i>{fileChanges[s.key].name} selected
                            </div>
                          )}
                          {getValue(s) && (
                            <img src={getValue(s)} alt="" style={{ height: 70, borderRadius: 8, objectFit: 'cover', border: '1px solid #2d3748' }} onError={e => e.target.style.display = 'none'} />
                          )}
                        </div>
                      ) : s.type === 'url' ? (
                        <div>
                          <input className="form-control sa-input" type="text" value={getValue(s)} onChange={e => handleChange(s.key, e.target.value)} placeholder="URL or path" />
                        </div>
                      ) : (
                        <input className="form-control sa-input" type={s.type === 'email' ? 'email' : s.type === 'phone' ? 'tel' : 'text'} value={getValue(s)} onChange={e => handleChange(s.key, e.target.value)} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
