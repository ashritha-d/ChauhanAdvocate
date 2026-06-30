import { useState } from 'react';
import { updateProfile } from '../api';
import { safeStorage } from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { admin, setAdmin } = useAuth();
  const [nameForm, setNameForm] = useState({ name: admin?.name || '' });
  const [nameMsg, setNameMsg] = useState(null);
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="row g-4 justify-content-center">
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
    </div>
  );
}
