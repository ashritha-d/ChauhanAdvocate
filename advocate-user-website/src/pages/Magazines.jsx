import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import { useUserAuth } from '../context/UserAuthContext';
import { savePendingAction } from '../utils/pendingAction';
import {
  getMagazines, checkMagazinePurchase,
  getPaymentSettings, submitMagazineManualPayment,
  createMagazineCashfreeOrder, getCashfreeOrderStatus,
  downloadMagazineFull, downloadMagazinePreview,
} from '../api';
import { mediaUrl } from '../utils/helpers';

const PLACEHOLDER = `${import.meta.env.BASE_URL}placeholder-lawyer.svg`;
const PER_PAGE = 9;
const API_BASE = 'https://chauhanadvocate.onrender.com';

const METHODS = [
  { id: 'bank_transfer', icon: 'fa-university', label: 'Bank Transfer' },
  { id: 'upi_id',        icon: 'fa-mobile-alt', label: 'UPI / GPay' },
  { id: 'qr_code',       icon: 'fa-qrcode',     label: 'QR Code' },
];

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function CopyBtn({ text }) {
  const [done, setDone] = useState(false);
  return (
    <button className="btn btn-sm btn-outline-secondary py-0 px-2" style={{ fontSize: '0.7rem' }}
      onClick={() => { navigator.clipboard?.writeText(text); setDone(true); setTimeout(() => setDone(false), 1600); }}>
      {done ? <><i className="fas fa-check text-success me-1"></i>Copied</> : <><i className="fas fa-copy me-1"></i>Copy</>}
    </button>
  );
}

