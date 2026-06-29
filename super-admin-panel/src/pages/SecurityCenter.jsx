import { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { safeStorage } from '../api/axios';

export default function SecurityCenter() {
  const { admin } = useAuth();
  const [tab, setTab]       = useState('password');
  const [form, setForm]     = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState(null);

  const handleChangePassword = async e => {
    e.preventDefault();
    setMsg(null);
    if (form.newPassword !== form.confirmPassword) return setMsg({ type: 'error', text: 'New passwords do not match' });
    if (form.newPassword.length < 6) return setMsg({ type: 'error', text: 'Password must be at least 6 characters' });
    setSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setMsg({ type: 'success', text: 'Password changed successfully' });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'Failed to change password' });
    }
    setSaving(false);
  };

  const TABS = [
    { id: 'password', label: 'Change Password', icon: 'fas fa-key' },
    { id: 'info',     label: 'Security Info',   icon: 'fas fa-info-circle' },
    { id: 'sessions', label: 'Session',         icon: 'fas fa-desktop' },
  ];

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h4 className="sa-page-title"><i className="fas fa-shield-alt me-2"></i>Security Center</h4>
          <p className="sa-page-subtitle">Manage your password, session, and security settings</p>
        </div>
        <div className="sa-badge-superadmin"><i className="fas fa-lock me-1"></i>Owner Account</div>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} className={`btn btn-sm ${tab === t.id ? 'sa-btn-primary' : 'sa-btn-outline'}`} onClick={() => setTab(t.id)}>
            <i className={t.icon + ' me-2'}></i>{t.label}
          </button>
        ))}
      </div>

      {/* Change Password */}
      {tab === 'password' && (
        <div className="sa-card" style={{ maxWidth: 520 }}>
          <div className="sa-card-header"><span><i className="fas fa-key me-2"></i>Change Password</span></div>
          <div className="sa-card-body">
            <form onSubmit={handleChangePassword}>
              {msg && (
                <div style={{ background: msg.type === 'error' ? '#7f1d1d33' : '#065f4633', color: msg.type === 'error' ? '#f87171' : '#34d399', border: `1px solid ${msg.type === 'error' ? '#f8717133' : '#34d39933'}`, borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: '0.85rem' }}>
                  <i className={`fas fa-${msg.type === 'error' ? 'times' : 'check'}-circle me-2`}></i>{msg.text}
                </div>
              )}
              <div className="mb-3">
                <label className="sa-label">Current Password *</label>
                <input type="password" className="form-control sa-input" value={form.currentPassword} onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))} required />
              </div>
              <div className="mb-3">
                <label className="sa-label">New Password *</label>
                <input type="password" className="form-control sa-input" value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="Min 6 characters" required />
              </div>
              <div className="mb-4">
                <label className="sa-label">Confirm New Password *</label>
                <input type="password" className="form-control sa-input" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} required />
              </div>
              <button type="submit" className="btn sa-btn-primary" disabled={saving}>
                {saving ? <><i className="fas fa-spinner fa-spin me-2"></i>Changing…</> : <><i className="fas fa-save me-2"></i>Change Password</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Security Info */}
      {tab === 'info' && (
        <div className="sa-card" style={{ maxWidth: 560 }}>
          <div className="sa-card-header"><span><i className="fas fa-info-circle me-2"></i>Account Security Info</span></div>
          <div className="sa-card-body p-0">
            {[
              { label: 'Name',          value: admin?.name,                  icon: 'fas fa-user' },
              { label: 'Email',         value: admin?.email,                 icon: 'fas fa-envelope' },
              { label: 'Role',          value: 'Super Admin',                icon: 'fas fa-user-shield', gold: true },
              { label: 'Account ID',   value: admin?._id,                   icon: 'fas fa-fingerprint', mono: true },
              { label: 'Last Login',    value: admin?.lastLogin ? new Date(admin.lastLogin).toLocaleString('en-IN') : 'N/A', icon: 'fas fa-clock' },
              { label: 'Last Login IP', value: admin?.lastLoginIp || 'N/A', icon: 'fas fa-map-marker-alt', mono: true },
              { label: 'Status',        value: admin?.isActive ? 'Active' : 'Inactive', icon: 'fas fa-check-circle', green: admin?.isActive },
            ].map((item, i, arr) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', borderBottom: i < arr.length - 1 ? '1px solid #1e2436' : 'none' }}>
                <i className={item.icon} style={{ color: '#C9A84C', width: 18, textAlign: 'center' }}></i>
                <div style={{ color: '#6b7280', fontSize: '0.82rem', width: 120 }}>{item.label}</div>
                <div style={{ color: item.gold ? '#C9A84C' : item.green ? '#34d399' : '#e2e8f0', fontSize: '0.85rem', fontWeight: 600, fontFamily: item.mono ? 'monospace' : 'inherit' }}>
                  {item.value || '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session */}
      {tab === 'sessions' && (
        <div className="sa-card" style={{ maxWidth: 520 }}>
          <div className="sa-card-header"><span><i className="fas fa-desktop me-2"></i>Current Session</span></div>
          <div className="sa-card-body">
            <div style={{ background: '#065f4622', border: '1px solid #34d39933', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }}></div>
                <span style={{ color: '#34d399', fontWeight: 600, fontSize: '0.88rem' }}>Session Active</span>
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Token stored in browser localStorage. Expires in 7 days or on logout.</div>
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.82rem', marginBottom: 16 }}>
              <i className="fas fa-info-circle me-2" style={{ color: '#60a5fa' }}></i>
              2FA and multi-session management coming in a future update.
            </div>
            <button className="btn" style={{ background: '#7f1d1d33', color: '#f87171', border: '1px solid #f8717133', borderRadius: 8, fontWeight: 600 }}
              onClick={() => { safeStorage('remove', 'superAdminToken'); safeStorage('remove', 'superAdminUser'); window.location.reload(); }}>
              <i className="fas fa-sign-out-alt me-2"></i>Force Logout (Clear Session)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
