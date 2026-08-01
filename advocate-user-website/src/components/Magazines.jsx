import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { useSite } from '../context/SiteContext';
import {
  getMagazines, checkMagazinePurchase,
  submitMagazineManualPayment,
  downloadMagazineFull, downloadMagazinePreview,
} from '../api';
import { mediaUrl } from '../utils/helpers';
import AuthGateModal from './AuthGateModal';

const PLACEHOLDER = `${import.meta.env.BASE_URL}placeholder-lawyer.svg`;


function MagazineCard({ magazine, onPurchase, onPreview, onDownload, purchased }) {
  const isPaid = magazine.type === 'paid';
  const hasPreview = !!(magazine.previewPdf || (isPaid ? null : magazine.pdfFile));
  const hasPdf    = !!magazine.pdfFile;

  return (
    <div className="mag-card">
      <div className="mag-cover-wrap">
        <img
          src={magazine.coverImage ? mediaUrl(magazine.coverImage, { width: 400 }) : PLACEHOLDER}
          alt={magazine.title}
          className="mag-cover"
          loading="lazy"
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
  const [step, setStep]       = useState('confirm'); // confirm | success | error
  const [utr, setUtr]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg]   = useState('');

  const handleManualSubmit = async () => {
    if (!utr.trim()) { setErrMsg('Please enter your UTR / Transaction Reference Number.'); return; }
    setSubmitting(true); setErrMsg('');
    try {
      const fd = new FormData();
      fd.append('utrNumber', utr.trim());
      fd.append('paymentMethod', 'upi_id');
      const r = await submitMagazineManualPayment(magazine._id, fd, authHeader());
      if (r.data.success) { setStep('success'); }
      else { setErrMsg(r.data.message || 'Submission failed. Please try again.'); }
    } catch (e) {
      setErrMsg(e.response?.data?.message || 'Network error. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="mag-purchase-modal" onClick={e => e.stopPropagation()}>
        <button className="jr-modal-close" onClick={onClose}>&times;</button>

        {step === 'success' ? (
          <div className="form-success-screen py-3">
            <div className="form-success-icon"><i className="fas fa-check-circle"></i></div>
            <h5 className="form-success-title">Payment Submitted!</h5>
            <p className="form-success-msg">
              Your payment for <strong>{magazine.title}</strong> is under review. We will unlock it within a few hours after verification.
            </p>
            <button className="btn btn-gold mt-3 px-5" onClick={onClose}>
              <i className="fas fa-times me-2"></i>Close
            </button>
          </div>
        ) : (
          <>
            <h5 className="mb-1" style={{ fontFamily: "'Playfair Display',serif" }}>
              <i className="fas fa-book-open text-gold me-2"></i>Purchase Magazine
            </h5>
            <p className="text-muted small mb-3">Pay via UPI and submit your transaction ID below</p>

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

            {s?.payment_upi_id && (
              <div style={{ background: '#f9f5e8', border: '1.5px dashed #C9A84C', borderRadius: 10, padding: '10px 14px', margin: '12px 0' }}>
                <div className="small text-muted mb-1"><i className="fas fa-mobile-alt me-1" style={{ color: '#C9A84C' }}></i>Pay to UPI ID</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem' }}>{s.payment_upi_id}</div>
              </div>
            )}

            <div className="mb-3">
              <label className="form-label small fw-semibold">UTR / Transaction Reference Number <span className="text-danger">*</span></label>
              <input
                className="form-control"
                value={utr}
                onChange={e => { setUtr(e.target.value); setErrMsg(''); }}
                placeholder="Enter UTR number after payment"
                style={{ borderRadius: 8 }}
              />
            </div>

            {errMsg && <div className="alert alert-danger py-2 small">{errMsg}</div>}

            <div className="d-flex gap-2 mt-2">
              <button className="btn btn-gold flex-grow-1" onClick={handleManualSubmit} disabled={submitting}>
                {submitting ? <><i className="fas fa-spinner fa-spin me-2"></i>Submitting…</> : <><i className="fas fa-paper-plane me-2"></i>Submit Payment</>}
              </button>
              <button className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
            </div>
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

        <div className="text-center mt-5">
          <Link to="/magazines" className="btn btn-gold px-5">
            <i className="fas fa-book-open me-2"></i>Browse All Magazines
          </Link>
        </div>
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
