import { Link } from 'react-router-dom';

function safeStore(key, value) {
  try { localStorage.setItem(key, value); } catch { /* tracking prevention */ }
}

/**
 * AuthGateModal — shown when a guest tries a protected action.
 *
 * Props:
 *   action      – human-readable action name e.g. "Book an Appointment"
 *   redirectTo  – URL/hash to return to after login (stored in localStorage)
 *   onClose     – called when user clicks Cancel or outside the modal
 */
export default function AuthGateModal({ action = 'continue', redirectTo = '/', onClose }) {
  const save = () => safeStore('authRedirect', redirectTo);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="auth-gate-card" onClick={e => e.stopPropagation()}>
        <button className="jr-modal-close" onClick={onClose}>&times;</button>

        <div className="auth-gate-icon">
          <i className="fas fa-lock"></i>
        </div>

        <h5 className="auth-gate-title">Login Required</h5>
        <p className="auth-gate-msg">
          Please login or register first to continue.
        </p>
        <p className="auth-gate-action">
          You're trying to: <strong>{action}</strong>
        </p>

        <div className="auth-gate-btns">
          <Link to="/login" className="btn btn-gold flex-1" onClick={() => { save(); onClose(); }}>
            <i className="fas fa-sign-in-alt me-2"></i>Login
          </Link>
          <Link to="/register" className="btn btn-outline-dark flex-1" onClick={() => { save(); onClose(); }}>
            <i className="fas fa-user-plus me-2"></i>Register
          </Link>
        </div>

        <button className="auth-gate-cancel" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

/** Helper — call before navigating to login/register to preserve redirect target */
export function saveAuthRedirect(destination) {
  try { localStorage.setItem('authRedirect', destination); } catch { /* silent */ }
}

/** Helper — consume the saved redirect; returns null if none */
export function consumeAuthRedirect() {
  try {
    const dest = localStorage.getItem('authRedirect');
    if (dest) localStorage.removeItem('authRedirect');
    return dest;
  } catch { return null; }
}
