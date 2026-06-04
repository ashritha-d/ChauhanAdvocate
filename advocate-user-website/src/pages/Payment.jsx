import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { getPaymentSettings, createRazorpayOrder, verifyRazorpayPayment, submitManualPayment } from '../api';

const METHOD_LABELS = {
  razorpay: 'Razorpay',
  phonepe: 'PhonePe',
  googlepay: 'Google Pay',
  upi_id: 'UPI ID',
  qr_code: 'QR Code',
};

function LoadingOverlay({ show, text }) {
  if (!show) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(255,255,255,0.88)', zIndex:9999, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
      <div className="spinner-border text-warning" style={{ width:48, height:48 }}></div>
      <div className="text-muted small">{text || 'Processing...'}</div>
    </div>
  );
}

function MethodCard({ id, icon, imgSrc, name, sub, selected, onClick, wide }) {
  return (
    <div
      onClick={onClick}
      style={{
        border: `2px solid ${selected ? '#C9A84C' : '#e5e7eb'}`,
        borderRadius: 14,
        padding: '14px 12px',
        cursor: 'pointer',
        background: selected ? '#f9f5e8' : '#fff',
        display: 'flex', flexDirection: wide ? 'row' : 'column',
        alignItems: 'center', gap: 10,
        textAlign: wide ? 'left' : 'center',
        gridColumn: wide ? '1 / -1' : undefined,
        position: 'relative',
        transition: 'all 0.2s',
        boxShadow: selected ? '0 2px 16px rgba(201,168,76,0.2)' : 'none',
      }}
    >
      {selected && (
        <div style={{ position:'absolute', top:8, right:8, width:20, height:20, borderRadius:'50%', background:'#C9A84C', color:'#fff', fontSize:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <i className="fas fa-check"></i>
        </div>
      )}
      {imgSrc
        ? <img src={imgSrc} alt={name} style={{ height: wide ? 22 : 28, objectFit:'contain' }} />
        : <i className={`fas ${icon}`} style={{ fontSize: 24, color:'#C9A84C' }}></i>
      }
      <div>
        <div style={{ fontWeight:600, fontSize:'0.82rem', color:'#374151' }}>{name}</div>
        {sub && <div style={{ fontSize:'0.72rem', color:'#6b7280' }}>{sub}</div>}
      </div>
    </div>
  );
}

function ManualPanel({ method, upiId, qrUrl, feeDisplay, onSuccess }) {
  const [utr, setUtr] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const appt = JSON.parse(sessionStorage.getItem('pendingAppointment') || '{}');

  const handleSubmit = async () => {
    if (!utr.trim()) { setErr('Please enter your UTR / Transaction Reference Number.'); return; }
    setLoading(true); setErr('');
    try {
      const fd = new FormData();
      Object.entries(appt).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, v); });
      fd.append('paymentMethod', method);
      fd.append('utrNumber', utr.trim());
      if (screenshot) fd.append('screenshot', screenshot);
      const { data } = await submitManualPayment(fd);
      if (data.success) onSuccess('pending');
      else setErr(data.message || 'Submission failed.');
    } catch { setErr('Network error. Please try again.'); }
    setLoading(false);
  };

  const steps = {
    phonepe: ['Open PhonePe → Send Money', 'Enter UPI ID or scan QR', `Pay ${feeDisplay} and note the UTR`, 'Enter UTR below'],
    googlepay: ['Open Google Pay → New Payment', 'Enter UPI ID or scan QR', `Pay ${feeDisplay} and note Transaction ID`, 'Enter the reference below'],
    upi_id: ['Open any UPI app → Send Money → UPI ID', `Enter UPI ID and pay ${feeDisplay}`, 'Note the UTR from success screen', 'Enter UTR below'],
    qr_code: ['Open any UPI app → Scan QR', `Scan and pay exactly ${feeDisplay}`, 'Note the UTR from success screen', 'Enter UTR below'],
  };

  return (
    <div>
      {(method === 'phonepe' || method === 'googlepay' || method === 'qr_code') && (
        <div className="text-center mb-3">
          {qrUrl
            ? <img src={qrUrl} alt="QR Code" style={{ maxWidth:180, borderRadius:10 }} />
            : <div className="text-muted small"><i className="fas fa-qrcode me-1"></i>QR not configured — use UPI ID</div>
          }
        </div>
      )}
      {(method !== 'qr_code') && upiId && (
        <div style={{ background:'#fff', border:'1.5px dashed #C9A84C', borderRadius:10, padding:'10px 14px', fontFamily:'monospace', fontWeight:700, textAlign:'center', marginBottom:12, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          {upiId}
          <button className="btn btn-sm btn-outline-secondary py-0 px-2" style={{ fontSize:'0.75rem' }} onClick={() => navigator.clipboard?.writeText(upiId)}>
            <i className="fas fa-copy"></i>
          </button>
        </div>
      )}
      <ol className="small mb-3 ps-3" style={{ color:'#374151' }}>
        {(steps[method] || []).map((s, i) => <li key={i} className="mb-1">{s}</li>)}
      </ol>
      <div className="mb-3">
        <label className="form-label small fw-semibold">UTR / Transaction Reference *</label>
        <input className="form-control" value={utr} onChange={e => setUtr(e.target.value)} placeholder="12-digit UTR number" />
        <div className="form-text">Find it in your UPI app → Transaction History</div>
      </div>
      <div className="mb-3">
        <label className="form-label small fw-semibold">Screenshot (optional)</label>
        <input type="file" className="form-control" accept="image/*" onChange={e => setScreenshot(e.target.files[0])} />
      </div>
      {err && <div className="alert alert-danger py-2 small">{err}</div>}
      <button
        className="btn btn-gold w-100 py-3"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? <><i className="fas fa-spinner fa-spin me-2"></i>Submitting...</> : <><i className="fas fa-paper-plane me-2"></i>Submit Payment Details</>}
      </button>
    </div>
  );
}

