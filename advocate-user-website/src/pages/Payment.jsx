import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { getPaymentSettings, submitManualPayment } from '../api';
import TurnstileWidget from '../components/TurnstileWidget';

const METHODS = [
  { id: 'upi_id',  icon: 'fa-mobile-alt', label: 'UPI ID',  sub: 'PhonePe / GPay / Paytm' },
  { id: 'qr_code', icon: 'fa-qrcode',     label: 'QR Code', sub: 'Scan & Pay' },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn btn-sm btn-outline-secondary py-0 px-2"
      style={{ fontSize: '0.72rem', minWidth: 52 }}
      onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
    >
      {copied ? <><i className="fas fa-check me-1 text-success"></i>Copied</> : <><i className="fas fa-copy me-1"></i>Copy</>}
    </button>
  );
}

function PaymentDetails({ s, method }) {
  const API_BASE = import.meta.env.VITE_API_BASE?.replace('/api', '') || 'https://chauhanadvocate.onrender.com';
  const qrUrl = s.payment_qr_image
    ? (s.payment_qr_image.startsWith('http') ? s.payment_qr_image : API_BASE + s.payment_qr_image)
    : '';

  return (
    <div style={{ background: 'linear-gradient(135deg,#f9f5e8,#fff9ed)', border: '1.5px solid rgba(201,168,76,0.35)', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
      <div className="fw-bold mb-3" style={{ color: '#92650a', fontSize: '0.9rem' }}>
        <i className="fas fa-info-circle me-2" style={{ color: '#C9A84C' }}></i>
        {method === 'qr_code' ? 'Scan QR to Pay' : 'Pay via UPI'}
      </div>

      {qrUrl && (
        <div className="text-center mb-3">
          <img src={qrUrl} alt="Payment QR" style={{ maxWidth: 160, borderRadius: 10, border: '2px solid rgba(201,168,76,0.3)' }} />
        </div>
      )}

      {s.payment_upi_id && (
        <div className="d-flex align-items-center gap-2 mb-2" style={{ background: '#fff', border: '1.5px dashed #C9A84C', borderRadius: 8, padding: '8px 14px' }}>
          <i className="fas fa-mobile-alt" style={{ color: '#C9A84C' }}></i>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, flex: 1 }}>{s.payment_upi_id}</span>
          <CopyButton text={s.payment_upi_id} />
        </div>
      )}
    </div>
  );
}

