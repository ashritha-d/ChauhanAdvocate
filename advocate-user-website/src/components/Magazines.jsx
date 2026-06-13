import { useEffect, useState, useCallback } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import { useSite } from '../context/SiteContext';
import {
  getMagazines, checkMagazinePurchase,
  createMagazineRazorpayOrder, verifyMagazineRazorpayPayment,
  downloadMagazineFull, downloadMagazinePreview,
} from '../api';
import { mediaUrl } from '../utils/helpers';
import AuthGateModal from './AuthGateModal';

const PLACEHOLDER = `${import.meta.env.BASE_URL}placeholder-lawyer.svg`;

function loadRazorpayScript() {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

function MagazineCard({ magazine, onPurchase, onPreview, onDownload, purchased }) {
  const isPaid = magazine.type === 'paid';
  const hasPreview = !!(magazine.previewPdf || (isPaid ? null : magazine.pdfFile));
  const hasPdf    = !!magazine.pdfFile;

  return (
    <div className="mag-card">
      <div className="mag-cover-wrap">
        <img
          src={magazine.coverImage ? mediaUrl(magazine.coverImage) : PLACEHOLDER}
          alt={magazine.title}
          className="mag-cover"
          onError={e => { e.target.src = PLACEHOLDER; }}
        />
        <span className={`mag-type-badge ${isPaid ? 'paid' : 'free'}`}>
          {isPaid ? `PAID ₹${magazine.price}` : 'FREE'}
        </span>
        {magazine.featured && (
          <span className="mag-featured-badge"><i className="fas fa-star"></i> Featured</span>
        )}
      </div>

      <div className="mag-info">
        {magazine.issueNumber && <div className="mag-issue">{magazine.issueNumber}</div>}
        <h4 className="mag-title">{magazine.title}</h4>
        {magazine.category && <div className="mag-category">{magazine.category}</div>}
        {magazine.description && <p className="mag-desc">{magazine.description}</p>}

        <div className="mag-actions">
          {hasPreview && (
            <button className="btn mag-btn-preview" onClick={() => onPreview(magazine)}>
              <i className="fas fa-eye me-1"></i>Preview
            </button>
          )}

          {isPaid ? (
            purchased ? (
              <button className="btn mag-btn-download" onClick={() => onDownload(magazine)}>
                <i className="fas fa-download me-1"></i>Download
              </button>
            ) : (
              <button className="btn mag-btn-buy" onClick={() => onPurchase(magazine)}>
                <i className="fas fa-lock me-1"></i>
                {magazine.purchaseButtonText || 'Purchase Now'}
              </button>
            )
          ) : (
            magazine.allowDownload && hasPdf && (
              <button className="btn mag-btn-download" onClick={() => onDownload(magazine)}>
                <i className="fas fa-download me-1"></i>Download Free
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function PurchaseModal({ magazine, onClose, onSuccess, authHeader, user }) {
  const { settings: s } = useSite();
  const [step, setStep]         = useState('confirm'); // confirm | processing | success | error
  const [errMsg, setErrMsg]     = useState('');

  const handleRazorpay = async () => {
    setStep('processing');
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) { setErrMsg('Razorpay SDK failed to load. Check your internet connection.'); setStep('error'); return; }

      const r = await createMagazineRazorpayOrder(magazine._id, authHeader());
      if (!r.data.success) { setErrMsg(r.data.message || 'Failed to create order.'); setStep('error'); return; }

      const { order_id, key_id, amount, payment_db_id, prefill } = r.data;

      const options = {
        key:      key_id,
        amount,
        currency: 'INR',
        name:     'Chauhan Advocate',
        description: `Purchase: ${magazine.title}`,
        order_id,
        prefill,
        theme: { color: '#c9a84c' },
        handler: async (response) => {
          try {
            const vr = await verifyMagazineRazorpayPayment(
              magazine._id,
              {
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                payment_db_id,
              },
              authHeader()
            );
            if (vr.data.success) { setStep('success'); onSuccess(magazine._id); }
            else { setErrMsg(vr.data.message || 'Verification failed.'); setStep('error'); }
          } catch (e) { setErrMsg(e.response?.data?.message || 'Verification error.'); setStep('error'); }
        },
        modal: {
          ondismiss: () => { if (step === 'processing') setStep('confirm'); },
        },
      };
      new window.Razorpay(options).open();
    } catch (e) {
      setErrMsg(e.response?.data?.message || 'Payment failed. Please try again.');
      setStep('error');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="mag-purchase-modal" onClick={e => e.stopPropagation()}>
        <button className="jr-modal-close" onClick={onClose}>&times;</button>

        {step === 'success' ? (
          <div className="form-success-screen py-3">
            <div className="form-success-icon"><i className="fas fa-check-circle"></i></div>
            <h5 className="form-success-title">Purchase Successful!</h5>
            <p className="form-success-msg">
              You can now download <strong>{magazine.title}</strong>. Find it in My Profile → My Magazines.
            </p>
            <button className="btn btn-gold mt-3 px-5" onClick={onClose}>
              <i className="fas fa-download me-2"></i>Close & Download
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
            <h5 className="mb-1" style={{ fontFamily: "'Playfair Display',serif" }}>
              <i className="fas fa-book-open text-gold me-2"></i>Purchase Magazine
            </h5>
            <p className="text-muted small mb-3">Secure payment via Razorpay</p>

            <div className="mag-purchase-info">
              {magazine.coverImage && (
                <img src={mediaUrl(magazine.coverImage)} alt={magazine.title} className="mag-purchase-thumb" onError={e => { e.target.style.display = 'none'; }} />
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
                <button className="btn btn-gold flex-grow-1" onClick={handleRazorpay}>
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

export default function Magazines() {
  const { user, authHeader } = useUserAuth();
  const [items, setItems]       = useState([]);
  const [filter, setFilter]     = useState('all');
  const [loading, setLoading]   = useState(true);
  const [purchases, setPurchases] = useState({}); // magazineId → true
  const [purchasing, setPurchasing] = useState(null); // magazine being purchased
  const [authGate, setAuthGate]   = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const loadMagazines = useCallback(async (type = 'all') => {
    setLoading(true);
    try {
      const params = type !== 'all' ? { type } : {};
      const r = await getMagazines(params);
      if (r.data.success) setItems(r.data.data || []);
    } catch {}
    setLoading(false);
  }, []);

  const loadPurchaseStatuses = useCallback(async (mags) => {
    if (!user || !mags.length) return;
    const paidMags = mags.filter(m => m.type === 'paid');
    if (!paidMags.length) return;
    const results = await Promise.allSettled(
      paidMags.map(m => checkMagazinePurchase(m._id, authHeader()))
    );
    const map = {};
    results.forEach((res, i) => {
      if (res.status === 'fulfilled' && res.value.data.purchased) {
        map[paidMags[i]._id] = true;
      }
    });
    setPurchases(map);
  }, [user]);

  useEffect(() => { loadMagazines(filter); }, [filter]);

  useEffect(() => {
    if (items.length && user) loadPurchaseStatuses(items);
  }, [items, user]);

  const handlePurchase = (magazine) => {
    if (!user) { setPendingAction({ type: 'purchase', magazine }); setAuthGate(true); return; }
    setPurchasing(magazine);
  };

  const handlePreview = async (magazine) => {
    try {
      const r = await downloadMagazinePreview(magazine._id);
      if (r.data.success && r.data.url) {
        const url = r.data.url.startsWith('http') ? r.data.url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://chauhanadvocate.onrender.com'}${r.data.url}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Preview not available.');
    }
  };

  const handleDownload = async (magazine) => {
    if (!user) { setPendingAction({ type: 'download', magazine }); setAuthGate(true); return; }
    try {
      const r = await downloadMagazineFull(magazine._id, authHeader());
      if (r.data.success && r.data.url) {
        const url = r.data.url.startsWith('http') ? r.data.url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://chauhanadvocate.onrender.com'}${r.data.url}`;
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.click();
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Download not available. Please try again.');
    }
  };

  const handlePurchaseSuccess = (magazineId) => {
    setPurchases(p => ({ ...p, [magazineId]: true }));
  };

  const displayed = items;

  return (
    <section id="magazines" className="magazines-section">
      <div className="container">
        <div className="section-label">Publications</div>
        <h2 className="section-title">Legal <span className="text-gold">Magazines</span></h2>
        <p className="section-desc">Browse and download our curated legal publications</p>

        {/* Filter Tabs */}
        <div className="mag-filter-tabs">
          {['all', 'free', 'paid'].map(f => (
            <button
              key={f}
              className={`mag-filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all'  ? 'All Magazines' :
               f === 'free' ? <><i className="fas fa-unlock me-1"></i>Free</> :
                              <><i className="fas fa-lock me-1"></i>Paid</>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--gold)' }}></div>
          </div>
        ) : displayed.length === 0 ? (
          <div className="mag-empty">
            <i className="fas fa-book-open"></i>
            <p>No {filter !== 'all' ? filter : ''} magazines available yet.</p>
          </div>
        ) : (
          <div className="mag-grid">
            {displayed.map(m => (
              <MagazineCard
                key={m._id}
                magazine={m}
                purchased={!!purchases[m._id]}
                onPurchase={handlePurchase}
                onPreview={handlePreview}
                onDownload={handleDownload}
              />
            ))}
          </div>
        )}
      </div>

      {purchasing && (
        <PurchaseModal
          magazine={purchasing}
          authHeader={authHeader}
          user={user}
          onClose={() => setPurchasing(null)}
          onSuccess={handlePurchaseSuccess}
        />
      )}

      {authGate && (
        <AuthGateModal
          action={pendingAction?.type === 'purchase' ? `Purchase "${pendingAction?.magazine?.title}"` : `Download "${pendingAction?.magazine?.title}"`}
          redirectTo="/#magazines"
          onClose={() => { setAuthGate(false); setPendingAction(null); }}
        />
      )}
    </section>
  );
}
