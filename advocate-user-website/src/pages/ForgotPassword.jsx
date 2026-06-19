import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import { userForgotPassword, userVerifyOTP, userResetPassword } from '../api';

const STEPS = { EMAIL: 'email', OTP: 'otp', RESET: 'reset', DONE: 'done' };

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOTP = async e => {
    e.preventDefault();
    setError('');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address'); return; }
    setLoading(true);
    try {
      const r = await userForgotPassword({ email });
      if (r.data.success) {
        setSuccess(r.data.message);
        if (r.data.devOtp) setDevOtp(r.data.devOtp);
        setStep(STEPS.OTP);
      } else {
        setError(r.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    }
    setLoading(false);
  };

  const handleVerifyOTP = async e => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    setLoading(true);
    try {
      const r = await userVerifyOTP({ email, otp });
      if (r.data.success) {
        setResetToken(r.data.resetToken);
        setSuccess('OTP verified! Now set your new password.');
        setStep(STEPS.RESET);
      } else {
        setError(r.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
    }
    setLoading(false);
  };

  const handleResetPassword = async e => {
    e.preventDefault();
    setError('');
    if (!newPassword || newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const r = await userResetPassword({ email, resetToken, newPassword, confirmPassword });
      if (r.data.success) {
        setSuccess(r.data.message);
        setStep(STEPS.DONE);
      } else {
        setError(r.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <SEOHead title="Reset Password" description="Reset your Advocate Chauhan account password." canonical="/forgot-password" noindex />
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <img src={`${import.meta.env.BASE_URL}logo.jpeg`} alt="Advocate Chauhan" />
          </div>

          {/* Steps indicator */}
          <div className="auth-steps mb-4">
            {['Email', 'OTP', 'Reset', 'Done'].map((s, i) => (
              <div key={s} className={`auth-step ${i <= [STEPS.EMAIL, STEPS.OTP, STEPS.RESET, STEPS.DONE].indexOf(step) ? 'active' : ''}`}>
                <div className="auth-step-dot">{i + 1}</div>
                <span>{s}</span>
              </div>
            ))}
          </div>

          {error && (
            <div className="alert alert-danger py-2 mb-3">
              <i className="fas fa-exclamation-circle me-2"></i>{error}
            </div>
          )}
          {success && step !== STEPS.DONE && (
            <div className="alert alert-success py-2 mb-3">
              <i className="fas fa-check-circle me-2"></i>{success}
            </div>
          )}

          {/* Step 1: Email */}
          {step === STEPS.EMAIL && (
            <>
              <h2 className="auth-title">Forgot Password</h2>
              <p className="auth-subtitle">Enter your registered email address to receive an OTP</p>
              <form onSubmit={handleSendOTP}>
                <div className="mb-4">
                  <label className="auth-label">Email Address</label>
                  <div className="auth-input-wrap">
                    <i className="fas fa-envelope auth-input-icon"></i>
                    <input
                      type="email"
                      className="auth-input"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-gold w-100 py-3" disabled={loading}>
                  {loading ? <><i className="fas fa-spinner fa-spin me-2"></i>Sending...</> : <><i className="fas fa-paper-plane me-2"></i>Send OTP</>}
                </button>
              </form>
            </>
          )}

          {/* Step 2: OTP */}
          {step === STEPS.OTP && (
            <>
              <h2 className="auth-title">Enter OTP</h2>
              <p className="auth-subtitle">A 6-digit OTP has been sent to <strong>{email}</strong></p>
              {devOtp && (
                <div className="alert py-2 mb-3" style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: 8 }}>
                  <small className="text-gold"><i className="fas fa-info-circle me-1"></i>Dev mode OTP: <strong>{devOtp}</strong></small>
                </div>
              )}
              <form onSubmit={handleVerifyOTP}>
                <div className="mb-4">
                  <label className="auth-label">One-Time Password</label>
                  <div className="auth-input-wrap">
                    <i className="fas fa-key auth-input-icon"></i>
                    <input
                      type="text"
                      className="auth-input"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit OTP"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-gold w-100 py-3" disabled={loading}>
                  {loading ? <><i className="fas fa-spinner fa-spin me-2"></i>Verifying...</> : <><i className="fas fa-check me-2"></i>Verify OTP</>}
                </button>
                <button type="button" className="btn btn-link w-100 mt-2 text-gold" onClick={() => { setStep(STEPS.EMAIL); setError(''); setSuccess(''); }}>
                  <i className="fas fa-arrow-left me-1"></i> Back
                </button>
              </form>
            </>
          )}

          {/* Step 3: Reset */}
          {step === STEPS.RESET && (
            <>
              <h2 className="auth-title">New Password</h2>
              <p className="auth-subtitle">Set a new secure password for your account</p>
              <form onSubmit={handleResetPassword}>
                <div className="mb-3">
                  <label className="auth-label">New Password</label>
                  <div className="auth-input-wrap">
                    <i className="fas fa-lock auth-input-icon"></i>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      className="auth-input"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                    />
                    <button type="button" className="auth-input-toggle" onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                      <i className={`fas ${showPwd ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="auth-label">Confirm New Password</label>
                  <div className="auth-input-wrap">
                    <i className="fas fa-lock auth-input-icon"></i>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      className="auth-input"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-gold w-100 py-3" disabled={loading}>
                  {loading ? <><i className="fas fa-spinner fa-spin me-2"></i>Resetting...</> : <><i className="fas fa-save me-2"></i>Reset Password</>}
                </button>
              </form>
            </>
          )}

          {/* Step 4: Done */}
          {step === STEPS.DONE && (
            <div className="text-center py-2">
              <div className="auth-success-icon mb-3">
                <i className="fas fa-check-circle"></i>
              </div>
              <h2 className="auth-title">Password Reset!</h2>
              <p className="auth-subtitle mb-4">{success}</p>
              <button className="btn btn-gold px-5 py-3" onClick={() => navigate('/login')}>
                <i className="fas fa-sign-in-alt me-2"></i>Sign In Now
              </button>
            </div>
          )}

          <p className="auth-switch mt-4">
            Remember your password? <Link to="/login" className="auth-link">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
