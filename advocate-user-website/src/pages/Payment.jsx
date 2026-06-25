import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { getPaymentSettings, createCashfreeAppointmentOrder, getCashfreeOrderStatus, submitManualPayment } from '../api';

// ── Cashfree JS SDK loader ────────────────────────────────────────────────────
function loadCashfreeSDK() {
  return new Promise(resolve => {
    if (window.Cashfree) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button className="btn btn-sm btn-outline-secondary py-0 px-2" style={{ fontSize: '0.72rem', minWidth: 52 }}
      onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}>
      {copied ? <><i className="fas fa-check me-1 text-success"></i>Copied</> : <><i className="fas fa-copy me-1"></i>Copy</>}
    </button>
  );
}

const BANK_METHODS = [
  { id: 'bank_transfer', icon: 'fa-university', label: 'Bank Transfer', sub: 'NEFT / IMPS / RTGS' },
  { id: 'upi_id',        icon: 'fa-mobile-alt', label: 'UPI ID',        sub: 'PhonePe / GPay' },
  { id: 'qr_code',       icon: 'fa-qrcode',     label: 'QR Code',       sub: 'Scan & Pay' },
];

// ── Pending / success result screens ─────────────────────────────────────────
function PendingScreen({ appt, feeDisplay, utr, onHome, onProfile, user }) {
  const dateStr = appt.date ? new Date(appt.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  return (
    <div className="text-center">
      <div style={{ width:80,height:80,borderRadius:'50%',background:'linear-gradient(135deg,#f59e0b,#d97706)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',boxShadow:'0 8px 30px rgba(245,158,11,0.3)' }}>
        <i className="fas fa-clock" style={{ color:'#fff',fontSize:'2rem' }}></i>
      </div>
      <h4 className="fw-bold mb-1">Payment Submitted!</h4>
      <p className="text-muted mb-4">Pending admin verification — we'll confirm within a few hours.</p>
      <div style={{ background:'linear-gradient(135deg,#f9f5e8,#fff9ed)',border:'1.5px solid rgba(201,168,76,0.3)',borderRadius:14,padding:16,marginBottom:20,textAlign:'left' }}>
        {[['Name',appt.name],['Service',appt.service],['Date & Time',`${dateStr} at ${appt.time}`],['Amount',feeDisplay],['UTR / Transaction ID',utr]].map(([l,v]) => v ? (
          <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'5px 0',fontSize:'0.875rem',borderBottom:'1px solid rgba(201,168,76,0.12)' }}>
            <span style={{ color:'#6b7280' }}>{l}</span>
            <span style={{ fontWeight:600,maxWidth:'60%',textAlign:'right',wordBreak:'break-all' }}>{v}</span>
          </div>
        ) : null)}
        <div style={{ display:'flex',justifyContent:'space-between',padding:'5px 0',fontSize:'0.875rem' }}>
          <span style={{ color:'#6b7280' }}>Status</span>
          <span><span className="badge bg-warning text-dark">Pending Verification</span></span>
        </div>
      </div>
      <div className="d-grid gap-2">
        {user && <button className="btn btn-gold py-2" style={{ borderRadius:12 }} onClick={onProfile}><i className="fas fa-calendar-check me-2"></i>View My Appointments</button>}
        <button className="btn btn-outline-secondary py-2" style={{ borderRadius:12 }} onClick={onHome}><i className="fas fa-home me-2"></i>Back to Home</button>
      </div>
    </div>
  );
}

