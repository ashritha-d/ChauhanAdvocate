import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import { userLogin } from '../api';
import { useUserAuth } from '../context/UserAuthContext';
import { getPendingAction, getPendingActionData, clearPendingAction } from '../utils/pendingAction';

export default function Login() {
  const { login } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const infoMessage = location.state?.message || '';
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [identifierError, setIdentifierError] = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  // The identifier field accepts either an email or a mobile number, so this
  // must never restrict typing in general (letters, @, . all stay free —
  // that's what email login needs). The only thing it enforces in real time
  // is a 10-digit cap, and only once the value is *purely* digits — a value
  // containing any non-digit character (i.e. anything email-shaped) is left
  // completely alone. Handles paste the same way as typing: for a controlled
  // input, onChange fires with the full resulting value either way, so a
  // pasted 11+ digit numeric string hits the same length check and gets cut
  // to the first 10 digits.
  const handleIdentifierChange = e => {
    const raw = e.target.value;
    if (/^\d+$/.test(raw) && raw.length > 10) {
      setForm(f => ({ ...f, identifier: raw.slice(0, 10) }));
      setIdentifierError('Mobile number must be exactly 10 digits.');
      return;
    }
    setForm(f => ({ ...f, identifier: raw }));
    setIdentifierError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.identifier || !form.password) { setError('Please fill in all fields'); return; }
    // Mirrors the backend's login validation: anything not shaped like an
    // email must be a bare 10-digit mobile number — no stripping of spaces/
    // dashes, so malformed input is caught here instead of a round trip.
    const trimmedIdentifier = form.identifier.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedIdentifier);
    if (!isEmail && !/^\d{10}$/.test(trimmedIdentifier)) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }
    setLoading(true);
    try {
      const r = await userLogin(form);
      if (r.data.success) {
        login(r.data.token, r.data.user);
        // If a book order was pending, pass bookId via location state so
        // Books.jsx reads it at mount-time (avoids the user-state race condition)
        const pendingAction = getPendingAction();
        const pendingData   = getPendingActionData();
        if (pendingAction === 'order' && pendingData?.bookId) {
          clearPendingAction();
          navigate('/books', { replace: true, state: { bookId: pendingData.bookId } });
        } else {
          navigate(from, { replace: true });
        }
      } else {
        setError(r.data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <SEOHead title="Login" description="Log in to your Advocate Chauhan account to manage appointments, orders, and profile." canonical="/login" noindex />
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <img src={`${import.meta.env.BASE_URL}logo.jpeg`} alt="Advocate Chauhan" />
          </div>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to your account to manage appointments & orders</p>

          {infoMessage && (
            <div className="alert alert-info py-2 mb-3" role="alert">
              <i className="fas fa-info-circle me-2"></i>{infoMessage}
            </div>
          )}

          {error && (
            <div className="alert alert-danger py-2 mb-3" role="alert">
              <i className="fas fa-exclamation-circle me-2"></i>{error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="auth-label">Email Address or Mobile Number</label>
              <div className="auth-input-wrap">
                <i className="fas fa-user auth-input-icon"></i>
                <input
                  type="text"
                  className={`auth-input ${identifierError ? 'is-invalid' : ''}`}
                  value={form.identifier}
                  onChange={handleIdentifierChange}
                  placeholder="Email or 10-digit mobile"
                  autoComplete="username"
                  required
                />
              </div>
              {identifierError && <div className="auth-field-error"><i className="fas fa-exclamation-circle me-1"></i>{identifierError}</div>}
            </div>

            <div className="mb-4">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <i className="fas fa-lock auth-input-icon"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="auth-input-toggle"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>



            <button type="submit" className="btn btn-gold w-100 py-3" disabled={loading}>
              {loading
                ? <><i className="fas fa-spinner fa-spin me-2"></i>Signing in...</>
                : <><i className="fas fa-sign-in-alt me-2"></i>Sign In</>
              }
            </button>
          </form>

          <p className="auth-switch mt-4">
            Don't have an account? <Link to="/register" className="auth-link">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
