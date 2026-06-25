import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import { useUserAuth } from '../context/UserAuthContext';
import { savePendingAction } from '../utils/pendingAction';
import {
  getMagazines, checkMagazinePurchase,
  createMagazineRazorpayOrder, verifyMagazineRazorpayPayment,
  downloadMagazineFull, downloadMagazinePreview,
} from '../api';
import { mediaUrl } from '../utils/helpers';

const PLACEHOLDER = `${import.meta.env.BASE_URL}placeholder-lawyer.svg`;
const PER_PAGE = 9;

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

function PurchaseModal({ magazine, onClose, onSuccess, authHeader }) {
  const [step, setStep] = useState('confirm');
  const [errMsg, setErrMsg] = useState('');

  const handlePay = async () => {
    setStep('processing');
    try {
      const loaded = await loadRazorpay();
      if (!loaded) { setErrMsg('Razorpay failed to load. Check your internet connection.'); setStep('error'); return; }

      const r = await createMagazineRazorpayOrder(magazine._id, authHeader());
      if (!r.data.success) { setErrMsg(r.data.message || 'Order creation failed.'); setStep('error'); return; }

      const { order_id, key_id, amount, payment_db_id, prefill } = r.data;
      new window.Razorpay({
        key: key_id, amount, currency: 'INR',
        name: 'Chauhan Advocate',
        description: `Purchase: ${magazine.title}`,
        order_id, prefill,
        theme: { color: '#c9a84c' },
        handler: async (response) => {
          try {
            const vr = await verifyMagazineRazorpayPayment(magazine._id, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              payment_db_id,
            }, authHeader());
            if (vr.data.success) { setStep('success'); onSuccess(magazine._id); }
            else { setErrMsg(vr.data.message || 'Verification failed.'); setStep('error'); }
          } catch (e) { setErrMsg(e.response?.data?.message || 'Verification error.'); setStep('error'); }
        },
        modal: { ondismiss: () => setStep(s => s === 'processing' ? 'confirm' : s) },
      }).open();
    } catch (e) {
      setErrMsg(e.response?.data?.message || 'Payment failed. Please try again.');
      setStep('error');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="course-enroll-modal" onClick={e => e.stopPropagation()}>
        <button className="jr-modal-close" onClick={onClose}>&times;</button>

        {step === 'success' ? (
          <div className="form-success-screen py-3">
            <div className="form-success-icon"><i className="fas fa-check-circle"></i></div>
            <h5 className="form-success-title">Purchase Successful!</h5>
            <p className="form-success-msg">
              You can now download <strong>{magazine.title}</strong>. Find it in My Profile → My Magazines.
            </p>
            <button className="btn btn-gold mt-3 px-5" onClick={onClose}>
              <i className="fas fa-download me-2"></i>Close
            </button>
          </div>
        ) : step === 'error' ? (
          <div className="text-center py-3">
            <div style={{ fontSize: '3rem', color: '#dc3545' }}><i className="fas fa-times-circle"></i></div>
            <h5 className="mt-3">Payment Failed</h5>
            <p className="text-muted">{errMsg}</p>
            <div className="d-flex gap-2 justify-content-center mt-3">
              <button className="btn btn-gold px-4" onClick={() => { setStep('confirm'); setErrMsg(''); }}>Try Again</button>
              <button className="btn btn-outline-secondary px-4" onClick={onClose}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <h5 className="mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              <i className="fas fa-book-open text-gold me-2"></i>Purchase Magazine
            </h5>
            <p className="text-muted small mb-3">Secure payment via Razorpay</p>

            <div className="mag-purchase-info">
              {magazine.coverImage && (
                <img src={mediaUrl(magazine.coverImage)} alt={magazine.title}
                  className="mag-purchase-thumb" onError={e => { e.target.style.display = 'none'; }} />
              )}
              <div>
                <div className="fw-semibold">{magazine.title}</div>
                {magazine.issueNumber && <div className="text-muted small">{magazine.issueNumber}</div>}
                <div className="mag-purchase-price">₹{magazine.price}</div>
              </div>
            </div>

            {step === 'processing' ? (
              <div className="text-center py-3">
                <div className="spinner-border text-warning mb-2"></div>
                <div className="text-muted small">Opening payment window…</div>
              </div>
            ) : (
              <div className="d-flex gap-2 mt-4">
                <button className="btn btn-gold flex-grow-1" onClick={handlePay}>
                  <i className="fas fa-credit-card me-2"></i>Pay ₹{magazine.price} with Razorpay
                </button>
                <button className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
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
        const map = {};
        results.forEach((res, i) => {
          if (res.status === 'fulfilled' && res.value.data.purchased) map[paidMags[i]._id] = true;
        });
        setPurchases(map);
      });
  }, [magazines, user]);

  const handlePurchase = (mag) => {
    if (!user) { savePendingAction('magazines'); navigate('/login'); return; }
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
    <section id="magazines" className="section-padding bg-light">
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
          onSuccess={id => setPurchases(prev => ({ ...prev, [id]: true }))}
        />
      )}
    </section>
  );
}
