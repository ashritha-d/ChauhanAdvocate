import { useState } from 'react';
import { changePassword, updateProfile } from '../api';
import { safeStorage } from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { admin, setAdmin } = useAuth();
  const [nameForm, setNameForm] = useState({ name: admin?.name || '' });
  const [pwdForm, setPwdForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [nameMsg, setNameMsg] = useState(null);
  const [pwdMsg, setPwdMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  const handleName = async e => {
    e.preventDefault(); setSaving(true); setNameMsg(null);
    try {
      const r = await updateProfile({ name: nameForm.name });
      if (r.data.success) {
        setAdmin(r.data.admin);
        safeStorage('set', 'adminUser', JSON.stringify(r.data.admin));
        setNameMsg({ type:'success', text:'Profile updated!' });
      }
    } catch (err) { setNameMsg({ type:'danger', text: err.response?.data?.message || 'Update failed' }); }
    setSaving(false);
  };

  const handlePwd = async e => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdMsg({ type:'danger', text:'New passwords do not match' }); return;
    }
    if (pwdForm.newPassword.length < 6) {
      setPwdMsg({ type:'danger', text:'Password must be at least 6 characters' }); return;
    }
    setChangingPwd(true); setPwdMsg(null);
    try {
      const r = await changePassword({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      if (r.data.success) {
        setPwdMsg({ type:'success', text:'Password changed successfully!' });
        setPwdForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
      }
    } catch (err) { setPwdMsg({ type:'danger', text: err.response?.data?.message || 'Change failed' }); }
    setChangingPwd(false);
  };

  return (
    <div className="row g-4">
      <div className="col-lg-6">
        <div className="page-card">
          <div className="page-card-header"><h6 className="mb-0 fw-bold">Profile Information</h6></div>
          <div className="page-card-body">
            <div className="text-center mb-4">
              <div className="admin-avatar mx-auto mb-2" style={{ width:72, height:72, fontSize:'2rem' }}>
                {(admin?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="fw-bold">{admin?.name}</div>
              <div className="text-muted small">{admin?.email}</div>
              <span className="badge bg-warning text-dark mt-1">{admin?.role}</span>
            </div>
            {nameMsg && <div className={`alert alert-${nameMsg.type} py-2`}>{nameMsg.text}</div>}
            <form onSubmit={handleName}>
              <div className="mb-3">
                <label className="form-label">Display Name</label>
                <input className="form-control" value={nameForm.name} onChange={e => setNameForm({ name: e.target.value })} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Email Address</label>
                <input className="form-control" value={admin?.email || ''} disabled />
                <small className="text-muted">Email cannot be changed.</small>
              </div>
              <button type="submit" className="btn btn-gold w-100" disabled={saving}>
                {saving ? <><i className="fas fa-spinner fa-spin me-1"></i>Saving...</> : 'Update Profile'}
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="col-lg-6">
        <div className="page-card">
          <div className="page-card-header"><h6 className="mb-0 fw-bold">Change Password</h6></div>
          <div className="page-card-body">
            {pwdMsg && <div className={`alert alert-${pwdMsg.type} py-2`}>{pwdMsg.text}</div>}
            <form onSubmit={handlePwd}>
              <div className="mb-3">
                <label className="form-label">Current Password</label>
                <input type="password" className="form-control" value={pwdForm.currentPassword} onChange={e => setPwdForm(f => ({ ...f, currentPassword: e.target.value }))} required />
              </div>
              <div className="mb-3">
                <label className="form-label">New Password</label>
                <input type="password" className="form-control" value={pwdForm.newPassword} onChange={e => setPwdForm(f => ({ ...f, newPassword: e.target.value }))} required minLength={6} />
              </div>
              <div className="mb-3">
                <label className="form-label">Confirm New Password</label>
                <input type="password" className="form-control" value={pwdForm.confirmPassword} onChange={e => setPwdForm(f => ({ ...f, confirmPassword: e.target.value }))} required />
              </div>
              <button type="submit" className="btn btn-outline-danger w-100" disabled={changingPwd}>
                {changingPwd ? <><i className="fas fa-spinner fa-spin me-1"></i>Changing...</> : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