export default function Payment() {
  const navigate = useNavigate();
  const { user, authHeader } = useUserAuth();
  const [appt, setAppt] = useState(null);
  const [settings, setSettings] = useState({});
  const [method, setMethod] = useState('razorpay');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [screen, setScreen] = useState('payment'); // payment | success | pending
  const [result, setResult] = useState(null);
  const [verifyError, setVerifyError] = useState('');
  const rzpRef = useRef(null);

  const API_BASE = 'https://chauhanadvocate.onrender.com';

  useEffect(() => {
    const raw = sessionStorage.getItem('pendingAppointment');
    if (!raw) { navigate('/#appointment'); return; }
    setAppt(JSON.parse(raw));
    getPaymentSettings().then(r => { if (r.data.success) setSettings(r.data.data); }).catch(() => {});

    // Load Razorpay script
    if (!window.Razorpay) {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.head.appendChild(s);
    }
  }, []);

  if (!appt) return null;

  const fee = appt.amount || (appt.appointmentMode === 'online' ? 1 : 2);
  const feeDisplay = `₹${Number(fee).toLocaleString('en-IN')}`;
  const dateStr = appt.date ? new Date(appt.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';
  const qrUrl = settings.payment_qr_image
    ? (settings.payment_qr_image.startsWith('http') ? settings.payment_qr_image : API_BASE + settings.payment_qr_image)
    : '';
  const upiId = settings.payment_upi_id || '';

  // ── Razorpay ──────────────────────────────────────────────
  const startRazorpay = async () => {
    setVerifyError('');
    setLoading(true); setLoadingText('Setting up secure checkout...');
    try {
      const headers = user ? authHeader() : {};
      const { data } = await createRazorpayOrder({ ...appt, amount: fee }, headers);
      setLoading(false);
      if (!data.success) {
        setVerifyError(data.message || 'Could not create payment order. Please try again.');
        return;
      }

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: 'INR',
        name: 'Balu Law Chamber',
        description: `Consultation — ${appt.service}`,
        order_id: data.order_id,
        prefill: data.prefill || {},
        theme: { color: '#C9A84C' },
        config: {
          display: {
            blocks: {
              upi:  { name: 'Pay via UPI',  instruments: [{ method: 'upi', flows: ['qr', 'intent'] }] },
              card: { name: 'Pay via Card', instruments: [{ method: 'card' }] },
            },
            sequence: ['block.upi', 'block.card'],
            preferences: { show_default_blocks: false },
          },
        },
        handler: async (response) => {
          setLoading(true); setLoadingText('Verifying Payment...');
          setVerifyError('');
          try {
            const headers2 = user ? authHeader() : {};
            const vRes = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              payment_db_id: data.payment_db_id,
            }, headers2);
            setLoading(false);
            if (vRes.data.success) {
              sessionStorage.removeItem('pendingAppointment');
              setResult({ ...vRes.data, method: 'Razorpay' });
              setScreen('success');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              setVerifyError(vRes.data.message || 'Payment verification failed. Please try again or contact support.');
            }
          } catch {
            setLoading(false);
            setVerifyError('Verification error. Please contact support with your transaction ID.');
          }
        },
        modal: {
          ondismiss: () => {
            setVerifyError('cancelled');
          },
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setLoading(false);
      const msg = err?.response?.data?.message || err?.message || 'Unknown error';
      setVerifyError(msg);
    }
  };

  const handleManualSuccess = (type) => {
    sessionStorage.removeItem('pendingAppointment');
    if (type === 'pending') setScreen('pending');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Styles ────────────────────────────────────────────────
  const cardStyle = { background:'#fff', borderRadius:20, boxShadow:'0 4px 30px rgba(0,0,0,0.08)', overflow:'hidden' };
  const headerStyle = { background:'linear-gradient(135deg,#1a1a2e,#16213e)', padding:'20px 24px', color:'#fff' };
  const bodyStyle = { padding:24 };
  const summaryStyle = { background:'linear-gradient(135deg,#f9f5e8,#fff9ed)', border:'1.5px solid rgba(201,168,76,0.3)', borderRadius:14, padding:16, marginBottom:20 };
  const receiptRowStyle = { display:'flex', justifyContent:'space-between', padding:'5px 0', fontSize:'0.875rem', borderBottom:'1px solid rgba(201,168,76,0.15)' };

  // ══ SUCCESS SCREEN ════════════════════════════════════════
  if (screen === 'success') {
    const r = result || {};
    const apptData = r.appointmentData || {};
    const rDateStr = apptData.date ? new Date(apptData.date).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' }) : dateStr;
    return (
      <div style={{ background:'linear-gradient(135deg,#f0f4f8,#e8ecf0)', minHeight:'100vh', padding:'24px 0' }}>
        <div className="container" style={{ maxWidth:520 }}>
          <div style={cardStyle}>
            <div style={bodyStyle} className="text-center">
              <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,#22c55e,#16a34a)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 8px 30px rgba(34,197,94,0.3)' }}>
                <i className="fas fa-check" style={{ color:'#fff', fontSize:'2rem' }}></i>
              </div>
              <h4 className="fw-bold mb-1">Appointment Booked!</h4>
              <p className="text-muted mb-4">Payment successful — your appointment is confirmed.</p>

              <div className="d-flex gap-3 justify-content-center flex-wrap mb-4">
                {r.appointmentId && (
                  <div className="text-center">
                    <div className="small text-muted mb-1">Appointment ID</div>
                    <span style={{ background:'rgba(201,168,76,0.15)', color:'#92650a', padding:'4px 12px', borderRadius:20, fontSize:'0.8rem', fontWeight:700, fontFamily:'monospace' }}>{r.appointmentId}</span>
                  </div>
                )}
                {r.transactionId && (
                  <div className="text-center">
                    <div className="small text-muted mb-1">Transaction ID</div>
                    <span style={{ background:'rgba(201,168,76,0.15)', color:'#92650a', padding:'4px 12px', borderRadius:20, fontSize:'0.8rem', fontWeight:700, fontFamily:'monospace' }}>{r.transactionId}</span>
                  </div>
                )}
              </div>

              <div style={{ background:'#f9f5e8', border:'1.5px solid rgba(201,168,76,0.3)', borderRadius:14, padding:'16px 20px', marginBottom:20, textAlign:'left' }}>
                <div className="fw-bold text-center mb-3" style={{ color:'#1a1a2e' }}><i className="fas fa-receipt me-2" style={{ color:'#C9A84C' }}></i>PAYMENT RECEIPT</div>
                {[
                  ['Receipt ID', r.receiptId],
                  ['Client Name', appt.name],
                  ['Mobile', appt.phone],
                  ['Service', appt.service],
                  ['Date & Time', `${rDateStr} at ${appt.time}`],
                  ['Mode', appt.appointmentMode === 'online' ? 'Online' : 'Offline'],
                  ['Amount Paid', feeDisplay],
                  ['Payment Method', r.method || 'Online'],
                  ['Status', '✅ Confirmed'],
                ].map(([l, v]) => v ? (
                  <div key={l} style={receiptRowStyle}>
                    <span style={{ color:'#6b7280' }}>{l}</span>
                    <span style={{ fontWeight:600, textAlign:'right', maxWidth:'60%', wordBreak:'break-all', color: l === 'Amount Paid' ? '#C9A84C' : '#1f2937' }}>{v}</span>
                  </div>
                ) : null)}
              </div>

              <div className="d-grid gap-2">
                <button className="btn btn-dark py-2" style={{ borderRadius:12, border:'1.5px solid #C9A84C', color:'#C9A84C' }} onClick={() => window.print()}>
                  <i className="fas fa-download me-2"></i>Download Receipt (PDF)
                </button>
                <button className="btn btn-outline-secondary py-2" style={{ borderRadius:12 }} onClick={() => {
                  const d = apptData.date ? new Date(apptData.date) : new Date();
                  const [tp, ampm] = (apptData.time || appt.time || '10:00 AM').split(' ');
                  let [h, m] = tp.split(':').map(Number);
                  if (ampm === 'PM' && h !== 12) h += 12;
                  if (ampm === 'AM' && h === 12) h = 0;
                  d.setHours(h, m || 0, 0);
                  const end = new Date(d.getTime() + 3600000);
                  const fmt = x => x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
                  window.open(`https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent('Consultation – Balu Law Chamber')}&dates=${fmt(d)}/${fmt(end)}&details=${encodeURIComponent(`Appointment ID: ${r.appointmentId}\nService: ${appt.service}`)}&location=${encodeURIComponent('Balu Law Chamber, Hasthinapuram, LB Nagar')}`, '_blank');
                }}>
                  <i className="fas fa-calendar-plus me-2"></i>Add to Calendar
                </button>
                <button className="btn btn-outline-secondary py-2" style={{ borderRadius:12 }} onClick={() => navigate('/profile')}>
                  <i className="fas fa-user me-2"></i>View My Appointments
                </button>
              </div>
              <div className="text-muted small mt-3">
                <i className="fas fa-envelope me-1" style={{ color:'#C9A84C' }}></i>
                Receipt sent to your email (if provided)
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══ PENDING SCREEN ════════════════════════════════════════
  if (screen === 'pending') {
    return (
      <div style={{ background:'linear-gradient(135deg,#f0f4f8,#e8ecf0)', minHeight:'100vh', padding:'24px 0' }}>
        <div className="container" style={{ maxWidth:520 }}>
          <div style={cardStyle}>
            <div style={bodyStyle} className="text-center">
              <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,#f59e0b,#d97706)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 8px 30px rgba(245,158,11,0.3)' }}>
                <i className="fas fa-clock" style={{ color:'#fff', fontSize:'2rem' }}></i>
              </div>
              <h4 className="fw-bold mb-1">Payment Submitted!</h4>
              <p className="text-muted mb-4">Your appointment is <strong>pending payment verification</strong>. We will confirm within a few hours.</p>
              <div style={{ ...summaryStyle, textAlign:'left' }}>
                {[['Name', appt.name], ['Service', appt.service], ['Date & Time', `${dateStr} at ${appt.time}`], ['Amount', feeDisplay]].map(([l, v]) => (
                  <div key={l} style={receiptRowStyle}>
                    <span style={{ color:'#6b7280' }}>{l}</span>
                    <span style={{ fontWeight:600 }}>{v}</span>
                  </div>
                ))}
                <div style={receiptRowStyle}>
                  <span style={{ color:'#6b7280' }}>Status</span>
                  <span><span className="badge bg-warning text-dark">Pending Verification</span></span>
                </div>
              </div>
              <button className="btn btn-outline-secondary w-100 py-2" style={{ borderRadius:12 }} onClick={() => navigate('/')}>
                <i className="fas fa-home me-2"></i>Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══ PAYMENT SCREEN ════════════════════════════════════════
  return (
    <div style={{ background:'linear-gradient(135deg,#f0f4f8,#e8ecf0)', minHeight:'100vh', padding:'24px 0' }}>
      <LoadingOverlay show={loading} text={loadingText} />
      <div className="container" style={{ maxWidth:540 }}>

        {/* Progress */}
        <div style={{ background:'#fff', borderRadius:12, padding:'12px 20px', marginBottom:16, display:'flex', alignItems:'center', gap:8, fontSize:'0.82rem' }}>
          <span style={{ color:'#22c55e', fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:22, height:22, borderRadius:'50%', background:'#22c55e', color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:10 }}><i className="fas fa-check"></i></span>
            Appointment Details
          </span>
          <div style={{ flex:1, height:2, background:'#22c55e', margin:'0 4px' }}></div>
          <span style={{ fontWeight:600, color:'#1a1a2e', display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:22, height:22, borderRadius:'50%', background:'#C9A84C', color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>2</span>
            Payment
          </span>
        </div>

        <div style={cardStyle}>
          <div style={headerStyle}>
            <div style={{ fontWeight:700, fontSize:'1.1rem' }}>Complete Your Payment</div>
            <div style={{ color:'#aaa', fontSize:'0.8rem', marginTop:2 }}>Step 2 of 2 — Secure checkout via Razorpay</div>
          </div>
          <div style={bodyStyle}>

            {/* Appointment Summary */}
            <div style={summaryStyle}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-semibold" style={{ fontSize:'0.9rem' }}>
                  <i className="fas fa-calendar-alt me-2" style={{ color:'#C9A84C' }}></i>Appointment Summary
                </span>
                <span style={{ background: appt.appointmentMode === 'online' ? 'rgba(59,130,246,0.1)' : 'rgba(201,168,76,0.15)', color: appt.appointmentMode === 'online' ? '#1d4ed8' : '#92650a', padding:'3px 10px', borderRadius:20, fontSize:'0.78rem', fontWeight:600 }}>
                  <i className={`fas ${appt.appointmentMode === 'online' ? 'fa-video' : 'fa-building'} me-1`}></i>
                  {appt.appointmentMode === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
              {[['Name', appt.name], ['Service', appt.service], ['Date & Time', `${dateStr} at ${appt.time}`], ['Consultation Fee', feeDisplay]].map(([l, v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', fontSize:'0.875rem', borderBottom:'1px solid rgba(201,168,76,0.1)' }}>
                  <span style={{ color:'#6b7280' }}>{l}</span>
                  <span style={{ fontWeight:600, color: l === 'Consultation Fee' ? '#C9A84C' : '#1f2937', fontSize: l === 'Consultation Fee' ? '1.1rem' : undefined }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Payment Cancelled / Failed Banner */}
            {verifyError === 'cancelled' && (
              <div style={{ background:'#fff8f0', border:'1.5px solid #f59e0b', borderRadius:14, padding:20, marginBottom:16, textAlign:'center' }}>
                <div style={{ width:56, height:56, borderRadius:'50%', background:'linear-gradient(135deg,#f59e0b,#d97706)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', boxShadow:'0 4px 15px rgba(245,158,11,0.3)' }}>
                  <i className="fas fa-times" style={{ color:'#fff', fontSize:'1.4rem' }}></i>
                </div>
                <div className="fw-bold mb-1" style={{ color:'#92400e' }}>Payment Cancelled</div>
                <p className="small text-muted mb-3">You closed the payment window. Your appointment is NOT confirmed yet. Click below to try again.</p>
                <button className="btn w-100 py-3 fw-bold" style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#fff', borderRadius:12, fontSize:'1rem' }} onClick={startRazorpay}>
                  <i className="fas fa-redo me-2"></i>Retry Payment — {feeDisplay}
                </button>
                <button className="btn btn-link text-muted small mt-2 w-100" onClick={() => navigate(-1)}>
                  Go back and change details
                </button>
              </div>
            )}

            {/* Razorpay — only payment method */}
            {verifyError !== 'cancelled' && (
            <div style={{ background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:14, padding:20, marginBottom:16 }}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" style={{ height:22, objectFit:'contain' }} />
                <span className="fw-semibold">Razorpay Secure Checkout</span>
              </div>
              <p className="small text-muted mb-3">
                <i className="fas fa-shield-alt text-success me-2"></i>
                Pay using any UPI app, debit/credit card, or net banking. Your appointment will be confirmed instantly after payment verification.
              </p>
              <div className="d-flex gap-2 flex-wrap mb-3">
                {['UPI QR','UPI Intent','Card'].map(m => (
                  <span key={m} className="badge bg-light text-dark border" style={{ fontWeight:500 }}>{m}</span>
                ))}
              </div>
              {verifyError && (
                <div className="alert alert-danger py-2 small mb-3" style={{ borderRadius:10 }}>
                  <i className="fas fa-exclamation-triangle me-2"></i>{verifyError}
                </div>
              )}
              <button className="btn w-100 py-3 fw-bold" style={{ background:'linear-gradient(135deg,#528FF0,#2563eb)', color:'#fff', borderRadius:12, fontSize:'1rem' }} onClick={startRazorpay}>
                <i className="fas fa-lock me-2"></i>{verifyError ? `Retry Payment — ${feeDisplay}` : `Pay ${feeDisplay} Securely`}
              </button>
            </div>
            )}

            <div className="d-flex justify-content-between align-items-center mt-3">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
                <i className="fas fa-arrow-left me-2"></i>Back
              </button>
              <div className="text-muted small">
                <i className="fas fa-lock me-1" style={{ color:'#22c55e' }}></i>256-bit SSL Encrypted
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
