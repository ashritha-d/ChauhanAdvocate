import { useEffect, useState } from 'react';
import api from '../api/axios';

const FEATURES = [
  { key: 'bookingSystem',    label: 'Booking System',     desc: 'Allow users to book appointments',       icon: 'fas fa-calendar-alt', group: 'Core' },
  { key: 'paymentModule',    label: 'Payment Module',     desc: 'Enable UPI/QR payment submissions',      icon: 'fas fa-credit-card',  group: 'Core' },
  { key: 'userRegistration', label: 'User Registration',  desc: 'Allow new users to register',            icon: 'fas fa-user-plus',    group: 'Core' },
  { key: 'userLogin',        label: 'User Login',         desc: 'Allow existing users to log in',         icon: 'fas fa-sign-in-alt',  group: 'Core' },
  { key: 'booksModule',      label: 'Books Module',       desc: 'Show books section on website',          icon: 'fas fa-book',         group: 'Content' },
  { key: 'magazinesModule',  label: 'Magazines Module',   desc: 'Show magazines section on website',      icon: 'fas fa-newspaper',    group: 'Content' },
  { key: 'draftsModule',     label: 'Drafts Module',      desc: 'Show legal drafts section on website',   icon: 'fas fa-file-alt',     group: 'Content' },
  { key: 'youtubeModule',    label: 'YouTube Module',     desc: 'Show YouTube videos on website',         icon: 'fab fa-youtube',      group: 'Content' },
  { key: 'contactForm',      label: 'Contact Form',       desc: 'Show contact form on website',           icon: 'fas fa-envelope',     group: 'Content' },
  { key: 'maintenanceMode',  label: 'Maintenance Mode',   desc: 'Put website into maintenance mode',      icon: 'fas fa-tools',        group: 'System', danger: true },
];

function Toggle({ checked, onChange, danger }) {
  return (
    <div onClick={onChange} style={{ width: 48, height: 26, borderRadius: 13, background: checked ? (danger ? '#dc3545' : '#C9A84C') : '#2d3748', cursor: 'pointer', position: 'relative', transition: 'background 0.25s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: checked ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }}></div>
    </div>
  );
}

export default function FeatureToggles() {
  const [features, setFeatures] = useState({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [confirmKey, setConfirmKey] = useState(null);

  useEffect(() => {
    api.get('/super-admin/feature-toggles').then(r => setFeatures(r.data.data || {})).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleToggle = (key) => {
    const feat = FEATURES.find(f => f.key === key);
    if (feat?.danger && !features[key]) {
      setConfirmKey(key);
      return;
    }
    setFeatures(f => ({ ...f, [key]: !f[key] }));
  };

  const confirmToggle = () => {
    setFeatures(f => ({ ...f, [confirmKey]: !f[confirmKey] }));
    setConfirmKey(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/super-admin/feature-toggles', features);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  };

  const groups = [...new Set(FEATURES.map(f => f.group))];

  if (loading) return <div className="text-center py-5"><div className="spinner-border sa-spinner"></div></div>;

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h4 className="sa-page-title"><i className="fas fa-toggle-on me-2"></i>Feature Toggles</h4>
          <p className="sa-page-subtitle">Enable or disable features instantly — no code changes required</p>
        </div>
        <button className="sa-btn-primary btn" onClick={handleSave} disabled={saving}>
          {saving ? <><i className="fas fa-spinner fa-spin me-2"></i>Saving…</> : saved ? <><i className="fas fa-check me-2"></i>Saved!</> : <><i className="fas fa-save me-2"></i>Save Changes</>}
        </button>
      </div>

      {groups.map(group => (
        <div key={group} className="mb-4">
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', color: '#4a5568', textTransform: 'uppercase', marginBottom: 12 }}>{group}</div>
          <div className="sa-card">
            <div className="sa-card-body p-0">
              {FEATURES.filter(f => f.group === group).map((feat, i, arr) => (
                <div key={feat.key} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px', borderBottom: i < arr.length - 1 ? '1px solid #1e2436' : 'none' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: (features[feat.key] ? (feat.danger ? '#dc354522' : '#C9A84C22') : '#1e243622'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={feat.icon} style={{ color: features[feat.key] ? (feat.danger ? '#dc3545' : '#C9A84C') : '#4a5568', fontSize: '0.95rem' }}></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#e2e8f0' }}>{feat.label}</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>{feat.desc}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '0.75rem', color: features[feat.key] ? (feat.danger ? '#f87171' : '#34d399') : '#6b7280', fontWeight: 600 }}>
                      {features[feat.key] ? (feat.danger ? 'ON (Danger!)' : 'Enabled') : 'Disabled'}
                    </span>
                    <Toggle checked={!!features[feat.key]} onChange={() => handleToggle(feat.key)} danger={feat.danger} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Confirm danger modal */}
      {confirmKey && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
            <div className="modal-content sa-modal">
              <div className="modal-header sa-modal-header border-0">
                <h5 className="modal-title fw-bold" style={{ color: '#f87171' }}><i className="fas fa-exclamation-triangle me-2"></i>Enable Maintenance Mode?</h5>
                <button className="btn-close btn-close-white" onClick={() => setConfirmKey(null)}></button>
              </div>
              <div className="modal-body sa-modal-body">
                <p style={{ color: '#9ca3af' }}>This will put the website into maintenance mode. Users will see a maintenance message instead of the website content.</p>
                <p style={{ color: '#f87171', fontSize: '0.85rem' }}>Make sure to save changes after confirming.</p>
              </div>
              <div className="modal-footer sa-modal-footer border-0">
                <button className="btn sa-btn-outline" onClick={() => setConfirmKey(null)}>Cancel</button>
                <button className="btn" style={{ background: '#dc3545', color: '#fff', fontWeight: 600 }} onClick={confirmToggle}>Enable Maintenance</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
