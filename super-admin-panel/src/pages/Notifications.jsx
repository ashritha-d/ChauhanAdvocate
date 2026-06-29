import { useState } from 'react';
import api from '../api/axios';

export default function Notifications() {
  const [tab, setTab]         = useState('send');
  const [form, setForm]       = useState({ title: '', message: '', type: 'info' });
  const [target, setTarget]   = useState('all');
  const [userId, setUserId]   = useState('');
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState(null);

  const handleSend = async e => {
    e.preventDefault();
    if (!form.message.trim()) return setMsg({ type: 'error', text: 'Message is required' });
    setSaving(true);
    setMsg(null);
    try {
      if (target === 'user' && userId) {
        await api.post(`/users/${userId}/notify`, { message: form.message, title: form.title });
      } else {
        setMsg({ type: 'error', text: 'Broadcast notifications require the user website notification system. Enter a specific User ID to send to a single user.' });
        setSaving(false);
        return;
      }
      setMsg({ type: 'success', text: 'Notification sent successfully' });
      setForm({ title: '', message: '', type: 'info' });
      setUserId('');
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'Failed to send' });
    }
    setSaving(false);
  };

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h4 className="sa-page-title"><i className="fas fa-bell me-2"></i>Notification Management</h4>
          <p className="sa-page-subtitle">Send notifications to users and admins</p>
        </div>
      </div>

      <div className="d-flex gap-2 mb-4">
        {[{ id: 'send', label: 'Send Notification', icon: 'fas fa-paper-plane' }, { id: 'info', label: 'Channels', icon: 'fas fa-info-circle' }].map(t => (
          <button key={t.id} className={`btn btn-sm ${tab === t.id ? 'sa-btn-primary' : 'sa-btn-outline'}`} onClick={() => setTab(t.id)}>
            <i className={t.icon + ' me-2'}></i>{t.label}
          </button>
        ))}
      </div>

      {tab === 'send' && (
        <div className="sa-card" style={{ maxWidth: 580 }}>
          <div className="sa-card-header"><span><i className="fas fa-paper-plane me-2"></i>Send Notification</span></div>
          <div className="sa-card-body">
            <form onSubmit={handleSend}>
              {msg && (
                <div style={{ background: msg.type === 'error' ? '#7f1d1d33' : '#065f4633', color: msg.type === 'error' ? '#f87171' : '#34d399', border: `1px solid ${msg.type === 'error' ? '#f8717133' : '#34d39933'}`, borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: '0.85rem' }}>
                  <i className={`fas fa-${msg.type === 'error' ? 'times' : 'check'}-circle me-2`}></i>{msg.text}
                </div>
              )}

              <label className="sa-label">Send To</label>
              <div className="d-flex gap-2 mb-3 flex-wrap">
                {[{ id: 'user', label: 'Specific User' }].map(t => (
                  <button type="button" key={t.id} className={`btn btn-sm ${target === t.id ? 'sa-btn-primary' : 'sa-btn-outline'}`} onClick={() => setTarget(t.id)}>
                    {t.label}
                  </button>
                ))}
              </div>

              {target === 'user' && (
                <div className="mb-3">
                  <label className="sa-label">User ID *</label>
                  <input className="form-control sa-input" value={userId} onChange={e => setUserId(e.target.value)} placeholder="MongoDB User ID (from Users page)" />
                  <div style={{ fontSize: '0.72rem', color: '#4a5568', marginTop: 4 }}>Find the User ID from the Users Management page.</div>
                </div>
              )}

              <div className="mb-3">
                <label className="sa-label">Title (optional)</label>
                <input className="form-control sa-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Notification title" />
              </div>
              <div className="mb-4">
                <label className="sa-label">Message *</label>
                <textarea className="form-control sa-input" rows={4} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Your notification message..." required></textarea>
              </div>

              <button type="submit" className="btn sa-btn-primary" disabled={saving}>
                {saving ? <><i className="fas fa-spinner fa-spin me-2"></i>Sending…</> : <><i className="fas fa-paper-plane me-2"></i>Send Notification</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === 'info' && (
        <div className="sa-card" style={{ maxWidth: 560 }}>
          <div className="sa-card-header"><span><i className="fas fa-broadcast-tower me-2"></i>Available Channels</span></div>
          <div className="sa-card-body p-0">
            {[
              { label: 'In-App Notifications',  status: 'Active',   icon: 'fas fa-bell',         color: '#34d399' },
              { label: 'WhatsApp (Twilio)',      status: 'Active',   icon: 'fab fa-whatsapp',     color: '#34d399' },
              { label: 'Email Notifications',   status: 'Planned',  icon: 'fas fa-envelope',     color: '#fbbf24' },
              { label: 'SMS Notifications',     status: 'Planned',  icon: 'fas fa-sms',          color: '#fbbf24' },
              { label: 'Push Notifications',    status: 'Planned',  icon: 'fas fa-mobile-alt',   color: '#fbbf24' },
              { label: 'Broadcast to All Users','status': 'Planned', icon: 'fas fa-broadcast-tower', color: '#fbbf24' },
            ].map((c, i, arr) => (
              <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', borderBottom: i < arr.length - 1 ? '1px solid #1e2436' : 'none' }}>
                <i className={c.icon} style={{ color: c.color, width: 20, textAlign: 'center' }}></i>
                <div style={{ flex: 1, fontSize: '0.85rem', color: '#e2e8f0' }}>{c.label}</div>
                <span style={{ background: c.color + '22', color: c.color, padding: '2px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700 }}>{c.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
