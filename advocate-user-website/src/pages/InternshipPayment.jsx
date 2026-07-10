import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { getPaymentSettings, submitInternshipApplication } from '../api';

const PROGRAMME_FEE = 1000;
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

export default function InternshipPayment() {
  const navigate = useNavigate();
  const { user, authHeader } = useUserAuth();
  const [order, setOrder]           = useState(null);
  const [settings, setSettings]     = useState({});
  const [method, setMethod]         = useState('upi_id');
  const [utr, setUtr]               = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [err, setErr]               = useState('');
  const [screen, setScreen]         = useState('payment');
  const [result, setResult]         = useState(null);

  const API_BASE = 'https://chauhanadvocate.onrender.com';

  useEffect(() => {
    if (!user) { navigate('/login', { state: { from: '/internship-payment' } }); return; }
    const raw = sessionStorage.getItem('pendingInternship');
    if (!raw) { navigate('/'); return; }
    setOrder(JSON.parse(raw));
    getPaymentSettings().then(r => { if (r.data.success) setSettings(r.data.data); }).catch(() => {});
  }, [user]);

  if (!order) return null;

  const amtDisplay = `₹${PROGRAMME_FEE.toLocaleString('en-IN')}`;

  const qrUrl = settings.payment_qr_image
    ? (settings.payment_qr_image.startsWith('http') ? settings.payment_qr_image : API_BASE + settings.payment_qr_image)
    : '';

  const handleSubmit = async () => {
    if (!utr.trim()) { setErr('Please enter your UTR / Transaction Reference Number.'); return; }
    setLoading(true); setErr('');
    try {
      const fd = new FormData();
      fd.append('name', order.name);
      fd.append('email', order.email || '');
      fd.append('phone', order.phone);
      fd.append('programmeName', 'LLB Internship Programme');
      fd.append('amount', PROGRAMME_FEE);
      fd.append('paymentMethod', method);
      fd.append('utrNumber', utr.trim());
      if (user?._id) fd.append('userId', user._id);
      if (screenshot) fd.append('screenshot', screenshot);

      const { data } = await submitInternshipApplication(fd);
      if (data.success) {
        sessionStorage.removeItem('pendingInternship');
        setResult(data.data);
        setScreen('success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErr(data.message || 'Submission failed. Please try again.');
      }
    } catch (e) {
      setErr(e.response?.data?.message || e.message || 'Network error. Please try again.');
    }
    setLoading(false);
  };

  const cardStyle   = { background: '#fff', borderRadius: 20, boxShadow: '0 4px 30px rgba(0,0,0,0.08)', overflow: 'hidden' };
  const headerStyle = { background: 'linear-gradient(135deg,#1a1a2e,#16213e)', padding: '20px 24px', color: '#fff' };
  const bodyStyle   = { padding: 24 };

  // ── SUCCESS ─────────────────────────────────────────────────────────────────
  if (screen === 'success') {
    return (
      <div style={{ background: 'linear-gradient(135deg,#f0f4f8,#e8ecf0)', minHeight: '100vh', padding: '24px 0' }}>
        <div className="container" style={{ maxWidth: 520 }}>
          <div style={cardStyle}>
            <div style={bodyStyle} className="text-center">
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#C9A84C,#e6c96e)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 30px rgba(201,168,76,0.3)' }}>
                <i className="fas fa-graduation-cap" style={{ color: '#fff', fontSize: '2rem' }}></i>
              </div>
              <h4 className="fw-bold mb-1">Application Submitted!</h4>
              <p className="text-muted mb-4">
                Your LLB Internship application is pending payment verification. We will confirm within 24 hours after verifying your transaction.
              </p>
              <div style={{ background: 'linear-gradient(135deg,#f9f5e8,#fff9ed)', border: '1.5px solid rgba(201,168,76,0.3)', borderRadius: 14, padding: 16, marginBottom: 20, textAlign: 'left' }}>
                {[
                  ['Name', order.name],
                  ['Phone', order.phone],
                  ['Programme', 'LLB Internship Programme'],
                  ['Fee', amtDisplay],
                  ['UTR / Transaction ID', utr],
                ].filter(([, v]) => v).map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '0.875rem', borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
                    <span style={{ color: '#6b7280' }}>{l}</span>
                    <span style={{ fontWeight: 600, maxWidth: '55%', textAlign: 'right', wordBreak: 'break-all', fontSize: '0.85rem' }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '0.875rem' }}>
                  <span style={{ color: '#6b7280' }}>Status</span>
                  <span><span className="badge bg-warning text-dark">Pending Verification</span></span>
                </div>
              </div>
              <p className="small text-muted mb-4">
                <i className="fab fa-whatsapp me-1 text-success"></i>
                We will contact you on WhatsApp to confirm your enrolment.
              </p>
              <div className="d-grid gap-2">
                <button className="btn btn-gold py-2" style={{ borderRadius: 12 }} onClick={() => navigate('/profile?tab=internship')}>
                  <i className="fas fa-graduation-cap me-2"></i>View My Internship
                </button>
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

  // ── PAYMENT SCREEN ──────────────────────────────────────────────────────────
  return (
    <div style={{ background: 'linear-gradient(135deg,#f0f4f8,#e8ecf0)', minHeight: '100vh', padding: '24px 0' }}>
      <div className="container" style={{ maxWidth: 560 }}>

        {/* Progress */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '12px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
          <span style={{ color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#22c55e', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
              <i className="fas fa-check"></i>
            </span>
            Details Confirmed
          </span>
          <div style={{ flex: 1, height: 2, background: '#22c55e', margin: '0 4px' }}></div>
          <span style={{ fontWeight: 600, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#C9A84C', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>2</span>
            Payment
          </span>
        </div>

        <div style={cardStyle}>
          <div style={headerStyle}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
              <i className="fas fa-graduation-cap me-2" style={{ color: '#C9A84C' }}></i>
              LLB Internship — Enrolment Fee
            </div>
            <div style={{ color: '#aaa', fontSize: '0.8rem', marginTop: 2 }}>Pay via UPI ID or scan QR and submit your transaction details below</div>
          </div>
          <div style={bodyStyle}>

            {/* Order Summary */}
            <div style={{ background: 'linear-gradient(135deg,#f9f5e8,#fff9ed)', border: '1.5px solid rgba(201,168,76,0.3)', borderRadius: 14, padding: 16, marginBottom: 20 }}>
              <div className="fw-semibold mb-2" style={{ fontSize: '0.9rem' }}>
                <i className="fas fa-graduation-cap me-2" style={{ color: '#C9A84C' }}></i>Enrolment Summary
              </div>
              {[
                ['Programme',  'LLB Internship Programme'],
                ['Duration',   '45 Days'],
                ['Name',       order.name],
                ['Phone',      order.phone],
                ['Enrolment Fee', amtDisplay],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '0.875rem', borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
                  <span style={{ color: '#6b7280' }}>{l}</span>
                  <span style={{ fontWeight: 600, color: l === 'Enrolment Fee' ? '#C9A84C' : '#1f2937', fontSize: l === 'Enrolment Fee' ? '1.05rem' : undefined }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Payment method */}
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
                    style={{ border: `2px solid ${method === m.id ? '#C9A84C' : '#e5e7eb'}`, borderRadius: 12, padding: '12px 8px', cursor: 'pointer', background: method === m.id ? '#f9f5e8' : '#fff', textAlign: 'center', position: 'relative', transition: 'all 0.2s', boxShadow: method === m.id ? '0 2px 12px rgba(201,168,76,0.2)' : 'none' }}
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

            {/* UPI/QR details */}
            <div className="mb-4">
              <div className="fw-semibold mb-2" style={{ fontSize: '0.88rem', color: '#374151' }}>
                <span style={{ background: '#C9A84C', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, marginRight: 8 }}>2</span>
                Transfer {amtDisplay} using the details below
              </div>
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
                {settings.payment_upi_id && (
                  <div className="d-flex align-items-center gap-2 mb-2" style={{ background: '#fff', border: '1.5px dashed #C9A84C', borderRadius: 8, padding: '8px 14px' }}>
                    <i className="fas fa-mobile-alt" style={{ color: '#C9A84C' }}></i>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, flex: 1 }}>{settings.payment_upi_id}</span>
                    <CopyButton text={settings.payment_upi_id} />
                  </div>
                )}
              </div>
            </div>

            {/* UTR input */}
            <div className="mb-2">
              <div className="fw-semibold mb-3" style={{ fontSize: '0.88rem', color: '#374151' }}>
                <span style={{ background: '#C9A84C', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, marginRight: 8 }}>3</span>
                Submit Transaction Details
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">UTR / Transaction Reference Number <span className="text-danger">*</span></label>
                <input
                  className="form-control"
                  value={utr}
                  onChange={e => { setUtr(e.target.value); setErr(''); }}
                  placeholder="e.g. 423198765432 or TXNID..."
                  style={{ borderRadius: 10 }}
                />
                <div className="form-text"><i className="fas fa-info-circle me-1"></i>Find this in your UPI app after payment</div>
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Payment Screenshot <span className="text-muted fw-normal">(optional but recommended)</span></label>
                <input type="file" className="form-control" accept="image/*" onChange={e => setScreenshot(e.target.files[0])} style={{ borderRadius: 10 }} />
              </div>
            </div>

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
                ? <><i className="fas fa-spinner fa-spin me-2"></i>Submitting…</>
                : <><i className="fas fa-paper-plane me-2"></i>Submit Application & Payment</>
              }
            </button>

            <div className="d-flex justify-content-between align-items-center mt-3">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/')}>
                <i className="fas fa-arrow-left me-2"></i>Back to Home
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
