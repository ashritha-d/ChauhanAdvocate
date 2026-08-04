import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { getPaymentSettings, submitBookManualPayment } from '../api';
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

export default function BookPayment() {
  const navigate = useNavigate();
  const { user } = useUserAuth();
  const [order, setOrder]           = useState(null);
  const [settings, setSettings]     = useState({});
  const [method, setMethod]         = useState('upi_id');
  const [utr, setUtr]                   = useState('');
  const [screenshot, setScreenshot]     = useState(null);
  const [turnstileToken, setTurnstile]  = useState('');
  const [loading, setLoading]           = useState(false);
  const [err, setErr]                   = useState('');
  const [screen, setScreen]             = useState('payment');
  const [result, setResult]         = useState(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('pendingBookOrder');
    if (!raw) { navigate('/books'); return; }
    const parsed = JSON.parse(raw);
    if (!parsed.bookTitle || !parsed.name || !parsed.phone || !parsed.address) {
      sessionStorage.removeItem('pendingBookOrder');
      navigate('/books');
      return;
    }
    setOrder(parsed);
    getPaymentSettings().then(r => { if (r.data.success) setSettings(r.data.data); }).catch(() => {});
  }, []);

  if (!order) return null;

  const pricePerUnit = parseFloat(order.bookPrice) || 0;
  const totalAmount  = pricePerUnit * (order.quantity || 1);
  const hasPricing   = totalAmount > 0;
  const amtDisplay   = hasPricing ? `₹${totalAmount.toLocaleString('en-IN')}` : 'Price on Contact';

  const handleSubmit = async () => {
    if (hasPricing && !utr.trim()) {
      setErr('Please enter your UTR / Transaction Reference Number.');
      return;
    }
    if (import.meta.env.VITE_TURNSTILE_SITE_KEY && !turnstileToken) {
      setErr('Please complete the security check before submitting.');
      return;
    }
    setLoading(true); setErr('');
    try {
      const fd = new FormData();
      Object.entries(order).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') fd.append(k, v); });
      fd.append('paymentMethod', method);
      if (utr.trim()) fd.append('utrNumber', utr.trim());
      if (screenshot) fd.append('screenshot', screenshot);
      if (turnstileToken) fd.append('turnstileToken', turnstileToken);
      const { data } = await submitBookManualPayment(fd);
      if (data.success) {
        sessionStorage.removeItem('pendingBookOrder');
        setResult(data.data);
        setScreen('success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErr(data.message || 'Submission failed. Please try again.');
      }
    } catch (err) {
      setErr(err.response?.data?.message || err.message || 'Network error. Please try again.');
    }
    setLoading(false);
  };

  const cardStyle   = { background: '#fff', borderRadius: 20, boxShadow: '0 4px 30px rgba(0,0,0,0.08)', overflow: 'hidden' };
  const headerStyle = { background: 'linear-gradient(135deg,#1a1a2e,#16213e)', padding: '20px 24px', color: '#fff' };
  const bodyStyle   = { padding: 24 };
  const rowStyle    = { display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '0.875rem', borderBottom: '1px solid rgba(201,168,76,0.15)' };

  // ── SUCCESS SCREEN ──────────────────────────────────────────────────────────
  if (screen === 'success') {
    return (
      <div style={{ background: 'linear-gradient(135deg,#f0f4f8,#e8ecf0)', minHeight: '100vh', padding: '24px 0' }}>
        <div className="container" style={{ maxWidth: 520 }}>
          <div style={cardStyle}>
            <div style={bodyStyle} className="text-center">
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 30px rgba(245,158,11,0.3)' }}>
                <i className="fas fa-box-open" style={{ color: '#fff', fontSize: '2rem' }}></i>
              </div>
              <h4 className="fw-bold mb-1">Order Placed Successfully!</h4>
              <p className="text-muted mb-4">
                {hasPricing
                  ? 'Your order is pending payment verification. We will confirm within a few hours after verifying your transaction.'
                  : 'Your order has been placed. We will contact you shortly to confirm the details.'}
              </p>
              <div style={{ background: 'linear-gradient(135deg,#f9f5e8,#fff9ed)', border: '1.5px solid rgba(201,168,76,0.3)', borderRadius: 14, padding: 16, marginBottom: 20, textAlign: 'left' }}>
                {[
                  ['Name',            order.name],
                  ['Book',            order.bookTitle],
                  ['Quantity',        order.quantity],
                  ['Delivery Address', order.address],
                  ['Amount',          amtDisplay],
                  hasPricing ? ['UTR / Transaction ID', utr] : null,
                  ['Order ID',        result?.orderId],
                ].filter(Boolean).map(([l, v]) => v ? (
                  <div key={l} style={rowStyle}>
                    <span style={{ color: '#6b7280' }}>{l}</span>
                    <span style={{ fontWeight: 600, maxWidth: '55%', textAlign: 'right', wordBreak: 'break-all', fontSize: '0.85rem' }}>{v}</span>
                  </div>
                ) : null)}
                <div style={{ ...rowStyle, borderBottom: 'none' }}>
                  <span style={{ color: '#6b7280' }}>Status</span>
                  <span><span className="badge bg-warning text-dark">Pending Verification</span></span>
                </div>
              </div>
              <p className="small text-muted mb-4">
                <i className="fab fa-whatsapp me-1 text-success"></i>
                A WhatsApp confirmation has been sent. We will contact you within 24 hours.
              </p>
              <div className="d-grid gap-2">
                {user && (
                  <button className="btn btn-gold py-2" style={{ borderRadius: 12 }} onClick={() => navigate('/profile?tab=orders')}>
                    <i className="fas fa-book me-2"></i>View My Orders
                  </button>
                )}
                <button className="btn btn-outline-secondary py-2" style={{ borderRadius: 12 }} onClick={() => navigate('/books')}>
                  <i className="fas fa-arrow-left me-2"></i>Back to Books
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
            Delivery Details
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
            <div style={{ color: '#aaa', fontSize: '0.8rem', marginTop: 2 }}>Pay via UPI ID or scan QR and submit your transaction details below</div>
          </div>
          <div style={bodyStyle}>

            {/* Order Summary */}
            <div style={{ background: 'linear-gradient(135deg,#f9f5e8,#fff9ed)', border: '1.5px solid rgba(201,168,76,0.3)', borderRadius: 14, padding: 16, marginBottom: 20 }}>
              <div className="fw-semibold mb-2" style={{ fontSize: '0.9rem' }}>
                <i className="fas fa-book me-2" style={{ color: '#C9A84C' }}></i>Order Summary
              </div>
              {[
                ['Book',     order.bookTitle],
                ['Quantity', order.quantity],
                ['Address',  order.address],
                ['Amount to Pay', amtDisplay],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '0.875rem', borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
                  <span style={{ color: '#6b7280' }}>{l}</span>
                  <span style={{ fontWeight: 600, color: l === 'Amount to Pay' ? '#C9A84C' : '#1f2937', fontSize: l === 'Amount to Pay' ? '1.05rem' : undefined, maxWidth: '60%', textAlign: 'right' }}>{v}</span>
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
                {hasPricing ? `Transfer ${amtDisplay} using the details below` : 'Pay using the details below'}
              </div>
              <PaymentDetails s={settings} method={method} />
            </div>

            {/* Step 3: Submit UTR */}
            <div className="mb-2">
              <div className="fw-semibold mb-3" style={{ fontSize: '0.88rem', color: '#374151' }}>
                <span style={{ background: '#C9A84C', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, marginRight: 8 }}>3</span>
                Submit Transaction Details
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">
                  UTR / Transaction Reference Number{hasPricing ? <span className="text-danger"> *</span> : <span className="text-muted fw-normal"> (optional)</span>}
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

            <div className="d-flex justify-content-between align-items-center mt-3">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/books')}>
                <i className="fas fa-arrow-left me-2"></i>Back to Books
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
