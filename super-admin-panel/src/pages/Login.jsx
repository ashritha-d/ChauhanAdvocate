import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Connection error.');
    }
    setLoading(false);
  };

  return (
    <div className="sa-login-page">
      <div className="sa-login-card">
        <div className="sa-login-logo">
          <div className="sa-logo-icon">
            <i className="fas fa-user-shield"></i>
          </div>
          <h2>Super Admin</h2>
          <p>Advocate Chauhan Control Panel</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label">Email Address</label>
            <div className="input-group">
              <span className="input-group-text sa-input-icon">
                <i className="fas fa-envelope"></i>
              </span>
              <input
                type="email" className="form-control sa-input"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="superadmin@advocatechauhan.com"
                required autoComplete="email"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label">Password</label>
            <div className="input-group">
              <span className="input-group-text sa-input-icon">
                <i className="fas fa-lock"></i>
              </span>
              <input
                type={showPwd ? 'text' : 'password'} className="form-control sa-input"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Enter your password"
                required autoComplete="current-password"
              />
              <button type="button" className="btn sa-toggle-pwd" onClick={() => setShowPwd(s => !s)}>
                <i className={`fas ${showPwd ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          {error && (
            <div className="alert py-2 mb-3" style={{ background: '#2d1a1a', color: '#ff8a8a', border: '1px solid #ff4444', borderRadius: 8 }}>
              <i className="fas fa-exclamation-circle me-2"></i>{error}
            </div>
          )}

          <button type="submit" className="sa-btn-login w-100" disabled={loading}>
            {loading
              ? <><i className="fas fa-spinner fa-spin me-2"></i>Authenticating...</>
              : <><i className="fas fa-shield-alt me-2"></i>Enter Super Admin Panel</>
            }
          </button>
        </form>

        <div className="text-center mt-4">
          <small style={{ color: '#4a4a5a' }}>
            <i className="fas fa-lock me-1"></i>
            Restricted Access — Authorized Personnel Only
          </small>
        </div>
      </div>
    </div>
  );
}