export default function Payment() {
  const navigate = useNavigate();
  const { user } = useUserAuth();
  const [appt, setAppt]             = useState(null);
  const [settings, setSettings]     = useState({});
  const [method, setMethod]             = useState('upi_id');
  const [utr, setUtr]                   = useState('');
  const [screenshot, setScreenshot]     = useState(null);
  const [turnstileToken, setTurnstile]  = useState('');
  const [loading, setLoading]           = useState(false);
  const [err, setErr]                   = useState('');
  const [screen, setScreen]             = useState('payment');

  useEffect(() => {
    const raw = sessionStorage.getItem('pendingAppointment');
    if (!raw) { navigate('/#appointment'); return; }
    setAppt(JSON.parse(raw));
    getPaymentSettings().then(r => { if (r.data.success) setSettings(r.data.data); }).catch(() => {});
  }, []);

  if (!appt) return null;

  const fee        = appt.amount || (appt.appointmentMode === 'online' ? 1 : 2);
  const feeDisplay = `₹${Number(fee).toLocaleString('en-IN')}`;
  const dateStr    = appt.date
    ? new Date(appt.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  const handleSubmit = async () => {
    if (!utr.trim()) { setErr('Please enter your UTR / Transaction Reference Number.'); return; }
    if (import.meta.env.VITE_TURNSTILE_SITE_KEY && !turnstileToken) {
      setErr('Please complete the security check before submitting.');
      return;
    }
    setLoading(true); setErr('');
    try {
      const fd = new FormData();
      Object.entries(appt).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, v); });
      fd.append('paymentMethod', method);
      fd.append('utrNumber', utr.trim());
      if (screenshot) fd.append('screenshot', screenshot);
      if (turnstileToken) fd.append('turnstileToken', turnstileToken);
      const { data } = await submitManualPayment(fd);
      if (data.success) {
        sessionStorage.removeItem('pendingAppointment');
        setScreen('pending');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErr(data.message || 'Submission failed. Please try again.');
      }
    } catch {
      setErr('Network error. Please try again.');
    }
    setLoading(false);
  };

  const cardStyle   = { background: '#fff', borderRadius: 20, boxShadow: '0 4px 30px rgba(0,0,0,0.08)', overflow: 'hidden' };
  const headerStyle = { background: 'linear-gradient(135deg,#1a1a2e,#16213e)', padding: '20px 24px', color: '#fff' };
  const bodyStyle   = { padding: 24 };
  const rowStyle    = { display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '0.875rem', borderBottom: '1px solid rgba(201,168,76,0.15)' };

  // ══ PENDING SCREEN ═════════════════════════════════════════
  if (screen === 'pending') {
    return (
      <div style={{ background: 'linear-gradient(135deg,#f0f4f8,#e8ecf0)', minHeight: '100vh', padding: '24px 0' }}>
        <div className="container" style={{ maxWidth: 520 }}>
          <div style={cardStyle}>
            <div style={bodyStyle} className="text-center">
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 30px rgba(245,158,11,0.3)' }}>
                <i className="fas fa-clock" style={{ color: '#fff', fontSize: '2rem' }}></i>
              </div>
              <h4 className="fw-bold mb-1">Payment Details Submitted!</h4>
              <p className="text-muted mb-4">Your appointment is <strong>pending payment verification</strong>. We will confirm within a few hours after verifying your transaction.</p>
              <div style={{ background: 'linear-gradient(135deg,#f9f5e8,#fff9ed)', border: '1.5px solid rgba(201,168,76,0.3)', borderRadius: 14, padding: 16, marginBottom: 20, textAlign: 'left' }}>
                {[
                  ['Name',                 appt.name],
                  ['Service',              appt.service],
                  ['Date & Time',          `${dateStr} at ${appt.time}`],
                  ['Amount',               feeDisplay],
                  ['UTR / Transaction ID', utr],
                ].map(([l, v]) => v ? (
                  <div key={l} style={rowStyle}>
                    <span style={{ color: '#6b7280' }}>{l}</span>
                    <span style={{ fontWeight: 600, maxWidth: '60%', textAlign: 'right', wordBreak: 'break-all' }}>{v}</span>
                  </div>
                ) : null)}
                <div style={{ ...rowStyle, borderBottom: 'none' }}>
                  <span style={{ color: '#6b7280' }}>Status</span>
                  <span><span className="badge bg-warning text-dark">Pending Verification</span></span>
                </div>
              </div>
              <p className="small text-muted mb-4">
                <i className="fas fa-bell me-1" style={{ color: '#C9A84C' }}></i>
                You will receive a WhatsApp message once your payment is verified and appointment is confirmed.
              </p>
              <div className="d-grid gap-2">
                {user && (
                  <button className="btn btn-gold py-2" style={{ borderRadius: 12 }} onClick={() => navigate('/profile?tab=appointments')}>
                    <i className="fas fa-calendar-check me-2"></i>View My Appointments
                  </button>
                )}
                <button className="btn btn-outline-secondary py-2" style={{ borderRadius: 12 }} onClick={() => navigate('/')}>
                  <i className="fas fa-home me-2"></i>Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══ PAYMENT SCREEN ═════════════════════════════════════════
  return (
    <div style={{ background: 'linear-gradient(135deg,#f0f4f8,#e8ecf0)', minHeight: '100vh', padding: '24px 0' }}>
      <div className="container" style={{ maxWidth: 560 }}>

        {/* Progress */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '12px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
          <span style={{ color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#22c55e', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
              <i className="fas fa-check"></i>
            </span>
            Appointment Details
          </span>
          <div style={{ flex: 1, height: 2, background: '#22c55e', margin: '0 4px' }}></div>
          <span style={{ fontWeight: 600, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#C9A84C', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>2</span>
            Payment
          </span>
        </div>

        <div style={cardStyle}>
          <div style={headerStyle}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Complete Your Payment</div>
            <div style={{ color: '#aaa', fontSize: '0.8rem', marginTop: 2 }}>Pay via UPI and submit your transaction details below</div>
          </div>
          <div style={bodyStyle}>

            {/* Appointment Summary */}
            <div style={{ background: 'linear-gradient(135deg,#f9f5e8,#fff9ed)', border: '1.5px solid rgba(201,168,76,0.3)', borderRadius: 14, padding: 16, marginBottom: 20 }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                  <i className="fas fa-calendar-alt me-2" style={{ color: '#C9A84C' }}></i>Appointment Summary
                </span>
                <span style={{ background: appt.appointmentMode === 'online' ? 'rgba(59,130,246,0.1)' : 'rgba(201,168,76,0.15)', color: appt.appointmentMode === 'online' ? '#1d4ed8' : '#92650a', padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600 }}>
                  <i className={`fas ${appt.appointmentMode === 'online' ? 'fa-video' : 'fa-building'} me-1`}></i>
                  {appt.appointmentMode === 'online' ? 'On Call' : 'At Office'}
                </span>
              </div>
              {[
                ['Name',          appt.name],
                ['Service',       appt.service],
                ['Date & Time',   `${dateStr} at ${appt.time}`],
                ['Amount to Pay', feeDisplay],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '0.875rem', borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
                  <span style={{ color: '#6b7280' }}>{l}</span>
                  <span style={{ fontWeight: 600, color: l === 'Amount to Pay' ? '#C9A84C' : '#1f2937', fontSize: l === 'Amount to Pay' ? '1.1rem' : undefined }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Step 1: Choose payment method */}
            <div className="mb-4">
              <div className="fw-semibold mb-2" style={{ fontSize: '0.88rem', color: '#374151' }}>
                <span style={{ background: '#C9A84C', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, marginRight: 8 }}>1</span>
                Choose Payment Method
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {METHODS.map(m => (
                  <div
                    key={m.id}
                    onClick={() => { setMethod(m.id); setErr(''); }}
                    style={{
                      border: `2px solid ${method === m.id ? '#C9A84C' : '#e5e7eb'}`,
                      borderRadius: 12,
                      padding: '12px 8px',
                      cursor: 'pointer',
                      background: method === m.id ? '#f9f5e8' : '#fff',
                      textAlign: 'center',
                      position: 'relative',
                      transition: 'all 0.2s',
                      boxShadow: method === m.id ? '0 2px 12px rgba(201,168,76,0.2)' : 'none',
                    }}
                  >
                    {method === m.id && (
                      <div style={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: '50%', background: '#C9A84C', color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fas fa-check"></i>
                      </div>
                    )}
                    <i className={`fas ${m.icon}`} style={{ fontSize: 20, color: '#C9A84C', display: 'block', marginBottom: 4 }}></i>
                    <div style={{ fontWeight: 600, fontSize: '0.78rem', color: '#374151' }}>{m.label}</div>
                    <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>{m.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: UPI / QR details */}
            <div className="mb-4">
              <div className="fw-semibold mb-2" style={{ fontSize: '0.88rem', color: '#374151' }}>
                <span style={{ background: '#C9A84C', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, marginRight: 8 }}>2</span>
                Transfer {feeDisplay} using the details below
              </div>
              <PaymentDetails s={settings} method={method} />
            </div>

            {/* Step 3: Submit transaction details */}
            <div className="mb-2">
              <div className="fw-semibold mb-3" style={{ fontSize: '0.88rem', color: '#374151' }}>
                <span style={{ background: '#C9A84C', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, marginRight: 8 }}>3</span>
                Submit Transaction Details
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">
                  UTR / Transaction Reference Number <span className="text-danger">*</span>
                </label>
                <input
                  className="form-control"
                  value={utr}
                  onChange={e => { setUtr(e.target.value); setErr(''); }}
                  placeholder="e.g. 423198765432 or TXNID..."
                  style={{ borderRadius: 10 }}
                />
                <div className="form-text">
                  <i className="fas fa-info-circle me-1"></i>
                  Find this in your UPI app after payment
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Payment Screenshot <span className="text-muted fw-normal">(optional but recommended)</span></label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={e => setScreenshot(e.target.files[0])}
                  style={{ borderRadius: 10 }}
                />
              </div>

              <TurnstileWidget
                onVerify={setTurnstile}
                onExpire={() => setTurnstile('')}
              />

              {err && (
                <div className="alert alert-danger py-2 small" style={{ borderRadius: 10 }}>
                  <i className="fas fa-exclamation-triangle me-2"></i>{err}
                </div>
              )}

              <button
                className="btn btn-gold w-100 py-3 fw-bold"
                style={{ borderRadius: 12, fontSize: '1rem' }}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? <><i className="fas fa-spinner fa-spin me-2"></i>Submitting...</>
                  : <><i className="fas fa-paper-plane me-2"></i>Submit Payment Details</>
                }
              </button>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
                <i className="fas fa-arrow-left me-2"></i>Back
              </button>
              <div className="text-muted small">
                <i className="fas fa-shield-alt me-1" style={{ color: '#22c55e' }}></i>
                Verified manually by admin
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