function SuccessScreen({ appt, feeDisplay, result, onHome, onProfile, user }) {
  const dateStr = appt?.date ? new Date(appt.date).toLocaleDateString('en-IN', { day:'2-digit',month:'short',year:'numeric' }) : '—';
  return (
    <div className="text-center">
      <div style={{ width:80,height:80,borderRadius:'50%',background:'linear-gradient(135deg,#22c55e,#16a34a)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',boxShadow:'0 8px 30px rgba(34,197,94,0.3)' }}>
        <i className="fas fa-check" style={{ color:'#fff',fontSize:'2rem' }}></i>
      </div>
      <h4 className="fw-bold mb-1">Appointment Confirmed!</h4>
      <p className="text-muted mb-4">Payment verified — your appointment is booked.</p>
      {result?.appointmentId && (
        <div className="mb-3">
          <div className="small text-muted mb-1">Appointment ID</div>
          <span style={{ background:'rgba(201,168,76,0.15)',color:'#92650a',padding:'4px 14px',borderRadius:20,fontSize:'0.82rem',fontWeight:700,fontFamily:'monospace' }}>{result.appointmentId}</span>
        </div>
      )}
      <div style={{ background:'#f9f5e8',border:'1.5px solid rgba(201,168,76,0.3)',borderRadius:14,padding:'16px 20px',marginBottom:20,textAlign:'left' }}>
        <div className="fw-bold text-center mb-3" style={{ color:'#1a1a2e' }}><i className="fas fa-receipt me-2" style={{ color:'#C9A84C' }}></i>PAYMENT RECEIPT</div>
        {[['Receipt ID',result?.receiptId],['Client Name',appt?.name],['Mobile',appt?.phone],['Service',appt?.service],['Date & Time',`${dateStr} at ${appt?.time}`],['Amount Paid',feeDisplay],['Payment Method','Cashfree (Online)'],['Status','✅ Confirmed']].map(([l,v]) => v ? (
          <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'5px 0',fontSize:'0.875rem',borderBottom:'1px solid rgba(201,168,76,0.15)' }}>
            <span style={{ color:'#6b7280' }}>{l}</span>
            <span style={{ fontWeight:600,textAlign:'right',maxWidth:'60%',wordBreak:'break-all',color:l==='Amount Paid'?'#C9A84C':'#1f2937' }}>{v}</span>
          </div>
        ) : null)}
      </div>
      <div className="d-grid gap-2">
        <button className="btn btn-dark py-2" style={{ borderRadius:12,border:'1.5px solid #C9A84C',color:'#C9A84C' }} onClick={() => window.print()}>
          <i className="fas fa-download me-2"></i>Download Receipt (PDF)
        </button>
        {user && <button className="btn btn-outline-secondary py-2" style={{ borderRadius:12 }} onClick={onProfile}><i className="fas fa-user me-2"></i>View My Appointments</button>}
        <button className="btn btn-outline-secondary py-2" style={{ borderRadius:12 }} onClick={onHome}><i className="fas fa-home me-2"></i>Back to Home</button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Payment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUserAuth();

  const [appt, setAppt]         = useState(null);
  const [settings, setSettings] = useState({});
  const [tab, setTab]           = useState('online');   // 'online' | 'bank'
  const [bankMethod, setBankMethod] = useState('bank_transfer');
  const [utr, setUtr]           = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [loadText, setLoadText] = useState('');
  const [err, setErr]           = useState('');
  const [screen, setScreen]     = useState('payment'); // payment | pending | success
  const [result, setResult]     = useState(null);
  const pollRef = useRef(null);

  const API_BASE = 'https://chauhanadvocate.onrender.com';

  // ── Load appointment + settings ──────────────────────────────────────────
  useEffect(() => {
    const raw = sessionStorage.getItem('pendingAppointment');
    if (!raw) { navigate('/#appointment'); return; }
    setAppt(JSON.parse(raw));
    getPaymentSettings().then(r => { if (r.data.success) setSettings(r.data.data); }).catch(() => {});
  }, []);

  // ── Handle Cashfree return URL (?order_id=...&status=...) ─────────────────
  useEffect(() => {
    const orderId = searchParams.get('order_id');
    const status  = searchParams.get('status');
    if (!orderId) return;
    if (status === 'PAID') {
      pollOrderStatus(orderId);
    } else if (status && status !== 'ACTIVE') {
      setErr('Payment was not completed. Please try again or use bank transfer.');
    }
  }, [searchParams]);

  if (!appt) return null;

  const fee = Number(appt.amount || (appt.appointmentMode === 'online' ? 1 : 2));
  const feeDisplay = `₹${fee.toLocaleString('en-IN')}`;
  const dateStr = appt.date ? new Date(appt.date).toLocaleDateString('en-IN', { day:'2-digit',month:'short',year:'numeric' }) : '—';
  const qrUrl = settings.payment_qr_image
    ? (settings.payment_qr_image.startsWith('http') ? settings.payment_qr_image : API_BASE + settings.payment_qr_image)
    : '';
  const cashfreeEnabled = !!(settings.cashfree_app_id);
  const cashfreeEnv     = settings.cashfree_environment || 'production';

  // If no Cashfree configured, default to bank tab
  useEffect(() => {
    if (settings.cashfree_app_id === undefined) return;
    if (!cashfreeEnabled) setTab('bank');
  }, [settings]);

  // ── Cashfree online payment ───────────────────────────────────────────────
  const startCashfree = async () => {
    setErr(''); setLoading(true); setLoadText('Setting up secure checkout…');
    try {
      const loaded = await loadCashfreeSDK();
      if (!loaded) { setErr('Could not load payment SDK. Check your internet connection.'); setLoading(false); return; }

      const { data } = await createCashfreeAppointmentOrder({ ...appt, amount: fee });
      setLoading(false);
      if (!data.success) { setErr(data.message || 'Could not create payment order. Please try again.'); return; }

      const cf = window.Cashfree({ mode: cashfreeEnv === 'sandbox' ? 'sandbox' : 'production' });

      const cfResult = await cf.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget:   '_modal',
      });

      if (cfResult.error) {
        setErr(cfResult.error.message || 'Payment failed. Please try again.');
        return;
      }

      if (cfResult.paymentDetails || cfResult.redirect) {
        setLoadText('Verifying payment…');
        setLoading(true);
        await pollOrderStatus(data.order_id);
      }
    } catch (e) {
      setLoading(false);
      setErr(e?.response?.data?.message || e?.message || 'Payment error. Please try again.');
    }
  };

  const pollOrderStatus = async (orderId, attempt = 0) => {
    if (pollRef.current) clearTimeout(pollRef.current);
    try {
      const { data } = await getCashfreeOrderStatus(orderId);
      if (data.payment_status === 'approved' || data.order_status === 'PAID') {
        sessionStorage.removeItem('pendingAppointment');
        setResult(data);
        setLoading(false);
        setScreen('success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (attempt < 8) {
        pollRef.current = setTimeout(() => pollOrderStatus(orderId, attempt + 1), 2500);
      } else {
        setLoading(false);
        setErr('Payment verification is taking longer than expected. Check your appointments in a few minutes.');
      }
    } catch {
      setLoading(false);
      setErr('Could not verify payment status. Check My Appointments shortly.');
    }
  };

  // ── Manual bank transfer ─────────────────────────────────────────────────
  const handleManualSubmit = async () => {
    if (!utr.trim()) { setErr('Please enter your Transaction / UTR Reference Number.'); return; }
    setLoading(true); setErr(''); setLoadText('Submitting…');
    try {
      const fd = new FormData();
      Object.entries(appt).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, v); });
      fd.append('paymentMethod', bankMethod);
      fd.append('utrNumber', utr.trim());
      if (screenshot) fd.append('screenshot', screenshot);
      const { data } = await submitManualPayment(fd);
      if (data.success) {
        sessionStorage.removeItem('pendingAppointment');
        setScreen('pending');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErr(data.message || 'Submission failed. Please try again.');
      }
    } catch { setErr('Network error. Please try again.'); }
    setLoading(false);
  };

  // ── Shared layout vars ────────────────────────────────────────────────────
  const cardStyle   = { background:'#fff', borderRadius:20, boxShadow:'0 4px 30px rgba(0,0,0,0.08)', overflow:'hidden' };
  const headerStyle = { background:'linear-gradient(135deg,#1a1a2e,#16213e)', padding:'20px 24px', color:'#fff' };
  const bodyStyle   = { padding:24 };

  const goHome    = () => navigate('/');
  const goProfile = () => navigate('/profile?tab=appointments');

  // ── Success screen ────────────────────────────────────────────────────────
  if (screen === 'success') {
    return (
      <div style={{ background:'linear-gradient(135deg,#f0f4f8,#e8ecf0)',minHeight:'100vh',padding:'24px 0' }}>
        <div className="container" style={{ maxWidth:520 }}>
          <div style={cardStyle}><div style={bodyStyle}>
            <SuccessScreen appt={appt} feeDisplay={feeDisplay} result={result} onHome={goHome} onProfile={goProfile} user={user} />
          </div></div>
        </div>
      </div>
    );
  }

  // ── Pending screen ────────────────────────────────────────────────────────
  if (screen === 'pending') {
    return (
      <div style={{ background:'linear-gradient(135deg,#f0f4f8,#e8ecf0)',minHeight:'100vh',padding:'24px 0' }}>
        <div className="container" style={{ maxWidth:520 }}>
          <div style={cardStyle}><div style={bodyStyle}>
            <PendingScreen appt={appt} feeDisplay={feeDisplay} utr={utr} onHome={goHome} onProfile={goProfile} user={user} />
          </div></div>
        </div>
      </div>
    );
  }

  // ── Payment screen ────────────────────────────────────────────────────────
  return (
    <div style={{ background:'linear-gradient(135deg,#f0f4f8,#e8ecf0)',minHeight:'100vh',padding:'24px 0' }}>
      {loading && (
        <div style={{ position:'fixed',inset:0,background:'rgba(255,255,255,0.88)',zIndex:9999,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16 }}>
          <div className="spinner-border text-warning" style={{ width:48,height:48 }}></div>
          <div className="text-muted small">{loadText || 'Processing…'}</div>
        </div>
      )}
      <div className="container" style={{ maxWidth:560 }}>

        {/* Progress */}
        <div style={{ background:'#fff',borderRadius:12,padding:'12px 20px',marginBottom:16,display:'flex',alignItems:'center',gap:8,fontSize:'0.82rem' }}>
          <span style={{ color:'#22c55e',fontWeight:600,display:'flex',alignItems:'center',gap:6 }}>
            <span style={{ width:22,height:22,borderRadius:'50%',background:'#22c55e',color:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:10 }}><i className="fas fa-check"></i></span>
            Appointment Details
          </span>
          <div style={{ flex:1,height:2,background:'#22c55e',margin:'0 4px' }}></div>
          <span style={{ fontWeight:600,color:'#1a1a2e',display:'flex',alignItems:'center',gap:6 }}>
            <span style={{ width:22,height:22,borderRadius:'50%',background:'#C9A84C',color:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11 }}>2</span>
            Payment
          </span>
        </div>

        <div style={cardStyle}>
          <div style={headerStyle}>
            <div style={{ fontWeight:700,fontSize:'1.1rem' }}>Complete Your Payment</div>
            <div style={{ color:'#aaa',fontSize:'0.8rem',marginTop:2 }}>Choose how you'd like to pay</div>
          </div>
          <div style={bodyStyle}>

            {/* Appointment Summary */}
            <div style={{ background:'linear-gradient(135deg,#f9f5e8,#fff9ed)',border:'1.5px solid rgba(201,168,76,0.3)',borderRadius:14,padding:16,marginBottom:20 }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-semibold" style={{ fontSize:'0.9rem' }}>
                  <i className="fas fa-calendar-alt me-2" style={{ color:'#C9A84C' }}></i>Appointment Summary
                </span>
                <span style={{ background:appt.appointmentMode==='online'?'rgba(59,130,246,0.1)':'rgba(201,168,76,0.15)',color:appt.appointmentMode==='online'?'#1d4ed8':'#92650a',padding:'3px 10px',borderRadius:20,fontSize:'0.78rem',fontWeight:600 }}>
                  <i className={`fas ${appt.appointmentMode==='online'?'fa-video':'fa-building'} me-1`}></i>
                  {appt.appointmentMode==='online'?'Online':'Offline'}
                </span>
              </div>
              {[['Name',appt.name],['Service',appt.service],['Date & Time',`${dateStr} at ${appt.time}`],['Amount to Pay',feeDisplay]].map(([l,v]) => (
                <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'5px 0',fontSize:'0.875rem',borderBottom:'1px solid rgba(201,168,76,0.1)' }}>
                  <span style={{ color:'#6b7280' }}>{l}</span>
                  <span style={{ fontWeight:600,color:l==='Amount to Pay'?'#C9A84C':'#1f2937',fontSize:l==='Amount to Pay'?'1.1rem':undefined }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Payment mode tabs */}
            <div className="d-flex gap-2 mb-4">
              {cashfreeEnabled && (
                <button onClick={() => { setTab('online'); setErr(''); }}
                  className={`btn flex-fill ${tab==='online'?'btn-gold':'btn-outline-secondary'}`} style={{ borderRadius:10,fontWeight:600,fontSize:'0.88rem' }}>
                  <i className="fas fa-bolt me-2"></i>Pay Online
                  <div style={{ fontSize:'0.7rem',fontWeight:400,opacity:0.8 }}>Instant confirmation</div>
                </button>
              )}
              <button onClick={() => { setTab('bank'); setErr(''); }}
                className={`btn flex-fill ${tab==='bank'?'btn-gold':'btn-outline-secondary'}`} style={{ borderRadius:10,fontWeight:600,fontSize:'0.88rem' }}>
                <i className="fas fa-university me-2"></i>Bank Transfer
                <div style={{ fontSize:'0.7rem',fontWeight:400,opacity:0.8 }}>Manual verification</div>
              </button>
            </div>

            {/* ── PAY ONLINE (Cashfree) ── */}
            {tab === 'online' && (
              <div>
                <div style={{ background:'#f0fdf4',border:'1.5px solid #86efac',borderRadius:14,padding:'16px 20px',marginBottom:20 }}>
                  <div className="fw-semibold mb-1" style={{ color:'#166534',fontSize:'0.9rem' }}>
                    <i className="fas fa-shield-alt me-2 text-success"></i>Secure Online Payment via Cashfree
                  </div>
                  <p className="small mb-2" style={{ color:'#166534' }}>
                    Pay using UPI (PhonePe, GPay, Paytm), debit/credit card, or net banking.
                    Your appointment is <strong>confirmed instantly</strong> after payment.
                  </p>
                  <div className="d-flex gap-2 flex-wrap">
                    {['UPI','Cards','Net Banking','Wallets'].map(m => (
                      <span key={m} className="badge bg-light text-dark border" style={{ fontWeight:500,fontSize:'0.75rem' }}>{m}</span>
                    ))}
                  </div>
                </div>
                {err && <div className="alert alert-danger py-2 small mb-3" style={{ borderRadius:10 }}><i className="fas fa-exclamation-triangle me-2"></i>{err}</div>}
                <button className="btn btn-gold w-100 py-3 fw-bold" style={{ borderRadius:12,fontSize:'1rem' }} onClick={startCashfree} disabled={loading}>
                  <i className="fas fa-bolt me-2"></i>Pay {feeDisplay} Securely Online
                </button>
              </div>
            )}

            {/* ── BANK TRANSFER ── */}
            {tab === 'bank' && (
              <div>
                {/* Method selector */}
                <div className="mb-3">
                  <div className="fw-semibold mb-2" style={{ fontSize:'0.85rem',color:'#374151' }}>
                    <span style={{ background:'#C9A84C',color:'#fff',borderRadius:'50%',width:20,height:20,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,marginRight:8 }}>1</span>
                    Choose Transfer Method
                  </div>
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8 }}>
                    {BANK_METHODS.map(m => (
                      <div key={m.id} onClick={() => setBankMethod(m.id)} style={{ border:`2px solid ${bankMethod===m.id?'#C9A84C':'#e5e7eb'}`,borderRadius:12,padding:'10px 6px',cursor:'pointer',background:bankMethod===m.id?'#f9f5e8':'#fff',textAlign:'center',transition:'all 0.2s',boxShadow:bankMethod===m.id?'0 2px 12px rgba(201,168,76,0.2)':'none' }}>
                        <i className={`fas ${m.icon}`} style={{ fontSize:18,color:'#C9A84C',display:'block',marginBottom:3 }}></i>
                        <div style={{ fontWeight:600,fontSize:'0.74rem',color:'#374151' }}>{m.label}</div>
                        <div style={{ fontSize:'0.66rem',color:'#9ca3af' }}>{m.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Account details */}
                <div className="mb-3">
                  <div className="fw-semibold mb-2" style={{ fontSize:'0.85rem',color:'#374151' }}>
                    <span style={{ background:'#C9A84C',color:'#fff',borderRadius:'50%',width:20,height:20,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,marginRight:8 }}>2</span>
                    Transfer {feeDisplay} to
                  </div>
                  <div style={{ background:'linear-gradient(135deg,#f9f5e8,#fff9ed)',border:'1.5px solid rgba(201,168,76,0.35)',borderRadius:14,padding:'14px 16px' }}>
                    {(bankMethod === 'qr_code' || bankMethod === 'upi_id') && qrUrl && (
                      <div className="text-center mb-2"><img src={qrUrl} alt="QR" style={{ maxWidth:150,borderRadius:10 }} /></div>
                    )}
                    {bankMethod !== 'bank_transfer' && settings.payment_upi_id && (
                      <div className="d-flex align-items-center gap-2 mb-2" style={{ background:'#fff',border:'1.5px dashed #C9A84C',borderRadius:8,padding:'7px 12px' }}>
                        <i className="fas fa-mobile-alt" style={{ color:'#C9A84C' }}></i>
                        <span style={{ fontFamily:'monospace',fontWeight:700,flex:1 }}>{settings.payment_upi_id}</span>
                        <CopyButton text={settings.payment_upi_id} />
                      </div>
                    )}
                    {bankMethod === 'bank_transfer' && (
                      <div className="d-flex flex-column gap-1">
                        {[['Account Holder',settings.bank_account_holder,'fa-user'],['Bank Name',settings.bank_name,'fa-university'],['Account Number',settings.bank_account_number,'fa-credit-card'],['IFSC Code',settings.bank_ifsc,'fa-code'],['UPI ID',settings.payment_upi_id,'fa-mobile-alt']].filter(([,v])=>v).map(([label,value,icon])=>(
                          <div key={label} style={{ background:'#fff',border:'1px solid #e5e7eb',borderRadius:8,padding:'7px 12px' }}>
                            <div className="d-flex align-items-center justify-content-between gap-2">
                              <span style={{ color:'#6b7280',fontSize:'0.76rem',minWidth:90 }}><i className={`fas ${icon} me-2`} style={{ color:'#C9A84C' }}></i>{label}</span>
                              <div className="d-flex align-items-center gap-1 ms-auto">
                                <span style={{ fontFamily:'monospace',fontWeight:700,fontSize:'0.88rem' }}>{value}</span>
                                <CopyButton text={value} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* UTR + screenshot */}
                <div className="mb-2">
                  <div className="fw-semibold mb-2" style={{ fontSize:'0.85rem',color:'#374151' }}>
                    <span style={{ background:'#C9A84C',color:'#fff',borderRadius:'50%',width:20,height:20,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,marginRight:8 }}>3</span>
                    Submit Transaction Details
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">UTR / Transaction Reference <span className="text-danger">*</span></label>
                    <input className="form-control" value={utr} onChange={e=>{setUtr(e.target.value);setErr('');}} placeholder="12-digit UTR or Transaction ID" style={{ borderRadius:10 }} />
                    <div className="form-text"><i className="fas fa-info-circle me-1"></i>Find it in your UPI app or bank's transaction history</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Screenshot <span className="text-muted fw-normal">(optional)</span></label>
                    <input type="file" className="form-control" accept="image/*" onChange={e=>setScreenshot(e.target.files[0])} style={{ borderRadius:10 }} />
                  </div>
                  {err && <div className="alert alert-danger py-2 small mb-3" style={{ borderRadius:10 }}><i className="fas fa-exclamation-triangle me-2"></i>{err}</div>}
                  <button className="btn btn-gold w-100 py-3 fw-bold" style={{ borderRadius:12,fontSize:'1rem' }} onClick={handleManualSubmit} disabled={loading}>
                    {loading?<><i className="fas fa-spinner fa-spin me-2"></i>Submitting…</>:<><i className="fas fa-paper-plane me-2"></i>Submit Payment Details</>}
                  </button>
                </div>
              </div>
            )}

            <div className="d-flex justify-content-between align-items-center mt-3">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
                <i className="fas fa-arrow-left me-2"></i>Back
              </button>
              <div className="text-muted small">
                <i className="fas fa-shield-alt me-1" style={{ color:'#22c55e' }}></i>
                {tab==='online'?'256-bit SSL Encrypted':'Verified manually by admin'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
