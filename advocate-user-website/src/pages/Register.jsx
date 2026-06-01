import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email is required';
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
        navigate('/profile');
      } else {
        setError(r.data.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  const InputField = ({ icon, label, name, type = 'text', placeholder, children, autoComplete }) => (
    <div className="mb-3">
      <label className="auth-label">{label}</label>
      <div className="auth-input-wrap">
        <i className={`fas ${icon} auth-input-icon`}></i>
        {children || (
          <input
            type={type}
            className={`auth-input ${fieldErrors[name] ? 'is-invalid' : ''}`}
            value={form[name]}
            onChange={set(name)}
            placeholder={placeholder}
            autoComplete={autoComplete}
          />
        )}
      </div>
      {fieldErrors[name] && <div className="auth-field-error"><i className="fas fa-exclamation-circle me-1"></i>{fieldErrors[name]}</div>}
    </div>
  );

  return (
    <div className="auth-page">
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
            <InputField icon="fa-user" label="Full Name *" name="name" placeholder="Your full name" autoComplete="name" />

            <InputField icon="fa-envelope" label="Email Address *" name="email" type="email" placeholder="your@email.com" autoComplete="email" />

            <InputField icon="fa-mobile-alt" label="Mobile Number *" name="phone" type="tel" placeholder="10-digit mobile number" autoComplete="tel" />

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
