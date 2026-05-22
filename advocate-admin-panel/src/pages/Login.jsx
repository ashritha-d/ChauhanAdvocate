import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(form.email, form.password);
      if (!result.success) setError(result.message || 'Invalid credentials');
    } catch (err) {
      setError(err.response?.data?.message || 'Connection error. Make sure the server is running.');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon"><i className="fas fa-balance-scale"></i></div>
          <h2>Advocate Chauhan</h2>
          <p>Admin Dashboard</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label">Email Address</label>
            <div className="input-group">
              <span className="input-group-text"><i className="fas fa-envelope"></i></span>
              <input
                type="email" className="form-control" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="admin@advocatechauhan.com" required autoComplete="email"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="form-label">Password</label>
            <div className="input-group">
              <span className="input-group-text"><i className="fas fa-lock"></i></span>
              <input
                type={showPwd ? 'text' : 'password'} className="form-control" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Enter your password" required autoComplete="current-password"
              />
              <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPwd(s => !s)}>
                <i className={`fas ${showPwd ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>
          {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}
          <button type="submit" className="btn btn-gold w-100 py-3" disabled={loading}>
            {loading
              ? <><i className="fas fa-spinner fa-spin me-2"></i>Signing in...</>
              : <><i className="fas fa-sign-in-alt me-2"></i>Sign In</>
            }
          </button>
        </form>
        <div className="text-center mt-4">
          <small className="text-muted">Advocate Chauhan Admin Panel v1.0</small>
        </div>
      </div>
    </div>
  );
}