function loadCashfreeSDK() {
  return new Promise(resolve => {
    if (window.Cashfree) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

function PurchaseModal({ magazine, onClose, onSuccess, authHeader }) {
  const [tab,        setTab]        = useState('online'); // online | bank
  const [step,       setStep]       = useState('form');   // form | pending | success | error
  const [method,     setMethod]     = useState('bank_transfer');
  const [utr,        setUtr]        = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [err,        setErr]        = useState('');
  const [loading,    setLoading]    = useState(false);
  const [settings,   setSettings]   = useState({});
  const pollRef = useRef(null);

  useEffect(() => {
    getPaymentSettings().then(r => { if (r.data.success) setSettings(r.data.data); }).catch(() => {});
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, []);

  const cashfreeEnabled = !!(settings.cashfree_app_id);
  const cashfreeEnv     = settings.cashfree_environment || 'production';
  const qrUrl = settings.payment_qr_image
    ? (settings.payment_qr_image.startsWith('http') ? settings.payment_qr_image : API_BASE + settings.payment_qr_image)
    : '';

  // If Cashfree not configured, force bank tab
  useEffect(() => {
    if (settings.cashfree_app_id !== undefined && !cashfreeEnabled) setTab('bank');
  }, [settings]);

  // ── Pay Online (Cashfree) ──────────────────────────────────────────────────
  const startCashfree = async () => {
    setErr(''); setLoading(true);
    try {
      const loaded = await loadCashfreeSDK();
      if (!loaded) { setErr('Could not load payment SDK. Try bank transfer instead.'); setLoading(false); return; }

      const { data } = await createMagazineCashfreeOrder(magazine._id, authHeader());
      setLoading(false);
      if (!data.success) { setErr(data.message || 'Could not create payment order.'); return; }

      const cf = window.Cashfree({ mode: cashfreeEnv === 'sandbox' ? 'sandbox' : 'production' });
      const cfResult = await cf.checkout({ paymentSessionId: data.payment_session_id, redirectTarget: '_modal' });

      if (cfResult.error) { setErr(cfResult.error.message || 'Payment failed.'); return; }

      if (cfResult.paymentDetails || cfResult.redirect) {
        setLoading(true);
        pollStatus(data.order_id);
      }
    } catch (e) {
      setLoading(false);
      setErr(e?.response?.data?.message || e?.message || 'Payment error. Try bank transfer.');
    }
  };

  const pollStatus = (orderId, attempt = 0) => {
    pollRef.current = setTimeout(async () => {
      try {
        const { data } = await getCashfreeOrderStatus(orderId);
        if (data.payment_status === 'approved' || data.order_status === 'PAID') {
          setLoading(false); setStep('success');
          onSuccess(magazine._id, 'paid');
        } else if (attempt < 8) {
          pollStatus(orderId, attempt + 1);
        } else {
          setLoading(false);
          setErr('Verification pending. Your access will be unlocked shortly. Check My Profile → My Magazines.');
        }
      } catch { setLoading(false); setErr('Verification failed. Check My Magazines shortly.'); }
    }, 2500);
  };

  // ── Bank Transfer (Manual) ─────────────────────────────────────────────────
  const handleManualSubmit = async () => {
    if (!utr.trim()) { setErr('Please enter your Transaction / UTR Reference Number.'); return; }
    setLoading(true); setErr('');
    try {
      const fd = new FormData();
      fd.append('utrNumber', utr.trim());
      fd.append('paymentMethod', method);
      if (screenshot) fd.append('screenshot', screenshot);
      const { data } = await submitMagazineManualPayment(magazine._id, fd, authHeader());
      if (data.success) { setStep('pending'); onSuccess(magazine._id, 'pending'); }
      else setErr(data.message || 'Submission failed. Please try again.');
    } catch (e) {
      setErr(e?.response?.data?.message || 'Network error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="course-enroll-modal" style={{ maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <button className="jr-modal-close" onClick={onClose}>&times;</button>

        {/* ── Success / Pending screens ── */}
        {step === 'success' && (
          <div className="form-success-screen py-3 text-center">
            <div style={{ fontSize:'3rem',color:'#22c55e',marginBottom:12 }}><i className="fas fa-check-circle"></i></div>
            <h5 className="fw-bold mb-2">Purchase Successful!</h5>
            <p className="text-muted small mb-3">You can now download <strong>{magazine.title}</strong>.<br />Find it in My Profile → My Magazines.</p>
            <button className="btn btn-gold mt-2 px-5" onClick={onClose}><i className="fas fa-download me-2"></i>Close</button>
          </div>
        )}
        {step === 'pending' && (
          <div className="form-success-screen py-3 text-center">
            <div style={{ fontSize:'3rem',color:'#f59e0b',marginBottom:12 }}><i className="fas fa-clock"></i></div>
            <h5 className="fw-bold mb-2">Payment Submitted!</h5>
            <p className="text-muted small mb-3">Your purchase of <strong>{magazine.title}</strong> is <strong>pending verification</strong>. Access unlocks within a few hours.</p>
            <p className="small text-muted"><i className="fas fa-bell me-1" style={{ color:'#C9A84C' }}></i>You'll be notified on WhatsApp once approved.</p>
            <button className="btn btn-gold mt-3 px-5" onClick={onClose}><i className="fas fa-check me-2"></i>Done</button>
          </div>
        )}

        {/* ── Payment form ── */}
        {step === 'form' && (
          <>
            {loading && (
              <div style={{ position:'absolute',inset:0,background:'rgba(255,255,255,0.9)',zIndex:10,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,borderRadius:16 }}>
                <div className="spinner-border text-warning"></div>
                <div className="text-muted small">Processing payment…</div>
              </div>
            )}

            <h5 className="mb-1" style={{ fontFamily:"'Playfair Display',serif" }}>
              <i className="fas fa-book-open text-gold me-2"></i>Purchase Magazine
            </h5>

            {/* Magazine info */}
            <div className="mag-purchase-info mb-3">
              {magazine.coverImage && (
                <img src={mediaUrl(magazine.coverImage)} alt={magazine.title} className="mag-purchase-thumb" onError={e=>{e.target.style.display='none';}} />
              )}
              <div>
                <div className="fw-semibold">{magazine.title}</div>
                {magazine.issueNumber && <div className="text-muted small">{magazine.issueNumber}</div>}
                <div className="mag-purchase-price">₹{magazine.price}</div>
              </div>
            </div>

            {/* Tab selector */}
            <div className="d-flex gap-2 mb-3">
              {cashfreeEnabled && (
                <button onClick={()=>{setTab('online');setErr('');}} className={`btn btn-sm flex-fill ${tab==='online'?'btn-gold':'btn-outline-secondary'}`} style={{ fontWeight:600 }}>
                  <i className="fas fa-bolt me-1"></i>Pay Online
                </button>
              )}
              <button onClick={()=>{setTab('bank');setErr('');}} className={`btn btn-sm flex-fill ${tab==='bank'?'btn-gold':'btn-outline-secondary'}`} style={{ fontWeight:600 }}>
                <i className="fas fa-university me-1"></i>Bank Transfer
              </button>
            </div>

            {/* ── Online tab ── */}
            {tab === 'online' && (
              <div>
                <div style={{ background:'#f0fdf4',border:'1.5px solid #86efac',borderRadius:10,padding:'12px 14px',marginBottom:14 }}>
                  <div className="small fw-semibold mb-1" style={{ color:'#166534' }}>
                    <i className="fas fa-shield-alt me-1 text-success"></i>Secure payment via Cashfree
                  </div>
                  <div className="small" style={{ color:'#166534' }}>UPI, Cards, Net Banking — confirmed <strong>instantly</strong>.</div>
                </div>
                {err && <div className="alert alert-danger py-2 small mb-3" style={{ borderRadius:8 }}>{err}</div>}
                <div className="d-flex gap-2">
                  <button className="btn btn-gold flex-grow-1" onClick={startCashfree} disabled={loading}>
                    <i className="fas fa-bolt me-2"></i>Pay ₹{magazine.price} Online
                  </button>
                  <button className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
                </div>
              </div>
            )}

            {/* ── Bank transfer tab ── */}
            {tab === 'bank' && (
              <div>
                {/* Method selector */}
                <div className="d-flex gap-2 mb-2">
                  {METHODS.map(m => (
                    <button key={m.id} type="button" className={`btn btn-sm flex-fill ${method===m.id?'btn-gold':'btn-outline-secondary'}`} style={{ fontSize:'0.74rem' }} onClick={()=>setMethod(m.id)}>
                      <i className={`fas ${m.icon} me-1`}></i>{m.label}
                    </button>
                  ))}
                </div>

                {/* Account details */}
                <div style={{ background:'linear-gradient(135deg,#f9f5e8,#fff9ed)',border:'1.5px solid rgba(201,168,76,0.3)',borderRadius:12,padding:'12px 14px',marginBottom:12 }}>
                  <div className="small fw-bold mb-2" style={{ color:'#92650a' }}><i className="fas fa-info-circle me-1" style={{ color:'#C9A84C' }}></i>Send ₹{magazine.price} to:</div>
                  {(method==='qr_code'||method==='upi_id') && qrUrl && (
                    <div className="text-center mb-2"><img src={qrUrl} alt="QR" style={{ maxWidth:120,borderRadius:8 }} /></div>
                  )}
                  {method !== 'bank_transfer' && settings.payment_upi_id && (
                    <div className="d-flex align-items-center gap-2" style={{ background:'#fff',border:'1.5px dashed #C9A84C',borderRadius:7,padding:'5px 10px' }}>
                      <i className="fas fa-mobile-alt" style={{ color:'#C9A84C' }}></i>
                      <span style={{ fontFamily:'monospace',fontWeight:700,flex:1,fontSize:'0.88rem' }}>{settings.payment_upi_id}</span>
                      <CopyBtn text={settings.payment_upi_id} />
                    </div>
                  )}
                  {method === 'bank_transfer' && (
                    <div className="d-flex flex-column gap-1">
                      {[['Account Holder',settings.bank_account_holder],['Bank',settings.bank_name],['Account No.',settings.bank_account_number],['IFSC',settings.bank_ifsc],['UPI ID',settings.payment_upi_id]].filter(([,v])=>v).map(([label,value])=>(
                        <div key={label} style={{ background:'#fff',border:'1px solid #e5e7eb',borderRadius:7,padding:'4px 10px' }}>
                          <div className="d-flex align-items-center justify-content-between">
                            <span style={{ color:'#6b7280',fontSize:'0.72rem',minWidth:80 }}>{label}</span>
                            <div className="d-flex align-items-center gap-1 ms-auto">
                              <span style={{ fontFamily:'monospace',fontWeight:700,fontSize:'0.8rem' }}>{value}</span>
                              <CopyBtn text={value} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mb-2">
                  <label className="form-label small fw-semibold">UTR / Transaction ID <span className="text-danger">*</span></label>
                  <input className="form-control form-control-sm" value={utr} onChange={e=>{setUtr(e.target.value);setErr('');}} placeholder="Transaction reference number" style={{ borderRadius:8 }} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Screenshot <span className="text-muted fw-normal">(optional)</span></label>
                  <input type="file" className="form-control form-control-sm" accept="image/*" onChange={e=>setScreenshot(e.target.files[0])} style={{ borderRadius:8 }} />
                </div>
                {err && <div className="alert alert-danger py-2 small mb-3" style={{ borderRadius:8 }}>{err}</div>}
                <div className="d-flex gap-2">
                  <button className="btn btn-gold flex-grow-1" onClick={handleManualSubmit} disabled={loading}>
                    {loading?<><i className="fas fa-spinner fa-spin me-2"></i>Submitting…</>:<><i className="fas fa-paper-plane me-2"></i>Submit Payment</>}
                  </button>
                  <button className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function MagazinesPage() {
  const { user, authHeader } = useUserAuth();
  const navigate = useNavigate();
  const [magazines, setMagazines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slowLoad, setSlowLoad] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [purchases, setPurchases] = useState({});
  const [pendingPurchases, setPendingPurchases] = useState({});
  const [purchasing, setPurchasing] = useState(null);

  const fetchMagazines = useCallback(() => {
    setLoading(true);
    setSlowLoad(false);
    const timer = setTimeout(() => setSlowLoad(true), 5000);
    const params = filter !== 'all' ? { type: filter } : {};
    getMagazines(params)
      .then(r => { if (r.data.success) setMagazines(r.data.data || []); })
      .catch(() => {
        setTimeout(() => {
          getMagazines(filter !== 'all' ? { type: filter } : {})
            .then(r => { if (r.data.success) setMagazines(r.data.data || []); })
            .catch(() => {})
            .finally(() => setLoading(false));
        }, 10000);
        return;
      })
      .finally(() => { clearTimeout(timer); setLoading(false); });
  }, [filter]);

  useEffect(() => { fetchMagazines(); setPage(1); }, [fetchMagazines]);

  useEffect(() => {
    if (!user || !magazines.length) return;
    const paidMags = magazines.filter(m => m.type === 'paid');
    if (!paidMags.length) return;
    Promise.allSettled(paidMags.map(m => checkMagazinePurchase(m._id, authHeader())))
      .then(results => {
        const bought = {};
        const pending = {};
        results.forEach((res, i) => {
          if (res.status === 'fulfilled') {
            if (res.value.data.purchased) bought[paidMags[i]._id] = true;
            if (res.value.data.pending)   pending[paidMags[i]._id] = true;
          }
        });
        setPurchases(bought);
        setPendingPurchases(pending);
      });
  }, [magazines, user]);

  const handlePurchase = (mag) => {
    if (!user) { savePendingAction('magazines'); navigate('/login'); return; }
    if (pendingPurchases[mag._id]) return;
    setPurchasing(mag);
  };

  const handlePreview = async (mag) => {
    try {
      const r = await downloadMagazinePreview(mag._id);
      if (r.data.success && r.data.url) {
        const url = r.data.url.startsWith('http') ? r.data.url
          : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://chauhanadvocate.onrender.com'}${r.data.url}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Preview not available.');
    }
  };

  const handleDownload = async (mag) => {
    if (!user) { savePendingAction('magazines'); navigate('/login'); return; }
    try {
      const r = await downloadMagazineFull(mag._id, authHeader());
      if (r.data.success && r.data.url) {
        const url = r.data.url.startsWith('http') ? r.data.url
          : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://chauhanadvocate.onrender.com'}${r.data.url}`;
        const a = document.createElement('a');
        a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.click();
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Download failed. Please try again.');
    }
  };

  const filtered = magazines.filter(m => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return m.title?.toLowerCase().includes(q) ||
           m.category?.toLowerCase().includes(q) ||
           m.description?.toLowerCase().includes(q) ||
           m.issueNumber?.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <section id="magazines" className="section-padding bg-light" style={{ paddingTop: '2rem' }}>
      <SEOHead
        title="Legal Magazines & Publications"
        description="Browse and download legal magazines and publications by Advocate Chauhan. Free and paid editions covering law updates, case studies, and legal guidance."
        canonical="/magazines"
      />
      <div className="container">
        <div className="text-center mb-5" data-aos="fade-up">
          <div className="section-label">Publications</div>
          <h2 className="section-title">Legal <span className="text-gold">Magazines</span></h2>
          <p className="section-subtitle">Browse and download curated legal publications and magazines</p>
        </div>

        {/* Search + filter controls */}
        <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-3">
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 400 }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }}></i>
            <input
              type="text"
              className="form-control"
              placeholder="Search magazines…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingLeft: 40, borderRadius: 30, border: '1px solid #ddd' }}
            />
          </div>
          <div className="d-flex gap-2">
            {[
              { id: 'all',  label: 'All' },
              { id: 'free', label: 'Free',  icon: 'fa-unlock' },
              { id: 'paid', label: 'Paid',  icon: 'fa-lock' },
            ].map(f => (
              <button
                key={f.id}
                className={`btn btn-sm ${filter === f.id ? 'btn-gold' : 'btn-outline-secondary'}`}
                onClick={() => { setFilter(f.id); setPage(1); }}
              >
                {f.icon && <i className={`fas ${f.icon} me-1`}></i>}
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {!loading && (
          <p className="text-muted small mb-4">
            {filtered.length} magazine{filtered.length !== 1 ? 's' : ''} found{search && ` for "${search}"`}
          </p>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--gold)' }}></div>
            {slowLoad && (
              <div className="mt-3">
                <p className="text-muted small mb-2">Server is starting up, please wait a moment…</p>
                <button className="btn btn-sm btn-outline-secondary" onClick={fetchMagazines}>
                  <i className="fas fa-redo me-1"></i>Retry Now
                </button>
              </div>
            )}
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-5">
            <i className="fas fa-book-open fa-3x mb-3" style={{ color: 'var(--gold)' }}></i>
            <h5>{search ? 'No magazines match your search' : 'No Magazines Yet'}</h5>
            <p className="text-muted">
              {search
                ? 'Try a different keyword or clear the filters.'
                : 'Legal publications are being prepared. Stay tuned!'}
            </p>
            {(search || filter !== 'all') && (
              <button className="btn btn-outline-secondary btn-sm mt-2" onClick={() => { setSearch(''); setFilter('all'); }}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="row g-4">
              {paginated.map((mag, i) => {
                const isPaid = mag.type === 'paid';
                const hasPurchased = !!purchases[mag._id];
                const hasPreview = !!(mag.previewPdf || (!isPaid && mag.pdfFile));

                return (
                  <div key={mag._id} className="col-lg-4 col-md-6 card-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="course-card">
                      <div className="course-card-thumb">
                        {mag.coverImage
                          ? <img src={mediaUrl(mag.coverImage)} alt={mag.title}
                              onError={e => { e.target.src = PLACEHOLDER; }} />
                          : <div className="course-card-thumb-placeholder">
                              <i className="fas fa-book-open"></i>
                            </div>
                        }
                        {mag.featured && <span className="course-badge-featured">Featured</span>}
                        <span className={`course-badge-level badge ${isPaid ? 'bg-warning text-dark' : 'bg-success'}`}>
                          {isPaid ? `PAID ₹${mag.price}` : 'FREE'}
                        </span>
                      </div>

                      <div className="course-card-body">
                        <h5 className="course-card-title">{mag.title}</h5>
                        {mag.description && (
                          <p className="course-card-desc">{mag.description}</p>
                        )}
                        <div className="course-card-meta">
                          {mag.issueNumber && (
                            <span><i className="fas fa-hashtag me-1"></i>{mag.issueNumber}</span>
                          )}
                          {mag.category && (
                            <span><i className="fas fa-tag me-1"></i>{mag.category}</span>
                          )}
                          {mag.publishedDate && (
                            <span><i className="fas fa-calendar me-1"></i>{formatDate(mag.publishedDate)}</span>
                          )}
                          {mag.downloadCount > 0 && (
                            <span><i className="fas fa-download me-1"></i>{mag.downloadCount} downloads</span>
                          )}
                        </div>
                      </div>

                      <div className="course-card-footer">
                        <div className="course-card-price">
                          {isPaid
                            ? <span className="course-price-current">₹{mag.price?.toLocaleString('en-IN')}</span>
                            : <span className="course-price-free">Free</span>
                          }
                        </div>
                        <div className="d-flex flex-column align-items-end gap-2">
                          {hasPreview && (
                            <button
                              className="btn btn-sm btn-outline-secondary px-3"
                              style={{ fontSize: '0.78rem' }}
                              onClick={() => handlePreview(mag)}
                            >
                              <i className="fas fa-eye me-1" style={{ color: 'var(--gold)' }}></i>
                              Preview
                            </button>
                          )}
                          {isPaid ? (
                            hasPurchased ? (
                              <button className="btn btn-gold btn-sm px-4" onClick={() => handleDownload(mag)}>
                                <i className="fas fa-download me-1"></i>Download
                              </button>
                            ) : pendingPurchases[mag._id] ? (
                              <button className="btn btn-sm btn-warning text-dark px-3" disabled style={{ fontSize: '0.78rem' }}>
                                <i className="fas fa-clock me-1"></i>Pending Verification
                              </button>
                            ) : (
                              <button className="btn btn-gold btn-sm px-4" onClick={() => handlePurchase(mag)}>
                                <i className="fas fa-lock-open me-1"></i>Purchase
                              </button>
                            )
                          ) : (
                            mag.allowDownload && mag.pdfFile ? (
                              <button className="btn btn-gold btn-sm px-4" onClick={() => handleDownload(mag)}>
                                <i className="fas fa-download me-1"></i>Download Free
                              </button>
                            ) : null
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="d-flex justify-content-center align-items-center gap-2 mt-5">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(p => (
                  <button
                    key={p}
                    className={`btn btn-sm ${page === p ? 'btn-gold' : 'btn-outline-secondary'}`}
                    onClick={() => setPage(p)}
                    style={{ minWidth: 36 }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {purchasing && (
        <PurchaseModal
          magazine={purchasing}
          authHeader={authHeader}
          onClose={() => setPurchasing(null)}
          onSuccess={(id, status) => {
            if (status === 'pending') setPendingPurchases(prev => ({ ...prev, [id]: true }));
            else setPurchases(prev => ({ ...prev, [id]: true }));
            setPurchasing(null);
          }}
        />
      )}
    </section>
  );
}
