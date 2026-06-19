import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import { userRegister } from '../api';
import { useUserAuth } from '../context/UserAuthContext';

export default function Register() {
  const { login } = useUserAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const set = k => e => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setFieldErrors(fe => ({ ...fe, [k]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address';
    if (!form.phone || !/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) errs.phone = 'Enter a valid 10-digit mobile number';
    if (!form.password || form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setLoading(true);
    try {
      const r = await userRegister(form);
      if (r.data.success) {
        login(r.data.token, r.data.user);
        navigate('/');
      } else {
        setError(r.data.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <SEOHead title="Create Account" description="Register for an Advocate Chauhan account to book appointments, purchase legal books, and access exclusive legal resources." canonical="/register" noindex />
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <img src={`${import.meta.env.BASE_URL}logo.jpeg`} alt="Advocate Chauhan" />
          </div>
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Register to book appointments and track your orders</p>

          {error && (
            <div className="alert alert-danger py-2 mb-3" role="alert">
              <i className="fas fa-exclamation-circle me-2"></i>{error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div className="mb-3">
              <label className="auth-label">Full Name *</label>
              <div className="auth-input-wrap">
                <i className="fas fa-user auth-input-icon"></i>
                <input
                  type="text"
                  className={`auth-input ${fieldErrors.name ? 'is-invalid' : ''}`}
                  value={form.name}
                  onChange={set('name')}
                  placeholder="Your full name"
                  autoComplete="name"
                />
              </div>
              {fieldErrors.name && <div className="auth-field-error"><i className="fas fa-exclamation-circle me-1"></i>{fieldErrors.name}</div>}
            </div>

            {/* Email — optional */}
            <div className="mb-3">
              <label className="auth-label">Email Address <span className="text-muted fw-normal">(optional)</span></label>
              <div className="auth-input-wrap">
                <i className="fas fa-envelope auth-input-icon"></i>
                <input
                  type="email"
                  className={`auth-input ${fieldErrors.email ? 'is-invalid' : ''}`}
                  value={form.email}
                  onChange={set('email')}
                  placeholder="your@email.com (optional)"
                  autoComplete="email"
                />
              </div>
              {fieldErrors.email && <div className="auth-field-error"><i className="fas fa-exclamation-circle me-1"></i>{fieldErrors.email}</div>}
            </div>

            {/* Mobile */}
            <div className="mb-3">
              <label className="auth-label">Mobile Number *</label>
              <div className="auth-input-wrap">
                <i className="fas fa-mobile-alt auth-input-icon"></i>
                <input
                  type="tel"
                  className={`auth-input ${fieldErrors.phone ? 'is-invalid' : ''}`}
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="10-digit mobile number"
                  autoComplete="tel"
                />
              </div>
              {fieldErrors.phone && <div className="auth-field-error"><i className="fas fa-exclamation-circle me-1"></i>{fieldErrors.phone}</div>}
            </div>

            {/* Password */}
            <div className="mb-3">
              <label className="auth-label">Password *</label>
              <div className="auth-input-wrap">
                <i className="fas fa-lock auth-input-icon"></i>
                <input
                  type={showPwd ? 'text' : 'password'}
                  className={`auth-input ${fieldErrors.password ? 'is-invalid' : ''}`}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
                <button type="button" className="auth-input-toggle" onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                  <i className={`fas ${showPwd ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              {fieldErrors.password && <div className="auth-field-error"><i className="fas fa-exclamation-circle me-1"></i>{fieldErrors.password}</div>}
            </div>

            {/* Confirm Password */}
            <div className="mb-4">
              <label className="auth-label">Confirm Password *</label>
              <div className="auth-input-wrap">
                <i className="fas fa-lock auth-input-icon"></i>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className={`auth-input ${fieldErrors.confirmPassword ? 'is-invalid' : ''}`}
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                />
                <button type="button" className="auth-input-toggle" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                  <i className={`fas ${showConfirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              {fieldErrors.confirmPassword && <div className="auth-field-error"><i className="fas fa-exclamation-circle me-1"></i>{fieldErrors.confirmPassword}</div>}
            </div>

            <button type="submit" className="btn btn-gold w-100 py-3" disabled={loading}>
              {loading
                ? <><i className="fas fa-spinner fa-spin me-2"></i>Creating Account...</>
                : <><i className="fas fa-user-plus me-2"></i>Create Account</>
              }
            </button>
          </form>

          <p className="auth-switch mt-4">
            Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
